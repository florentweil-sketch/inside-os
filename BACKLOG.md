# INSIDE OS — BACKLOG

Derniere mise a jour : 2026-05-09 (B09-T33)

Regle : ce fichier est mis a jour a chaque thread B09 via Claude Code.
Miroir Notion : page INSIDE-OS-BACKLOG (meme contenu, pilotage visuel).

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
| P8 | Boucle infinie auto-pagination sur thread bloque (retry_count >= 2) — exclure les threads retry_count >= 2 de la boucle | B09-T33 | [DONE] |

---

## INFRA / DONNEES

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Activer auto-recharge credits API Anthropic | B09-T30 | [DONE] |
| P2 | Migration Notion -> Supabase | B09-T29 | [ROADMAP] |
| P3 | pgvector pour recherche semantique agents V3 | B09-T29 | [ROADMAP] |
| P4 | Remplir donnees financieres entities INSIDE_OS_DATABASES (CA, charges, marges) via agent dedie | B09-T33 | [ROADMAP] |

---

## UI

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | UI utilisateur — interface memoire INSIDE OS (agents V3 / L'Associe) | B09-T32 | [ROADMAP] |
| P2 | UI dev — dashboard pipeline (statuts, logs, lancer ingest/inject) | B09-T32 | [ROADMAP] |

---

## SYSTEME

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Verification automatique contenu B99 apres inject os-thread-close | B09-T31 | [TODO] |
| P2 | Synchronisation BACKLOG.md <-> Notion a chaque cloture thread B09 | B09-T32 | [TODO] |
| P3 | Corriger toute reference a injection_status=BLOCKED dans README/PROMPT — statut inexistant dans Notion, remplacer par : thread bloque = injection_status=error + retry_count >= 2 | B09-T33 | [TODO] |
| P4 | Protocole de cloture canonique grave dans PROMPT v11 — ingest+inject thread avant close, validation LLM-assistee, commit avant --inject | B09-T33 | [DONE] |
| P5 | Upgrade Max 5x si sessions longues regulieres | B09-T30 | [ROADMAP] |

---

## LEGENDE

[TODO]    = priorite active
[ROADMAP] = decide, pas encore planifie
[DONE]    = implemente et valide
