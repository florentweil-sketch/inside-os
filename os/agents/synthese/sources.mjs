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

// Formate statut + date de création pour affichage, ex. "[validated | 2026-05-02]".
// Affichage seul — aucune logique de scoring/sélection ne s'appuie dessus.
// "n/a" si absent (lesson/thread_dump n'ont pas de decision_status).
export function formatStatusDate(status, createdTime) {
  const s = status || "n/a";
  const d = createdTime ? String(createdTime).slice(0, 10) : "date inconnue";
  return `[${s} | ${d}]`;
}

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

// Mapping champ titre/contenu par type d'item — le nom de propriété Notion qui
// porte le titre diffère par datasource (le champ title-type s'appelle
// "decision" sur DECISIONS, "lesson" sur LESSONS, "Name" sur THREAD_DUMP —
// AUCUNE des trois n'a de propriété littéralement nommée "title"). Vérifié live
// 2026-08-11. Bug corrigé : scoreItem/describePage lisaient
// getPropText(page,"title") et getPropText(page,"raw_text"), deux propriétés
// qui n'existent sur AUCUNE des trois datasources — le score était donc 0 pour
// tout item, sur toute question, systématiquement. L'Agent Synthèse n'a jamais
// pu remonter un seul résultat depuis sa mise en service (B09-T40).
// "raw_text" existe bien sur THREAD_DUMP mais est explicitement écarté (piège
// connu CLAUDE.md : résumé une ligne, ne pas lire pour le fond) — on lit
// summary_short/summary_full à la place.
const ITEM_FIELDS = {
  decision:    { title: "decision", content: ["rationale", "evidence"] },
  lesson:      { title: "lesson",   content: ["what_happened", "evidence"] },
  thread_dump: { title: "Name",     content: ["summary_short", "summary_full"] },
};

function fieldsFor(page) {
  return ITEM_FIELDS[page._itemType] || ITEM_FIELDS.decision;
}

function pageTitle(page) {
  return getPropText(page, fieldsFor(page).title);
}

function pageContent(page) {
  return fieldsFor(page).content.map((k) => getPropText(page, k)).join(" ");
}

// Score un item Notion contre un set de tokens (sujet de la synthèse).
// Pondération : titre compte double (signal fort), contenu simple.
// Seuil de pertinence remonté côté appelant.
export function scoreItem(page, tokens) {
  if (!tokens.length) return 0;
  const titleText = pageTitle(page).toLowerCase();
  const contentText = pageContent(page).toLowerCase();
  const titleNorm = titleText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const contentNorm = contentText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let score = 0;
  for (const t of tokens) {
    if (titleNorm.includes(t)) score += 2;
    if (contentNorm.includes(t)) score += 1;
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
// _itemType taggé à la lecture : seul moyen pour scoreItem/describePage de
// savoir quel champ Notion porte le titre/contenu réel (cf. ITEM_FIELDS).
export async function readDecisions() {
  const pages = await readAllPages(CFG.DECISIONS_DS_ID, "DECISIONS");
  return pages.map((p) => ({ ...p, _itemType: "decision" }));
}

// Source 2 : LESSONS_DS_ID
export async function readLessons() {
  const pages = await readAllPages(CFG.LESSONS_DS_ID, "LESSONS");
  return pages.map((p) => ({ ...p, _itemType: "lesson" }));
}

// Source 3 : THREAD_DUMP_DS_ID — on lit aussi pour permettre la mise en service
// (premier livrable : état technique réel => besoin de voir les threads).
export async function readThreadDump() {
  const pages = await readAllPages(CFG.THREAD_DUMP_DS_ID, "THREAD_DUMP");
  return pages.map((p) => ({ ...p, _itemType: "thread_dump" }));
}

// Sélectionne les N items les plus pertinents pour un sujet.
// MIN_SCORE = 2 (au moins un mot dans le titre, ou deux dans le contenu).
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
// `content_hint` (ex-`raw_text`, renommé pour ne plus laisser croire qu'il lit
// la propriété Notion "raw_text" — qui n'existe pas sur DECISIONS/LESSONS et
// est explicitement écartée sur THREAD_DUMP, cf. ITEM_FIELDS) : rationale +
// evidence pour une décision, what_happened + evidence pour une leçon,
// summary_short + summary_full pour un thread_dump.
// `status` : decision_status, spécifique à DECISIONS (proposed/validated/
// superseded/archived/draft/rejected) — "" pour lesson/thread_dump, qui n'ont
// pas ce champ (cf. CLAUDE.md mapping json.status -> decision_status).
// `createdTime` : page.created_time (champ Notion top-level, pas une
// propriété) — jamais de scoring dessus, affichage seul.
export function describePage(page) {
  return {
    id: page.id,
    title: pageTitle(page),
    content_hint: pageContent(page),
    status: page._itemType === "decision" ? getPropText(page, "decision_status") : "",
    createdTime: page.created_time || "",
    source_dump_id: getPropText(page, "source_dump_id"),
    url: page.url,
  };
}
