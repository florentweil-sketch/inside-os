#!/usr/bin/env node
// os/scripts/docs-sync.mjs
//
// 1) Vérifie que les pointeurs de version déclarés dans CLAUDE.md ("latest = vNN")
//    correspondent aux fichiers vXX réellement présents sur disque, pour le
//    périmètre docs-sync (CLAUDE.md, doctrine B09-T42) :
//      CLAUDE.md, README.md, PROMPT_MAITRE (dernière version), BACKLOG_DEV.md,
//      BACKLOG_USER.md, IDEAS.md, dernière version de chaque famille de prompts
//      d'agent (SYNTHESE, PILOTAGE, OUVERTURE, INGEST_DOC, INFRA_TECH, ASSOCIE)
//      + SPEC_AGENT_SYNTHESE.
//    Doctrine anti-hallucination : aucun verdict positif par défaut. Une famille
//    non déclarée dans CLAUDE.md (pas de "(latest = vNN)" à son sujet) n'est ni
//    OK ni DIVERGENCE — elle est NON_DECLAREE, signalée pour information, pas
//    comme un échec. Rien de archive/ n'entre dans ce périmètre, ni recap-session.md
//    (canal de transfert de session, pas un document système — ne pas l'ajouter
//    à SIMPLE_FILES).
//
// 2) Pousse chaque fichier du périmètre vers une page Notion, enfant de la
//    page "Doctrine — miroir" (créée si absente, sous INSIDE_OS_ROOT). Chaque
//    page miroir commence par un bandeau (date + commit court + "ne pas éditer
//    ici"), suivi du markdown converti en blocs. Runs suivants : la page
//    existante (retrouvée par titre) a son contenu intégralement remplacé —
//    jamais de duplication. Fail-loud si un fichier du périmètre est manquant
//    ou si une écriture Notion est refusée (pas de skip silencieux).
//    L'ancienne page "INSIDE-OS-BACKLOG" (miroir manuel pré-split DEV/USER,
//    obsolète) a son contenu remplacé par un pointeur vers le nouveau miroir.
//
// Usage :
//   npm run os:docs-sync              — check pointeurs + miroir Notion (défaut)
//   npm run os:docs-sync -- --check-only — check pointeurs seul, pas d'écriture Notion
//
// Exit non-zéro si : divergence de pointeur détectée, fichier/dossier du
// périmètre absent, ou échec d'écriture Notion.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  createChildPage,
  appendBlockChildrenBatched,
  clearBlockChildren,
  findChildPageByTitle,
  listAllBlockChildren,
} from "../lib/notion.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");

const CHECK_ONLY = process.argv.includes("--check-only");

// Pages Notion fixes (données par Florent, B09-T42) — pas de recherche
// workspace, on cible directement les IDs connus.
const INSIDE_OS_ROOT_PAGE_ID = "3155e503-b0ac-801a-9841-e5ffc98cc35f";
const OLD_BACKLOG_MIRROR_PAGE_ID = "35b5e503-b0ac-81d8-8c6d-f6bb8a796a4d";
const DOCTRINE_MIRROR_TITLE = "Doctrine — miroir";

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
  return { version: matches[0].version, file: matches[0].file, dir: config.dir };
}

// ─── CLAUDE.md : pointeurs déclarés "(latest = vNN)" par préfixe ─────────────

function findDeclaredPointer(claudeMdContent, prefix) {
  const lines = claudeMdContent.split("\n");
  for (const line of lines) {
    if (line.includes(prefix)) {
      const m = line.match(/latest\s*=\s*v(\d+)/);
      if (m) return parseInt(m[1], 10);
    }
  }
  return null;
}

// ─── MARKDOWN → BLOCS NOTION ──────────────────────────────────────────────────
// Convertisseur pragmatique, ligne par ligne. Limitation assumée : pas de gras/
// italique/liens inline (rich text brut) — le miroir est un affichage lecture
// seule, pas une réplique interactive. Tables markdown converties en vraies
// tables Notion (les autres blocs, en texte brut).

const MAX_RICH_TEXT_CHARS = 1900;

function chunkRichText(text) {
  const segments = [];
  let s = String(text ?? "");
  if (s.length === 0) return [{ type: "text", text: { content: "" } }];
  while (s.length > 0) {
    segments.push(s.slice(0, MAX_RICH_TEXT_CHARS));
    s = s.slice(MAX_RICH_TEXT_CHARS);
  }
  return segments.map((t) => ({ type: "text", text: { content: t } }));
}

function paragraphBlock(text) {
  return { object: "block", type: "paragraph", paragraph: { rich_text: chunkRichText(text) } };
}
function headingBlock(level, text) {
  const type = level === 1 ? "heading_1" : level === 2 ? "heading_2" : "heading_3";
  return { object: "block", type, [type]: { rich_text: chunkRichText(text) } };
}
function bulletBlock(text) {
  return { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: chunkRichText(text) } };
}
function numberedBlock(text) {
  return { object: "block", type: "numbered_list_item", numbered_list_item: { rich_text: chunkRichText(text) } };
}
function quoteBlock(text) {
  return { object: "block", type: "quote", quote: { rich_text: chunkRichText(text) } };
}
// Notion n'accepte qu'un enum fixe de langages pour les blocs code — les tags
// de fence markdown (js, sh, etc.) n'y correspondent pas tous. Normalise vers
// l'enum Notion ; tout langage non reconnu retombe sur "plain text" (affichage
// seul, la coloration syntaxique exacte n'est pas la source de vérité).
const NOTION_CODE_LANGUAGES = new Set([
  "abap","abc","agda","arduino","ascii art","assembly","bash","basic","bnf","c","c#","c++",
  "clojure","coffeescript","coq","css","dart","dhall","diff","docker","ebnf","elixir","elm",
  "erlang","f#","flow","fortran","gherkin","glsl","go","graphql","groovy","haskell","hcl","html",
  "idris","java","javascript","json","julia","kotlin","latex","less","lisp","livescript","llvm ir",
  "lua","makefile","markdown","markup","matlab","mathematica","mermaid","nix","notion formula",
  "objective-c","ocaml","pascal","perl","php","plain text","powershell","prolog","protobuf",
  "purescript","python","r","racket","reason","ruby","rust","sass","scala","scheme","scss","shell",
  "smalltalk","solidity","sql","swift","toml","typescript","vb.net","verilog","vhdl","visual basic",
  "webassembly","xml","yaml","java/c/c++/c#",
]);
const LANGUAGE_ALIASES = {
  js: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", tsx: "typescript", jsx: "javascript",
  sh: "shell", zsh: "shell", txt: "plain text", md: "markdown", py: "python", rb: "ruby",
};
function normalizeCodeLanguage(language) {
  const raw = (language || "plain text").toLowerCase();
  const aliased = LANGUAGE_ALIASES[raw] || raw;
  return NOTION_CODE_LANGUAGES.has(aliased) ? aliased : "plain text";
}
function codeBlock(text, language) {
  return { object: "block", type: "code", code: { rich_text: chunkRichText(text), language: normalizeCodeLanguage(language) } };
}
function dividerBlock() {
  return { object: "block", type: "divider", divider: {} };
}
function tableBlock(rows) {
  const width = Math.max(...rows.map((r) => r.length));
  return {
    object: "block",
    type: "table",
    table: {
      table_width: width,
      has_column_header: true,
      has_row_header: false,
      children: rows.map((cells) => ({
        object: "block",
        type: "table_row",
        table_row: {
          cells: Array.from({ length: width }, (_, i) => chunkRichText(cells[i] ?? "")),
        },
      })),
    },
  };
}

const SEPARATOR_ROW_RE = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/;

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function mdToNotionBlocks(markdown) {
  const lines = markdown.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Bloc de code
    const fenceMatch = line.match(/^```(\S*)/);
    if (fenceMatch) {
      const lang = fenceMatch[1] || "plain text";
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // sauter la fence fermante
      blocks.push(codeBlock(codeLines.join("\n"), lang));
      continue;
    }

    // Table (lignes "|" contiguës)
    if (line.trim().startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines
        .filter((l) => !SEPARATOR_ROW_RE.test(l.trim()))
        .map(splitTableRow);
      if (rows.length > 0) blocks.push(tableBlock(rows));
      continue;
    }

    // Titre
    const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      blocks.push(headingBlock(Math.min(hMatch[1].length, 3), hMatch[2]));
      i++;
      continue;
    }

    // Ligne horizontale
    if (/^-{3,}$/.test(line.trim())) {
      blocks.push(dividerBlock());
      i++;
      continue;
    }

    // Citation
    if (line.startsWith("> ")) {
      blocks.push(quoteBlock(line.slice(2)));
      i++;
      continue;
    }

    // Liste à puces
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      blocks.push(bulletBlock(bulletMatch[1]));
      i++;
      continue;
    }

    // Liste numérotée
    const numMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    if (numMatch) {
      blocks.push(numberedBlock(numMatch[1]));
      i++;
      continue;
    }

    // Ligne vide — ignorée (pas de spam de paragraphes vides)
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Défaut : paragraphe
    blocks.push(paragraphBlock(line));
    i++;
  }

  return blocks;
}

function bannerBlocks(dateStr, commitHash) {
  return [
    {
      object: "block",
      type: "callout",
      callout: {
        icon: { emoji: "⚠️" },
        rich_text: [
          {
            type: "text",
            text: {
              content: `Miroir généré le ${dateStr} depuis le commit ${commitHash} — source de vérité : le repo. Ne pas éditer ici.`,
            },
            annotations: { bold: true },
          },
        ],
      },
    },
    dividerBlock(),
  ];
}

// ─── MIROIR NOTION ────────────────────────────────────────────────────────────

async function ensureDoctrineMirrorPage() {
  const existing = await findChildPageByTitle(INSIDE_OS_ROOT_PAGE_ID, DOCTRINE_MIRROR_TITLE);
  if (existing) return existing;
  const created = await createChildPage(INSIDE_OS_ROOT_PAGE_ID, DOCTRINE_MIRROR_TITLE, [
    paragraphBlock(
      "Miroir lecture seule du périmètre docs-sync du repo INSIDE OS. Généré et maintenu par npm run os:docs-sync — ne pas éditer manuellement, les modifications seraient écrasées au prochain run."
    ),
  ]);
  return created.id;
}

// Crée ou retrouve la page miroir d'un fichier, remplace intégralement son
// contenu (bandeau + markdown converti). Fail-loud : toute erreur Notion
// remonte sans être avalée.
async function mirrorFileToNotion({ mirrorParentId, pageTitle, filePath, dateStr, commitHash }) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[docs-sync] mirroir Notion : fichier attendu absent — ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf8");
  const blocks = [...bannerBlocks(dateStr, commitHash), ...mdToNotionBlocks(content)];

  let pageId = await findChildPageByTitle(mirrorParentId, pageTitle);
  if (pageId) {
    const cleared = await clearBlockChildren(pageId);
    await appendBlockChildrenBatched(pageId, blocks);
    return { pageId, action: "updated", clearedBlocks: cleared };
  }

  const first100 = blocks.slice(0, 100);
  const rest = blocks.slice(100);
  const created = await createChildPage(mirrorParentId, pageTitle, first100);
  if (rest.length > 0) await appendBlockChildrenBatched(created.id, rest);
  return { pageId: created.id, action: "created", url: created.url };
}

async function pointOldBacklogMirrorToNew(newMirrorUrl) {
  const cleared = await clearBlockChildren(OLD_BACKLOG_MIRROR_PAGE_ID);
  await appendBlockChildrenBatched(OLD_BACKLOG_MIRROR_PAGE_ID, [
    {
      object: "block",
      type: "callout",
      callout: {
        icon: { emoji: "➡️" },
        rich_text: [
          {
            type: "text",
            text: { content: "Cette page est obsolète (miroir manuel pré-split BACKLOG_DEV/BACKLOG_USER, dernière maj B09-T34)." },
            annotations: { bold: true },
          },
        ],
      },
    },
    paragraphBlock("Remplacée par le miroir doctrine automatisé — voir la page :"),
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: DOCTRINE_MIRROR_TITLE, link: { url: newMirrorUrl } } }],
      },
    },
  ]);
  return cleared;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

function gitShortHash() {
  return execSync("git rev-parse --short HEAD", { cwd: REPO_ROOT }).toString().trim();
}

async function main() {
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

  const resolvedFamilies = {};
  for (const [family, config] of Object.entries(FAMILIES)) {
    let latest;
    try {
      latest = findLatestOnDisk(family, config);
    } catch (e) {
      console.log(`  ❌ ${family} — ${e.message}`);
      anyMissing = true;
      continue;
    }
    resolvedFamilies[family] = latest;

    const declared = findDeclaredPointer(claudeMdContent, config.prefix);
    if (declared === null) {
      console.log(`  🟡 ${family} — disque v${latest.version} | non déclaré dans CLAUDE.md (informationnel, pas une divergence)`);
    } else if (declared === latest.version) {
      console.log(`  ✅ ${family} — v${latest.version} (disque == CLAUDE.md)`);
    } else {
      console.log(`  🔴 ${family} — DIVERGENCE : disque v${latest.version}, CLAUDE.md déclare v${declared}`);
      anyDivergence = true;
    }
  }

  if (anyMissing) {
    console.log("\n❌ VERDICT CHECK : fichier(s)/dossier(s) attendus du périmètre absents — arrêt avant miroir Notion.\n");
    process.exit(1);
  }
  console.log(
    anyDivergence
      ? "\n🔴 VERDICT CHECK : DIVERGENCE — au moins un pointeur CLAUDE.md ne correspond pas au disque.\n"
      : "\n✅ VERDICT CHECK : ALIGNÉ — tous les pointeurs déclarés correspondent au disque.\n"
  );

  if (CHECK_ONLY) {
    process.exit(anyDivergence ? 1 : 0);
  }

  // ── Miroir Notion ──
  console.log("=== Miroir Notion — pousse le périmètre docs-sync ===\n");

  const dateStr = new Date().toISOString().slice(0, 10);
  const commitHash = gitShortHash();
  console.log(`  Date : ${dateStr} | Commit : ${commitHash}`);

  const mirrorParentId = await ensureDoctrineMirrorPage();
  console.log(`  Page "${DOCTRINE_MIRROR_TITLE}" : ${mirrorParentId}`);

  for (const f of SIMPLE_FILES) {
    const filePath = path.join(REPO_ROOT, f);
    const result = await mirrorFileToNotion({
      mirrorParentId,
      pageTitle: f,
      filePath,
      dateStr,
      commitHash,
    });
    console.log(`  ✅ ${f} — ${result.action}`);
  }

  for (const [family, latest] of Object.entries(resolvedFamilies)) {
    const filePath = path.join(REPO_ROOT, latest.dir, latest.file);
    const result = await mirrorFileToNotion({
      mirrorParentId,
      pageTitle: family,
      filePath,
      dateStr,
      commitHash,
    });
    console.log(`  ✅ ${family} (${latest.file}) — ${result.action}`);
  }

  // Page "Doctrine — miroir" elle-même, pour obtenir son URL à afficher/pointer.
  const mirrorPageChildren = await listAllBlockChildren(INSIDE_OS_ROOT_PAGE_ID);
  const mirrorBlock = mirrorPageChildren.find(
    (b) => b.type === "child_page" && b.child_page?.title === DOCTRINE_MIRROR_TITLE
  );
  const mirrorUrl = mirrorBlock ? `https://www.notion.so/${mirrorParentId.replace(/-/g, "")}` : null;

  console.log(`\n  Pointer l'ancienne page INSIDE-OS-BACKLOG vers le nouveau miroir…`);
  await pointOldBacklogMirrorToNew(mirrorUrl || `https://www.notion.so/${mirrorParentId.replace(/-/g, "")}`);
  console.log(`  ✅ INSIDE-OS-BACKLOG (obsolète) — pointeur mis à jour`);

  console.log(`\n✅ Miroir Notion à jour : https://www.notion.so/${mirrorParentId.replace(/-/g, "")}\n`);

  process.exit(anyDivergence ? 1 : 0);
}

main().catch((e) => {
  console.error(`\n❌ ÉCHEC : ${e.message}\n`);
  process.exit(1);
});
