# INSIDE_OS_CONTEXT_v20
Date : 2026-05-09

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T32-Notion-Dev-020

**Statut : Stable — thread productif, cloture propre**
**Version : v20**
**Niveau de confiance : Eleve**

---

## 0. Signal de continuite

**Source du STOP :** Decision humaine — cloture B09-T32 apres accomplissement des objectifs du thread.

**Ce thread couvre :**
- Ingest et inject de B09-T31 (66d/60l)
- Implementation des 5 fixes pipeline graves en B09-T30
- Creation du BACKLOG.md + miroir Notion
- Nettoyage data_cemetery/ (31 doublons supprimes)
- Fix archivage sous nom complet (P6)
- Deblocage et inject de B09-T28
- Validation retry Notion 504 en conditions reelles

**Etat final memoire INSIDE OS :**
- 91 threads inject_done | 0 pending
- 3 350 decisions | 2 881 lessons (B09-T31 : +66d/+60l)

---

## 1. Intention reelle du thread

**Objectif reel :** Implementer les 5 fixes pipeline, creer le BACKLOG, nettoyer data_cemetery/, injecter B09-T31.

**Problemes resolus :**
- 5 fixes pipeline implementes et commites
- BACKLOG.md cree (versionne + miroir Notion)
- 31 doublons data_cemetery/ supprimes
- Fix archivage nom complet dans data_cemetery/
- B09-T28 debloque (retry_count=0) et injecte
- B09-T31 ingeste et injecte (66d/60l)
- Retry Notion 504 valide en conditions reelles

**Derive empechee :** Lancer audit Notion + repo dans ce thread — reporte en B09-T33.

---

## 2. Acquis reels

**Pipeline — 5 fixes implementes et commites :**

| Commit | Fix |
|--------|-----|
| 655dbd9 | CLAUDE_MODEL depuis .env (4 fichiers + .env.example cree) |
| 0d264a2 | Retry Notion 502/503/504 backoff 1s/5s/30s dans notionFetch |
| eb68aec | Retry LLM 500/529 via os/lib/claude.mjs (wrapper unifie) |
| c011b0c | Inject auto-pagination (boucle jusqu'a 0 candidats, --limit garde-fou) |
| 1a6eafd | Checkpoint par chunk (reprise apres crash, _partial.json) |

**data_cemetery/ :**
- e661e2e — fix archivage sous nom complet
- 31 doublons supprimes manuellement
- 78 fichiers restants — propre
- B09-T31.txt = orphelin temporaire (archive avant fix P6)
- B99 dans data_cemetery/ = noms courts intentionnels — ne pas toucher

**BACKLOG :**
- f5099a8 — BACKLOG.md cree a la racine, versionne
- Page Notion INSIDE-OS-BACKLOG creee (miroir synchronise)
- P1 a P7 renseignes [DONE], P8 ajoute [TODO]

**Memoire :**
- B09-T31 ingeste (66d/60l) et injecte
- B09-T28 debloque et injecte
- 91 inject_done, 0 pending

**Retry Notion 504 valide en conditions reelles** sur B09-T28.

**Commits de ce thread (dans l'ordre) :**
- 655dbd9 — CLAUDE_MODEL depuis .env
- 0d264a2 — Retry Notion 502/503/504
- eb68aec — Retry LLM 500/529
- c011b0c — Inject auto-pagination
- 1a6eafd — Checkpoint par chunk
- f5099a8 — BACKLOG.md
- cbc65d1 — BACKLOG P6/P7 [DONE]
- e661e2e — data_cemetery nom complet
- 4070542 — BACKLOG P8 [TODO]

---

## 3. Hypotheses, intentions, paris

- La page Notion INSIDE-OS-BACKLOG restera synchronisee avec BACKLOG.md — depend d'une discipline manuelle a chaque thread B09 (pas encore automatise — BACKLOG SYSTEME P2)
- notion-memory-chat.mjs sur claude-haiku-4-5-20251001 — modele intentionnel pour script de test, non migre vers CLAUDE_MODEL env (decision assumee)
- B09-T31.txt dans data_cemetery/ — orphelin temporaire, pas de doublon, pas de risque fonctionnel

---

## 4. Contraintes actives a respecter

**Techniques**
- DS_ID decisions_structural = 3b054e65-6195-4bfe-8411-53bafe98b64b
- DS_ID lessons_learnings = 0137b375-fe52-48fa-affc-d7885f2412cb
- DS_ID thread_dump = 3155e503-b0ac-819f-9a69-000b1c28aaf9
- CHUNK_SIZE=20000, CHUNK_OVERLAP=500
- CLAUDE_MODEL=claude-sonnet-4-6 (dans .env, plus hardcode)
- INGEST_PROMPT_PASS1=ingest-pass1-v02
- B09 exclu pipeline automatique — override --skip-buckets ""
- Notion MCP destructif = confirmation explicite requise
- thread_summarized/ = archive permanente — ne jamais supprimer
- data_cemetery/ = gitignored, archive permanente, noms complets uniquement
- B99 dans data_cemetery/ = noms courts intentionnels — ne pas toucher
- B99 THREAD_DUMP = memoire vivante — intouchable
- notion-memory-chat.mjs = claude-haiku-4-5-20251001 intentionnel — ne pas migrer

**Protocoles**
- Cloture thread B09 : node os-thread-close.mjs --thread-name "B09-TXX-Sujet" -> valider draft -> remplacer par vrai CONTEXT -> --inject -> verifier B99 dans Notion
- Validation batch : 1 thread -> 5 threads -> batch complet
- B09 : --skip-buckets "" pour override exclusion automatique
- BACKLOG = toute amelioration identifiee -> BACKLOG.md + Notion miroir
- Verifier B99 dans Notion apres chaque inject os-thread-close (draft auto potentiellement incomplet)

**Versionning actif**
- README : v10 | PROMPT : v10 | CONTEXT : v20
- Prompts LLM actifs : ingest-pass1-v02 + ingest-pass2-v01

---

## 5. Architecture actuelle

**Ce qui fonctionne reellement**
- Pipeline V2 complet + 5 fixes implementes
- Retry Notion 504 valide en conditions reelles
- os/lib/claude.mjs — wrapper unifie retry LLM
- os/lib/notion.mjs — retry Notion unifie
- Checkpoint par chunk — reprise apres crash
- Inject auto-pagination — boucle jusqu'a 0 candidats
- CLAUDE_MODEL configurable depuis .env
- BACKLOG.md + Notion miroir
- 91 threads inject_done, 0 pending

**Ce qui reste fragile**
- Bug P8 : boucle infinie auto-pagination sur thread BLOCKED — non corrige
- Synchronisation BACKLOG.md <-> Notion manuelle (pas automatisee)
- Verification B99 apres inject os-thread-close manuelle
- Credits API Anthropic non surveilles (auto-recharge non configuree)
- Draft CONTEXT auto inexact si fichier thread non accessible au script

**Ce qui manque**
- Audit repo + Notion (B09-T33)
- Fix P8 boucle infinie BLOCKED
- UI utilisateur (cadrage a faire en B09-T33 ou B09-T34)

---

## 6. Contradictions et incoherences detectees

**Draft CONTEXT automatique inexact**
- os-thread-close.mjs genere un draft sans lire le thread reel si le fichier n'est pas disponible
- Resolu manuellement a chaque cloture — a automatiser

**B09-T31.txt dans data_cemetery/**
- Orphelin — archive sous nom court avant le fix P6
- A renommer en B09-T31-Notion-Dev-019.txt manuellement (optionnel, pas de doublon)

**BACKLOG Notion P6/P7 etaient [TODO] alors que [DONE] dans BACKLOG.md**
- Corrige dans ce thread — desynchronisation detectee et resolue
- Risque recurrent sans automatisation de la synchro

---

## 7. Illusions a demonter

**"Le pipeline est maintenant robuste"**
- Realite : les 5 fixes majeurs sont en place, mais P8 (boucle infinie BLOCKED) peut bloquer un batch complet si un thread est BLOCKED

**"Le BACKLOG Notion est toujours a jour"**
- Realite : la synchro est manuelle — sans discipline explicite a chaque thread, le miroir derive

**"Le draft CONTEXT auto est fiable"**
- Realite : si le fichier thread n'est pas accessible au script, le draft est genere par inference — incomplet ou inexact. Toujours verifier.

---

## 8. Risques structurants

**Bug P8 — boucle infinie**
- Un thread BLOCKED en injection_status=pending fait tourner l'auto-pagination indefiniment
- Mitigation immediate : verifier les BLOCKED avant tout batch
- Solution : fix P8 en B09-T33

**Credits API Anthropic**
- Auto-recharge non configuree — interruption batch possible
- Action : activer sur console.anthropic.com

**Draft CONTEXT automatique**
- Si le thread n'est pas accessible au script, le draft injecte en B99 est incorrect
- Mitigation : toujours verifier et remplacer B99 apres cloture

---

## 9. Priorite reelle de redemarrage

**Action immediate avant B09-T33 :**
1. Verifier que B99 contient le vrai CONTEXT v20 (pas le draft auto)
2. Commiter INSIDE_OS_CONTEXT_v20.md dans docs/context/
3. Renommer optionnellement B09-T31.txt en data_cemetery/

**B09-T33 — Audit & Clean :**
1. Audit repo — fichiers orphelins, dossiers inutiles
2. Audit Notion INSIDE-OS-DATABASES — pages/dossiers de test, coherence complete
3. Fix P8 — exclure threads BLOCKED de l'auto-pagination
4. Cadrage UI utilisateur

Critere de succes : repo et Notion propres, aucun residu de test, P8 corrige.

---

## 10. Point de redemarrage minimal

- **Objectif** : audit + clean repo et Notion, fix P8
- **Acquis** : pipeline V2 + 5 fixes stables, 91 threads inject_done, BACKLOG actif, retry valide en conditions reelles
- **En attente** : P8 boucle infinie BLOCKED, audit B09-T33, UI utilisateur cadrage
- **Contraintes** : DS_ID decisions 3b054e65-6195-4bfe-8411-53bafe98b64b, CLAUDE_MODEL dans .env, B09 exclu auto, B99 intouchable, data_cemetery gitignored
- **Fragilites** : P8 non corrige, synchro BACKLOG manuelle, draft CONTEXT auto inexact sans fichier thread
- **Prochaine etape** : verifier B99 = CONTEXT v20 -> ouvrir B09-T33 -> audit complet -> fix P8
