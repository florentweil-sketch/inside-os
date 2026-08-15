# PRE_THREAD — B09-T35-Dev
Date : 2026-05-10
Généré par : npm run os:pre-thread

---

## VERSIONS ACTIVES

| Document | Version | Emplacement |
|----------|---------|-------------|
| README   | v11  | docs/readme/ |
| PROMPT   | v11  | docs/prompts transfert thread/ |
| CONTEXT  | v22 | docs/context/ |
| BACKLOG  | v34 | BACKLOG.md |

---

## SNAPSHOT NOTION LIVE

- inject_done    : 93
- inject_pending : 0
- inject_error   : 0
- total          : 93

---

## DERNIER THREAD B09 TRAITÉ

- Nom    : B09-T34-Notion-Dev-022
- Date   : 2026-05-10
- Statut : done

---

## DIVERGENCES DÉTECTÉES

✅ Aucune divergence détectée — système aligné

---

## CONTEXT ACTIF (v22)

# INSIDE_OS_CONTEXT_v22
Date : 2026-05-10

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T34-Notion-Dev-022

**Statut : Stable — thread productif, clôture propre**
**Version : v22**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

**Source du STOP :** Décision humaine — clôture B09-T34 après accomplissement des objectifs du thread.

**Ce thread couvre :**
- Audit d'alignement complet avant ouverture B09-T34
- Point 1 : suppression CONTEXT v22 auto-commité (inexact) — git rm + commit ✅
- Point 2 : retry_count confirmé présent dans schéma Notion thread_dump (type: number) — fix P8 opérationnel ✅
- Point 3 : audit repo complet — 103 fichiers orphelins supprimés (archive/, runtime/out/, scripts racine) ✅
- Point 4 : README v10 → v11 — 2 occurrences BLOCKED corrigées, commité et pushé ✅
- Point 5 : pages Notion STRUCTURE & ENTITÉS + @3 avril supprimées (fait par Florent) ✅
- Point 6 : miroir Notion BACKLOG mis à jour (B09-T33 → B09-T34) ✅
- BACKLOG v34 produit : version explicite ajoutée, section REPO créée, items P7/P8 SYSTEME ajoutés ✅
- Script os:pre-thread implémenté et testé — produit PRE_THREAD_B09-TXX.md en une commande ✅
- Décision structurelle : deux chemins distincts INSIDE OS DEV et INSIDE OS USER
- Décision structurelle : priorité DEV → beta USER le plus vite possible
- Décision structurelle : BACKLOG_DEV.md et BACKLOG_USER.md à créer (prochains threads)
- Décision structurelle : nomenclature B09-TXX-Dev-Sujet / B09-TXX-User-Sujet
- Item BACKLOG : purge automatique threads_to_process/ après inject réussi
- Fichiers docs/ commités : PIPELINE_BUG.md, PIPELINE_TESTING.md, REGLES docs système, VISION V01

**Dérive empêchée :** Restructurer le BACKLOG DEV/USER dans ce thread — gravé au BACKLOG pour un thread dédié.

---

## 1. Intention réelle du thread

**Objectif réel :** Liquider les dettes héritées de B09-T33 + audit repo + README v11 + script os:pre-thread.

**Problèmes résolus :**
- CONTEXT v22 auto (inexact) supprimé du repo
- retry_count confirmé dans schéma Notion — fix P8 validé opérationnel
- Audit repo : 103 fichiers orphelins supprimés, repo propre
- README v11 commité — zéro occurrence de BLOCKED dans le repo
- BACKLOG v34 finalisé avec version explicite + section REPO + items P7/P8
- Script os:pre-thread opérationnel — remplace les 4 uploads manuels
- Décisions structurelles DEV/USER gravées

**Dérive empêchée :** Restructurer BACKLOG DEV/USER mid-thread — repoussé proprement.

---

## 2. Acquis réels

**Fix P8 validé :**
- retry_count présent dans le schéma Notion thread_dump (type: number) ✅
- Le filtre `retry_count is_empty OR retry_count < 2` dans getCandidates() s'applique sur un champ réel
- Fix P8 commit 06216f0 est fonctionnellement opérationnel

**README v11 commité :**
- Ligne 107 : BLOCKED → `thread exclu de la boucle auto-pagination au-delà (retry_count >= 2), intervention manuelle requise`
- Ligne 427 : BLOCKED → `thread exclu de la boucle auto-pagination au-delà (retry_count >= 2), intervention manuelle requise`
- Header : v10 → v11
- Commit b0336d8 — pushé ✅
- Zéro occurrence de BLOCKED dans le repo ✅

**Audit repo :**
- 103 fichiers supprimés : archive/ (hors zips), runtime/out/, scripts racine orphelins — commit e1e3a2c
- prepare-beta.mjs supprimé — commit b8ced5e
- docs/archive/ supprimé
- docs/vision/ : 2 fichiers conservés intentionnellement (vision-v01.txt + NOTION VS DECISIONS.txt)
- PIPELINE_BUG.md, PIPELINE_TESTING.md, REGLES docs système, VISION V01 commités — commit 607d94b

**Script os:pre-thread :**
- Implémenté dans os/scripts/pre-thread.mjs
- Ajouté dans package.json : `npm run os:pre-thread`
- Testé avec succès : README v11 | PROMPT v11 | CONTEXT v21 | BACKLOG v34 détectés
- Snapshot Notion live opérationnel via queryDataSource
- Produit PRE_THREAD_B09-TXX.md à la racine du repo
- Commit 2b25006 — pushé ✅

**BACKLOG v34 :**
- Version explicite ajoutée (Version : v34)
- Header : versions docs actifs README v11 | PROMPT v11 | CONTEXT v21
- Section REPO ajoutée
- SYSTEME P3 [DONE] (BLOCKED corrigé), P6 (docs/vision), P7 (intégrité système), P8 (os:pre-thread)
- INFRA P5 (Notion sandbox)
- Miroir Notion mis à jour ✅

**Décisions structurelles gravées :**
- Deux chemins : INSIDE OS DEV (produit scalable) / INSIDE OS USER (F&A Capital)
- Priorité : DEV → beta USER le plus vite possible
- Deux BACKLOG séparés : BACKLOG_DEV.md / BACKLOG_USER.md (à créer dans prochain thread dédié)
- Nomenclature threads : B09-TXX-Dev-Sujet / B09-TXX-User-Sujet
- Notion sandbox : Option A — workspace dédié INSIDE-OS-TEST + .env.test

**État pipeline à la clôture :**
- 93 threads | extract_done: 93 | inject_done: 93 | inject_pending: 0 | inject_error: 0
- 3 588 décisions | 3 073 lessons

---

## 3. Hypothèses, intentions, paris

- fix P8 jamais testé sur un thread réel avec retry_count >= 2 — aucun cas disponible actuellement
- Entités E01-E04 : architecture en place, données financières vides — agent dédié non encore implémenté
- BACKLOG_DEV.md / BACKLOG_USER.md : décision prise, structure non encore créée
- Script os:pre-thread V2 : interrogation mémoire Notion via LLM inside-os — non implémenté, roadmap

---

## 4. Contraintes actives à respecter

**Techniques :**
- DS_ID decisions_structural = 3b054e65-6195-4bfe-8411-53bafe98b64b
- DS_ID lessons_learnings = 0137b375-fe52-48fa-affc-d7885f2412cb
- DS_ID thread_dump = 3155e503-b0ac-819f-9a69-000b1c28aaf9
- CHUNK_SIZE=20000, CHUNK_OVERLAP=500
- CLAUDE_MODEL=claude-sonnet-4-6 (dans .env)
- INGEST_PROMPT_PASS1=ingest-pass1-v02
- B09 exclu pipeline automatique — override --skip-buckets ""
- Notion MCP destructif = confirmation explicite requise
- thread_summarized/ = archive permanente — ne jamais supprimer
- data_cemetery/ = gitignored, archive permanente
- B99 THREAD_DUMP = mémoire vivante — intouchable
- notion-memory-chat.mjs = claude-haiku-4-5-20251001 intentionnel
- injection_status BLOCKED n'existe pas dans Notion — threads bloqués = error + retry_count >= 2
- test_threads/ = ne jamais injecter en production thread_dump

**Protocoles :**
- Clôture thread B09 : séquence canonique 4 phases (PROMPT v11)
- os:pre-thread avant ouverture de chaque thread B09
- Purge manuelle threads_to_process/ après inject (automatisation au BACKLOG)
- BACKLOG = toute amélioration identifiée → BACKLOG.md + Notion miroir
- Toujours commiter avant --inject

**Versionning actif :**
- README : v11 | PROMPT : v11 | CONTEXT : v22
- Prompts LLM actifs : ingest-pass1-v02 + ingest-pass2-v01

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement :**
- Pipeline V2 complet + P1-P8 tous [DONE]
- os:pre-thread opérationnel — audit pré-thread automatisé en une commande
- README v11 — zéro référence BLOCKED dans le repo
- 93 threads inject_done, 0 pending
- Repo propre — audit complet effectué, 103 fichiers orphelins supprimés
- BACKLOG v34 avec version explicite

**Ce qui reste fragile :**
- Purge threads_to_process/ manuelle — risque de retraitement inutile (vécu ce thread)
- Synchronisation BACKLOG.md ↔ Notion manuelle
- fix P8 jamais testé en conditions réelles
- BACKLOG_DEV / BACKLOG_USER non encore créés
- Fin de thread non capturée en mémoire Notion : les échanges post-export (commits finaux, --inject, décisions terminales) ne sont pas injectés — problème identifié, solution non validée, à traiter en B09-T35

**Ce qui manque :**
- Création BACKLOG_DEV.md + BACKLOG_USER.md (thread dédié)
- Notion sandbox workspace (INFRA P5)
- Script intégrité système (SYSTEME P7)
- Cadrage L'Associé (USER)
- Purge automatique threads_to_process/ après inject (BACKLOG)

---

## 6. Contradictions et incohérences détectées

**extraction_model résidu dans schéma Notion :**
- Options gpt-4o-mini / gpt-4.1 présentes dans le schéma thread_dump
- Roadmap prévoit Claude uniquement — schéma pas nettoyé
- Sans impact fonctionnel actuellement

**BACKLOG unique vs DEV/USER :**
- Décision prise de séparer en deux fichiers
- BACKLOG.md actuel contient un mélange DEV + USER
- Restructuration à faire dans un thread dédié — dette ouverte

---

## 7. Illusions à démonter

**"Le fix P8 est validé donc le problème est résolu"**
Réalité : validé sur le schéma, jamais testé sur un cas réel de retry_count >= 2.

**"Le repo propre = système propre"**
Réalité : le repo est propre. L'état Notion (entités vides, extraction_model résidu) est indépendant du repo.

**"os:pre-thread remplace tout le contexte de démarrage"**
Réalité : il remplace l'alignement technique. La continuité décisionnelle profonde (ce qui est en suspens, ce qui est validé dans la mémoire) nécessite L'Associé — V3.

---

## 8. Risques structurants

**fix P8 non testé en conditions réelles :**
Si un thread atteint retry_count >= 2, le comportement réel reste non observé.

**BACKLOG unique :**
Tant que BACKLOG_DEV / BACKLOG_USER ne sont pas créés, les priorités DEV et USER se mélangent.

**Purge threads_to_process/ manuelle :**
Risque de retraitement inutile à chaque clôture si threads non purgés.

**Fin de thread non capturée :**
Les échanges post-export ne sont pas en mémoire Notion. Le CONTEXT v22 et os:pre-thread compensent partiellement mais ce n'est pas une solution validée.

**Crédits API Anthropic :**
Auto-recharge configurée, non testée en condition réelle d'épuisement.

---

## 9. Fichiers produits dans ce thread

| Fichier | Chemin | Statut |
|---------|--------|--------|
| README_INSIDE_OS_v11.md | docs/readme/ | En production — commit b0336d8 ✅ |
| BACKLOG.md v34 | racine repo | En production — commit 2b25006 ✅ |
| pre-thread.mjs | os/scripts/ | En production — commit 2b25006 ✅ |
| package.json | racine repo | En production — os:pre-thread ajouté ✅ |
| PIPELINE_BUG.md | docs/ | En production — commit 607d94b ✅ |
| PIPELINE_TESTING.md | docs/ | En production — commit 607d94b ✅ |
| REGLES_DOCS_SYSTEME... | docs/ | En production — commit 607d94b ✅ |
| VISION INSIDE_OS V01.txt | docs/vision/ | En production — commit 607d94b ✅ |
| PRE_THREAD_B09-T35-Dev.md | racine repo | Généré — à uploader en début de B09-T35, ne pas commiter |
| INSIDE_OS_CONTEXT_v22.md | docs/context/ | Ce document — à commiter |

---

## 10. Priorité réelle de redémarrage

**Actions immédiates (B09-T35) :**
1. Résoudre la perte de fin de thread — valider une séquence de clôture qui capture l'intégralité du thread en mémoire Notion (SYSTEME P9)
2. Créer BACKLOG_DEV.md + BACKLOG_USER.md — restructuration depuis BACKLOG.md actuel
2. Implémenter purge automatique threads_to_process/ après inject réussi
3. Cadrage L'Associé — premier agent USER opérationnel

**Critère de succès B09-T35 :**
BACKLOG_DEV et BACKLOG_USER créés, purge automatique implémentée.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé :**
- Protocole clôture 4 phases (PROMPT v11)
- injection_status=BLOCKED n'existe pas
- test_threads/ jamais en production
- os:pre-thread avant ouverture thread B09

**À clarifier immédiatement en B09-T35 :**
- Structure BACKLOG_DEV vs BACKLOG_USER
- Premier chantier USER : L'Associé ou ingestion threads business ?

**À tester avant extension :**
- fix P8 en conditions réelles (simuler un thread avec retry_count >= 2)

---

## Point de redémarrage minimal

- **Objectif** : créer BACKLOG_DEV/USER, implémenter purge threads_to_process/, cadrer L'Associé
- **Acquis** : pipeline V2 + P1-P8 stables, 93 inject_done, repo propre, README v11, os:pre-thread opérationnel, décisions DEV/USER gravées
- **En attente** : BACKLOG_DEV/USER, purge auto, Notion sandbox, L'Associé, fix P8 test réel
- **Contraintes** : DS_IDs stables, CLAUDE_MODEL dans .env, B09 exclu auto, injection_status = pending/done/error uniquement
- **Fragilités** : purge threads_to_process/ manuelle, fin de thread non capturée en mémoire Notion (problème identifié non résolu), BACKLOG non encore splitté DEV/USER, fix P8 non testé réel
- **Prochaine étape** : lancer os:pre-thread → uploader PRE_THREAD_B09-T35.md → ouvrir B09-T35


---

## BACKLOG ACTIF (v34)

# INSIDE OS — BACKLOG

Derniere mise a jour : 2026-05-10 (B09-T34)
Version : v34
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
| P8 | Script os:pre-thread — audit complet avant ouverture thread B09 : lecture versions actives (README/PROMPT/CONTEXT/BACKLOG) depuis repo, dernier thread B09 traite, snapshot Notion live, detection divergences entre docs. Produit PRE_THREAD_B09-TXX.md pret a uploader en debut de thread. A traiter avec P7 dans le meme thread B09 | B09-T34 | [DONE] |
| P9 | Resoudre perte fin de thread — les echanges post-export (commits finaux, --inject, decisions terminales) ne sont pas captures en memoire Notion. Identifier et valider une sequence de cloture qui capture l'integralite du thread. Bumper PROMPT v12 quand sequence validee | B09-T34 | [TODO] |

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

