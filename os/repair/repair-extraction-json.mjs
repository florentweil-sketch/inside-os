import "dotenv/config";
import {
  queryDataSource,
  updatePage,
  listAllBlockChildren,
  getPropText,
  rt,
} from "../lib/notion.mjs";

const THREAD_DUMP_DS_ID = process.env.THREAD_DUMP_DS_ID;

function argValue(name, fallback) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : (process.argv[i+1] ?? fallback);
}

const LIMIT = Number(argValue("--limit","20"));
const DRY = process.argv.includes("--dry-run");

function stripComments(s){
  return s
    .replace(/\/\*[\s\S]*?\*\//g,"")
    .replace(/(^|\n)\s*\/\/.*(?=\n|$)/g,"$1");
}

function extractJson(text){
  const start = text.indexOf("{");
  if(start < 0) return null;

  let depth = 0;
  let inStr = false;
  let esc = false;

  for (let i = start; i < text.length; i++){
    const c = text[i];

    if (inStr){
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }

    if (c === '"'){ inStr = true; continue; }
    if (c === "{") depth++;
    if (c === "}") depth--;

    if (depth === 0) return text.slice(start, i+1);
  }
  return null;
}

async function getJsonFromBlocks(pageId){
  const blocks = await listAllBlockChildren(pageId);
  const texts = [];

  for (const b of blocks){
    if (b.type === "code"){
      const t = (b.code.rich_text || []).map(x => x.plain_text).join("");
      if (t) texts.push(t);
    } else if (b.type === "paragraph"){
      const t = (b.paragraph.rich_text || []).map(x => x.plain_text).join("");
      if (t) texts.push(t);
    }
  }

  const joined = texts.join("");
  const clean = stripComments(joined);
  return extractJson(clean);
}

async function repairOne(page){
  const id = getPropText(page, "id_dump");

  const jsonText = await getJsonFromBlocks(page.id);
  if (!jsonText){
    console.log("  no json found");
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    console.log("  still invalid json");
    return;
  }

  if (!DRY){
    await updatePage(page.id, {
      extraction_json: rt(JSON.stringify(parsed)),
      extraction_status: { select: { name: "done" } },
      extraction_error: rt("")
    });
  }

  console.log("  repaired");
}

async function main(){
  if (!THREAD_DUMP_DS_ID) {
    console.error("ERROR: THREAD_DUMP_DS_ID missing");
    process.exit(1);
  }

  const res = await queryDataSource(THREAD_DUMP_DS_ID, {
    page_size: LIMIT,
    filter: {
      property: "extraction_status",
      select: { equals: "error" }
    }
  });

  const pages = res.results || [];
  console.log("candidates:", pages.length);

  for (const p of pages){
    console.log("→", getPropText(p, "id_dump"));
    await repairOne(p);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
