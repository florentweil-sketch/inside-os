// os/extract/extract-thread-dump.mjs
// INSIDE OS — Extraction LLM
// v3 : Claude (Anthropic) + extraction chunk par chunk + parser JSON renforcé

import "dotenv/config";
import {
  queryDataSource,
  updatePage,
  listAllBlockChildren,
  getPropText,
  rt,
} from "../lib/notion.mjs";

const THREAD_DUMP_DS_ID = process.env.THREAD_DUMP_DS_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const NOTION_API_KEY    = process.env.NOTION_API_KEY;

const NOTION_VERSION       = "2025-09-03";
const NOTION_API           = "https://api.notion.com/v1";
const CLAUDE_MODEL         = "claude-sonnet-4-5";
const JSON_PROP_SAFE_LIMIT = 1800;

// Seuil a partir duquel on active l'extraction chunk par chunk (en caracteres)
const SHRUNK_THRESHOLD  = 12000;
// Taille max des chunks envoyes a Claude pour l'extraction
const SHRUNK_CHUNK_SIZE = 20000;

// Retry progressif : tokens par tentative (extraction directe et chunks)
// A chaque echec JSON, on passe a la tentative suivante avec plus de tokens
const RETRY_TOKEN_STEPS = [4000, 6000, 8000, 10000];

// ─── ARGS ────────────────────────────────────────────────────────────────────

function argFlag(name)  { return process.argv.includes(name); }
function argValue(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const DRY_RUN = argFlag("--dry-run");
const FORCE   = argFlag("--force");
const LIMIT   = Number(argValue("--limit", "10"));
const ONLY    = String(argValue("--only", "")).trim().toUpperCase();

// ─── NOTION ──────────────────────────────────────────────────────────────────

async function notionRequest(path, { method = "GET", body } = {}) {
  const res = await fetch(NOTION_API + path, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try   { json = text ? JSON.parse(text) : {}; }
  catch { json = { raw: text }; }

  if (!res.ok) throw new Error(`Notion ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function appendBlockChildren(blockId, children) {
  return notionRequest(`/blocks/${blockId}/children`, {
    method: "PATCH",
    body: { children },
  });
}

async function deleteBlock(blockId) {
  return notionRequest(`/blocks/${blockId}`, { method: "DELETE" });
}

function chunkString(value, maxLen = 1800) {
  const chunks = [];
  for (let i = 0; i < value.length; i += maxLen) chunks.push(value.slice(i, i + maxLen));
  return chunks;
}

function blockPlainText(block) {
  if (block.type === "paragraph") return (block.paragraph?.rich_text || []).map(x => x.plain_text).join("");
  if (block.type === "code")      return (block.code?.rich_text || []).map(x => x.plain_text).join("");
  return "";
}

async function storeJsonInBlocks(pageId, jsonText) {
  const START = "[[EXTRACTION_JSON_START]]";
  const END   = "[[EXTRACTION_JSON_END]]";

  const blocks = await listAllBlockChildren(pageId);
  let inZone = false;
  for (const block of blocks) {
    const text = blockPlainText(block);
    if (text === START) { inZone = true;  if (!DRY_RUN) await deleteBlock(block.id); continue; }
    if (text === END)   { inZone = false; if (!DRY_RUN) await deleteBlock(block.id); continue; }
    if (inZone && !DRY_RUN) await deleteBlock(block.id);
  }

  const chunks   = chunkString(jsonText, 1800);
  const children = [
    { object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: START } }] } },
    ...chunks.map(chunk => ({ object: "block", type: "code", code: { rich_text: [{ type: "text", text: { content: chunk } }], language: "json" } })),
    { object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: END } }] } },
  ];

  for (let i = 0; i < children.length; i += 100) {
    if (!DRY_RUN) await appendBlockChildren(pageId, children.slice(i, i + 100));
  }
}

async function getCandidates(limit) {
  const baseFilter = ONLY ? [{ property: "id_dump", rich_text: { equals: ONLY } }] : [];
  const filter = FORCE
    ? { and: baseFilter }
    : { and: [...baseFilter, { property: "extraction_status", select: { does_not_equal: "done" } }] };

  const res = await queryDataSource(THREAD_DUMP_DS_ID, {
    page_size: Math.min(limit, 50),
    filter,
    sorts: [{ property: "id_dump", direction: "ascending" }],
  });
  return res.results || [];
}

async function getPageText(page) {
  // Ne jamais lire raw_text — tronque a 2000 chars par Notion
  // Le texte complet est toujours dans les blocs de la page
  const blocks = await listAllBlockChildren(page.id);
  const parts  = [];
  for (const b of blocks) {
    const types = ["paragraph", "heading_1", "heading_2", "heading_3",
                   "bulleted_list_item", "numbered_list_item", "to_do", "code"];
    if (!types.includes(b.type)) continue;
    const rt = b[b.type]?.rich_text || [];
    const t  = rt.map(x => x.plain_text).join("");
    if (t) parts.push(b.type.startsWith("bulleted") || b.type.startsWith("numbered") ? `- ${t}` : t);
  }
  return parts.join("\n").trim();
}

// ─── CLAUDE ──────────────────────────────────────────────────────────────────

async function callClaude(prompt, maxTokens = 4000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text?.trim() || "";
}

// Retry progressif : tente l'extraction JSON avec des tokens croissants.
// buildPrompt(attemptIndex) doit retourner le prompt adapte a la tentative.
//   attempt 0 -> prompt riche (contexte complet)
//   attempt 1+ -> prompt minimal (plus strict, moins de bruit)
// A chaque echec de parse JSON, on passe au palier suivant.
async function callClaudeWithRetry(buildPrompt, steps) {
  const tokenSteps = steps || RETRY_TOKEN_STEPS;
  let lastError;

  for (let i = 0; i < tokenSteps.length; i++) {
    const tokens  = tokenSteps[i];
    const prompt  = buildPrompt(i);
    const attempt = i + 1;

    try {
      const output = await callClaude(prompt, tokens);
      const parsed = parseJsonRobust(output);
      if (attempt > 1) {
        console.log(`  [extract] OK a la tentative ${attempt}/${tokenSteps.length} (${tokens} tokens)`);
      }
      return parsed;
    } catch (e) {
      lastError = e;
      if (attempt < tokenSteps.length) {
        console.warn(`  [extract] Tentative ${attempt}/${tokenSteps.length} echouee (${tokens} tokens) -- retry ${tokenSteps[i + 1]} tokens...`);
      }
    }
  }

  throw new Error(`JSON non parseable apres ${tokenSteps.length} tentatives : ${lastError?.message}`);
}

// ─── PARSER JSON ROBUSTE ─────────────────────────────────────────────────────
// Gere les cas ou le modele produit un JSON mal ferme ou avec des caracteres
// residuels. Trois strategies en cascade.

/**
 * Strategie 1 : extraction par parsing de caracteres (robuste aux prefixes/suffixes)
 */
function extractJsonObject(text) {
  const start = text.indexOf("{");
  if (start < 0) throw new Error("Aucun objet JSON trouve");

  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc)             esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"')  inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === "{") depth++;
    if (c === "}") depth--;
    if (depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("JSON non ferme");
}

/**
 * Strategie 2 : nettoyage des strings JSON avant parsing
 * Corrige les retours a la ligne et guillemets non echappes dans les valeurs
 */
function sanitizeJsonStrings(text) {
  // Remplace les retours a la ligne litteraux dans les strings JSON par \n
  // Remplace les tabulations par \t
  return text
    .replace(/("(?:[^"\\]|\\.)*")|([^"]+)/g, (match, strPart, nonStrPart) => {
      if (strPart) {
        // Dans une string JSON : echapper les retours a la ligne non echappes
        return strPart
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t");
      }
      return nonStrPart;
    });
}

/**
 * Strategie 3 : fermeture forcee d'un JSON tronque
 * Tente de fermer un JSON incomplet en ajoutant les tokens manquants
 */
function forceCloseJson(text) {
  // Compter les accolades et crochets ouverts
  let braces = 0, brackets = 0, inStr = false, esc = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc)             esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"')  inStr = false;
      continue;
    }
    if (c === '"')  { inStr = true; continue; }
    if (c === "{")  braces++;
    if (c === "}")  braces--;
    if (c === "[")  brackets++;
    if (c === "]")  brackets--;
  }

  // Si on est dans une string non fermee, fermer proprement
  let result = text;
  if (inStr) result += '"';

  // Fermer les crochets et accolades manquants
  for (let i = 0; i < brackets; i++) result += "]";
  for (let i = 0; i < braces; i++)   result += "}";

  return result;
}

/**
 * Parse un JSON produit par le LLM avec 3 strategies en cascade.
 * Leve une erreur seulement si les 3 strategies echouent.
 */
function parseJsonRobust(rawText) {
  // Strategie 1 : extraction directe
  try {
    const extracted = extractJsonObject(rawText);
    return JSON.parse(extracted);
  } catch (_) {}

  // Strategie 2 : nettoyage des strings puis extraction
  try {
    const sanitized = sanitizeJsonStrings(rawText);
    const extracted = extractJsonObject(sanitized);
    return JSON.parse(extracted);
  } catch (_) {}

  // Strategie 3 : fermeture forcee
  try {
    const start = rawText.indexOf("{");
    if (start >= 0) {
      const partial = rawText.slice(start);
      const forced  = forceCloseJson(partial);
      return JSON.parse(forced);
    }
  } catch (_) {}

  throw new Error("JSON non parseable apres 3 strategies");
}

// ─── EXTRACTION ──────────────────────────────────────────────────────────────

async function extractFromChunk(chunk, index, total, dumpId) {
  const lines = [
    "Tu extrais des decisions et des lecons a partir d'une partie d'un thread de travail.",
    "",
    "Regles importantes :",
    "- Conserve TOUS les noms propres, dates, montants et references specifiques dans les champs rationale et evidence.",
    "- Une decision = un choix, un arbitrage, une orientation validee ou clairement retenue.",
    "- Une lecon = un apprentissage exploitable, une regle pratique, un retour d'experience utile.",
    "- N'invente rien. Si aucune decision ou lecon claire n'existe, renvoie des tableaux vides.",
    "- Reponds avec un JSON strict UNIQUEMENT. Pas de markdown, pas de commentaire, pas de texte avant ou apres.",
    "- Toutes les valeurs string doivent etre sur une seule ligne (pas de retour a la ligne dans les valeurs).",
    "- Les guillemets dans les valeurs doivent etre echappes : \\\"",
    "",
    "Format attendu (respecte-le exactement) :",
    "{",
    '  "decisions": [{ "decision": "string", "rationale": "string optionnel", "evidence": "string optionnel" }],',
    '  "lessons": [{ "lesson": "string", "what_happened": "string optionnel", "evidence": "string optionnel" }]',
    "}",
    "",
    `Partie ${index + 1}/${total} du thread "${dumpId}" :`,
    `"""${chunk}"""`,
  ];
  return callClaude(lines.join("\n"), 4000);
}

function mergeExtractions(extractionResults) {
  const decisions    = [];
  const lessons      = [];
  const seenDecisions = new Set();
  const seenLessons   = new Set();

  for (const data of extractionResults) {
    for (const d of (data.decisions || [])) {
      const key = d.decision.trim().toLowerCase().slice(0, 80);
      if (!seenDecisions.has(key)) { seenDecisions.add(key); decisions.push(d); }
    }
    for (const l of (data.lessons || [])) {
      const key = l.lesson.trim().toLowerCase().slice(0, 80);
      if (!seenLessons.has(key)) { seenLessons.add(key); lessons.push(l); }
    }
  }

  return { decisions, lessons };
}

function cleanOptionalString(value) {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

function normalizeExtractionPayload(data) {
  const decisions = (Array.isArray(data?.decisions) ? data.decisions : [])
    .filter(x => x && typeof x === "object")
    .map(x => {
      const decision = cleanOptionalString(x.decision);
      if (!decision) return null;
      const out = { decision };
      const r = cleanOptionalString(x.rationale); if (r) out.rationale = r;
      const e = cleanOptionalString(x.evidence);  if (e) out.evidence  = e;
      return out;
    }).filter(Boolean);

  const lessons = (Array.isArray(data?.lessons) ? data.lessons : [])
    .filter(x => x && typeof x === "object")
    .map(x => {
      const lesson = cleanOptionalString(x.lesson);
      if (!lesson) return null;
      const out = { lesson };
      const w = cleanOptionalString(x.what_happened); if (w) out.what_happened = w;
      const e = cleanOptionalString(x.evidence);      if (e) out.evidence      = e;
      return out;
    }).filter(Boolean);

  return { decisions, lessons };
}

// ─── MARK PAGE ───────────────────────────────────────────────────────────────

async function markPage(pageId, { status, json, error, model }) {
  const props = {
    extraction_status: { select: { name: status } },
    extraction_model:  { select: { name: model || CLAUDE_MODEL } },
  };

  if (json) {
    if (json.length > JSON_PROP_SAFE_LIMIT) {
      if (!DRY_RUN) await storeJsonInBlocks(pageId, json);
      props.extraction_json = rt("Stored in page blocks");
    } else {
      props.extraction_json = rt(json);
    }
  } else {
    props.extraction_json = rt("");
  }

  if (!DRY_RUN) await updatePage(pageId, props);
  if (error) console.warn(`[os:extract] WARN: ${error}`);
}

// ─── PROCESS ─────────────────────────────────────────────────────────────────

async function processOne(page) {
  const dumpId = getPropText(page, "id_dump") || "(unknown)";
  const text   = await getPageText(page);

  if (!text) {
    await markPage(page.id, { status: "error", json: "", error: "Aucun texte source trouve", model: CLAUDE_MODEL });
    return;
  }

  let data;

  if (text.length <= SHRUNK_THRESHOLD) {
    // Thread court : extraction directe avec retry progressif (RETRY_TOKEN_STEPS)
    // attempt 0 -> prompt riche, attempt 1+ -> prompt minimal plus strict
    const buildDirectPrompt = (attempt) => {
      const threadBlock = '"""' + text + '"""';
      if (attempt === 0) {
        return [
          "Tu extrais des decisions et des lecons a partir d'un thread de travail.",
          "Regle : conserve TOUS les noms propres, dates, montants dans les champs rationale/evidence.",
          "JSON strict uniquement. Pas de markdown. Pas de texte avant ou apres le JSON.",
          "Toutes les valeurs string doivent etre sur une seule ligne. Guillemets echappes \\\".",
          'Format: {"decisions":[{"decision":"...","rationale":"...","evidence":"..."}],"lessons":[{"lesson":"...","what_happened":"...","evidence":"..."}]}',
          "Thread:\n" + threadBlock,
        ].join("\n");
      }
      return [
        "Extrais decisions et lecons. JSON STRICT uniquement, AUCUN texte avant ou apres.",
        "Toutes les valeurs string sur une seule ligne. Guillemets echappes \\\".",
        'Format EXACT : {"decisions":[{"decision":"...","rationale":"...","evidence":"..."}],"lessons":[{"lesson":"...","what_happened":"...","evidence":"..."}]}',
        'Si rien a extraire : {"decisions":[],"lessons":[]}',
        "Thread:\n" + threadBlock,
      ].join("\n");
    };

    const rawData = await callClaudeWithRetry(buildDirectPrompt);
    data = normalizeExtractionPayload(rawData);

  } else {
    // Thread long : extraction chunk par chunk + fusion
    const chunks = [];
    for (let i = 0; i < text.length; i += SHRUNK_CHUNK_SIZE) chunks.push(text.slice(i, i + SHRUNK_CHUNK_SIZE));
    console.log(`  [extract] Thread long (${text.length} chars) -- ${chunks.length} chunk(s)`);

    const extractionResults = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`  [extract] Chunk ${i + 1}/${chunks.length}...`);

      let chunkData = null;

      // Retry progressif sur le chunk (RETRY_TOKEN_STEPS)
      // attempt 0 -> prompt complet avec contexte, attempt 1+ -> prompt minimal + texte tronque
      try {
        const chunkBlock   = '"""' + chunks[i] + '"""';
        const truncBlock   = '"""' + chunks[i].slice(0, 15000) + '"""';
        const chunkContext = `Partie ${i + 1}/${chunks.length} du thread "${dumpId}" :`;

        const buildChunkPrompt = (attempt) => {
          if (attempt === 0) {
            return [
              "Tu extrais des decisions et des lecons a partir d'une partie d'un thread de travail.",
              "Regle : conserve TOUS les noms propres, dates, montants dans les champs rationale/evidence.",
              "JSON strict UNIQUEMENT. Pas de markdown, pas de texte avant ou apres.",
              "Toutes les valeurs string sur une seule ligne. Guillemets echappes \\\".",
              'Format: {"decisions":[{"decision":"...","rationale":"...","evidence":"..."}],"lessons":[{"lesson":"...","what_happened":"...","evidence":"..."}]}',
              chunkContext,
              chunkBlock,
            ].join("\n");
          }
          return [
            "Extrais decisions et lecons. JSON STRICT uniquement, AUCUN texte avant ou apres.",
            "Toutes les valeurs string sur une seule ligne. Guillemets echappes \\\".",
            'Format EXACT : {"decisions":[{"decision":"...","rationale":"...","evidence":"..."}],"lessons":[{"lesson":"...","what_happened":"...","evidence":"..."}]}',
            'Si rien a extraire : {"decisions":[],"lessons":[]}',
            truncBlock,
          ].join("\n");
        };

        const rawData = await callClaudeWithRetry(buildChunkPrompt);
        chunkData = normalizeExtractionPayload(rawData);
      } catch (e) {
        console.warn(`  [extract] Chunk ${i + 1} echec apres tous les retries (${e.message}) -- chunk ignore`);
      }

      if (chunkData) {
        extractionResults.push(chunkData);
        console.log(`  [extract] Chunk ${i + 1}: decisions=${chunkData.decisions.length} lessons=${chunkData.lessons.length}`);
      }
    }

    data = mergeExtractions(extractionResults);
    console.log(`  [extract] Apres fusion: decisions=${data.decisions.length} lessons=${data.lessons.length}`);
  }

  const json = JSON.stringify(data, null, 2);
  await markPage(page.id, { status: "done", json, error: "", model: CLAUDE_MODEL });
  console.log(`[os:extract] ${dumpId}: decisions=${data.decisions.length} lessons=${data.lessons.length}`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  if (!THREAD_DUMP_DS_ID)  throw new Error("ENV missing: THREAD_DUMP_DS_ID");
  if (!ANTHROPIC_API_KEY)  throw new Error("ENV missing: ANTHROPIC_API_KEY");
  if (!NOTION_API_KEY)     throw new Error("ENV missing: NOTION_API_KEY");

  console.log(`[os:extract] Mode: ${DRY_RUN ? "DRY_RUN" : "LIVE"}${FORCE ? " [FORCE]" : ""}${ONLY ? " [ONLY " + ONLY + "]" : ""}`);
  console.log(`[os:extract] Modele: ${CLAUDE_MODEL}`);
  console.log(`[os:extract] Seuil extraction directe: ${SHRUNK_THRESHOLD} chars\n`);

  const candidates = await getCandidates(LIMIT);

  if (!candidates.length) {
    console.log(ONLY
      ? `[os:extract] Aucun candidat pour --only ${ONLY}`
      : "[os:extract] Aucun thread_dump a extraire."
    );
    return;
  }

  console.log(`[os:extract] Candidats: ${candidates.length}\n`);

  for (const page of candidates) {
    const dumpId = getPropText(page, "id_dump") || "(unknown)";
    process.stdout.write(`-> Extracting id_dump=${dumpId}...\n`);
    try {
      await processOne(page);
      console.log("  OK\n");
    } catch (e) {
      console.error("  ERROR:", e.message, "\n");
      await markPage(page.id, { status: "error", json: "", error: e.message, model: CLAUDE_MODEL });
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
