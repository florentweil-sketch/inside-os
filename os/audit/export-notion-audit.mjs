import "dotenv/config";
import fs from "fs";
import path from "path";
import { Client } from "@notionhq/client";

// ---- CLI args (minimal) ----
const argv = process.argv.slice(2);
const getArg = (name, def = null) => {
  const i = argv.indexOf(name);
  if (i === -1) return def;
  const v = argv[i + 1];
  if (!v || v.startsWith("--")) return true;
  return v;
};

const OUT_DIR = getArg("--out", "out/audit");
const SAMPLE_PAGES = Number(getArg("--sample", "5"));        // pages per data source
const MAX_DBS = Number(getArg("--max-dbs", "9999"));         // safety cap

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) {
  console.error("[audit] ERROR: NOTION_API_KEY missing in env");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

const mkdirp = (p) => fs.mkdirSync(p, { recursive: true });
const writeJson = (file, obj) => fs.writeFileSync(file, JSON.stringify(obj, null, 2), "utf8");

mkdirp(OUT_DIR);

// ---- Small utils ----
function safeName(s) {
  return String(s || "db")
    .replaceAll("/", "_")
    .replaceAll("\\", "_")
    .replaceAll(":", "_")
    .replaceAll("*", "_")
    .replaceAll("?", "_")
    .replaceAll('"', "_")
    .replaceAll("<", "_")
    .replaceAll(">", "_")
    .replaceAll("|", "_")
    .trim()
    .slice(0, 80);
}

function getPlainText(arr) {
  return Array.isArray(arr) ? arr.map(x => x?.plain_text || "").join("").trim() : "";
}

function getDataSourceTitle(obj) {
  if (obj?.name) return String(obj.name).trim();
  if (obj?.title) {
    const t = getPlainText(obj.title);
    if (t) return t;
  }
  if (obj?.parent?.database_id) return `(data_source ${obj.parent.database_id})`;
  return "(untitled)";
}

// ---- Notion helpers ----
async function searchAllDataSources() {
  const all = [];
  let start_cursor = undefined;

  while (true) {
    const res = await notion.search({
      filter: { property: "object", value: "data_source" },
      start_cursor,
      page_size: 100,
    });

    all.push(...(res.results || []));
    if (!res.has_more) break;
    start_cursor = res.next_cursor;
  }

  return all;
}

async function retrieveDataSource(data_source_id) {
  return await notion.dataSources.retrieve({
    data_source_id,
  });
}

async function querySamplePages(data_source_id, page_size) {
  const res = await notion.dataSources.query({
    data_source_id,
    page_size,
    sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
  });
  return res.results || [];
}

// ---- Main ----
(async () => {
  console.log(`[audit] OUT_DIR=${OUT_DIR}`);
  console.log(`[audit] SAMPLE_PAGES=${SAMPLE_PAGES}`);

  const dataSources = await searchAllDataSources();
  console.log(`[audit] search mode=data_source, found=${dataSources.length}`);
  console.log(`[audit] accessible containers: ${dataSources.length}`);

  // Write index
  const index = dataSources.map(ds => ({
    id: ds.id,
    object: ds.object,
    title: getDataSourceTitle(ds),
    url: ds.url,
    created_time: ds.created_time,
    last_edited_time: ds.last_edited_time,
    parent: ds.parent || null,
    parent_database_id: ds.parent?.database_id || null,
  }));
  writeJson(path.join(OUT_DIR, "index.data_sources.json"), index);

  // Per data source export (schema + sample pages)
  let count = 0;
  for (const ds of dataSources) {
    count += 1;
    if (count > MAX_DBS) break;

    const title = getDataSourceTitle(ds);
    const slug = `${String(count).padStart(3, "0")}_${safeName(title)}_${String(ds.id).replaceAll("-", "")}`;
    const dir = path.join(OUT_DIR, slug);
    mkdirp(dir);

    // full data source schema
    let fullDs;
    try {
      fullDs = await retrieveDataSource(ds.id);
      writeJson(path.join(dir, "data_source.schema.json"), fullDs);
    } catch (e) {
      writeJson(path.join(dir, "data_source.schema_error.json"), {
        message: e?.message || String(e),
        name: e?.name,
        code: e?.code,
        object: ds,
      });
      console.log(`[audit] ${title} -> schema ERROR (saved)`);
      continue;
    }

    // sample pages
    let pages = [];
    try {
      pages = await querySamplePages(ds.id, SAMPLE_PAGES);
    } catch (e) {
      writeJson(path.join(dir, "data_source.query_error.json"), {
        message: e?.message || String(e),
        name: e?.name,
        code: e?.code,
      });
      console.log(`[audit] ${title} -> query ERROR (saved), schema OK`);
      continue;
    }

    writeJson(path.join(dir, "pages.sample.json"), pages);

    console.log(`[audit] OK: ${title} (schema + ${pages.length} pages)`);
  }

  console.log("[audit] DONE");
})().catch(err => {
  console.error("[audit] FATAL", err);
  process.exit(1);
});