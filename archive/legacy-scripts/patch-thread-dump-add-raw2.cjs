require('dotenv').config();
const fs = require('fs');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.THREAD_DUMP_DB_ID;

if (!NOTION_TOKEN) { console.error("ERROR: NOTION_TOKEN missing"); process.exit(1); }
if (!DB_ID) { console.error("ERROR: THREAD_DUMP_DB_ID missing"); process.exit(1); }

const [,, id_dump, filePath] = process.argv;
if (!id_dump || !filePath) {
  console.error("Usage: node scripts/patch-thread-dump-add-raw2.cjs <ID_DUMP> <FILEPATH>");
  process.exit(1);
}

async function notion(path, method='GET', body) {
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
  if (!res.ok) throw new Error(`Notion API ${res.status}: ${text}`);
  return JSON.parse(text);
}

function chunkString(str, maxLen) {
  const out = [];
  for (let i = 0; i < str.length; i += maxLen) out.push(str.slice(i, i + maxLen));
  return out;
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function findPageByIdDump(id) {
  const body = {
    filter: { property: "id_dump", rich_text: { equals: id } },
    page_size: 1
  };
  const res = await notion(`/databases/${DB_ID}/query`, 'POST', body);
  if (!res.results?.length) throw new Error(`No page found in thread_dump for id_dump=${id}`);
  return res.results[0].id;
}

function makeCodeBlock(text) {
  return {
    object: "block",
    type: "code",
    code: {
      language: "plain text",
      rich_text: [{ type: "text", text: { content: text } }]
    }
  };
}

async function appendChildren(blockId, children) {
  return notion(`/blocks/${blockId}/children`, 'PATCH', { children });
}

// Read first N children and detect marker
async function hasRawMarker(pageId, marker, maxBlocks=200) {
  let cursor = undefined;
  let seen = 0;
  while (seen < maxBlocks) {
    const qs = cursor ? `?start_cursor=${cursor}&page_size=100` : `?page_size=100`;
    const res = await notion(`/blocks/${pageId}/children${qs}`, 'GET');
    for (const b of (res.results || [])) {
      // Only check code blocks (our marker is in a code block)
      if (b.type === 'code') {
        const txt = (b.code?.rich_text || []).map(x => x.plain_text || '').join('');
        if (txt.includes(marker)) return true;
      }
    }
    seen += (res.results || []).length;
    if (!res.has_more) break;
    cursor = res.next_cursor;
  }
  return false;
}

async function main() {
  const raw = fs.readFileSync(filePath, 'utf8');

  const TEXT_CHUNK = 1800;
  const BLOCKS_PER_PATCH = 40;

  const pageId = await findPageByIdDump(id_dump);

  const marker = `RAW_THREAD_DUMP v1 — ${id_dump}`;
  const already = await hasRawMarker(pageId, marker);

  console.log(`PAGE ${id_dump} -> ${pageId}`);
  if (already) {
    console.log(`SKIP: marker already present (${marker})`);
    return;
  }

  const header = makeCodeBlock(`${marker}\nSOURCE: ${filePath}\n---\n`);

  const parts = chunkString(raw, TEXT_CHUNK);
  const blocks = [header, ...parts.map(makeCodeBlock)];
  const batches = chunkArray(blocks, BLOCKS_PER_PATCH);

  console.log(`RAW chars=${raw.length}, blocks=${blocks.length}, batches=${batches.length}`);

  for (let i = 0; i < batches.length; i++) {
    await appendChildren(pageId, batches[i]);
    console.log(`APPEND batch ${i+1}/${batches.length} OK (${batches[i].length} blocks)`);
    await new Promise(r => setTimeout(r, 250));
  }

  console.log("DONE RAW APPEND:", id_dump);
}

main().catch(e => { console.error(e.message); process.exit(1); });
