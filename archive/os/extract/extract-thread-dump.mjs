import "dotenv/config";
import OpenAI from "openai";
import {
  queryDatabaseCompat,
  updatePage,
  listAllBlockChildren,
  getPropText,
  rt,
} from "../lib/notion.mjs";

const THREAD_DUMP_DB_ID = process.env.THREAD_DUMP_DB_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const NOTION_API_KEY = process.env.NOTION_API_KEY;

const NOTION_VERSION = "2025-09-03";
const NOTION_API = "https://api.notion.com/v1";
const JSON_PROP_SAFE_LIMIT = 1800;

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

function argFlag(name) {
  return process.argv.includes(name);
}

function argValue(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const DRY_RUN = argFlag("--dry-run");
const FORCE = argFlag("--force");
const LIMIT = Number(argValue("--limit", "10"));
const ONLY = String(argValue("--only", "")).trim().toUpperCase();

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
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`Notion ${res.status}: ${JSON.stringify(json)}`);
  }

  return json;
}

async function appendBlockChildren(blockId, children) {
  return notionRequest(`/blocks/${blockId}/children`, {
    method: "PATCH",
    body: { children },
  });
}

async function deleteBlock(blockId) {
  return notionRequest(`/blocks/${blockId}`, {
    method: "DELETE",
  });
}

function chunkString(value, maxLen = 1800) {
  const chunks = [];
  for (let i = 0; i < value.length; i += maxLen) {
    chunks.push(value.slice(i, i + maxLen));
  }
  return chunks;
}

function blockPlainText(block) {
  if (block.type === "paragraph") {
    return (block.paragraph?.rich_text || []).map((x) => x.plain_text).join("");
  }
  if (block.type === "code") {
    return (block.code?.rich_text || []).map((x) => x.plain_text).join("");
  }
  return "";
}

async function storeJsonInBlocks(pageId, jsonText) {
  const START = "[[EXTRACTION_JSON_START]]";
  const END = "[[EXTRACTION_JSON_END]]";

  const blocks = await listAllBlockChildren(pageId);

  let inExtractionZone = false;
  for (const block of blocks) {
    const text = blockPlainText(block);

    if (text === START) {
      inExtractionZone = true;
      if (!DRY_RUN) await deleteBlock(block.id);
      continue;
    }

    if (text === END) {
      inExtractionZone = false;
      if (!DRY_RUN) await deleteBlock(block.id);
      continue;
    }

    if (inExtractionZone) {
      if (!DRY_RUN) await deleteBlock(block.id);
    }
  }

  const chunks = chunkString(jsonText, 1800);

  const children = [
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: START } }],
      },
    },
    ...chunks.map((chunk) => ({
      object: "block",
      type: "code",
      code: {
        rich_text: [{ type: "text", text: { content: chunk } }],
        language: "json",
      },
    })),
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: END } }],
      },
    },
  ];

  for (let i = 0; i < children.length; i += 100) {
    if (!DRY_RUN) {
      await appendBlockChildren(pageId, children.slice(i, i + 100));
    }
  }
}

async function getCandidates(limit) {
  const filterBase = {
    and: [
      ...(ONLY ? [{ property: "id_dump", rich_text: { equals: ONLY } }] : []),
    ],
  };

  const filterPending = {
    and: [
      ...filterBase.and,
      { property: "extraction_status", select: { does_not_equal: "done" } },
    ],
  };

  const filterForce = filterBase;

  const res = await queryDatabaseCompat(THREAD_DUMP_DB_ID, {
    page_size: Math.min(limit, 50),
    filter: FORCE ? filterForce : filterPending,
    sorts: [{ property: "id_dump", direction: "ascending" }],
  });

  return res.results || [];
}

async function getPageText(page) {
  const rawText = getPropText(page, "raw_text");
  if (rawText && rawText.trim()) return rawText.trim();

  const blocks = await listAllBlockChildren(page.id);
  const parts = [];

  for (const b of blocks) {
    if (b.type === "paragraph") {
      const t = (b.paragraph?.rich_text || []).map((x) => x.plain_text).join("");
      if (t) parts.push(t);
    } else if (b.type === "heading_1") {
      const t = (b.heading_1?.rich_text || []).map((x) => x.plain_text).join("");
      if (t) parts.push(t);
    } else if (b.type === "heading_2") {
      const t = (b.heading_2?.rich_text || []).map((x) => x.plain_text).join("");
      if (t) parts.push(t);
    } else if (b.type === "heading_3") {
      const t = (b.heading_3?.rich_text || []).map((x) => x.plain_text).join("");
      if (t) parts.push(t);
    } else if (b.type === "bulleted_list_item") {
      const t = (b.bulleted_list_item?.rich_text || [])
        .map((x) => x.plain_text)
        .join("");
      if (t) parts.push(`- ${t}`);
    } else if (b.type === "numbered_list_item") {
      const t = (b.numbered_list_item?.rich_text || [])
        .map((x) => x.plain_text)
        .join("");
      if (t) parts.push(`- ${t}`);
    } else if (b.type === "to_do") {
      const t = (b.to_do?.rich_text || []).map((x) => x.plain_text).join("");
      if (t) parts.push(`- ${t}`);
    } else if (b.type === "code") {
      const t = (b.code?.rich_text || []).map((x) => x.plain_text).join("");
      if (t) parts.push(t);
    }
  }

  return parts.join("\n").trim();
}

function extractJsonObject(text) {
  const start = text.indexOf("{");
  if (start < 0) throw new Error("Aucun objet JSON trouvé");

  let depth = 0;
  let inStr = false;
  let esc = false;

  for (let i = start; i < text.length; i++) {
    const c = text[i];

    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }

    if (c === '"') {
      inStr = true;
      continue;
    }

    if (c === "{") depth++;
    if (c === "}") depth--;

    if (depth === 0) return text.slice(start, i + 1);
  }

  throw new Error("JSON non fermé");
}

function cleanOptionalString(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeExtractionPayload(data) {
  const rawDecisions = Array.isArray(data?.decisions) ? data.decisions : [];
  const rawLessons = Array.isArray(data?.lessons) ? data.lessons : [];

  const decisions = rawDecisions
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const decision = cleanOptionalString(item.decision);
      if (!decision) return null;

      const normalized = { decision };

      const rationale = cleanOptionalString(item.rationale);
      if (rationale) normalized.rationale = rationale;

      const evidence = cleanOptionalString(item.evidence);
      if (evidence) normalized.evidence = evidence;

      return normalized;
    })
    .filter(Boolean);

  const lessons = rawLessons
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const lesson = cleanOptionalString(item.lesson);
      if (!lesson) return null;

      const normalized = { lesson };

      const whatHappened = cleanOptionalString(item.what_happened);
      if (whatHappened) normalized.what_happened = whatHappened;

      const evidence = cleanOptionalString(item.evidence);
      if (evidence) normalized.evidence = evidence;

      return normalized;
    })
    .filter(Boolean);

  return {
    decisions,
    lessons,
  };
}

async function callExtractor(text) {
  const MAX_CHARS = 12000;
  const safeText = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

  const prompt = `
Tu extrais des décisions et des leçons à partir d'un thread de travail.

Règles :
- Réponds avec un JSON strict uniquement.
- Pas de markdown.
- Pas de commentaire.
- Pas de texte avant ou après le JSON.
- Si aucune décision ou leçon claire n'existe, renvoie des tableaux vides.
- Sois conservateur : n'invente rien.
- Une décision = un choix, un arbitrage, une orientation validée ou clairement retenue.
- Une leçon = un apprentissage exploitable, une règle pratique, un retour d'expérience utile.

Format attendu :
{
  "decisions": [
    {
      "decision": "string",
      "rationale": "string optionnel",
      "evidence": "string optionnel"
    }
  ],
  "lessons": [
    {
      "lesson": "string",
      "what_happened": "string optionnel",
      "evidence": "string optionnel"
    }
  ]
}

Contraintes :
- "decision" est obligatoire pour chaque item dans "decisions".
- "lesson" est obligatoire pour chaque item dans "lessons".
- "rationale", "what_happened" et "evidence" sont optionnels.
- N'inclus aucun autre champ.

Thread :
"""${safeText}"""
`.trim();

  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });

  const outputText = response.output_text?.trim();
  if (!outputText) throw new Error("Réponse vide du modèle");

  const jsonText = extractJsonObject(outputText);
  const rawData = JSON.parse(jsonText);
  const data = normalizeExtractionPayload(rawData);

  return data;
}

async function markPage(pageId, { status, json, error, model }) {
  const props = {
    extraction_status: { select: { name: status } },
    extraction_model: { select: { name: model || "gpt-4o-mini" } },
  };

  if (json) {
    if (json.length > JSON_PROP_SAFE_LIMIT) {
      if (!DRY_RUN) {
        await storeJsonInBlocks(pageId, json);
      }
      props.extraction_json = rt("Stored in page blocks");
    } else {
      props.extraction_json = rt(json);
    }
  } else {
    props.extraction_json = rt("");
  }

  if (!DRY_RUN) {
    await updatePage(pageId, props);
  }

  if (error) {
    console.warn(`[os:extract] WARN extraction error: ${error}`);
  }
}

async function processOne(page) {
  const dumpId = getPropText(page, "id_dump") || "(unknown)";
  const text = await getPageText(page);

  if (!text) {
    await markPage(page.id, {
      status: "error",
      json: "",
      error: "Aucun texte source trouvé",
      model: "gpt-4o-mini",
    });
    return;
  }

  const data = await callExtractor(text);
  const json = JSON.stringify(data, null, 2);

  await markPage(page.id, {
    status: "done",
    json,
    error: "",
    model: "gpt-4o-mini",
  });

  console.log(
    `[os:extract] ${dumpId}: decisions=${data.decisions.length} lessons=${data.lessons.length}`
  );
}

async function main() {
  if (!THREAD_DUMP_DB_ID) {
    throw new Error("ENV missing: THREAD_DUMP_DB_ID");
  }
  if (!OPENAI_API_KEY) {
    throw new Error("ENV missing: OPENAI_API_KEY");
  }
  if (!NOTION_API_KEY) {
    throw new Error("ENV missing: NOTION_API_KEY");
  }

  console.log(
    `[os:extract] Mode: ${DRY_RUN ? "DRY_RUN" : "LIVE"}${FORCE ? " [FORCE]" : ""}${ONLY ? " [ONLY " + ONLY + "]" : ""}`
  );

  const candidates = await getCandidates(LIMIT);

  if (!candidates.length) {
    if (ONLY) {
      console.log(`[os:extract] Aucun candidat pour --only ${ONLY}`);
    } else {
      console.log("[os:extract] Aucun thread_dump à extraire.");
    }
    return;
  }

  console.log(`[os:extract] Candidats: ${candidates.length}`);

  for (const page of candidates) {
    const dumpId = getPropText(page, "id_dump") || "(unknown)";
    process.stdout.write(`→ Extracting id_dump=${dumpId}...\n`);

    try {
      await processOne(page);
      console.log("  OK");
    } catch (e) {
      console.error("  ERROR:", e.message);
      await markPage(page.id, {
        status: "error",
        json: "",
        error: e.message,
        model: "gpt-4o-mini",
      });
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});