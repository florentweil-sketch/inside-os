import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { queryDataSource, getPropText } from "../lib/notion.mjs";

// Lit le premier ID d'une propriete relation Notion.
// Retourne l'ID de page ou "" si absent.
function getRelationId(page, propName) {
  const prop = page.properties?.[propName];
  if (!prop || prop.type !== "relation") return "";
  return prop.relation?.[0]?.id || "";
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Plafond de lecture, configurable via .env (CHAT_FETCH_LIMIT). 0 ou absent = tout
// lire (aucune troncature). Avant fix : hardcodé à 80, une seule page Notion —
// tronquait silencieusement le corpus (7449 items DECISIONS+LESSONS au 2026-08-07)
// aux 160 items les plus récents, cause du "0 résultat" sur des questions légitimes
// type "état du projet" (B09-T41).
const FETCH_LIMIT = Number(process.env.CHAT_FETCH_LIMIT || 0);
const NOTION_PAGE_SIZE = 100; // max par requête Notion
const TOP_K = 6;
const LOG_DIR = "runtime/logs/chat";

function ensureLogDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join("-") +
    "_" +
    [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join("-")
  );
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Méta-mots : vocabulaire structurel d'INSIDE OS, présent dans 8 à 21 % du corpus
// DECISIONS+LESSONS (mesuré live sur 7449 items, 2026-08-07 : notion 21.4%,
// inside 21.0%, systeme 16.2%, pipeline 14.9%, inject 14.4%, extract 8.9%,
// memoire 8.1%, projet 7.7% — vs. un vrai token entité type "clemence" à 0.4%).
// Un match dessus ne discrimine rien : le corpus entier parle d'INSIDE OS, sa
// mémoire, son pipeline Notion extract/inject. Exclus du scoring ET du boost
// (voir phraseBoosts) — sinon toute question qui les emploie, ce qui est quasi
// systématique dans ce domaine, remonte des items hors-sujet par ce seul partage
// de vocabulaire générique. "os" est déjà filtré par le stopword grammatical
// ci-dessous (2 lettres, mot-outil).
const META_WORDS = new Set([
  "memoire", "inside", "notion", "pipeline", "inject", "extract", "systeme", "projet",
]);

function tokenize(value) {
  const stop = new Set([
    "le", "la", "les", "de", "des", "du", "un", "une", "et", "ou", "a", "à",
    "en", "dans", "sur", "pour", "par", "avec", "est", "sont", "que", "qui",
    "quoi", "ou", "où", "au", "aux", "ce", "cet", "cette", "ces", "il", "elle",
    "on", "nous", "vous", "ils", "elles", "je", "tu", "mon", "ton", "son",
    "ma", "ta", "sa", "mes", "tes", "ses", "nos", "vos", "leurs", "ne", "pas",
    "plus", "moins", "the", "and", "or", "of", "to", "in", "is", "are",
    "ou", "en", "os"
  ]);

  return Array.from(
    new Set(
      normalizeText(value)
        .split(" ")
        .map((x) => x.trim())
        .filter((x) => x.length >= 2 && !stop.has(x) && !META_WORDS.has(x))
    )
  );
}

// NB : "inside", "memoire", "notion", "pipeline", "extract", "inject" ne sont plus
// des déclencheurs ici — ce sont des META_WORDS, retirés de `tokens` en amont par
// tokenize(). Les garder aurait laissé des branches mortes (joined ne peut plus
// les contenir).
function phraseBoosts(tokens) {
  const joined = tokens.join(" ");
  const boosts = [];

  if (joined.includes("conversationnelle")) {
    boosts.push("conversationnelle");
  }
  if (joined.includes("v0") || joined.includes("v1") || joined.includes("beta")) {
    boosts.push("v0", "v1", "beta");
  }
  if (joined.includes("durcissement")) {
    boosts.push("durcissement");
  }

  return boosts;
}

function isPresentDump(sourceDumpId) {
  return String(sourceDumpId || "").toUpperCase().startsWith("B99-");
}

function isOldDump(sourceDumpId) {
  const id = String(sourceDumpId || "").toUpperCase();
  return id.startsWith("B01-") || id.startsWith("B02-");
}

function isStateDump(sourceDumpId) {
  const id = String(sourceDumpId || "").toUpperCase();
  return id.startsWith("B99-T05");
}

// Détecte si la question porte sur l'état actuel du système, pour prioriser les
// items "présent vivant" (B99, cf. isPresentDump/isStateDump). Opère sur les
// tokens déjà filtrés par tokenize() (comme phraseBoosts) — jamais sur le texte
// brut de la question. Avant fix : lisait le texte brut, donc un META_WORD comme
// "mémoire"/"pipeline" — présent dans quasi toute question sur INSIDE OS —
// déclenchait ce biais indépendamment du contenu réel. Bug constaté B09-T41 :
// "Que sait la mémoire sur Clémence Porret" faisait remonter des items B99 sans
// aucun rapport avec Clémence Porret, y compris en lecture complète (7449 items),
// pas seulement sur un pool restreint. "memoire"/"pipeline"/"extract"/"inject"
// sont retirés de la liste ci-dessous : ce sont des META_WORDS, absents de
// `tokens` par construction — les garder serait du code mort. Le check "inside
// os" (phrase brute à 2 mots) est abandonné pour la même raison : "inside" et
// "os" sont tous deux déjà neutralisés (META_WORD / stopword grammatical).
function questionTargetsCurrentSystem(tokens) {
  const set = new Set(tokens);
  return (
    set.has("conversationnelle") ||
    set.has("v0") ||
    set.has("v1") ||
    set.has("beta") ||
    set.has("durcissement") ||
    set.has("aujourd") ||
    set.has("etat")
  );
}

// Pagine une datasource Notion jusqu'à épuisement (has_more=false), ou jusqu'à
// `limit` pages si limit > 0. Pas de troncature silencieuse par défaut (limit=0
// = tout lire) — un plafond n'est appliqué que si explicitement demandé.
async function readAllPages(dataSourceId, { limit = 0, sorts } = {}) {
  const all = [];
  let cursor;

  while (true) {
    const payload = { page_size: NOTION_PAGE_SIZE };
    if (sorts) payload.sorts = sorts;
    if (cursor) payload.start_cursor = cursor;

    const res = await queryDataSource(dataSourceId, payload);
    if (!Array.isArray(res?.results)) {
      throw new Error(`Réponse Notion invalide pour ${dataSourceId} : ${JSON.stringify(res).slice(0, 200)}`);
    }
    all.push(...res.results);

    if (limit > 0 && all.length >= limit) return all.slice(0, limit);
    if (!res.has_more) break;
    cursor = res.next_cursor;
  }

  return all;
}

// Formate le statut + la date de création d'un item pour affichage uniforme,
// ex. "[validated | 2026-05-02]". Ni le statut ni la date ne sont lus par
// aucune logique de scoring — affichage seul (cf. formatStatusDate, consommé
// par buildMemoryContext/writeLog). "n/a" si absent (LESSONS n'a pas de
// decision_status — ce champ est spécifique à DECISIONS, cf. CLAUDE.md mapping
// json.status -> decision_status).
function formatStatusDate(status, createdTime) {
  const s = status || "n/a";
  const d = createdTime ? String(createdTime).slice(0, 10) : "date inconnue";
  return `[${s} | ${d}]`;
}

function mapDecisionPage(page) {
  return {
    type: "decision",
    uid: getPropText(page, "uid"),
    decision: getPropText(page, "decision"),
    rationale: getPropText(page, "rationale"),
    evidence: getPropText(page, "evidence"),
    status: getPropText(page, "decision_status"),
    createdTime: page.created_time || "",
    source_thread: getRelationId(page, "source_thread"),
    source_dump_id: getPropText(page, "source_dump_id"),
  };
}

function mapLessonPage(page) {
  return {
    type: "lesson",
    uid: getPropText(page, "uid"),
    lesson: getPropText(page, "lesson"),
    what_happened: getPropText(page, "what_happened"),
    evidence: getPropText(page, "evidence"),
    status: "", // LESSONS n'a pas de decision_status (spécifique à DECISIONS)
    createdTime: page.created_time || "",
    source_thread: getRelationId(page, "source_thread"),
    source_dump_id: getPropText(page, "source_dump_id"),
  };
}

async function getDecisions() {
  const pages = await readAllPages(process.env.DECISIONS_DS_ID, {
    limit: FETCH_LIMIT,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });
  return pages.map(mapDecisionPage);
}

async function getLessons() {
  const pages = await readAllPages(process.env.LESSONS_DS_ID, {
    limit: FETCH_LIMIT,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });
  return pages.map(mapLessonPage);
}

function scoreItem(item, tokens, boosts, question) {
  const primaryText =
    item.type === "decision"
      ? `${item.decision} ${item.rationale}`
      : `${item.lesson} ${item.what_happened}`;

  const secondaryText = `${item.evidence} ${item.source_thread} ${item.source_dump_id}`;
  const weakText = `${item.uid}`;

  const primary = normalizeText(primaryText);
  const secondary = normalizeText(secondaryText);
  const weak = normalizeText(weakText);
  const all = normalizeText(`${primaryText} ${secondaryText} ${weakText}`);

  let score = 0;
  const hits = [];

  for (const token of tokens) {
    if (primary.includes(token)) {
      score += 8;
      hits.push(token);
    } else if (secondary.includes(token)) {
      score += 4;
      hits.push(token);
    } else if (weak.includes(token)) {
      score += 1;
    } else if (all.includes(token)) {
      score += 2;
    }
  }

  for (const boost of boosts) {
    if (primary.includes(boost)) {
      score += 6;
      hits.push(`boost:${boost}`);
    } else if (secondary.includes(boost)) {
      score += 3;
      hits.push(`boost:${boost}`);
    }
  }

  if (item.type === "decision") score += 2;
  if (item.source_thread) score += 1;
  if (item.source_dump_id) score += 1;
  if (item.uid) score += 1;

  // BOOST PRÉSENT — gaté sur la pertinence de la question (questionTargetsCurrentSystem).
  // Avant fix : s'appliquait à TOUT item B99, pour N'IMPORTE QUELLE question, sans
  // aucune condition — un item B99-T05 valait +20+40=60 de base même pour une
  // question sans aucun rapport (ex. "Clémence Porret", 0 hit de contenu réel,
  // score 65 quand même). Bug constaté B09-T41.
  if (questionTargetsCurrentSystem(tokens) && isPresentDump(item.source_dump_id)) {
    score += 20;
    hits.push("present:B99");
  }

  // BOOST ÉTAT OPÉRATOIRE — même gate, même raison.
  if (questionTargetsCurrentSystem(tokens) && isStateDump(item.source_dump_id)) {
    score += 40;
    hits.push("state:boost");
  }

  // BOOST SUPPLÉMENTAIRE si la question porte sur l'état actuel du système
  if (questionTargetsCurrentSystem(tokens) && isPresentDump(item.source_dump_id)) {
    score += 12;
    hits.push("present:system");
  }

  // MALUS léger sur vieux historique si question système actuelle
  if (questionTargetsCurrentSystem(tokens) && isOldDump(item.source_dump_id)) {
    score -= 4;
    hits.push("old-history");
  }

  // P10 — désambiguïsation 'associe' humain vs agent IA
  const qNorm = normalizeText(question);
  const qHasAssocie = qNorm.includes('associe');
  const qHasAgent = qNorm.includes('agent') || qNorm.includes(' ia') || qNorm.includes('intelligence');
  const isHumanAssocieQuery = qHasAssocie && !qHasAgent;
  const itemIsAgentDecision = String(item.source_dump_id || '').toUpperCase().startsWith('B09-');
  const hitOnAssocie = hits.includes('associe');
  if (isHumanAssocieQuery && itemIsAgentDecision && hitOnAssocie) {
    score -= 20;
    hits.push('p10:agent-penalty');
  }

  return {
    ...item,
    _score: score,
    _hits: Array.from(new Set(hits)),
  };
}

const MIN_SCORE = 15;

// Score, trie et sélectionne le top-K. Factorisé pour être appelé identiquement
// sur la passe rapide et sur le fallback complet (main()).
function scoreAndSelect(items, tokens, boosts, question) {
  return items
    .map((item) => scoreItem(item, tokens, boosts, question))
    .sort((a, b) => b._score - a._score)
    .filter((i) => i._score >= MIN_SCORE)
    .slice(0, TOP_K);
}

function buildMemoryContext(items) {
  return items
    .map((item, index) => {
      const statusDate = formatStatusDate(item.status, item.createdTime);

      if (item.type === "decision") {
        return [
          `[MEMORY_ITEM_${index + 1}]`,
          `type: decision`,
          `score: ${item._score}`,
          `hits: ${(item._hits || []).join(", ")}`,
          `uid: ${item.uid || ""}`,
          `decision: ${statusDate} ${item.decision || ""}`,
          `rationale: ${item.rationale || ""}`,
          `evidence: ${item.evidence || ""}`,
          `source_thread: ${item.source_thread || ""}`,
          `source_dump_id: ${item.source_dump_id || ""}`,
        ].join("\n");
      }

      return [
        `[MEMORY_ITEM_${index + 1}]`,
        `type: lesson`,
        `score: ${item._score}`,
        `hits: ${(item._hits || []).join(", ")}`,
        `uid: ${item.uid || ""}`,
        `lesson: ${statusDate} ${item.lesson || ""}`,
        `what_happened: ${item.what_happened || ""}`,
        `evidence: ${item.evidence || ""}`,
        `source_thread: ${item.source_thread || ""}`,
        `source_dump_id: ${item.source_dump_id || ""}`,
      ].join("\n");
    })
    .join("\n\n");
}

function writeLog({ question, tokens, selectedItems, responseText, decisionsCount, lessonsCount, fetchMs }) {
  ensureLogDir();
  const filename = path.join(LOG_DIR, `${nowStamp()}_chat_test1.txt`);

  const content = [
    `QUESTION: ${question}`,
    ``,
    `TOKENS: ${tokens.join(", ")}`,
    ``,
    `COVERAGE: Decisions: ${decisionsCount} | Lessons: ${lessonsCount} | Temps lecture: ${fetchMs} ms`,
    ``,
    `SELECTED_ITEMS: ${selectedItems.length}`,
    ``,
    ...selectedItems.map((item, i) =>
      [
        `--- ITEM ${i + 1} ---`,
        `type: ${item.type}`,
        `score: ${item._score}`,
        `hits: ${(item._hits || []).join(", ")}`,
        `uid: ${item.uid || ""}`,
        item.type === "decision"
          ? `decision: ${formatStatusDate(item.status, item.createdTime)} ${item.decision || ""}`
          : `lesson: ${formatStatusDate(item.status, item.createdTime)} ${item.lesson || ""}`,
        `source_thread: ${item.source_thread || ""}`,
        `source_dump_id: ${item.source_dump_id || ""}`,
        ``,
      ].join("\n")
    ),
    `--- RESPONSE ---`,
    responseText,
    ``,
  ].join("\n");

  fs.writeFileSync(filename, content, "utf8");
  return filename;
}

async function main() {
  const question = process.argv.slice(2).join(" ") || "où en est INSIDE OS ?";
  const tokens = tokenize(question);
  const boosts = phraseBoosts(tokens);

  // Lecture complète, paginée (readAllPages), plafonnée uniquement si
  // CHAT_FETCH_LIMIT est explicitement fixé dans .env (0/absent = tout lire).
  // Option 3 (passe rapide bucket=B99 + fallback complet) a été essayée puis
  // abandonnée en cours de route : elle amplifiait le biais present/state de
  // scoreItem (isPresentDump/isStateDump) en construisant un pool candidat
  // presque exclusivement composé d'items B99 — ce biais est maintenant gaté
  // sur questionTargetsCurrentSystem(tokens) (cf. scoreItem), donc réévaluer
  // une passe rapide redevient possible plus tard, mais non refaite ici.
  const fetchStart = Date.now();
  const [decisions, lessons] = await Promise.all([getDecisions(), getLessons()]);
  const fetchMs = Date.now() - fetchStart;
  const selectedItems = scoreAndSelect([...decisions, ...lessons], tokens, boosts, question);
  const memoryContext = buildMemoryContext(selectedItems);

  const prompt = `
Tu es le copilote opérationnel d’INSIDE OS.

Règles NON négociables :
- Réponse MAX 5 lignes
- Zéro blabla
- Zéro répétition
- Tu vas droit au point
- Tu IMPOSSES une action claire, spécifique et immédiatement exécutable
- Tu n’utilises jamais des verbes vagues comme "vérifier", "confirmer", "prioriser"
- Tu donnes une action qui implique un passage à l’acte (ex: créer, décider, appeler, écrire)
- L’ACTION doit être spécifique, concrète et immédiatement exécutable (pas de formulation vague)

Structure OBLIGATOIRE :

ÉTAT :
→ 1 phrase claire sur la situation actuelle

PROBLÈME :
→ 1 phrase sur le blocage principal

ACTION :
→ 1 action immédiate, concrète, exécutable

Contraintes :
- Tu utilises UNIQUEMENT la mémoire fournie
- Tu n’inventes rien
- Si la mémoire est insuffisante, tu le dis en 1 phrase
- Tu privilégies toujours B99 (présent)

Lecture du statut et de la date (chaque item porte un tag [statut | date]) :
- "proposed" = une hypothèse évoquée dans le thread source, jamais actée. Ne la présente jamais comme une décision prise.
- "validated" = une formulation ferme dans le thread source — PAS une validation par Florent. Ne dis jamais "Florent a validé X" sur la seule foi de ce statut.
- Un item ancien (date lointaine) sans confirmation plus récente sur le même sujet se présente comme un historique à vérifier, jamais comme l'état courant.
- En cas de contradiction entre deux items sur un même sujet, l'item le plus récent (date) prime dans ta réponse, et tu signales la contradiction plutôt que de la lisser.

MEMORY_CONTEXT
${memoryContext || "[aucune mémoire pertinente]"}

QUESTION
${question}
`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  console.log("\n--- DEBUG ---\n");
  console.log(`Question: ${question}`);
  console.log(`Tokens: ${tokens.join(", ") || "[aucun]"}`);
  const coverageLabel = FETCH_LIMIT > 0 ? `plafonné à CHAT_FETCH_LIMIT=${FETCH_LIMIT}` : "lecture complète (aucun plafond)";
  console.log(`Decisions lues: ${decisions.length} | Lessons lues: ${lessons.length} | Total: ${decisions.length + lessons.length} (${coverageLabel})`);
  console.log(`Temps de lecture Notion : ${fetchMs} ms`);
  console.log(`Items sélectionnés: ${selectedItems.length}`);

  console.log("\n--- MEMORY ITEMS ---\n");
  console.log(memoryContext || "[aucune mémoire récupérée]");

  console.log("\n--- REPONSE ---\n");
  console.log(response.content[0].text);

  const logFile = writeLog({
    question,
    tokens,
    selectedItems,
    responseText: response.content[0].text,
    decisionsCount: decisions.length,
    lessonsCount: lessons.length,
    fetchMs,
  });

  console.log(`\n--- LOG ---\n${logFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
