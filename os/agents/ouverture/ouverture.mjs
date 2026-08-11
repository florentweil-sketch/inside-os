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
// entièrement déterministe, sur trois critères indépendants :
//   1. tous les items "présents" (bucket B99 / source_dump_id ou id_dump
//      préfixé B99-), triés par récence
//   2. décisions/leçons créées dans les RECENT_DAYS derniers jours
//   3. décisions status=proposed (hypothèses en attente d'arbitrage),
//      plafonnées à PROPOSED_LIMIT — 557 proposed au total mesurées le
//      2026-08-11, un brief du matin reste actionnable, pas un audit
//      historique de toute hypothèse jamais posée. Les plus récentes d'abord.
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
function gatherCandidates({ decisions, lessons, threadDump }) {
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

  const merged = dedupePages([...present, ...recent, ...proposed, ...presentThreadDump])
    .sort(byCreatedTimeDesc)
    .slice(0, MAX_CANDIDATES_TOTAL);

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
  return [
    `--- ${tag} [type: ${type}] [bucket: ${bucket.join(",") || "(absent)"}] ${d.title}`,
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

  const { business, insideOs, counts } = gatherCandidates({ decisions, lessons, threadDump });
  console.error(
    `[ouverture] candidats : présents=${counts.present} récents=${counts.recent} ` +
    `proposed=${counts.proposed} thread_dump=${counts.threadDump} -> business=${business.length} ` +
    `| INSIDE OS=${counts.insideOsKept}/${counts.insideOsTotal} (plafond=${INSIDE_OS_CAP})`
  );

  // Pas de lecture des blocs (readPageContent) ici, contrairement à Synthèse/
  // Pilotage : sur ~70 candidats ce serait ~70 appels Notion supplémentaires
  // pour un gain marginal — content_hint (rationale+evidence / what_happened+
  // evidence, déjà substantiel dans cette mémoire) suffit à générer une tâche
  // d'une ligne. Compromis assumé, différent de Synthèse/Pilotage à dessein.
  const completude = errors.length ? "INDÉTERMINÉ" : "COMPLET";

  const userMessage = buildUserMessage({ todayDate, business, insideOs, sourcesInterrogees, counts });

  console.error(`[ouverture] appel LLM (CLAUDE_MODEL=${env("CLAUDE_MODEL")})…`);
  const response = await claudeFetch({
    model: env("CLAUDE_MODEL"),
    max_tokens: 2000, // liste de tâches, plus long que Pilotage mais borné (max 20 lignes)
    messages: [
      {
        role: "user",
        content: `${systemPrompt}\n\n---\n\n${userMessage}`,
      },
    ],
  });

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
