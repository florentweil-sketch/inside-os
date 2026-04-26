import "dotenv/config";
import { queryDataSource, getPropText } from "../lib/notion.mjs";

const THREAD_DUMP_DS_ID = process.env.THREAD_DUMP_DS_ID;

async function main() {

  console.log("\nTHREADS WITH INJECTION ERROR");
  console.log("----------------------------");

  let cursor;

  while (true) {

    const res = await queryDataSource(THREAD_DUMP_DS_ID, {
      page_size: 100,
      start_cursor: cursor,
      filter: {
        property: "injection_status",
        select: { equals: "error" }
      }
    });

    for (const page of res.results) {

      const idDump = getPropText(page, "id_dump");
      const status = getPropText(page, "injection_status");

      console.log(`${idDump}  |  ${status}`);
    }

    if (!res.has_more) break;
    cursor = res.next_cursor;
  }

  console.log("");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});