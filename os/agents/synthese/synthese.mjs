// os/agents/synthese/synthese.mjs
//
// Logique principale de l'Agent Synthèse.
// Orchestre : (1) lecture des datasources Notion, (2) scoring/sélection,
// (3) lecture contenu des items retenus, (4) appel LLM avec prompt système,
// (5) formatage sortie tracée.
//
// Garde-fous (PROMPT_AGENT_SYNTHESE_v01 + SPEC_AGENT_SYNTHESE_v01) :
//   - lecture seule absolue (aucune écriture Notion, aucune modif repo)
//   - fail-loud : pas de fallback silencieux
//   - complétude vérifiée avant génération sous label COMPLET
//   - citations obligatoires (le prompt système l'impose au LLM)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { claudeFetch } from "../../lib/claude.mjs";
import { env } from "../../lib/config.mjs";
import {
  tokenize,
  readDecisions,
  readLessons,
  readThreadDump,
  selectRelevant,
  readPageContent,
  describePage,
} from "./sources.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin du prompt système, confirmé par le scan repo (B09-T41).
// Si absent : THROW — fail-loud, jamais de fallback.
const PROMPT_PATH = path.resolve(
  __dirname,
  "../../../docs/prompts/synthese/PROMPT_AGENT_SYNTHESE_v01.md"
);

function loadSystemPrompt() {
  if (!fs.existsSync(PROMPT_PATH)) {
    throw new Error(
      `Prompt système absent : ${PROMPT_PATH}. ` +
      `L'Agent Synthèse ne tourne pas sans son prompt système (doctrine fail-loud).`
    );
  }
  return fs.readFileSync(PROMPT_PATH, "utf8");
}

// Routing datasource selon PROMPT_ASSOCIE v02 + prompt Synthèse :
//   - decisions_structural -> sujets de stratégie/architecture/décisions actées
//   - lessons_learnings    -> sujets de retour d'expérience/erreurs/leçons
//   - thread_dump          -> contexte de thread précis/historique/chronologie
// Pour la mise en service (état technique du système), les TROIS sont pertinentes.
// On lit large pour le premier livrable, on raffinera après usage réel.
function planRouting(sujet) {
  const s = sujet.toLowerCase();
  const plan = {
    decisions: true,   // par défaut on lit DECISIONS
    lessons: true,     // par défaut on lit LESSONS
    thread_dump: false, // optionnel — coûteux
  };
  // Heuristique simple : si le sujet mentionne "thread", "historique", "chronologie",
  // ou "état du système" -> on lit aussi THREAD_DUMP.
  if (
    /thread|historique|chronologie|etat|état|systeme|système|inside\s*os|pipeline/i.test(s)
  ) {
    plan.thread_dump = true;
  }
  return plan;
}

// Budget de contenu par item (en caractères, pas tokens).
// Empirique : 1 caractère ≈ 0.3 token. 3000 chars ≈ 900 tokens.
// 30 items × 3000 chars = ~27 000 tokens de contenu — large marge sous 1M.
const MAX_CONTENT_CHARS_PER_ITEM = 3000;

// Avertissement si le message total dépasse ce seuil (caractères).
// 700 000 chars ≈ 210 000 tokens — bien sous le plafond Sonnet 1M.
const WARN_TOTAL_CHARS = 700000;

function truncate(text, max) {
  if (!text) return "";
  const s = String(text);
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n[…tronqué — ${s.length - max} caractères omis]`;
}

// Construit le message utilisateur passé au LLM : prompt système + sujet + items mémoire.
function buildUserMessage({ sujet, items, completude, sourcesInterrogees }) {
  const lines = [];
  lines.push(`SUJET DE LA SYNTHÈSE : ${sujet}`);
  lines.push("");
  lines.push(`SOURCES INTERROGÉES : ${sourcesInterrogees.join(", ")}`);
  lines.push(`COMPLÉTUDE TECHNIQUE : ${completude}`);
  lines.push("");
  lines.push(`NOMBRE D'ITEMS PERTINENTS RETENUS : ${items.length}`);
  lines.push("");
  if (items.length === 0) {
    lines.push("AUCUN item pertinent retrouvé en mémoire sur ce sujet.");
    lines.push("Produis une sortie au format standard avec niveau de complétude INDÉTERMINÉ");
    lines.push("ou PARTIEL, et nomme explicitement le trou — ne comble pas.");
  } else {
    lines.push("ITEMS MÉMOIRE (chacun cite source : page Notion / source_dump_id) :");
    lines.push("");
    for (const { page, score, content } of items) {
      const d = describePage(page);
      lines.push(`--- [score ${score}] ${d.title}`);
      lines.push(`Source : ${d.source_dump_id || "(source_dump_id absent)"} | ID page : ${d.id}`);
      lines.push(`URL : ${d.url || "(url absente)"}`);
      lines.push(`Résumé une ligne (raw_text, ne pas lire pour fond) : ${truncate(d.raw_text, 500)}`);
      if (content && content.trim()) {
        lines.push("Contenu (blocs page, tronqué si long) :");
        lines.push(truncate(content, MAX_CONTENT_CHARS_PER_ITEM));
      } else {
        lines.push("Contenu : (aucun bloc lu — page vide ou non lue)");
      }
      lines.push("");
    }
  }
  lines.push("");
  lines.push("Produis la synthèse au format standard défini dans ton prompt système.");
  lines.push("Cite chaque affirmation. Déclare les trous. Ne comble jamais.");
  const msg = lines.join("\n");
  if (msg.length > WARN_TOTAL_CHARS) {
    console.error(`[synthese] WARN : message volumineux (${msg.length} chars). Si plantage 400, baisse --limit.`);
  }
  console.error(`[synthese] taille message LLM : ${msg.length} caractères (~${Math.round(msg.length * 0.3)} tokens estimés)`);
  return msg;
}

// Détermine le niveau de complétude technique (avant LLM) selon ce qu'on a pu lire.
// Le LLM ne décide pas seul de COMPLET — on lui passe notre constat objectif.
function computeCompletude(plan, errors) {
  if (errors.length) return "INDÉTERMINÉ";
  // Si on a interrogé toutes les sources prévues, COMPLET ; sinon PARTIEL.
  // (Le LLM peut redescendre à PARTIEL/INDÉTERMINÉ s'il détecte des contradictions
  // ou des trous dans le contenu lui-même.)
  return "COMPLET";
}

export async function runSynthese({ sujet, limit = 30, minScore = 2, withContent = true }) {
  if (!sujet || !sujet.trim()) {
    throw new Error("Sujet vide. Usage : npm run os:synthese -- --sujet \"...\"");
  }

  const systemPrompt = loadSystemPrompt();
  const tokens = tokenize(sujet);
  const plan = planRouting(sujet);
  const errors = [];
  const sourcesInterrogees = [];

  // === Lecture des datasources, fail-loud par source ===
  let allDecisions = [];
  let allLessons = [];
  let allThreadDump = [];

  if (plan.decisions) {
    try {
      console.error(`[synthese] lecture DECISIONS_DS…`);
      allDecisions = await readDecisions();
      sourcesInterrogees.push(`decisions_structural (${allDecisions.length} pages)`);
    } catch (e) {
      errors.push(`DECISIONS : ${e.message}`);
    }
  }
  if (plan.lessons) {
    try {
      console.error(`[synthese] lecture LESSONS_DS…`);
      allLessons = await readLessons();
      sourcesInterrogees.push(`lessons_learnings (${allLessons.length} pages)`);
    } catch (e) {
      errors.push(`LESSONS : ${e.message}`);
    }
  }
  if (plan.thread_dump) {
    try {
      console.error(`[synthese] lecture THREAD_DUMP_DS…`);
      allThreadDump = await readThreadDump();
      sourcesInterrogees.push(`thread_dump (${allThreadDump.length} pages)`);
    } catch (e) {
      errors.push(`THREAD_DUMP : ${e.message}`);
    }
  }

  // === Scoring + sélection ===
  const all = [...allDecisions, ...allLessons, ...allThreadDump];
  const scored = selectRelevant(all, tokens, { limit, minScore });
  console.error(
    `[synthese] sujet="${sujet}" | tokens=${tokens.join(",")} | ` +
    `lu=${all.length} | retenus=${scored.length} (minScore=${minScore}, limit=${limit})`
  );

  // === Lecture du contenu des items retenus ===
  const items = [];
  for (const { page, score } of scored) {
    let content = "";
    if (withContent) {
      try {
        content = await readPageContent(page.id);
      } catch (e) {
        console.error(`  [synthese] WARN : lecture blocs page ${page.id} a échoué : ${e.message}`);
        errors.push(`blocs page ${page.id} : ${e.message}`);
      }
    }
    items.push({ page, score, content });
  }

  // === Niveau de complétude technique ===
  const completude = computeCompletude(plan, errors);

  // === Appel LLM ===
  const userMessage = buildUserMessage({
    sujet,
    items,
    completude,
    sourcesInterrogees,
  });

  console.error(`[synthese] appel LLM (CLAUDE_MODEL=${env("CLAUDE_MODEL")})…`);
  const response = await claudeFetch({
    model: env("CLAUDE_MODEL"),
    max_tokens: 4000,
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
    plan,
    sourcesInterrogees,
    completude,
    errors,
    itemsCount: items.length,
    pagesLues: all.length,
    response,
  };
}
