#!/usr/bin/env node
// os/agents/ingest-doc/run.mjs
//
// Point d'entrée CLI de l'Agent Ingestion Docs.
//
// Usage :
//   npm run os:ingest-doc -- <chemin/vers/fichier.pdf> --bucket B02 \
//     [--titre "Devis Septeuil v2"] [--source-url "https://drive.google.com/..."] [--yes]
//
// Principe : lit le PDF via l'API Claude, en extrait les faits au format
// thread dump, affiche le texte extrait et demande confirmation (mode
// interactif par défaut, --yes pour passer outre), puis dépose le fichier
// dans data/threads_to_process/ avec le prochain id_dump B99-Txx libre.
// Le pipeline existant (os:ingest --only / os:extract / os:inject) fait
// ensuite le reste — ce script ne l'appelle pas lui-même.
//
// Aucune écriture Notion. Lecture seule côté mémoire (id_dump libre calculé
// par simple query), écriture uniquement dans data/threads_to_process/.

import readline from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareIngestDoc, writeDump } from "./ingest-doc.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");

function printHelp() {
  console.log(`
Agent Ingestion Docs — INSIDE OS

Usage :
  npm run os:ingest-doc -- <chemin/vers/fichier.pdf> --bucket B02 \\
    [--titre "Devis Septeuil v2"] [--source-url "https://..."] [--yes]

Flags :
  --bucket <B01..B09|B99>   Requis. Indication de bucket transmise à l'extracteur.
  --titre "<texte>"         Optionnel. Titre lisible, sert aussi au nom de fichier.
  --source-url "<url>"      Optionnel. URL de l'original (Drive, etc.) — traçabilité.
  --yes, -y                 Passe la confirmation interactive.

Garde-fous :
  - PDF illisible, vide ou > 20 Mo -> rejet explicite (fail-loud).
  - bucket invalide -> rejet.
  - id_dump déjà pris (Notion ou fichier local) -> rejet.
  - garde anti-réinjection B99-T99 appliquée.
  - aucune écriture sans confirmation (sauf --yes).
`);
}

function parseArgs(argv) {
  const out = { filePath: null, bucket: null, titre: null, sourceUrl: null, yes: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else if (a === "--bucket") {
      out.bucket = argv[++i];
    } else if (a === "--titre") {
      out.titre = argv[++i];
    } else if (a === "--source-url") {
      out.sourceUrl = argv[++i];
    } else if (a === "--yes" || a === "-y") {
      out.yes = true;
    } else if (!a.startsWith("--") && !out.filePath) {
      out.filePath = a;
    }
  }
  return out;
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
  const { filePath, bucket, titre, sourceUrl, yes } = parseArgs(process.argv.slice(2));

  console.error(`\n=== Agent Ingestion Docs — INSIDE OS ===\n`);

  const prepared = await prepareIngestDoc({ filePath, bucket, titre, sourceUrl });

  console.log(`\n--- Texte extrait (id_dump attribué : ${prepared.idDump}) ---\n`);
  console.log(prepared.dumpText);
  console.log(`--- Fin du texte extrait ---\n`);
  console.log(`Destination : ${path.relative(REPO_ROOT, prepared.outPath)}\n`);

  if (!yes) {
    const answer = await askConfirmation(
      "Un document mal lu ne doit pas entrer dans la mémoire sans regard humain.\n" +
      "Écrire ce dump dans data/threads_to_process/ ? [y/N] "
    );
    if (answer !== "y" && answer !== "yes" && answer !== "o" && answer !== "oui") {
      console.error(`\n[ingest-doc] Annulé — rien n'a été écrit.\n`);
      process.exit(0);
    }
  }

  await writeDump({ outPath: prepared.outPath, dumpText: prepared.dumpText });
  console.error(`\n✅ Dump écrit : ${path.relative(REPO_ROOT, prepared.outPath)}`);
  console.error(`\nProchaines étapes (manuelles) :`);
  console.error(`  npm run os:ingest -- --mode batch --only ${prepared.idDump}`);
  console.error(`  npm run os:extract`);
  console.error(`  npm run os:inject`);
  console.error(``);
}

main().catch((e) => {
  console.error(`\n❌ ÉCHEC : ${e.message}\n`);
  process.exit(1);
});
