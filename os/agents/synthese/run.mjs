#!/usr/bin/env node
// os/agents/synthese/run.mjs
//
// Point d'entrée CLI de l'Agent Synthèse.
// Usage : npm run os:synthese -- --sujet "état technique réel d'INSIDE OS"
//
// Sortie : runtime/synthese/<timestamp>_<slug>.md
// Aucune écriture Notion. Aucune modification du repo.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSynthese } from "./synthese.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const OUTPUT_DIR = path.join(REPO_ROOT, "runtime/synthese");

function parseArgs(argv) {
  const out = { sujet: null, limit: 30, minScore: 2, noContent: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--sujet") {
      out.sujet = argv[++i];
    } else if (a === "--limit") {
      out.limit = parseInt(argv[++i], 10);
    } else if (a === "--min-score") {
      out.minScore = parseInt(argv[++i], 10);
    } else if (a === "--no-content") {
      out.noContent = true;
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return out;
}

function printHelp() {
  console.log(`
Agent Synthèse — INSIDE OS

Usage :
  npm run os:synthese -- --sujet "<sujet à synthétiser>"

Options :
  --sujet "..."     Sujet de la synthèse (obligatoire)
  --limit N         Nombre max d'items retenus (défaut 30)
  --min-score N     Seuil minimal de pertinence (défaut 2)
  --no-content      Ne pas lire les blocs des pages (synthèse sur raw_text uniquement)
  -h, --help        Cette aide

Garde-fous :
  - Lecture seule absolue. Aucune écriture Notion, aucune modif repo.
  - Sortie : runtime/synthese/<timestamp>_<slug>.md
  - Si une datasource échoue, la complétude est dégradée — pas de fallback silencieux.
`);
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_` +
    `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.sujet) {
    console.error("ERREUR : --sujet est obligatoire.\n");
    printHelp();
    process.exit(1);
  }

  console.error(`\n=== Agent Synthèse — INSIDE OS ===`);
  console.error(`Sujet : "${args.sujet}"`);
  console.error(``);

  let result;
  try {
    result = await runSynthese({
      sujet: args.sujet,
      limit: args.limit,
      minScore: args.minScore,
      withContent: !args.noContent,
    });
  } catch (e) {
    console.error(`\n❌ ÉCHEC : ${e.message}`);
    process.exit(1);
  }

  // Construire le document de sortie : metadata + réponse LLM brute
  const lines = [];
  lines.push(`# SYNTHÈSE — ${result.sujet}`);
  lines.push(``);
  lines.push(`Produit par : Agent Synthèse v01`);
  lines.push(`Date        : ${new Date().toISOString()}`);
  lines.push(`Sources interrogées : ${result.sourcesInterrogees.join(" | ") || "(aucune)"}`);
  lines.push(`Tokens du sujet : ${result.tokens.join(", ")}`);
  lines.push(`Pages lues : ${result.pagesLues} | Items retenus : ${result.itemsCount}`);
  lines.push(`Complétude technique (préalable au LLM) : ${result.completude}`);
  if (result.errors.length) {
    lines.push(`Erreurs rencontrées :`);
    for (const e of result.errors) lines.push(`  - ${e}`);
  }
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(result.response || "(réponse LLM vide)");
  lines.push(``);

  // Écriture en runtime/synthese/
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `${timestamp()}_${slugify(result.sujet)}.md`;
  const outPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");

  console.error(``);
  console.error(`✅ Synthèse écrite : ${path.relative(REPO_ROOT, outPath)}`);
  console.error(``);
}

main();
