// os/agents/synthese/sources.mjs
//
// Couche d'accès aux sources pour l'Agent Synthèse.
// LECTURE SEULE. N'importe AUCUNE fonction d'écriture de notion.mjs
// (pas de createPage, pas de updatePage). Garde-fou de l'agent
// imposé par PROMPT_AGENT_SYNTHESE_v01 § Périmètre.
//
// Ne dépend que des fonctions de lecture exposées par os/lib/notion.mjs :
//   - queryDataSource
//   - listAllBlockChildren
//   - getPropText

import { queryDataSource, listAllBlockChildren, getPropText } from "../../lib/notion.mjs";
import { CFG } from "../../lib/config.mjs";

const PAGE_SIZE = 100;

// Tokenize un sujet pour le scoring : minuscule, sans diacritiques, mots >= 4 lettres.
// Aligné sur le tokenizer du chat (B09-T36 P9 : diacritiques retirés).
export function tokenize(text) {
  const lowered = String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const words = lowered.split(/[^a-z0-9]+/).filter(Boolean);
  // mots-outils français + anglais courants à filtrer
  const STOP = new Set([
    "le","la","les","un","une","des","de","du","et","ou","est","sont","pour","sur","dans",
    "avec","sans","par","ce","cette","ces","qui","que","quoi","quel","quels","quelle",
    "quelles","au","aux","en","mais","donc","or","ni","car","the","and","for","with","that",
    "this","what","where","when","how","who","why","sont","ete","etre",
  ]);
  return [...new Set(words.filter((w) => w.length >= 4 && !STOP.has(w)))];
}

// Score un item Notion contre un set de tokens (sujet de la synthèse).
// Pondération : title compte double (signal fort), raw_text simple.
// Seuil de pertinence remonté côté appelant.
export function scoreItem(page, tokens) {
  if (!tokens.length) return 0;
  const titleText = getPropText(page, "title").toLowerCase();
  const rawText = getPropText(page, "raw_text").toLowerCase();
  const titleNorm = titleText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const rawNorm = rawText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let score = 0;
  for (const t of tokens) {
    if (titleNorm.includes(t)) score += 2;
    if (rawNorm.includes(t)) score += 1;
  }
  return score;
}

// Lit TOUTES les pages d'une datasource (pagine jusqu'à épuisement).
// Throw si la datasource répond mal — pas de fallback silencieux (doctrine CLAUDE.md).
export async function readAllPages(dataSourceId, label) {
  if (!dataSourceId) throw new Error(`DS_ID manquant pour ${label}`);
  const all = [];
  let cursor = undefined;
  while (true) {
    const payload = { page_size: PAGE_SIZE };
    if (cursor) payload.start_cursor = cursor;
    const res = await queryDataSource(dataSourceId, payload);
    if (!Array.isArray(res?.results)) {
      throw new Error(`Réponse Notion invalide pour ${label} : ${JSON.stringify(res).slice(0, 200)}`);
    }
    all.push(...res.results);
    if (!res.has_more) break;
    cursor = res.next_cursor;
  }
  return all;
}

// Pour chaque page retenue, lit ses blocs (contenu réel).
// raw_text = résumé une ligne, ne pas lire pour extraction (piège connu CLAUDE.md).
// Le contenu de la décision/leçon est dans les BLOCS de la page.
export async function readPageContent(pageId) {
  const blocks = await listAllBlockChildren(pageId);
  const lines = [];
  for (const b of blocks) {
    const t = b.type;
    const rich = b[t]?.rich_text;
    if (Array.isArray(rich) && rich.length) {
      const text = rich.map((r) => r.plain_text).join("");
      if (text.trim()) lines.push(text);
    }
  }
  return lines.join("\n");
}

// Source 1 : DECISIONS_DS_ID
export async function readDecisions() {
  return readAllPages(CFG.DECISIONS_DS_ID, "DECISIONS");
}

// Source 2 : LESSONS_DS_ID
export async function readLessons() {
  return readAllPages(CFG.LESSONS_DS_ID, "LESSONS");
}

// Source 3 : THREAD_DUMP_DS_ID — on lit aussi pour permettre la mise en service
// (premier livrable : état technique réel => besoin de voir les threads).
export async function readThreadDump() {
  return readAllPages(CFG.THREAD_DUMP_DS_ID, "THREAD_DUMP");
}

// Sélectionne les N items les plus pertinents pour un sujet.
// MIN_SCORE = 2 (au moins un mot dans le titre, ou deux dans le raw_text).
// Inspiré du seuil B09-T36 P9 (MIN_SCORE=15 sur lessons) mais adapté à un scoring
// plus simple — à ajuster après usage réel, jamais par défaut.
export function selectRelevant(pages, tokens, { limit = 30, minScore = 2 } = {}) {
  const scored = pages
    .map((p) => ({ page: p, score: scoreItem(p, tokens) }))
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored;
}

// Helper de présentation : extrait infos clés d'une page pour le LLM.
export function describePage(page) {
  return {
    id: page.id,
    title: getPropText(page, "title"),
    raw_text: getPropText(page, "raw_text"),
    source_dump_id: getPropText(page, "source_dump_id"),
    url: page.url,
  };
}
