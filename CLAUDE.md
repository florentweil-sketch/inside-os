# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

INSIDE OS — système d'exploitation stratégique de F&A CAPITAL. Pipeline Node (ESM) qui transforme des threads de conversation en mémoire décisionnelle Notion (DECISIONS + LESSONS), puis active cette mémoire via des agents IA. Trois niveaux : Mémoire → Pilotage → Action.

## Commandes principales (toutes via npm scripts)

Pipeline mémoire :
- `npm run os:ingest` — clean + chunking + passe 1 LLM (résumé + extraction) + passe 2 vérification → `data/thread_summarized/`
- `npm run os:inject` — lit `thread_summarized/`, crée/update pages Notion DECISIONS + LESSONS
- `npm run os:pipeline` — chaîne ingest + inject
- `npm run os:extract` — extraction seule (sans inject)
- `npm run os:repair-extraction` — répare un JSON d'extraction cassé

Clôture & audit de thread B09 (dev INSIDE OS) :
- `npm run os:pre-thread` — audit pré-thread : versions docs, snapshot Notion live, détection divergence 3 axes (CONTEXT freshness / Notion counters / CONTEXT↔Notion), génère `PRE_THREAD_<thread>.md`
- `npm run os:close -- --thread-name "B09-TXX-Sujet"` — draft de clôture (CONTEXT, audit, rapport)
- `npm run os:close -- --inject --thread-name "B09-TXX-Sujet"` — clôture définitive + injection B99 + capture échanges post-export
- `npm run os:idea -- "texte"` — ajoute une idée horodatée [RAW] dans `IDEAS.md` (revue en fin de thread)

Audit Notion / dette :
- `npm run os:audit` — compteurs THREAD_DUMP / DECISIONS / LESSONS
- `npm run os:validate-schema` — vérifie le schéma Notion
- `npm run os:list-inject-errors` / `:list-inject-pending` / `:list-inject-error-details`
- `npm run os:reset-db` — destructif, demande confirmation

Pilotage (chat mémoire) :
- `npm run os:chat` — `notion-memory-chat.mjs` (test, modèle tiers — migration Claude prévue, BACKLOG_USER P9)
- `npm run os:server` — `notion-memory-server.mjs` (HTTP, production)

## Architecture

```
os/
  ingest/    → clean + chunking + passe 1 (résumé/extract) + passe 2 (vérif)
  extract/   → extraction seule
  inject/    → écriture Notion DECISIONS + LESSONS
  repair/    → réparation JSON d'extraction
  chat/      → pilotage (chat + serveur HTTP)
  audit/     → introspection Notion (DBs, schémas, pages)
  scripts/   → utilitaires (audit-system, pre-thread, idea, validate-schema, etc.)
  lib/       → notion.mjs (queryDataSource), claude.mjs, config.mjs, uid.mjs
  prompts/   → ingest-pass1-v02.md, ingest-pass2-v01.md (versionner avant modif)
os-thread-close.mjs   → script clôture (racine, hors os/)
data/
  threads_to_process/ → dépôt threads bruts (non versionné)
  thread_clean/       → nettoyés (non versionné)
  data_cemetery/      → archive permanente clean (non versionné)
  thread_summarized/  → JSON résumé/extract vérifié (non versionné)
  thread_chunked/     → chunks temporaires (purgés après inject)
  test_threads/       → 4 fichiers test fixes (versionné)
```

Flux : `threads_to_process/` → CLEAN → `thread_clean/` → ARCHIVE → `data_cemetery/` → PASSE 1 (chunking adaptatif `CHUNK_SIZE`, défaut 20 000) → PASSE 2 (`VERIFY_PASS=always`) → `thread_summarized/` → INJECT NOTION.

Variables d'env requises (`.env`) : `NOTION_API_KEY`, `ANTHROPIC_API_KEY`, `THREAD_DUMP_DS_ID`, `DECISIONS_DS_ID` (= `3b054e65-6195-4bfe-8411-53bafe98b64b`), `LESSONS_DS_ID`, `ROOT_PAGE_ID`. **DS_ID = Data Source ID Notion** — ne jamais confondre avec database_id, ne jamais réinterpréter.

## Documents système (hiérarchie source-de-vérité)

| Fichier | Rôle | À lire pour |
|---------|------|-------------|
| `docs/readme/README_INSIDE_OS_v<N>.md` | Référence technique permanente | Architecture, pipeline, contrats |
| `docs/prompts transfert thread/PROMPT_MAITRE_v<N>_TRANSFERT_DE_THREAD.md` | Règles de travail inter-thread | Protocoles, posture, séquences canoniques |
| `docs/context/INSIDE_OS_CONTEXT_v<N>.md` | Instantané vivant du système | État courant, problèmes actifs |
| `BACKLOG_DEV.md` / `BACKLOG_USER.md` | Sources de vérité backlog | `BACKLOG.md` n'est qu'un index |

Numéros indépendants : README v12 + PROMPT v15 + CONTEXT v30 = valide. Ne jamais bumper par symétrie. Avant rename : `git log -- fichier`, puis `cp` (jamais `mv`), commit des deux versions.

## Pièges connus

- **`injection_status=BLOCKED` n'existe pas** dans le schéma Notion. Valeurs réelles : `pending` / `done` / `error`.
- **`retry_count`** : max 2 retries auto sur `inject_error`. Au-delà (`retry_count >= 2`), thread exclu de la boucle, intervention manuelle requise.
- **B09 (dev INSIDE OS) exclu du pipeline automatique** — un thread B09 ne passe pas par `os:ingest/os:inject`. Sa mémoire est le `CONTEXT v<N>` injecté en page B99 via `os:close --inject`.
- `data_cemetery/` = archive permanente, n'en ressort jamais (sauf force majeure documentée).
- `test_threads/` ne doit jamais être injecté en production.
- `raw_text` Notion = résumé une ligne, ne pas lire pour extraction — toujours lire les blocs.
- Script production = `notion-memory-server.mjs` ; `notion-memory-chat.mjs` = test uniquement.

## Doctrine — règles opérationnelles (à appliquer en codant)

Règle cardinale : **anti-hallucination système**. Aucun verdict positif par défaut. « aligné » / « DONE » / « OK » sont le résultat d'un check qui a tourné ET passé — jamais l'état de repos. Check non exécuté = INDÉTERMINÉ. (Détail complet : voir pointeur PROMPT_MAITRE v15 ci-dessous.)

Comportements à tenir quand tu écris du code ou édites le repo :

- **Crash > silence.** Pas de fallback silencieux : throw / exit non-zéro / verdict INDÉTERMINÉ explicite. Une lecture qui échoue ne renvoie pas une valeur par défaut.
- **Toute affirmation d'état doit être traçable à une source vérifiée** (Notion live, git, FS lu à l'instant). Jamais un défaut hardcodé, un cache, un « dernier connu ».
- **[DONE] = preuve.** Un statut ne passe `[DONE]` que adossé à une preuve nommable (hash de commit, test qui passe). Jamais par souvenir.
- **Si un statut demandé contredit l'état réel du repo : ne pas forcer.** Garder le repo, signaler.
- **Montrer le code fautif AVANT de proposer un fix.** Rapporter ce qui a été vérifié ET ce qui ne l'a pas pu l'être.
- **Confrontation active.** Signaler les dérives : scope qui gonfle, dette qui s'accumule, hypothèse présentée comme acquise. Ne pas lisser.
- **Un point ouvert se tranche** (fait ou `[DROPPED]`) — ne se re-suspend pas indéfiniment.
- **Points ouverts du CONTEXT traités avant l'objectif principal du thread**, sauf décision explicite contraire documentée.
- **Décision structurante = commit avant fin de thread.** Aucun `[À COMPLÉTER]` livré. Aucun acronyme inventé. `IDEAS.md` revu en clôture.
- **Séparation État (calculé) / Doctrine (versionnée).** Ne pas recopier de la doctrine dans des fichiers d'état (CONTEXT, PRE_THREAD, BACKLOG) — toujours pointer la source.

Architecture cible (à ne pas contredire) : but final = Mémoire → Pilotage → Action. Priorité actuelle = avancer le **Pilotage** (migrer `notion-memory-chat.mjs` de GPT-4.1-mini vers Claude — BACKLOG_USER AGENTS P9), pas empiler de la mémoire. Supabase = source d'état unique cible (INFRA P2), APRÈS migration pilotage — pas avant.

## Sources de vérité (ne pas dupliquer ici)

| Pour quoi | Va lire |
|-----------|---------|
| Doctrine complète (anti-hallucination détaillée, posture, protocoles canoniques, séquence de clôture) | `docs/prompts transfert thread/PROMPT_MAITRE_v<N>_TRANSFERT_DE_THREAD.md` (latest = v15) |
| Doctrine agents (L'Associé, niveaux de confirmation, « DB prime toujours », routing datasource, fiches de différenciation) | `docs/prompts/associe/PROMPT_ASSOCIE_v<N>.md` (latest = v02) |
| État courant du système (acquis, problèmes actifs, dernier thread traité) | `docs/context/INSIDE_OS_CONTEXT_v<N>.md` (latest = v30) |
| Priorités, statuts, items ouverts (qui fait quoi, quoi est `[DONE]` / `[TODO]` / `[DROPPED]`) | `BACKLOG_DEV.md` + `BACKLOG_USER.md` |
| Pré-thread (PRE_THREAD généré par `os:pre-thread`) | racine du repo, archivés dans `docs/pre-threads/` |

Règle : si une règle ou un statut apparaît dans CLAUDE.md ET ailleurs, **la source ci-dessus prime**. CLAUDE.md ne stocke que ce qui change le comportement immédiat de Claude Code dans ce repo.
