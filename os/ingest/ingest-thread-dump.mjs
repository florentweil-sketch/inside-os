import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const REPO_ROOT  = path.resolve(__dirname, "../..");
const HISTORICAL_THREADS_DIR = path.join(REPO_ROOT, "data", "historical_threads");

function argValue(flag, fallback = "") {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const ONLY_ID = String(argValue("--only", "")).trim().toUpperCase();

// Buckets exclus par defaut de l'ingestion automatique
// B09 = threads dev INSIDE OS - valeur dans CONTEXT vXX injectes en B99, pas dans les threads bruts
// Override : npm run os:ingest -- --skip-buckets "" (vide = aucune exclusion)
// Override : npm run os:ingest -- --skip-buckets B09,B08 (exclusion multiple)
const DEFAULT_SKIP_BUCKETS = ["B09"];
const SKIP_ARG    = argValue("--skip-buckets", "__default__").trim().toUpperCase();
const SKIP_BUCKETS = SKIP_ARG === "__default__"
  ? DEFAULT_SKIP_BUCKETS
  : SKIP_ARG === ""
  ? []
  : SKIP_ARG.split(",").map(b => b.trim());

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
  t = t.replace(/\u2192/g, "->"); // ->
  t = t.replace(/\u2190/g, "<-"); // <-
  t = t.replace(/\u2194/g, "<->"); // <->
  t = t.replace(/\u21D2/g, "=>"); // =>
  t = t.replace(/\u21D0/g, "<="); // <=
  t = t.replace(/[\u2022\u2023\u2043\u204C\u204D\u2219\u25AA\u25AB\u25B8\u25CF\u25E6]/g, "-");
  t = t.replace(/^(\s*)[•·▸▪▫◦‣⁃]\s*/gm, "$1- ");
  t = t.replace(/[\u20E3]/g, "");
  t = t.replace(/[\u00A0\u202F\u2007\u2060]/g, " ");
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

// ─── RÉSUMÉ LLM ──────────────────────────────────────────────────────────────
// Génère une ligne de résumé du thread via Claude.
// Remplace le raw_text tronqué — utile pour naviguer dans Notion sans ouvrir la page.

async function generateSummary(text, idDump) {
  if (!ANTHROPIC_API_KEY) {
    return text.slice(0, 200).replace(/\n/g, " ").trim();
  }

  const excerpt = text.slice(0, 3000);
  const prompt  = [
    "Tu résumes en UNE SEULE LIGNE (20 mots max) le sujet principal de ce thread de travail.",
    "Regles :",
    "- Une seule ligne, pas de ponctuation finale.",
    "- Nomme les sujets réels : entités, personnes, projets, décisions.",
    "- Pas de formule générique comme 'discussion sur' ou 'thread concernant'.",
    "- Exemples : 'Stratégie holding F&A Capital, filiales, cession INSIDE ARCHI a Florent'",
    "             'Recrutement Directeur Travaux, RAF, organisation Inside SAS'",
    "             'Pipeline mémoire Notion, extraction chunk par chunk, injection'",
    "",
    `Thread ${idDump} (extrait) :`,
    `"""${excerpt}"""`,
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
        max_tokens: 60,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Claude API ${res.status}`);
    const data    = await res.json();
    const summary = data.content?.[0]?.text?.trim() || "";
    if (!summary || summary.length > 300) {
      return text.slice(0, 200).replace(/\n/g, " ").trim();
    }
    return summary;
  } catch (e) {
    console.warn(`  [ingest] WARN résumé LLM échoué pour ${idDump} (${e.message}) — fallback`);
    return text.slice(0, 200).replace(/\n/g, " ").trim();
  }
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

function buildThreadDumpProperties({ idDump, displayName, summary }) {
  return {
    Name: title(displayName),
    id_dump: rt(idDump),
    raw_text: rt(summary), // résumé LLM une ligne — navigation Notion
    extraction_status: { select: { name: "pending" } },
    injection_status:  { select: { name: "pending" } },
  };
}

function chunkText(text, size = 2000) {
  const normalized = String(text || "").replace(/\r\n/g, "\n");
  const chunks = [];
  for (let i = 0; i < normalized.length; i += size) {
    chunks.push(normalized.slice(i, i + size));
  }
  return chunks.length ? chunks : [""];
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

async function ingestOneFile(filename) {
  const fullPath    = path.join(HISTORICAL_THREADS_DIR, filename);
  const idDump      = getIdDumpFromFilename(filename);
  const displayName = getDisplayNameFromFilename(filename);
  const rawText     = await fs.readFile(fullPath, "utf8");

  if (!rawText || !rawText.trim()) {
    return { status: "skipped", filename, idDump, reason: "empty file" };
  }

  // 1. Nettoyage systématique
  const cleanedText = cleanText(rawText);

  // 2. Résumé LLM (remplace raw_text tronqué)
  process.stdout.write(`  [résumé] ${idDump}... `);
  const summary = await generateSummary(cleanedText, idDump);
  process.stdout.write(`OK\n`);

  // 3. Ingest dans Notion
  const existingPage = await findExistingThreadDumpPage(idDump);
  const properties   = buildThreadDumpProperties({ idDump, displayName, summary });

  if (!existingPage) {
    const page = await createPage(CFG.THREAD_DUMP_DS_ID, properties);
    await replacePageContent(page.id, cleanedText);
    return { status: "created", filename, idDump, summary };
  }

  await updatePage(existingPage.id, properties);
  await replacePageContent(existingPage.id, cleanedText);
  return { status: "updated", filename, idDump, summary };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("INGEST historical_threads");
  console.log("-------------------------");

  if (ONLY_ID) {
    console.log(`[os:ingest] Mode cible --only ${ONLY_ID}`);
  }

  // Fix bug __DEFAULT__ : affiche les vrais buckets exclus
  if (!ONLY_ID) {
    if (SKIP_BUCKETS.length > 0) {
      console.log(`[os:ingest] Buckets exclus : ${SKIP_BUCKETS.join(", ")} (--skip-buckets "" pour inclure)`);
    } else {
      console.log(`[os:ingest] Aucun bucket exclu`);
    }
  }

  if (!ANTHROPIC_API_KEY) {
    console.log(`[os:ingest] WARN: ANTHROPIC_API_KEY absent — résumés en fallback (texte brut tronqué)`);
  }

  for (const k of ["NOTION_API_KEY", "THREAD_DUMP_DS_ID"]) {
    if (!CFG[k]) throw new Error(`Missing required config key: ${k}`);
  }

  const allFiles = await listHistoricalThreadFiles(HISTORICAL_THREADS_DIR);

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
    throw new Error(`No historical thread file found for --only ${ONLY_ID}`);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const filename of files) {
    const result = await ingestOneFile(filename);
    if (result.status === "created") {
      created++;
      console.log(`[created] ${result.idDump} — "${result.summary}"`);
    } else if (result.status === "updated") {
      updated++;
      console.log(`[updated] ${result.idDump} — "${result.summary}"`);
    } else if (result.status === "skipped") {
      skipped++;
      console.log(`[skipped] ${result.idDump} (${result.reason})`);
    }
  }

  console.log("");
  console.log(`files scanned: ${files.length}`);
  console.log(`created: ${created}`);
  console.log(`updated: ${updated}`);
  console.log(`skipped: ${skipped}`);
  console.log("done.");
}

main().catch((err) => {
  console.error("[os:ingest] ERROR");
  console.error(err);
  process.exit(1);
});
