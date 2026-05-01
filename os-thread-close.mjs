#!/usr/bin/env node
/**
 * os-thread-close.mjs — v2.0
 * Protocole de clôture de thread INSIDE OS
 *
 * Usage :
 *   node os-thread-close.mjs --thread-name "B09-T24-Sujet"
 *   node os-thread-close.mjs --thread-name "B09-T24-Sujet" --inject
 *
 * Place ce fichier à la racine du projet inside-os/
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const INJECT = process.argv.includes("--inject");
const THREAD_NAME = (() => {
  const i = process.argv.indexOf("--thread-name");
  return i !== -1 ? process.argv[i + 1] : "B09-T??";
})();

const TOKEN = process.env.NOTION_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const API = "https://api.notion.com/v1";
const VER = "2025-09-03";
const MAX_RETRIES = 2;

if (!TOKEN) { console.error("NOTION_API_KEY manquante"); process.exit(1); }
if (!ANTHROPIC_KEY) { console.error("ANTHROPIC_API_KEY manquante"); process.exit(1); }

// ─── Notion helpers ──────────────────────────────────────────────────────────

async function nFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Notion-Version": VER,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  const json = txt ? JSON.parse(txt) : {};
  if (!res.ok) throw new Error(`Notion ${res.status} ${method} ${path}: ${JSON.stringify(json)}`);
  return json;
}

async function countDs(dsId, filter) {
  let total = 0, cursor;
  do {
    const body = { page_size: 100, ...(filter ? { filter } : {}), ...(cursor ? { start_cursor: cursor } : {}) };
    const r = await nFetch(`/data_sources/${dsId}/query`, { method: "POST", body });
    total += r.results.length;
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return total;
}

async function queryDs(dsId, filter, limit = 100) {
  const body = { page_size: limit, ...(filter ? { filter } : {}) };
  const r = await nFetch(`/data_sources/${dsId}/query`, { method: "POST", body });
  return r.results || [];
}

async function updatePageProps(pageId, properties) {
  return nFetch(`/pages/${pageId}`, { method: "PATCH", body: { properties } });
}

async function getPageBlocks(pageId) {
  const r = await nFetch(`/blocks/${pageId}/children?page_size=100`);
  return r.results || [];
}

async function replacePageContent(pageId, text) {
  const blocks = await getPageBlocks(pageId);
  for (const b of blocks) {
    try { await nFetch(`/blocks/${b.id}`, { method: "DELETE" }); } catch {}
  }
  const chunks = [];
  for (let i = 0; i < text.length; i += 1990) chunks.push(text.slice(i, i + 1990));
  await nFetch(`/blocks/${pageId}/children`, {
    method: "PATCH",
    body: {
      children: chunks.map(c => ({
        object: "block", type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: c } }] },
      })),
    },
  });
}

// ─── Retry inject_error ───────────────────────────────────────────────────────

async function retryInjectErrors(dsId) {
  const errors = await queryDs(dsId, { property: "injection_status", select: { equals: "error" } });
  const blocked = [];
  const retried = [];

  for (const page of errors) {
    const retryCount = page.properties?.retry_count?.number || 0;
    const name = page.properties?.id_dump?.rich_text?.[0]?.plain_text || page.id;

    if (retryCount >= MAX_RETRIES) {
      blocked.push({ name, retryCount });
    } else {
      await updatePageProps(page.id, {
        injection_status: { select: { name: "pending" } },
        retry_count: { number: retryCount + 1 },
      });
      retried.push({ name, retryCount: retryCount + 1 });
    }
  }

  return { retried, blocked };
}

// ─── Git helpers ─────────────────────────────────────────────────────────────

function gitInfo() {
  try {
    const modified = execSync("git diff --name-only HEAD 2>/dev/null", { cwd: ROOT, encoding: "utf-8" }).trim();
    const staged = execSync("git diff --cached --name-only 2>/dev/null", { cwd: ROOT, encoding: "utf-8" }).trim();
    const untracked = execSync("git ls-files --others --exclude-standard 2>/dev/null", { cwd: ROOT, encoding: "utf-8" }).trim();
    const log = execSync("git log --oneline -5 2>/dev/null", { cwd: ROOT, encoding: "utf-8" }).trim();
    const allModified = [...new Set([...modified.split("\n"), ...staged.split("\n"), ...untracked.split("\n")])]
      .filter(f => f && !f.includes("docs/Terminal") && !f.includes("terminal-sessions"));
    return { modified: allModified.join("\n"), log };
  } catch { return { modified: "", log: "no git" }; }
}

// ─── Docs helpers ────────────────────────────────────────────────────────────

function findLatestDoc(dir, prefix) {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith(prefix) && (f.endsWith(".md") || f.endsWith(".txt")))
      .sort().reverse();
    if (!files.length) return { version: "v00", content: "", path: "", filename: "" };
    const filePath = path.join(dir, files[0]);
    return { version: files[0].match(/v(\d+)/i)?.[0] || "v??", content: fs.readFileSync(filePath, "utf-8"), path: filePath, filename: files[0] };
  } catch { return { version: "v00", content: "", path: "", filename: "" }; }
}

function nextVersion(v) {
  const n = parseInt(v.replace(/[^\d]/g, ""));
  return isNaN(n) ? "v09" : `v${String(n + 1).padStart(2, "0")}`;
}

function findThreadFile(threadName) {
  const dirs = [
    path.join(ROOT, "data/threads_to_process"),
    path.join(ROOT, "data/test_threads"),
    path.join(ROOT, "data/data_cemetery"),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    const match = files.find(f => f.includes(threadName) || threadName.includes(f.replace(".txt", "")));
    if (match) return fs.readFileSync(path.join(dir, match), "utf-8").slice(0, 15000);
  }
  return null;
}

// ─── Alignment checks ────────────────────────────────────────────────────────

function checkEnv() {
  const issues = [];
  const env = fs.existsSync(path.join(ROOT, ".env")) ? fs.readFileSync(path.join(ROOT, ".env"), "utf-8") : "";
  ["THREAD_DUMP_DS_ID", "DECISIONS_DS_ID", "LESSONS_DS_ID", "NOTION_API_KEY", "ANTHROPIC_API_KEY"].forEach(k => {
    if (!env.includes(k + "=")) issues.push(`.env manque : ${k}`);
  });
  ["THREAD_DUMP_DB_ID", "DECISIONS_DB_ID", "LESSONS_DB_ID"].forEach(k => {
    if (env.includes(k + "=")) issues.push(`.env ancien nom détecté : ${k} → renommer en ${k.replace("_DB_", "_DS_")}`);
  });
  return issues;
}

function checkFolders() {
  const issues = [];
  const expected = ["data/threads_to_process", "data/test_threads", "data/data_cemetery"];
  const legacy = ["data/test_threads", "data/dumps_test", "data/_backup_threads", "data/dumps_archived"];
  expected.forEach(d => { if (!fs.existsSync(path.join(ROOT, d))) issues.push(`Dossier manquant : ${d}`); });
  legacy.forEach(d => { if (fs.existsSync(path.join(ROOT, d))) issues.push(`Ancien dossier encore présent : ${d} — à supprimer`); });
  return issues;
}

// ─── LLM : draft CONTEXT ─────────────────────────────────────────────────────

async function draftContext({ threadName, notionStats, git, prevContext, nextVersion, threadContent, blocked }) {
  const prompt = `Tu es l'architecte de continuité stratégique d'INSIDE OS (Florent Weil, F&A CAPITAL).

RÈGLES ABSOLUES :
- DS_ID = Data Source ID (identifiant API Notion) — ne jamais interpréter autrement
- Ne jamais inventer de signification pour les acronymes techniques
- Remplir TOUTES les sections — aucune case vide ni [À COMPLÉTER]
- Sections factuelles : données réelles ci-dessous uniquement
- Sections subjectives : propositions honnêtes basées sur le contexte, clairement identifiées comme propositions
- Zéro formulation flatteuse, zéro récit rassurant
- Si tu n'as pas assez d'info pour une section : écrire ce que tu sais + signaler le manque explicitement

ÉTAT RÉEL DU SYSTÈME :
Thread : ${threadName}
Date : ${new Date().toISOString().slice(0, 10)}
THREAD_DUMP : ${notionStats.total} threads | extract_done: ${notionStats.extractDone} | extract_error: ${notionStats.extractError} | inject_done: ${notionStats.injectDone} | inject_pending: ${notionStats.injectPending} | inject_error: ${notionStats.injectError}
DECISIONS : ${notionStats.decisions} | LESSONS : ${notionStats.lessons}
Fichiers modifiés : ${git.modified || "aucun"}
Commits récents : ${git.log?.split("\n").slice(0, 3).join(" | ") || "aucun"}
${blocked.length > 0 ? `THREADS BLOQUÉS (inject_error >= ${MAX_RETRIES} retries) : ${blocked.map(b => b.name).join(", ")}` : "Aucun thread bloqué"}

${threadContent ? `CONTENU DU THREAD (extrait) :\n${threadContent.slice(0, 8000)}` : "Contenu du thread non disponible — inférence depuis données système uniquement"}

CONTEXT PRÉCÉDENT :
${prevContext.slice(0, 3000)}

STRUCTURE DE DONNÉES INSIDE OS :
- data/threads_to_process/ = threads exportés en attente d'ingest
- data/test_threads/ = fichiers de test pipeline (4-5 max)
- data/data_cemetery/ = archive permanente après injection
- THREAD_DUMP → EXTRACT → INJECT = pipeline canonique
- Notion = mémoire/état | Node = orchestration | LLM = extraction/génération
- B09 exclu du pipeline automatique | CONTEXT vXX injecté en B99

ROADMAP GRAVÉE :
- raw_text multi-lignes : à implémenter en V2 (moteur recherche sémantique) — ne pas toucher avant
- retry_count : propriété à ajouter dans THREAD_DUMP (max 2 retries auto sur inject_error)
- Déploiement cloud : priorité après ingestion complète des 82 threads
- Migration notion-memory-chat.mjs vers Claude (actuellement OpenAI GPT-4.1-mini)

Produis le CONTEXT ${nextVersion} complet au format exact suivant :

# INSIDE_OS_CONTEXT_${nextVersion}
Date : ${new Date().toISOString().slice(0, 10)}

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / ${threadName}

**Statut : [Stable / En transition / Fragile]**
**Version : ${nextVersion}**
**Niveau de confiance : [Élevé / Moyen / Faible]**

---

## 0. Signal de continuité
[source du STOP + pourquoi]

## 1. Intention réelle du thread
[objectif réel, problème concret, dérive empêchée]

## 2. Acquis réels
[décisions techniques et stratégiques validées — uniquement ce qui est réellement fait]

## 3. Hypothèses, intentions, paris
[ce qui reste à prouver — honnête, pas rassurant]

## 4. Contraintes actives à respecter
[techniques + organisationnelles + règles non négociables]

## 5. Architecture actuelle
[ce qui fonctionne / en apparence / fragile / manque]

## 6. Contradictions et incohérences détectées
[nommer explicitement — ne pas lisser]

## 7. Illusions à démonter
[ce qu'on risque de se raconter à tort]

## 8. Risques structurants
[techniques / stratégiques / faux pilotage]

## 9. Fichiers produits dans ce thread
[liste avec chemin et statut]

## 10. Priorité réelle de redémarrage
[1 action, 1 livrable, 1 critère de succès]

## 11. Discipline pour le prochain thread
[socle verrouillé / à clarifier / à tester / à versionner]

---

## Point de redémarrage minimal
[5 lignes max : objectif / acquis / contraintes / état / prochaine étape]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "Erreur génération draft";
}

// ─── LLM : bumps README/PROMPT ────────────────────────────────────────────────

async function detectBumps({ git, notionStats, threadContent }) {
  const prompt = `Analyse ce thread INSIDE OS et détermine si README et/ou PROMPT nécessitent un bump.

RÈGLES VERSIONNING INSIDE OS :
- README évolue sur décision majeure ou changement d'architecture
- PROMPT évolue quand un gap inter-thread révèle un angle mort ou dérive
- CONTEXT évolue à chaque thread (automatique)

CHANGEMENTS DU THREAD :
${git.modified || "aucun"}
Commits : ${git.log?.split("\n").slice(0, 3).join(" | ") || "aucun"}

${threadContent ? `CONTENU THREAD (extrait) : ${threadContent.slice(0, 3000)}` : ""}

Réponds UNIQUEMENT en JSON valide :
{
  "readme_bump": true/false,
  "readme_reason": "1 phrase ou null",
  "readme_section_draft": "texte section à modifier ou null",
  "prompt_bump": true/false,
  "prompt_reason": "1 phrase ou null",
  "prompt_section_draft": "texte section à ajouter ou null"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  try {
    const text = data.content?.[0]?.text || "{}";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch { return { readme_bump: false, prompt_bump: false }; }
}

// ─── Backup ───────────────────────────────────────────────────────────────────

function backup() {
  const dir = path.join(ROOT, "../inside-os-backups");
  fs.mkdirSync(dir, { recursive: true });
  const date = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
  const dest = path.join(dir, `inside-os-backup-${date}.tar.gz`);
  try {
    execSync(`tar -czf "${dest}" --exclude="node_modules" --exclude=".git" --exclude="runtime/out" -C "${path.dirname(ROOT)}" "${path.basename(ROOT)}"`, { cwd: ROOT });
    const old = fs.readdirSync(dir).filter(f => f.startsWith("inside-os-backup-")).sort().reverse();
    old.slice(10).forEach(f => fs.unlinkSync(path.join(dir, f)));
    return dest;
  } catch (e) { return `ERREUR: ${e.message}`; }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   INSIDE OS — CLÔTURE DE THREAD v2           ║");
  console.log(`║   Thread : ${THREAD_NAME.padEnd(33)}║`);
  console.log(`║   Mode   : ${(INJECT ? "INJECT" : "DRAFT ONLY").padEnd(33)}║`);
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`Date : ${new Date().toISOString()}\n`);

  // PHASE 1 — BACKUP
  console.log("━━━ PHASE 1 : BACKUP ━━━");
  const backupPath = backup();
  console.log(`  ✓ ${backupPath}\n`);

  // PHASE 2 — RETRY inject_error
  console.log("━━━ PHASE 2 : RETRY INJECT_ERROR ━━━");
  const dsThread = process.env.THREAD_DUMP_DS_ID || process.env.THREAD_DUMP_DB_ID;
  const dsDecisions = process.env.DECISIONS_DS_ID || process.env.DECISIONS_DB_ID;
  const dsLessons = process.env.LESSONS_DS_ID || process.env.LESSONS_DB_ID;
  let retryResult = { retried: [], blocked: [] };
  try {
    retryResult = await retryInjectErrors(dsThread);
    if (retryResult.retried.length) console.log(`  → ${retryResult.retried.length} thread(s) remis en pending : ${retryResult.retried.map(r => r.name).join(", ")}`);
    if (retryResult.blocked.length) {
      console.log(`  ⚠  BLOQUÉS (${MAX_RETRIES} retries épuisés) : ${retryResult.blocked.map(b => b.name).join(", ")}`);
      console.log("     → Intervention manuelle requise");
    }
    if (!retryResult.retried.length && !retryResult.blocked.length) console.log("  ✓ Aucun inject_error");
  } catch (e) { console.log(`  ✗ ${e.message}`); }
  console.log();

  // PHASE 3 — SNAPSHOT NOTION
  console.log("━━━ PHASE 3 : SNAPSHOT NOTION ━━━");
  const stats = { total: 0, extractDone: 0, extractError: 0, injectDone: 0, injectPending: 0, injectError: 0, decisions: 0, lessons: 0 };
  const notionIssues = [];
  try {
    stats.total = await countDs(dsThread);
    stats.extractDone = await countDs(dsThread, { property: "extraction_status", select: { equals: "done" } });
    stats.extractError = await countDs(dsThread, { property: "extraction_status", select: { equals: "error" } });
    stats.injectDone = await countDs(dsThread, { property: "injection_status", select: { equals: "done" } });
    stats.injectPending = await countDs(dsThread, { property: "injection_status", select: { equals: "pending" } });
    stats.injectError = await countDs(dsThread, { property: "injection_status", select: { equals: "error" } });
    stats.decisions = await countDs(dsDecisions);
    stats.lessons = await countDs(dsLessons);
    console.log(`  THREAD_DUMP : ${stats.total} | extract_done: ${stats.extractDone} | extract_error: ${stats.extractError}`);
    console.log(`               inject_done: ${stats.injectDone} | inject_pending: ${stats.injectPending} | inject_error: ${stats.injectError}`);
    console.log(`  DECISIONS   : ${stats.decisions}`);
    console.log(`  LESSONS     : ${stats.lessons}`);
    if (stats.extractError > 0) notionIssues.push(`${stats.extractError} thread(s) en extract_error`);
    if (stats.injectPending > 0) notionIssues.push(`${stats.injectPending} thread(s) en inject_pending`);
    if (stats.injectError > 0) notionIssues.push(`${stats.injectError} thread(s) en inject_error`);
    if (retryResult.blocked.length > 0) notionIssues.push(`BLOQUÉS : ${retryResult.blocked.map(b => b.name).join(", ")}`);
  } catch (e) { console.log(`  ✗ Notion : ${e.message}`); notionIssues.push(e.message); }
  console.log();

  // PHASE 4 — AUDIT ALIGNEMENT
  console.log("━━━ PHASE 4 : AUDIT ALIGNEMENT ━━━");
  const docsCtx = path.join(ROOT, "docs/context");
  const docsRm = path.join(ROOT, "docs/readme");
  const docsPr = path.join(ROOT, "docs/prompts transfert thread");
  const prevCtx = findLatestDoc(docsCtx, "INSIDE_OS_CONTEXT_");
  const prevRm = findLatestDoc(docsRm, "README_INSIDE_OS_");
  const prevPr = findLatestDoc(docsPr, "PROMPT_MAITRE_");
  console.log(`  CONTEXT : ${prevCtx.filename} | README : ${prevRm.filename} | PROMPT : ${prevPr.filename}`);
  const issues = [...checkEnv(), ...checkFolders(), ...notionIssues];
  if (issues.length === 0) console.log("  ✓ Aucune divergence");
  else issues.forEach(i => console.log(`  ⚠  ${i}`));
  console.log();

  // PHASE 5 — GIT DIFF
  console.log("━━━ PHASE 5 : FICHIERS MODIFIÉS ━━━");
  const git = gitInfo();
  const modFiles = git.modified.split("\n").filter(Boolean);
  console.log(`  ${modFiles.length} fichier(s) | ${git.log?.split("\n")[0] || ""}`);
  modFiles.slice(0, 8).forEach(f => console.log(`    · ${f}`));
  if (modFiles.length > 8) console.log(`    ... +${modFiles.length - 8}`);
  console.log();

  // PHASE 6 — THREAD CONTENT
  console.log("━━━ PHASE 6 : CONTENU DU THREAD ━━━");
  const threadContent = findThreadFile(THREAD_NAME);
  console.log(threadContent ? `  ✓ Fichier trouvé (${threadContent.length} chars utilisés)` : "  · Fichier non trouvé — inférence depuis données système");
  console.log();

  // PHASE 7 — DRAFT CONTEXT
  console.log("━━━ PHASE 7 : DRAFT CONTEXT ━━━");
  const nextCtxVersion = nextVersion(prevCtx.version);
  console.log(`  Génération CONTEXT ${nextCtxVersion}...`);
  const ctxDraft = await draftContext({ threadName: THREAD_NAME, notionStats: stats, git, prevContext: prevCtx.content, nextVersion: nextCtxVersion, threadContent, blocked: retryResult.blocked });
  console.log("  ✓ Draft généré");
  console.log();

  // PHASE 8 — BUMPS
  console.log("━━━ PHASE 8 : README / PROMPT BUMP ━━━");
  const bumps = await detectBumps({ git, notionStats: stats, threadContent });
  console.log(`  README : ${bumps.readme_bump ? "OUI — " + bumps.readme_reason : "non"}`);
  console.log(`  PROMPT : ${bumps.prompt_bump ? "OUI — " + bumps.prompt_reason : "non"}`);
  console.log();

  // ÉCRITURE FICHIERS
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const dateStr = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
  const logDir = path.join(ROOT, "runtime/logs/thread-close");
  fs.mkdirSync(logDir, { recursive: true });
  const reportPath = path.join(logDir, `close-${dateStr}.md`);
  const ctxPath = path.join(docsCtx, `INSIDE_OS_CONTEXT_${nextCtxVersion}.md`);

  const report = `# RAPPORT DE CLÔTURE — ${THREAD_NAME}
Date : ${new Date().toISOString().slice(0, 10)} | Durée : ${elapsed}s

---

## PROPRE
- Backup : ${backupPath}
- DECISIONS : ${stats.decisions} | LESSONS : ${stats.lessons}
- Pipeline : extract_error=${stats.extractError} | inject_pending=${stats.injectPending} | inject_error=${stats.injectError}

---

## DIVERGENCES
${issues.length === 0 ? "Aucune" : issues.map(i => `- ${i}`).join("\n")}

---

## RETRY inject_error
${retryResult.retried.length ? retryResult.retried.map(r => `- ${r.name} → remis en pending (retry ${r.retryCount})`).join("\n") : "Aucun retry"}
${retryResult.blocked.length ? "\n### ⚠ BLOQUÉS — intervention manuelle\n" + retryResult.blocked.map(b => `- ${b.name} (${b.retryCount} retries épuisés)`).join("\n") : ""}

---

## DÉCISIONS

### README bump ?
${bumps.readme_bump ? `**OUI** — ${bumps.readme_reason}\n\n\`\`\`\n${bumps.readme_section_draft || ""}\n\`\`\`` : "Non requis"}

### PROMPT bump ?
${bumps.prompt_bump ? `**OUI** — ${bumps.prompt_reason}\n\n\`\`\`\n${bumps.prompt_section_draft || ""}\n\`\`\`` : "Non requis"}

### Prochaine priorité
[À NOMMER — 1 action, 1 livrable, 1 critère]

---

## DRAFT CONTEXT ${nextCtxVersion}
Fichier : ${ctxPath}
Statut : ${INJECT ? "INJECTÉ en B99" : "À VALIDER — relancer avec --inject pour injecter"}

---

## FICHIERS MODIFIÉS
${modFiles.map(f => `- ${f}`).join("\n") || "Aucun"}
`;

  fs.writeFileSync(reportPath, report);
  fs.writeFileSync(ctxPath, ctxDraft);

  console.log("━━━ RÉSUMÉ ━━━");
  console.log(`  Rapport : ${reportPath}`);
  console.log(`  Context : ${ctxPath}`);

  // PHASE 9 — INJECTION B99
  if (INJECT) {
    console.log("\n━━━ PHASE 9 : INJECTION B99 ━━━");
    try {
      const pages = await queryDs(dsThread, { property: "id_dump", rich_text: { contains: "B99" } }, 5);
      const b99 = pages.sort((a, b) => new Date(b.last_edited_time) - new Date(a.last_edited_time))[0];
      if (b99) {
        await replacePageContent(b99.id, ctxDraft);
        console.log(`  ✓ CONTEXT ${nextCtxVersion} injecté en B99`);
      } else {
        console.log("  ⚠  Page B99 non trouvée dans THREAD_DUMP");
      }
    } catch (e) { console.log(`  ✗ Injection échouée : ${e.message}`); }
  } else {
    console.log(`\n  Valider le draft puis : node os-thread-close.mjs --inject --thread-name "${THREAD_NAME}"`);
  }

  console.log(`\n✓ Clôture terminée en ${elapsed}s\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
