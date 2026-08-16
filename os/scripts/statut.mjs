#!/usr/bin/env node
// os/scripts/statut.mjs
//
// Curation manuelle du decision_status d'une décision (DECISIONS uniquement).
// Usage : npm run os:statut -- <uid> <superseded|archived|rejected>
//
// decision_status est rempli à 100% par l'extracteur (proposed/validated à
// l'écriture) mais rien dans le pipeline ne pose jamais superseded/archived/
// rejected — ce sont des statuts de curation humaine, pas d'extraction. Ce
// script est le seul point d'écriture pour ces trois statuts terminaux.
//
// Fail-loud : uid introuvable ou statut hors de la liste acceptée -> throw,
// pas de fallback silencieux, pas d'écriture partielle.

import "dotenv/config";
import { queryDataSource, updatePage, getPropText } from "../lib/notion.mjs";

const DECISIONS_DS_ID = process.env.DECISIONS_DS_ID;

// Statuts de curation acceptés par ce script — volontairement un sous-ensemble
// du VALID_STATUS complet d'inject-decisions-lessons.mjs (proposed/validated/
// draft sont posés par l'extracteur, jamais par ce script).
export const VALID_TARGET_STATUSES = ["superseded", "archived", "rejected"];

export async function findDecisionByUid(uid) {
  if (!DECISIONS_DS_ID) throw new Error("ENV missing: DECISIONS_DS_ID");
  const res = await queryDataSource(DECISIONS_DS_ID, {
    page_size: 1,
    filter: { property: "uid", rich_text: { equals: uid } },
  });
  return res.results?.[0] || null;
}

// Logique de curation réutilisable (os:statut CLI + Agent Associé, B09-T42).
// Fail-loud : statut invalide ou uid introuvable -> throw, jamais de defaut.
export async function applyStatut(uid, newStatus) {
  if (!VALID_TARGET_STATUSES.includes(newStatus)) {
    throw new Error(
      `Statut invalide "${newStatus}". Valeurs acceptées : ${VALID_TARGET_STATUSES.join(", ")}.`
    );
  }

  const page = await findDecisionByUid(uid);
  if (!page) {
    throw new Error(`uid introuvable dans DECISIONS : "${uid}"`);
  }

  const oldStatus = getPropText(page, "decision_status") || "(vide)";
  const decisionTitle = getPropText(page, "decision") || "(sans titre)";

  await updatePage(page.id, {
    decision_status: { select: { name: newStatus } },
  });

  return { uid, oldStatus, newStatus, decisionTitle, pageId: page.id };
}

async function main() {
  const [uid, newStatus] = process.argv.slice(2);

  if (!uid || !newStatus) {
    throw new Error(
      "Usage : npm run os:statut -- <uid> <superseded|archived|rejected>"
    );
  }

  const result = await applyStatut(uid, newStatus);

  console.log(`[os:statut] uid: ${result.uid}`);
  console.log(`[os:statut] decision: ${result.decisionTitle}`);
  console.log(`[os:statut] statut : ${result.oldStatus} -> ${result.newStatus}`);
}

// Garde d'exécution standard ESM : ne lance main() (et ne lit process.argv)
// que si ce fichier est le module exécuté directement (node os/scripts/statut.mjs).
// Sans elle, importer applyStatut()/VALID_TARGET_STATUSES depuis un autre
// module (Agent Associé, B09-T42) déclenchait ce main() avec les argv de
// l'appelant — bug trouvé en vérifiant os:associe de bout en bout.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("[os:statut] ERREUR:", e.message);
    process.exit(1);
  });
}
