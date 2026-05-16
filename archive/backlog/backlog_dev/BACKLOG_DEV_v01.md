# INSIDE OS — BACKLOG DEV

Derniere mise a jour : 2026-05-15 (B09-T36)
Version : v01
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

---

## INFRA

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Activer auto-recharge credits API Anthropic | B09-T30 | [DONE] |
| P2 | Migration Notion -> Supabase | B09-T29 | [ROADMAP] |
| P3 | pgvector pour recherche semantique agents V3 | B09-T29 | [ROADMAP] |
| P4 | Remplir donnees financieres entities INSIDE_OS_DATABASES via agent dedie | B09-T33 | [ROADMAP] |
| P5 | Sandbox Notion isolee pour tests pipeline — bloquee API deprecee, a reprendre apres migration Supabase | B09-T36 | [ROADMAP] |

---

## SYSTEME

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Verification automatique contenu B99 apres inject os-thread-close | B09-T31 | [TODO] |
| P2 | Synchronisation BACKLOG.md <-> Notion a chaque cloture thread B09 | B09-T32 | [TODO] |
| P3 | Corriger toute reference a injection_status=BLOCKED dans README/PROMPT | B09-T33 | [DONE] |
| P4 | Protocole de cloture canonique grave dans PROMPT v11 | B09-T33 | [DONE] |
| P5 | Upgrade Max 5x si sessions longues regulieres | B09-T30 | [ROADMAP] |
| P6 | Confronter docs/vision/ avec vision actuelle via LLM inside-os | B09-T34 | [TODO] |
| P7 | Script de verification integrite systeme (schema Notion, DS_IDs, fichiers critiques, pipeline executable) | B09-T34 | [TODO] |
| P8 | Script os:pre-thread — audit complet avant ouverture thread B09 | B09-T34 | [DONE] |
| P9 | Resoudre perte fin de thread — sequence de cloture complete capturant les echanges post-export | B09-T34 | [TODO] |
| P10 | Ameliorer os:pre-thread : audit alignement etendu — verifier BACKLOG_DEV.md, BACKLOG_USER.md, PROMPT_ASSOCIE_vXX.md, thread precedent inject_done en Notion, BACKLOG.md coherent comme index | B09-T36 | [TODO] |
| P11 | os:pre-thread archive l'ancien PRE_THREAD dans docs/pre-threads/ avant de generer le nouveau — un seul PRE_THREAD actif a la racine, historique complet dans docs/pre-threads/ | B09-T36 | [TODO] |

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
