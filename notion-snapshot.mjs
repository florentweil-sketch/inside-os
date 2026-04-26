#!/usr/bin/env node
/**
 * notion-snapshot.mjs
 * Collecte l'état complet de Notion et produit un snapshot JSON
 * à donner à Claude pour analyse et construction du script de correction.
 *
 * Usage : node notion-snapshot.mjs
 * Sortie : notion-snapshot-YYYY-MM-DD.json (dans le dossier courant)
 *
 * Place ce fichier à la racine du projet inside-os/ puis lance-le.
 */

import "dotenv/config";
import fs from "fs";

const TOKEN = process.env.NOTION_API_KEY;
if (!TOKEN) { console.error("ERREUR : NOTION_API_KEY manquante dans .env"); process.exit(1); }

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2025-09-03";

async function nFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(NOTION_API + path, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  let json;
  try { json = txt ? JSON.parse(txt) : {}; } catch { json = { raw: txt }; }
  if (!res.ok) throw new Error(`Notion ${res.status} ${method} ${path}: ${JSON.stringify(json)}`);
  return json;
}

async function searchAll(type) {
  const results = [];
  let cursor;
  do {
    const body = { filter: { value: type, property: "object" }, page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await nFetch("/search", { method: "POST", body });
    results.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return results;
}

async function queryDbStatus(dbId, label) {
  const counts = {};
  let cursor;
  let total = 0;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await nFetch(`/databases/${dbId}/query`, { method: "POST", body });
    for (const page of r.results) {
      total++;
      const ex = page.properties?.extraction_status?.select?.name || "null";
      const inj = page.properties?.injection_status?.select?.name || "null";
      counts[`extract:${ex}`] = (counts[`extract:${ex}`] || 0) + 1;
      counts[`inject:${inj}`] = (counts[`inject:${inj}`] || 0) + 1;
    }
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return { label, total, counts };
}

async function countDb(dbId, label) {
  try {
    const r = await nFetch(`/databases/${dbId}/query`, { method: "POST", body: { page_size: 1 } });
    return { label, total: r.total_count ?? "?" };
  } catch(e) {
    return { label, total: 0, error: e.message };
  }
}

async function main() {
  console.log("Collecte Notion en cours...");
  const snapshot = {
    collected_at: new Date().toISOString(),
    env: {
      THREAD_DUMP_DB_ID: process.env.THREAD_DUMP_DB_ID,
      DECISIONS_DB_ID: process.env.DECISIONS_DB_ID,
      LESSONS_DB_ID: process.env.LESSONS_DB_ID,
      DATA_CEMETERY_DB_ID: process.env.DATA_CEMETERY_DB_ID,
      ROOT_PAGE_ID: process.env.ROOT_PAGE_ID,
    },
  };

  // 1. Toutes les bases de données accessibles
  console.log("  → Recherche de toutes les bases...");
  const allDbs = await searchAll("database");
  snapshot.all_databases = allDbs.map(db => ({
    id: db.id,
    title: db.title?.map(t => t.plain_text).join("") || "",
    parent: db.parent,
    in_trash: db.in_trash || db.archived || false,
    created_time: db.created_time,
    last_edited_time: db.last_edited_time,
    data_sources: db.data_sources || [],
    properties: Object.keys(db.properties || {}),
  }));
  console.log(`     ${allDbs.length} bases trouvées`);

  // 2. Toutes les pages accessibles (top level uniquement)
  console.log("  → Recherche des pages accessibles...");
  const allPages = await searchAll("page");
  snapshot.all_pages = allPages.map(p => ({
    id: p.id,
    title: p.properties?.title?.title?.map(t => t.plain_text).join("") ||
           p.properties?.Name?.title?.map(t => t.plain_text).join("") ||
           p.properties?.Nom?.title?.map(t => t.plain_text).join("") || "",
    parent: p.parent,
    in_trash: p.in_trash || p.archived || false,
    created_time: p.created_time,
    last_edited_time: p.last_edited_time,
  }));
  console.log(`     ${allPages.length} pages trouvées`);

  // 3. Statuts pipeline sur THREAD_DUMP
  const threadDumpId = process.env.THREAD_DUMP_DB_ID;
  if (threadDumpId) {
    console.log("  → Comptage statuts THREAD_DUMP...");
    snapshot.thread_dump_status = await queryDbStatus(threadDumpId, "thread_dump");
    console.log(`     ${snapshot.thread_dump_status.total} threads`);
  }

  // 4. Comptage DECISIONS et LESSONS
  const decisionsId = process.env.DECISIONS_DB_ID;
  const lessonsId = process.env.LESSONS_DB_ID;
  if (decisionsId) {
    console.log("  → Comptage DECISIONS...");
    snapshot.decisions_count = await countDb(decisionsId, "decisions_structural");
  }
  if (lessonsId) {
    console.log("  → Comptage LESSONS...");
    snapshot.lessons_count = await countDb(lessonsId, "lessons_learnings");
  }

  // 5. Schéma détaillé des 3 bases canoniques
  console.log("  → Schéma des bases canoniques...");
  snapshot.canonical_schemas = {};
  for (const [key, id] of Object.entries({
    thread_dump: threadDumpId,
    decisions_structural: decisionsId,
    lessons_learnings: lessonsId,
  })) {
    if (!id) continue;
    try {
      const db = await nFetch(`/databases/${id}`);
      snapshot.canonical_schemas[key] = {
        id: db.id,
        data_sources: db.data_sources || [],
        properties: Object.fromEntries(
          Object.entries(db.properties || {}).map(([k, v]) => [k, v.type])
        ),
      };
    } catch(e) {
      snapshot.canonical_schemas[key] = { error: e.message };
    }
  }

  // 6. Écriture du snapshot
  const filename = `notion-snapshot-${new Date().toISOString().slice(0,10)}.json`;
  fs.writeFileSync(filename, JSON.stringify(snapshot, null, 2));
  console.log(`\n✓ Snapshot écrit : ${filename}`);
  console.log(`  Taille : ${(fs.statSync(filename).size / 1024).toFixed(1)} KB`);
  console.log(`\nEnvoie ce fichier à Claude pour l'analyse complète.`);
}

main().catch(e => { console.error(e); process.exit(1); });
