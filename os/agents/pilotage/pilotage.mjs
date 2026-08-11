// os/agents/pilotage/pilotage.mjs
//
// Logique principale de l'Agent Pilotage.
// Réutilise le socle de lecture/scoring de l'Agent Synthèse
// (os/agents/synthese/sources.mjs — lecture paginée des 3 datasources,
// scoreItem/describePage typés ITEM_FIELDS, formatStatusDate) au lieu de le
// dupliquer. Diffère de Synthèse sur deux points :
//   - un boost "présent" (bucket B99 / récent) — légitime par conception ici,
//     l'Agent Pilotage EST l'agent du présent (contrairement à Synthèse,
//     généraliste, où ce même biais a produit un bug de faux-positifs corrigé
//     en B09-T41 dans os:chat). Le boost ne s'applique QU'EN TRI, jamais en
//     seuil — un item sans pertinence réelle sur le sujet ne peut jamais
//     franchir minScore uniquement parce qu'il est B99/récent (même garde-fou
//     structurel que le gate posé sur os:chat, appliqué ici dès la conception
//     plutôt qu'en correctif).
//   - une sortie ultra-courte (ÉTAT/BLOCAGE/ACTION/Sources), pas une synthèse
//     consolidée en prose.
//
// Garde-fous (identiques à Synthèse, PROMPT_AGENT_SYNTHESE_v01 § Périmètre) :
//   - lecture seule absolue (aucune écriture Notion, aucune modif repo)
//   - fail-loud : pas de fallback silencieux
//   - citations obligatoires (uids/ids en Sources, imposé par le prompt système)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { claudeFetch } from "../../lib/claude.mjs";
import { env } from "../../lib/config.mjs";
import { getPropText } from "../../lib/notion.mjs";
import {
  tokenize,
  readDecisions,
  readLessons,
  readThreadDump,
  scoreItem,
  readPageContent,
  describePage,
  formatStatusDate,
} from "../synthese/sources.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin du prompt système. Si absent : THROW — fail-loud, jamais de fallback
// (même règle que Synthèse).
const PROMPT_PATH = path.resolve(
  __dirname,
  "../../../docs/prompts/pilotage/PROMPT_AGENT_PILOTAGE_v01.md"
);

function loadSystemPrompt() {
  if (!fs.existsSync(PROMPT_PATH)) {
    throw new Error(
      `Prompt système absent : ${PROMPT_PATH}. ` +
      `L'Agent Pilotage ne tourne pas sans son prompt système (doctrine fail-loud).`
    );
  }
  return fs.readFileSync(PROMPT_PATH, "utf8");
}

// Volontairement plus serré que Synthèse (LIMIT=30) : la sortie est une
// phrase par section, pas une synthèse consolidée — pas besoin d'un grand
// pool de citations.
const LIMIT = 20;
const MIN_SCORE = 2; // même seuil par défaut que selectRelevant (Synthèse)
const MAX_CONTENT_CHARS_PER_ITEM = 2000;
const RECENCY_WINDOW_DAYS = 90;

function truncate(text, max) {
  if (!text) return "";
  const s = String(text);
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n[…tronqué — ${s.length - max} caractères omis]`;
}

function getMultiSelectNames(page, propName) {
  const p = page.properties?.[propName];
  if (!p || p.type !== "multi_select") return [];
  return (p.multi_select || []).map((x) => x.name);
}

// "Présent" = bucket B99 (architecture actée : "B99 = présent vivant du
// système", décision gravée citée dans la mémoire B99-T05) OU
// source_dump_id préfixé B99- (thread_dump direct).
function isPresentItem(page) {
  const bucket = getMultiSelectNames(page, "bucket");
  const dumpId = String(getPropText(page, "source_dump_id") || "").toUpperCase();
  return bucket.includes("B99") || dumpId.startsWith("B99-");
}

function isRecentItem(page, days) {
  if (!page.created_time) return false;
  const created = new Date(page.created_time).getTime();
  if (Number.isNaN(created)) return false;
  return created >= Date.now() - days * 24 * 60 * 60 * 1000;
}

// Score = pertinence réelle (scoreItem, inchangé, importé de Synthèse) + boost
// présent/récent. Le boost est volontairement modeste (max +4, contre un
// match titre à +2/token et contenu à +1/token) : il départage des items déjà
// pertinents, il ne peut pas à lui seul rendre pertinent un item qui ne l'est
// pas — c'est baseScore, PAS le score boosté, qui est comparé à minScore.
function scoreWithPresentBoost(page, tokens) {
  const baseScore = scoreItem(page, tokens);
  let boost = 0;
  if (isPresentItem(page)) boost += 3;
  if (isRecentItem(page, RECENCY_WINDOW_DAYS)) boost += 1;
  return { baseScore, boost, score: baseScore + boost };
}

function selectPresentAware(pages, tokens, { limit = LIMIT, minScore = MIN_SCORE } = {}) {
  return pages
    .map((page) => {
      const { baseScore, boost, score } = scoreWithPresentBoost(page, tokens);
      return { page, baseScore, boost, score };
    })
    .filter((x) => x.baseScore >= minScore) // seuil sur la pertinence RÉELLE
    .sort((a, b) => b.score - a.score)      // tri sur le score total (présent priorisé à pertinence égale)
    .slice(0, limit);
}

function buildUserMessage({ sujet, items, completude, sourcesInterrogees, runDate }) {
  const lines = [];
  lines.push(`SUJET : ${sujet}`);
  lines.push("");
  lines.push(`DATE DU RUN (jamais à confondre avec la date d'un item mémoire) : ${runDate}`);
  lines.push("");
  lines.push(`SOURCES INTERROGÉES : ${sourcesInterrogees.join(", ")}`);
  lines.push(`COMPLÉTUDE TECHNIQUE : ${completude}`);
  lines.push("");
  lines.push(`NOMBRE D'ITEMS RETENUS : ${items.length}`);
  lines.push("");

  if (items.length === 0) {
    lines.push("AUCUN item pertinent retrouvé en mémoire sur ce sujet.");
    lines.push('Réponds au format standard avec ÉTAT : "mémoire insuffisante sur ce sujet",');
    lines.push("BLOCAGE : le trou nommé précisément, ACTION : quoi dumper pour le combler.");
  } else {
    lines.push("ITEMS MÉMOIRE (triés par pertinence réelle, présent B99/récent priorisé à pertinence égale) :");
    lines.push("");
    for (const { page, score, boost, content } of items) {
      const d = describePage(page);
      const tag = formatStatusDate(d.status, d.createdTime);
      lines.push(`--- [score ${score}${boost ? `, dont présent +${boost}` : ""}] ${tag} ${d.title}`);
      lines.push(`uid/id : ${d.id} | Source : ${d.source_dump_id || "(source_dump_id absent)"}`);
      lines.push(`Aperçu : ${truncate(d.content_hint, 400)}`);
      if (content && content.trim()) {
        lines.push(`Contenu (blocs page, tronqué si long) : ${truncate(content, MAX_CONTENT_CHARS_PER_ITEM)}`);
      } else {
        lines.push("Contenu : (aucun bloc lu — page vide ou non lue)");
      }
      lines.push("");
    }
  }

  lines.push("");
  lines.push("Réponds STRICTEMENT au format ÉTAT / BLOCAGE / ACTION / Sources défini dans ton");
  lines.push("prompt système. Une phrase par section. Cite les uid/id utilisés dans Sources.");

  const msg = lines.join("\n");
  console.error(`[pilotage] taille message LLM : ${msg.length} caractères (~${Math.round(msg.length * 0.3)} tokens estimés)`);
  return msg;
}

export async function runPilotage({ sujet, limit = LIMIT, minScore = MIN_SCORE, withContent = true, runDate }) {
  if (!sujet || !sujet.trim()) {
    throw new Error('Sujet vide. Usage : npm run os:pilotage -- --sujet "..."');
  }

  const effectiveRunDate = runDate || new Date().toISOString();
  const systemPrompt = loadSystemPrompt();
  const tokens = tokenize(sujet);
  const errors = [];
  const sourcesInterrogees = [];

  // Pas de routing conditionnel (contrairement à Synthèse) : Pilotage lit
  // toujours les 3 sources — le présent B99 prime ensuite dans le scoring,
  // pas dans la sélection des datasources interrogées.
  let allDecisions = [], allLessons = [], allThreadDump = [];

  try {
    console.error(`[pilotage] lecture DECISIONS_DS…`);
    allDecisions = await readDecisions();
    sourcesInterrogees.push(`decisions_structural (${allDecisions.length} pages)`);
  } catch (e) {
    errors.push(`DECISIONS : ${e.message}`);
  }

  try {
    console.error(`[pilotage] lecture LESSONS_DS…`);
    allLessons = await readLessons();
    sourcesInterrogees.push(`lessons_learnings (${allLessons.length} pages)`);
  } catch (e) {
    errors.push(`LESSONS : ${e.message}`);
  }

  try {
    console.error(`[pilotage] lecture THREAD_DUMP_DS…`);
    allThreadDump = await readThreadDump();
    sourcesInterrogees.push(`thread_dump (${allThreadDump.length} pages)`);
  } catch (e) {
    errors.push(`THREAD_DUMP : ${e.message}`);
  }

  const all = [...allDecisions, ...allLessons, ...allThreadDump];
  const scored = selectPresentAware(all, tokens, { limit, minScore });
  console.error(
    `[pilotage] sujet="${sujet}" | tokens=${tokens.join(",")} | ` +
    `lu=${all.length} | retenus=${scored.length} (minScore=${minScore}, limit=${limit})`
  );

  const items = [];
  for (const { page, score, baseScore, boost } of scored) {
    let content = "";
    if (withContent) {
      try {
        content = await readPageContent(page.id);
      } catch (e) {
        console.error(`  [pilotage] WARN : lecture blocs page ${page.id} a échoué : ${e.message}`);
        errors.push(`blocs page ${page.id} : ${e.message}`);
      }
    }
    items.push({ page, score, baseScore, boost, content });
  }

  // Complétude technique (préalable au LLM) : mêmes règles que Synthèse — le
  // LLM peut redescendre à PARTIEL/INDÉTERMINÉ, jamais remonter à COMPLET seul.
  const completude = errors.length ? "INDÉTERMINÉ" : "COMPLET";

  const userMessage = buildUserMessage({
    sujet,
    items,
    completude,
    sourcesInterrogees,
    runDate: effectiveRunDate,
  });

  console.error(`[pilotage] appel LLM (CLAUDE_MODEL=${env("CLAUDE_MODEL")})…`);
  const response = await claudeFetch({
    model: env("CLAUDE_MODEL"),
    max_tokens: 1200, // sortie très courte par design (ÉTAT/BLOCAGE/ACTION/Sources)
    messages: [
      {
        role: "user",
        content: `${systemPrompt}\n\n---\n\n${userMessage}`,
      },
    ],
  });

  return {
    sujet,
    tokens,
    sourcesInterrogees,
    completude,
    errors,
    itemsCount: items.length,
    pagesLues: all.length,
    response,
    runDate: effectiveRunDate,
  };
}
