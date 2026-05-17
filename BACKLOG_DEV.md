# INSIDE OS — BACKLOG DEV

Derniere mise a jour : 2026-05-17 (B09-T38)
Version : v04
Pilote : Agent Infrastructure & Tech (B08/B09)

Regle : ce fichier est mis a jour a chaque thread B09-Dev via Claude Code.
Miroir Notion : page INSIDE-OS-BACKLOG-DEV (a creer).

---

## PIPELINE

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | CLAUDE_MODEL dans .env (pas hardcode) | B09-T30 | [DONE] |
| P2 | Retry Notion 502/503/504 automatique (3x backoff) | B09-T30 | [DONE] |
| P3 | Retry LLM 529/500 automatique (3x backoff) | B09-T30 | [DONE] |
| P4 | Inject auto-pagination (boucle jusqu'a 0 candidats) | B09-T30 | [DONE] |
| P5 | Checkpoint par chunk (sauvegarde partielle + reprise) | B09-T30 | [DONE] |
| P6 | Fix data_cemetery/ — brut jamais archive, seulement le clean sous nom complet | B09-T32 | [DONE] |
| P7 | Audit + nettoyage doublons existants dans data_cemetery/ | B09-T32 | [DONE] |
| P8 | Boucle infinie auto-pagination sur thread bloque — exclure les threads retry_count >= 2 de la boucle | B09-T33 | [DONE] |
| P9 | Tokenizer diacritiques + MIN_SCORE=15 pertinence lessons_learnings | B09-T36 | [DONE] |
| P10 | Desambiguisation tag semantique "associe" humain vs agent IA dans scoring | B09-T36 | [DONE] |
| P11 | Purge automatique threads_to_process/ apres inject reussi | B09-T34 | [TODO] |
| P12 | Verifier que VERIFY_PASS=always est la config par defaut dans .env.example et documenter explicitement — Passe 1 + Passe 2 deja en place | B09-T37 | [DONE] |

---

## INFRA

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Activer auto-recharge credits API Anthropic | B09-T30 | [DONE] |
| P2 | Migration Notion -> Supabase | B09-T29 | [ROADMAP] |
| P3 | pgvector pour recherche semantique agents V3 | B09-T29 | [ROADMAP] |
| P4 | Remplir donnees financieres entities INSIDE_OS_DATABASES via agent dedie | B09-T33 | [ROADMAP] |
| P5 | Sandbox Notion isolee pour tests pipeline — bloquee API deprecee, a reprendre apres migration Supabase | B09-T36 | [ROADMAP] |
| P6 | Backup automatique regulier INSIDE OS — export Notion + repo + .env chiffre + data_cemetery/ + thread_summarized/ | B09-T37 | [TODO] |
| P7 | Audit securite complet — verifier .gitignore (.env, .env.test, dossiers data), chiffrement .env au repos, audit historique git (pas de secrets exposes), restreindre perimetre integrations API Notion, anticiper auth admin/user/dev pour interfaces UI | B09-T37 | [TODO] |
| P8 | Anticiper pivot Supabase avant lancement ingestion massive documents — Notion devient goulot si volume explose. A integrer dans planification INFRA P2 | B09-T37 | [TODO] |

---

## SYSTEME

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Verification automatique contenu B99 apres inject os-thread-close | B09-T31 | [TODO] |
| P2 | Synchronisation BACKLOG DEV+USER -> Notion a chaque cloture thread B09 — mecanisme decide : Option A push one-way (fichiers .md = source de verite, Notion = miroir lecture seule). A integrer en phase 4 de la sequence canonique os-thread-close.mjs | B09-T32 | [TODO] |
| P3 | Corriger toute reference a injection_status=BLOCKED dans README/PROMPT | B09-T33 | [DONE] |
| P4 | Protocole de cloture canonique grave dans PROMPT v11 | B09-T33 | [DONE] |
| P5 | Upgrade Max 5x si sessions longues regulieres | B09-T30 | [ROADMAP] |
| P6 | Confronter docs/vision/ avec vision actuelle via LLM inside-os | B09-T34 | [TODO] |
| P7 | Script de verification integrite systeme — schema Notion, DS_IDs, fichiers critiques, pipeline executable, .gitignore, etat dossiers non versionnés | B09-T34 | [TODO] |
| P8 | Script os:pre-thread — audit complet avant ouverture thread B09 | B09-T34 | [DONE] |
| P9 | [PARTIEL B09-T39] Capture interactive echanges post-export (phase 10 os:close --inject) — appende au rapport de cloture. Manque : passage a Claude pour mise a jour CONTEXT (voir P9b) | B09-T34 | [TODO] |
| P9b | Passer les echanges post-export captures (P9) a Claude pour regenerer les sections Acquis reels + Fichiers produits du CONTEXT, puis re-injecter en B99. Prerequis : P9 partiel implémenté (B09-T39) | B09-T39 | [TODO] |
| P10 | Ameliorer os:pre-thread : audit alignement etendu — verifier BACKLOG_DEV.md, BACKLOG_USER.md, PROMPT_ASSOCIE_vXX.md, thread precedent inject_done en Notion, BACKLOG.md coherent comme index | B09-T36 | [DONE] |
| P11 | os:pre-thread archive l'ancien PRE_THREAD dans docs/pre-threads/ avant de generer le nouveau — un seul PRE_THREAD actif a la racine, historique complet dans docs/pre-threads/ | B09-T36 | [DONE] |
| P12 | Script alignement post-cloture — verifier coherence README / CONTEXT / PROMPT / PROMPT_ASSOCIE / BACKLOG_DEV / BACKLOG_USER apres chaque ingest+inject definitif | B09-T37 | [TODO] |
| P13 | Script tri repo — classement automatique deterministe des fichiers repo dans les bons dossiers cibles (complement de l'agent classifieur documents metier) | B09-T37 | [TODO] |
| P14 | Politique archivage et versionnage fichiers critiques — automatiser pour : PROMPT_MAITRE, README, CONTEXT, PROMPT_ASSOCIE, BACKLOG_DEV, BACKLOG_USER, PRE_THREAD, ingest-pass1-vXX, ingest-pass2-vXX, .env.example. Regle grave dans PROMPT MAITRE v13, implementation via script | B09-T36 | [TODO] |
| P15 | IDEAS.md + commande os:idea — pense-bete inter-thread : ajouter une idee horodatee en [RAW], revue en fin de thread (BACKLOG / DROPPED / KEEP) | B09-T36 | [TODO] |
| P16 | Sous-pipeline LLM traitement 200 threads bruts — tri importance strategique, classification bucket, synthese, selection ingest/inject. NON PRIORITAIRE — enrichissement DB pour L Associe avant integration, pas avant migration Supabase | B09-T37 | [TODO] |
| P17 | os:pre-thread — générer le PRE_THREAD avec le nom du thread SUIVANT (+1) et non du thread courant. Accepte déjà --next en argument mais doit incrémenter automatiquement sans argument | B09-T39 | [DONE] |
| P18 | Infrastructure idle agent — scheduler, sandbox/, budget tokens, rapport session, file sujets idle | B09-T38 | [ROADMAP] |
| P19 | os:pre-thread — diff automatique CONTEXT vXX vs snapshot Notion live au démarrage de chaque thread : comparer inject_done, DECISIONS, LESSONS, derniers commits connus. Toute divergence signalée clairement avant ouverture. Remplace la purge manuelle P11 comme solution architecturale à la boucle thread | B09-T38 | [TODO] |

---

## UI DEV

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Dashboard pipeline (statuts, logs, lancer ingest/inject) | B09-T32 | [ROADMAP] |

---

## REPO

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Audit repo — suppression fichiers orphelins et dossiers inutiles | B09-T34 | [DONE] |

---

## LEGENDE

[TODO]    = priorite active
[ROADMAP] = decide, pas encore planifie
[DONE]    = implemente et valide
