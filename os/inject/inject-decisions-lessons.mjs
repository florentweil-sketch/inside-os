// os/inject/inject-decisions-lessons.mjs
import "dotenv/config";
import fs   from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  queryDataSource,
  createPage,
  updatePage,
  listAllBlockChildren,
  getDataSource,
  rt,
  title,
  getPropText,
} from "../lib/notion.mjs";
import { makeUid } from "../lib/uid.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const REPO_ROOT  = path.resolve(__dirname, "../..");

const THREAD_DUMP_DS_ID = process.env.THREAD_DUMP_DS_ID;
const DECISIONS_DS_ID   = process.env.DECISIONS_DS_ID;
const LESSONS_DS_ID     = process.env.LESSONS_DS_ID;

function argFlag(name) { return process.argv.includes(name); }
function argValue(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const DRY_RUN   = argFlag("--dry-run");
const FORCE     = argFlag("--force");
const OVERWRITE = argFlag("--overwrite");
const LIMIT     = Number(argValue("--limit", "50"));
const ONLY      = String(argValue("--only", "")).trim().toUpperCase();

function cleanOptionalString(value) {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

// ─── NORMALISATION V2 ────────────────────────────────────────────────────────
// Préserve tous les champs V2 : bucket, impact, status, agents, agent_suggestions, type

function normalizeExtractionPayload(data) {
  const rawDecisions = Array.isArray(data?.decisions) ? data.decisions : [];
  const rawLessons   = Array.isArray(data?.lessons)   ? data.lessons   : [];

  const decisions = rawDecisions
    .filter(i => i && typeof i === "object")
    .map(i => {
      const decision = cleanOptionalString(i.decision);
      if (!decision) return null;
      const obj = { decision };

      // Champs V1
      const rationale = cleanOptionalString(i.rationale); if (rationale) obj.rationale = rationale;
      const evidence  = cleanOptionalString(i.evidence);  if (evidence)  obj.evidence  = evidence;

      // Champs V2
      if (Array.isArray(i.bucket) && i.bucket.length > 0)    obj.bucket = i.bucket.slice(0, 3); // max 3
      if (cleanOptionalString(i.impact))                      obj.impact  = i.impact.trim();
      if (cleanOptionalString(i.status))                      obj.status  = i.status.trim();
      if (Array.isArray(i.agents) && i.agents.length > 0)    obj.agents  = i.agents;
      if (Array.isArray(i.agent_suggestions))                 obj.agent_suggestions = i.agent_suggestions;

      return obj;
    })
    .filter(Boolean);

  const lessons = rawLessons
    .filter(i => i && typeof i === "object")
    .map(i => {
      const lesson = cleanOptionalString(i.lesson);
      if (!lesson) return null;
      const obj = { lesson };

      // Champs V1
      const whatHappened = cleanOptionalString(i.what_happened); if (whatHappened) obj.what_happened = whatHappened;
      const evidence     = cleanOptionalString(i.evidence);      if (evidence)     obj.evidence      = evidence;

      // Champs V2
      if (Array.isArray(i.bucket) && i.bucket.length > 0)    obj.bucket = i.bucket.slice(0, 3); // max 3
      if (cleanOptionalString(i.type))                        obj.type    = i.type.trim();
      if (Array.isArray(i.agents) && i.agents.length > 0)    obj.agents  = i.agents;
      if (Array.isArray(i.agent_suggestions))                 obj.agent_suggestions = i.agent_suggestions;

      return obj;
    })
    .filter(Boolean);

  return { decisions, lessons };
}

// ─── PROPRIÉTÉS NOTION ───────────────────────────────────────────────────────
//
// MAPPINGS V2 (gravés — ne pas modifier sans mise à jour du schéma Notion) :
//   json.status  → Notion: decision_status  (decisions_structural)
//   json.type    → Notion: lesson_type      (lessons_learnings)
//
// Les champs agents et agent_suggestions sont stockés en JSON stringifié (RICH_TEXT)
// car Notion ne supporte pas les arrays d'objets natifs.

const VALID_BUCKETS = ["B01","B02","B03","B04","B05","B06","B07","B08","B09","B99"];
const VALID_IMPACT  = ["critical","major","minor"];
const VALID_STATUS  = ["validated","proposed","superseded","archived","draft","rejected"];
const VALID_LESSON_TYPE = ["technical","strategic","operational","process","relational"];

function sanitizeBucket(bucket) {
  if (!Array.isArray(bucket)) return undefined;
  const valid = bucket.filter(b => VALID_BUCKETS.includes(b));
  return valid.length > 0 ? valid : undefined;
}

function decisionProps({ uid, dumpId, threadPageId, item }) {
  const props = {
    uid:             rt(uid),
    decision:        title(item.decision || item.title || "Decision"),
    rationale:       rt(item.rationale || ""),
    evidence:        rt(item.evidence  || ""),
    source_dump_id:  rt(dumpId || ""),

    // MAPPING V2 : json.status → decision_status
    decision_status: {
      select: {
        name: VALID_STATUS.includes(item.status) ? item.status : "proposed"
      }
    },

    ...(threadPageId
      ? { source_thread: { relation: [{ id: threadPageId }] } }
      : {}),
    ...(OVERWRITE
      ? { archived: { checkbox: false }, archived_at: { date: null } }
      : {}),
  };

  // Champs V2 — ajout conditionnel

  // impact
  if (item.impact && VALID_IMPACT.includes(item.impact)) {
    props.impact = { select: { name: item.impact } };
  }

  // bucket (multi_select)
  const buckets = sanitizeBucket(item.bucket);
  if (buckets) {
    props.bucket = { multi_select: buckets.map(b => ({ name: b })) };
  }

  // agents (JSON stringifié → RICH_TEXT)
  if (Array.isArray(item.agents) && item.agents.length > 0) {
    props.agents = rt(JSON.stringify(item.agents));
  }

  // agent_suggestions (JSON stringifié → RICH_TEXT)
  if (Array.isArray(item.agent_suggestions) && item.agent_suggestions.length > 0) {
    props.agent_suggestions = rt(JSON.stringify(item.agent_suggestions));
  }

  return props;
}

function lessonProps({ uid, dumpId, threadPageId, item }) {
  const props = {
    uid:            rt(uid),
    lesson:         title(item.lesson || item.title || "Lesson"),
    what_happened:  rt(item.what_happened || ""),
    evidence:       rt(item.evidence     || ""),
    source_dump_id: rt(dumpId || ""),

    ...(threadPageId
      ? { source_thread: { relation: [{ id: threadPageId }] } }
      : {}),
    ...(OVERWRITE
      ? { archived: { checkbox: false }, archived_at: { date: null } }
      : {}),
  };

  // MAPPING V2 : json.type → lesson_type
  if (item.type && VALID_LESSON_TYPE.includes(item.type)) {
    props.lesson_type = { select: { name: item.type } };
  }

  // bucket (multi_select)
  const buckets = sanitizeBucket(item.bucket);
  if (buckets) {
    props.bucket = { multi_select: buckets.map(b => ({ name: b })) };
  }

  // agents (JSON stringifié → RICH_TEXT)
  if (Array.isArray(item.agents) && item.agents.length > 0) {
    props.agents = rt(JSON.stringify(item.agents));
  }

  // agent_suggestions (JSON stringifié → RICH_TEXT)
  if (Array.isArray(item.agent_suggestions) && item.agent_suggestions.length > 0) {
    props.agent_suggestions = rt(JSON.stringify(item.agent_suggestions));
  }

  return props;
}

// ─── UPSERT ──────────────────────────────────────────────────────────────────

async function findByUid(dataSourceId, uid) {
  const res = await queryDataSource(dataSourceId, {
    page_size: 1,
    filter: { property: "uid", rich_text: { equals: uid } },
  });
  return res.results?.[0] || null;
}

async function upsert({ dataSourceId, uid, properties }) {
  const existing   = await findByUid(dataSourceId, uid);
  const cleanProps = Object.fromEntries(
    Object.entries(properties).filter(([_, v]) => v !== undefined)
  );

  if (!existing) {
    if (!DRY_RUN) await createPage(dataSourceId, cleanProps);
    return "created";
  }

  if (!DRY_RUN) await updatePage(existing.id, cleanProps);
  return "updated";
}

// ─── PARSING JSON ─────────────────────────────────────────────────────────────

function stripJsonComments(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, "$1");
}

function extractFirstJsonObject(text) {
  const s     = text;
  const start = s.indexOf("{");
  if (start < 0) return null;

  let depth = 0, inStr = false, esc = false;

  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc)             esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"')  inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === "{") depth++;
    if (c === "}") depth--;
    if (depth === 0) return s.slice(start, i + 1);
  }

  return null;
}

async function getExtractionJsonFromBlocks(threadPageId) {
  const START = "[[EXTRACTION_JSON_START]]";
  const END   = "[[EXTRACTION_JSON_END]]";

  const blocks = await listAllBlockChildren(threadPageId);
  const texts  = [];
  let inExtractionZone = false;

  for (const b of blocks) {
    let t = "";
    if (b.type === "code") {
      t = (b.code?.rich_text || []).map(x => x.plain_text).join("");
    } else if (b.type === "paragraph") {
      t = (b.paragraph?.rich_text || []).map(x => x.plain_text).join("");
    } else continue;

    if (!t) continue;
    if (t === START) { inExtractionZone = true;  continue; }
    if (t === END)   { inExtractionZone = false;  break;   }
    if (inExtractionZone) texts.push(t);
  }

  const joined  = texts.join("").trim();
  if (!joined) return "";
  const cleaned = stripJsonComments(joined);
  const obj     = extractFirstJsonObject(cleaned);
  return obj || "";
}

// ─── THREAD DUMP ─────────────────────────────────────────────────────────────

async function markThreadDump(pageId, { status, summary, error, retryCount }) {
  const props = {
    injection_status:  { select: { name: status } },
    injection_summary: rt(summary || ""),
    injection_error:   rt(error   || ""),
  };
  if (retryCount !== undefined) props.retry_count = { number: retryCount };
  if (!DRY_RUN) await updatePage(pageId, props);
}

async function getCandidates(limit) {
  const filterBase = {
    and: [
      { property: "extraction_status", select: { equals: "done" } },
      ...(ONLY ? [{ property: "id_dump", rich_text: { equals: ONLY } }] : []),
    ],
  };

  const filterPending = {
    and: [
      ...filterBase.and,
      { property: "injection_status", select: { equals: "pending" } },
    ],
  };

  const filterForce = {
    and: [
      ...filterBase.and,
      {
        or: [
          { property: "injection_status", select: { equals: "pending" } },
          { property: "injection_status", select: { equals: "error"   } },
        ],
      },
    ],
  };

  const res = await queryDataSource(THREAD_DUMP_DS_ID, {
    page_size: Math.min(limit, 50),
    filter: FORCE ? filterForce : filterPending,
    sorts: [{ property: "id_dump", direction: "ascending" }],
  });

  return res.results || [];
}

async function ensureArchivePropsExist(dataSourceId, label) {
  const ds      = await getDataSource(dataSourceId);
  const props   = ds.properties || {};
  const missing = [];

  if (!props.archived)       missing.push("archived(checkbox)");
  if (!props.archived_at)    missing.push("archived_at(date)");
  if (!props.source_dump_id) missing.push("source_dump_id(rich_text)");

  if (missing.length) {
    console.warn(`[os:inject] WARN ${label}: missing properties -> ${missing.join(", ")}`);
    console.warn("[os:inject] Overwrite will still run, but archiving may fail.");
  }
}

async function archiveByDumpId({ dataSourceId, dumpId }) {
  let archived = 0;
  let cursor;

  while (true) {
    const r = await queryDataSource(dataSourceId, {
      page_size: 100,
      start_cursor: cursor,
      filter: {
        and: [
          { property: "source_dump_id", rich_text:  { equals: dumpId } },
          { property: "archived",       checkbox:    { equals: false  } },
        ],
      },
    });

    for (const p of r.results || []) {
      if (!DRY_RUN) {
        await updatePage(p.id, {
          archived:    { checkbox: true },
          archived_at: { date: { start: new Date().toISOString() } },
        });
      }
      archived++;
    }

    if (!r.has_more) break;
    cursor = r.next_cursor;
  }

  return archived;
}

// ─── PROCESS ONE ─────────────────────────────────────────────────────────────

async function processOne(page) {
  const retryCount = page.properties?.retry_count?.number ?? 0;
  if (retryCount >= 2) {
    console.warn(`  [os:inject] BLOCKED: retry_count=${retryCount} >= 2 pour ${getPropText(page, "id_dump")} — intervention manuelle requise`);
    return "blocked";
  }

  const threadPageId = page.id;
  const dumpId       = getPropText(page, "id_dump");

  // V2 : lire depuis thread_summarized/ en priorité (contient le JSON complet > 2000 chars)
  const summarizedPath = path.join(REPO_ROOT, "data", "thread_summarized", `${dumpId}.json`);
  let extractionJsonText = null;

  try {
    const raw = await fs.readFile(summarizedPath, "utf8");
    const parsed = JSON.parse(raw);
    extractionJsonText = JSON.stringify({
      decisions: parsed.decisions || [],
      lessons:   parsed.lessons   || [],
    });
    console.log(`  [inject] source: thread_summarized/${dumpId}.json`);
  } catch {
    // Fallback V1 : lire depuis la propriété Notion ou les blocs de page
    const extractionProp = getPropText(page, "extraction_json");
    extractionJsonText = extractionProp || null;
    if (!extractionJsonText || extractionJsonText.startsWith("Stored in page blocks")) {
      extractionJsonText = await getExtractionJsonFromBlocks(threadPageId);
    }
  }

  if (!extractionJsonText) {
    await markThreadDump(threadPageId, {
      status:  "error",
      summary: "",
      error:   "extraction_json vide (prop+blocks)",
      retryCount: retryCount + 1,
    });
    return "error";
  }

  const cleaned = stripJsonComments(extractionJsonText);
  const jsonObj = extractFirstJsonObject(cleaned) || cleaned;

  let data;
  try {
    data = JSON.parse(jsonObj);
  } catch (e) {
    await markThreadDump(threadPageId, {
      status:  "error",
      summary: "",
      retryCount: retryCount + 1,
      error:   `extraction_json non-parseable: ${e.message} | head=${JSON.stringify(jsonObj.slice(0, 200))}`,
    });
    return "error";
  }

  const rawDecisions = Array.isArray(data.decisions) ? data.decisions : [];
  const rawLessons   = Array.isArray(data.lessons)   ? data.lessons   : [];
  const normalized   = normalizeExtractionPayload(data);
  const decisions    = normalized.decisions;
  const lessons      = normalized.lessons;

  const rejectedDecisions = rawDecisions.length - decisions.length;
  const rejectedLessons   = rawLessons.length   - lessons.length;

  let created = 0, updated = 0, archDec = 0, archLes = 0;

  if (OVERWRITE) {
    try { archDec = await archiveByDumpId({ dataSourceId: DECISIONS_DS_ID, dumpId }); }
    catch (e) { console.warn(`[os:inject] WARN archive decisions failed for ${dumpId}: ${e.message}`); }
    try { archLes = await archiveByDumpId({ dataSourceId: LESSONS_DS_ID,   dumpId }); }
    catch (e) { console.warn(`[os:inject] WARN archive lessons failed for ${dumpId}: ${e.message}`); }
  }

  for (const item of decisions) {
    const uid = item.uid || makeUid({
      type: "decision",
      dumpId,
      title: item.decision || item.title || "",
      owner: item.owner || "",
    });

    const res = await upsert({
      dataSourceId: DECISIONS_DS_ID,
      uid,
      properties: decisionProps({ uid, dumpId, threadPageId, item }),
    });

    if (res === "created") created++; else updated++;
  }

  for (const item of lessons) {
    const uid = item.uid || makeUid({
      type: "lesson",
      dumpId,
      title: item.lesson || item.title || "",
      owner: "",
    });

    const res = await upsert({
      dataSourceId: LESSONS_DS_ID,
      uid,
      properties: lessonProps({ uid, dumpId, threadPageId, item }),
    });

    if (res === "created") created++; else updated++;
  }

  const summary =
    `raw(dec=${rawDecisions.length},les=${rawLessons.length})` +
    ` | kept(dec=${decisions.length},les=${lessons.length})` +
    ` | rej(dec=${rejectedDecisions},les=${rejectedLessons})` +
    ` | created=${created}` +
    ` | updated=${updated}` +
    ` | overwrite=${OVERWRITE ? "yes" : "no"}` +
    ` | ${DRY_RUN ? "DRY_RUN" : "LIVE"}`;

  await markThreadDump(threadPageId, { status: "done", summary, error: "", retryCount: 0 });
  return "done";
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  if (!THREAD_DUMP_DS_ID || !DECISIONS_DS_ID || !LESSONS_DS_ID) {
    throw new Error("ENV missing: THREAD_DUMP_DS_ID, DECISIONS_DS_ID, LESSONS_DS_ID");
  }

  console.log(
    `[os:inject] Mode: ${DRY_RUN ? "DRY_RUN" : "LIVE"}` +
    `${FORCE ? " [FORCE]" : ""}` +
    `${OVERWRITE ? " [OVERWRITE]" : ""}` +
    `${ONLY ? " [ONLY " + ONLY + "]" : ""}`
  );

  if (OVERWRITE) {
    await ensureArchivePropsExist(DECISIONS_DS_ID, "DECISIONS");
    await ensureArchivePropsExist(LESSONS_DS_ID,   "LESSONS");
  }

  const candidates = await getCandidates(LIMIT);

  if (!candidates.length) {
    console.log(ONLY
      ? `[os:inject] Aucun candidat pour --only ${ONLY}`
      : "[os:inject] Aucun thread_dump a injecter."
    );
    return;
  }

  console.log(
    `[os:inject] Candidats: ${candidates.length} (limit=${LIMIT})` +
    ` ${DRY_RUN ? "[DRY]" : ""}` +
    ` ${FORCE ? "[FORCE]" : ""}` +
    ` ${OVERWRITE ? "[OVERWRITE]" : ""}`
  );

  for (const page of candidates) {
    const dumpId = getPropText(page, "id_dump") || "(unknown)";
    process.stdout.write(`-> Processing id_dump=${dumpId}...\n`);

    try {
      const result = await processOne(page);
      if (result === "done")    console.log("  OK");
      else if (result === "error")   console.log("  ERROR (handled)");
      else console.log(`  ${result}`);
    } catch (e) {
      console.error("  ERROR:", e.message);
      const rc = page.properties?.retry_count?.number ?? 0;
      await markThreadDump(page.id, { status: "error", summary: "", error: e.message, retryCount: rc + 1 });
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
