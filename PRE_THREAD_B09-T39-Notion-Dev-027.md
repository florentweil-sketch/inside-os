# PRE_THREAD — B09-TXX-Sujet
Date : 2026-05-17
Généré par : npm run os:pre-thread

---

## VERSIONS ACTIVES

| Document | Version | Emplacement |
|----------|---------|-------------|
| README          | v12         | docs/readme/ |
| PROMPT          | v13         | docs/prompts transfert thread/ |
| PROMPT ASSOCIE  | v2 | docs/prompts/associe/ |
| CONTEXT         | v28        | docs/context/ |
| BACKLOG         | inconnue        | BACKLOG.md |
| BACKLOG DEV     | v4    | BACKLOG_DEV.md |
| BACKLOG USER    | v4   | BACKLOG_USER.md |

---

## SNAPSHOT NOTION LIVE

- inject_done    : 97
- inject_pending : 0
- inject_error   : 0
- total          : 97

---

## DERNIER THREAD B09 TRAITÉ

- Nom    : B09-T38-Notion-Dev-026
- Date   : 2026-05-17
- Statut : done

---

## DIVERGENCES DÉTECTÉES

✅ Aucune divergence détectée — système aligné

---

## CONTEXT ACTIF (v28)

# INSIDE_OS_CONTEXT_v28
Date : 2026-05-17

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T38-Notion-Dev-026

**Statut : Stable**
**Version : v28**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Clôture volontaire fin de session B09-T38. Thread centré sur la définition de l'Agent Infrastructure & Tech. Aucun blocage technique. P11 suspendu délibérément une deuxième session consécutive — décision assumée, pas une dérive.

---

## 1. Intention réelle du thread

Objectif principal atteint : définir PROMPT_AGENT_INFRA_TECH_v02 — périmètre, prompt système, routing, fiche différenciation PROMPT_ASSOCIE. Commit b58a242 gravé.

Objectifs secondaires :
- fix(extract) : ANTHROPIC_API_KEY déclarée depuis process.env en haut de fichier — commit b9513b5 ✅
- IDEAS.md : idée [RAW] 2026-05-16 19:15 "test idee inter-thread" → DROPPED — commit db0f42b ✅
- BACKLOG_DEV P18 ajouté, BACKLOG_USER P7 ajouté — intégrés dans commit b58a242 ✅

Dérive empêchée : ne pas entrer dans l'implémentation du sous-pipeline 200 threads bruts sans que le prompt agent soit d'abord défini et commité. La définition précède l'exécution.

---

## 2. Acquis réels

**Commits produits dans ce thread (git log confirmé) :**

- `b9513b5` fix(extract) — ANTHROPIC_API_KEY déclarée depuis process.env en haut de fichier
- `db0f42b` chore(ideas) — DROPPED test idee inter-thread — revue fin B09-T38
- `b58a242` feat(agents) — PROMPT_AGENT_INFRA_TECH_v02 défini + BACKLOG_USER P7 + BACKLOG_DEV P18 + fiche différenciation PROMPT_ASSOCIE

**État pipeline confirmé à la clôture :**
- 97 threads | extract_done: 97 | inject_done: 97 | inject_pending: 0 | inject_error: 0
- DECISIONS : 3943 | LESSONS : 3359
- Différentiel vs v27 : +1 thread injecté, +21 DECISIONS, +16 LESSONS
- Aucun thread bloqué

**PROMPT_AGENT_INFRA_TECH_v02 — contenu gravé :**
- Périmètre : infrastructure technique INSIDE OS, pipeline Node.js, scripts, environnement, dépendances, déploiement
- Fiche différenciation PROMPT_ASSOCIE : distinction claire entre rôle Agent Infra (exécution technique, scripts, fix) et rôle Agent Intégration IA (stratégie, CONTEXT, décisions structurantes)
- BACKLOG_DEV P18 : sous-pipeline 200 threads bruts — défini, non implémenté
- BACKLOG_USER P7 : routing agent — défini, non implémenté

**Fix extract confirmé :**
- ANTHROPIC_API_KEY était référencée sans déclaration explicite depuis process.env en haut de fichier
- Correctif appliqué, commité b9513b5 — risque de régression silencieuse sur certains environnements éliminé

**IDEAS.md — état après clôture :**
- Idée [RAW] 2026-05-16 19:15 "test idee inter-thread" → DROPPED (test de fonctionnement, pas une idée réelle)
- IDEAS.md vide de contenu actionnable — état propre

**Acquis hérités stables, non modifiés dans ce thread :**
- PROMPT_MAITRE v13, README v12, PROMPT_ASSOCIE v02 — en repo, non touchés
- BACKLOG_DEV v04, BACKLOG_USER v04 — mis à jour dans b58a242
- Tokenizer diacritiques corrigé, MIN_SCORE=15 actif
- VERIFY_PASS=always dans .env.example — commit 62170f6, stable
- Fix cemetery v29bdb37 — stable
- Fix os:close 59a698a — stable, P9 partiel non rouvert ce thread

---

## 3. Hypothèses, intentions, paris

**Hypothèse 1 — PROMPT_AGENT_INFRA_TECH_v02 est suffisant pour démarrer le sous-pipeline.**
Non prouvé. Le prompt est défini et commité, mais il n'a pas encore été utilisé dans une session réelle de traitement de threads bruts. Le périmètre réel de l'agent se révélera à l'usage, pas à la définition.

**Hypothèse 2 — Le fix ANTHROPIC_API_KEY (b9513b5) ne casse rien.**
Non prouvé sur tous les environnements. Testé localement implicitement (pipeline à 97/97), mais aucun test explicite sur environnement vierge ou CI.

**Hypothèse 3 — P18 (sous-pipeline 200 threads bruts) est la prochaine priorité d'implémentation.**
Décision stratégique assumée dans b58a242. Mais les 200 threads bruts n'ont pas encore été caractérisés : format, qualité, homogénéité. L'implémentation pourrait révéler des cas non anticipés.

**Pari architectural — Agent Infra & Tech comme entité distincte de l'Architecte Continuité.**
Le pari est que la séparation des rôles (exécution technique vs stratégie de continuité) réduit les dérives de périmètre dans les sessions futures. Ce pari n'a pas encore été éprouvé sur la durée.

**P11 — suspendu deux threads consécutifs.**
Le risque n'est pas l'accumulation de fichiers (deux threads, non critique). Le risque est que la règle de conservation ne soit jamais tranchée parce qu'elle n'est jamais urgente. À surveiller : si threads_to_process/ dépasse 5 fichiers, P11 devient prioritaire par défaut.

---

## 4. Contraintes actives à respecter

**Techniques :**
- B09 exclu du pipeline automatique — ne jamais injecter les threads B09 via le pipeline standard
- CONTEXT vXX injecté en B99 — ne pas modifier ce routing
- raw_text multi-lignes : ne pas toucher avant V2 (moteur recherche sémantique) — contrainte gravée roadmap
- MIN_SCORE=15 actif — ne pas baisser sans décision explicite
- retry_count : propriété à ajouter dans THREAD_DUMP (max 2 retries auto sur inject_error) — non implémenté, ne pas oublier avant déploiement cloud
- VERIFY_PASS=always dans .env.example — ne pas régresser sur ce point

**Organisationnelles :**
- Toute décision structurante = commit avant fin de thread — règle absolue
- IDEAS.md : revue obligatoire en clôture de chaque thread — aucune idée [RAW] ne transite entre deux threads sans statut
- PROMPT_MAITRE v13 : posture confrontation active — signaler les dérives, pas les lisser

**Règles non négociables :**
- DS_ID = identifiant API Notion uniquement — ne jamais réinterpréter
- Aucune invention d'acronyme technique
- Aucun [À COMPLÉTER] dans les CONTEXT — si manque d'info, le nommer explicitement

---

## 5. Architecture actuelle

**Ce qui fonctionne :**
- Pipeline THREAD_DUMP → EXTRACT → INJECT : 97/97, 0 erreur, 0 pending
- Cemetery : mise à jour automatique si version enrichie, WARNING si régression
- os:close : confirmation ingest + fallback thread_summarized opérationnel
- os:idea : IDEAS.md alimenté depuis CLI, revue fin de thread opérationnelle
- ANTHROPIC_API_KEY : déclaration corrigée, plus de risque de référence implicite

**En apparence fonctionnel, non éprouvé :**
- PROMPT_AGENT_INFRA_TECH_v02 : défini, pas encore utilisé en session réelle
- Routing agent (BACKLOG_USER P7) : spécifié, non implémenté
- Sous-pipeline 200 threads bruts (BACKLOG_DEV P18) : backlogué, non démarré

**Fragile :**
- P9 partiel (os:close) : fix commité 59a698a mais libellé "partiel" — périmètre exact de ce qui reste à faire non documenté dans le CONTEXT v27 ni v28. Manque : définir précisément ce qui constitue "P9 complet"
- Fix ANTHROPIC_API_KEY : non testé sur environnement vierge

**Manque :**
- Caractérisation des 200 threads bruts (format, qualité, cas limites) — nécessaire avant implémentation P18
- Définition de "P9 complet" — sans cette définition, P9 restera éternellement "partiel"
- retry_count dans THREAD_DUMP — non implémenté, bloquant pour déploiement cloud robuste
- Migration notion-memory-chat.mjs vers Claude (actuellement GPT-4.1-mini) — en roadmap, non adressé

---

## 6. Contradictions et incohérences détectées

**Contradiction 1 — P9 "partiel" sans définition du complet.**
Le commit 59a698a est libellé "P9 partiel". Le BACKLOG_DEV SYSTEME P9 est en [TODO]. Mais nulle part dans le CONTEXT v27 ni dans les commits il n'est écrit ce que serait "P9 complet". On a un fix partiel d'un objectif dont la définition de complétion n'existe pas. Risque : P9 reste en [TODO] indéfiniment parce que personne ne sait ce qu'il faut pour le fermer.

**Contradiction 2 — Agent Infra défini avant que les threads bruts soient caractérisés.**
BACKLOG_DEV P18 (sous-pipeline 200 threads bruts) est ajouté dans le même commit que PROMPT_AGENT_INFRA_TECH_v02. L'agent est censé traiter ces threads. Mais les threads bruts n'ont pas été ouverts, examinés, ni leurs cas limites inventoriés. On a défini l'outil avant de connaître le matériau.

**Contradiction 3 — P11 suspendu pour "règle à définir", mais la règle n'a pas été tranchée ce thread.**
Le CONTEXT v27 disait "règle du dernier thread conservé à définir avant implémentation". Ce thread n'a pas défini cette règle. Le CONTEXT v28 suspend à nouveau sans décision. Si la règle est triviale (supprimer après inject réussi, pas d'exception), le blocage est artificiel.

---

## 7. Illusions à démonter

**Illusion 1 — "L'agent est défini donc le sous-pipeline peut démarrer."**
Définir un prompt n'est pas implémenter un pipeline. P18 nécessite du code, des tests, une gestion des cas limites sur 200 threads de qualité inconnue. Le commit b58a242 est un point de départ, pas une livraison.

**Illusion 2 — "97/97 inject_done = système sain."**
Le pipeline est stable sur le périmètre traité. Les 200 threads bruts non encore injectés représentent une masse inconnue. Le taux 97/97 ne dit rien sur ce qui arrive quand le volume double ou triple, ni sur les formats non encore vus.

**Illusion 3 — "P9 partiel n'est pas urgent."**
La perte de fin de thread (SYSTEME P9) touche directement la continuité entre sessions. Chaque thread clos sans résolution complète de P9 est un thread dont la clôture est partiellement défaillante. Ce n'est pas visible quand tout va bien. C'est visible quand une session se coupe mal.

**Illusion 4 — "La séparation Agent Infra / Architecte Continuité est claire."**
La fiche différenciation est écrite. Mais en pratique, dans une session réelle, la frontière entre "fix technique" et "décision structurante" est poreuse. Le test réel de cette séparation n'a pas encore eu lieu.

---

## 8. Risques structurants

**Risque 1 — P18 démarre sans caractérisation préalable des 200 threads bruts.**
Impact : cas limites non anticipés, pipeline cassé en production, retravail coûteux. Mitigation : ouvrir et inventorier un échantillon de threads bruts (10-15) avant d'écrire une ligne de code pour P18.

**Risque 2 — P9 "partiel" devient permanent par absence de définition de "complet".**
Impact : clôture de thread structurellement dégradée, perte de continuité non détectée. Mitigation : définir en 3 lignes ce que "P9 complet" signifie — critères, comportement attendu, test de validation.

**Risque 3 — Accumulation silencieuse dans threads_to_process/.**
Actuellement 2 fichiers. Si P11 n'est jamais adressé et le volume de threads actifs augmente, la détection de "ce qui reste à traiter" devient manuelle. Non critique aujourd'hui, potentiellement bloquant à 10+ fichiers.

**Risque 4 — Migration notion-memory-chat.mjs vers Claude non planifiée.**
L'outil tourne sur GPT-4.1-mini. Si OpenAI modifie son API, son pricing ou son comportement, la migration sera forcée en urgence. Planifier cette migration avant qu'elle soit contrainte.

**Risque 5 — Déploiement cloud sans retry_count dans THREAD_DUMP.**
En local, les inject_error sont gérés manuellement. En cloud, sans retry automatique, une erreur transitoire devient une perte silencieuse. retry_count est un prérequis bloquant pour le déploiement cloud, pas une option.

---

## 9. Fichiers produits dans ce thread

| Fichier | Chemin | Statut |
|---|---|---|
| PROMPT_AGENT_INFRA_TECH_v02 | docs/prompts/agent/PROMPT_AGENT_INFRA_TECH_v02.md | Commité b58a242 ✅ |
| BACKLOG_DEV.md | BACKLOG_DEV.md (racine repo) | Mis à jour b58a242 ✅ |
| BACKLOG_USER.md | BACKLOG_USER.md (racine repo) | Mis à jour b58a242 ✅ |
| IDEAS.md | IDEAS.md (racine repo) | Nettoyé db0f42b ✅ |
| extract script | os/extract/extract-thread-dump.mjs | Fix b9513b5 ✅ |
| PRE_

---

## BACKLOG ACTIF (inconnue)

# INSIDE OS — BACKLOG (INDEX)

Derniere mise a jour : 2026-05-16 (B09-T36)
Version : index

Ce fichier est un index. Les backlogs operationnels sont desormais separes :

---

## BACKLOG_DEV.md — Backlog technique

Pilote : Agent Infrastructure & Tech (B08/B09)
Sections : PIPELINE | INFRA | SYSTEME | UI DEV | REPO

-> [BACKLOG_DEV.md](BACKLOG_DEV.md)

---

## BACKLOG_USER.md — Backlog produit / usage

Pilote : L'Associe + agents metier (B01-B08)
Coordination technique : Agent Integration IA (B09)
Sections : AGENTS | MEMOIRE | UI USER

-> [BACKLOG_USER.md](BACKLOG_USER.md)

---

## LEGENDE

[TODO]    = priorite active
[ROADMAP] = decide, pas encore planifie
[DONE]    = implemente et valide

