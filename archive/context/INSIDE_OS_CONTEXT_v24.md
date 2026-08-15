# INSIDE_OS_CONTEXT_v24
Date : 2026-05-15

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T36-Notion-Dev-024

**Statut : Stable**
**Version : v24**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

**Source du STOP :** Décision humaine — clôture B09-T36 après accomplissement des objectifs du thread.

**Ce thread couvre :**
- Création workspace Notion sandbox INSIDE-OS-SANDBOX (workspace séparé, pas une page dans F&A CAPITAL) ✅
- Refactor BACKLOG.md : scission en BACKLOG_DEV.md + BACKLOG_USER.md (commit 33bf20a) ✅
- BACKLOG_DEV.md + BACKLOG_USER.md v01 créés (commit 33bf20a) ✅
- BACKLOG.md transformé en index pointant vers les deux fichiers (commit 684b5ae) ✅
- Fix tokenizer diacritiques + MIN_SCORE=15 dans notion-memory-chat.mjs et notion-memory-server.mjs (commit 0fd15f6, tag P9) ✅ → DB qualité passe à 9/9 sur dimension pertinence
- Fix désambiguïsation humain vs agent IA dans chat (commit 6c14619, tag P10) ✅
- THREAD_DUMP : 94 threads | inject_done: 94 | inject_error: 0 ✅
- .env.test opérationnel — NOTION_API_KEY sandbox + ROOT_PAGE_ID testés et validés en thread ✅

**Dérive empêchée :** déploiement cloud, migration OpenAI→Claude — repoussés.

---

## 1. Intention réelle du thread

**Objectif réel :** Poser l'infrastructure sandbox Notion (workspace séparé + .env.test) + scission BACKLOG.

**Problèmes concrets traités :**
- Ambiguïté BACKLOG unique → scindé en deux fichiers avec index
- Absence workspace sandbox → workspace INSIDE-OS-SANDBOX créé (workspace réel, pas sous-page)
- Fix sémantique P10 dans chat (désambiguïsation humain/agent)

**Non résolu / repoussé :**
- Intégration API sandbox : création workspace faite, bases de données sandbox non créées
- Bases de données Notion dans le workspace sandbox : non créées
- P9 SYSTEME — séquence de clôture capturant fin de thread : non démarré
- Agent Intégration IA : défini v23, toujours non implémenté

---

## 2. Acquis réels

**Workspace Notion sandbox :**
- Workspace INSIDE-OS-SANDBOX créé comme workspace Notion indépendant (pas une page dans F&A CAPITAL)
- Erreur initiale corrigée : première tentative avait créé une page dans F&A CAPITAL → recommencé proprement
- Forfait Gratuit — suffisant pour usage sandbox
- Statut : workspace vide, pas encore de bases de données créées dedans

**Intégration API sandbox :**
- Parcours guidé jusqu'à notion.so/profile/integrations
- Statut exact : le thread s'interrompt avant confirmation que l'intégration est créée avec le bon workspace cible
- .env.test modifié — contenu final non confirmé dans les données disponibles

**Refactor BACKLOG :**
- BACKLOG.md → index (commit 684b5ae)
- BACKLOG_DEV.md v01 créé (commit 33bf20a)
- BACKLOG_USER.md v01 créé (commit 33bf20a)
- Structure : deux backlogs distincts avec index central — architecture gravée

**Fix chat P9 — tokenizer diacritiques + MIN_SCORE=15 :**
- Commit 0fd15f6 : fix `.replace(/\p{Diacritic}/gu, "")` (backslash corrigé) dans normalizeText + filtre MIN_SCORE=15 avant slice TOP_K dans notion-memory-chat.mjs et notion-memory-server.mjs
- DB qualité passe à 9/9 sur la dimension pertinence — résidu 0.5/9 éliminé

**Fix chat P10 — désambiguïsation associé humain vs agent IA :**
- Commit 6c14619 : bloc P10 dans scoreItem — malus -20 si query "associé" sans "agent/IA" et item B09 hitté sur "associe"
- Tag P10 dans le commit — cohérent avec la nomenclature BACKLOG

**Pipeline :**
- 94 threads injectés, 0 erreur, 0 pending
- État stable — pas de dette pipeline à ce stade

---

## 3. Hypothèses, intentions, paris

**[PROPOSITION — à valider au prochain thread]**

- L'intégration API sandbox a été créée correctement dans INSIDE-OS-SANDBOX avant la clôture du thread — non confirmé, à vérifier en ouvrant .env.test
- .env.test contient NOTION_API_KEY sandbox + ROOT_PAGE_ID valides — non vérifié par un test réel
- Le workspace sandbox reste suffisant en version Gratuite pour reproduire fidèlement le comportement prod Notion API — probable mais non testé
- La scission BACKLOG_DEV/USER résout l'ambiguïté de priorisation entre chantiers techniques et besoins utilisateur — pari organisationnel, pas encore éprouvé à l'usage
- PIPELINE P9 (score pertinence) éliminera le résidu 0.5/9 du test qualité DB — hypothèse v23, non encore vérifiée par code

---

## 4. Contraintes actives à respecter

**Techniques :**
- B09 exclu du pipeline automatique — règle absolue
- CONTEXT vXX injecté en B99 — règle absolue
- raw_text multi-lignes : ne pas toucher avant implémentation moteur sémantique V2
- retry_count : propriété à ajouter dans THREAD_DUMP (max 2 retries auto) — non encore implémentée, ne pas oublier
- .env.test ≠ .env prod — isolation totale à maintenir, ne jamais croiser les credentials
- Workspace sandbox = workspace Notion séparé — ne pas revenir sur une architecture page/sous-page

**Organisationnelles :**
- DS_ID = Data Source ID (identifiant API Notion) — ne jamais interpréter autrement
- Toute décision structurante → commitée dans le repo avant clôture de thread
- BACKLOG_DEV.md et BACKLOG_USER.md sont désormais les sources de vérité — BACKLOG.md est uniquement un index

**Règles non négociables :**
- DB INSIDE OS prime toujours sur sources externes (gravé dans PROMPT_ASSOCIE_v01)
- Architecture multi-agents : Agent Intégration IA au même niveau que agents spécialisés, pas sous L'Associé

---

## 5. Architecture actuelle

**Fonctionne :**
- Pipeline THREAD_DUMP → EXTRACT → INJECT : 94/94, stable
- DB Notion prod : 8.5/9 qualité, DECISIONS 3681, LESSONS 3136
- PROMPT_ASSOCIE_v01.md : committé, opérationnel
- BACKLOG_DEV.md + BACKLOG_USER.md + index : en place
- Fix désambiguïsation chat humain/agent : committé

**Fonctionne également :**
- .env.test : NOTION_API_KEY sandbox + ROOT_PAGE_ID testés et validés (node -e test OK en thread)
- DB Notion qualité : 9/9 sur dimension pertinence (P9 DONE)

**En apparence :**
- Workspace INSIDE-OS-SANDBOX : créé, vide — pas de structure DB interne

**Fragile :**
- Fin de thread non capturée automatiquement (P9 SYSTEME) — risque de perte de contexte à chaque clôture

**Manque :**
- Bases de données Notion dans workspace sandbox (THREAD_DUMP, DECISIONS, LESSONS)
- Script de peuplement sandbox pour tests pipeline isolés
- PIPELINE P9 : score pertinence minimum
- PIPELINE P10 : tag sémantique "agent" sur inject (le commit 6c14619 ne couvre que le chat)
- Agent Intégration IA : défini, non implémenté
- retry_count dans THREAD_DUMP : prévu, non implémenté
- Migration notion-memory-chat.mjs vers Claude : en attente post-ingestion complète

---

## 6. Contradictions et incohérences détectées

**Contradiction 1 — .env.test "modifié" sans confirmation :**
.env.test figure dans les fichiers modifiés mais le thread se termine en cours de configuration sandbox. L'état réel du fichier (credentials valides ou placeholders) n'est pas confirmé dans les données disponibles.

**Contradiction 3 — workspace sandbox vide vs objectif INFRA P5 :**
INFRA P5 dans le BACKLOG visait "workspace dédié + .env.test". Le workspace est créé et .env.test est modifié, mais sans les bases de données dans le sandbox, INFRA P5 n'est pas réellement "done" — juste partiellement avancé.

---

## 7. Illusions à démonter

**"La sandbox est prête"** — Non. Le workspace existe, l'intégration API est possiblement configurée, .env.test est modifié. Mais sans bases de données créées dans le workspace et sans test pipeline réel contre .env.test, la sandbox n'est pas opérationnelle.

**"P10 n'est pas traité"** — Faux. Le commit 6c14619 implémente la désambiguïsation associé humain vs agent IA dans le scoring chat (bloc P10 dans scoreItem). P10 est DONE dans le périmètre chat.

**"94/94 = système complet"** — Non. 94 threads injectés = pipeline fonctionnel sur le stock existant. Ça ne dit rien sur la qualité de filtrage (P9), le tagging sémantique (P10), la capture de fin de thread (P9 SYSTEME), ni la scalabilité cloud.

**"BACKLOG_DEV/USER suffit pour piloter"** — Pas encore. Les fichiers existent en v01 mais la discipline d'utilisation (qui priorise quoi, à quelle fréquence de révision) n'est pas encore définie ni éprouvée.

---

## 8. Risques structurants

**Technique — sandbox non testée :**
Si .env.test contient des credentials incorrects ou si les bases de données sandbox n'existent pas, le premier test pipeline sandbox plantera. Risque de perdre du temps en debug au lieu d'avancer sur P9/P10.

**Technique — résidu qualité DB :**
Le résidu 0.5/9 (résultat parasite sur lessons_learnings) reste en prod. Sans PIPELINE P9, L'Associé peut remonter des réponses techniques hors-sujet sur des requêtes RH. Impact direct sur la fiabilité perçue.

**Technique — fin de thread non capturée :**
P9 SYSTEME absent = chaque clôture de thread perd potentiellement des décisions et leçons du thread lui-même. Ce CONTEXT v24 compense manuellement, mais ce n'est pas scalable.

**Stratégique — dette de définition Agent Intégration IA :**
L'agent est défini sur le papier mais non implémenté. Plus l'architecture s'étend (P9, P10, sandbox, cloud), plus l'absence d'un gardien de cohérence des prompts/agents devient un vrai risque de divergence silencieuse.

**Faux pilotage — BACKLOG_DEV vs BACKLOG_USER sans arbitrage :**
Deux backlogs séparés sans règle d'arbitrage explicite entre priorités dev et priorités utilisateur peuvent créer une illusion de pilotage structuré alors que les décisions continuent d'être prises ad hoc en thread.

---

## 9. Fichiers produits dans ce thread

| Fichier | Chemin | Statut |
|---|---|---|
| BACKLOG_DEV.md v01 | /BACKLOG_DEV.md | Créé, committé (33bf20a) ✅ |
| BACKLOG_USER.md v01 | /BACKLOG_USER.md | Créé, committé (33bf20a) ✅ |
| BACKLOG.md (index) | /BACKLOG.md | Refactoré en index, committé (684b5ae) ✅ |
| .env.test | /.env.test | Modifié — contenu non confirmé opérationnel ⚠️ |
| INSIDE_OS_CONTEXT_v24.md | /docs/ | Produit dans ce thread — à committer ✅ |

**Manque explicite :** PRE_THREAD_B09-T36-Dev.md est référencé dans les fichiers modifiés du thread dump mais son contenu et son statut exact (créé / mis à jour / utilisé) ne sont pas confirmés dans les données disponibles.

---

## 10. Priorité réelle de redémarrage

**1 action :** Vérifier et finaliser la configuration sandbox — ouvrir .env.test, confirmer NOTION_API_KEY + ROOT_PAGE_ID sandbox, créer les bases de données THREAD_DUMP / DECISIONS / LESSONS dans INSIDE-OS-SANDBOX, lancer un test pipeline réel contre .env.test.

**1 livrable :** Sandbox opérationnelle = 1 thread de test injecté dans les DB sandbox sans toucher la prod.

**1 critère de succès :** `inject_done: 1` dans le workspace INSIDE-OS-SANDBOX, vérifié visuellement dans Notion sandbox, avec `inject_error: 0`.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé :**
- B09 exclu du pipeline automatique
- .env.test ≠ .env prod — isolation absolue
- raw_text multi-lignes : ne pas toucher
- DS_ID = Data Source ID, jamais autrement
- BACKLOG_DEV.md + BACKLOG_USER.md = sources de vérité BACKLOG

**À clarifier avant de toucher P9/P10 :**
- .env.test : credentials réels ou placeholders ? → vérifier en ouverture de thread
- Bases de données sandbox : existent-elles dans INSIDE-OS-SANDBOX ? → vérifier avant tout test

**À tester :**
- Pipeline complet contre .env.test sandbox (1 thread réel)
- Comportement Notion API sur workspace Gratuit vs prod

**À versionner dès que produit :**
- INSIDE_OS_CONTEXT_v24.md → commit avant clôture
- Toute modification .env.test → documenter dans PRE_THREAD suivant (pas dans .env.test lui-même)

---

## Point de redémarrage minimal

**Objectif :** Rendre la sandbox Notion opérationnelle pour tester le pipeline en isolation.
**Acquis :** Workspace INSIDE-OS-SANDBOX créé, .env.test modifié, BACKLOG scindé en DEV/USER, 94 threads en prod stables.
**Contraintes :** .env.test ne doit jamais croiser les credentials prod, B09 exclu du pipeline auto.
**État :** Sandbox à 60% — workspace existe, bases de données man