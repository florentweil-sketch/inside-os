require('dotenv').config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.THREAD_DUMP_DB_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!NOTION_TOKEN || !DB_ID || !OPENAI_API_KEY) {
  console.error("Missing NOTION_TOKEN, THREAD_DUMP_DB_ID, or OPENAI_API_KEY");
  process.exit(1);
}

async function notion(path, method = 'GET', body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Notion ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function openaiChat({ model, messages }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages,
      response_format: { type: "json_object" },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${text}`);
  return JSON.parse(text);
}

function buildPrompt(rawText) {
  return [
    "Tu extrais un thread brut et tu produis UNIQUEMENT un JSON valide.",
    "Objectif: préparer l'alimentation des DB métiers (decisions, lessons, projects...).",
    "Règles:",
    "- Pas de prose hors JSON.",
    "- Champs vides = [] ou \"\".",
    "- Si incertain: mets confidence=\"low\" et note dans notes.",
    "",
    "JSON attendu (STRICT):",
    "{",
    "  \"decisions\": [",
    "    {",
    "      \"decision\": \"...\",",
    "      \"rationale\": \"...\",",
    "      \"owner\": \"...\",",
    "      \"consequences\": \"...\",",
    "      \"evidence\": \"...\",",
    "      \"confidence\": \"high|medium|low\"",
    "    }",
    "  ],",
    "  \"lessons\": [",
    "    {",
    "      \"lesson\": \"...\",",
    "      \"what_happened\": \"...\",",
    "      \"severity\": \"low|medium|high\",",
    "      \"evidence\": \"...\",",
    "      \"confidence\": \"high|medium|low\"",
    "    }",
    "  ]",
    "}",
    "",
    "Règles STRICTES:",
    "- OUTPUT = JSON uniquement. Zéro prose, zéro markdown.",
    "- ZÉRO hallucination: chaque item DOIT avoir evidence = extrait du thread (copié ou quasi-copié).",
    "- Si tu ne peux pas fournir evidence pour un item => tu NE l'inclus PAS.",
    "- Champs requis (sinon item exclu):",
    "  - decision: decision, rationale, owner, evidence",
    "  - lesson: lesson, what_happened, severity, evidence",
    "- consequences peut être \"\" mais le champ doit exister.",
    "- severity doit être EXACTEMENT low|medium|high.",
    "- Si rien ne qualifie: decisions=[] et lessons=[].",
    "",
    "THREAD BRUT:",
    rawText
  ].join("\n");
}

async function findByIdDump(idDump) {
  const body = {
    filter: { property: "id_dump", rich_text: { equals: idDump } },
    page_size: 1
  };
  const out = await notion(`/databases/${DB_ID}/query`, "POST", body);
  return out.results?.[0];
}

async function updatePage(pageId, props) {
  return notion(`/pages/${pageId}`, "PATCH", { properties: props });
}

/**
 * Lit le BODY de la page (blocks children) et concatène les rich_text.
 * Stoppe dès qu'on atteint la section "EXTRACTION_JSON (chunked)" pour éviter d'ingérer l'output.
 */
async function getRawTextFromPage(pageId) {
  let cursor = undefined;
  const chunks = [];
  let stop = false;

  while (!stop) {
    const q = cursor ? `?start_cursor=${cursor}` : "";
    const data = await notion(`/blocks/${pageId}/children${q}`, "GET");

    for (const b of data.results || []) {
      if (b.type === "heading_2") {
        const t = (b.heading_2?.rich_text || [])
          .map(x => x.plain_text)
          .join("")
          .trim();
        if (t === "EXTRACTION_JSON (chunked)") {
          stop = true;
          break;
        }
      }

      const rt = b[b.type]?.rich_text;
      if (Array.isArray(rt) && rt.length) {
        chunks.push(rt.map(x => x.plain_text).join(""));
      }
    }

    if (stop) break;
    if (!data.has_more) break;
    cursor = data.next_cursor;
  }

  return chunks.join("\n").trim();
}

function chunkString(str, size = 1800) {
  const out = [];
  for (let i = 0; i < str.length; i += size) out.push(str.slice(i, i + size));
  return out;
}

async function appendBlocks(pageId, children) {
  return notion(`/blocks/${pageId}/children`, "PATCH", { children });
}

async function writeExtractionAsChunkedCodeBlocks(pageId, parsed) {
  const json = JSON.stringify(parsed, null, 2);
  const chunks = chunkString(json, 1800);

  const blocks = [
    { object: "block", type: "divider", divider: {} },
    {
      object: "block",
      type: "heading_2",
      heading_2: { rich_text: [{ type: "text", text: { content: "EXTRACTION_JSON (chunked)" } }] },
    },
  ];

  for (let i = 0; i < chunks.length; i++) {
    blocks.push({
      object: "block",
      type: "code",
      code: {
        language: "json",
        rich_text: [
          { type: "text", text: { content: `/* chunk ${i + 1}/${chunks.length} */\n${chunks[i]}` } },
        ],
      },
    });
  }

  await appendBlocks(pageId, blocks);
  return { json_len: json.length, chunks: chunks.length };
}

async function main() {
  const idDump = process.argv[2];
  const model = process.argv[3] || "gpt-4o-mini";

  if (!idDump) {
    console.error("Usage: node scripts/extract-thread-dump.cjs <ID_DUMP> [model]");
    process.exit(1);
  }

  const page = await findByIdDump(idDump);
  if (!page) throw new Error(`No thread_dump page found for id_dump=${idDump}`);

  await updatePage(page.id, {
    extraction_status: { select: { name: "pending" } },
    extraction_model: { select: { name: model } },
    review_required: { checkbox: true },
  });

  const raw = await getRawTextFromPage(page.id);
  if (!raw) throw new Error("No raw page content found (page blocks empty).");

  const prompt = buildPrompt(raw);

  const completion = await openaiChat({
    model,
    messages: [
      { role: "system", content: "Tu es un extracteur strict. Tu retournes UNIQUEMENT un JSON valide conforme au schéma demandé. Tu n'inventes rien. Evidence obligatoire sinon exclusion." },
      { role: "user", content: prompt }
    ]
  });

  const content = completion.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty OpenAI response content.");

  let parsed;
  try { parsed = JSON.parse(content); }
  catch { throw new Error("OpenAI did not return valid JSON."); }

  const meta = await writeExtractionAsChunkedCodeBlocks(page.id, parsed);

  await updatePage(page.id, {
    extraction_json: {
      rich_text: [{
        type: "text",
        text: { content: `Stored in page blocks. len=${meta.json_len}, chunks=${meta.chunks}` }
      }]
    },
    extraction_status: { select: { name: "done" } },
  });

  console.log("EXTRACTION DONE for", idDump, "->", page.url);
}

main().catch(e => { console.error(e.message); process.exit(1); });