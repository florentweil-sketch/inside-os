// os/agents/ingest-doc/ingest-doc.mjs
//
// Logique de l'Agent Ingestion Docs — verse un document (PDF) dans la
// mémoire INSIDE OS en le transformant en fichier "thread dump" texte
// déposé dans data/threads_to_process/, avec le prochain id_dump B99-Txx
// libre. Le pipeline existant (os:ingest --only / os:extract / os:inject)
// fait ensuite le reste — cet agent ne touche jamais Notion en écriture et
// n'appelle jamais le pipeline lui-même.
//
// Garde-fous (fail-loud, doctrine anti-hallucination) :
//   - PDF illisible, vide, ou hors plafond de taille -> throw
//   - bucket hors de VALID_BUCKETS -> throw
//   - id_dump calculé déjà pris (Notion ou fichier local) -> throw
//   - garde anti-réinjection B99-T99 appliquée sur l'id_dump calculé

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { queryDataSource, getPropText } from "../../lib/notion.mjs";
import { claudeFetch } from "../../lib/claude.mjs";
import { CFG, env } from "../../lib/config.mjs";
import { assertNotBlockedDumpId } from "../../lib/guard.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");

const THREADS_TO_PROCESS_DIR = path.join(REPO_ROOT, "data", "threads_to_process");

const PROMPT_PATH = path.resolve(
  __dirname,
  "../../../docs/prompts/ingest-doc/PROMPT_INGEST_DOC_v01.md"
);

// Dupliqué depuis os/inject/inject-decisions-lessons.mjs (non exporté de là-bas) —
// même liste, à garder en synchro si le schéma Notion évolue.
export const VALID_BUCKETS = ["B01", "B02", "B03", "B04", "B05", "B06", "B07", "B08", "B09", "B99"];

// Plafond PDF : la requête Anthropic totale est limitée à 32 Mo, et le base64
// gonfle la taille d'environ 4/3. 20 Mo de PDF -> ~26.7 Mo encodés, laisse une
// marge pour le prompt et l'enveloppe JSON. Rejet explicite au-delà — jamais
// de troncature silencieuse.
export const MAX_PDF_BYTES = 20 * 1024 * 1024;

function loadExtractionPrompt() {
  if (!fs.existsSync(PROMPT_PATH)) {
    throw new Error(
      `Prompt d'extraction absent : ${PROMPT_PATH}. ` +
      `L'Agent Ingestion Docs ne tourne pas sans son prompt (doctrine fail-loud).`
    );
  }
  return fs.readFileSync(PROMPT_PATH, "utf8");
}

export function assertValidBucket(bucket) {
  if (!bucket || typeof bucket !== "string" || !VALID_BUCKETS.includes(bucket.trim().toUpperCase())) {
    throw new Error(
      `Bucket invalide : "${bucket}". Valeurs acceptées : ${VALID_BUCKETS.join(", ")}.`
    );
  }
  return bucket.trim().toUpperCase();
}

// Détermine le prochain id_dump B99-Txx libre en lisant THREAD_DUMP live.
// Pagine intégralement — pas de troncature silencieuse à la première page.
export async function findNextIdDump() {
  const dsId = CFG.THREAD_DUMP_DS_ID;
  let cursor;
  let maxN = 0;

  while (true) {
    const res = await queryDataSource(dsId, {
      page_size: 100,
      start_cursor: cursor,
      filter: { property: "id_dump", rich_text: { starts_with: "B99-T" } },
    });

    for (const page of res.results || []) {
      const idDump = getPropText(page, "id_dump");
      const m = /^B99-T(\d+)(-|$)/.exec(idDump || "");
      if (!m) continue;
      const n = parseInt(m[1], 10);
      // B99-T99 est le motif bloqué (fausse data archivée) — ne compte jamais
      // comme référence de numérotation, même s'il traînait encore en base.
      if (n === 99) continue;
      if (n > maxN) maxN = n;
    }

    if (!res.has_more) break;
    cursor = res.next_cursor;
  }

  const next = maxN + 1;
  if (next >= 99) {
    throw new Error(
      `Prochain id_dump B99-T${next} atteint/dépasse la réserve bloquée B99-T99 — ` +
      `numérotation à revoir manuellement, arrêt fail-loud.`
    );
  }
  return `B99-T${String(next).padStart(2, "0")}`;
}

// Garde-fou anti-collision : re-vérifie que l'id_dump calculé n'existe nulle
// part (Notion + fichiers locaux déjà déposés) avant de l'utiliser.
export async function assertIdDumpFree(idDump) {
  assertNotBlockedDumpId(idDump, "(id_dump calculé par l'Agent Ingestion Docs)");

  const res = await queryDataSource(CFG.THREAD_DUMP_DS_ID, {
    page_size: 1,
    filter: { property: "id_dump", rich_text: { equals: idDump } },
  });
  if ((res.results || []).length > 0) {
    throw new Error(
      `id_dump "${idDump}" existe déjà dans THREAD_DUMP Notion — collision, arrêt fail-loud.`
    );
  }

  if (fs.existsSync(THREADS_TO_PROCESS_DIR)) {
    const existing = fs
      .readdirSync(THREADS_TO_PROCESS_DIR)
      .find((f) => f.toUpperCase().startsWith(idDump.toUpperCase()));
    if (existing) {
      throw new Error(
        `Un fichier "${existing}" portant déjà l'id_dump "${idDump}" existe dans ` +
        `data/threads_to_process/ — collision, arrêt fail-loud.`
      );
    }
  }
}

// Construit un slug type "Mot-Mot-Mot" cohérent avec la convention observée
// (ex. B99-T11-Manoir-Septeuil-Raya-Salame.txt).
export function buildSlug(base) {
  const words = String(base || "document")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // diacritiques (accents decomposes par NFD)
    .replace(/\.[a-zA-Z0-9]+$/, "") // extension
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  const slug = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
  return (slug || "Document").slice(0, 80);
}

function readPdfOrThrow(filePath) {
  if (!filePath || !filePath.trim()) {
    throw new Error("Chemin de fichier PDF manquant. Usage : npm run os:ingest-doc -- <chemin.pdf> --bucket B0X");
  }
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Fichier introuvable : ${resolved}`);
  }
  if (!resolved.toLowerCase().endsWith(".pdf")) {
    throw new Error(`Fichier non-PDF rejeté : ${resolved} (seul le PDF est supporté pour l'instant).`);
  }
  const buf = fs.readFileSync(resolved);
  if (buf.length === 0) {
    throw new Error(`PDF vide (0 octet) : ${resolved}. Un document illisible ne doit pas entrer en mémoire.`);
  }
  if (buf.length > MAX_PDF_BYTES) {
    throw new Error(
      `PDF trop volumineux : ${(buf.length / 1024 / 1024).toFixed(1)} Mo > plafond ${MAX_PDF_BYTES / 1024 / 1024} Mo. ` +
      `Rejet explicite — pas de troncature silencieuse. Fractionne le document si besoin.`
    );
  }
  return { resolved, buf };
}

async function extractPdfFacts({ base64, bucket, titre, filename }) {
  const promptText = loadExtractionPrompt();
  const hints = [];
  hints.push(`BUCKET INDICATIF TRANSMIS PAR L'APPELANT : ${bucket}`);
  if (titre) hints.push(`TITRE INDICATIF TRANSMIS PAR L'APPELANT : ${titre}`);

  const userText = `${promptText}\n\n---\n\n${hints.join("\n")}\n\nExtrais maintenant les faits du document PDF ci-joint.`;

  const { text: response, stopReason } = await claudeFetch({
    model: env("CLAUDE_MODEL"),
    // 8000 s'est révélé insuffisant sur un document dense (statuts complets
    // retranscrits article par article, sans compression) — extraction coupée
    // en plein milieu d'une clause, constaté B09-T43 sur "Derniers statuts à
    // jour_INSIDE SAS.pdf". Relevé à 16000, marge large pour les actes les
    // plus longs du lot corporate (dépôts de greffe multi-pages inclus).
    max_tokens: 16000,
    full: true,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          { type: "text", text: userText },
        ],
      },
    ],
  });

  // Fix racine (B09-T43, cousin de P13/P23) : une extraction coupée par
  // max_tokens revenait auparavant comme si elle était complète — c'est un
  // regard humain en mode revue qui l'a détectée, pas l'outil. Toute fin de
  // réponse autre que "end_turn" (max_tokens atteint, refus, etc.) est un
  // contenu potentiellement partiel : crash > silence, jamais de retour
  // silencieux d'un texte tronqué.
  if (stopReason !== "end_turn") {
    throw new Error(
      `Extraction PDF incomplète — stop_reason="${stopReason}" (attendu "end_turn") sur ` +
      `"${filename || "document inconnu"}". Fail-loud : rien n'est écrit sur une extraction ` +
      `potentiellement tronquée. Augmenter max_tokens ou fractionner le document.`
    );
  }

  if (!response || !response.trim()) {
    throw new Error(
      "Extraction PDF vide — le LLM n'a produit aucun texte. Document illisible ou appel échoué. " +
      "Fail-loud : rien n'est écrit sans contenu extrait."
    );
  }
  return response.trim();
}

export function buildDumpText({ filename, sourceUrl, ingestedAtIso, bucket, titre, extractedText }) {
  const lines = [];
  // En-tête obligatoire — traçabilité vers l'original, non négociable.
  lines.push(
    `DOCUMENT SOURCE : ${filename} | ${sourceUrl ? sourceUrl : "source-url non fournie"} | ingéré le ${ingestedAtIso}`
  );
  lines.push("");
  lines.push(`BUCKET SUGGÉRÉ : ${bucket}`);
  if (titre) lines.push(`TITRE : ${titre}`);
  lines.push("");
  lines.push(extractedText);
  lines.push("");
  return lines.join("\n");
}

// Orchestration complète, sans écriture — retourne tout ce qu'il faut pour
// que run.mjs affiche, demande confirmation, puis écrive.
export async function prepareIngestDoc({ filePath, bucket, titre, sourceUrl }) {
  for (const k of ["NOTION_API_KEY", "THREAD_DUMP_DS_ID"]) {
    if (!CFG[k]) throw new Error(`ENV missing: ${k}`);
  }
  env("ANTHROPIC_API_KEY"); // fail-loud si absent, avant de lire quoi que ce soit

  const validBucket = assertValidBucket(bucket);
  const { resolved, buf } = readPdfOrThrow(filePath);
  const filename = path.basename(resolved);

  console.error(`[ingest-doc] fichier : ${resolved} (${(buf.length / 1024).toFixed(0)} Ko)`);
  console.error(`[ingest-doc] recherche du prochain id_dump B99-Txx libre…`);
  const idDump = await findNextIdDump();
  await assertIdDumpFree(idDump);
  console.error(`[ingest-doc] id_dump attribué : ${idDump}`);

  console.error(`[ingest-doc] appel LLM d'extraction (CLAUDE_MODEL=${env("CLAUDE_MODEL")})…`);
  const base64 = buf.toString("base64");
  const extractedText = await extractPdfFacts({ base64, bucket: validBucket, titre, filename });

  const ingestedAtIso = new Date().toISOString();
  const dumpText = buildDumpText({
    filename,
    sourceUrl,
    ingestedAtIso,
    bucket: validBucket,
    titre,
    extractedText,
  });

  const slug = buildSlug(titre || filename);
  const outFilename = `${idDump}-${slug}.txt`;
  const outPath = path.join(THREADS_TO_PROCESS_DIR, outFilename);

  return { idDump, filename, outFilename, outPath, dumpText, bucket: validBucket, titre, sourceUrl };
}

export async function writeDump({ outPath, dumpText }) {
  await fsp.mkdir(THREADS_TO_PROCESS_DIR, { recursive: true });
  await fsp.writeFile(outPath, dumpText, "utf8");
  return outPath;
}

export { THREADS_TO_PROCESS_DIR };
