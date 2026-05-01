// os/scripts/clean-threads.mjs
// INSIDE OS — Nettoyage des threads historiques
// Supprime les caractères spéciaux qui cassent l'extraction JSON
// Produit des copies propres dans data/test_threads_clean/
// Usage : node os/scripts/clean-threads.mjs
//         node os/scripts/clean-threads.mjs --in-place  (écrase les originaux)

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const REPO_ROOT  = path.resolve(__dirname, "../..");

const IN_PLACE   = process.argv.includes("--in-place");
const SOURCE_DIR = path.join(REPO_ROOT, "data", "test_threads");
const DEST_DIR   = IN_PLACE ? SOURCE_DIR : path.join(REPO_ROOT, "data", "test_threads_clean");

// ─── NETTOYAGE ───────────────────────────────────────────────────────────────

/**
 * Nettoie un texte brut pour garantir une extraction JSON propre.
 * Règle : supprimer / remplacer les caractères qui cassent le JSON
 * sans jamais altérer le contenu sémantique.
 */
function cleanText(text) {
  let t = text;

  // 1. Normaliser les fins de ligne
  t = t.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Supprimer les émojis et caractères Unicode hors BMP (U+1F000 et au-delà)
  t = t.replace(/[\u{1F000}-\u{1FFFF}]/gu, "");
  t = t.replace(/[\u{2600}-\u{27BF}]/gu, "");  // symboles divers (☑, ⚠, ✅, ❌, 🔥, etc.)
  t = t.replace(/[\u{2B00}-\u{2BFF}]/gu, "");  // flèches et divers
  t = t.replace(/[\u{FE00}-\u{FE0F}]/gu, "");  // variation selectors

  // 3. Guillemets typographiques → guillemets droits
  t = t.replace(/[\u201C\u201D\u201E\u201F]/g, '"');  // " " „ ‟
  t = t.replace(/[\u2018\u2019\u201A\u201B]/g, "'");  // ' ' ‚ ‛
  t = t.replace(/[\u00AB\u00BB]/g, '"');               // « »

  // 4. Apostrophes typographiques → apostrophe droite
  t = t.replace(/\u2019/g, "'");

  // 5. Tirets longs / demi-tirets → tiret simple
  t = t.replace(/[\u2013\u2014\u2015]/g, "-");  // – — ―

  // 6. Flèches Unicode → texte ASCII
  t = t.replace(/\u2192/g, "->"); // →
  t = t.replace(/\u2190/g, "<-"); // ←
  t = t.replace(/\u2194/g, "<->"); // ↔
  t = t.replace(/\u21D2/g, "=>"); // ⇒
  t = t.replace(/\u21D0/g, "<="); // ⇐

  // 7. Bullets et listes → tiret
  t = t.replace(/[\u2022\u2023\u2043\u204C\u204D\u2219\u25AA\u25AB\u25B8\u25CF\u25E6]/g, "-");
  t = t.replace(/^\s*[•·▸▪▫◦‣⁃]\s*/gm, "- ");

  // 8. Numérotation stylisée (1️⃣ 2️⃣ etc.) — déjà couverte par émojis mais sécurité
  t = t.replace(/[\u20E3]/g, "");  // combining enclosing keycap

  // 9. Espaces insécables → espace normal
  t = t.replace(/[\u00A0\u202F\u2007\u2060]/g, " ");

  // 10. Caractères de contrôle (sauf \n et \t)
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  // 11. Réduire les lignes vides multiples (> 2 consécutives)
  t = t.replace(/\n{3,}/g, "\n\n");

  // 12. Trim final
  t = t.trim();

  return t;
}

// ─── STATS ───────────────────────────────────────────────────────────────────

function computeDiff(original, cleaned) {
  const removedChars = original.length - cleaned.length;
  const changes = [];

  if (/[\u{1F000}-\u{1FFFF}]/u.test(original)) changes.push("emojis");
  if (/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/.test(original)) changes.push("guillemets typographiques");
  if (/[\u2013\u2014\u2015]/.test(original)) changes.push("tirets longs");
  if (/\u2192|\u2190|\u21D2/.test(original)) changes.push("fleches Unicode");
  if (/[\u2022\u2023\u25CF\u25AA]/.test(original)) changes.push("bullets Unicode");
  if (/[\u00A0\u202F]/.test(original)) changes.push("espaces insecables");
  if (/[\u2600-\u27BF]/.test(original)) changes.push("symboles speciaux");

  return { removedChars, changes };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("INSIDE OS — NETTOYAGE DES THREADS");
  console.log("----------------------------------");
  console.log(`Mode    : ${IN_PLACE ? "IN-PLACE (écrase les originaux)" : "COPIE (→ test_threads_clean/)"}`);
  console.log(`Source  : ${SOURCE_DIR}`);
  console.log(`Dest    : ${DEST_DIR}`);
  console.log("");

  // Créer le dossier de destination si nécessaire
  if (!IN_PLACE) {
    await fs.mkdir(DEST_DIR, { recursive: true });
  }

  // Lister les fichiers
  const entries = await fs.readdir(SOURCE_DIR, { withFileTypes: true });
  const files   = entries
    .filter(e => e.isFile() && e.name.toLowerCase().endsWith(".txt"))
    .map(e => e.name)
    .sort((a, b) => a.localeCompare(b));

  if (!files.length) {
    console.log("Aucun fichier .txt trouvé dans le dossier source.");
    return;
  }

  let totalFiles    = 0;
  let modifiedFiles = 0;
  let totalRemoved  = 0;

  for (const filename of files) {
    const srcPath  = path.join(SOURCE_DIR, filename);
    const destPath = path.join(DEST_DIR, filename);

    const original = await fs.readFile(srcPath, "utf8");
    const cleaned  = cleanText(original);

    const { removedChars, changes } = computeDiff(original, cleaned);
    totalFiles++;
    totalRemoved += removedChars;

    if (cleaned !== original) {
      modifiedFiles++;
      const tag = changes.length ? `[${changes.join(", ")}]` : "[modifie]";
      console.log(`  [nettoyé] ${filename} — ${removedChars} chars supprimés ${tag}`);
    } else {
      console.log(`  [propre]  ${filename}`);
    }

    await fs.writeFile(destPath, cleaned, "utf8");
  }

  console.log("");
  console.log("─────────────────────────────────");
  console.log(`Fichiers traités  : ${totalFiles}`);
  console.log(`Fichiers modifiés : ${modifiedFiles}`);
  console.log(`Chars supprimés   : ${totalRemoved}`);
  console.log("");

  if (!IN_PLACE) {
    console.log(`Fichiers propres disponibles dans :`);
    console.log(`  ${DEST_DIR}`);
    console.log("");
    console.log("Vérifiez le résultat, puis pour appliquer sur les originaux :");
    console.log("  node os/scripts/clean-threads.mjs --in-place");
  } else {
    console.log("Nettoyage in-place terminé.");
  }
}

main().catch(err => {
  console.error("[clean-threads] ERREUR :", err.message);
  process.exit(1);
});
