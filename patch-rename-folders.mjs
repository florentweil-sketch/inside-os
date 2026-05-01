#!/usr/bin/env node
/**
 * patch-rename-folders.mjs
 * Renomme toutes les références aux anciens dossiers data/ dans le code et les docs
 *
 * historical_threads  → test_threads
 * historical_threads_clean → test_threads_clean (legacy, à supprimer)
 *
 * Usage :
 *   node patch-rename-folders.mjs           → dry-run
 *   node patch-rename-folders.mjs --apply   → applique
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const APPLY = process.argv.includes("--apply");

const RENAMES = [
  ["data/historical_threads_clean", "data/test_threads_clean"],
  ["data/historical_threads", "data/test_threads"],
  ["historical_threads_clean/", "test_threads_clean/"],
  ["historical_threads/", "test_threads/"],
  ["historical_threads", "test_threads"],
  ["HISTORICAL_THREADS_DIR", "TEST_THREADS_DIR"],
  ["INGEST historical_threads", "INGEST test_threads"],
  ["Préparation historical_threads", "Préparation test_threads"],
];

const FILES = [
  "os/ingest/ingest-thread-dump.mjs",
  "os/scripts/clean-threads.mjs",
  "os/scripts/prepare-beta.mjs",
  "os/scripts/audit-system.mjs",
  "os-thread-close.mjs",
  "docs/readme/README_INSIDE_OS_v04.md",
  "docs/context/INSIDE_OS_CONTEXT_v09.md",
  "docs/prompts transfert thread/PROMPT_MAITRE_v04_TRANSFERT_DE_THREAD.md",
  ".gitignore",
];

let total = 0;
console.log(`\nMODE: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

for (const rel of FILES) {
  const fp = path.join(ROOT, rel);
  if (!fs.existsSync(fp)) { console.log(`  SKIP (not found): ${rel}`); continue; }
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

  if (changes.length) {
    console.log(`\n${rel}:`);
    changes.forEach(c => console.log(`  -> ${c}`));
    if (APPLY) fs.writeFileSync(fp, content);
  }
}

console.log(`\n--- ${total} changement(s) ${APPLY ? "appliques" : "detectes"} ---`);
if (!APPLY) console.log("Relancer avec --apply pour appliquer.");
else console.log("\nTester : npm run os:audit");
