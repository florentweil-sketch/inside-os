# INSIDE_OS_CONTEXT_v29
Date : 2026-05-17

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T38-Notion-Dev-026

**Statut : Stable**
**Version : v29**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Clôture volontaire fin de session B09-T38 — deuxième clôture du même thread (v28 → v29). Le THREAD_DUMP final confirme : extract_done=97, inject_done=97, inject_pending=0, inject_error=0. Compteurs Notion : DECISIONS 3979 (+36 vs v28), LESSONS 3386 (+27 vs v28). Différentiel cohérent avec un thread actif. Commits récents : 47e9361 (fix 3 bugs clôture), c572b41 (clôture B09-T38 + CONTEXT v28 injecté), b9513b5 (fix extract ANTHROPIC_API_KEY). PRE_THREAD B09-T39 déjà généré.

---

## 1. Intention réelle du thread

**Objectif principal atteint :** définir PROMPT_AGENT_INFRA_TECH_v02 — périmètre, prompt système, routing, fiche différenciation PROMPT_ASSOCIE. Commit b58a242 gravé en session précédente.

**Objectifs secondaires atteints :**
- fix(extract) : ANTHROPIC_API_KEY déclarée depuis process.env — b9513b5 ✅
- IDEAS.md : idée [RAW] "test idee inter-thread" → DROPPED — db0f42b ✅
- BACKLOG_DEV P18 + BACKLOG_USER P7 ajoutés — b58a242 ✅
- 3 bugs clôture corrigés — 47e9361 ✅ (auto-incrément thread, faux positif À COMPLÉTER, troncature CONTEXT)

**Dérive empêchée :** implémenter le sous-pipeline 200 threads bruts avant que le prompt agent soit défini. La définition a précédé l'exécution.

**Dérive empêchée (session finale) :** ouvrir un nouveau chantier en fin de thread au lieu de produire le CONTEXT v29 proprement.

---

## 2. Acquis réels

**Commits produits dans ce thread (ordre chronologique, confirmés) :**

| Hash | Libellé |
|------|---------|
| b9513b5 | fix(extract) — ANTHROPIC_API_KEY déclarée depuis process.env en haut de fichier |
| db0f42b | chore(ideas) — DROPPED test idee inter-thread |
| b58a242 | feat(agents) — PROMPT_AGENT_INFRA_TECH_v02 + BACKLOG_USER P7 + BACKLOG_DEV P18 + fiche différenciation |
| c572b41 | chore(close) — clôture B09-T38, CONTEXT v28 injecté, fix extract ANTHROPIC_API_KEY |
| 47e9361 | fix(scripts) — 3 bugs clôture : auto-incrément thread, faux positif À COMPLÉTER, troncature CONTEXT |

**PROMPT_AGENT_INFRA_TECH_v02 — contenu gravé :**
- Périmètre : infrastructure technique INSIDE OS, pipeline Node.js, scripts, environnement, dépendances, déploiement
- Distinction opérationnelle : Agent Infra = exécution technique, scripts, fix / Agent Intégration IA = stratégie, CONTEXT, décisions structurantes
- BACKLOG_DEV P18 : sous-pipeline 200 threads bruts — défini, non implémenté
- BACKLOG_USER P7 : routing agent — défini, non implémenté

**3 bugs clôture corrigés (47e9361) :**
- Auto-incrément thread : le script os:close ne produisait pas le bon numéro de thread suivant
- Faux positif À COMPLÉTER : le détecteur signalait des occurrences dans du contenu légitimement vide
- Troncature CONTEXT : le CONTEXT était coupé au-delà d'une certaine taille lors de l'injection

**État pipeline à la clôture :**
- 97 threads | extract_done: 97 | inject_done: 97 | inject_pending: 0 | inject_error: 0
- DECISIONS : 3979 | LESSONS : 3386
- Aucun thread bloqué

**PRE_THREAD B09-T39 généré** et commité. Fichier présent : PRE_THREAD_B09-T39-Notion-Dev-027.md

---

## 3. Hypothèses, intentions, paris

**Hypothèse non vérifiée :** les 3 bugs clôture corrigés en 47e9361 sont réellement résolus sans régression. Le commit est présent mais aucune exécution de os:close n'a été lancée après ce fix dans ce thread pour confirmer. Le prochain os:close (clôture de B09-T39) sera le premier test réel.

**Pari :** PROMPT_AGENT_INFRA_TECH_v02 est suffisamment précis pour que le routing agent fonctionne en pratique. Non testé — aucun thread réel n'a été routé via cet agent.

**Intention non actée :** sous-pipeline 200 threads bruts (BACKLOG_DEV P18) — défini, pas implémenté. L'implémentation est le sujet naturel du prochain thread ou d'un thread dédié Agent Infra.

**P11 suspendu deux sessions consécutives** — décision délibérée, pas une dérive. La purge auto de threads_to_process/ reste en [TODO]. Deux fichiers présents : B09-T36 et B09-T37. Ils ne bloquent rien.

---

## 4. Contraintes actives à respecter

**Techniques :**
- B09 exclu du pipeline automatique — ne jamais injecter les threads B09 via le pipeline standard
- CONTEXT vXX injecté en B99 uniquement
- MIN_SCORE=15 actif — seuil de qualité extraction LLM
- VERIFY_PASS=always actif — vérification systématique après inject
- raw_text multi-lignes : ne pas toucher avant V2 (moteur recherche sémantique)
- retry_count : propriété à ajouter dans THREAD_DUMP (max 2 retries auto) — non implémentée, ne pas oublier
- data/test_threads/ : 4-5 fichiers max — ne pas laisser grossir

**Organisationnelles :**
- DS_ID = Data Source ID (identifiant API Notion) — ne jamais interpréter autrement
- Définition avant implémentation — le prompt agent précède le sous-pipeline
- P11 (purge auto) : ne pas implémenter sans décision explicite sur la règle de conservation
- IDEAS.md : revue obligatoire en fin de chaque thread

**Règles non négociables :**
- Aucun commit sans test local préalable sur les scripts modifiés
- CONTEXT versionné et commité à chaque clôture
- PRE_THREAD généré avant fermeture du thread

---

## 5. Architecture actuelle

**Ce qui fonctionne :**
- Pipeline THREAD_DUMP → EXTRACT → INJECT : stable, 97/97 sans erreur
- Tokenizer diacritiques : corrigé, stable
- os:idea : opérationnel, IDEAS.md propre
- os:close : 3 bugs corrigés en 47e9361 — fonctionnement attendu mais non retesté post-fix
- PROMPT_AGENT_INFRA_TECH_v02 : défini et commité

**En apparence stable, non vérifié en profondeur :**
- Le fix troncature CONTEXT (47e9361) — le mécanisme d'injection du CONTEXT dans Notion n'a pas été retesté avec un CONTEXT volumineux après le fix
- Routing agent — décrit dans PROMPT_ASSOCIE v02 mais aucune implémentation concrète du routage automatique

**Fragile :**
- os:close post-fix (47e9361) : premier test réel = clôture B09-T39
- Migration notion-memory-chat.mjs : toujours sur OpenAI GPT-4.1-mini, non migrée vers Claude — risque de dérive si les clés OpenAI expirent ou si le comportement GPT-4.1-mini change

**Manque :**
- Sous-pipeline 200 threads bruts : non implémenté (BACKLOG_DEV P18)
- Routing agent concret : non implémenté (BACKLOG_USER P7)
- retry_count dans THREAD_DUMP : non implémenté
- Purge auto threads_to_process/ : non implémentée (P11 suspendu)
- Déploiement cloud : non démarré — conditionné à l'ingestion complète des threads restants

---

## 6. Contradictions et incohérences détectées

**Contradiction P9 :**
- P9 marqué DONE dans CONTEXT v26 (commit 0fd15f6, périmètre tokenizer)
- Commit 59a698a libellé "P9 partiel" dans B09-T37 (périmètre os:close, séquence confirmation ingest)
- BACKLOG_DEV SYSTEME P9 statut [TODO] — "résoudre perte fin de thread"
- Conclusion : deux P9 distincts coexistent sans séparation formelle dans le BACKLOG. Le P9 SYSTEME reste ouvert. Le libellé "P9 partiel" du commit 59a698a désigne une correction partielle sur os:close, distincte du P9 tokenizer. Aucune résolution formelle dans ce thread.

**Incohérence BACKLOG_DEV vs BACKLOG_USER :**
- P18 (sous-pipeline) et P7 (routing) sont définis mais le BACKLOG ne précise pas la dépendance entre eux. Le routing (P7) dépend logiquement du sous-pipeline (P18) mais cette dépendance n'est pas formalisée.

**Incohérence version :**
- PRE_THREAD B09-T39 est libellé "Notion-Dev-027" — le suffixe numérique suit une séquence propre (026→027) cohérente avec l'historique. Pas une erreur, mais la double numérotation (T39 / 027) peut induire en erreur lors de références croisées.

---

## 7. Illusions à démonter

**"Le pipeline est stable donc tout va bien."**
97/97 inject_done ne signifie pas que la qualité des extractions est homogène. MIN_SCORE=15 filtre les pires cas mais aucun audit qualitatif sur les 97 threads injectés n'a été fait. On ne sait pas combien de DECISIONS ou LESSONS sont de faible pertinence.

**"PROMPT_AGENT_INFRA_TECH_v02 est opérationnel."**
Il est défini et commité. Il n'est pas opérationnel tant que le routing n'est pas implémenté et qu'aucun thread réel ne lui a été soumis.

**"P11 peut attendre indéfiniment."**
Deux sessions consécutives de suspension délibérée sont justifiables. Une troisième commence à ressembler à de l'évitement. La règle de conservation est simple à trancher (ex : conserver 0 ou 1 fichier après inject réussi). L'implémentation elle-même est courte.

**"Les 3 bugs clôture sont résolus."**
Commit présent ≠ bugs résolus en production. Le prochain os:close est le vrai test.

---

## 8. Risques structurants

**Technique — os:close non retesté post-fix :**
Le commit 47e9361 corrige 3 bugs structurels de clôture. Si un bug subsiste ou si le fix introduit une régression, la clôture de B09-T39 sera défaillante. Mitigation : lancer os:close en dry-run ou tester sur un thread de test avant la vraie clôture.

**Technique — troncature CONTEXT :**
Le bug de troncature était silencieux (le CONTEXT était injecté mais incomplet dans Notion). Si le fix n'est pas complet, les prochains CONTEXT injectés seront tronqués sans signal d'erreur visible. Risque de dégradation progressive de la mémoire Notion.

**Technique — migration OpenAI → Claude bloquée :**
notion-memory-chat.mjs tourne sur GPT-4.1-mini. Le déploiement cloud est conditionné à l'ingestion complète. Si les clés OpenAI expirent ou si le modèle est déprécié avant la migration, la fonctionnalité de chat mémoire tombe sans plan de secours documenté.

**Stratégique — sous-pipeline 200 threads bruts :**
P18 défini mais non implémenté. Les 200 threads bruts (hors B09) représentent le volume principal de mémoire non encore injecté. Chaque thread supplémentaire B09 sans ingestion des bruts augmente le déséquilibre entre mémoire de dev et mémoire opérationnelle dans Notion.

**Faux pilotage — compteurs DECISIONS/LESSONS :**
3979 DECISIONS, 3386 LESSONS sont des compteurs bruts. Aucun indicateur de pertinence, de doublons, de dégradation qualité. Le tableau de bord donne une impression de santé qui ne repose sur aucune vérification qualitative.

---

## 9. Fichiers produits dans ce thread

| Fichier | Statut |
|---------|--------|
| docs/prompts/agent/PROMPT_AGENT_INFRA_TECH_v02.md | Créé, commité (b58a242) |
| BACKLOG_DEV.md (v05 implicite, P18 ajouté) | Modifié, commité (b58a242) |
| BACKLOG_USER.md (v05 implicite, P7 ajouté) | Modifié, commité (b58a242) |
| PROMPT_ASSOCIE_v02.md (fiche différenciation ajoutée) | Modifié, commité (b58a242) |
| IDEAS.md (idée DROPPED) | Modifié, commité (db0f42b) |
| scripts/extract.mjs (fix ANTHROPIC_API_KEY) | Modifié, commité (b9513b5) |
| scripts/close.mjs ou équivalent (fix 3 bugs clôture) | Modifié, commité (47e9361) |
| INSIDE_OS_CONTEXT_v28.md | Créé, commité (c572b41), injecté en B99 |
| PRE_THREAD_B09-T38-Notion-Dev-026.md | Modifié (docs/pre-threads/ + racine) |
| PRE_THREAD_B09-T39-Notion-Dev-027.md | Créé, commité |
| INSIDE_OS_CONTEXT_v29.md | Produit dans cette session — à commiter |

**Manque d'info explicite :** le chemin exact du script de clôture modifié par 47e9361 n'est pas confirmé dans les données fournies. Libellé du commit suffit pour traçabilité mais le fichier exact n'est pas nommé ici.

---

## 10. Priorité réelle de redémarrage

**1 action :** vérifier le comportement de os:close post-fix (47e9361) sur un thread de test ou via le prochain os:close réel B09-T39.

**1 livrable :** clôture propre de B09-T39 avec confirmation que les 3 bugs (auto-incrément, faux positif À COMPLÉTER, troncature CONTEXT) ne se reproduisent pas.

**1 critère de succès :** git log après clôture B09-T39 montre le bon numéro de thread suivant (T40), aucun faux positif À COMPLÉTER signalé, CONTEXT v29 injecté sans troncature dans Notion.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé :**
- Pipeline 97/97 stable — ne pas toucher sans raison
- PROMPT_AGENT_INFRA_TECH_v02 défini — référence pour le sous-pipeline P18
- MIN_SCORE=15, VERIFY_PASS=always, B09 exclu pipeline auto — règles non négociables

**À clarifier en ouverture de B09-T39 :**
- Confirmer visuellement que os:close fonctionne correctement (log du close + vérif Notion)
- Trancher P9 SYSTEME : est-ce un P9 distinct à renommer formellement dans le BACKLOG ?

**À tester :**
- os:close post-fix 47e9361 — premier test réel à la clôture de B09-T39

**À versionner :**
- CONTEXT v29 (ce fichier) — commiter immédiatement après production
- Si BACKLOG_DEV/USER ont été versionnés implicitement en v05 dans b58a242, vérifier que le header de version est à jour dans les fichiers

**À ne pas ouvrir sans décision explicite :**
- P11 (purge auto) : trancher la règle de conservation avant d'implémenter — ne pas glisser dans l'implémentation sans la décision
- Sous-pipeline P18 : ne pas commencer sans confirmer que os:close fonctionne d'abord

---

## Point de redémarrage minimal

**Objectif :** démarrer B09-T39 sur base saine et implémenter le sous-pipeline 200 threads bruts (P18).
**Acquis :** PROMPT_AGENT_INFRA_TECH_v02 défini, pipeline 97/97 stable, 3 bugs clôture corrigés (non retestés).
**Contraintes :** B09 exclu pipeline auto, MIN_SCORE=15 actif, définition avant implémentation.
**État :** PRE_THREAD B09-T39 généré, CONTEXT v29 à commiter, os:close non retesté post-fix.
**Prochaine étape :** ouvrir B09-T39 → vérifier os:close → si OK, attaquer P18 sous-pipeline.