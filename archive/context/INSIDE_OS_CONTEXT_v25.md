# INSIDE_OS_CONTEXT_v25
Date : 2026-05-16

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T36 (session étendue) + T37 (nul)

**Statut : Stable — thread productif, clôture propre**
**Version : v25**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

**Source du STOP :** Décision humaine — clôture après accomplissement des objectifs de la session étendue.

**Ce que couvre ce CONTEXT :**
Ce CONTEXT v25 couvre deux threads :
- B09-T36 (session principale) : P9, P10, BACKLOG_DEV/USER v01, sandbox workspace
- B09-T37 (thread nul, non conservé) : cadrage agents, sécurité/backup, IDEAS.md, PROMPT MAITRE v13

**Décision structurelle :** B09-T37 est déclaré nul et non conservé. Ses acquis sont intégrés dans ce CONTEXT et dans les fichiers critiques mis à jour. Le thread T37 ne sera pas injecté en pipeline.

**Livrables finaux de la session :**
- PIPELINE P9 [DONE] — tokenizer diacritiques + MIN_SCORE=15 (commit 0fd15f6)
- PIPELINE P10 [DONE] — désambiguïsation associé humain vs agent IA (commit 6c14619)
- BACKLOG_DEV v03 — P12-P15 ajoutés, SYSTEME P2 mécanisme gravé
- BACKLOG_USER v03 — AGENTS P7/P8 ajoutés, P1 mis à jour v02
- PROMPT_ASSOCIE v02 — Agent Directeur des Achats (B03), Agent Classifieur, règle fiche différenciation
- PROMPT_MAITRE v13 — IDEAS.md/os:idea, fichiers critiques étendus, SYSTEME P2 Option A, sécurité
- README v12 — section Sécurité & Backup, VERIFY_PASS=always, push BACKLOG Notion en clôture
- CONTEXT v25 — ce document

---

## 1. Intention réelle du thread

**Objectifs réels :**
- B09-T36 : PIPELINE P9/P10 + BACKLOG_DEV/USER + sandbox Notion (partiellement)
- B09-T37 (nul) : cadrage agents supplémentaires + sécurité/backup + outillage inter-thread

**Problèmes résolus :**
- Qualité DB : résidu 0.5/9 éliminé (tokenizer + MIN_SCORE) → 9/9 pertinence
- Collision lexicale "associé" humain vs agent IA → désambiguïsée dans scoring
- BACKLOG unique → scindé DEV/USER avec index
- Architecture agents enrichie : Directeur des Achats, Classifieur Documents, règle fiche différenciation
- Cadrage sécurité/backup : items gravés dans BACKLOG_DEV, règles dans README et PROMPT MAITRE
- Pense-bête inter-thread IDEAS.md : décidé, à implémenter (SYSTEME P15)
- Fichiers critiques étendus : ingest-pass1/2, .env.example ajoutés à la liste

**Non résolu / repoussé :**
- Sandbox Notion : workspace créé, .env.test configuré, bases de données non créées — bloqué API dépréciée → ROADMAP après Supabase
- SYSTEME P2 : mécanisme décidé (Option A), non encore implémenté dans os-thread-close.mjs
- SYSTEME P9 : perte fin de thread — non résolu
- Agent Intégration IA : défini, non implémenté
- IDEAS.md + os:idea : décidé, non implémenté (SYSTEME P15)
- PIPELINE P12 : vérification .env.example — à faire en Claude Code

---

## 2. Acquis réels

**PIPELINE P9 — tokenizer + MIN_SCORE :**
- Bug corrigé : `.replace(/\p{Diacritic}/gu, " ")` → `""` dans normalizeText (notion-memory-chat.mjs)
- MIN_SCORE=15 ajouté dans notion-memory-chat.mjs et notion-memory-server.mjs
- Testé : requête RH passe de 6 items (4 parasites) à 2 items pertinents
- DB qualité : 9/9 sur dimension pertinence
- Commit 0fd15f6 ✅

**PIPELINE P10 — désambiguïsation associé :**
- Bloc P10 dans scoreItem : malus -20 si query "associé" sans "agent/IA" et item B09 hitté sur "associe"
- Validé : requête "mon associé" ne remonte plus les décisions sur L'Associé agent IA
- Commit 6c14619 ✅

**BACKLOG_DEV v03 :**
- P11 purge auto [TODO]
- P12 VERIFY_PASS [TODO]
- P13/P14/P15 nouveaux items systeme [TODO]
- INFRA P6/P7 backup + sécurité [TODO]
- SYSTEME P2 : mécanisme Option A gravé dans le libellé

**BACKLOG_USER v03 :**
- P1 : PROMPT_ASSOCIE_v02 référencé
- P7 : Agent Directeur des Achats — défini, à implémenter
- P8 : Agent Classifieur documents métier — défini, à implémenter

**PROMPT_ASSOCIE v02 :**
- Agent Directeur des Achats : B03, tag "achats", périmètre transverse F&A Capital
- Agent Fournisseurs : périmètre opérationnel chantier clarifié
- Agent Classifieur Documents : super-agent transversal, bucket B09
- Règle fiche de différenciation : standard obligatoire pour tout nouvel agent adjacent
- Fiche exemple Directeur des Achats vs Fournisseurs intégrée

**PROMPT_MAITRE v13 :**
- IDEAS.md + os:idea gravés comme protocole inter-thread
- Fichiers critiques étendus : ingest-pass1/2, .env.example ajoutés
- SYSTEME P2 Option A gravé : fichiers .md = source de vérité, Notion = miroir
- Section sécurité & credentials gravée
- VERIFY_PASS=always recommandé par défaut documenté

**README v12 :**
- Section Sécurité & Backup ajoutée
- Étape 9 clôture : push BACKLOG vers Notion
- VERIFY_PASS=always documenté
- Agent "achats" ajouté dans V3 roadmap

**Workspace sandbox :**
- INSIDE-OS-SANDBOX créé comme workspace Notion indépendant
- Intégration API créée et connectée à la page racine
- .env.test : NOTION_API_KEY + ROOT_PAGE_ID testés et validés (node test OK)
- Bases de données non créées — API /data_sources dépréciée → sandbox bloquée jusqu'à Supabase

**Pipeline prod :**
- 95 threads inject_done, 0 erreur, 0 pending
- DECISIONS : 3681 | LESSONS : 3136

---

## 3. Hypothèses, intentions, paris

- IDEAS.md sera utilisé régulièrement en thread → à valider à l'usage avant de scripter os:idea
- VERIFY_PASS=always est déjà le défaut dans .env.example → à vérifier en Claude Code (PIPELINE P12)
- La migration Supabase résoudra le blocage sandbox → probable mais non testé
- Agent Directeur des Achats en B03 est le bon positionnement → décidé, non éprouvé à l'usage
- La règle fiche différenciation agents sera respectée à chaque nouveau thread → discipline, pas encore automatisée
- OPTIONS A (push one-way BACKLOG → Notion) est le bon mécanisme → décidé, non encore implémenté ni testé

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
- .env.test ≠ .env prod — isolation totale, jamais croiser les credentials
- thread_summarized/ = archive permanente — ne jamais supprimer
- data_cemetery/ = gitignored, archive permanente
- B99 THREAD_DUMP = mémoire vivante — intouchable
- notion-memory-chat.mjs = claude-haiku-4-5 intentionnel (test uniquement)
- injection_status BLOCKED n'existe pas — threads bloqués = error + retry_count >= 2
- test_threads/ = ne jamais injecter en production thread_dump

**Routing datasource (PROMPT_ASSOCIE v02) :**
- Décisions stratégiques / architecturales → decisions_structural
- Leçons, retours d'expérience → lessons_learnings
- Contexte thread précis, historique → thread_dump

**Organisationnelles :**
- BACKLOG_DEV.md + BACKLOG_USER.md = sources de vérité — BACKLOG.md = index uniquement
- Fichiers .md repo = source de vérité BACKLOG — Notion = miroir lecture seule
- Tout nouvel agent adjacent → fiche différenciation obligatoire (PROMPT_ASSOCIE v02)
- DB INSIDE OS prime toujours sur sources externes (PROMPT_ASSOCIE v02)
- Agent Intégration IA = même niveau que agents spécialisés, pas sous L'Associé

**Versionning actif :**
- README : v12 | PROMPT : v13 | CONTEXT : v25
- PROMPT_ASSOCIE : v02 | BACKLOG_DEV : v03 | BACKLOG_USER : v03
- Prompts LLM actifs : ingest-pass1-v02 + ingest-pass2-v01

---

## 5. Architecture actuelle

**Fonctionne réellement :**
- Pipeline V2 complet + P1-P10 tous [DONE]
- os:pre-thread opérationnel
- 95 threads inject_done, 0 pending
- DB Notion : 9/9 qualité pertinence (P9/P10 DONE)
- PROMPT_ASSOCIE v02 : architecture agents complète documentée
- BACKLOG_DEV v03 + BACKLOG_USER v03 + index : en place
- README v12 + PROMPT_MAITRE v13 : à jour
- Workspace sandbox créé, .env.test validé

**Fragile :**
- Purge threads_to_process/ manuelle (P11 [TODO])
- Synchronisation BACKLOG → Notion manuelle (P2 [TODO])
- Fin de thread non capturée automatiquement (P9 SYSTEME [TODO])
- fix P8 jamais testé en conditions réelles (retry_count >= 2)

**Manque :**
- IDEAS.md + os:idea (P15 [TODO])
- Bases de données dans workspace sandbox
- SYSTEME P2 implémenté dans os-thread-close.mjs
- Agent Intégration IA (implémentation)
- Sous-agents V3
- PIPELINE P12 : vérification .env.example VERIFY_PASS
- INFRA P6/P7 : backup + sécurité

---

## 6. Contradictions et incohérences détectées

**BACKLOG_USER P7 libellé ambigu :**
L'item dit "Agent Directeur des Achats — à ajouter dans PROMPT_ASSOCIE" alors qu'il est déjà dans PROMPT_ASSOCIE v02. Le libellé a été corrigé dans v03 pour pointer vers l'implémentation.

**extraction_model résidu dans schéma Notion :**
Options gpt-4o-mini / gpt-4.1 présentes dans le schéma thread_dump — sans impact fonctionnel, mais incohérent avec la roadmap Claude uniquement.

**T37 nul mais fichiers produits :**
Les fichiers produits dans T37 (BACKLOG v02, PROMPT_MAITRE v12, PROMPT_ASSOCIE v02, README v12) sont valides et intégrés. Seul le thread lui-même est déclaré nul — les livrables sont conservés et versionés en v03/v13.

---

## 7. Illusions à démonter

**"95/95 = système complet"** — Non. Pipeline stable sur le stock existant. Sécurité, backup, fin de thread non capturée, sandbox non opérationnelle, agents non implémentés.

**"PROMPT_ASSOCIE v02 = agents opérationnels"** — Non. L'architecture est documentée. Aucun agent n'est implémenté — pas de code, pas de routing, pas de test comportement.

**"La sandbox est prête"** — Non. Workspace + .env.test validés. Sans bases de données Notion dans le sandbox, le pipeline ne peut pas tourner en isolation.

**"IDEAS.md va résoudre la perte d'idées"** — Pas encore. Le mécanisme est décidé, le fichier et la commande ne sont pas encore créés (SYSTEME P15 [TODO]).

---

## 8. Risques structurants

**Sécurité — .env non chiffré :**
La NOTION_API_KEY est en clair sur la machine locale. Si la machine est compromise, l'ensemble de la mémoire INSIDE OS est exposé. INFRA P7 [TODO] — à traiter en priorité dès le prochain thread Claude Code.

**Backup — data_cemetery/ non sauvegardé :**
95 threads en local uniquement, sans backup automatique. Perte machine = perte de toutes les sources brutes. INFRA P6 [TODO].

**Fin de thread non capturée :**
Chaque clôture perd potentiellement des décisions et leçons post-export. Compensé manuellement par ce CONTEXT, non scalable. P9 SYSTEME [TODO].

**Agent Intégration IA absent :**
L'architecture multi-agents s'étend (v02 : 16 agents + 3 super-agents) sans gardien de cohérence. Risque de divergence silencieuse entre prompts agents.

**T37 nul sans injection :**
Les décisions du thread T37 ne seront pas en mémoire Notion via pipeline standard. Ce CONTEXT v25 et les fichiers mis à jour compensent — mais la mémoire vivante B99 n'aura pas ces décisions sans injection manuelle.

---

## 9. Fichiers produits dans cette session

| Fichier | Chemin | Statut |
|---------|--------|--------|
| BACKLOG_DEV.md v03 | / racine | Produit — à commiter ✅ |
| BACKLOG_USER.md v03 | / racine | Produit — à commiter ✅ |
| BACKLOG.md (index) | / racine | Date mise à jour — à commiter ✅ |
| PROMPT_MAITRE_v13_TRANSFERT_DE_THREAD.md | docs/prompts transfert thread/ | Produit — à commiter ✅ |
| PROMPT_ASSOCIE_v02.md | docs/prompts/ | Produit (T37) — à commiter ✅ |
| README_INSIDE_OS_v12.md | docs/readme/ | Produit (T37) — à commiter ✅ |
| INSIDE_OS_CONTEXT_v25.md | docs/context/ | Ce document — à commiter ✅ |

**Fichiers T36 déjà committés :**
- notion-memory-chat.mjs + notion-memory-server.mjs (P9/P10) — commit 0fd15f6 + 6c14619 ✅
- BACKLOG_DEV v01 + BACKLOG_USER v01 — commit 33bf20a ✅
- BACKLOG.md index — commit 684b5ae ✅
- INSIDE_OS_CONTEXT_v24.md — commit bebf33f ✅
- PRE_THREAD_B09-T37.md + docs/pre-threads/ — committés ✅

---

## 10. Priorité réelle de redémarrage

**Action immédiate (B09-T37 — Claude Code) :**
1. Commiter tous les fichiers produits dans cette session (BACKLOG v03, PROMPT_MAITRE v13, PROMPT_ASSOCIE v02, README v12, CONTEXT v25)
2. Implémenter IDEAS.md + `npm run os:idea` (SYSTEME P15) — 30 min
3. Vérifier .env.example VERIFY_PASS=always (PIPELINE P12) — 5 min
4. PIPELINE P11 — purge automatique threads_to_process/ après inject réussi

**Critère de succès B09-T37 :**
Tous les fichiers critiques committés + IDEAS.md opérationnel + PIPELINE P11 implémenté.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé :**
- Protocole clôture 4 phases (PROMPT v13)
- injection_status=BLOCKED n'existe pas
- test_threads/ jamais en production
- os:pre-thread avant ouverture thread B09
- DB INSIDE OS prime toujours sur sources externes
- BACKLOG_DEV + BACKLOG_USER = sources de vérité, Notion = miroir
- Tout nouvel agent adjacent → fiche différenciation obligatoire

**À faire immédiatement en B09-T37 :**
- Commiter les fichiers de cette session
- Implémenter IDEAS.md + os:idea
- Vérifier VERIFY_PASS=always dans .env.example

**À ne pas ouvrir en B09-T37 :**
- Migration Supabase (thread dédié)
- Implémentation agents (thread dédié)
- Sécurité/backup (thread dédié après commit)

---

## Point de redémarrage minimal

- **Objectif** : commiter session + IDEAS.md + PIPELINE P11
- **Acquis** : pipeline V2 + P1-P10 stables, 95 inject_done, DB 9/9, PROMPT_ASSOCIE v02, BACKLOG v03, PROMPT_MAITRE v13, README v12
- **En attente** : sandbox (Supabase), SYSTEME P2 implémentation, P9 fin de thread, agents V3, backup/sécurité
- **Contraintes** : DS_IDs stables, CLAUDE_MODEL dans .env, B09 exclu auto, routing datasource gravé v02
- **Fragilités** : purge manuelle, fin de thread non capturée, backup absent, fix P8 non testé réel
- **Prochaine étape** : lancer os:pre-thread → uploader PRE_THREAD_B09-T37 + fichiers critiques → ouvrir B09-T37
