#!/bin/bash
set -e
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATE=$(date +"%Y-%m-%d_%H-%M")
BACKUP_DIR="$PROJECT_DIR/../inside-os-backups"
mkdir -p "$BACKUP_DIR"

echo "━━━ BACKUP ━━━"
BACKUP_PATH="$BACKUP_DIR/inside-os-backup-$DATE.tar.gz"
tar -czf "$BACKUP_PATH" \
  --exclude="$PROJECT_DIR/node_modules" \
  --exclude="$PROJECT_DIR/.git" \
  --exclude="$PROJECT_DIR/runtime/out" \
  -C "$(dirname "$PROJECT_DIR")" "$(basename "$PROJECT_DIR")"
echo "✓ $(du -sh $BACKUP_PATH | cut -f1) — $BACKUP_PATH"
ls -t "$BACKUP_DIR"/inside-os-backup-*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f

echo ""
echo "━━━ SNAPSHOT NOTION ━━━"
mkdir -p "$PROJECT_DIR/runtime"
SNAP="$PROJECT_DIR/runtime/notion-snapshot-$DATE.json"

node --input-type=module << 'JSEOF' 2>&1
import "dotenv/config";
import fs from "fs";
const TOKEN = process.env.NOTION_API_KEY;
if (!TOKEN) { console.error("NOTION_API_KEY manquante"); process.exit(1); }
const API = "https://api.notion.com/v1";
const VER = "2025-09-03";
async function nFetch(path, { method="GET", body }={}) {
  const res = await fetch(API+path, { method, headers: { Authorization:`Bearer ${TOKEN}`, "Notion-Version":VER, ...(body?{"Content-Type":"application/json"}:{}) }, body:body?JSON.stringify(body):undefined });
  const txt = await res.text();
  const json = txt ? JSON.parse(txt) : {};
  if (!res.ok) throw new Error(`${res.status} ${method} ${path}: ${JSON.stringify(json)}`);
  return json;
}
async function searchAll() {
  const results=[]; let cursor;
  do {
    const body={page_size:100}; if(cursor) body.start_cursor=cursor;
    const r=await nFetch("/search",{method:"POST",body}); results.push(...r.results);
    cursor=r.has_more?r.next_cursor:undefined;
  } while(cursor);
  return results;
}
async function queryDbFull(id) {
  const counts={}; let cursor,total=0;
  do {
    const body={page_size:100}; if(cursor) body.start_cursor=cursor;
    const r=await nFetch(`/databases/${id}/query`,{method:"POST",body});
    for(const p of r.results){ total++; const ex=p.properties?.extraction_status?.select?.name||"null"; const inj=p.properties?.injection_status?.select?.name||"null"; counts[`extract:${ex}`]=(counts[`extract:${ex}`]||0)+1; counts[`inject:${inj}`]=(counts[`inject:${inj}`]||0)+1; }
    cursor=r.has_more?r.next_cursor:undefined;
  } while(cursor);
  return {total,counts};
}
const snap={collected_at:new Date().toISOString(),env:{THREAD_DUMP_DB_ID:process.env.THREAD_DUMP_DB_ID,DECISIONS_DB_ID:process.env.DECISIONS_DB_ID,LESSONS_DB_ID:process.env.LESSONS_DB_ID,ROOT_PAGE_ID:process.env.ROOT_PAGE_ID}};
console.log("→ Search global...");
const all=await searchAll();
const dbs=all.filter(r=>r.object==="database"); const pgs=all.filter(r=>r.object==="page");
console.log(`   ${dbs.length} bases, ${pgs.length} pages`);
snap.all_databases=dbs.map(db=>({id:db.id,title:db.title?.map(t=>t.plain_text).join("")||"",parent:db.parent,in_trash:db.in_trash||db.archived||false,data_sources:db.data_sources||[],properties:Object.keys(db.properties||{})}));
snap.all_pages=pgs.map(p=>({id:p.id,title:Object.values(p.properties||{}).find(v=>v.type==="title")?.title?.map(t=>t.plain_text).join("")||"",parent:p.parent,in_trash:p.in_trash||p.archived||false}));
console.log("→ Schémas canoniques...");
snap.canonical_schemas={};
for(const [key,id] of Object.entries({thread_dump:process.env.THREAD_DUMP_DB_ID,decisions_structural:process.env.DECISIONS_DB_ID,lessons_learnings:process.env.LESSONS_DB_ID})){
  if(!id) continue;
  try{ const db=await nFetch(`/databases/${id}`); snap.canonical_schemas[key]={id:db.id,data_sources:db.data_sources||[],properties:Object.fromEntries(Object.entries(db.properties||{}).map(([k,v])=>[k,v.type]))}; console.log(`   ${key} OK — ${db.data_sources?.length||0} data source(s)`); }
  catch(e){ snap.canonical_schemas[key]={error:e.message}; console.log(`   ${key} ERREUR`); }
}
if(process.env.THREAD_DUMP_DB_ID){
  console.log("→ Statuts THREAD_DUMP...");
  snap.thread_dump_status=await queryDbFull(process.env.THREAD_DUMP_DB_ID);
  console.log(`   total: ${snap.thread_dump_status.total}`);
  for(const [k,v] of Object.entries(snap.thread_dump_status.counts).sort()) console.log(`   ${k}: ${v}`);
}
const fname=process.env.SNAP_OUT||`notion-snapshot-${new Date().toISOString().slice(0,10)}.json`;
fs.writeFileSync(fname,JSON.stringify(snap,null,2));
console.log(`✓ ${fname} (${(fs.statSync(fname).size/1024).toFixed(1)} KB)`);
JSEOF

echo ""
echo "✓ Terminé"
echo "  Backup  : $BACKUP_PATH"
echo "  Snapshot: $SNAP"
