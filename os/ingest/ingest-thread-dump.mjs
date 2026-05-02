import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

import { CFG } from "../lib/config.mjs";
import {
  queryDataSource,
  createPage,
  updatePage,
  rt,
  title,
  listAllBlockChildren,
  getToken,
} from "../lib/notion.mjs";

const NOTION_VERSION    = "2025-09-03";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL      = "claude-sonnet-4-5";

// Passe 2 : always | conditional | never
const VERIFY_PASS      = (process.env.VERIFY_PASS      || "always").toLowerCase();
const VERIFY_THRESHOLD = parseInt(process.env.VERIFY_THRESHOLD || "12000", 10);

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const REPO_ROOT  = path.resolve(__dirname, "../..");

const TEST_THREADS_DIR    = path.join(REPO_ROOT, "data", "test_threads");
const PROD_THREADS_DIR    = path.join(REPO_ROOT, "data", "threads_to_process");
const THREAD_CLEAN_DIR    = path.join(REPO_ROOT, "data", "thread_clean");
const DATA_CEMETERY_DIR   = path.join(REPO_ROOT, "data", "data_cemetery");
const THREAD_SUMMARIZED_DIR = path.join(REPO_ROOT, "data", "thread_summarized");
const THREAD_CHUNKED_DIR  = path.join(REPO_ROOT, "data", "thread_chunked");

// ─── ARGS ────────────────────────────────────────────────────────────────────

function argValue(flag, fallback = "") {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const ONLY_ID = String(argValue("--only", "")).trim().toUpperCase();

const DEFAULT_SKIP_BUCKETS = ["B09"];
const SKIP_ARG    = argValue("--skip-buckets", "__default__").trim().toUpperCase();
const SKIP_BUCKETS = SKIP_ARG === "__default__"
  ? DEFAULT_SKIP_BUCKETS
  : SKIP_ARG === ""
  ? []
  : SKIP_ARG.split(",").map(b => b.trim());

// ─── SÉLECTION MODE ──────────────────────────────────────────────────────────

async function selectIngestMode() {
  const modeArg = argValue("--mode", "").toLowerCase();
  if (modeArg === "batch") return PROD_THREADS_DIR;
  if (modeArg === "test")  return TEST_THREADS_DIR;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    console.log("");
    console.log("Mode d'ingestion :");
    console.log("  [1] Batch production  → threads_to_process/");
    console.log("  [2] Test pipeline     → test_threads/");
    console.log("");
    rl.question("Choix (1 ou 2) : ", (answer) => {
      rl.close();
      const choice = answer.trim();
      if (choice === "1") {
        console.log("[os:ingest] Mode : Batch production (threads_to_process/)");
        resolve(PROD_THREADS_DIR);
      } else if (choice === "2") {
        console.log("[os:ingest] Mode : Test pipeline (test_threads/)");
        resolve(TEST_THREADS_DIR);
      } else {
        console.error("[os:ingest] Choix invalide — relancer le script et choisir 1 ou 2.");
        process.exit(1);
      }
    });
  });
}

// ─── NETTOYAGE ───────────────────────────────────────────────────────────────

function cleanText(text) {
  let t = text;
  t = t.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  t = t.replace(/[\u{1F000}-\u{1FFFF}]/gu, "");
  t = t.replace(/[\u{2600}-\u{27BF}]/gu, "");
  t = t.replace(/[\u{2B00}-\u{2BFF}]/gu, "");
  t = t.replace(/[\u{FE00}-\u{FE0F}]/gu, "");
  t = t.replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  t = t.replace(/[\u2018\u2019\u201A\u201B]/g, "'");
  t = t.replace(/[\u00AB\u00BB]/g, '"');
  t = t.replace(/[\u2013\u2014\u2015]/g, "-");
  t = t.replace(/\u2192/g, "->");
  t = t.replace(/\u2190/g, "<-");
  t = t.replace(/\u2194/g, "<->");
  t = t.replace(/\u21D2/g, "=>");
  t = t.replace(/\u21D0/g, "<=");
  t = t.replace(/[\u2022\u2023\u2043\u204C\u204D\u2219\u25AA\u25AB\u25B8\u25CF\u25E6]/g, "-");
  t = t.replace(/^(\s*)[•·▸▪▫◦‣⁃]\s*/gm, "$1- ");
  t = t.replace(/[\u20E3]/g, "");
  t = t.replace(/[\u00A0\u202F\u2007\u2060]/g, " ");
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

// ─── LECTURE PROMPTS ─────────────────────────────────────────────────────────

async function loadPrompt(name) {
  const promptPath = path.join(REPO_ROOT, "os", "prompts", `${name}.md`);
  return fs.readFile(promptPath, "utf8");
}

// ─── PASSE 1 LLM — résumé dense + extraction ─────────────────────────────────

async function runPass1(cleanedText, idDump) {
  if (!ANTHROPIC_API_KEY) {
    console.warn(`  [ingest] WARN: ANTHROPIC_API_KEY absent — passe 1 en fallback minimal`);
    return {
      summary: {
        short: cleanedText.slice(0, 200).replace(/\n/g, " ").trim(),
        full: cleanedText.slice(0, 500).replace(/\n/g, " ").trim(),
      },
      decisions: [],
      lessons: [],
    };
  }

  const promptTemplate = await loadPrompt(
    process.env.INGEST_PROMPT_PASS1 || "ingest-pass1-v01"
  );

  const userMessage = [
    promptTemplate,
    "",
    "---",
    "",
    `Thread ${idDump} :`,
    '"""',
    cleanedText,
    '"""',
  ].join("\n");

  const retryTokens = [4000, 6000, 8000, 10000];
  let lastError;

  for (const maxTokens of retryTokens) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: maxTokens,
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      if (!res.ok) throw new Error(`Claude API ${res.status}`);
      const data = await res.json();
      const raw  = data.content?.[0]?.text?.trim() || "";
      const parsed = parseJsonResponse(raw);
      if (parsed) return parsed;
      throw new Error("JSON parse failed");
    } catch (e) {
      lastError = e;
      console.warn(`  [ingest] WARN passe 1 max_tokens=${maxTokens} échoué (${e.message}) — retry`);
    }
  }

  throw new Error(`[ingest] Passe 1 échouée après tous les retries : ${lastError?.message}`);
}

// ─── PASSE 2 LLM — vérification delta ────────────────────────────────────────

async function runPass2(cleanedText, pass1Result, idDump) {
  const shouldRun =
    VERIFY_PASS === "always" ||
    (VERIFY_PASS === "conditional" && cleanedText.length > VERIFY_THRESHOLD);

  if (!shouldRun) {
    console.log(`  [passe 2] Skipped (VERIFY_PASS=${VERIFY_PASS})`);
    return pass1Result;
  }

  if (!ANTHROPIC_API_KEY) {
    console.warn(`  [ingest] WARN: ANTHROPIC_API_KEY absent — passe 2 ignorée`);
    return pass1Result;
  }

  console.log(`  [passe 2] Vérification delta...`);

  const promptTemplate = await loadPrompt(
    process.env.INGEST_PROMPT_PASS2 || "ingest-pass2-v01"
  );

  const userMessage = [
    promptTemplate,
    "",
    "---",
    "",
    "## THREAD ORIGINAL (thread_clean)",
    '"""',
    cleanedText,
    '"""',
    "",
    "## JSON PASSE 1",
    '"""',
    JSON.stringify(pass1Result, null, 2),
    '"""',
  ].join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) throw new Error(`Claude API ${res.status}`);
    const data  = await res.json();
    const raw   = data.content?.[0]?.text?.trim() || "";
    const delta = parseJsonResponse(raw);

    if (!delta) {
      console.warn(`  [ingest] WARN passe 2 JSON invalide — résultat passe 1 conservé`);
      return pass1Result;
    }

    // Fusion delta dans pass1Result
    const merged = { ...pass1Result };

    if (delta.summary_additions && delta.summary_additions !== null) {
      merged.summary = {
        ...merged.summary,
        full: (merged.summary.full || "") + "\n\n" + delta.summary_additions,
      };
      console.log(`  [passe 2] summary.full complété`);
    }

    if (Array.isArray(delta.decisions) && delta.decisions.length > 0) {
      merged.decisions = [...(merged.decisions || []), ...delta.decisions];
      console.log(`  [passe 2] +${delta.decisions.length} décision(s) ajoutée(s)`);
    }

    if (Array.isArray(delta.lessons) && delta.lessons.length > 0) {
      merged.lessons = [...(merged.lessons || []), ...delta.lessons];
      console.log(`  [passe 2] +${delta.lessons.length} lesson(s) ajoutée(s)`);
    }

    if (
      !delta.summary_additions &&
      (!delta.decisions || delta.decisions.length === 0) &&
      (!delta.lessons   || delta.lessons.length   === 0)
    ) {
      console.log(`  [passe 2] Aucun manque détecté — JSON passe 1 validé`);
    }

    return merged;
  } catch (e) {
    console.warn(`  [ingest] WARN passe 2 échouée (${e.message}) — résultat passe 1 conservé`);
    return pass1Result;
  }
}

// ─── PARSING JSON ─────────────────────────────────────────────────────────────

function parseJsonResponse(raw) {
  // Stratégie 1 : JSON direct
  try { return JSON.parse(raw); } catch {}

  // Stratégie 2 : extraction bloc ```json ... ```
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch {}
  }

  // Stratégie 3 : extraction premier { ... } équilibré
  const start = raw.indexOf("{");
  if (start !== -1) {
    let depth = 0;
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === "{") depth++;
      else if (raw[i] === "}") {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(raw.slice(start, i + 1)); } catch {}
          break;
        }
      }
    }
  }

  return null;
}

// ─── SAUVEGARDE LOCALE ────────────────────────────────────────────────────────

async function saveThreadClean(idDump, cleanedText) {
  await fs.mkdir(THREAD_CLEAN_DIR, { recursive: true });
  const dest = path.join(THREAD_CLEAN_DIR, `${idDump}.txt`);
  await fs.writeFile(dest, cleanedText, "utf8");
  return dest;
}

async function archiveToCemetery(idDump, cleanedText) {
  await fs.mkdir(DATA_CEMETERY_DIR, { recursive: true });
  const dest = path.join(DATA_CEMETERY_DIR, `${idDump}.txt`);
  // Ne jamais écraser — vérifier existence d'abord
  try {
    await fs.access(dest);
    console.log(`  [cemetery] ${idDump}.txt déjà présent — archive ignorée`);
  } catch {
    await fs.writeFile(dest, cleanedText, "utf8");
    console.log(`  [cemetery] ${idDump}.txt archivé`);
  }
}

async function saveSummarized(idDump, finalResult) {
  await fs.mkdir(THREAD_SUMMARIZED_DIR, { recursive: true });
  const dest = path.join(THREAD_SUMMARIZED_DIR, `${idDump}.json`);
  await fs.writeFile(dest, JSON.stringify(finalResult, null, 2), "utf8");
  return dest;
}

// ─── UTILITAIRES ─────────────────────────────────────────────────────────────

function isTxtFile(filename) {
  return filename.toLowerCase().endsWith(".txt");
}

function getIdDumpFromFilename(filename) {
  const base  = path.basename(filename, ".txt");
  const match = base.match(/^(B\d{2}-T\d{2})/i);
  if (!match) throw new Error(`Invalid thread filename format: ${filename}`);
  return match[1].toUpperCase();
}

function getDisplayNameFromFilename(filename) {
  return path.basename(filename, ".txt");
}

function chunkText(text, size = 2000) {
  const normalized = String(text || "").replace(/\r\n/g, "\n");
  const chunks = [];
  for (let i = 0; i < normalized.length; i += size) {
    chunks.push(normalized.slice(i, i + size));
  }
  return chunks.length ? chunks : [""];
}

// ─── PROPRIÉTÉS NOTION ───────────────────────────────────────────────────────

function buildUpdateProperties({ idDump, displayName, summaryShort, summaryFull }) {
  return {
    Name:         title(displayName),
    id_dump:      rt(idDump),
    raw_text:     rt(summaryShort),   // raw_text = résumé court mono-ligne (V1 compat)
    summary_short: rt(summaryShort),  // V2 : champ dédié
    summary_full:  rt(summaryFull),   // V2 : résumé dense
    // extraction_status et injection_status intentionnellement absents
    // → préserve les statuts done existants
  };
}

function buildCreateProperties({ idDump, displayName, summaryShort, summaryFull }) {
  return {
    Name:         title(displayName),
    id_dump:      rt(idDump),
    raw_text:     rt(summaryShort),
    summary_short: rt(summaryShort),
    summary_full:  rt(summaryFull),
    extraction_status: { select: { name: "pending" } },
    injection_status:  { select: { name: "pending" } },
  };
}

// ─── NOTION ──────────────────────────────────────────────────────────────────

async function notionApi(pathname, { method = "GET", body } = {}) {
  const res = await fetch(`https://api.notion.com/v1${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Notion-Version": NOTION_VERSION,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const txt = await res.text();
  let json;
  try   { json = txt ? JSON.parse(txt) : {}; }
  catch { json = { raw: txt }; }

  if (!res.ok) {
    const msg = typeof json === "object" ? JSON.stringify(json) : String(txt);
    throw new Error(`Notion ${res.status}: ${msg}`);
  }
  return json;
}

async function archiveExistingChildren(pageId) {
  const existingBlocks = await listAllBlockChildren(pageId);
  for (const block of existingBlocks) {
    await notionApi(`/blocks/${block.id}`, {
      method: "PATCH",
      body: { archived: true },
    });
  }
}

async function appendPageContent(pageId, text) {
  const chunks   = chunkText(text, 2000);
  const children = chunks.map((chunk) => ({
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: [{ type: "text", text: { content: chunk } }] },
  }));
  for (let i = 0; i < children.length; i += 100) {
    await notionApi(`/blocks/${pageId}/children`, {
      method: "PATCH",
      body: { children: children.slice(i, i + 100) },
    });
  }
}

async function replacePageContent(pageId, text) {
  await archiveExistingChildren(pageId);
  await appendPageContent(pageId, text);
}

async function listHistoricalThreadFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter(e => e.isFile() && isTxtFile(e.name))
    .map(e => e.name)
    .sort((a, b) => a.localeCompare(b));
}

async function findExistingThreadDumpPage(idDump) {
  const response = await queryDataSource(CFG.THREAD_DUMP_DS_ID, {
    filter: { property: "id_dump", rich_text: { equals: idDump } },
    page_size: 1,
  });
  return response.results?.[0] ?? null;
}

// ─── GUARD PRÉ-INGEST ────────────────────────────────────────────────────────

async function guardCheckExistingDone(files) {
  const warnings = [];

  for (const filename of files) {
    try {
      const idDump = getIdDumpFromFilename(filename);
      const page   = await findExistingThreadDumpPage(idDump);
      if (!page) continue;

      const extractStatus = page.properties?.extraction_status?.select?.name;
      const injectStatus  = page.properties?.injection_status?.select?.name;

      if (extractStatus === "done" || injectStatus === "done") {
        warnings.push({ idDump, extractStatus, injectStatus });
      }
    } catch { /* skip fichiers invalides */ }
  }

  if (warnings.length === 0) return true;

  console.log("");
  console.log(`[os:ingest] WARN — ${warnings.length} thread(s) déjà traité(s) détectés :`);
  for (const w of warnings) {
    console.log(`  - ${w.idDump} : extraction=${w.extractStatus} / injection=${w.injectStatus}`);
  }
  console.log("");
  console.log("  Le contenu sera mis à jour. Les statuts done seront PRÉSERVÉS (pas de régression).");
  console.log("");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question("Continuer ? (o/n) : ", (answer) => {
      rl.close();
      if (answer.trim().toLowerCase() === "o") {
        resolve(true);
      } else {
        console.log("[os:ingest] Annulé.");
        resolve(false);
      }
    });
  });
}

// ─── INGEST ONE FILE ─────────────────────────────────────────────────────────

async function ingestOneFile(filename, ingestDir) {
  const fullPath    = path.join(ingestDir, filename);
  const idDump      = getIdDumpFromFilename(filename);
  const displayName = getDisplayNameFromFilename(filename);
  const rawText     = await fs.readFile(fullPath, "utf8");

  if (!rawText || !rawText.trim()) {
    return { status: "skipped", filename, idDump, reason: "empty file" };
  }

  // ── ÉTAPE 1 : CLEAN ──────────────────────────────────────────────────────
  process.stdout.write(`  [clean] ${idDump}... `);
  const cleanedText = cleanText(rawText);
  process.stdout.write(`OK (${cleanedText.length} chars)\n`);

  // ── ÉTAPE 2 : ARCHIVE thread_clean/ ──────────────────────────────────────
  await saveThreadClean(idDump, cleanedText);

  // ── ÉTAPE 3 : ARCHIVE data_cemetery/ (copie permanente) ──────────────────
  await archiveToCemetery(idDump, cleanedText);

  // ── ÉTAPE 4 : PASSE 1 LLM ────────────────────────────────────────────────
  process.stdout.write(`  [passe 1] ${idDump}... `);
  const pass1Result = await runPass1(cleanedText, idDump);
  process.stdout.write(`OK (${pass1Result.decisions?.length ?? 0} décisions, ${pass1Result.lessons?.length ?? 0} lessons)\n`);

  // ── ÉTAPE 5 : PASSE 2 LLM (vérification delta) ───────────────────────────
  const finalResult = await runPass2(cleanedText, pass1Result, idDump);

  // ── ÉTAPE 6 : SAUVEGARDE thread_summarized/ ───────────────────────────────
  await saveSummarized(idDump, finalResult);
  console.log(`  [summarized] ${idDump}.json sauvegardé`);

  // ── ÉTAPE 7 : INGEST NOTION ───────────────────────────────────────────────
  const summaryShort = finalResult.summary?.short || cleanedText.slice(0, 200).replace(/\n/g, " ").trim();
  const summaryFull  = finalResult.summary?.full  || summaryShort;

  // Stocker l'extraction JSON complète (decisions + lessons) dans extraction_json
  const extractionJson = JSON.stringify({
    decisions: finalResult.decisions || [],
    lessons:   finalResult.lessons   || [],
  });

  const existingPage = await findExistingThreadDumpPage(idDump);

  if (!existingPage) {
    const properties = {
      ...buildCreateProperties({ idDump, displayName, summaryShort, summaryFull }),
      extraction_json:   rt(extractionJson),
      // V2 : extraction terminée → done automatiquement
      extraction_status: { select: { name: "done" } },
    };
    const page = await createPage(CFG.THREAD_DUMP_DS_ID, properties);
    await replacePageContent(page.id, cleanedText);
    return {
      status: "created",
      filename,
      idDump,
      summaryShort,
      decisionsCount: finalResult.decisions?.length ?? 0,
      lessonsCount:   finalResult.lessons?.length   ?? 0,
    };
  }

  // UPDATE — extraction_status → done, injection_status → pending (prêt pour inject)
  const existingExtract = existingPage.properties?.extraction_status?.select?.name ?? "?";
  const existingInject  = existingPage.properties?.injection_status?.select?.name  ?? "?";
  const properties = {
    ...buildUpdateProperties({ idDump, displayName, summaryShort, summaryFull }),
    extraction_json:   rt(extractionJson),
    extraction_status: { select: { name: "done" } },
    injection_status:  { select: { name: "pending" } },
  };
  await updatePage(existingPage.id, properties);
  await replacePageContent(existingPage.id, cleanedText);
  return {
    status: "updated",
    filename,
    idDump,
    summaryShort,
    decisionsCount: finalResult.decisions?.length ?? 0,
    lessonsCount:   finalResult.lessons?.length   ?? 0,
    existingExtract,
    existingInject,
  };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const INGEST_DIR = await selectIngestMode();
  const modeName   = INGEST_DIR === PROD_THREADS_DIR ? "Batch production" : "Test pipeline";

  console.log("");
  console.log(`INGEST V2 — ${modeName}`);
  console.log(`VERIFY_PASS=${VERIFY_PASS}${VERIFY_PASS === "conditional" ? ` (threshold=${VERIFY_THRESHOLD})` : ""}`);
  console.log("-------------------------");

  if (ONLY_ID) {
    console.log(`[os:ingest] Mode cible --only ${ONLY_ID}`);
  }

  if (!ONLY_ID) {
    if (SKIP_BUCKETS.length > 0) {
      console.log(`[os:ingest] Buckets exclus : ${SKIP_BUCKETS.join(", ")} (--skip-buckets "" pour inclure)`);
    } else {
      console.log(`[os:ingest] Aucun bucket exclu`);
    }
  }

  if (!ANTHROPIC_API_KEY) {
    console.log(`[os:ingest] WARN: ANTHROPIC_API_KEY absent — LLM désactivé, fallback minimal`);
  }

  for (const k of ["NOTION_API_KEY", "THREAD_DUMP_DS_ID"]) {
    if (!CFG[k]) throw new Error(`Missing required config key: ${k}`);
  }

  // S'assurer que les dossiers V2 existent
  for (const dir of [THREAD_CLEAN_DIR, DATA_CEMETERY_DIR, THREAD_SUMMARIZED_DIR, THREAD_CHUNKED_DIR]) {
    await fs.mkdir(dir, { recursive: true });
  }

  const allFiles = await listHistoricalThreadFiles(INGEST_DIR);

  const files = allFiles.filter((filename) => {
    try {
      const id = getIdDumpFromFilename(filename);
      if (ONLY_ID && id !== ONLY_ID) return false;
      if (!ONLY_ID && SKIP_BUCKETS.length > 0) {
        const bucket = id.split("-")[0];
        if (SKIP_BUCKETS.includes(bucket)) return false;
      }
      return true;
    } catch {
      return false;
    }
  });

  if (ONLY_ID && files.length === 0) {
    throw new Error(`No thread file found for --only ${ONLY_ID}`);
  }

  if (files.length === 0) {
    console.log(`[os:ingest] Aucun fichier à ingérer dans ${path.basename(INGEST_DIR)}/`);
    return;
  }

  console.log(`[os:ingest] ${files.length} fichier(s) à traiter`);

  const confirmed = await guardCheckExistingDone(files);
  if (!confirmed) return;

  console.log("");

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors  = 0;

  for (const filename of files) {
    console.log(`\n── ${filename}`);
    try {
      const result = await ingestOneFile(filename, INGEST_DIR);

      if (result.status === "created") {
        created++;
        console.log(`[created] ${result.idDump} — "${result.summaryShort}" (${result.decisionsCount}d / ${result.lessonsCount}l)`);
      } else if (result.status === "updated") {
        updated++;
        const preserved = result.existingExtract !== "pending" || result.existingInject !== "pending"
          ? ` [statuts préservés: extract=${result.existingExtract} inject=${result.existingInject}]`
          : "";
        console.log(`[updated] ${result.idDump} — "${result.summaryShort}" (${result.decisionsCount}d / ${result.lessonsCount}l)${preserved}`);
      } else if (result.status === "skipped") {
        skipped++;
        console.log(`[skipped] ${result.idDump} (${result.reason})`);
      }
    } catch (e) {
      errors++;
      console.error(`[error] ${filename} : ${e.message}`);
    }
  }

  console.log("");
  console.log("─────────────────────────");
  console.log(`files scanned : ${files.length}`);
  console.log(`created       : ${created}`);
  console.log(`updated       : ${updated}`);
  console.log(`skipped       : ${skipped}`);
  console.log(`errors        : ${errors}`);
  console.log("done.");
}

main().catch((err) => {
  console.error("[os:ingest] ERROR");
  console.error(err);
  process.exit(1);
});
