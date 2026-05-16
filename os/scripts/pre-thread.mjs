// os/scripts/pre-thread.mjs
// INSIDE OS — Audit pré-thread B09
//
// Produit un fichier PRE_THREAD_B09-TXX.md contenant :
//   - Versions actives README / PROMPT / CONTEXT / BACKLOG
//   - Contenu complet CONTEXT actif
//   - Contenu complet BACKLOG actif
//   - Dernier thread B09 traité (nom, date, statut)
//   - Snapshot Notion live (inject_done, pending, error)
//   - Divergences détectées entre versions docs
//
// Usage :
//   node os/scripts/pre-thread.mjs
//   node os/scripts/pre-thread.mjs --next B09-T35-Mon-Sujet

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { queryDataSource } from "../lib/notion.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const REPO_ROOT  = path.resolve(__dirname, "../..");

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const THREAD_DUMP_DS = process.env.THREAD_DUMP_DS_ID;

const DOCS = {
  readme:         { dir: "docs/readme",                   prefix: "README_INSIDE_OS_v",  suffix: ".md",                    label: "README"         },
  prompt:         { dir: "docs/prompts transfert thread", prefix: "PROMPT_MAITRE_v",     suffix: "_TRANSFERT_DE_THREAD.md", label: "PROMPT"         },
  prompt_associe: { dir: "docs/prompts/associe",          prefix: "PROMPT_ASSOCIE_v",    suffix: ".md",                    label: "PROMPT ASSOCIE" },
  context:        { dir: "docs/context",                  prefix: "INSIDE_OS_CONTEXT_v", suffix: ".md",                    label: "CONTEXT"        },
  backlog:        { dir: ".", singleFile: "BACKLOG.md",      label: "BACKLOG",      single: true },
  backlog_dev:    { dir: ".", singleFile: "BACKLOG_DEV.md",  label: "BACKLOG DEV",  single: true },
  backlog_user:   { dir: ".", singleFile: "BACKLOG_USER.md", label: "BACKLOG USER", single: true },
};

// ─── UTILS ───────────────────────────────────────────────────────────────────

function log(msg) { console.log(msg); }

// ─── ÉTAPE 1 : Trouver la version active de chaque doc ───────────────────────

async function findActiveDoc(docConfig) {
  const dirPath = path.join(REPO_ROOT, docConfig.dir);

  if (docConfig.single) {
    const filePath = path.join(dirPath, docConfig.singleFile ?? "BACKLOG.md");
    try {
      const content = await fs.readFile(filePath, "utf8");
      const versionMatch = content.match(/^Version\s*:\s*v(\d+)/m);
      const version = versionMatch ? parseInt(versionMatch[1]) : null;
      const threadMatch = content.match(/\(B09-T(\d+)\)/);
      const lastThread = threadMatch ? `B09-T${threadMatch[1]}` : "inconnu";
      return { version, versionStr: version ? `v${version}` : "inconnue", filePath, content, lastThread };
    } catch {
      return { version: null, versionStr: "INTROUVABLE", filePath, content: null, lastThread: null };
    }
  }

  let files;
  try {
    files = await fs.readdir(dirPath);
  } catch {
    return { version: null, versionStr: "DOSSIER INTROUVABLE", filePath: null, content: null };
  }

  const suffix = docConfig.suffix ?? ".md";
  const escapedPrefix = docConfig.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escapedPrefix}(\\d+)${escapedSuffix}$`);

  const matches = files
    .map(f => {
      const match = f.match(regex);
      return match ? { file: f, version: parseInt(match[1]) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.version - a.version);

  if (matches.length === 0) {
    return { version: null, versionStr: "INTROUVABLE", filePath: null, content: null };
  }

  const active = matches[0];
  const filePath = path.join(dirPath, active.file);
  const content = await fs.readFile(filePath, "utf8");

  return { version: active.version, versionStr: `v${active.version}`, filePath, content };
}

// ─── ÉTAPE 2 : Snapshot Notion ────────────────────────────────────────────────

async function notionSnapshot() {
  if (!THREAD_DUMP_DS) return { ok: false, error: "THREAD_DUMP_DS_ID manquant dans .env" };
  try {
    const pending = await queryDataSource(THREAD_DUMP_DS, {
      filter: { property: "injection_status", select: { equals: "pending" } },
      page_size: 100,
    });
    const done = await queryDataSource(THREAD_DUMP_DS, {
      filter: { property: "injection_status", select: { equals: "done" } },
      page_size: 100,
    });
    const error = await queryDataSource(THREAD_DUMP_DS, {
      filter: { property: "injection_status", select: { equals: "error" } },
      page_size: 100,
    });

    return {
      ok: true,
      inject_done:    done.results?.length    ?? 0,
      inject_pending: pending.results?.length ?? 0,
      inject_error:   error.results?.length   ?? 0,
      total: (done.results?.length ?? 0) + (pending.results?.length ?? 0) + (error.results?.length ?? 0),
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── ÉTAPE 3 : Dernier thread B09 traité ─────────────────────────────────────

async function lastB09Thread() {
  if (!THREAD_DUMP_DS) return { ok: false, error: "THREAD_DUMP_DS_ID manquant dans .env" };
  try {
    const res = await queryDataSource(THREAD_DUMP_DS, {
      filter: {
        and: [
          { property: "injection_status", select: { equals: "done" } },
          { property: "Name", title: { contains: "B09" } },
        ],
      },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      page_size: 5,
    });

    if (!res.results || res.results.length === 0) return { ok: true, name: "aucun", date: null, status: null };

    const page = res.results[0];
    const name   = page.properties?.Name?.title?.[0]?.plain_text ?? "inconnu";
    const date   = page.created_time ?? null;
    const status = page.properties?.injection_status?.select?.name ?? "inconnu";

    return { ok: true, name, date: date ? date.slice(0, 10) : null, status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── ÉTAPE 4 : Détection divergences ─────────────────────────────────────────

function detectDivergences(docs, snapshot, lastB09) {
  const issues = [];

  if (docs.context.lastThread && docs.backlog.lastThread) {
    if (docs.context.lastThread !== docs.backlog.lastThread) {
      issues.push(`⚠️  Thread source divergent : CONTEXT dit ${docs.context.lastThread}, BACKLOG dit ${docs.backlog.lastThread}`);
    }
  }

  if (docs.context.content && docs.context.content.includes("[À COMPLÉTER]")) {
    issues.push("🔴 CONTEXT actif contient des sections [À COMPLÉTER] — probablement un draft non validé");
  }

  if (docs.backlog.content) {
    const readmeMatch  = docs.backlog.content.match(/README v(\d+)/);
    const promptMatch  = docs.backlog.content.match(/PROMPT v(\d+)/);
    const contextMatch = docs.backlog.content.match(/CONTEXT v(\d+)/);

    if (readmeMatch && parseInt(readmeMatch[1]) !== docs.readme.version) {
      issues.push(`⚠️  BACKLOG référence README v${readmeMatch[1]} mais repo contient v${docs.readme.version}`);
    }
    if (promptMatch && parseInt(promptMatch[1]) !== docs.prompt.version) {
      issues.push(`⚠️  BACKLOG référence PROMPT v${promptMatch[1]} mais repo contient v${docs.prompt.version}`);
    }
    if (contextMatch && parseInt(contextMatch[1]) !== docs.context.version) {
      issues.push(`⚠️  BACKLOG référence CONTEXT v${contextMatch[1]} mais repo contient v${docs.context.version}`);
    }
  }

  if (snapshot.ok && snapshot.inject_pending > 0) {
    issues.push(`⚠️  ${snapshot.inject_pending} thread(s) en inject_pending dans Notion — à traiter avant ouverture thread`);
  }
  if (snapshot.ok && snapshot.inject_error > 0) {
    issues.push(`⚠️  ${snapshot.inject_error} thread(s) en inject_error dans Notion — vérifier retry_count`);
  }

  return issues;
}

// ─── ÉTAPE 5 : Générer le fichier PRE_THREAD ─────────────────────────────────

function buildPreThreadDoc(nextThreadName, docs, snapshot, lastB09, divergences) {
  const now = new Date().toISOString().slice(0, 10);
  const threadLabel = nextThreadName || "B09-TXX-Sujet";

  const snapshotSection = snapshot.ok
    ? `- inject_done    : ${snapshot.inject_done}
- inject_pending : ${snapshot.inject_pending}
- inject_error   : ${snapshot.inject_error}
- total          : ${snapshot.total}`
    : `- ERREUR : ${snapshot.error}`;

  const lastB09Section = lastB09.ok
    ? `- Nom    : ${lastB09.name}
- Date   : ${lastB09.date ?? "inconnue"}
- Statut : ${lastB09.status}`
    : `- ERREUR : ${lastB09.error}`;

  const divergencesSection = divergences.length === 0
    ? "✅ Aucune divergence détectée — système aligné"
    : divergences.join("\n");

  return `# PRE_THREAD — ${threadLabel}
Date : ${now}
Généré par : npm run os:pre-thread

---

## VERSIONS ACTIVES

| Document | Version | Emplacement |
|----------|---------|-------------|
| README          | ${docs.readme.versionStr}         | docs/readme/ |
| PROMPT          | ${docs.prompt.versionStr}         | docs/prompts transfert thread/ |
| PROMPT ASSOCIE  | ${docs.prompt_associe.versionStr} | docs/prompts/associe/ |
| CONTEXT         | ${docs.context.versionStr}        | docs/context/ |
| BACKLOG         | ${docs.backlog.versionStr}        | BACKLOG.md |
| BACKLOG DEV     | ${docs.backlog_dev.versionStr}    | BACKLOG_DEV.md |
| BACKLOG USER    | ${docs.backlog_user.versionStr}   | BACKLOG_USER.md |

---

## SNAPSHOT NOTION LIVE

${snapshotSection}

---

## DERNIER THREAD B09 TRAITÉ

${lastB09Section}

---

## DIVERGENCES DÉTECTÉES

${divergencesSection}

---

## CONTEXT ACTIF (${docs.context.versionStr})

${docs.context.content ?? "INTROUVABLE"}

---

## BACKLOG ACTIF (${docs.backlog.versionStr})

${docs.backlog.content ?? "INTROUVABLE"}
`;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const nextIdx = process.argv.indexOf("--next");
  const nextThreadName = nextIdx !== -1 ? process.argv[nextIdx + 1] : null;

  log("\n╔══════════════════════════════════════════════╗");
  log("║   INSIDE OS — PRE-THREAD AUDIT               ║");
  log(`║   Thread cible : ${(nextThreadName || "non spécifié").padEnd(26)}║`);
  log("╚══════════════════════════════════════════════╝\n");

  log("━━━ ÉTAPE 1 : Versions docs ━━━");
  const docs = {};
  for (const [key, config] of Object.entries(DOCS)) {
    const result = await findActiveDoc(config);
    docs[key] = result;
    log(`  ${config.label.padEnd(8)} : ${result.versionStr}`);
  }

  log("\n━━━ ÉTAPE 2 : Snapshot Notion ━━━");
  const snapshot = await notionSnapshot();
  if (snapshot.ok) {
    log(`  inject_done    : ${snapshot.inject_done}`);
    log(`  inject_pending : ${snapshot.inject_pending}`);
    log(`  inject_error   : ${snapshot.inject_error}`);
  } else {
    log(`  ⚠️  Erreur Notion : ${snapshot.error}`);
  }

  log("\n━━━ ÉTAPE 3 : Dernier thread B09 traité ━━━");
  const lastB09 = await lastB09Thread();
  if (lastB09.ok) {
    log(`  Nom    : ${lastB09.name}`);
    log(`  Date   : ${lastB09.date ?? "inconnue"}`);
    log(`  Statut : ${lastB09.status}`);
  } else {
    log(`  ⚠️  Erreur : ${lastB09.error}`);
  }

  log("\n━━━ ÉTAPE 4 : Divergences ━━━");
  const divergences = detectDivergences(docs, snapshot, lastB09);
  if (divergences.length === 0) {
    log("  ✅ Aucune divergence détectée");
  } else {
    divergences.forEach(d => log(`  ${d}`));
  }

  log("\n━━━ ÉTAPE 5 : Archivage PRE_THREAD existants ━━━");
  const rootFiles = await fs.readdir(REPO_ROOT);
  const existingPT = rootFiles.filter(f => f.startsWith("PRE_THREAD_") && f.endsWith(".md"));
  if (existingPT.length > 0) {
    const archiveDir = path.join(REPO_ROOT, "docs/pre-threads");
    await fs.mkdir(archiveDir, { recursive: true });
    for (const file of existingPT) {
      await fs.rename(path.join(REPO_ROOT, file), path.join(archiveDir, file));
      log(`  Archivé : ${file}`);
    }
  } else {
    log("  (aucun fichier PRE_THREAD à archiver)");
  }

  log("\n━━━ ÉTAPE 6 : Génération fichier ━━━");
  const threadLabel = nextThreadName || "B09-TXX";
  const outFilename = `PRE_THREAD_${threadLabel}.md`;
  const outPath = path.join(REPO_ROOT, outFilename);
  const content = buildPreThreadDoc(nextThreadName, docs, snapshot, lastB09, divergences);
  await fs.writeFile(outPath, content, "utf8");
  log(`  ✅ Fichier généré : ${outFilename}`);

  log("\n━━━ RÉSUMÉ ━━━");
  log(`  Versions : README ${docs.readme.versionStr} | PROMPT ${docs.prompt.versionStr} | PROMPT ASSOCIE ${docs.prompt_associe.versionStr} | CONTEXT ${docs.context.versionStr} | BACKLOG ${docs.backlog.versionStr} | BACKLOG DEV ${docs.backlog_dev.versionStr} | BACKLOG USER ${docs.backlog_user.versionStr}`);
  log(`  Divergences : ${divergences.length === 0 ? "aucune ✅" : `${divergences.length} détectée(s) ⚠️`}`);
  log(`  Fichier : ${outPath}`);
  log("\n  → Uploade ce fichier en début de thread B09 — le LLM a tout.\n");
}

main().catch(e => {
  console.error("Erreur fatale :", e.message);
  process.exit(1);
});
