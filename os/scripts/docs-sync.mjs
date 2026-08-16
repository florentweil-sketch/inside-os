#!/usr/bin/env node
// os/scripts/docs-sync.mjs
//
// Vérifie que les pointeurs de version déclarés dans CLAUDE.md ("latest = vNN")
// correspondent aux fichiers vXX réellement présents sur disque, pour le
// périmètre docs-sync (CLAUDE.md, doctrine B09-T42) :
//   CLAUDE.md, README.md, PROMPT_MAITRE (dernière version), BACKLOG_DEV.md,
//   BACKLOG_USER.md, IDEAS.md, dernière version de chaque famille de prompts
//   d'agent (SYNTHESE, PILOTAGE, OUVERTURE, INGEST_DOC, INFRA_TECH, ASSOCIE)
//   + SPEC_AGENT_SYNTHESE.
//
// Doctrine anti-hallucination : aucun verdict positif par défaut. Une famille
// non déclarée dans CLAUDE.md (pas de "(latest = vNN)" à son sujet) n'est ni
// OK ni DIVERGENCE — elle est NON_DECLAREE, signalée pour information, pas
// comme un échec. Rien de archive/ n'entre dans ce périmètre.
//
// Usage : npm run os:docs-sync
// Exit non-zéro si au moins une divergence réelle est détectée, ou si un
// fichier/dossier attendu du périmètre est absent (fail-loud, pas de skip).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");

// ─── PÉRIMÈTRE — fichiers simples (non versionnés par nom) ───────────────────

const SIMPLE_FILES = [
  "CLAUDE.md",
  "README.md",
  "BACKLOG_DEV.md",
  "BACKLOG_USER.md",
  "IDEAS.md",
];

// ─── PÉRIMÈTRE — familles versionnées (vXX dans le nom de fichier) ───────────
// dir : chemin relatif REPO_ROOT | prefix/suffix : encadrent le numéro vXX

const FAMILIES = {
  PROMPT_MAITRE: {
    dir: "docs/prompts-transfert-thread",
    prefix: "PROMPT_MAITRE_v",
    suffix: "_TRANSFERT_DE_THREAD.md",
  },
  PROMPT_ASSOCIE: {
    dir: "docs/prompts/associe",
    prefix: "PROMPT_ASSOCIE_v",
    suffix: ".md",
  },
  PROMPT_AGENT_SYNTHESE: {
    dir: "docs/prompts/synthese",
    prefix: "PROMPT_AGENT_SYNTHESE_v",
    suffix: ".md",
  },
  SPEC_AGENT_SYNTHESE: {
    dir: "docs/prompts/synthese",
    prefix: "SPEC_AGENT_SYNTHESE_v",
    suffix: ".md",
  },
  PROMPT_AGENT_PILOTAGE: {
    dir: "docs/prompts/pilotage",
    prefix: "PROMPT_AGENT_PILOTAGE_v",
    suffix: ".md",
  },
  PROMPT_AGENT_OUVERTURE: {
    dir: "docs/prompts/ouverture",
    prefix: "PROMPT_AGENT_OUVERTURE_v",
    suffix: ".md",
  },
  PROMPT_INGEST_DOC: {
    dir: "docs/prompts/ingest-doc",
    prefix: "PROMPT_INGEST_DOC_v",
    suffix: ".md",
  },
  PROMPT_AGENT_INFRA_TECH: {
    dir: "docs/prompts/agent",
    prefix: "PROMPT_AGENT_INFRA_TECH_v",
    suffix: ".md",
  },
};

// ─── DISQUE : dernière version par famille (fail-loud, pas de fallback) ──────

function findLatestOnDisk(family, config) {
  const dirPath = path.join(REPO_ROOT, config.dir);
  if (!fs.existsSync(dirPath)) {
    throw new Error(`[docs-sync] famille ${family} : dossier introuvable ${config.dir}`);
  }
  const files = fs.readdirSync(dirPath);
  const escapedPrefix = config.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedSuffix = config.suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escapedPrefix}(\\d+)${escapedSuffix}$`);

  const matches = files
    .map((f) => {
      const m = f.match(regex);
      return m ? { file: f, version: parseInt(m[1], 10) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.version - a.version);

  if (matches.length === 0) {
    throw new Error(
      `[docs-sync] famille ${family} : aucun fichier ${config.prefix}<N>${config.suffix} dans ${config.dir}`
    );
  }
  return matches[0].version;
}

// ─── CLAUDE.md : pointeurs déclarés "(latest = vNN)" par préfixe ─────────────

function findDeclaredPointer(claudeMdContent, prefix) {
  // Cherche la première occurrence du préfixe suivie, sur la même ligne,
  // d'une annotation "(latest = vNN)". Pas de correspondance = non déclaré.
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lineRegex = new RegExp(`^.*${escapedPrefix}.*$`, "m");
  const lines = claudeMdContent.split("\n");
  for (const line of lines) {
    if (line.includes(prefix)) {
      const m = line.match(/latest\s*=\s*v(\d+)/);
      if (m) return parseInt(m[1], 10);
    }
  }
  return null;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

function main() {
  console.log("\n=== os:docs-sync — vérification des pointeurs de version ===\n");

  let anyDivergence = false;
  let anyMissing = false;

  console.log("── Fichiers simples du périmètre ──");
  for (const f of SIMPLE_FILES) {
    const p = path.join(REPO_ROOT, f);
    if (fs.existsSync(p)) {
      console.log(`  ✅ ${f}`);
    } else {
      console.log(`  ❌ ${f} — ABSENT`);
      anyMissing = true;
    }
  }

  console.log("\n── Familles versionnées ──");
  const claudeMdPath = path.join(REPO_ROOT, "CLAUDE.md");
  if (!fs.existsSync(claudeMdPath)) {
    throw new Error("[docs-sync] CLAUDE.md introuvable — impossible de vérifier les pointeurs déclarés.");
  }
  const claudeMdContent = fs.readFileSync(claudeMdPath, "utf8");

  for (const [family, config] of Object.entries(FAMILIES)) {
    let diskLatest;
    try {
      diskLatest = findLatestOnDisk(family, config);
    } catch (e) {
      console.log(`  ❌ ${family} — ${e.message}`);
      anyMissing = true;
      continue;
    }

    const declared = findDeclaredPointer(claudeMdContent, config.prefix);
    if (declared === null) {
      console.log(`  🟡 ${family} — disque v${diskLatest} | non déclaré dans CLAUDE.md (informationnel, pas une divergence)`);
    } else if (declared === diskLatest) {
      console.log(`  ✅ ${family} — v${diskLatest} (disque == CLAUDE.md)`);
    } else {
      console.log(`  🔴 ${family} — DIVERGENCE : disque v${diskLatest}, CLAUDE.md déclare v${declared}`);
      anyDivergence = true;
    }
  }

  console.log("");
  if (anyMissing) {
    console.log("❌ VERDICT : fichier(s)/dossier(s) attendus du périmètre absents — voir détails ci-dessus.\n");
    process.exit(1);
  }
  if (anyDivergence) {
    console.log("🔴 VERDICT : DIVERGENCE — au moins un pointeur CLAUDE.md ne correspond pas au disque.\n");
    process.exit(1);
  }
  console.log("✅ VERDICT : ALIGNÉ — tous les pointeurs déclarés correspondent au disque.\n");
}

main();
