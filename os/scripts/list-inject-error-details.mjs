import "dotenv/config";
import { queryDataSource, getPropText } from "../lib/notion.mjs";

const THREAD_DUMP_DS_ID = process.env.THREAD_DUMP_DS_ID;

async function main() {
  console.log("\nTHREADS WITH INJECTION ERROR DETAILS");
  console.log("-----------------------------------");

  let cursor;

  while (true) {
    const res = await queryDataSource(THREAD_DUMP_DS_ID, {
      page_size: 100,
      start_cursor: cursor,
      filter: {
        property: "injection_status",
        select: { equals: "error" },
      },
      sorts: [{ property: "id_dump", direction: "ascending" }],
    });

    for (const page of res.results || []) {
      const idDump = getPropText(page, "id_dump") || "(unknown)";
      const status = getPropText(page, "injection_status") || "";
      const error = getPropText(page, "injection_error") || "";

      console.log(`${idDump} | ${status} | ${error}`);
    }

    if (!res.has_more) break;
    cursor = res.next_cursor;
  }

  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});