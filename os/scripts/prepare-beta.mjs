// os/scripts/prepare-beta.mjs
// INSIDE OS — Préparation test_threads pour la beta v01
//
// Ce script :
// 1. Crée data/data_cemetery/ si inexistant
// 2. Déplace tous les threads vers data_cemetery/ SAUF ceux dans KEEP
// 3. Supprime data/test_threads_clean/ (dossier de vérification devenu inutile)
//
// Usage :
//   node os/scripts/prepare-beta.mjs            → dry-run (affiche ce qui sera fait)
//   node os/scripts/prepare-beta.mjs --execute  → exécute réellement

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const REPO_ROOT  = path.resolve(__dirname, "../..");

const SOURCE_DIR  = path.join(REPO_ROOT, "data", "test_threads");
const CEMETERY    = path.join(REPO_ROOT, "data", "data_cemetery");
const CLEAN_DIR   = path.join(REPO_ROOT, "data", "test_threads_clean");

const EXECUTE = process.argv.includes("--execute");

// ─── THREADS À GARDER dans test_threads ────────────────────────────────
// Modifier cette liste si le thread de test change
const KEEP = new Set([
  "B03-T03", // FA-Capital-V1.2 — thread de test beta
  "B09-T23", // Notion-Dev-011  — dernier thread B09 (état système actuel)
]);

// ─── UTILITAIRES ─────────────────────────────────────────────────────────────

function getIdFromFilename(filename) {
  const match = path.basename(filename, ".txt").match(/^(B\d{2}-T\d{2})/i);
  return match ? match[1].toUpperCase() : null;
}

async function dirExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function removeDir(dirPath) {
  // Supprime récursivement un dossier
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) await removeDir(full);
    else if (!EXECUTE) {} // dry-run : ne rien faire
    else await fs.unlink(full);
  }
  if (EXECUTE) await fs.rmdir(dirPath);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("INSIDE OS — PREPARATION BETA v01");
  console.log("---------------------------------");
  console.log(`Mode : ${EXECUTE ? "EXECUTE (modifications réelles)" : "DRY-RUN (simulation)"}`);
  console.log("");

  // Lister les fichiers dans test_threads
  const entries = await fs.readdir(SOURCE_DIR, { withFileTypes: true });
  const files   = entries
    .filter(e => e.isFile() && e.name.toLowerCase().endsWith(".txt"))
    .map(e => e.name)
    .sort((a, b) => a.localeCompare(b));

  const toKeep  = [];
  const toMove  = [];

  for (const filename of files) {
    const id = getIdFromFilename(filename);
    if (id && KEEP.has(id)) toKeep.push(filename);
    else toMove.push(filename);
  }

  // ── Affichage du plan ──
  console.log(`Threads conservés dans test_threads/ (${toKeep.length}) :`);
  for (const f of toKeep) console.log(`  [garder]  ${f}`);
  console.log("");

  console.log(`Threads déplacés vers data_cemetery/ (${toMove.length}) :`);
  for (const f of toMove) console.log(`  [cimetière] ${f}`);
  console.log("");

  const cleanExists = await dirExists(CLEAN_DIR);
  if (cleanExists) {
    console.log(`Dossier test_threads_clean/ → sera supprimé`);
    console.log("");
  }

  if (!EXECUTE) {
    console.log("─────────────────────────────────────────");
    console.log("DRY-RUN terminé. Aucune modification faite.");
    console.log("Pour exécuter :");
    console.log("  node os/scripts/prepare-beta.mjs --execute");
    return;
  }

  // ── Exécution ──

  // Créer data_cemetery si nécessaire
  await fs.mkdir(CEMETERY, { recursive: true });
  console.log(`[créé] data/data_cemetery/`);

  // Déplacer les threads vers data_cemetery
  let moved = 0;
  for (const filename of toMove) {
    const src  = path.join(SOURCE_DIR, filename);
    const dest = path.join(CEMETERY, filename);
    await fs.rename(src, dest);
    moved++;
    console.log(`[déplacé] ${filename} → data_cemetery/`);
  }

  // Supprimer test_threads_clean
  if (cleanExists) {
    await removeDir(CLEAN_DIR);
    console.log(`[supprimé] data/test_threads_clean/`);
  }

  console.log("");
  console.log("─────────────────────────────────────────");
  console.log(`Threads déplacés vers data_cemetery/ : ${moved}`);
  console.log(`Threads conservés dans test_threads/ : ${toKeep.length}`);
  console.log("");
  console.log("test_threads/ contient maintenant :");
  for (const f of toKeep) console.log(`  ${f}`);
  console.log("");
  console.log("Prochaine étape :");
  console.log("  npm run os:reset-db");
  console.log("  npm run os:ingest");
  console.log("  npm run os:extract -- --only B03-T03");
  console.log("  npm run os:inject  -- --only B03-T03");
}

main().catch(err => {
  console.error("[prepare-beta] ERREUR :", err.message);
  process.exit(1);
});
