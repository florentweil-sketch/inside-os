#!/usr/bin/env node
// os/agents/ouverture/run.mjs
//
// Point d'entrée CLI de l'Agent Ouverture — le brief du matin.
// Usage : npm run os:ouverture (sans argument)
//
// Sortie : runtime/ouverture/<date>.md (un fichier par jour, écrasé si
// relancé le même jour — c'est le brief DU jour, pas un historique) +
// affichage console.
// Aucune écriture Notion. Aucune modification du repo.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runOuverture } from "./ouverture.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const OUTPUT_DIR = path.join(REPO_ROOT, "runtime/ouverture");

function parseArgs(argv) {
  for (const a of argv) {
    if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    }
  }
}

function printHelp() {
  console.log(`
Agent Ouverture — INSIDE OS

Usage :
  npm run os:ouverture

Sans argument — balaie le présent (bucket B99), les items récents (30j) et
les décisions proposed, produit la liste des tâches classées par famille.

Garde-fous :
  - Lecture seule absolue. Aucune écriture Notion, aucune modif repo.
  - Sortie : runtime/ouverture/<date>.md
`);
}

async function main() {
  parseArgs(process.argv.slice(2));

  console.error(`\n=== Agent Ouverture — INSIDE OS ===`);
  console.error(``);

  const runDate = new Date().toISOString();

  let result;
  try {
    result = await runOuverture({ runDate });
  } catch (e) {
    console.error(`\n❌ ÉCHEC : ${e.message}`);
    process.exit(1);
  }

  const lines = [];
  lines.push(`<!-- Produit par : Agent Ouverture v01 -->`);
  lines.push(`<!-- Date        : ${result.runDate} -->`);
  lines.push(`<!-- Sources interrogées : ${result.sourcesInterrogees.join(" | ") || "(aucune)"} -->`);
  lines.push(`<!-- Pages lues : ${result.pagesLues} | Candidats fusionnés : ${result.candidatesCount} -->`);
  lines.push(`<!-- Complétude technique (préalable au LLM) : ${result.completude} -->`);
  if (result.errors.length) {
    lines.push(`<!-- Erreurs rencontrées :`);
    for (const e of result.errors) lines.push(`  - ${e}`);
    lines.push(`-->`);
  }
  lines.push(``);
  lines.push(result.response || "(réponse LLM vide)");
  lines.push(``);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `${result.todayDate}.md`;
  const outPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");

  console.log("\n" + (result.response || "(réponse LLM vide)") + "\n");
  console.error(`✅ Ouverture écrite : ${path.relative(REPO_ROOT, outPath)}`);
  console.error(``);
}

main();
