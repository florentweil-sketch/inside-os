import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { queryDataSource, getPropText } from "../lib/notion.mjs";

// Lit le premier ID d'une propriete relation Notion.
// Retourne l'ID de page ou "" si absent.
function getRelationId(page, propName) {
  const prop = page.properties?.[propName];
  if (!prop || prop.type !== "relation") return "";
  return prop.relation?.[0]?.id || "";
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FETCH_LIMIT = 80;
const TOP_K = 6;
const LOG_DIR = "runtime/logs/chat";

function ensureLogDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join("-") +
    "_" +
    [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join("-")
  );
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, " ")
    .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  const stop = new Set([
    "le", "la", "les", "de", "des", "du", "un", "une", "et", "ou", "a", "à",
    "en", "dans", "sur", "pour", "par", "avec", "est", "sont", "que", "qui",
    "quoi", "ou", "où", "au", "aux", "ce", "cet", "cette", "ces", "il", "elle",
    "on", "nous", "vous", "ils", "elles", "je", "tu", "mon", "ton", "son",
    "ma", "ta", "sa", "mes", "tes", "ses", "nos", "vos", "leurs", "ne", "pas",
    "plus", "moins", "the", "and", "or", "of", "to", "in", "is", "are",
    "ou", "en", "os"
  ]);

  return Array.from(
    new Set(
      normalizeText(value)
        .split(" ")
        .map((x) => x.trim())
        .filter((x) => x.length >= 2 && !stop.has(x))
    )
  );
}

function phraseBoosts(tokens) {
  const joined = tokens.join(" ");
  const boosts = [];

  if (joined.includes("inside")) {
    boosts.push("inside");
  }
  if (joined.includes("memoire") || joined.includes("conversationnelle")) {
    boosts.push("memoire", "conversationnelle");
  }
  if (joined.includes("notion")) {
    boosts.push("notion");
  }
  if (joined.includes("v0") || joined.includes("v1") || joined.includes("beta")) {
    boosts.push("v0", "v1", "beta");
  }
  if (joined.includes("pipeline")) {
    boosts.push("pipeline");
  }
  if (joined.includes("durcissement")) {
    boosts.push("durcissement");
  }
  if (joined.includes("extract")) {
    boosts.push("extract");
  }
  if (joined.includes("inject")) {
    boosts.push("inject");
  }

  return boosts;
}

function isPresentDump(sourceDumpId) {
  return String(sourceDumpId || "").toUpperCase().startsWith("B99-");
}

function isOldDump(sourceDumpId) {
  const id = String(sourceDumpId || "").toUpperCase();
  return id.startsWith("B01-") || id.startsWith("B02-");
}

function isStateDump(sourceDumpId) {
  const id = String(sourceDumpId || "").toUpperCase();
  return id.startsWith("B99-T05");
}

function questionTargetsCurrentSystem(question) {
  const q = normalizeText(question);
  return (
    q.includes("memoire") ||
    q.includes("conversationnelle") ||
    q.includes("v0") ||
    q.includes("v1") ||
    q.includes("beta") ||
    q.includes("durcissement") ||
    q.includes("pipeline") ||
    q.includes("extract") ||
    q.includes("inject") ||
    q.includes("inside os") ||
    q.includes("aujourd") ||
    q.includes("etat")
  );
}

async function getDecisions() {
  const response = await queryDataSource(process.env.DECISIONS_DS_ID, {
    page_size: FETCH_LIMIT,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });

  return (response.results || []).map((page) => ({
    type: "decision",
    uid: getPropText(page, "uid"),
    decision: getPropText(page, "decision"),
    rationale: getPropText(page, "rationale"),
    evidence: getPropText(page, "evidence"),
    source_thread: getRelationId(page, "source_thread"),
    source_dump_id: getPropText(page, "source_dump_id"),
  }));
}

async function getLessons() {
  const response = await queryDataSource(process.env.LESSONS_DS_ID, {
    page_size: FETCH_LIMIT,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });

  return (response.results || []).map((page) => ({
    type: "lesson",
    uid: getPropText(page, "uid"),
    lesson: getPropText(page, "lesson"),
    what_happened: getPropText(page, "what_happened"),
    evidence: getPropText(page, "evidence"),
    source_thread: getRelationId(page, "source_thread"),
    source_dump_id: getPropText(page, "source_dump_id"),
  }));
}

function scoreItem(item, tokens, boosts, question) {
  const primaryText =
    item.type === "decision"
      ? `${item.decision} ${item.rationale}`
      : `${item.lesson} ${item.what_happened}`;

  const secondaryText = `${item.evidence} ${item.source_thread} ${item.source_dump_id}`;
  const weakText = `${item.uid}`;

  const primary = normalizeText(primaryText);
  const secondary = normalizeText(secondaryText);
  const weak = normalizeText(weakText);
  const all = normalizeText(`${primaryText} ${secondaryText} ${weakText}`);

  let score = 0;
  const hits = [];

  for (const token of tokens) {
    if (primary.includes(token)) {
      score += 8;
      hits.push(token);
    } else if (secondary.includes(token)) {
      score += 4;
      hits.push(token);
    } else if (weak.includes(token)) {
      score += 1;
    } else if (all.includes(token)) {
      score += 2;
    }
  }

  for (const boost of boosts) {
    if (primary.includes(boost)) {
      score += 6;
      hits.push(`boost:${boost}`);
    } else if (secondary.includes(boost)) {
      score += 3;
      hits.push(`boost:${boost}`);
    }
  }

  if (item.type === "decision") score += 2;
  if (item.source_thread) score += 1;
  if (item.source_dump_id) score += 1;
  if (item.uid) score += 1;

  // BOOST PRÉSENT
  if (isPresentDump(item.source_dump_id)) {
    score += 20;
    hits.push("present:B99");
  }

  // BOOST ÉTAT OPÉRATOIRE
  if (isStateDump(item.source_dump_id)) {
    score += 40;
    hits.push("state:boost");
  }

  // BOOST SUPPLÉMENTAIRE si la question porte sur l'état actuel du système
  if (questionTargetsCurrentSystem(question) && isPresentDump(item.source_dump_id)) {
    score += 12;
    hits.push("present:system");
  }

  // MALUS léger sur vieux historique si question système actuelle
  if (questionTargetsCurrentSystem(question) && isOldDump(item.source_dump_id)) {
    score -= 4;
    hits.push("old-history");
  }

  return {
    ...item,
    _score: score,
    _hits: Array.from(new Set(hits)),
  };
}

function buildMemoryContext(items) {
  return items
    .map((item, index) => {
      if (item.type === "decision") {
        return [
          `[MEMORY_ITEM_${index + 1}]`,
          `type: decision`,
          `score: ${item._score}`,
          `hits: ${(item._hits || []).join(", ")}`,
          `uid: ${item.uid || ""}`,
          `decision: ${item.decision || ""}`,
          `rationale: ${item.rationale || ""}`,
          `evidence: ${item.evidence || ""}`,
          `source_thread: ${item.source_thread || ""}`,
          `source_dump_id: ${item.source_dump_id || ""}`,
        ].join("\n");
      }

      return [
        `[MEMORY_ITEM_${index + 1}]`,
        `type: lesson`,
        `score: ${item._score}`,
        `hits: ${(item._hits || []).join(", ")}`,
        `uid: ${item.uid || ""}`,
        `lesson: ${item.lesson || ""}`,
        `what_happened: ${item.what_happened || ""}`,
        `evidence: ${item.evidence || ""}`,
        `source_thread: ${item.source_thread || ""}`,
        `source_dump_id: ${item.source_dump_id || ""}`,
      ].join("\n");
    })
    .join("\n\n");
}

function writeLog({ question, tokens, selectedItems, responseText }) {
  ensureLogDir();
  const filename = path.join(LOG_DIR, `${nowStamp()}_chat_test1.txt`);

  const content = [
    `QUESTION: ${question}`,
    ``,
    `TOKENS: ${tokens.join(", ")}`,
    ``,
    `SELECTED_ITEMS: ${selectedItems.length}`,
    ``,
    ...selectedItems.map((item, i) =>
      [
        `--- ITEM ${i + 1} ---`,
        `type: ${item.type}`,
        `score: ${item._score}`,
        `hits: ${(item._hits || []).join(", ")}`,
        `uid: ${item.uid || ""}`,
        item.type === "decision"
          ? `decision: ${item.decision || ""}`
          : `lesson: ${item.lesson || ""}`,
        `source_thread: ${item.source_thread || ""}`,
        `source_dump_id: ${item.source_dump_id || ""}`,
        ``,
      ].join("\n")
    ),
    `--- RESPONSE ---`,
    responseText,
    ``,
  ].join("\n");

  fs.writeFileSync(filename, content, "utf8");
  return filename;
}

async function main() {
  const question = process.argv.slice(2).join(" ") || "où en est INSIDE OS ?";
  const tokens = tokenize(question);
  const boosts = phraseBoosts(tokens);

  const [decisions, lessons] = await Promise.all([getDecisions(), getLessons()]);
  const allItems = [...decisions, ...lessons];

  const scored = allItems
    .map((item) => scoreItem(item, tokens, boosts, question))
    .sort((a, b) => b._score - a._score);

  const selectedItems = scored.slice(0, TOP_K);
  const memoryContext = buildMemoryContext(selectedItems);

  const prompt = `
Tu es le copilote opérationnel d’INSIDE OS.

Règles NON négociables :
- Réponse MAX 5 lignes
- Zéro blabla
- Zéro répétition
- Tu vas droit au point
- Tu IMPOSSES une action claire, spécifique et immédiatement exécutable
- Tu n’utilises jamais des verbes vagues comme "vérifier", "confirmer", "prioriser"
- Tu donnes une action qui implique un passage à l’acte (ex: créer, décider, appeler, écrire)
- L’ACTION doit être spécifique, concrète et immédiatement exécutable (pas de formulation vague)

Structure OBLIGATOIRE :

ÉTAT :
→ 1 phrase claire sur la situation actuelle

PROBLÈME :
→ 1 phrase sur le blocage principal

ACTION :
→ 1 action immédiate, concrète, exécutable

Contraintes :
- Tu utilises UNIQUEMENT la mémoire fournie
- Tu n’inventes rien
- Si la mémoire est insuffisante, tu le dis en 1 phrase
- Tu privilégies toujours B99 (présent)

MEMORY_CONTEXT
${memoryContext || "[aucune mémoire pertinente]"}

QUESTION
${question}
`;

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  console.log("\n--- DEBUG ---\n");
  console.log(`Question: ${question}`);
  console.log(`Tokens: ${tokens.join(", ") || "[aucun]"}`);
  console.log(`Decisions lues: ${decisions.length}`);
  console.log(`Lessons lues: ${lessons.length}`);
  console.log(`Items sélectionnés: ${selectedItems.length}`);

  console.log("\n--- MEMORY ITEMS ---\n");
  console.log(memoryContext || "[aucune mémoire récupérée]");

  console.log("\n--- REPONSE ---\n");
  console.log(response.output_text);

  const logFile = writeLog({
    question,
    tokens,
    selectedItems,
    responseText: response.output_text,
  });

  console.log(`\n--- LOG ---\n${logFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});