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
const VALID_TARGET_STATUSES = ["superseded", "archived", "rejected"];

async function findByUid(uid) {
  const res = await queryDataSource(DECISIONS_DS_ID, {
    page_size: 1,
    filter: { property: "uid", rich_text: { equals: uid } },
  });
  return res.results?.[0] || null;
}

async function main() {
  if (!DECISIONS_DS_ID) throw new Error("ENV missing: DECISIONS_DS_ID");

  const [uid, newStatus] = process.argv.slice(2);

  if (!uid || !newStatus) {
    throw new Error(
      "Usage : npm run os:statut -- <uid> <superseded|archived|rejected>"
    );
  }

  if (!VALID_TARGET_STATUSES.includes(newStatus)) {
    throw new Error(
      `Statut invalide "${newStatus}". Valeurs acceptées : ${VALID_TARGET_STATUSES.join(", ")}.`
    );
  }

  const page = await findByUid(uid);
  if (!page) {
    throw new Error(`uid introuvable dans DECISIONS : "${uid}"`);
  }

  const oldStatus = getPropText(page, "decision_status") || "(vide)";
  const decisionTitle = getPropText(page, "decision") || "(sans titre)";

  await updatePage(page.id, {
    decision_status: { select: { name: newStatus } },
  });

  console.log(`[os:statut] uid: ${uid}`);
  console.log(`[os:statut] decision: ${decisionTitle}`);
  console.log(`[os:statut] statut : ${oldStatus} -> ${newStatus}`);
}

main().catch((e) => {
  console.error("[os:statut] ERREUR:", e.message);
  process.exit(1);
});
