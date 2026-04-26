// os/scripts/reset-databases.mjs
// INSIDE OS — Reset complet des 3 bases
// Archive toutes les pages de THREAD_DUMP, DECISIONS et LESSONS
// Ne supprime PAS les bases — juste les entrées

import "dotenv/config";
import { queryDataSource, getPropText } from "../lib/notion.mjs";

const BATCH = 100;

async function archivePage(pageId) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      "Notion-Version": "2025-09-03",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ archived: true }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Archive failed for ${pageId}: ${err}`);
  }
}

async function resetBase(label, dataSourceId) {
  console.log(`\n→ ${label} (${dataSourceId})`);
  let cursor = undefined;
  let total = 0;
  let archived = 0;

  while (true) {
    const payload = { page_size: BATCH };
    if (cursor) payload.start_cursor = cursor;

    const res = await queryDataSource(dataSourceId, payload);
    const pages = res.results || [];
    total += pages.length;

    for (const page of pages) {
      try {
        await archivePage(page.id);
        archived++;
        process.stdout.write(`\r  archivé : ${archived}/${total}`);
      } catch (err) {
        console.error(`\n  ERREUR page ${page.id}: ${err.message}`);
      }
    }

    if (!res.has_more) break;
    cursor = res.next_cursor;
  }

  console.log(`\n  DONE — ${archived} entrées archivées`);
  return archived;
}

async function main() {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║   INSIDE OS — RESET COMPLET DES BASES ║");
  console.log("╚═══════════════════════════════════════╝");
  console.log("\n⚠️  Cette opération archive toutes les entrées.");
  console.log("    Les bases Notion restent intactes.\n");

  const t1 = await resetBase("THREAD_DUMP", process.env.THREAD_DUMP_DS_ID);
  const t2 = await resetBase("DECISIONS",   process.env.DECISIONS_DS_ID);
  const t3 = await resetBase("LESSONS",     process.env.LESSONS_DS_ID);

  console.log("\n╔═══════════════════════════════╗");
  console.log("║         RÉSUMÉ FINAL          ║");
  console.log("╠═══════════════════════════════╣");
  console.log(`║  THREAD_DUMP : ${String(t1).padEnd(15)}║`);
  console.log(`║  DECISIONS   : ${String(t2).padEnd(15)}║`);
  console.log(`║  LESSONS     : ${String(t3).padEnd(15)}║`);
  console.log(`║  TOTAL       : ${String(t1+t2+t3).padEnd(15)}║`);
  console.log("╚═══════════════════════════════╝");
  console.log("\n✅ Bases prêtes pour la nouvelle ingestion.\n");
}

main().catch((e) => {
  console.error("\n❌ ERREUR :", e.message);
  process.exit(1);
});
