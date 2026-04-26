// os/chat/notion-memory-server.mjs
// INSIDE OS — API HTTP
// Expose POST /chat pour permettre à n'importe quel agent IA d'interroger la mémoire Notion
// Remplace OpenAI par Claude (Anthropic)

import "dotenv/config";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { queryDataSource, getPropText } from "../lib/notion.mjs";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const PORT = process.env.CHAT_PORT || 3000;
const FETCH_LIMIT = 200;
const TOP_K = 12;
const LOG_DIR = "runtime/logs/chat";
const CLAUDE_MODEL = "claude-sonnet-4-5";

// ─── UTILS ───────────────────────────────────────────────────────────────────

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
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  const stop = new Set([
    "le", "la", "les", "de", "des", "du", "un", "une", "et", "ou", "a", "à",
    "en", "dans", "sur", "pour", "par", "avec", "est", "sont", "que", "qui",
    "quoi", "où", "au", "aux", "ce", "cet", "cette", "ces", "il", "elle",
    "on", "nous", "vous", "ils", "elles", "je", "tu", "mon", "ton", "son",
    "ma", "ta", "sa", "mes", "tes", "ses", "nos", "vos", "leurs", "ne", "pas",
    "plus", "moins", "the", "and", "or", "of", "to", "in", "is", "are", "os",
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
  if (joined.includes("inside"))           boosts.push("inside");
  if (joined.includes("memoire") || joined.includes("conversationnelle"))
                                           boosts.push("memoire", "conversationnelle");
  if (joined.includes("notion"))           boosts.push("notion");
  if (joined.includes("v0") || joined.includes("v1") || joined.includes("beta"))
                                           boosts.push("v0", "v1", "beta");
  if (joined.includes("pipeline"))         boosts.push("pipeline");
  if (joined.includes("extract"))          boosts.push("extract");
  if (joined.includes("inject"))           boosts.push("inject");
  return boosts;
}

function isPresentDump(id)  { return String(id || "").toUpperCase().startsWith("B99-"); }
function isOldDump(id)      { const s = String(id || "").toUpperCase(); return s.startsWith("B01-") || s.startsWith("B02-"); }
function isStateDump(id)    { return String(id || "").toUpperCase().startsWith("B99-T05"); }

function questionTargetsCurrentSystem(q) {
  const n = normalizeText(q);
  return ["memoire", "conversationnelle", "v0", "v1", "beta", "pipeline",
          "extract", "inject", "inside os", "aujourd", "etat"].some(k => n.includes(k));
}

// ─── NOTION ──────────────────────────────────────────────────────────────────

async function fetchAllPages(dataSourceId, mapper) {
  const all = [];
  let cursor = undefined;
  while (true) {
    const payload = { page_size: 100 };
    if (cursor) payload.start_cursor = cursor;
    const res = await queryDataSource(dataSourceId, payload);
    for (const page of (res.results || [])) all.push(mapper(page));
    if (!res.has_more) break;
    cursor = res.next_cursor;
  }
  return all;
}

async function getDecisions() {
  return fetchAllPages(process.env.DECISIONS_DS_ID, (page) => ({
    type: "decision",
    uid:           getPropText(page, "uid"),
    decision:      getPropText(page, "decision"),
    rationale:     getPropText(page, "rationale"),
    evidence:      getPropText(page, "evidence"),
    source_thread: getPropText(page, "source_thread"),
    source_dump_id:getPropText(page, "source_dump_id"),
  }));
}

async function getLessons() {
  return fetchAllPages(process.env.LESSONS_DS_ID, (page) => ({
    type: "lesson",
    uid:           getPropText(page, "uid"),
    lesson:        getPropText(page, "lesson"),
    what_happened: getPropText(page, "what_happened"),
    evidence:      getPropText(page, "evidence"),
    source_thread: getPropText(page, "source_thread"),
    source_dump_id:getPropText(page, "source_dump_id"),
  }));
}

// ─── SCORING ─────────────────────────────────────────────────────────────────

function scoreItem(item, tokens, boosts, question) {
  const primaryText   = item.type === "decision"
    ? `${item.decision} ${item.rationale}`
    : `${item.lesson} ${item.what_happened}`;
  const secondaryText = `${item.evidence} ${item.source_thread} ${item.source_dump_id}`;

  const primary   = normalizeText(primaryText);
  const secondary = normalizeText(secondaryText);
  const all       = normalizeText(`${primaryText} ${secondaryText}`);

  let score = 0;
  const hits = [];

  for (const token of tokens) {
    if (primary.includes(token))        { score += 8; hits.push(token); }
    else if (secondary.includes(token)) { score += 4; hits.push(token); }
    else if (all.includes(token))       { score += 2; }
  }
  for (const boost of boosts) {
    if (primary.includes(boost))        { score += 6; hits.push(`boost:${boost}`); }
    else if (secondary.includes(boost)) { score += 3; hits.push(`boost:${boost}`); }
  }

  if (item.type === "decision")  score += 2;
  if (item.source_thread)        score += 1;
  if (item.source_dump_id)       score += 1;
  if (item.uid)                  score += 1;

  if (isPresentDump(item.source_dump_id)) {
    if (questionTargetsCurrentSystem(question)) {
      score += 20; hits.push("present:B99");
    } else {
      score += 3;
    }
  }
  if (isStateDump(item.source_dump_id) && questionTargetsCurrentSystem(question)) {
    score += 40; hits.push("state:boost");
  }
  if (questionTargetsCurrentSystem(question) && isPresentDump(item.source_dump_id)) {
    score += 12; hits.push("present:system");
  }
  if (questionTargetsCurrentSystem(question) && isOldDump(item.source_dump_id)) {
    score -= 4; hits.push("old-history");
  }

  return { ...item, _score: score, _hits: Array.from(new Set(hits)) };
}

function buildMemoryContext(items) {
  return items.map((item, i) => {
    const base = [
      `[MEMORY_ITEM_${i + 1}]`,
      `type: ${item.type}`,
      `score: ${item._score}`,
      `uid: ${item.uid || ""}`,
      `source_thread: ${item.source_thread || ""}`,
      `source_dump_id: ${item.source_dump_id || ""}`,
    ];
    if (item.type === "decision") {
      base.push(`decision: ${item.decision || ""}`, `rationale: ${item.rationale || ""}`, `evidence: ${item.evidence || ""}`);
    } else {
      base.push(`lesson: ${item.lesson || ""}`, `what_happened: ${item.what_happened || ""}`, `evidence: ${item.evidence || ""}`);
    }
    return base.join("\n");
  }).join("\n\n");
}

// ─── CLAUDE ──────────────────────────────────────────────────────────────────

function buildPrompt(question, memoryContext, mode) {
  const memory = memoryContext || "[aucune mémoire pertinente]";

  if (mode === "synthese") {
    return `Tu es le copilote personnel de Florent, avec accès à sa mémoire stratégique complète.

Tu réponds en prose libre, naturelle et précise. Pas de structure imposée.
Tu utilises UNIQUEMENT les informations présentes dans la mémoire fournie.
Tu n'inventes rien. Si une information manque, tu le signales brièvement.
Tu cites les faits concrets : noms, dates, montants, décisions — quand ils sont disponibles.
Réponse entre 3 et 10 phrases selon la richesse de la mémoire.

MÉMOIRE
${memory}

QUESTION
${question}`;
  }

  if (mode === "liste") {
    return `Tu es le copilote personnel de Florent, avec accès à sa mémoire stratégique complète.

Tu réponds sous forme de liste à puces claire et concise.
Chaque point = 1 fait, 1 décision ou 1 apprentissage concret issu de la mémoire.
Tu utilises UNIQUEMENT les informations présentes dans la mémoire fournie.
Tu n'inventes rien. Maximum 10 points.

MÉMOIRE
${memory}

QUESTION
${question}`;
  }

  // Mode par défaut : pilotage (ÉTAT / PROBLÈME / ACTION)
  return `Tu es le copilote opérationnel d'INSIDE OS.

Règles NON négociables :
- Réponse MAX 5 lignes
- Zéro blabla, zéro répétition
- Tu vas droit au point
- Tu imposes une action claire, spécifique et immédiatement exécutable
- Tu n'utilises jamais des verbes vagues comme "vérifier", "confirmer", "prioriser"
- Tu donnes une action qui implique un passage à l'acte (ex: créer, décider, appeler, écrire)

Structure OBLIGATOIRE :

ÉTAT :
→ 1 phrase claire sur la situation actuelle

PROBLÈME :
→ 1 phrase sur le blocage principal

ACTION :
→ 1 action immédiate, concrète, exécutable

Contraintes :
- Tu utilises UNIQUEMENT la mémoire fournie
- Tu n'inventes rien
- Si la mémoire est insuffisante, tu le dis en 1 phrase
- Tu privilégies toujours B99 (présent)

MEMORY_CONTEXT
${memory}

QUESTION
${question}`;
}

async function askClaude(question, memoryContext, mode = "pilotage") {
  const prompt = buildPrompt(question, memoryContext, mode);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ─── LOG ─────────────────────────────────────────────────────────────────────

function writeLog({ question, tokens, selectedItems, responseText }) {
  ensureLogDir();
  const filename = path.join(LOG_DIR, `${nowStamp()}_chat_server.txt`);
  const content = [
    `QUESTION: ${question}`, "",
    `TOKENS: ${tokens.join(", ")}`, "",
    `SELECTED_ITEMS: ${selectedItems.length}`, "",
    ...selectedItems.map((item, i) => [
      `--- ITEM ${i + 1} ---`,
      `type: ${item.type}`,
      `score: ${item._score}`,
      `uid: ${item.uid || ""}`,
      item.type === "decision" ? `decision: ${item.decision || ""}` : `lesson: ${item.lesson || ""}`,
      `source_dump_id: ${item.source_dump_id || ""}`, "",
    ].join("\n")),
    `--- RESPONSE ---`,
    responseText, "",
  ].join("\n");

  fs.writeFileSync(filename, content, "utf8");
  return filename;
}

// ─── CORE HANDLER ────────────────────────────────────────────────────────────

async function handleChat(question, mode = "pilotage") {
  const tokens = tokenize(question);
  const boosts = phraseBoosts(tokens);

  const [decisions, lessons] = await Promise.all([getDecisions(), getLessons()]);
  const allItems = [...decisions, ...lessons];

  const scored = allItems
    .map((item) => scoreItem(item, tokens, boosts, question))
    .sort((a, b) => b._score - a._score);

  const selectedItems = scored.slice(0, TOP_K);
  const memoryContext = buildMemoryContext(selectedItems);
  const responseText  = await askClaude(question, memoryContext, mode);

  writeLog({ question, tokens, selectedItems, responseText });

  return {
    response: responseText,
    mode,
    debug: {
      tokens,
      decisions_read: decisions.length,
      lessons_read:   lessons.length,
      items_selected: selectedItems.length,
      total_memory: decisions.length + lessons.length,
    },
  };
}

// ─── HTTP SERVER ─────────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type":  "application/json",
    "Content-Length": Buffer.byteLength(payload),
    "Access-Control-Allow-Origin": "*",
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" });
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && req.url === "/health") {
    return send(res, 200, { status: "ok", system: "INSIDE OS", model: CLAUDE_MODEL });
  }

  // Chat endpoint
  if (req.method === "POST" && req.url === "/chat") {
    try {
      const body = await readBody(req);
      const question = String(body.question || "").trim();
      if (!question) return send(res, 400, { error: "question manquante" });

      const mode = ["synthese", "liste", "pilotage"].includes(body.mode) ? body.mode : "pilotage";
      const result = await handleChat(question, mode);
      return send(res, 200, result);
    } catch (err) {
      console.error("[ERROR]", err.message);
      return send(res, 500, { error: err.message });
    }
  }

  return send(res, 404, { error: "endpoint inconnu — utilisez POST /chat" });
});

server.listen(PORT, () => {
  console.log(`INSIDE OS — serveur démarré sur http://localhost:${PORT}`);
  console.log(`  POST /chat  { "question": "..." }`);
  console.log(`  GET  /health`);
});
