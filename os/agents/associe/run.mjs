#!/usr/bin/env node
// os/agents/associe/run.mjs
//
// Point d'entrée CLI de l'Agent Associé — point d'entrée conversationnel
// unique. Usage : npm run os:associe -- "ton message"
//
// Lecture seule stricte, sauf curation (os:statut) — et seulement après
// confirmation interactive explicite. Aucune fenêtre de conversation (v1) :
// un message, une réponse, le process se termine.

import readline from "node:readline";
import { runAssocie } from "./associe.mjs";
import { applyStatut } from "../../scripts/statut.mjs";

function printHelp() {
  console.log(`
Agent Associé — INSIDE OS

Usage :
  npm run os:associe -- "ton message"

Routage (classification automatique de l'intention) :
  - état/avancement d'un dossier          -> Agent Pilotage
  - analyse/synthèse d'un sujet           -> Agent Synthèse
  - "quoi faire aujourd'hui" / brief      -> Agent Ouverture
  - question mémoire directe              -> repêchage scoré
  - "X est périmé/acté autrement"         -> proposition de curation
                                              (confirmation explicite requise)
  - hors périmètre mémoire                -> le dit explicitement

Garde-fous :
  - Lecture seule stricte, sauf curation confirmée (os:statut).
  - Pas de fenêtre de conversation (v1) — un message, une réponse.
`);
}

function askConfirmation(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const message = args.filter((a) => !a.startsWith("--")).join(" ");

  console.error(`\n=== Agent Associé — INSIDE OS ===\n`);

  const result = await runAssocie({ message });

  console.log(`\n${result.response}\n`);

  if (result.intention === "curation" && result.curationProposal) {
    const { uid, targetStatus, itemTitle, command } = result.curationProposal;
    const answer = await askConfirmation(
      `Confirmer la curation — "${itemTitle}" (${uid}) → ${targetStatus} ?\n` +
      `Commande : ${command}\n` +
      `Confirmer ? (o/n) : `
    );
    if (answer === "o" || answer === "oui" || answer === "y" || answer === "yes") {
      const applied = await applyStatut(uid, targetStatus);
      console.log(`\n✅ [os:statut] ${applied.uid} : ${applied.oldStatus} -> ${applied.newStatus} ("${applied.decisionTitle}")\n`);
    } else {
      console.log(`\n[associe] Curation annulée — aucune écriture Notion.\n`);
    }
  }
}

main().catch((e) => {
  console.error(`\n❌ ÉCHEC : ${e.message}\n`);
  process.exit(1);
});
