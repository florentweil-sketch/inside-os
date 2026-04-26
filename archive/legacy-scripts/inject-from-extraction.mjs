// scripts/inject-from-extraction.mjs
import "dotenv/config";
import {
  queryDatabase,
  createPage,
  updatePage,
  makeUid,
} from "./lib/notion-http.mjs";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const THREAD_DUMP_DB_ID = process.env.THREAD_DUMP_DB_ID;
const DECISIONS_DB_ID = process.env.DECISIONS_DB_ID;
const LESSONS_DB_ID = process.env.LESSONS_DB_ID;
const NOTION_VERSION = "2025-09-03";

function argFlag(name) {
  return process.argv.includes(name);
}
function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const DRY_RUN = argFlag("--dry-run");
const FORCE = argFlag("--force");
const OVERWRITE = argFlag("--overwrite");
const LIMIT = Number(argValue("--limit", "10"));
const TARGET_ID = argValue("--id", null);

function rt(content = "") {
  return { rich_text: [{ text: { content: String(content).slice(0, 2000) } }] };
}
function title(content = "") {
  return { title: [{ text: { content: String(content).slice(0, 2000) } }] };
}

function getPropText(page, propName) {
  const p = page.properties?.[propName];
  if (!p) return "";
  if (p.type === "rich_text") return (p.rich_text || []).map(t => t.plain_text).join("");
  if (p.type === "title") return (p.title || []).map(t => t.plain_text).join("");
  if (p.type === "select") return p.select?.name || "";
  return "";
}

async function notionGet(pathname) {
  const res = await fetch(`https://api.notion.com/v1${pathname}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
    },
  });

  const txt = await res.text();
  let data;
  try {
    data = JSON.parse(txt);
  } catch {
    data = { raw: txt };
  }

  if (!res.ok) {
    throw new Error(`${res.status} ${JSON.stringify(data)}`);
  }

  return data;
}

async function getAllBlockText(pageId) {
  let cursor = null;
  const chunks = [];

  for (;;) {
    const suffix = cursor ? `?page_size=100&start_cursor=${cursor}` : `?page_size=100`;
    const data = await notionGet(`/blocks/${pageId}/children${suffix}`);

    for (const block of data.results || []) {
      const type = block.type;
      const obj = block[type];

      if (!obj) continue;
      if (!Array.isArray(obj.rich_text)) continue;

      const txt = obj.rich_text.map(t => t.plain_text || "").join("");
      if (txt.trim()) chunks.push(txt);
    }

    if (!data.has_more) break;
    cursor = data.next_cursor;
    if (!cursor) break;
  }

  return chunks.join("\n");
}

async function markThreadDump(pageId, { status, summary, error }) {
  const props = {
    injection_status: { select: { name: status } },
    injection_summary: rt(summary || ""),
    injection_error: rt(error || ""),
  };
  if (!DRY_RUN) await updatePage({ token: NOTION_TOKEN, pageId, properties: props });
}

function sanitizeExtractionText(raw) {
  const s0 = String(raw || "");
  const s1 = s0.replace(/\/\*\s*chunk\s*\d+\s*\/\s*/gi, "\n");
  const s2 = s1.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  const i = s2.indexOf("{");
  const j = s2.lastIndexOf("}");
  if (i === -1 || j === -1 || j <= i) return null;
  return s2.slice(i, j + 1).trim();
}

function decisionProps({ uid, dumpId, threadPageId, item }) {
  return {
    uid: rt(uid),
    decision: title(item.decision || item.title || "Decision"),
    decision_date: item.decision_date
      ? { date: { start: item.decision_date } }
      : undefined,
    decision_type: item.decision_type
      ? { select: { name: item.decision_type } }
      : undefined,
    decision_status: { select: { name: "draft" } },
    rationale: rt(item.rationale || ""),
    owner: item.owner ? { people: [] } : undefined,
    consequences: rt(item.consequences || ""),
    risk_accepted: rt(item.risk_accepted || ""),
    evidence: rt(item.evidence || ""),
    impact_capital: item.impact_capital
      ? { select: { name: item.impact_capital } }
      : undefined,
    impact_operation: item.impact_operation
      ? { select: { name: item.impact_operation } }
      : undefined,
    horizon: item.horizon
      ? { select: { name: item.horizon } }
      : undefined,
    outcome: item.outcome
      ? { select: { name: item.outcome } }
      : undefined,
    source_dump_id: rt(dumpId || ""),
    source_thread: { relation: threadPageId ? [{ id: threadPageId }] : [] },
  };
}

function lessonProps({ uid, dumpId, threadPageId, item }) {
  return {
    uid: rt(uid),
    lesson: title(item.lesson || item.title || "Lesson"),
    what_happened: rt(item.what_happened || ""),
    learning_class: item.learning_class
      ? { select: { name: item.learning_class } }
      : undefined,
    severity: item.severity
      ? { select: { name: item.severity } }
      : undefined,
    evidence: rt(item.evidence || ""),
    source_dump_id: rt(dumpId || ""),
    status: { select: { name: "draft" } },
    source_thread: { relation: threadPageId ? [{ id: threadPageId }] : [] },
  };
}

async function findByUid(databaseId, uid) {
  const res = await queryDatabase({
    token: NOTION_TOKEN,
    databaseId,
    pageSize: 1,
    filter: { property: "uid", rich_text: { equals: uid } },
  });
  return res.results?.[0] || null;
}

async function upsert({ databaseId, uid, properties }) {
  const existing = await findByUid(databaseId, uid);
  const cleanProps = Object.fromEntries(
    Object.entries(properties).filter(([_, v]) => v !== undefined)
  );

  if (!existing) {
    if (!DRY_RUN) await createPage({ token: NOTION_TOKEN, databaseId, properties: cleanProps });
    return { mode: "created", pageId: null };
  } else {
    if (!DRY_RUN) await updatePage({ token: NOTION_TOKEN, pageId: existing.id, properties: cleanProps });
    return { mode: "updated", pageId: existing.id };
  }
}

async function archiveByThread({ databaseId, threadPageId, statusProperty = "status", archivedValue = "archived" }) {
  let archived = 0;
  let cursor = undefined;

  for (;;) {
    const res = await queryDatabase({
      token: NOTION_TOKEN,
      databaseId,
      pageSize: 100,
      filter: { property: "source_thread", relation: { contains: threadPageId } },
      startCursor: cursor,
    });

    const items = res.results || [];
    for (const p of items) {
      archived++;
      if (!DRY_RUN) {
        await updatePage({
          token: NOTION_TOKEN,
          pageId: p.id,
          properties: {
            [statusProperty]: { select: { name: archivedValue } }
          },
        });
      }
    }

    if (!res.has_more) break;
    cursor = res.next_cursor;
    if (!cursor) break;
  }

  return archived;
}

async function getThreadDumpCandidates(limit) {
  const filter = TARGET_ID
    ? { property: "id_dump", rich_text: { equals: TARGET_ID } }
    : FORCE
      ? { property: "extraction_status", select: { equals: "done" } }
      : {
          and: [
            { property: "extraction_status", select: { equals: "done" } },
            { property: "injection_status", select: { does_not_equal: "done" } },
          ],
        };

  const res = await queryDatabase({
    token: NOTION_TOKEN,
    databaseId: THREAD_DUMP_DB_ID,
    pageSize: TARGET_ID ? 1 : Math.min(limit, 50),
    filter,
    sorts: [{ property: "id_dump", direction: "ascending" }],
  });

  return res.results || [];
}

async function processOneThreadDump(page) {
  const threadPageId = page.id;
  const dumpId = getPropText(page, "id_dump");

  let rawExtraction = await getAllBlockText(threadPageId);

  if (!rawExtraction) {
    await markThreadDump(threadPageId, {
      status: "error",
      summary: "",
      error: "Aucun JSON d'extraction trouvé dans les blocks",
    });
    return;
  }

  const cleaned = sanitizeExtractionText(rawExtraction);
  if (!cleaned) {
    await markThreadDump(threadPageId, {
      status: "error",
      summary: "",
      error: `JSON des blocks illisible. head=${JSON.stringify(rawExtraction.slice(0, 120))}`,
    });
    return;
  }

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch (e) {
    await markThreadDump(threadPageId, {
      status: "error",
      summary: "",
      error: `JSON non parseable: ${e.message} | head=${JSON.stringify(cleaned.slice(0, 120))}`,
    });
    return;
  }

  const decisions = Array.isArray(data.decisions) ? data.decisions : [];
  const lessons = Array.isArray(data.lessons) ? data.lessons : [];

  let archivedDec = 0;
  let archivedLes = 0;
  if (OVERWRITE) {
    archivedDec = await archiveByThread({
      databaseId: DECISIONS_DB_ID,
      threadPageId,
      statusProperty: "decision_status",
      archivedValue: "archived"
    });
    archivedLes = await archiveByThread({
      databaseId: LESSONS_DB_ID,
      threadPageId,
      statusProperty: "status",
      archivedValue: "archived"
    });
  }

  let created = 0;
  let updated = 0;

  for (const item of decisions) {
    const uid = item.uid || makeUid({
      type: "decision",
      title: item.decision || item.title || "",
      owner: item.owner || "",
      dumpId,
    });

    const res = await upsert({
      databaseId: DECISIONS_DB_ID,
      uid,
      properties: decisionProps({ uid, dumpId, threadPageId, item }),
    });

    res.mode === "created" ? created++ : updated++;
  }

  for (const item of lessons) {
    const uid = item.uid || makeUid({
      type: "lesson",
      title: item.lesson || item.title || "",
      owner: "",
      dumpId,
    });

    const res = await upsert({
      databaseId: LESSONS_DB_ID,
      uid,
      properties: lessonProps({ uid, dumpId, threadPageId, item }),
    });

    res.mode === "created" ? created++ : updated++;
  }

  const summary =
    `decisions=${decisions.length} | lessons=${lessons.length} | created=${created} | updated=${updated}` +
    ` | overwrite=${OVERWRITE ? "yes" : "no"} (archived dec=${archivedDec}, les=${archivedLes})` +
    ` | mode=${DRY_RUN ? "DRY_RUN" : "LIVE"}`;

  await markThreadDump(threadPageId, { status: "done", summary, error: "" });
}

async function main() {
  if (!NOTION_TOKEN || !THREAD_DUMP_DB_ID || !DECISIONS_DB_ID || !LESSONS_DB_ID) {
    throw new Error("ENV manquante: NOTION_TOKEN, THREAD_DUMP_DB_ID, DECISIONS_DB_ID, LESSONS_DB_ID");
  }

  console.log(
    `Mode: ${DRY_RUN ? "DRY_RUN" : "LIVE"}${FORCE ? " [FORCE]" : ""}${OVERWRITE ? " [OVERWRITE]" : ""}` +
    `${TARGET_ID ? ` [ID=${TARGET_ID}]` : ""}`
  );

  const candidates = await getThreadDumpCandidates(LIMIT);
  if (!candidates.length) {
    console.log("Aucun thread_dump à injecter.");
    return;
  }

  console.log(`Candidats: ${candidates.length} (limit=${TARGET_ID ? 1 : LIMIT})`);
  for (const page of candidates) {
    const dumpId = getPropText(page, "id_dump");
    console.log(`→ Processing id_dump=${dumpId || "(unknown)"}${DRY_RUN ? " [DRY]" : ""}`);
    try {
      await processOneThreadDump(page);
      console.log("  OK");
    } catch (e) {
      console.error("  ERROR:", e.message);
      await markThreadDump(page.id, { status: "error", summary: "", error: e.message });
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
