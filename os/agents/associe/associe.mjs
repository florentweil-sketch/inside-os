// os/agents/associe/associe.mjs
//
// Logique de l'Agent Associé — point d'entrée conversationnel unique.
// Reçoit un message en langage naturel, classifie l'intention (appel LLM
// léger), route vers l'outil approprié (Pilotage/Synthèse/Ouverture/
// repêchage mémoire direct/proposition de curation), puis formule TOUJOURS
// la réponse finale lui-même (PROMPT_ASSOCIE v03) à partir de la sortie brute
// de l'outil invoqué.
//
// Garde-fous (PROMPT_ASSOCIE_v03 + doctrine CLAUDE.md) :
//   - lecture seule stricte, sauf os:statut, et seulement après confirmation
//     explicite de Florent (jamais exécuté depuis ce fichier — voir run.mjs)
//   - fail-loud : classification impossible, sujet manquant pour une route
//     qui l'exige, ou aucun candidat de curation trouvé -> throw
//   - posture de confrontation, statut/date, sources citées : imposés par le
//     prompt système, pas par ce code

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
  selectRelevant,
  readPageContent,
  describePage,
  formatStatusDate,
} from "../synthese/sources.mjs";
import { runPilotage } from "../pilotage/pilotage.mjs";
import { runSynthese } from "../synthese/synthese.mjs";
import { runOuverture } from "../ouverture/ouverture.mjs";
import { VALID_TARGET_STATUSES } from "../../scripts/statut.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROMPT_PATH = path.resolve(
  __dirname,
  "../../../docs/prompts/associe/PROMPT_ASSOCIE_v03.md"
);

const VALID_INTENTIONS = ["pilotage", "synthese", "ouverture", "memoire", "curation", "hors_perimetre"];
const MEMOIRE_LIMIT = 15;
const MEMOIRE_MIN_SCORE = 2;
const MAX_CONTENT_CHARS = 800;

function loadSystemPrompt() {
  if (!fs.existsSync(PROMPT_PATH)) {
    throw new Error(
      `Prompt système absent : ${PROMPT_PATH}. ` +
      `L'Agent Associé ne tourne pas sans son prompt (doctrine fail-loud).`
    );
  }
  return fs.readFileSync(PROMPT_PATH, "utf8");
}

function truncate(text, max) {
  if (!text) return "";
  const s = String(text);
  return s.length <= max ? s : s.slice(0, max) + `\n[…tronqué — ${s.length - max} caractères omis]`;
}

// ─── EXTRACTION JSON SOUPLE (même famille de pattern que inject-decisions-lessons.mjs) ───

function extractFirstJsonObject(text) {
  const s = String(text || "");
  const start = s.indexOf("{");
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === "{") depth++;
    if (c === "}") { depth--; if (depth === 0) return s.slice(start, i + 1); }
  }
  return null;
}

// ─── ÉTAPE 1 : CLASSIFICATION DE L'INTENTION (appel LLM léger) ───────────────

const CLASSIFIER_PROMPT = `Tu classifies l'intention d'un message adressé à L'Associé, le copilote conversationnel d'INSIDE OS.

Réponds en JSON strict, rien d'autre, aucun texte avant ou après, aucun bloc markdown :
{
  "intention": "pilotage | synthese | ouverture | memoire | curation | hors_perimetre",
  "sujet": "sujet ou dossier précis extrait du message, en 1 à 5 mots — null si non applicable",
  "curation": { "description": "ce qu'il faut retrouver en mémoire, en quelques mots", "target_status": "superseded | archived | rejected" } ou null,
  "raison": "une phrase expliquant ce choix de classification"
}

Règles de classification (une seule intention, la plus spécifique) :
- "pilotage" : état, avancement, blocage d'un dossier ou sujet précis nommé dans le message (sujet obligatoire)
- "synthese" : demande explicite d'analyse ou de synthèse transversale sur un sujet (sujet obligatoire)
- "ouverture" : demande de brief général, sans sujet précis ("quoi faire aujourd'hui", "brief du matin", "on fait quoi")
- "memoire" : question factuelle directe sur la mémoire (prix, personne, entité, fait) qui n'appelle ni pilotage ni synthèse ni brief (sujet obligatoire — les termes de recherche)
- "curation" : le message signale qu'un item mémoire est périmé, obsolète, dépassé, rejeté, ou tranché autrement que ce qui est en mémoire — remplir "curation", jamais exécuté automatiquement, juste classifié. target_status : "superseded" si remplacé par une décision plus récente, "archived" si simplement plus pertinent/actif, "rejected" si explicitement écarté. Si le statut cible n'est pas clair, choisis le plus probable — la confirmation humaine reste obligatoire en aval.
- "hors_perimetre" : rien de ce qui précède ne correspond (action externe, hors mémoire INSIDE OS, hors sujet)

Message de Florent : ${JSON.stringify("")}`;

async function classifyIntent(message) {
  const prompt = CLASSIFIER_PROMPT.replace(JSON.stringify(""), JSON.stringify(message));
  const raw = await claudeFetch({
    model: env("CLAUDE_MODEL"),
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const jsonText = extractFirstJsonObject(raw);
  if (!jsonText) {
    throw new Error(`Classification échouée — réponse LLM non exploitable (pas de JSON) : ${raw.slice(0, 200)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Classification échouée — JSON invalide : ${e.message} | brut: ${jsonText.slice(0, 200)}`);
  }

  if (!VALID_INTENTIONS.includes(parsed.intention)) {
    throw new Error(`Intention invalide retournée par le classifieur : "${parsed.intention}"`);
  }
  if (["pilotage", "synthese", "memoire"].includes(parsed.intention) && !parsed.sujet) {
    throw new Error(
      `Intention "${parsed.intention}" exige un sujet — le classifieur n'en a extrait aucun. ` +
      `Reformule avec un sujet/dossier explicite.`
    );
  }
  if (parsed.intention === "curation") {
    if (!parsed.curation?.description) {
      throw new Error(`Intention "curation" exige une description de l'item visé — aucune extraite.`);
    }
    if (!VALID_TARGET_STATUSES.includes(parsed.curation.target_status)) {
      throw new Error(
        `Statut cible de curation invalide/absent : "${parsed.curation?.target_status}". ` +
        `Valeurs acceptées : ${VALID_TARGET_STATUSES.join(", ")}.`
      );
    }
  }

  return parsed;
}

// ─── ÉTAPE 2 : REPÊCHAGE MÉMOIRE DIRECT (intention "memoire") ────────────────

async function fetchMemoryContext(sujet, { decisionsOnly = false } = {}) {
  const tokens = tokenize(sujet);
  if (!tokens.length) {
    throw new Error(`Aucun terme de recherche exploitable extrait de "${sujet}" — reformule avec des mots de contenu.`);
  }

  const errors = [];
  let allDecisions = [], allLessons = [], allThreadDump = [];

  try {
    allDecisions = await readDecisions();
  } catch (e) { errors.push(`DECISIONS : ${e.message}`); }

  if (!decisionsOnly) {
    try {
      allLessons = await readLessons();
    } catch (e) { errors.push(`LESSONS : ${e.message}`); }
    try {
      allThreadDump = await readThreadDump();
    } catch (e) { errors.push(`THREAD_DUMP : ${e.message}`); }
  }

  const all = [...allDecisions, ...allLessons, ...allThreadDump];
  const scored = selectRelevant(all, tokens, { limit: MEMOIRE_LIMIT, minScore: MEMOIRE_MIN_SCORE });

  console.error(
    `[associe] repêchage mémoire | sujet="${sujet}" | tokens=${tokens.join(",")} | ` +
    `lu=${all.length} | retenus=${scored.length}` +
    (errors.length ? ` | erreurs=${errors.join("; ")}` : "")
  );

  const items = [];
  for (const { page, score } of scored) {
    let content = "";
    try {
      content = await readPageContent(page.id);
    } catch (e) {
      console.error(`  [associe] WARN lecture blocs ${page.id} : ${e.message}`);
    }
    items.push({ page, score, content });
  }

  return { items, errors, pagesLues: all.length };
}

function renderMemoryItems(items) {
  if (items.length === 0) return "(aucun item pertinent trouvé en mémoire)";
  const lines = [];
  for (const { page, score, content } of items) {
    const d = describePage(page);
    const uid = getPropText(page, "uid");
    lines.push(`--- [score ${score}] ${formatStatusDate(d.status, d.createdTime)} ${d.title}`);
    lines.push(`uid: ${uid || "(absent)"} | Source : ${d.source_dump_id || "(absente)"} | ID page : ${d.id}`);
    if (d.content_hint) lines.push(`Aperçu : ${truncate(d.content_hint, 300)}`);
    if (content && content.trim()) lines.push(`Contenu : ${truncate(content, MAX_CONTENT_CHARS)}`);
    lines.push("");
  }
  return lines.join("\n");
}

// ─── ÉTAPE 3 : FORMULATION FINALE PAR L'ASSOCIÉ ──────────────────────────────

async function formulateResponse({ systemPrompt, message, toolLabel, sujet, toolOutput, runDate }) {
  const userMessage = [
    `MESSAGE DE FLORENT : "${message}"`,
    ``,
    `DATE DU RUN : ${runDate}`,
    `OUTIL INVOQUÉ : ${toolLabel}`,
    `SUJET : ${sujet || "(aucun)"}`,
    ``,
    `SORTIE DE L'OUTIL (contexte à utiliser pour ta réponse — ne réponds qu'à partir de ceci et de ta doctrine) :`,
    toolOutput,
    ``,
    `Formule maintenant ta réponse à Florent, en tant que L'Associé. Cite les sources, respecte les statuts/dates déjà indiqués, adopte ta posture de confrontation si la sortie de l'outil le justifie (contradiction, dette, hypothèse non vérifiée). Ne relaie jamais la sortie brute telle quelle sans la reformuler à ta manière.`,
  ].join("\n");

  return claudeFetch({
    model: env("CLAUDE_MODEL"),
    max_tokens: 1500,
    messages: [{ role: "user", content: `${systemPrompt}\n\n---\n\n${userMessage}` }],
  });
}

// ─── ORCHESTRATION ────────────────────────────────────────────────────────────

export async function runAssocie({ message, runDate }) {
  if (!message || !message.trim()) {
    throw new Error('Message vide. Usage : npm run os:associe -- "ton message"');
  }

  const effectiveRunDate = runDate || new Date().toISOString();
  const systemPrompt = loadSystemPrompt();

  console.error(`[associe] classification de l'intention…`);
  const classification = await classifyIntent(message);
  const { intention, sujet, curation, raison } = classification;
  console.error(`[associe] intention=${intention}${sujet ? ` sujet="${sujet}"` : ""} — ${raison}`);

  let toolLabel;
  let toolOutput;
  let curationProposal = null;

  if (intention === "pilotage") {
    toolLabel = `os:pilotage --sujet "${sujet}"`;
    const result = await runPilotage({ sujet, runDate: effectiveRunDate });
    toolOutput = result.response;
  } else if (intention === "synthese") {
    toolLabel = `os:synthese --sujet "${sujet}"`;
    const result = await runSynthese({ sujet, runDate: effectiveRunDate });
    toolOutput = result.response;
  } else if (intention === "ouverture") {
    toolLabel = `os:ouverture`;
    const result = await runOuverture({ runDate: effectiveRunDate });
    toolOutput = result.response;
  } else if (intention === "memoire") {
    toolLabel = `repêchage mémoire direct (socle sources.mjs)`;
    const { items } = await fetchMemoryContext(sujet);
    toolOutput = renderMemoryItems(items);
  } else if (intention === "curation") {
    toolLabel = `proposition de curation (os:statut — NON exécuté, attend confirmation)`;
    const { items } = await fetchMemoryContext(curation.description, { decisionsOnly: true });
    if (items.length === 0) {
      throw new Error(
        `Aucune décision trouvée pour "${curation.description}" — impossible de proposer une curation ` +
        `sans item identifié. Reformule avec des termes plus précis.`
      );
    }
    const best = items[0];
    const uid = getPropText(best.page, "uid");
    if (!uid) {
      throw new Error(`Item candidat trouvé (${describePage(best.page).title}) mais sans uid exploitable — curation impossible.`);
    }
    curationProposal = {
      uid,
      targetStatus: curation.target_status,
      itemTitle: describePage(best.page).title,
      command: `npm run os:statut -- ${uid} ${curation.target_status}`,
    };
    toolOutput = renderMemoryItems([best]) + `\nCommande proposée (NON EXÉCUTÉE, attend confirmation explicite) :\n${curationProposal.command}`;
  } else {
    // hors_perimetre
    toolLabel = `aucun (hors périmètre mémoire INSIDE OS)`;
    toolOutput =
      `Le message ne correspond à aucune route disponible (pilotage, synthèse, brief, question mémoire, curation). ` +
      `Dis-le explicitement à Florent, sans inventer de réponse ni répondre depuis des connaissances générales hors mémoire INSIDE OS.`;
  }

  console.error(`[associe] appel LLM formulation finale (CLAUDE_MODEL=${env("CLAUDE_MODEL")})…`);
  const response = await formulateResponse({
    systemPrompt,
    message,
    toolLabel,
    sujet,
    toolOutput,
    runDate: effectiveRunDate,
  });

  return {
    message,
    intention,
    sujet: sujet || null,
    raisonClassification: raison,
    toolLabel,
    toolOutput,
    response,
    curationProposal,
    runDate: effectiveRunDate,
  };
}
