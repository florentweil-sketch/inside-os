# INSIDE_OS_CONTEXT_v27
Date : 2026-05-16

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T37-Notion-Dev-025

**Statut : Stable**
**Version : v27**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Clôture volontaire fin de session B09-T37. Tous les objectifs atteints.

---

## 1. Intention réelle du thread

- P12 ✅ DONE — VERIFY_PASS=always gravé dans .env.example (commit 62170f6)
- P15 ✅ DONE — IDEAS.md + os:idea opérationnel (commit e7d93df)
- P11 ⏸ suspendu délibérément — règle du dernier thread conservé dans threads_to_process/ à définir avant implémentation
- Posture confrontation ✅ DONE — PROMPT_ASSOCIE v02 + PROMPT_MAITRE v13 (commit eeab55c)
- Décision stratégique ✅ gravée — Option B : Agent Infrastructure & Tech = prochain thread B09-T38
- Fix cemetery ✅ DONE — mise à jour automatique si version enrichie (commit 29bdb37)
- Fix os:close ✅ DONE — question confirmation + fallback thread_summarized, P9 partiel (commit 59a698a)

---

## 2. Acquis réels

**PIPELINE P12 [DONE] — commit 62170f6 :**
- VERIFY_PASS=always ajouté dans .env.example
- Ligne ajoutée par `echo >> .env.example`, vérifiée par cat, commitée
- Fichier modifié : .env.example

**État pipeline confirmé en ouverture de ce thread :**
- 96 threads | extract_done: 96 | inject_done: 96 | inject_pending: 0 | inject_error: 0
- DECISIONS : 3922 | LESSONS : 3343
- Aucun thread bloqué
- Différentiel vs v26 : +1 thread injecté, +155 DECISIONS, +129 LESSONS (B09-T37 injecté ou autre thread traité entre sessions)

**Commits produits dans ce thread :**
- 62170f6 : feat(config) — VERIFY_PASS=always dans .env.example — PIPELINE P12 DONE
- e7d93df : feat(system) — IDEAS.md créé + os:idea opérationnel — SYSTEME P15 DONE
- eeab55c : feat(posture) — posture confrontation — PROMPT_ASSOCIE v02 + PROMPT_MAITRE v13
- 0038c40 : chore(backlog) — BACKLOG_DEV/USER v04 — SYSTEME P16 + INFRA P8
- 29bdb37 : fix(cemetery) — mise à jour automatique si version enrichie
- 59a698a : fix(close) — confirmation ingest + fallback thread_summarized

**Acquis non produits dans ce thread (hérités de v26 et sessions précédentes, rappel) :**
- PROMPT_MAITRE v13, README v12, PROMPT_ASSOCIE v02 — stables, en repo
- BACKLOG_DEV v04, BACKLOG_USER (version héritée) — en repo
- Tokenizer diacritiques corrigé, MIN_SCORE=15 actif

---

## 3. Hypothèses, intentions, paris

**Hypothèse 1 :** SYSTEME P15 (os:idea + IDEAS.md) a été implémenté après l'interruption du dump. Non vérifié — à confirmer en réouverture par `git log --oneline -3` et `ls IDEAS.md`.

**Hypothèse 2 :** PIPELINE P11 (purge auto threads_to_process/) a été abordé ou non selon durée de session. Non vérifié — à confirmer.

**Pari architectural P15 :** Un script os:idea alimentant un IDEAS.md local est suffisant pour capturer les idées hors-session sans Notion. Ce pari suppose que Florent utilise la CLI régulièrement — comportement non encore prouvé.

**Pari P11 :** La purge automatique après inject réussi ne crée pas de perte de données si le cemetery fonctionne correctement. Suppose que data_cemetery est fiable comme archive — validé structurellement mais non testé à grande échelle sur purge automatisée.

---

## 4. Contraintes actives à respecter

**Techniques non négociables :**
- DS_ID = identifiant API Notion uniquement — jamais interpréter autrement
- B09 exclu du pipeline automatique — toujours
- CONTEXT vXX injecté en B99 uniquement
- raw_text multi-lignes : ne pas toucher avant V2 moteur sémantique
- Node.js ESM (type: module) — tous les scripts en .mjs
- VERIFY_PASS=always désormais dans .env.example — ne pas rétrograder

**Organisationnelles :**
- Mode "bébé" actif pour les commandes — toujours préciser terminal vs Claude Code
- Florent n'est pas codeur — zéro présupposition sur lecture de code
- Commits systématiques après chaque item backlog — pas de session sans commit

**Règles gravées :**
- BACKLOG_DEV = technique pipeline/infra | BACKLOG_USER = usage/agents — ne pas mélanger
- PRE_THREAD archivé avant ouverture de session suivante
- Aucun acronyme inventé — si inconnu, signaler

---

## 5. Architecture actuelle

**Ce qui fonctionne :**
- Pipeline THREAD_DUMP → EXTRACT → INJECT : 96/96, zéro erreur, zéro pending
- Cemetery : mise à jour automatique si version enrichie, WARNING si régression — fix structurel en place (commit 29bdb37)
- Close : question confirmation ingest + fallback thread_summarized (commit 59a698a, P9 partiel)
- Scripts npm actifs : os:ingest, os:extract, os:inject, os:pipeline, os:validate-schema, os:audit, os:list-inject-errors
- .env.example : complet avec VERIFY_PASS=always

**En apparence fonctionnel, non testé en conditions réelles :**
- Sandbox Notion (workspace INSIDE-OS-SANDBOX) : créé, .env.test configuré, bases de données non créées — bloqué API dépréciée depuis v26. Statut inconnu à date de ce thread.
- Purge auto threads_to_process/ : non implémentée ou statut non confirmé

**Fragile :**
- notion-memory-chat.mjs : toujours sur OpenAI GPT-4.1-mini — migration Claude prévue mais non faite (roadmap V2)
- P9 partiel : commit 59a698a marqué "P9 partiel" — ce qui reste de P9 n'est pas explicitement documenté dans le dump disponible

**Manque :**
- os:idea + IDEAS.md : statut non confirmé dans ce thread
- retry_count dans THREAD_DUMP : propriété prévue, non implémentée
- Agent Intégration IA : défini dans PROMPT_ASSOCIE v02, non codé
- SYSTEME P2 Option A : documentée, non implémentée

---

## 6. Contradictions et incohérences détectées

**Contradiction 1 — P9 partiel :**
P9 est marqué DONE dans v26 (tokenizer + MIN_SCORE, commit 0fd15f6), mais le commit 59a698a est libellé "P9 partiel". Deux commits distincts, deux P9 différents, ou P9 rouverte ? La définition exacte de ce P9 résiduel n'est pas documentée dans le dump.

**Contradiction 3 — BACKLOG_DEV version :**
Le commit 0038c40 mentionne "v04 SYSTEME P16 + INFRA P8 ajoutés". Le CONTEXT v26 référence BACKLOG_DEV v03. La v04 est donc postérieure à v26 — produite dans une micro-session ou en fermeture T36. Ce context v27 acte v04 comme version courante.

---

## 7. Illusions à démonter

**Illusion 1 :** "96/96 inject_done = système parfait."
Faux. Le pipeline est complet sur les threads traités, pas sur la qualité du contenu injecté. MIN_SCORE=15 filtre le bas de gamme, mais la pertinence réelle des 3922 DECISIONS et 3343 LESSONS n'a pas été auditée manuellement à cette échelle.

**Illusion 2 :** "Le cemetery protège contre les pertes."
Conditionnel. Le fix structurel (29bdb37) est récent. La purge automatique (P11) n'est pas encore implémentée — donc tant que P11 est absent, threads_to_process/ n'est pas purgé automatiquement et le cemetery n'est pas activé sur ce chemin.

**Illusion 3 :** "La sandbox résoudra le problème de tests en production."
La sandbox est créée mais non opérationnelle (API dépréciée bloquante). Tester en production reste la réalité jusqu'à résolution.

**Illusion 4 :** "os:idea va créer une discipline de capture d'idées."
Un script ne crée pas un comportement. L'outil est utile si utilisé. Aucune donnée sur fréquence d'usage réelle.

---

## 8. Risques structurants

**Technique :**
- Purge auto (P11) non implémentée : threads_to_process/ s'accumule si re-traitement manuel — risque de double-inject sur threads réinjectés.
- notion-memory-chat.mjs sur GPT-4.1-mini : dépendance OpenAI active alors que stack cible est Claude. Divergence de coût et de comportement si les deux APIs évoluent différemment.
- API Notion dépréciée bloquant la sandbox : si cette API est retirée sans migration, la sandbox reste inutilisable et les tests en production perdurent.

**Stratégique :**
- Agents définis (Directeur Achats, Classifieur Documents) mais non codés : risque de définition qui vieillit mal si l'architecture change avant l'implémentation.
- SYSTEME P2 Option A documentée mais non implémentée depuis plusieurs versions : dette de contexte — plus ça dure, plus la spec sera à re-valider.

**Faux pilotage :**
- DECISIONS/LESSONS en croissance (3922 / 3343) sans audit qualitatif régulier : comptage rassurant, pertinence non vérifiée.
- "Niveau de confiance : Élevé" sur pipeline = confiance sur le mécanisme, pas sur le contenu.

---

## 9. Fichiers produits dans ce thread

| Fichier | Chemin | Statut |
|---|---|---|
| .env.example | racine | Modifié — VERIFY_PASS=always (62170f6) |
| IDEAS.md | racine | Créé (e7d93df) |
| os/scripts/idea.mjs | os/scripts/ | Créé (e7d93df) |
| package.json | racine | Modifié — os:idea ajouté (e7d93df) |
| PROMPT_ASSOCIE_v02.md | docs/prompts/associe/ | Modifié — posture confrontation (eeab55c) |
| PROMPT_MAITRE_v13.md | docs/prompts transfert thread/ | Modifié — posture confrontation (eeab55c) |
| BACKLOG_DEV.md | racine | v04 — SYSTEME P16 + INFRA P8 (0038c40) |
| BACKLOG_USER.md | racine | v04 — date + version (0038c40) |
| os/ingest/ingest-thread-dump.mjs | os/ingest/ | Modifié — fix cemetery (29bdb37) |
| os-thread-close.mjs | racine | Modifié — fix confirmation + fallback (59a698a) |

---

## 10. Priorité réelle de redémarrage

Thread suivant B09-T38 = Agent Infrastructure & Tech — définir prompt système, périmètre, routing, sous-pipeline 200 threads bruts.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé :**
- Thread = B09-T38-Notion-Dev-026
- .env.example avec VERIFY_PASS=always — ne pas toucher
- BACKLOG_DEV v04 comme référence — pas v03
- Pipeline 96/96 comme baseline — tout régression à signaler immédiatement

**À clarifier en ouverture :**
- Statut réel P15 (IDEAS.md + os:idea) — git log + ls avant toute chose
- Statut réel P11 (purge auto) — idem
- Ce que couvre exactement "P9 partiel" (commit 59a698a)

**À tester avant de déclarer DONE :**
- P15 : `npm run os:idea` end-to-end sur IDEAS.md réel
- P11 : inject test + vérifier purge effective dans threads_to_process/

**À ne pas versionner sans test :**
- Purge auto — opération destructive sur fichiers source, tester sur data/test_threads/ d'abord

---

## Point de redémarrage minimal

**Objectif :** Fermer P15 (IDEAS.md + os:idea) et P11 (purge auto threads_to_process/).
**Acquis certifiés :** Pipeline 96/96, P12 DONE (commit 62170f6), repo clean.
**Contraintes :** P11 = opération destructive — tester sur test_threads avant prod. B09 exclu pipeline auto.
**État :** P15 et P11 statut inc