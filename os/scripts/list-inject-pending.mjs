import "dotenv/config";
import { queryDataSource, getPropText } from "../lib/notion.mjs";

const THREAD_DUMP_DS_ID = process.env.THREAD_DUMP_DS_ID;

async function main() {
  if (!THREAD_DUMP_DS_ID) {
    throw new Error("ENV missing: THREAD_DUMP_DS_ID");
  }

  const res = await queryDataSource(THREAD_DUMP_DS_ID, {
    page_size: 100,
    filter: {
      and: [
        { property: "extraction_status", select: { equals: "done" } },
        { property: "injection_status", select: { equals: "pending" } }
      ]
    },
    sorts: [
      { property: "id_dump", direction: "ascending" }
    ]
  });

  const rows = res.results || [];

  console.log("");
  console.log("THREADS WITH INJECTION PENDING");
  console.log("--------------------------------");

  if (!rows.length) {
    console.log("none");
    return;
  }

  for (const page of rows) {
    const id = getPropText(page, "id_dump") || "(unknown)";
    console.log(id);
  }

  console.log("");
  console.log(`count: ${rows.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});