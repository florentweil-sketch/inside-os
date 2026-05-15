# INSIDE OS — BACKLOG

Derniere mise a jour : 2026-05-15 (B09-T35)
Version : v35
Versions docs actifs : README v11 | PROMPT v11 | CONTEXT v22

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
| P9 | Score de pertinence minimum sur lessons_learnings — rejeter automatiquement les resultats hors perimetre de la question (1 residue technique sur 4 resultats RH detecte en test qualite DB) | B09-T35 | [TODO] |
| P10 | Tag semantique "agent" sur entrees decisions_structural concernant L'Associe — distinguer au niveau donnees la collision lexicale "associe" (personne) vs "L'Associe" (agent IA) | B09-T35 | [TODO] |

---

## INFRA / DONNEES

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Activer auto-recharge credits API Anthropic | B09-T30 | [DONE] |
| P2 | Migration Notion -> Supabase | B09-T29 | [ROADMAP] |
| P3 | pgvector pour recherche semantique agents V3 | B09-T29 | [ROADMAP] |
| P4 | Remplir donnees financieres entities INSIDE_OS_DATABASES (CA, charges, marges) via agent dedie | B09-T33 | [ROADMAP] |
| P5 | Environnement Notion sandbox isole pour tests pipeline (workspace dedie + .env.test) | B09-T34 | [TODO] |

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
| P3 | Corriger toute reference a injection_status=BLOCKED dans README/PROMPT | B09-T33 | [DONE] |
| P4 | Protocole de cloture canonique grave dans PROMPT v11 | B09-T33 | [DONE] |
| P5 | Upgrade Max 5x si sessions longues regulieres | B09-T30 | [ROADMAP] |
| P6 | Confronter docs/vision/ (vision-v01.txt + NOTION VS DECISIONS.txt) avec vision actuelle via LLM inside-os | B09-T34 | [TODO] |
| P7 | Script de verification integrite systeme (schema Notion, DS_IDs, fichiers critiques, pipeline executable) | B09-T34 | [TODO] |
| P8 | Script os:pre-thread — audit complet avant ouverture thread B09 | B09-T34 | [DONE] |
| P9 | Resoudre perte fin de thread — les echanges post-export ne sont pas captures en memoire Notion. Identifier et valider une sequence de cloture complete. Bumper PROMPT v12 quand sequence validee | B09-T34 | [TODO] |
| P10 | Statut sources externes L'Associe — trancher injection dans INSIDE OS vs consultation ponctuelle | B09-T35 | [TODO] |

---

## AGENTS

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Cadrage L'Associe — PROMPT_ASSOCIE_v01.md produit et commite dans docs/prompts/ | B09-T35 | [DONE] |
| P2 | Agent Integration IA — conception, deploiement et orchestration des agents IA dans INSIDE OS. Bucket B09. Relations privilegiees : L'Associe (coherence prompts) + Agent Infrastructure & Tech (coherence technique). Gardien de la coherence du reseau d'agents | B09-T35 | [TODO] |
| P3 | Implementer sous-agents specialises F&A Capital (architecture V3) | B09-T35 | [ROADMAP] |
| P4 | Deep probing inter-agents | B09-T35 | [ROADMAP] |
| P5 | Memoire relationnelle ENTITIES — agent dedie | B09-T35 | [ROADMAP] |
| P6 | Agents personnels Florent (Developpement Personnel, Sante, Vie Privee, Patrimoine) | B09-T35 | [ROADMAP] |

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
