# INSIDE_OS_CONTEXT_v21
Date : 2026-05-09

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T33-Notion-Dev-021

**Statut : Stable — thread productif, clôture propre**
**Version : v21**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

**Source du STOP :** Décision humaine — clôture B09-T33 après accomplissement des objectifs du thread.

**Ce thread couvre :**
- Audit d'alignement complet des 4 documents système avant ouverture B09-T33
- Fix P8 — exclusion threads retry_count >= 2 de la boucle auto-pagination (commit 06216f0)
- Audit Notion INSIDE_OS_DATABASES complet
- Nettoyage lessons_learnings : ds2/ds3 supprimés + 9 entrées test archivées
- B99-T99-TEST-DENSE-NOCHUNK supprimé de thread_dump
- Décision gravée : ne jamais injecter test_threads/ en production
- BACKLOG Notion INFRA P1 corrigé [TODO] → [DONE]
- Clarification critique : injection_status=BLOCKED n'existe pas dans Notion
- Écart comptage 90/101 expliqué et clos (upserts B99 = comportement attendu)
- Création architecture entities dans INSIDE_OS_DATABASES (4 entités E01-E04)
- Page privée STRUCTURE & ENTITÉS et @3 avril 2026 13:38 : à supprimer (corbeille)
- B09-T32 ingéré et injecté (35d/30l) — traité pendant la clôture B09-T33 ✅
- Protocole de clôture canonique en 4 phases défini et gravé dans PROMPT v11
- PROMPT bumpe v10 → v11
- BACKLOG mis à jour : P8 [DONE], nouveaux items SYSTEME P3/P4, INFRA P4

**Dérive empêchée :** Supprimer ds2/ds3 sans vérifier leur contenu — vérifié avant toute action destructive.

---

## 1. Intention réelle du thread

**Objectif réel :** Audit complet Notion + fix P8 boucle infinie auto-pagination.

**Problèmes résolus :**
- Fix P8 implémenté et commité (06216f0) — filtre retry_count >= 2 sur filterBase
- lessons_learnings ds2/ds3 supprimés (vues + sources)
- 9 entrées test archivées (ds2 : 6, ds3 : 3)
- B99-T99-TEST-DENSE-NOCHUNK supprimé de thread_dump
- BACKLOG Notion INFRA P1 resynchronisé
- Écart comptage Notion définitivement expliqué et clos
- Architecture entities créée (4 entités, données à remplir par agent dédié)
- Clarification critique gravée : injection_status=BLOCKED n'existe pas dans Notion
- Protocole de clôture canonique défini en 4 phases et gravé dans PROMPT v11

**Dérive empêchée :** Supprimer STRUCTURE & ENTITÉS sans vérifier les données — vérifié, données test, suppression validée.

---

## 2. Acquis réels

**Fix P8 :**
- Commit `06216f0` — `notBlocked` filter dans `getCandidates()` :
  `retry_count is_empty OR retry_count < 2`
- Appliqué sur `filterBase` → couvre `filterPending` ET `filterForce`
- Un thread avec `retry_count >= 2` est exclu quelle que soit la valeur de `injection_status`

**Clarification structurelle critique :**
- `injection_status=BLOCKED` n'existe **pas** dans le schéma Notion thread_dump
- Valeurs réelles : `pending` / `done` / `error`
- Un thread bloqué = `injection_status=error` + `retry_count >= 2`
- Corrigé dans PROMPT v11 — reste à corriger dans README au prochain bump

**Protocole de clôture canonique (gravé dans PROMPT v11) :**

| Phase | Actions |
|-------|---------|
| 1 — Mémoire | Export thread → ingest → inject |
| 2 — Clôture | os-thread-close.mjs --thread-name |
| 3 — Validation LLM | Alignement draft ↔ thread ↔ docs → corrections → commit |
| 4 — Injection B99 | os-thread-close.mjs --inject → vérifier B99 Notion |

Règle critique : toujours commiter avant --inject.

**Audit Notion — résultats :**
- INSIDE_OS_DATABASES : 10 bases, 1 seul ds par base (après nettoyage), propre
- decisions_structural : 1 ds, schéma propre ✅
- lessons_learnings : ds2/ds3 supprimés, 9 entrées test archivées ✅
- thread_dump : 1 ds, B99-T99-TEST supprimé ✅
- B99-T07 : CONTEXT v20 correct au démarrage ✅
- BACKLOG Notion : INFRA P1 corrigé [TODO] → [DONE] ✅
- Écart comptage 90/101 : expliqué (B99 upserts) — clos ✅

**Entities INSIDE_OS_DATABASES :**
- E01 — Inside SAS | renovation | core | active
- E02 — F&A Capital | holding | holding | active
- E03 — Atelier de la Colombe | carpentry | production | active
- E04 — Inside Archi | moe | core | active
- Données financières à remplir par agent dédié ultérieurement

**Décision gravée dans decisions_structural :**
- Ne jamais injecter un thread test_threads/ dans thread_dump production (source : B09-T33)

**Documents système mis à jour dans ce thread :**
- PROMPT v11 — protocole clôture canonique, correction BLOCKED, règle test_threads/, règle MCP doublons
- BACKLOG v33 — P8 [DONE], SYSTEME P3/P4 ajoutés, INFRA P4 ajouté

**Commits de ce thread :**
- `06216f0` — fix P8 : exclure retry_count >= 2 de la boucle auto-pagination
- `dc2484c` — fix: restaurer ANTHROPIC_API_KEY dans ingest (supprimé par erreur migration claudeFetch)
- `01d3ec2` — CONTEXT v21 + PROMPT v11 + BACKLOG

---

## 3. Hypothèses, intentions, paris

- Les données financières des entités (CA, charges, marges) seront alimentées par un agent dédié — pas encore implémenté, cadrage à faire en B09-T34 ou ultérieur
- STRUCTURE & ENTITÉS et @3 avril 2026 13:38 sont à supprimer manuellement (corbeille) — non encore fait à la clôture
- B09-T32 ingéré et injecté (35d/30l) ✅ — traité pendant la clôture
- La page Notion INSIDE-OS-BACKLOG sera mise à jour en miroir du BACKLOG.md produit dans ce thread

---

## 4. Contraintes actives à respecter

**Techniques**
- DS_ID decisions_structural = 3b054e65-6195-4bfe-8411-53bafe98b64b
- DS_ID lessons_learnings = 0137b375-fe52-48fa-affc-d7885f2412cb
- DS_ID thread_dump = 3155e503-b0ac-819f-9a69-000b1c28aaf9
- CHUNK_SIZE=20000, CHUNK_OVERLAP=500
- CLAUDE_MODEL=claude-sonnet-4-6 (dans .env, plus hardcodé)
- INGEST_PROMPT_PASS1=ingest-pass1-v02
- B09 exclu pipeline automatique — override --skip-buckets ""
- Notion MCP destructif = confirmation explicite requise
- thread_summarized/ = archive permanente — ne jamais supprimer
- data_cemetery/ = gitignored, archive permanente, noms complets uniquement
- B99 dans data_cemetery/ = noms courts intentionnels — ne pas toucher
- B99 THREAD_DUMP = mémoire vivante — intouchable
- notion-memory-chat.mjs = claude-haiku-4-5-20251001 intentionnel — ne pas migrer
- **injection_status BLOCKED n'existe pas dans Notion** — threads bloqués = error + retry_count >= 2
- test_threads/ = ne jamais injecter en production thread_dump
- Avant toute création MCP dans une base existante : vérifier l'existant pour éviter les doublons

**Protocoles**
- Clôture thread B09 : séquence canonique 4 phases (voir PROMPT v11) — ingest+inject AVANT close
- Validation batch : 1 thread → 5 threads → batch complet
- B09 : --skip-buckets "" pour override exclusion automatique
- BACKLOG = toute amélioration identifiée → BACKLOG.md + Notion miroir
- Vérifier B99 dans Notion après chaque inject os-thread-close
- Toujours commiter avant --inject

**Versionning actif**
- README : v10 | PROMPT : v11 | CONTEXT : v21
- Prompts LLM actifs : ingest-pass1-v02 + ingest-pass2-v01

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement**
- Pipeline V2 complet + 5 fixes + fix P8 implémentés (P1-P8 tous [DONE])
- Retry Notion 504 validé en conditions réelles
- os/lib/claude.mjs — wrapper unifié retry LLM
- os/lib/notion.mjs — retry Notion unifié
- Checkpoint par chunk — reprise après crash
- Inject auto-pagination — boucle jusqu'à 0 candidats, threads retry_count >= 2 exclus
- CLAUDE_MODEL configurable depuis .env
- BACKLOG.md + Notion miroir
- 92 threads inject_done, 0 pending (B09-T32 + B09-T33 injectés pendant cette clôture)
- entities INSIDE_OS_DATABASES — architecture créée (4 entités, données à remplir)
- INSIDE_OS_DATABASES propre — 1 ds par base, aucun résidu test

**Ce qui reste fragile**
- Synchronisation BACKLOG.md ↔ Notion manuelle (pas automatisée)
- Vérification B99 après inject os-thread-close manuelle
- Crédits API Anthropic — auto-recharge configurée, non testée en condition réelle d'épuisement
- Draft CONTEXT auto inexact si fichier thread non accessible au script
- CONTEXT v22 auto commité par Claude Code — à supprimer du repo (draft incorrect)

**Ce qui manque**
- Données financières entities (agent dédié — roadmap)
- Audit repo (fichiers orphelins, dossiers inutiles) — repoussé à B09-T34
- Suppression manuelle STRUCTURE & ENTITÉS + @3 avril 2026 13:38
- Correction README : supprimer référence injection_status=BLOCKED
- Miroir Notion BACKLOG à mettre à jour

---

## 6. Contradictions et incohérences détectées

**"BLOCKED" comme valeur injection_status**
- CONTEXT v19 et v20 mentionnaient "injection_status=BLOCKED" comme statut possible
- Réalité vérifiée dans schéma Notion : valeurs = pending / done / error uniquement
- Corrigé dans PROMPT v11 — reste à corriger dans README au prochain bump

**Doublons entities créés**
- 4 entités créées par MCP alors que INSIDE SAS et ATELIER DE LA COLOMBE existaient déjà
- Doublons supprimés manuellement
- Cause : absence de vérification de l'existant avant création MCP
- Règle gravée dans PROMPT v11 : toujours vérifier avant de créer

**B09-T32 ingéré hors séquence**
- Oublié pendant le thread — close lancé avant ingest/inject
- Traité pendant la clôture B09-T33 (35d/30l inject_done) — aucune perte
- Cause : protocole de clôture ne mentionnait pas l'ingest/inject avant close — corrigé dans PROMPT v11

**CONTEXT v22 auto commité par Claude Code**
- os-thread-close.mjs a généré et commité un draft v22 sans validation humaine
- Ce draft contient des inexactitudes (B09-T32 dit non injecté alors qu'il l'était)
- À supprimer du repo en B09-T34 — ne jamais commiter un CONTEXT sans validation LLM-assistée

---

## 7. Illusions à démonter

**"injection_status=BLOCKED bloque la boucle"**
- Réalité : BLOCKED n'est pas un statut Notion. La boucle bouclait sur des threads avec retry_count >= 2 et injection_status=error. Le fix filtre correctement sur retry_count.

**"L'audit Notion est terminé"**
- Réalité : les bases canoniques sont propres, mais les pages privées (STRUCTURE & ENTITÉS, @3 avril) ne sont pas encore supprimées. L'audit repo n'a pas été conduit — repoussé à B09-T34.

**"entities est rempli"**
- Réalité : l'architecture est en place (4 entités avec métadonnées de base), mais toutes les données financières sont vides. L'agent dédié n'existe pas encore.

**"Le protocole de clôture était complet"**
- Réalité : l'ingest/inject du thread en cours avant le close n'était pas documenté — angle mort révélé par B09-T32 oublié dans threads_to_process/, corrigé dans PROMPT v11.

---

## 8. Risques structurants

**CONTEXT v22 auto dans le repo**
- Commité par Claude Code sans validation — contenu inexact
- À supprimer en B09-T34 via `git rm docs/context/INSIDE_OS_CONTEXT_v22.md`

**Documentation "BLOCKED" résiduelle dans README**
- PROMPT v11 corrigé — README v10 mentionne encore BLOCKED
- Action : bumper README en B09-T34

**Audit repo non conduit**
- Fichiers orphelins, dossiers inutiles dans le repo non audités
- À faire en B09-T34

**Crédits API Anthropic**
- Auto-recharge configurée mais non testée en condition réelle d'épuisement
- Risque faible mais non nul sur un batch long

---

## 9. Priorité réelle de redémarrage

**Actions immédiates avant B99 inject :**
1. Ingérer et injecter B09-T32 (threads_to_process/)
2. Commiter CONTEXT v21 + PROMPT v11 + BACKLOG.md
3. os-thread-close.mjs --inject → vérifier B99 Notion
4. Mettre à jour miroir Notion BACKLOG

**Actions avant B09-T34 :**
5. Supprimer STRUCTURE & ENTITÉS + @3 avril 2026 13:38 (corbeille Notion)

**B09-T34 — dans cet ordre :**
1. Supprimer CONTEXT v22 auto du repo (`git rm docs/context/INSIDE_OS_CONTEXT_v22.md`)
2. Audit repo — fichiers orphelins, dossiers inutiles
3. Bumper README : supprimer référence injection_status=BLOCKED
4. Vérifier que retry_count existe bien dans le schéma Notion thread_dump (sinon fix P8 sans effet)
5. Cadrage agent dédié entities (données financières)
6. Supprimer STRUCTURE & ENTITÉS + @3 avril 2026 13:38 (corbeille Notion)

Critère de succès : B09-T32 injecté, repo audité et propre, BLOCKED éliminé de toute la doc.

---

## 10. Point de redémarrage minimal

- **Objectif** : supprimer v22 auto, auditer repo, corriger README BLOCKED, vérifier retry_count schéma
- **Acquis** : pipeline V2 + P1-P8 stables, 92 inject_done, Notion propre, entities créées, protocole clôture gravé PROMPT v11, B09-T32 injecté
- **En attente** : CONTEXT v22 auto à supprimer, audit repo, README BLOCKED, données entities vides, miroir Notion BACKLOG, retry_count schéma à vérifier
- **Contraintes** : DS_IDs stables, CLAUDE_MODEL dans .env, B09 exclu auto, B99 intouchable, injection_status = pending/done/error uniquement, ingest+inject AVANT close
- **Fragilités** : synchro BACKLOG manuelle, draft CONTEXT auto commité sans validation (v22), retry_count présence dans schéma Notion non vérifiée
- **Prochaine étape** : supprimer v22 → audit repo → fix README BLOCKED → vérifier retry_count schéma
