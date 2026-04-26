import "dotenv/config";
import { queryDataSource } from "../lib/notion.mjs";

const THREAD_DUMP_DS_ID = process.env.THREAD_DUMP_DS_ID;
const DECISIONS_DS_ID = process.env.DECISIONS_DS_ID;
const LESSONS_DS_ID = process.env.LESSONS_DS_ID;

async function count(dataSourceId, filter) {
  let total = 0;
  let cursor;

  while (true) {
    const res = await queryDataSource(dataSourceId, {
      page_size: 100,
      start_cursor: cursor,
      ...(filter ? { filter } : {}),
    });

    total += res.results.length;

    if (!res.has_more) break;
    cursor = res.next_cursor;
  }

  return total;
}

async function auditThreadDump() {
  const total = await count(THREAD_DUMP_DS_ID);

  const extractDone = await count(THREAD_DUMP_DS_ID, {
    property: "extraction_status",
    select: { equals: "done" },
  });

  const extractPending = await count(THREAD_DUMP_DS_ID, {
    property: "extraction_status",
    select: { equals: "pending" },
  });

  const extractError = await count(THREAD_DUMP_DS_ID, {
    property: "extraction_status",
    select: { equals: "error" },
  });

  const injectDone = await count(THREAD_DUMP_DS_ID, {
    property: "injection_status",
    select: { equals: "done" },
  });

  const injectPending = await count(THREAD_DUMP_DS_ID, {
    property: "injection_status",
    select: { equals: "pending" },
  });

  const injectError = await count(THREAD_DUMP_DS_ID, {
    property: "injection_status",
    select: { equals: "error" },
  });

  console.log("\nTHREAD_DUMP");
  console.log("total:", total);
  console.log("extract_done:", extractDone);
  console.log("extract_pending:", extractPending);
  console.log("extract_error:", extractError);
  console.log("inject_done:", injectDone);
  console.log("inject_pending:", injectPending);
  console.log("inject_error:", injectError);
}

async function auditDecisions() {
  const total = await count(DECISIONS_DS_ID);

  console.log("\nDECISIONS");
  console.log("total:", total);
}

async function auditLessons() {
  const total = await count(LESSONS_DS_ID);

  console.log("\nLESSONS");
  console.log("total:", total);
}

async function main() {
  console.log("\nINSIDE OS AUDIT");
  console.log("---------------");

  await auditThreadDump();
  await auditDecisions();
  await auditLessons();

  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});