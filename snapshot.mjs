import "dotenv/config";
import fs from "fs";

const TOKEN = process.env.NOTION_API_KEY;
if (!TOKEN) { console.error("NOTION_API_KEY manquante"); process.exit(1); }

const API = "https://api.notion.com/v1";
const VER = "2025-09-03";

function cleanId(id) {
  return id ? id.replace(/-/g, "") : id;
}

async function nFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Notion-Version": VER,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  const json = txt ? JSON.parse(txt) : {};
  if (!res.ok) throw new Error(`${res.status} ${method} ${path}: ${JSON.stringify(json)}`);
  return json;
}

async function getDb(id) {
  return nFetch(`/databases/${cleanId(id)}`);
}

async function queryDbFull(id) {
  const counts = {};
  let cursor, total = 0;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await nFetch(`/databases/${cleanId(id)}/query`, { method: "POST", body });
    for (const p of r.results) {
      total++;
      const ex = p.properties?.extraction_status?.select?.name || "null";
      const inj = p.properties?.injection_status?.select?.name || "null";
      counts[`extract:${ex}`] = (counts[`extract:${ex}`] || 0) + 1;
      counts[`inject:${inj}`] = (counts[`inject:${inj}`] || 0) + 1;
    }
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return { total, counts };
}

async function searchPages() {
  const results = [];
  let cursor;
  do {
    const body = { filter: { value: "page", property: "object" }, page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await nFetch("/search", { method: "POST", body });
    results.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return results;
}

async function main() {
  console.log("Collecte Notion...\n");

  const snap = {
    collected_at: new Date().toISOString(),
    env: {
      THREAD_DUMP_DB_ID: process.env.THREAD_DUMP_DB_ID,
      DECISIONS_DB_ID: process.env.DECISIONS_DB_ID,
      LESSONS_DB_ID: process.env.LESSONS_DB_ID,
      DATA_CEMETERY_DB_ID: process.env.DATA_CEMETERY_DB_ID,
      ROOT_PAGE_ID: process.env.ROOT_PAGE_ID,
    },
  };

  // Pages via search
  console.log("→ Pages accessibles...");
  const pages = await searchPages();
  console.log(`   ${pages.length} pages`);
  snap.all_pages = pages.map(p => ({
    id: p.id,
    title: Object.values(p.properties || {}).find(v => v.type === "title")?.title?.map(t => t.plain_text).join("") || "",
    parent: p.parent,
    in_trash: p.in_trash || p.archived || false,
    last_edited_time: p.last_edited_time,
  }));

  // Bases canoniques directement par ID
  console.log("→ Bases canoniques...");
  snap.canonical_schemas = {};
  const canonicals = {
    thread_dump: process.env.THREAD_DUMP_DB_ID,
    decisions_structural: process.env.DECISIONS_DB_ID,
    lessons_learnings: process.env.LESSONS_DB_ID,
  };
  snap.all_databases = [];
  for (const [key, id] of Object.entries(canonicals)) {
    if (!id) { console.log(`   ${key} — ID manquant`); continue; }
    try {
      const db = await getDb(id);
      const info = {
        id: db.id,
        title: db.title?.map(t => t.plain_text).join("") || "",
        parent: db.parent,
        in_trash: db.in_trash || db.archived || false,
        data_sources: db.data_sources || [],
        properties: Object.fromEntries(Object.entries(db.properties || {}).map(([k, v]) => [k, v.type])),
      };
      snap.canonical_schemas[key] = info;
      snap.all_databases.push({ key, ...info });
      console.log(`   ${key} OK — ${info.data_sources.length} data source(s)`);
    } catch(e) {
      snap.canonical_schemas[key] = { error: e.message };
      console.log(`   ${key} ERREUR: ${e.message.slice(0, 80)}`);
    }
  }

  // Bases additionnelles connues (hors pipeline)
  const extraIds = {
    data_cemetery: process.env.DATA_CEMETERY_DB_ID,
  };
  for (const [key, id] of Object.entries(extraIds)) {
    if (!id) continue;
    try {
      const db = await getDb(id);
      snap.all_databases.push({
        key,
        id: db.id,
        title: db.title?.map(t => t.plain_text).join("") || "",
        data_sources: db.data_sources || [],
        in_trash: db.in_trash || db.archived || false,
      });
      console.log(`   ${key} OK`);
    } catch(e) {
      console.log(`   ${key} ERREUR: ${e.message.slice(0, 60)}`);
    }
  }

  // Statuts pipeline THREAD_DUMP
  if (process.env.THREAD_DUMP_DB_ID) {
    console.log("→ Statuts THREAD_DUMP...");
    try {
      snap.thread_dump_status = await queryDbFull(process.env.THREAD_DUMP_DB_ID);
      console.log(`   total: ${snap.thread_dump_status.total}`);
      for (const [k, v] of Object.entries(snap.thread_dump_status.counts).sort()) {
        console.log(`   ${k}: ${v}`);
      }
    } catch(e) {
      snap.thread_dump_status = { error: e.message };
      console.log(`   ERREUR: ${e.message.slice(0, 80)}`);
    }
  }

  const fname = `notion-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
  fs.writeFileSync(fname, JSON.stringify(snap, null, 2));
  console.log(`\n✓ ${fname} (${(fs.statSync(fname).size / 1024).toFixed(1)} KB)`);
  console.log("Envoie ce fichier à Claude.");
}

main().catch(e => { console.error(e); process.exit(1); });
