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
- `npm run os:idea -- "texte"` — ajoute une idée horodatée `[RAW]` dans `IDEAS.md` (revue en fin de thread)

Agents — couche Action (lecture seule, aucune écriture Notion) :
- `npm run os:synthese -- --sujet "..."` — synthèse sourcée sur un sujet donné (croise DECISIONS/LESSONS/THREAD_DUMP)
- `npm run os:pilotage -- --sujet "..."` — copilote opérationnel, format ÉTAT/BLOCAGE/ACTION, priorité au présent (B99)
- `npm run os:ouverture` — brief du matin, sans sujet, liste de tâches classées par famille métier
- `npm run os:ingest-doc -- <fichier.pdf> --bucket B0X [--titre] [--source-url] [--yes]` — verse un PDF dans la mémoire (extraction factuelle via API Claude, confirmation interactive, dépôt dans `data/threads_to_process/`)
- `npm run os:statut -- <uid> <superseded|archived|rejected>` — seul point d'écriture pour ces statuts de curation sur DECISIONS

Audit Notion / dette :
- `npm run os:audit` — compteurs THREAD_DUMP / DECISIONS / LESSONS
- `npm run os:validate-schema` — vérifie le schéma Notion
- `npm run os:list-inject-errors` / `:list-inject-pending` / `:list-inject-error-details`
- `npm run os:reset-db` — destructif, demande confirmation
- `npm run os:docs-sync` — vérifie que les pointeurs de version dans CLAUDE.md (périmètre docs-sync, voir plus bas) correspondent aux fichiers vXX réellement présents sur disque ; alerte si divergence

Pilotage (chat mémoire) :
- `npm run os:chat` — `notion-memory-chat.mjs` (test, Claude haiku-4-5)
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
  agents/    → couche Action : synthese/ (+ socle sources.mjs partagé), pilotage/, ouverture/, ingest-doc/
  scripts/   → utilitaires (audit-system, idea, statut, validate-schema, docs-sync, etc.)
  lib/       → notion.mjs (queryDataSource), claude.mjs, config.mjs, guard.mjs, uid.mjs
  prompts/   → ingest-pass1-v02.md, ingest-pass2-v01.md (versionner avant modif)
data/
  threads_to_process/ → dépôt threads bruts (non versionné)
  thread_clean/       → nettoyés (non versionné)
  data_cemetery/      → archive permanente clean (non versionné)
  thread_summarized/  → JSON résumé/extract vérifié (non versionné)
  thread_chunked/     → chunks temporaires (purgés après inject)
  test_threads/       → 4 fichiers test fixes (versionné)
archive/   → protocoles/versions abandonnés (context, readme, pre-threads, scripts de
             clôture) + notes ponctuelles résolues — rien n'en ressort, jamais relu
             activement (voir périmètre docs-sync : rien de archive/ n'y entre)
```

Flux : `threads_to_process/` → CLEAN → `thread_clean/` → ARCHIVE → `data_cemetery/` → PASSE 1 (chunking adaptatif `CHUNK_SIZE`, défaut 20 000) → PASSE 2 (`VERIFY_PASS=always`) → `thread_summarized/` → INJECT NOTION.

Variables d'env requises (`.env`) : `NOTION_API_KEY`, `ANTHROPIC_API_KEY`, `THREAD_DUMP_DS_ID`, `DECISIONS_DS_ID` (= `3b054e65-6195-4bfe-8411-53bafe98b64b`), `LESSONS_DS_ID`, `ROOT_PAGE_ID`. **DS_ID = Data Source ID Notion** — ne jamais confondre avec database_id, ne jamais réinterpréter.

## Documents système (hiérarchie source-de-vérité)

| Fichier | Rôle | À lire pour |
|---------|------|-------------|
| `README.md` (racine) | Référence technique permanente | Architecture, pipeline, contrats, agents |
| `docs/prompts-transfert-thread/PROMPT_MAITRE_v<N>_TRANSFERT_DE_THREAD.md` | Règles de travail inter-thread | Protocoles, posture, doctrine anti-hallucination |
| `BACKLOG_DEV.md` / `BACKLOG_USER.md` | Sources de vérité backlog | `BACKLOG.md` n'est qu'un index |

Le protocole CONTEXT (instantané d'état local versionné) est **abandonné depuis B09-T42** — archivé dans `archive/context/`. L'état courant du système vit désormais dans Notion (page B99), alimentée par le pipeline mémoire standard — pas dans un fichier local.

Numéro indépendant : seul PROMPT_MAITRE reste versionné par nom de fichier (`vXX`) — README suit Git (plus de `vXX` dans le nom, sauf pour les prompts où la convention est conservée). Avant rename d'un fichier versionné : `git log -- fichier`, puis `cp` (jamais `mv`), commit des deux versions.

## Pièges connus

- **`injection_status=BLOCKED` n'existe pas** dans le schéma Notion. Valeurs réelles : `pending` / `done` / `error`.
- **`retry_count`** : max 2 retries auto sur `inject_error`. Au-delà (`retry_count >= 2`), thread exclu de la boucle, intervention manuelle requise.
- **B09 et `os:ingest` (résolu B09-T42)** : plus d'exclusion par défaut — `DEFAULT_SKIP_BUCKETS=[]`, un thread B09 passe par le pipeline standard comme tout autre bucket. Protection contre les collisions : garde d'idempotence (`assertNoExistingIdDump`) — `os:ingest` refuse fail-loud tout id_dump déjà présent dans THREAD_DUMP Notion, ne met plus jamais à jour silencieusement un thread déjà traité.
- `data_cemetery/` = archive permanente, n'en ressort jamais (sauf force majeure documentée).
- `test_threads/` ne doit jamais être injecté en production.
- `raw_text` Notion = résumé une ligne, ne pas lire pour extraction — toujours lire les blocs.
- Script production = `notion-memory-server.mjs` ; `notion-memory-chat.mjs` = test uniquement.
- **`archive/`** : convention unique d'archivage à la racine (pas de `docs/archive/` parallèle), sous-dossiers par famille (`context/`, `readme/`, `pre-threads/`, `scripts/`, `docs-notes/`). Rien de `archive/` n'entre dans le périmètre docs-sync.

## Doctrine — règles opérationnelles (à appliquer en codant)

Règle cardinale : **anti-hallucination système**. Aucun verdict positif par défaut. « aligné » / « DONE » / « OK » sont le résultat d'un check qui a tourné ET passé — jamais l'état de repos. Check non exécuté = INDÉTERMINÉ. (Détail complet : voir pointeur PROMPT_MAITRE ci-dessous.)

Comportements à tenir quand tu écris du code ou édites le repo :

- **Crash > silence.** Pas de fallback silencieux : throw / exit non-zéro / verdict INDÉTERMINÉ explicite. Une lecture qui échoue ne renvoie pas une valeur par défaut.
- **Toute affirmation d'état doit être traçable à une source vérifiée** (Notion live, git, FS lu à l'instant). Jamais un défaut hardcodé, un cache, un « dernier connu ».
- **[DONE] = preuve.** Un statut ne passe `[DONE]` que adossé à une preuve nommable (hash de commit, test qui passe). Jamais par souvenir.
- **Si un statut demandé contredit l'état réel du repo : ne pas forcer.** Garder le repo, signaler.
- **Montrer le code fautif AVANT de proposer un fix.** Rapporter ce qui a été vérifié ET ce qui ne l'a pas pu l'être.
- **Confrontation active.** Signaler les dérives : scope qui gonfle, dette qui s'accumule, hypothèse présentée comme acquise. Ne pas lisser.
- **Un point ouvert se tranche** (fait ou `[DROPPED]`) — ne se re-suspend pas indéfiniment.
- **Décision structurante = commit avant fin de thread.** Aucun `[À COMPLÉTER]` livré. Aucun acronyme inventé. `IDEAS.md` revu en clôture.
- **Granularité des commits = une photo propre du repo, toujours.** Autant de commits que nécessaire pour qu'un geste cohérent = un commit. Ne jamais noyer plusieurs gestes de nature différente (refactor structurel + mise à jour backlog + fix) sous une seule étiquette qui n'en décrit qu'un. Un message de commit ne doit jamais mentir sur ce que le commit contient. Règle permanente — ne plus demander, appliquer par défaut.
- **Séparation État (calculé) / Doctrine (versionnée).** Ne pas recopier de la doctrine dans des fichiers d'état (BACKLOG, Notion B99) — toujours pointer la source.
- **Modification d'un agent = mise à jour de son prompt dans le même commit.** Un agent (`os/agents/<nom>/`) et son prompt système (`docs/prompts/<nom>/PROMPT_..._v<N>.md`) évoluent ensemble — jamais un commit qui change le comportement de l'agent sans refléter le changement dans son prompt, ni l'inverse.
- **Périmètre docs-sync — vérification après commit.** Fichiers concernés : `CLAUDE.md`, `README.md`, `PROMPT_MAITRE` (dernière version), `BACKLOG_DEV.md`, `BACKLOG_USER.md`, `IDEAS.md`, la dernière version de chaque famille de prompts (SYNTHESE, PILOTAGE, OUVERTURE, INGEST_DOC, INFRA_TECH, ASSOCIE) + `SPEC_AGENT_SYNTHESE`. Rien de `archive/` n'entre dans ce périmètre, ni `recap-session.md` (canal de transfert de session, pas un document système — voir règle ci-dessous). Tout commit touchant un de ces fichiers relance `npm run os:docs-sync` (script si présent) — la résolution de « dernière version » se fait automatiquement par le numéro `vXX` le plus élevé de chaque famille.
- **Fin de session — deux gestes obligatoires, au même titre l'un que l'autre :** (1) tout commit ayant touché le périmètre docs-sync ci-dessus relance `npm run os:docs-sync` ; (2) **réécrire `recap-session.md` à la racine avec l'état final réel de la session** (écrasement, jamais d'historique — git le trace). Ni l'un ni l'autre n'est optionnel ou différable « si le temps manque » — ce sont les deux mécanismes qui remplacent le protocole CONTEXT abandonné (B09-T42) : `recap-session.md` est le canal de transfert vers l'architecte-conseil (pas un document système), `os:docs-sync` est ce qui garde la doctrine et son miroir Notion alignés sur le repo.

Architecture cible (à ne pas contredire) : but final = Mémoire → Pilotage → Action. Priorité actuelle = avancer le **Pilotage** puis l'**Action**, pas empiler de la mémoire. La migration pilotage GPT→Claude est FAITE (chat claude-haiku-4-5, server claude-sonnet-4-6) ; la couche Action a démarré (Synthèse/Pilotage/Ouverture/Ingestion Docs, B09-T41/T42). Supabase = source d'état unique cible (INFRA P2), après la couche Action — pas avant.

## Sources de vérité (ne pas dupliquer ici)

| Pour quoi | Va lire |
|-----------|---------|
| Doctrine complète (anti-hallucination détaillée, posture, protocoles canoniques) | `docs/prompts-transfert-thread/PROMPT_MAITRE_v<N>_TRANSFERT_DE_THREAD.md` (latest = v17) |
| Doctrine agents (L'Associé, niveaux de confirmation, « DB prime toujours », routing datasource, fiches de différenciation, outils réels invoqués) | `docs/prompts/associe/PROMPT_ASSOCIE_v<N>.md` (latest = v03) |
| État courant du système (chantiers actifs, décisions présentes) | Notion, page B99 — plus de fichier local (protocole CONTEXT abandonné, B09-T42) |
| Priorités, statuts, items ouverts (qui fait quoi, quoi est `[DONE]` / `[TODO]` / `[DROPPED]`) | `BACKLOG_DEV.md` + `BACKLOG_USER.md` |

Règle : si une règle ou un statut apparaît dans CLAUDE.md ET ailleurs, **la source ci-dessus prime**. CLAUDE.md ne stocke que ce qui change le comportement immédiat de Claude Code dans ce repo.
