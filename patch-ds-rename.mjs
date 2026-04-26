import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const APPLY = process.argv.includes("--apply");

const RENAMES = [
  ["THREAD_DUMP_DB_ID", "THREAD_DUMP_DS_ID"],
  ["DECISIONS_DB_ID", "DECISIONS_DS_ID"],
  ["LESSONS_DB_ID", "LESSONS_DS_ID"],
  ["DATA_CEMETERY_DB_ID", "DATA_CEMETERY_DS_ID"],
  ["queryDatabaseCompat", "queryDataSource"],
];

const FILES = [
  ".env",
  "os/lib/config.mjs",
  "os/lib/notion.mjs",
  "os/ingest/ingest-thread-dump.mjs",
  "os/extract/extract-thread-dump.mjs",
  "os/inject/inject-decisions-lessons.mjs",
  "os/chat/notion-memory-server.mjs",
  "os/chat/notion-memory-chat.mjs",
  "os/scripts/audit-system.mjs",
  "os/scripts/validate-schema.mjs",
  "os/scripts/reset-databases.mjs",
  "os/scripts/list-inject-pending.mjs",
  "os/scripts/list-inject-errors.mjs",
  "os/scripts/list-inject-error-details.mjs",
  "os/repair/repair-extraction-json.mjs",
  "os/pipeline.mjs",
];

const NOTION_REMOVE = [
  "export async function queryDatabaseCompat(dataSourceId, payload) {\n  return queryDataSource(dataSourceId, payload);\n}\n\n",
  "export async function getDatabase(databaseId) {\n  return notionFetch(`/databases/${databaseId}`, { method: \"GET\" });\n}\n\n",
  "export async function resolveFirstDataSourceId(databaseId) {\n  const db = await getDatabase(databaseId);\n  const sources = db.data_sources || [];\n\n  if (!sources.length) {\n    throw new Error(`No data source found for database ${databaseId}`);\n  }\n\n  return sources[0].id;\n}\n\n",
];

let total = 0;
console.log(`\nMODE: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

for (const rel of FILES) {
  const fp = path.join(ROOT, rel);
  if (!fs.existsSync(fp)) {
    console.log(`  SKIP (not found): ${rel}`);
    continue;
  }
  let content = fs.readFileSync(fp, "utf-8");
  const changes = [];

  for (const [from, to] of RENAMES) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const n = (content.match(new RegExp(escaped, "g")) || []).length;
    if (n > 0) {
      content = content.replaceAll(from, to);
      changes.push(`${from} -> ${to} (${n}x)`);
      total += n;
    }
  }

  if (rel === "os/lib/notion.mjs") {
    for (const block of NOTION_REMOVE) {
      if (content.includes(block)) {
        content = content.replace(block, "");
        changes.push(`supprime: ${block.slice(0, 50).trim()}...`);
        total++;
      }
    }
    content = content.replace(
      "// Database / Data source helpers",
      "// Data source helpers (DS_ID = data_source_id Notion)"
    );
  }

  if (changes.length) {
    console.log(`\n${rel}:`);
    changes.forEach(c => console.log(`  -> ${c}`));
    if (APPLY) fs.writeFileSync(fp, content);
  }
}

console.log(`\n--- ${total} changement(s) ${APPLY ? "appliques" : "detectes"} ---`);
if (!APPLY) {
  console.log("Relancer avec --apply pour appliquer.");
} else {
  console.log("\nTester : npm run os:audit");
  console.log("Puis committer : git add -A && git commit -m 'refactor: rename DB_ID to DS_ID, remove queryDatabaseCompat'");
}
