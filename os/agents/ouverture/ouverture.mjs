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

  return { merged, counts: { present: present.length, recent: recent.length, proposed: proposed.length, threadDump: presentThreadDump.length } };
}

function buildUserMessage({ todayDate, items, sourcesInterrogees, counts }) {
  const lines = [];
  lines.push(`DATE DU JOUR (à utiliser telle quelle dans le titre "# OUVERTURE — <date>") : ${todayDate}`);
  lines.push("");
  lines.push(`SOURCES INTERROGÉES : ${sourcesInterrogees.join(", ")}`);
  lines.push(
    `CANDIDATS RASSEMBLÉS : présents=${counts.present} | récents(${RECENT_DAYS}j)=${counts.recent} | ` +
    `proposed=${counts.proposed} | thread_dump présents=${counts.threadDump} | total après fusion=${items.length}`
  );
  lines.push("");

  if (items.length === 0) {
    lines.push("AUCUN candidat trouvé (aucun item présent/récent/proposed).");
    lines.push("Produis uniquement le titre, sans section — nomme l'absence, ne comble pas.");
  } else {
    lines.push("CANDIDATS MÉMOIRE (chacun avec son bucket réel — construis les familles dessus, n'invente rien) :");
    lines.push("");
    for (const page of items) {
      const d = describePage(page);
      const tag = formatStatusDate(d.status, d.createdTime);
      const bucket = (page.properties?.bucket?.multi_select || []).map((x) => x.name);
      const type = page._itemType || "?";
      lines.push(`--- ${tag} [type: ${type}] [bucket: ${bucket.join(",") || "(absent)"}] ${d.title}`);
      lines.push(`uid/id : ${d.id} | source_dump_id : ${d.source_dump_id || "(absent)"}`);
      lines.push(`Aperçu : ${truncate(d.content_hint, 500)}`);
      lines.push("");
    }
  }

  lines.push("");
  lines.push("Réponds STRICTEMENT au format défini dans ton prompt système (familles par bucket réel,");
  lines.push("cases à cocher, une ligne par tâche, source citée, max 20 tâches, les plus actionnables d'abord).");

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

  const { merged, counts } = gatherCandidates({ decisions, lessons, threadDump });
  console.error(
    `[ouverture] candidats : présents=${counts.present} récents=${counts.recent} ` +
    `proposed=${counts.proposed} thread_dump=${counts.threadDump} -> total fusionné=${merged.length}`
  );

  // Pas de lecture des blocs (readPageContent) ici, contrairement à Synthèse/
  // Pilotage : sur ~70 candidats ce serait ~70 appels Notion supplémentaires
  // pour un gain marginal — content_hint (rationale+evidence / what_happened+
  // evidence, déjà substantiel dans cette mémoire) suffit à générer une tâche
  // d'une ligne. Compromis assumé, différent de Synthèse/Pilotage à dessein.
  const completude = errors.length ? "INDÉTERMINÉ" : "COMPLET";

  const userMessage = buildUserMessage({ todayDate, items: merged, sourcesInterrogees, counts });

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
    candidatesCount: merged.length,
    counts,
    pagesLues: decisions.length + lessons.length + threadDump.length,
    response,
    runDate: effectiveRunDate,
  };
}
