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
const DECISIONS_DS   = process.env.DECISIONS_DS_ID;
const LESSONS_DS     = process.env.LESSONS_DS_ID;

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
      const version = versionMatch ? parseInt(versionMatch[1], 10) : null;
      const threadMatch = content.match(/\(B09-T(\d+)\)/);
      const lastThread = threadMatch ? `B09-T${threadMatch[1]}` : "inconnu";
      return { version, versionStr: version ? `v${version}` : "inconnue", filePath, content, lastThread };
    } catch {
      return { version: null, versionStr: "INTROUVABLE", filePath, content: null, lastThread: null };
    }
  }

  // Doc versionné : sélection STRICTE par parsing numérique. Fail loud : pas de fallback silencieux.
  let files;
  try {
    files = await fs.readdir(dirPath);
  } catch (e) {
    throw new Error(`findActiveDoc(${docConfig.label}) : dossier introuvable ${dirPath} — ${e.message}`);
  }

  const suffix = docConfig.suffix ?? ".md";
  const escapedPrefix = docConfig.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escapedPrefix}(\\d+)${escapedSuffix}$`);

  const matches = files
    .map(f => {
      const match = f.match(regex);
      if (!match) return null;
      const version = parseInt(match[1], 10);
      if (!Number.isFinite(version)) return null;
      return { file: f, version };
    })
    .filter(Boolean)
    .sort((a, b) => b.version - a.version);

  if (matches.length === 0) {
    throw new Error(`findActiveDoc(${docConfig.label}) : aucun fichier ${docConfig.prefix}<N>${suffix} dans ${dirPath}`);
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

// ─── Auto-incrément nom de thread ────────────────────────────────────────────

function autoIncrementThreadName(lastName) {
  const match = lastName.match(/^(B09-T)(\d+)-(.+)-(\d+)$/);
  if (!match) return null;
  const [, prefix, tNum, subject, sessionNum] = match;
  const nextT = String(parseInt(tNum) + 1);
  const nextSession = String(parseInt(sessionNum) + 1).padStart(sessionNum.length, "0");
  return `${prefix}${nextT}-${subject}-${nextSession}`;
}

// ─── ÉTAPE 4 : Détection divergences sur 3 axes ──────────────────────────────
//
// Règle anti-hallucination (transverse) : « aligné » n'est JAMAIS l'état de repos.
// C'est le résultat explicite de 3 axes qui ont (a) tourné et (b) passé.
// Si un axe ne peut pas s'exécuter (Notion injoignable, donnée illisible) →
// l'axe est INDÉTERMINÉ et le verdict global ne peut pas être « aligné ».
//
//   AXE A — Fraîcheur CONTEXT : le numéro extrait du nom de fichier (latest sur
//           disque, garanti par findActiveDoc fail-loud) == le numéro déclaré
//           DANS le contenu du CONTEXT.
//   AXE B — Cohérence compteurs Notion : inject_pending == 0, inject_error == 0.
//   AXE C — Cohérence CONTEXT ↔ Notion : les chiffres affirmés dans le CONTEXT
//           (inject_done, DECISIONS, LESSONS) == ce que Notion montre live.

async function countDataSource(dataSourceId, filter) {
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

function extractContextSelfVersion(content) {
  if (!content) return null;
  const m = content.match(/^#\s*INSIDE_OS_CONTEXT_v(\d+)/m)
         || content.match(/^\*\*Version\s*:\s*v(\d+)\*\*/m)
         || content.match(/^Version\s*:\s*v(\d+)/m);
  return m ? parseInt(m[1], 10) : null;
}

function extractContextClaims(content) {
  if (!content) return {};
  const num = re => {
    const m = content.match(re);
    return m ? parseInt(m[1].replace(/[\s,_.]/g, ""), 10) : null;
  };
  return {
    inject_done: num(/inject_done\s*[=:]\s*(\d[\d\s,_.]*)/i),
    decisions:   num(/DECISIONS[^\n]*?(\d[\d\s,_.]{2,})/i),
    lessons:     num(/LESSONS[^\n]*?(\d[\d\s,_.]{2,})/i),
  };
}

async function detectDivergences(docs, snapshot, lastB09) {
  const issues = [];
  const axes = {
    A: { name: "Fraîcheur CONTEXT",        status: null, detail: null },
    B: { name: "Compteurs Notion",         status: null, detail: null },
    C: { name: "CONTEXT ↔ Notion (live)",  status: null, detail: null },
  };

  // — AXE A — fraîcheur CONTEXT (file vs self-declared version) —
  if (!docs.context || !docs.context.content || !docs.context.version) {
    axes.A.status = "INDETERMINE";
    axes.A.detail = "CONTEXT illisible ou non sélectionné";
  } else {
    const selfV = extractContextSelfVersion(docs.context.content);
    if (selfV == null) {
      axes.A.status = "INDETERMINE";
      axes.A.detail = "version interne du CONTEXT non extractible (regex sans match)";
    } else if (selfV !== docs.context.version) {
      axes.A.status = "DIVERGENCE";
      axes.A.detail = `fichier INSIDE_OS_CONTEXT_v${docs.context.version}.md mais contenu déclare v${selfV}`;
      issues.push(`🔴 AXE A — fraîcheur CONTEXT : ${axes.A.detail}`);
    } else {
      axes.A.status = "OK";
      axes.A.detail = `v${docs.context.version} (fichier == contenu)`;
    }
  }

  // — AXE B — compteurs Notion (pending == 0 && error == 0) —
  if (!snapshot.ok) {
    axes.B.status = "INDETERMINE";
    axes.B.detail = `snapshot Notion KO : ${snapshot.error}`;
  } else {
    const probs = [];
    if (snapshot.inject_pending > 0) probs.push(`inject_pending=${snapshot.inject_pending}`);
    if (snapshot.inject_error   > 0) probs.push(`inject_error=${snapshot.inject_error}`);
    if (probs.length > 0) {
      axes.B.status = "DIVERGENCE";
      axes.B.detail = probs.join(", ");
      issues.push(`🔴 AXE B — compteurs Notion : ${axes.B.detail}`);
    } else {
      axes.B.status = "OK";
      axes.B.detail = `inject_done=${snapshot.inject_done}, pending=0, error=0`;
    }
  }

  // — AXE C — chiffres affirmés par le CONTEXT vs Notion live —
  if (!docs.context?.content) {
    axes.C.status = "INDETERMINE";
    axes.C.detail = "CONTEXT illisible";
  } else if (!snapshot.ok) {
    axes.C.status = "INDETERMINE";
    axes.C.detail = "snapshot Notion KO (impossible de comparer)";
  } else if (!DECISIONS_DS || !LESSONS_DS) {
    axes.C.status = "INDETERMINE";
    axes.C.detail = "DECISIONS_DS_ID ou LESSONS_DS_ID manquant dans .env";
  } else {
    const claims = extractContextClaims(docs.context.content);
    let liveDecisions, liveLessons;
    try {
      liveDecisions = await countDataSource(DECISIONS_DS);
      liveLessons   = await countDataSource(LESSONS_DS);
    } catch (e) {
      axes.C.status = "INDETERMINE";
      axes.C.detail = `query Notion DECISIONS/LESSONS KO : ${e.message}`;
    }
    if (axes.C.status !== "INDETERMINE") {
      const diffs = [];
      if (claims.inject_done != null && claims.inject_done !== snapshot.inject_done) {
        diffs.push(`inject_done : CONTEXT dit ${claims.inject_done}, Notion live ${snapshot.inject_done}`);
      }
      if (claims.decisions != null && claims.decisions !== liveDecisions) {
        diffs.push(`DECISIONS : CONTEXT dit ${claims.decisions}, Notion live ${liveDecisions}`);
      }
      if (claims.lessons != null && claims.lessons !== liveLessons) {
        diffs.push(`LESSONS : CONTEXT dit ${claims.lessons}, Notion live ${liveLessons}`);
      }
      const missing = [];
      if (claims.inject_done == null) missing.push("inject_done");
      if (claims.decisions   == null) missing.push("DECISIONS");
      if (claims.lessons     == null) missing.push("LESSONS");

      if (diffs.length > 0) {
        axes.C.status = "DIVERGENCE";
        axes.C.detail = diffs.join(" | ");
        diffs.forEach(d => issues.push(`🔴 AXE C — ${d}`));
      } else if (missing.length === 3) {
        axes.C.status = "INDETERMINE";
        axes.C.detail = "aucun chiffre (inject_done/DECISIONS/LESSONS) extractible du CONTEXT";
      } else {
        axes.C.status = "OK";
        axes.C.detail =
          `inject_done=${snapshot.inject_done}, DECISIONS=${liveDecisions}, LESSONS=${liveLessons}` +
          (missing.length > 0 ? ` (non vérifié : ${missing.join(", ")})` : "");
      }
    }
  }

  // — Avertissements complémentaires (non bloquants, hors verdict 3-axes) —
  if (docs.context?.lastThread && docs.backlog?.lastThread
      && docs.context.lastThread !== docs.backlog.lastThread) {
    issues.push(`⚠️  Thread source divergent : CONTEXT dit ${docs.context.lastThread}, BACKLOG dit ${docs.backlog.lastThread}`);
  }
  if (docs.context?.content
      && docs.context.content.split("\n").some(l => l.includes("[À COMPLÉTER]") && !l.includes("Aucun"))) {
    issues.push("🔴 CONTEXT actif contient des sections [À COMPLÉTER] — probablement un draft non validé");
  }
  if (docs.backlog?.content) {
    const readmeMatch  = docs.backlog.content.match(/README v(\d+)/);
    const promptMatch  = docs.backlog.content.match(/PROMPT v(\d+)/);
    const contextMatch = docs.backlog.content.match(/CONTEXT v(\d+)/);
    if (readmeMatch  && parseInt(readmeMatch[1], 10)  !== docs.readme.version)
      issues.push(`⚠️  BACKLOG référence README v${readmeMatch[1]} mais repo contient v${docs.readme.version}`);
    if (promptMatch  && parseInt(promptMatch[1], 10)  !== docs.prompt.version)
      issues.push(`⚠️  BACKLOG référence PROMPT v${promptMatch[1]} mais repo contient v${docs.prompt.version}`);
    if (contextMatch && parseInt(contextMatch[1], 10) !== docs.context.version)
      issues.push(`⚠️  BACKLOG référence CONTEXT v${contextMatch[1]} mais repo contient v${docs.context.version}`);
  }

  // — Verdict global : preuve positive ou INDÉTERMINÉ —
  const allOk = axes.A.status === "OK" && axes.B.status === "OK" && axes.C.status === "OK";
  const anyDiv = [axes.A, axes.B, axes.C].some(a => a.status === "DIVERGENCE");
  let verdict;
  if (allOk) {
    verdict = "ALIGNE";
  } else if (anyDiv) {
    verdict = "DIVERGENCE";
  } else {
    verdict = "INDETERMINE";
  }

  return { axes, issues, verdict };
}

// ─── ÉTAPE 5 : Générer le fichier PRE_THREAD ─────────────────────────────────

function buildPreThreadDoc(resolvedThreadName, docs, snapshot, lastB09, divergenceReport) {
  if (!resolvedThreadName || /TXX|Sujet/.test(resolvedThreadName)) {
    throw new Error(`buildPreThreadDoc : nom de thread non résolu ("${resolvedThreadName}") — refus d'écrire un placeholder en clair`);
  }
  const now = new Date().toISOString().slice(0, 10);
  const threadLabel = resolvedThreadName;

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

  const { axes, issues, verdict } = divergenceReport;
  const axeLine = (k) => {
    const a = axes[k];
    const icon = a.status === "OK" ? "✅" : a.status === "DIVERGENCE" ? "🔴" : "🟡";
    return `- ${icon} AXE ${k} — ${a.name} : ${a.status} (${a.detail})`;
  };
  const verdictLine =
    verdict === "ALIGNE"      ? "✅ VERDICT : ALIGNÉ — les 3 axes ont tourné et passé."
  : verdict === "DIVERGENCE"  ? "🔴 VERDICT : DIVERGENCE — au moins un axe a détecté un écart (voir détails ci-dessous)."
  :                             "🟡 VERDICT : INDÉTERMINÉ — au moins un axe n'a pas pu s'exécuter. Pas d'affirmation « aligné » sans preuve positive.";
  const detailsBlock = issues.length === 0 ? "(aucun détail)" : issues.join("\n");
  const divergencesSection =
`${verdictLine}

${axeLine("A")}
${axeLine("B")}
${axeLine("C")}

Détails :
${detailsBlock}`;

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

  const resolvedThreadName = nextThreadName
    || (lastB09.ok && lastB09.name && lastB09.name !== "aucun" ? autoIncrementThreadName(lastB09.name) : null);
  if (!resolvedThreadName) {
    throw new Error(
      `Nom du thread cible non résolu : --next absent et auto-incrément impossible ` +
      `(lastB09.ok=${lastB09.ok}, lastB09.name="${lastB09.name ?? "n/a"}"). ` +
      `Relance avec --next B09-T<N>-<Sujet>-<NNN>.`
    );
  }
  if (!nextThreadName) {
    log(`  → Nom auto-calculé : ${resolvedThreadName}`);
  }

  log("\n━━━ ÉTAPE 4 : Divergences (3 axes) ━━━");
  const divergenceReport = await detectDivergences(docs, snapshot, lastB09);
  const { axes, issues, verdict } = divergenceReport;
  for (const k of ["A", "B", "C"]) {
    const a = axes[k];
    const icon = a.status === "OK" ? "✅" : a.status === "DIVERGENCE" ? "🔴" : "🟡";
    log(`  ${icon} AXE ${k} (${a.name}) : ${a.status} — ${a.detail}`);
  }
  log(
    `  → VERDICT : ${
      verdict === "ALIGNE"     ? "✅ ALIGNÉ"
    : verdict === "DIVERGENCE" ? "🔴 DIVERGENCE"
    :                            "🟡 INDÉTERMINÉ"
    }`
  );
  if (issues.length > 0) {
    log("  Détails :");
    issues.forEach(d => log(`    ${d}`));
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
  const threadLabel = resolvedThreadName;
  const outFilename = `PRE_THREAD_${threadLabel}.md`;
  const outPath = path.join(REPO_ROOT, outFilename);
  const content = buildPreThreadDoc(resolvedThreadName, docs, snapshot, lastB09, divergenceReport);
  await fs.writeFile(outPath, content, "utf8");
  log(`  ✅ Fichier généré : ${outFilename}`);

  log("\n━━━ RÉSUMÉ ━━━");
  log(`  Versions : README ${docs.readme.versionStr} | PROMPT ${docs.prompt.versionStr} | PROMPT ASSOCIE ${docs.prompt_associe.versionStr} | CONTEXT ${docs.context.versionStr} | BACKLOG ${docs.backlog.versionStr} | BACKLOG DEV ${docs.backlog_dev.versionStr} | BACKLOG USER ${docs.backlog_user.versionStr}`);
  log(`  Verdict divergence : ${verdict}${issues.length > 0 ? ` (${issues.length} détail(s))` : ""}`);
  log(`  Fichier : ${outPath}`);
  log("\n  → Uploade ce fichier en début de thread B09 — le LLM a tout.\n");
}

main().catch(e => {
  console.error("Erreur fatale :", e.message);
  process.exit(1);
});
