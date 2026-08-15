# INSIDE_OS_CONTEXT_v23
Date : 2026-05-15

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T35-Dev

**Statut : Stable — thread productif, clôture propre**
**Version : v23**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

**Source du STOP :** Décision humaine — clôture B09-T35 après accomplissement des objectifs du thread.

**Ce thread couvre :**
- Test qualité DB Notion — batterie 9 questions, 3 dimensions (pertinence, complétude, cohérence) → 6.5/9
- Corrections prompt → retest → 8.5/9 (9/9 nécessite code pipeline)
- PROMPT_ASSOCIE_v01.md produit, committé dans docs/prompts/ (commit f6dbe90) ✅
- Agent Intégration IA défini et ajouté à l'architecture ✅
- BACKLOG v35 produit — nouvelle section AGENTS créée ✅
- CONTEXT v23 produit ✅
- Sandbox Notion (INFRA P5) : décision prise, non encore implémentée

**Dérive empêchée :** BACKLOG_DEV/USER, purge automatique threads_to_process/, fix P8 test réel — repoussés au thread dédié.

---

## 1. Intention réelle du thread

**Objectif réel :** Test qualité DB Notion + cadrage L'Associé (PROMPT_ASSOCIE_v01).

**Problèmes résolus :**
- Qualité DB Notion validée à 8.5/9 avec corrections prompt
- Routing datasource gravé dans PROMPT_ASSOCIE_v01
- Désambiguïsation L'Associé (agent IA vs associé humain futur) gravée
- Architecture multi-agents complète documentée
- Agent Intégration IA défini et positionné

**Non résolu / repoussé :**
- PIPELINE P9/P10 (score pertinence, tag sémantique) → thread B09-Dev dédié
- Sandbox Notion → prochain thread
- BACKLOG_DEV/USER → thread dédié
- P9 SYSTEME (perte fin de thread) → thread dédié

---

## 2. Acquis réels

**Test qualité DB Notion :**
- Batterie 9 questions (3 pertinence / 3 complétude / 3 cohérence)
- Score initial : 6.5/9
- Score après corrections prompt : 8.5/9
- Résidu 0.5 : 1 résultat technique parasite sur lessons_learnings requête RH — nécessite code (PIPELINE P9)
- Faux positif Q9 corrigé par désambiguïsation requête ("super-agent copilote" vs "associé")

**PROMPT_ASSOCIE_v01.md :**
- Chemin repo : docs/prompts/PROMPT_ASSOCIE_v01.md
- Commit f6dbe90 — pushé ✅
- Contenu : définition L'Associé, mémoire vivante, sources externes, architecture multi-agents, niveaux de confirmation, ENTITIES, routing datasource, statut L'Associé
- Règle de priorité : DB INSIDE OS prime toujours sur sources externes
- Statut sources externes (injection vs ponctuel) : décision ouverte — SYSTEME P10

**Agent Intégration IA :**
- Domaine : conception, déploiement, orchestration agents IA dans INSIDE OS
- Bucket : B09
- Niveau : même niveau que agents spécialisés (pas sous L'Associé)
- Relations privilégiées : L'Associé (cohérence prompts) + Agent Infrastructure & Tech (cohérence technique)
- Rôle clé : gardien de la cohérence du réseau d'agents
- Statut : défini, non encore implémenté (BACKLOG AGENTS P2)

**BACKLOG v35 :**
- Nouvelle section AGENTS créée (P1-P6)
- PIPELINE P9/P10 ajoutés
- SYSTEME P10 ajouté
- AGENTS P1 [DONE] — PROMPT_ASSOCIE_v01 committé
- Miroir Notion : à synchroniser

**Architecture multi-agents (V3) :**
- 14 agents groupe F&A Capital
- 4 agents personnels Florent
- 3 super-agents transversaux : L'Associé, Agent Synthèse, Agent Intégration IA
- Deep probing inter-agents : décidé, non implémenté
- ENTITIES : décidé, non implémenté

---

## 3. Hypothèses, intentions, paris

- fix P8 jamais testé sur un thread réel avec retry_count >= 2 — aucun cas disponible
- Entités E01-E04 : architecture en place, données financières vides
- BACKLOG_DEV.md / BACKLOG_USER.md : décision prise, non encore créés
- Statut sources externes L'Associé (injection vs ponctuel) : décision ouverte
- Score pertinence minimum lessons_learnings : identifié, non implémenté
- Tag sémantique "agent" sur decisions_structural : identifié, non implémenté
- Sandbox Notion : décision prise (Option A), non encore créée

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

**Routing datasource (gravé PROMPT_ASSOCIE_v01) :**
- Décisions stratégiques / architecturales → decisions_structural
- Leçons, retours d'expérience → lessons_learnings
- Contexte thread précis, historique → thread_dump

**Protocoles :**
- Clôture thread B09 : séquence canonique 4 phases (PROMPT v11)
- os:pre-thread avant ouverture de chaque thread B09
- Purge manuelle threads_to_process/ après inject (automatisation au BACKLOG)
- BACKLOG = toute amélioration identifiée → BACKLOG.md + Notion miroir
- Toujours commiter avant --inject

**Versionning actif :**
- README : v11 | PROMPT : v11 | CONTEXT : v23 | BACKLOG : v35
- Prompts LLM actifs : ingest-pass1-v02 + ingest-pass2-v01
- PROMPT_ASSOCIE : v01

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement :**
- Pipeline V2 complet + P1-P8 tous [DONE]
- os:pre-thread opérationnel
- README v11 — zéro référence BLOCKED dans le repo
- 93 threads inject_done, 0 pending
- Repo propre
- BACKLOG v35 avec section AGENTS
- PROMPT_ASSOCIE_v01 committé — L'Associé cadré
- DB Notion validée à 8.5/9

**Ce qui reste fragile :**
- Purge threads_to_process/ manuelle
- Synchronisation BACKLOG.md ↔ Notion manuelle
- fix P8 jamais testé en conditions réelles
- BACKLOG_DEV / BACKLOG_USER non encore créés
- Fin de thread non capturée en mémoire Notion (P9 SYSTEME)
- Score pertinence lessons_learnings : 1 résidu parasite sur requêtes métier ciblées

**Ce qui manque :**
- BACKLOG_DEV.md + BACKLOG_USER.md
- Notion sandbox (INFRA P5)
- Script intégrité système (SYSTEME P7)
- PIPELINE P9/P10 (code)
- Agent Intégration IA (implémentation)
- Sous-agents spécialisés V3

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

**"8.5/9 = DB prête pour production L'Associé"**
Réalité : 8.5/9 valide la qualité données. L'Associé en production nécessite aussi le code pipeline (P9/P10) + sandbox testée.

**"Le fix P8 est validé donc le problème est résolu"**
Réalité : validé sur le schéma, jamais testé sur un cas réel de retry_count >= 2.

**"PROMPT_ASSOCIE_v01 = L'Associé opérationnel"**
Réalité : le prompt est gravé. L'implémentation (notion-memory-chat.mjs adapté, Agent Intégration IA, sous-agents) reste à faire.

---

## 8. Risques structurants

**fix P8 non testé en conditions réelles :**
Si un thread atteint retry_count >= 2, le comportement réel reste non observé.

**BACKLOG unique :**
Tant que BACKLOG_DEV / BACKLOG_USER ne sont pas créés, les priorités DEV et USER se mélangent.

**Purge threads_to_process/ manuelle :**
Risque de retraitement inutile à chaque clôture.

**Fin de thread non capturée :**
Les échanges post-export ne sont pas en mémoire Notion. CONTEXT v23 et os:pre-thread compensent partiellement.

**Sandbox absente :**
Tout test en écriture de L'Associé touche la prod — bloquant pour le test 2 (comportement beta).

---

## 9. Fichiers produits dans ce thread

| Fichier | Chemin | Statut |
|---------|--------|--------|
| PROMPT_ASSOCIE_v01.md | docs/prompts/ | En production — commit f6dbe90 ✅ |
| BACKLOG.md v35 | racine repo | Produit — à commiter |
| INSIDE_OS_CONTEXT_v23.md | docs/context/ | Ce document — à commiter |

---

## 10. Priorité réelle de redémarrage

**Actions immédiates (B09-T36) :**
1. Créer Notion sandbox (INFRA P5) — workspace dédié + .env.test (~20 min Claude Code)
2. PIPELINE P9 — score pertinence minimum lessons_learnings (code)
3. PIPELINE P10 — tag sémantique "agent" decisions_structural (code)
4. Créer BACKLOG_DEV.md + BACKLOG_USER.md
5. P9 SYSTEME — séquence de clôture capturant fin de thread

**Critère de succès B09-T36 :**
Sandbox opérationnelle + PIPELINE P9/P10 implémentés → DB Notion à 9/9.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé :**
- Protocole clôture 4 phases (PROMPT v11)
- injection_status=BLOCKED n'existe pas
- test_threads/ jamais en production
- os:pre-thread avant ouverture thread B09
- DB INSIDE OS prime toujours sur sources externes (L'Associé)

**À clarifier immédiatement en B09-T36 :**
- Sandbox Notion : création workspace manuel par Florent avant ouverture thread
- Statut sources externes L'Associé (injection vs ponctuel)

**À tester avant extension :**
- fix P8 en conditions réelles (simuler thread avec retry_count >= 2)
- L'Associé en lecture sur sandbox avant tout test écriture

---

## Point de redémarrage minimal

- **Objectif** : sandbox Notion + PIPELINE P9/P10 + BACKLOG_DEV/USER
- **Acquis** : pipeline V2 + P1-P8 stables, 93 inject_done, repo propre, README v11, os:pre-thread opérationnel, PROMPT_ASSOCIE_v01 committé, DB Notion validée 8.5/9, Agent Intégration IA défini
- **En attente** : sandbox Notion, PIPELINE P9/P10, BACKLOG_DEV/USER, P9 SYSTEME, Agent Intégration IA implémentation, sous-agents V3
- **Contraintes** : DS_IDs stables, CLAUDE_MODEL dans .env, B09 exclu auto, injection_status = pending/done/error uniquement, routing datasource gravé PROMPT_ASSOCIE_v01
- **Fragilités** : purge threads_to_process/ manuelle, fin de thread non capturée, BACKLOG non splitté DEV/USER, fix P8 non testé réel, sandbox absente bloque test beta
- **Prochaine étape** : Florent crée workspace Notion sandbox → lancer os:pre-thread → uploader PRE_THREAD_B09-T36.md → ouvrir B09-T36
