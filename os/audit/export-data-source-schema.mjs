import "dotenv/config";
import fs from "fs";
import path from "path";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = "2025-09-03";

if (!NOTION_API_KEY) {
  console.error("ERROR: NOTION_API_KEY missing in .env");
  process.exit(1);
}

const [,, dataSourceId, outFile, label] = process.argv;

if (!dataSourceId || !outFile || !label) {
  console.error("Usage: node os/audit/export-data-source-schema.mjs <DATA_SOURCE_ID> <OUT_FILE> <LABEL>");
  process.exit(1);
}

async function notion(pathname, method = "GET", body) {
  const res = await fetch("https://api.notion.com/v1" + pathname, {
    method,
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const txt = await res.text();
  let json;
  try {
    json = JSON.parse(txt);
  } catch {
    json = { raw: txt };
  }

  if (!res.ok) {
    throw new Error(`${res.status} ${JSON.stringify(json)}`);
  }

  return json;
}

function normalizeProperty(name, def) {
  const out = { name, type: def.type };

  if (def.type === "select") {
    out.options = (def.select?.options || []).map(o => o.name);
  }

  if (def.type === "multi_select") {
    out.options = (def.multi_select?.options || []).map(o => o.name);
  }

  if (def.type === "status") {
    out.options = (def.status?.options || []).map(o => o.name);
  }

  if (def.type === "relation") {
    out.relation = {
      database_id: def.relation?.database_id || null,
      data_source_id: def.relation?.data_source_id || null,
      synced_property_name: def.relation?.synced_property_name || null
    };
  }

  return out;
}

async function main() {
  const ds = await notion(`/data_sources/${dataSourceId}`, "GET");

  const report = {
    label,
    data_source_id: dataSourceId,
    notion_name: ds.name || "",
    database_id: ds.parent?.database_id || null,
    extracted_at: new Date().toISOString(),
    properties: Object.entries(ds.properties || {})
      .map(([name, def]) => normalizeProperty(name, def))
      .sort((a, b) => a.name.localeCompare(b.name))
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n");
  console.log(`OK: ${label} -> ${outFile}`);
}

main().catch(err => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
