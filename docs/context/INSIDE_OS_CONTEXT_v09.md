# INSIDE_OS_CONTEXT_v09
Date : 2026-04-26

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / RENAME PROTOCOL DB_ID → DS_ID

**Statut : Stable**
**Version : v09**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Thread clôturé sur objectif atteint : refactoring complet de la nomenclature `DB_ID` → `DS_ID` dans tout le système. 4 threads traités (extract_done: 4, inject_done: 3, inject_error: 1). Aucun thread en attente. Pipeline stabilisé. Git initialisé et premier commit effectué. Le système est prêt pour l'ingestion complète des threads historiques.

---

## 1. Intention réelle du thread
[À COMPLÉTER PAR FLORENT]

---

## 2. Acquis réels (validés, utilisables, non spéculatifs)

**Refactoring nomenclature**
- Remplacement systématique de `DB_ID` par `DS_ID` dans tout le codebase (notion.mjs, extract, inject, ingest, chat, config, docs).
- `queryDatabaseCompat()` supprimée : fonction obsolète remplacée par `queryDatabase()` uniforme.
- Documentation mise à jour : Terminal 2.txt reflète la nouvelle nomenclature DS_ID (Decision System ID).

**Git**
- Repository initialisé : `.git/` créé avec `.gitignore` standard Node.js.
- Premier commit effectué : `9ed8567 refactor: rename DB_ID to DS_ID, remove queryDatabaseCompat`.
- Tous les fichiers de travail sous contrôle de version, data_cemetery et historical_threads_clean exclus.

**Pipeline**
- extract_done: 4, extract_error: 0 — extraction fonctionnelle sur threads test.
- inject_done: 3, inject_error: 1 — injection quasi complète, 1 erreur résiduelle à analyser.
- inject_pending: 0 — aucun thread en attente d'injection.

**État des données**
- DECISIONS : 96 entrées.
- LESSONS : 56 entrées.
- 4 threads test validés : B03-T03 (chunk long), B06-T07 (chunk court), B09-T23 (alignement), B99-T99 (no-chunk dense).

---

## 3. Hypothèses, intentions, paris
[À COMPLÉTER PAR FLORENT]

---

## 4. Contraintes actives à respecter

**Protocole B09**
- B09 exclu du pipeline automatique (ingest, extract, inject).
- CONTEXT vXX injecté manuellement en B99 pour traçabilité du méta-système.

**Nettoyage irréversible**
- `cleanText()` systématique à l'ingest : pas de retour possible sur texte brut si erreur après nettoyage.
- `historical_threads/` = dossier de test uniquement (4 fichiers max).
- `data_cemetery/` = archive permanente, jamais traité par le pipeline.

**Extraction**
- max_tokens tentative 1 = 4 000 (threads courts), 8 000 (chunks longs).
- Retry progressif : `[4000, 6000, 8000, 10000]` — prompt minimal dès tentative 2.
- Parser JSON robuste avec 3 stratégies en cascade obligatoires.

**Notion**
- Relations = `getRelationId()`, jamais `getPropText()`.
- `source_thread` obligatoire dans DECISIONS et LESSONS.
- `raw_text` remplacé par résumé LLM (20 mots max), fallback texte brut tronqué.

---

## 5. Architecture actuelle

**Modules stables**
- `lib/notion.mjs` : API Notion unifiée, nomenclature DS_ID, fonctions compat supprimées.
- `scripts/clean-threads.mjs` : nettoyage caractères spéciaux validé sur 82 threads.
- `scripts/ingest-threads.mjs` : ingest avec `cleanText()` + résumé LLM.
- `scripts/extract-decisions.mjs` : parser JSON robuste, retry progressif uniforme.
- `scripts/inject-decisions.mjs` : injection DECISIONS + LESSONS avec `source_thread`.
- `scripts/notion-memory-chat.mjs` : lecture mémoire Notion avec relations correctes.

**Databases Notion**
- `THREAD_DUMP_DS_ID` : threads historiques + métadonnées ingest.
- `DECISIONS_DS_ID` : décisions extraites avec `source_thread`.
- `LESSONS_DS_ID` : leçons extraites avec `source_thread`.

**Dossiers**
- `historical_threads/` : 4 threads test uniquement.
- `data_cemetery/` : archive complète, exclus du pipeline.
- `.git/` : contrôle de version actif.

---

## 6. Contradictions et incohérences détectées
[À COMPLÉTER PAR FLORENT]

---

## 7. Illusions à démonter
[À COMPLÉTER PAR FLORENT]

---

## 8. Risques structurants
[À COMPLÉTER PAR FLORENT]

---

## 9. Fichiers produits dans ce thread

**Modifiés**
- `docs/Terminal/Terminal 2.txt` : nomenclature DS_ID mise à jour.
- `package.json` : métadonnées projet (si modifié).

**Créés**
- `.git/` : repository Git initialisé.
- `.gitignore` : exclusions standard Node.js + data_cemetery + historical_threads_clean.

**Commit**
- `9ed8567` : refactor: rename DB_ID to DS_ID, remove queryDatabaseCompat.

---

## 10. Priorité réelle de redémarrage

**Analyser inject_error: 1**
- Identifier le thread qui a échoué en injection (via logs ou `output/inject_*.json`).
- Corriger la cause (format JSON, relation manquante, propriété Notion incorrecte).
- Relancer `node scripts/inject-decisions.mjs` sur ce thread spécifique.
- Critère de succès : inject_done: 4, inject_error: 0.

---

## 11. Discipline pour le prochain thread

**Décision obligatoire avant action :**
- Toute modification structurelle (nomenclature, API, format) = DECISION formelle en début de thread.
- Commit Git après chaque étape validée (pas de session sans trace).

**Validation par les faits :**
- Pas de "ça devrait marcher" — tester sur threads test avant généralisation.
- Thread court + thread long + no-chunk obligatoires avant ingestion complète.

**Protocole d'interruption :**
- À 50 échanges ou 3 sujets traités : proposer clôture + CONTEXT vXX.
- Jamais dépasser 70 échanges sans archivage.

**Git obligatoire :**
- Commit après chaque fonctionnalité validée.
- Message format : `type: description courte` (feat, fix, refactor, docs).

---

## Point de redémarrage minimal

Refactoring DB_ID → DS_ID terminé, Git actif, pipeline stable. 4 threads extraits, 3 injectés, 1 erreur résiduelle à corriger. Aucun thread en attente. Système prêt pour ingestion complète après correction de l'inject_error restant. Prochain thread : débugger inject_error: 1, puis lancer ingest sur data_cemetery complet.