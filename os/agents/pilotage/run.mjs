#!/usr/bin/env node
// os/agents/pilotage/run.mjs
//
// Point d'entrée CLI de l'Agent Pilotage.
// Usage : npm run os:pilotage -- --sujet "où en est INSIDE OS aujourd'hui ?"
//
// Sortie : runtime/pilotage/<timestamp>_<slug>.md + affichage console direct
// du format court (ÉTAT/BLOCAGE/ACTION/Sources).
// Aucune écriture Notion. Aucune modification du repo.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPilotage } from "./pilotage.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const OUTPUT_DIR = path.join(REPO_ROOT, "runtime/pilotage");

function parseArgs(argv) {
  const out = { sujet: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--sujet") {
      out.sujet = argv[++i];
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return out;
}

function printHelp() {
  console.log(`
Agent Pilotage — INSIDE OS

Usage :
  npm run os:pilotage -- --sujet "<sujet à piloter>"

Garde-fous :
  - Lecture seule absolue. Aucune écriture Notion, aucune modif repo.
  - Sortie : runtime/pilotage/<timestamp>_<slug>.md
  - Si la mémoire ne permet pas de répondre : ÉTAT = "mémoire insuffisante sur ce sujet".
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

  console.error(`\n=== Agent Pilotage — INSIDE OS ===`);
  console.error(`Sujet : "${args.sujet}"`);
  console.error(``);

  // Date unique du run, transmise à runPilotage (même principe que Synthèse :
  // une seule source de vérité pour la date, pas un second new Date() qui
  // pourrait dériver de quelques millisecondes de celle vue par le LLM).
  const runDate = new Date().toISOString();

  let result;
  try {
    result = await runPilotage({ sujet: args.sujet, runDate });
  } catch (e) {
    console.error(`\n❌ ÉCHEC : ${e.message}`);
    process.exit(1);
  }

  // Fichier de sortie : metadata + réponse LLM brute
  const lines = [];
  lines.push(`# PILOTAGE — ${result.sujet}`);
  lines.push(``);
  lines.push(`Produit par : Agent Pilotage v01`);
  lines.push(`Date        : ${result.runDate}`);
  lines.push(`Sources interrogées : ${result.sourcesInterrogees.join(" | ") || "(aucune)"}`);
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

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `${timestamp()}_${slugify(result.sujet)}.md`;
  const outPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");

  // Affichage console : le format court d'abord (usage direct), le detail
  // technique sur stderr (déjà loggé au fil de l'exécution par pilotage.mjs).
  console.log("\n" + (result.response || "(réponse LLM vide)") + "\n");
  console.error(`✅ Pilotage écrit : ${path.relative(REPO_ROOT, outPath)}`);
  console.error(``);
}

main();
