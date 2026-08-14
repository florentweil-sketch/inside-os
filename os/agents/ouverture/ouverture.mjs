// os/agents/ouverture/ouverture.mjs
//
// Logique principale de l'Agent Ouverture — le brief du matin.
// Réutilise le socle de lecture/scoring de l'Agent Synthèse
// (os/agents/synthese/sources.mjs — lecture paginée des 3 datasources,
// describePage/formatStatusDate typés) et le helper "présent" promu depuis
// Pilotage (isPresentItem/isRecentItem, B09-T41).
//
// Différence structurelle avec Synthèse/Pilotage : PAS de sujet, donc PAS de
// scoring par tokens (tokenize/scoreItem non utilisés ici). La sélection est
// entièrement déterministe, sur quatre critères indépendants :
//   1. tous les items "présents" (bucket B99 / source_dump_id ou id_dump
//      préfixé B99-), triés par récence
//   2. décisions/leçons créées dans les RECENT_DAYS derniers jours
//   3. décisions status=proposed (hypothèses en attente d'arbitrage),
//      plafonnées à PROPOSED_LIMIT — 557 proposed au total mesurées le
//      2026-08-11, un brief du matin reste actionnable, pas un audit
//      historique de toute hypothèse jamais posée. Les plus récentes d'abord.
//   4. canal "essentiel" (B09-T41, réouverture ciblée) : décisions
//      impact=critical (puis major) des buckets métier B02/B03/B05/B06/B07,
//      statut validated ou proposed, SANS filtre de récence — seul canal qui
//      fait remonter des décisions structurantes anciennes jamais revisitées
//      (ex. organigramme B02-T01). Plafonné à ESSENTIAL_LIMIT, critical
//      d'abord. Items sans bucket ("bucket=null") exclus et comptés à part
//      (inclassables, jamais silencieusement ignorés).
//
// Garde-fous (identiques à Synthèse/Pilotage) :
//   - lecture seule absolue (aucune écriture Notion, aucune modif repo)
//   - fail-loud : pas de fallback silencieux
//   - citations obligatoires (uid/id/source_dump_id, imposé par le prompt système)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { claudeFetch } from "../../lib/claude.mjs";
import { env } from "../../lib/config.mjs";
import { getPropText } from "../../lib/notion.mjs";
import {
  readDecisions,
  readLessons,
  readThreadDump,
  describePage,
  formatStatusDate,
  isPresentItem,
  isRecentItem,
  getMultiSelectNames,
} from "../synthese/sources.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin du prompt système. Si absent : THROW — fail-loud, jamais de fallback
// (même règle que Synthèse/Pilotage).
const PROMPT_PATH = path.resolve(
  __dirname,
  "../../../docs/prompts/ouverture/PROMPT_AGENT_OUVERTURE_v01.md"
);

function loadSystemPrompt() {
  if (!fs.existsSync(PROMPT_PATH)) {
    throw new Error(
      `Prompt système absent : ${PROMPT_PATH}. ` +
      `L'Agent Ouverture ne tourne pas sans son prompt système (doctrine fail-loud).`
    );
  }
  return fs.readFileSync(PROMPT_PATH, "utf8");
}

const RECENT_DAYS = 30;
const PROPOSED_LIMIT = 30;
const PRESENT_LIMIT = 40; // "en priorité les plus récents" — cap sur le pool présent, trié par date
const RECENT_LIMIT = 20;  // filet de sécurité, rarement atteint (corpus majoritairement ancien)
const MAX_CANDIDATES_TOTAL = 70; // cap final après fusion/dédup, borne le coût/latence de la lecture des blocs
const MAX_CONTENT_CHARS_PER_ITEM = 1200;

// Canal essentiel (B09-T41, réouverture ciblée) — voir commentaire d'en-tête.
// Places RÉSERVÉES (pas un remplissage par priorité) : avec 240 décisions
// critical qualifiantes pour 15 places, un classement fixe (peu importe le
// critère — récence ou ancienneté) viderait le groupe major en permanence
// (jamais de place restante) et montrerait CHAQUE MATIN le même palmarès —
// aucune rotation, aucune valeur de "brief du matin". Les deux groupes sont
// donc plafonnés indépendamment, et sélectionnés par rotation quotidienne
// déterministe (cf. rotateByDate) plutôt que par un tri fixe.
const ESSENTIAL_CRITICAL_SLOTS = 10;
const ESSENTIAL_MAJOR_SLOTS = 5;
const ESSENTIAL_BUCKETS = ["B02", "B03", "B05", "B06", "B07"];

// Hash déterministe (FNV-1a, 32 bits) — aucune dépendance externe. Stable
// pour une paire (date, uid) donnée, change de façon non triviale d'un jour
// à l'autre : sert de clé de tri pour la rotation, pas pour la sécurité.
function stableHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Trie un pool par hash(date_du_jour + uid) — l'ordre change chaque jour
// (todayDate différent) sans dépendre de la date de création de l'item, donc
// même les décisions les plus anciennes ont une chance de sortir un jour
// donné. Déterministe : même date + même pool = même ordre (reproductible,
// pas aléatoire — testable).
function rotateByDate(pages, todayDate) {
  return [...pages].sort((a, b) => {
    const uidA = getPropText(a, "uid") || a.id;
    const uidB = getPropText(b, "uid") || b.id;
    return stableHash(`${todayDate}:${uidA}`) - stableHash(`${todayDate}:${uidB}`);
  });
}

// Décisions impact=critical/major des buckets métier, statut validated ou
// proposed, sans filtre de récence — seul canal du fichier qui ignore
// délibérément l'âge de l'item. Sans lui, une décision structurante ancienne
// (organigramme, gouvernance...) jamais retouchée depuis n'apparaît dans
// AUCUN des 3 autres canaux (ni présent B99, ni récente 30j, ni proposed —
// elle est déjà validated) : elle reste invisible à Ouverture indéfiniment.
// bucket=null (aucun tag du tout) = inclassable, exclu du canal et compté
// séparément — jamais silencieusement absorbé ni dans un sens ni dans l'autre.
//
// Effet recherché (au-delà d'un simple tirage) : combiné à `npm run
// os:statut` (superseded/archived), le stock de ~700 décisions qualifiantes
// se cure progressivement à l'usage — le brief devient lui-même l'outil de
// curation, plutôt qu'un audit figé qui répète le même palmarès chaque matin.
function gatherEssential(decisions, todayDate) {
  let bucketlessIgnored = 0;

  const qualifying = decisions.filter((p) => {
    const impact = getPropText(p, "impact");
    if (impact !== "critical" && impact !== "major") return false;

    const status = getPropText(p, "decision_status");
    if (status !== "validated" && status !== "proposed") return false;

    const bucket = getMultiSelectNames(p, "bucket");
    if (bucket.length === 0) {
      bucketlessIgnored++;
      return false;
    }
    return bucket.some((b) => ESSENTIAL_BUCKETS.includes(b));
  });

  const criticalPool = qualifying.filter((p) => getPropText(p, "impact") === "critical");
  const majorPool = qualifying.filter((p) => getPropText(p, "impact") === "major");

  const critical = rotateByDate(criticalPool, todayDate).slice(0, ESSENTIAL_CRITICAL_SLOTS);
  const major = rotateByDate(majorPool, todayDate).slice(0, ESSENTIAL_MAJOR_SLOTS);

  return { essential: [...critical, ...major], bucketlessIgnored };
}

// Fix priorisation (B09-T41) : les items dont le source_dump_id (decision/
// lesson) ou l'id_dump (thread_dump lui-même) commence par B09- restent dans
// le pool — visibles, jamais exclus — mais plafonnés à INSIDE_OS_CAP, les
// plus récents d'abord. Constaté sans ce plafond : 13/20 tâches du brief
// venaient de vieux items de dev INSIDE OS (B09-T34/36/37/38, curés
// bucket=B99 historiquement), au détriment des familles business. Le
// plafond est appliqué en CODE (pas laissé au jugement du LLM) — le LLM ne
// voit jamais plus de INSIDE_OS_CAP candidats B09, il ne peut donc pas en
// inclure plus même s'il le voulait.
const INSIDE_OS_CAP = 3;

// Origine B09 = source_dump_id (ou id_dump pour une page thread_dump)
// préfixé "B09-". Indépendant du bucket métier de l'item — un item B09
// peut très bien porter bucket=B99 (curation "présent") sans que ça change
// son origine.
function isB09Sourced(page) {
  const id = String(
    getPropText(page, "source_dump_id") || getPropText(page, "id_dump") || ""
  ).toUpperCase();
  return id.startsWith("B09-");
}

// Fix anti-monopole (B09-T41). Deux approches essayées :
//   1. Pré-filtrer les PAGES par source_dump_id avant envoi au LLM (comme
//      INSIDE_OS_CAP) — ABANDONNÉ : les items d'un même dump business sont
//      créés en batch, à quelques millisecondes d'écart, donc "les plus
//      récents" est un tri quasi arbitraire à ce niveau de granularité —
//      constaté en pratique : a fait disparaître la tâche "transfert Inside
//      Archi" (item réellement le plus actionnable, éliminé par hasard de
//      timing) et vidé Commercial (B05) une deuxième fois.
//   2. RETENUE : le LLM garde la vue complète sur tous les candidats d'une
//      source (son jugement choisit les meilleurs) — le plafond est
//      appliqué APRÈS coup, en POST-TRAITANT sa réponse texte. Garantit la
//      limite en code sans sacrifier la qualité de sélection du LLM.
const SOURCE_DUMP_CAP = 3;

// Extrait la clé de regroupement d'une ligne de tâche "- [ ] ... — <source>".
// Privilégie un id_dump (B\d{2}-T\d{2}) s'il apparaît dans la source citée ;
// sinon utilise la source telle quelle (uid/id de page).
function extractSourceKey(taskLine) {
  const dashIdx = taskLine.lastIndexOf("—");
  if (dashIdx === -1) return null;
  const tail = taskLine.slice(dashIdx + 1).trim();
  if (!tail) return null;
  const m = tail.match(/\bB\d{2}-T\d{2}\b/i);
  return (m ? m[0] : tail).toUpperCase();
}

// Plafonne le nombre de tâches par source dans la réponse du LLM (markdown
// strict : titres "## ...", tâches "- [ ] ..."). Retire les tâches en trop
// (garde les `cap` premières rencontrées par source, dans l'ordre où le LLM
// les a écrites), puis supprime les sections de famille devenues vides.
function enforceSourceDumpCap(markdown, cap) {
  const lines = String(markdown || "").split("\n");
  const counts = new Map();
  const kept = [];

  for (const line of lines) {
    const isTask = line.trim().startsWith("- [ ]");
    if (!isTask) {
      kept.push(line);
      continue;
    }
    const key = extractSourceKey(line);
    const n = key ? (counts.get(key) || 0) : 0;
    if (key && n >= cap) continue; // au-delà du plafond pour cette source — retirée
    if (key) counts.set(key, n + 1);
    kept.push(line);
  }

  return removeEmptyFamilySections(kept.join("\n"));
}

// Retire un titre "## Famille" si aucune ligne "- [ ] " ne le suit avant le
// prochain titre (ou la fin du document) — sécurité après enforceSourceDumpCap,
// qui peut vider une famille dont toutes les tâches partageaient une même
// source déjà représentée ailleurs.
function removeEmptyFamilySections(text) {
  const lines = text.split("\n");
  const preamble = [];
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { header: line, body: [] };
    } else if (current) {
      current.body.push(line);
    } else {
      preamble.push(line);
    }
  }
  if (current) sections.push(current);

  const nonEmpty = sections.filter((s) => s.body.some((l) => l.trim().startsWith("- [ ]")));

  const out = [...preamble];
  for (const s of nonEmpty) out.push(s.header, ...s.body);

  return out.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "\n");
}

function truncate(text, max) {
  if (!text) return "";
  const s = String(text);
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n[…tronqué — ${s.length - max} caractères omis]`;
}

function byCreatedTimeDesc(a, b) {
  const ta = a.created_time ? new Date(a.created_time).getTime() : 0;
  const tb = b.created_time ? new Date(b.created_time).getTime() : 0;
  return tb - ta;
}

function dedupePages(pages) {
  return Array.from(new Map(pages.map((p) => [p.id, p])).values());
}

// Rassemble le pool de candidats selon les 3 critères. Déterministe, aucun
// appel LLM ici — la synthèse/formatage en tâches est le rôle du LLM ensuite.
function gatherCandidates({ decisions, lessons, threadDump, todayDate }) {
  const decisionsAndLessons = [...decisions, ...lessons];

  const present = decisionsAndLessons
    .filter(isPresentItem)
    .sort(byCreatedTimeDesc)
    .slice(0, PRESENT_LIMIT);

  const recent = decisionsAndLessons
    .filter((p) => isRecentItem(p, RECENT_DAYS))
    .sort(byCreatedTimeDesc)
    .slice(0, RECENT_LIMIT);

  const proposed = decisions
    .filter((p) => getPropText(p, "decision_status") === "proposed")
    .sort(byCreatedTimeDesc)
    .slice(0, PROPOSED_LIMIT);

  const presentThreadDump = threadDump
    .filter(isPresentItem)
    .sort(byCreatedTimeDesc);

  const { essential, bucketlessIgnored } = gatherEssential(decisions, todayDate);
  console.error(`[ouverture] ${bucketlessIgnored} items essentiels ignorés faute de bucket`);
  for (const p of essential) p._fromEssential = true; // pour le marqueur "(à vérifier — ancien)" au rendu

  // Pas de plafond anti-monopole ici (cf. commentaire sur SOURCE_DUMP_CAP) —
  // le LLM garde la vue complète, le plafond est appliqué après coup sur sa
  // réponse (enforceSourceDumpCap, dans runOuverture).
  const regular = dedupePages([...present, ...recent, ...proposed, ...presentThreadDump])
    .sort(byCreatedTimeDesc)
    .slice(0, MAX_CANDIDATES_TOTAL);

  // Le canal essentiel s'ajoute APRÈS le cap général MAX_CANDIDATES_TOTAL,
  // pas avant : ses items visent précisément l'ancien (aucun filtre de
  // récence) — un tri par récence sur l'ensemble fusionné les éliminerait
  // avant même d'atteindre le LLM, ce qui viderait le canal de son sens.
  const merged = dedupePages([...regular, ...essential]);

  // Split business / INSIDE OS — le plafond B09 s'applique ICI, sur le pool
  // fusionné complet, pas seulement sur ce qui a survécu au cap général
  // MAX_CANDIDATES_TOTAL (sinon un item B09 très récent pourrait quand même
  // écraser un item business plus ancien dans le cap général avant même
  // d'atteindre le split).
  const insideOs = merged
    .filter(isB09Sourced)
    .sort(byCreatedTimeDesc)
    .slice(0, INSIDE_OS_CAP);
  const business = merged.filter((p) => !isB09Sourced(p));

  return {
    business,
    insideOs,
    counts: {
      present: present.length,
      recent: recent.length,
      proposed: proposed.length,
      threadDump: presentThreadDump.length,
      essential: essential.length,
      essentialBucketlessIgnored: bucketlessIgnored,
      insideOsTotal: merged.filter(isB09Sourced).length,
      insideOsKept: insideOs.length,
    },
  };
}

function renderCandidateBlock(page) {
  const d = describePage(page);
  const tag = formatStatusDate(d.status, d.createdTime);
  const bucket = (page.properties?.bucket?.multi_select || []).map((x) => x.name);
  const type = page._itemType || "?";
  // Marqueur pré-calculé pour les items du canal essentiel non récents — le
  // canal ignore délibérément l'âge (impact/statut priment), donc contrairement
  // aux autres canaux ce n'est pas au LLM de déduire seul l'ancienneté depuis
  // la date du tag : elle est explicite ici, avant même qu'il ne rédige la tâche.
  const oldMarker = page._fromEssential && !isRecentItem(page, RECENT_DAYS) ? " (à vérifier — ancien)" : "";
  return [
    `--- ${tag}${oldMarker} [type: ${type}] [bucket: ${bucket.join(",") || "(absent)"}] ${d.title}`,
    `uid/id : ${d.id} | source_dump_id : ${d.source_dump_id || "(absent)"}`,
    `Aperçu : ${truncate(d.content_hint, 500)}`,
    "",
  ].join("\n");
}

function buildUserMessage({ todayDate, business, insideOs, sourcesInterrogees, counts }) {
  const lines = [];
  lines.push(`DATE DU JOUR (à utiliser telle quelle dans le titre "# OUVERTURE — <date>") : ${todayDate}`);
  lines.push("");
  lines.push(`SOURCES INTERROGÉES : ${sourcesInterrogees.join(", ")}`);
  lines.push(
    `CANDIDATS RASSEMBLÉS : présents=${counts.present} | récents(${RECENT_DAYS}j)=${counts.recent} | ` +
    `proposed=${counts.proposed} | thread_dump présents=${counts.threadDump} | ` +
    `essentiels(critical/major)=${counts.essential} | ` +
    `origine B09=${counts.insideOsTotal} (plafonné à ${counts.insideOsKept} ci-dessous)`
  );
  lines.push("");

  if (business.length === 0 && insideOs.length === 0) {
    lines.push("AUCUN candidat trouvé (aucun item présent/récent/proposed).");
    lines.push("Produis uniquement le titre, sans section — nomme l'absence, ne comble pas.");
  } else {
    lines.push(
      `CANDIDATS BUSINESS (${business.length} — Chantiers/Juridique/Holding/Commercial/Autre, PRIORITAIRES ` +
      `sur le cap de 20 : jusqu'à ${20 - INSIDE_OS_CAP} tâches business avant les ${INSIDE_OS_CAP} INSIDE OS) :`
    );
    lines.push("");
    for (const page of business) lines.push(renderCandidateBlock(page));

    lines.push(
      `CANDIDATS INSIDE OS (${insideOs.length} — origine B09, déjà plafonnés en amont, ` +
      `les plus récents. Maximum ${INSIDE_OS_CAP} tâches issues de ce bloc, jamais plus même si tu en vois moins de ${INSIDE_OS_CAP}) :`
    );
    lines.push("");
    for (const page of insideOs) lines.push(renderCandidateBlock(page));
  }

  lines.push("");
  lines.push("Réponds STRICTEMENT au format défini dans ton prompt système (familles par bucket réel,");
  lines.push(`cases à cocher, une ligne par tâche, source citée. Cap global 20 tâches : familles business`);
  lines.push(`d'abord (jusqu'à ${20 - INSIDE_OS_CAP}), section INSIDE OS (B09) en dernier, maximum ${INSIDE_OS_CAP} tâches.`);

  const msg = lines.join("\n");
  console.error(`[ouverture] taille message LLM : ${msg.length} caractères (~${Math.round(msg.length * 0.3)} tokens estimés)`);
  return msg;
}

export async function runOuverture({ runDate } = {}) {
  const effectiveRunDate = runDate || new Date().toISOString();
  const todayDate = effectiveRunDate.slice(0, 10);

  const systemPrompt = loadSystemPrompt();
  const errors = [];
  const sourcesInterrogees = [];

  let decisions = [], lessons = [], threadDump = [];

  try {
    console.error(`[ouverture] lecture DECISIONS_DS…`);
    decisions = await readDecisions();
    sourcesInterrogees.push(`decisions_structural (${decisions.length} pages)`);
  } catch (e) {
    errors.push(`DECISIONS : ${e.message}`);
  }

  try {
    console.error(`[ouverture] lecture LESSONS_DS…`);
    lessons = await readLessons();
    sourcesInterrogees.push(`lessons_learnings (${lessons.length} pages)`);
  } catch (e) {
    errors.push(`LESSONS : ${e.message}`);
  }

  try {
    console.error(`[ouverture] lecture THREAD_DUMP_DS…`);
    threadDump = await readThreadDump();
    sourcesInterrogees.push(`thread_dump (${threadDump.length} pages)`);
  } catch (e) {
    errors.push(`THREAD_DUMP : ${e.message}`);
  }

  const { business, insideOs, counts } = gatherCandidates({ decisions, lessons, threadDump, todayDate });
  console.error(
    `[ouverture] candidats : présents=${counts.present} récents=${counts.recent} ` +
    `proposed=${counts.proposed} thread_dump=${counts.threadDump} essentiels=${counts.essential} ` +
    `-> business=${business.length} | INSIDE OS=${counts.insideOsKept}/${counts.insideOsTotal} (plafond=${INSIDE_OS_CAP})`
  );

  // Pas de lecture des blocs (readPageContent) ici, contrairement à Synthèse/
  // Pilotage : sur ~70 candidats ce serait ~70 appels Notion supplémentaires
  // pour un gain marginal — content_hint (rationale+evidence / what_happened+
  // evidence, déjà substantiel dans cette mémoire) suffit à générer une tâche
  // d'une ligne. Compromis assumé, différent de Synthèse/Pilotage à dessein.
  const completude = errors.length ? "INDÉTERMINÉ" : "COMPLET";

  const userMessage = buildUserMessage({ todayDate, business, insideOs, sourcesInterrogees, counts });

  console.error(`[ouverture] appel LLM (CLAUDE_MODEL=${env("CLAUDE_MODEL")})…`);
  const rawResponse = await claudeFetch({
    model: env("CLAUDE_MODEL"),
    max_tokens: 2000, // liste de tâches, plus long que Pilotage mais borné (max 20 lignes)
    messages: [
      {
        role: "user",
        content: `${systemPrompt}\n\n---\n\n${userMessage}`,
      },
    ],
  });

  // Anti-monopole appliqué en post-traitement (cf. commentaire SOURCE_DUMP_CAP) :
  // garantit le plafond en code sans avoir amputé la vue du LLM en amont.
  const response = enforceSourceDumpCap(rawResponse, SOURCE_DUMP_CAP);
  if (response !== rawResponse) {
    console.error(`  [ouverture] anti-monopole : réponse ajustée (plafond ${SOURCE_DUMP_CAP}/source appliqué en post-traitement)`);
  }

  return {
    todayDate,
    sourcesInterrogees,
    completude,
    errors,
    candidatesCount: business.length + insideOs.length,
    counts,
    pagesLues: decisions.length + lessons.length + threadDump.length,
    response,
    runDate: effectiveRunDate,
  };
}
