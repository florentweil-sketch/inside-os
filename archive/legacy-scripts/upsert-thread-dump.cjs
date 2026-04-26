require("dotenv").config();
const fs = require("fs");
const path = require("path");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.THREAD_DUMP_DB_ID;

if (!NOTION_TOKEN) { console.error("ERROR: NOTION_TOKEN missing"); process.exit(1); }
if (!DB_ID) { console.error("ERROR: THREAD_DUMP_DB_ID missing"); process.exit(1); }

async function notion(apiPath, method = "GET", body) {
  const res = await fetch(`https://api.notion.com/v1${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Notion API ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

function usage() {
  console.log('Usage: node scripts/upsert-thread-dump.cjs <file_path> <id_dump> <title>');
  console.log('Example: node scripts/upsert-thread-dump.cjs dumps/ELIOR-AI-BUILDER.txt TD-0001 "ELIOR AI Builder Thread"');
}

function chunkText(s, maxLen = 1800) {
  // Notion block rich_text max is 2000 chars, leave margin
  const chunks = [];
  let i = 0;
  while (i < s.length) {
    chunks.push(s.slice(i, i + maxLen));
    i += maxLen;
  }
  return chunks;
}

async function findExistingByIdDump(idDump) {
  const q = await notion(`/databases/${DB_ID}/query`, "POST", {
    page_size: 1,
    filter: {
      property: "id_dump",
      rich_text: { equals: idDump },
    },
  });
  return (q.results && q.results[0]) ? q.results[0] : null;
}

async function setPageProperties(pageId, props) {
  return notion(`/pages/${pageId}`, "PATCH", { properties: props });
}

async function replaceChildrenWithText(pageId, text) {
  // 1) fetch existing children blocks
  const children = await notion(`/blocks/${pageId}/children?page_size=100`, "GET");
  const ids = (children.results || []).map(b => b.id);

  // 2) archive existing children (delete = archive in Notion)
  for (const id of ids) {
    await notion(`/blocks/${id}`, "DELETE");
  }

  // 3) append new children blocks with chunked text
  const chunks = chunkText(text);
  const blocks = chunks.map(t => ({
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", text: { content: t } }],
    },
  }));

  // Notion limits children append per call; batch 50
  const batchSize = 50;
  for (let i = 0; i < blocks.length; i += batchSize) {
    const batch = blocks.slice(i, i + batchSize);
    await notion(`/blocks/${pageId}/children`, "PATCH", { children: batch });
  }
}

async function main() {
  const filePath = process.argv[2];
  const idDump = process.argv[3];
  const title = process.argv[4];

  if (!filePath || !idDump || !title) { usage(); process.exit(1); }

  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);

  const raw = fs.readFileSync(abs, "utf8");
  const fileName = path.basename(abs);

  // basic metadata defaults (safe)
  const propsBase = {
    Name: { title: [{ type: "text", text: { content: title } }] },
    id_dump: { rich_text: [{ type: "text", text: { content: idDump } }] },
    source: { select: { name: "ChatGPT" } },
    status: { select: { name: "raw" } },
    confidence: { select: { name: "medium" } },
    // Store origin filename + optional URL later
    summary: { rich_text: [{ type: "text", text: { content: `Imported from ${fileName}` } }] },
  };

  const existing = await findExistingByIdDump(idDump);

  if (!existing) {
    const created = await notion("/pages", "POST", {
      parent: { database_id: DB_ID },
      properties: propsBase,
    });
    await replaceChildrenWithText(created.id, raw);
    console.log("CREATED:", created.url);
    return;
  }

  await setPageProperties(existing.id, propsBase);
  await replaceChildrenWithText(existing.id, raw);
  console.log("UPDATED:", existing.url);
}

main().catch(e => { console.error(e.message); process.exit(1); });
