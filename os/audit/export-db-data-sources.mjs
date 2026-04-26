import fs from "fs";
import path from "path";
import "dotenv/config";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = "2025-09-03";

const dbId = process.argv[2];
const outPrefix = process.argv[3];

if (!NOTION_API_KEY || !dbId || !outPrefix) {
  console.error("Usage: node os/audit/export-db-data-sources.mjs <DB_ID> <OUT_PREFIX>");
  process.exit(1);
}

async function notion(pathname) {
  const res = await fetch(`https://api.notion.com/v1${pathname}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION
    }
  });

  const txt = await res.text();
  let data;
  try {
    data = JSON.parse(txt);
  } catch {
    data = { raw: txt };
  }

  if (!res.ok) {
    throw new Error(`${res.status} ${JSON.stringify(data)}`);
  }

  return data;
}

async function main() {
  const db = await notion(`/databases/${dbId}`);

  const dsIds = (db.data_sources || []).map(ds => ds.id);

  if (!dsIds.length) {
    console.error("No data_sources found for database:", dbId);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(outPrefix), { recursive: true });

  let i = 1;
  for (const dsId of dsIds) {
    const ds = await notion(`/data_sources/${dsId}`);
    const outFile = `${outPrefix}.ds${i}.json`;
    fs.writeFileSync(outFile, JSON.stringify(ds, null, 2));
    console.log("exported:", outFile);
    i++;
  }
}

main().catch(err => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
