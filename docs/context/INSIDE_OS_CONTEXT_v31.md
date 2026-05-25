# INSIDE_OS_CONTEXT_v31
Date : 2026-05-25

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T39-Notion-Dev-027

**Statut : Stable**
**Version : v31**
**Niveau de confiance : Élevé (tous les faits ci-dessous sont adossés au git log réel et au code inspecté, pas à un souvenir)**

---

## 0. Signal de continuité

STOP volontaire en fin de thread B09-T39, une seule clôture (contraste sain avec les 3 clôtures de B09-T38). Le thread devait implémenter P18 (sous-pipeline 200 threads) ; il a fait tout autre chose et c'est délibéré : il est devenu un thread de **consolidation infrastructure + réorientation stratégique**. THREAD_DUMP : extract_done=97, inject_done=97, inject_pending=0, inject_error=0. Compteurs Notion : DECISIONS 4042, LESSONS 3434 (inchangés — thread B09, hors pipeline). 9 commits produits et poussés (047b307 base → e71a572 HEAD, + commit requalif P9/P10).

**Trait dominant du thread :** quatre affirmations d'état fausses ont été démasquées par vérification (jamais par souvenir) — voir §6. La règle anti-hallucination gravée en début de thread (PROMPT_MAITRE v15) a été éprouvée quatre fois le même jour et a tenu à chaque fois. C'est l'acquis le plus important, plus que les correctifs eux-mêmes.

---

## 1. Intention réelle du thread

**Objectif déclaré au départ (CONTEXT v30) :** implémenter le sous-pipeline P18 (200 threads bruts).

**Ce qui s'est réellement passé — un pivot assumé :**
- P18 a été **DROPPED** (commit 732b91b). Raison : les 200 threads bruts sont de la data pour la mémoire vivante, sans impact structurel sur le système, et n'alignent pas le projet sur son but final (couche Action). Décision de Florent, gravée.
- Le thread a corrigé une fuite active (3 bugs os:pre-thread), tranché des points qui traînaient (P9, P11), gravé une règle anti-hallucination (PROMPT_MAITRE v15), créé le CLAUDE.md, clarifié une ambiguïté de scripts, durci la sûreté de la clôture, et réorienté le cap stratégique vers l'upgrade du pilotage.

**Dérives empêchées :**
- Empiler de la mémoire (P18) alors que la mémoire est déjà la partie qui marche le mieux et que l'Action reste vide.
- Graver des décisions (P9, migration pilotage) sur des souvenirs : tout a été vérifié dans le code avant gravure.
- Se laisser aspirer dans une grande passe d'alignement de 8 fichiers critiques en fin de thread.

---

## 2. Acquis réels

**9 commits confirmés (git log réel, ordre chronologique, base 047b307) :**

| Hash | Libellé |
|------|---------|
| 3e81397 | fix(pre-thread) — CONTEXT fail-loud (throw si dossier/0 fichier) + nom thread injecté dans le template |
| 1b35ca0 | feat(divergence) — détection 3 axes A/B/C + verdict anti-hallucination (ALIGNÉ = preuve positive) |
| ad8cc92 | chore(backlog) — P17 + P19 état réel après fix |
| 732b91b | chore(backlog) — P9 [DONE] + P11 tranché + P16 [DROPPED] + ajout P9b/P20/P21/P22 |
| 4582a88 | chore(backlog) — migration pilotage (USER P9) + Supabase reformulé INFRA P2 |
| 0f425cc | feat(prompt) — PROMPT_MAITRE v15 : règle anti-hallucination système |
| 6483f7f | chore(pre-thread) — régénération après PROMPT v15 + BACKLOG v05 |
| 9953998 | docs(claude) — CLAUDE.md initial (111 lignes, technique + doctrine condensée) |
| e71a572 | fix(close) — garde de sûreté os:close --inject : confirmation explicite avant écrasement B99 |
| (+ commit) | chore(backlog) — requalifie USER P9 (faux TODO migration) + ajoute P10 vérificateur prompt |

**Correctifs techniques validés :**
- **3 bugs os:pre-thread corrigés :** Bug 1 (sélection CONTEXT — fail-loud, plus de fallback silencieux ; le tri numérique était déjà correct), Bug 2 (nom thread `B09-TXX-Sujet` non injecté dans le template — faux DONE de P17 démasqué et corrigé), Bug 3 (faux « aucune divergence » — refondu en détection 3 axes A=fraîcheur CONTEXT / B=compteurs Notion / C=cohérence CONTEXT↔Notion live, verdict ALIGNÉ/DIVERGENCE/INDÉTERMINÉ).
- **Garde de sûreté os:close --inject (e71a572) :** confirmation explicite avant écrasement B99, affichant thread/version/source/action, distingue rename vs réinjection. La vérif d'existence du draft existait déjà en phase 7 (non redondée).
- **PROMPT_MAITRE v15 :** règle anti-hallucination système (aucun verdict positif par défaut ; check non exécuté = INDÉTERMINÉ ; toute affirmation traçable à une source vérifiée ; crash > silence).
- **CLAUDE.md créé :** prompt système persistant de Claude Code — règles opérationnelles courtes + renvois vers les sources (PROMPT_MAITRE v15, PROMPT_ASSOCIE v02, BACKLOG). Principe État/Doctrine appliqué au fichier lui-même.
- **Clarification pipeline.mjs vs os-thread-close.mjs :** pas des doublons (périmètres disjoints), tous deux actifs, documenté dans CLAUDE.md.

**Décisions structurantes tranchées :**
- **P9 [DONE]** — scope capture+append uniquement, vérifié dans le code (capturePostExport os-thread-close.mjs:382 + fs.appendFileSync ligne 662). Le bouclage Claude est P9b (séparé). Sortie définitive du « partiel indéfini ».
- **P11 [DONE]** — purge threads_to_process/ tranchée : ne plus re-suspendre, la détection 3 axes (P19) couvre le risque d'incohérence.
- **P16 + P18 (ancien sous-pipeline) [DROPPED]**.
- **Cap stratégique gravé :** priorité = couche Pilotage/Action, pas empiler de mémoire. Supabase (source d'état unique, P20) après migration pilotage, pas avant.
- **Nouveaux items :** P9b, P20 (source d'état unique État/Doctrine), P21 (statut DONE vérifiable), P22 (nettoyage CONTEXT antérieurs), USER P10 (vérificateur de prompt par modèle).

---

## 3. Hypothèses, intentions, paris

- **P20 (source d'état unique) est la vraie réponse à la dette des fichiers critiques** — non implémenté. Le thread a prouvé le besoin (8 fichiers critiques à aligner à la main, dont 3 d'état qui divergent), pas la solution. Pari : générer l'état au lieu de le saisir éliminera la divergence structurellement.
- **L'upgrade pilotage vers Opus 4.7 vaut son coût** — non prouvé. Opus 4.7 = 5/25 $ par M tokens + tokenizer 1,0-1,35× ; à benchmarker avant bascule. Pari : meilleure résistance aux fausses affirmations justifie le surcoût sur les tâches de raisonnement, avec routing adaptatif (Haiku/Sonnet/Opus selon complexité).
- **Le CLAUDE.md sera réellement lu et suivi par les futures sessions Claude Code** — c'est le mécanisme attendu (chargé au démarrage), observé fonctionnel dans ce thread (Claude Code a appliqué la doctrine sans qu'on la recolle), mais à confirmer dans la durée.
- **Les corrections os:close/os:pre-thread tiennent sur cycle réel** — VALIDÉ partiellement : l'os:close de clôture de ce thread s'est déroulé proprement (auto-incrément OK, pas de faux À COMPLÉTER, pas de troncature, Phase 4 divergence honnête). Premier cycle réel post-47e9361 réussi.

---

## 4. Contraintes actives à respecter

**Techniques :**
- B09 exclu du pipeline automatique — non négociable.
- CONTEXT vXX injecté en B99 uniquement.
- os:close --inject : garde de sûreté active (e71a572) — ne pas contourner.
- raw_text multi-lignes : ne pas toucher avant V2.
- MIN_SCORE=15 actif. VERIFY_PASS=always. DS_ID = Data Source ID Notion uniquement.
- retry_count (max 2 retries auto sur inject_error) : toujours non implémenté — prérequis bloquant déploiement cloud.

**Organisationnelles :**
- PROMPT_MAITRE v15 : fermer les points ouverts du CONTEXT avant l'objectif principal, sauf décision explicite contraire.
- Statut [DONE] adossé à une preuve (P21) — jamais par souvenir.
- Un point ouvert se tranche (fait ou DROPPED), ne se re-suspend pas.
- Modèles : ne pas ouvrir de nouveau chantier en segment final (P9/P10 routing = backlog, pas action de ce thread).

**Règles non négociables (doctrine) :**
- Aucune section [À COMPLÉTER] dans les livrables. Aucun acronyme inventé.
- Toute affirmation d'état traçable à une source vérifiée — anti-hallucination système.

---

## 5. Architecture actuelle

**Ce qui fonctionne (vérifié) :**
- Pipeline THREAD_DUMP → EXTRACT → INJECT : 97/97, 0 error, 0 pending.
- os:pre-thread : 3 bugs corrigés, détection 3 axes opérationnelle (vérifié au run).
- os:close : 3 bugs (47e9361) + garde de sûreté (e71a572), validés sur le cycle réel de clôture de ce thread.
- Pilotage : notion-memory-chat.mjs sur claude-haiku-4-5, notion-memory-server.mjs sur claude-sonnet-4-6 (CLAUDE_MODEL). **Migration OpenAI→Claude DÉJÀ FAITE** (vérifié code).
- CLAUDE.md : doctrine persistante active.
- PROMPT_MAITRE v15, BACKLOG_DEV/USER v05 : commités, poussés.

**En apparence fonctionnel, non éprouvé :**
- Routing modèle adaptatif (USER P9) : décidé, non implémenté.
- Vérificateur de prompt par modèle (USER P10) : défini, non implémenté.

**Fragile :**
- README v12 : DIVERGENT (voir §6). Contient de l'état périmé. À traiter dans un thread dédié (README v13), pas en urgence.
- os:close Phase 6 : génère le CONTEXT à partir d'un fichier de contenu de thread plafonné à 15000 chars, SANS vérifier que le contenu est complet. A produit un draft v31 massivement faux (généré sur fragment). Voir §6 et §8.

**Manque :**
- P20 (source d'état unique) : non démarré — vraie réponse à la dette des fichiers critiques.
- retry_count dans THREAD_DUMP : non implémenté.
- Couche Action : toujours inexistante. Aucun agent n'exécute encore.

---

## 6. Contradictions et incohérences détectées (les 4 hallucinations démasquées)

1. **PRE_THREAD obsolète / faux « aligné »** — le PRE_THREAD B09-T39 affichait CONTEXT v28 et « aucune divergence » alors que v30 était le dernier. Cause : fallback silencieux + détection de divergence aveugle à la fraîcheur. Corrigé (3e81397 + 1b35ca0).

2. **Faux [DONE] de P17** — l'auto-incrément du nom de thread était calculé et utilisé pour le nom de fichier mais jamais injecté dans le template (placeholder `B09-TXX-Sujet` en clair). Démasqué et corrigé.

3. **Faux TODO de P9 (migration pilotage)** — le CONTEXT v30 et BACKLOG_USER affirmaient « migration vers Claude non démarrée / tourne sur GPT-4.1-mini ». Vérification code : FAUX, déjà sur Claude (Haiku + Sonnet). P9 requalifié en routing adaptatif Opus 4.7. Le README v12 disait vrai sur ce point ; c'est le CONTEXT qui mentait.

4. **CONTEXT v31 draft auto-généré massivement faux** — l'os:close (Phase 6, 15000 chars) a produit un draft affirmant « P9 non tranché », « P18 prochain chantier », « script non corrigé », « 3 commits » — tout l'inverse de la réalité. Généré sur un fragment du thread, avec « Niveau de confiance : Élevé ». Ce CONTEXT v31 (rédigé manuellement) le remplace.

**Divergence README v12 (à traiter séparément) :** affirme `notion-memory-chat.mjs` sur Claude haiku (vrai) mais cite « PROMPT v12 + CONTEXT v25 » (périmé), ignore CLAUDE.md, la garde de sûreté os:close, le pivot. Mélange état périssable et doctrine — symptôme P20. Item à créer : README v13.

---

## 7. Illusions à démonter

- **« os:close génère le CONTEXT, donc le CONTEXT est fiable. »** Le draft auto-généré de ce thread était faux à 70 %. Un CONTEXT généré sur source incomplète, non vérifié, est un risque majeur — il porte le label « confiance élevée » tout en mentant.
- **« Le pipeline 97/97 = le système avance. »** État de stock, pas de flux. La couche Action reste vide. 97/97 ne dit rien sur le but final.
- **« La migration vers Claude est la prochaine étape. »** Elle est faite. L'illusion a failli coûter un thread entier à re-faire l'existant. La vraie étape est le routing Opus + l'Action.
- **« CLAUDE.md grave la doctrine, donc elle est appliquée. »** Observé fonctionnel ce thread, mais l'existence d'un fichier ne garantit pas son respect dans la durée — à surveiller.

---

## 8. Risques structurants

**Techniques :**
- **os:close Phase 6 génère sur contenu non vérifié** : un thread mal/non exporté produit un CONTEXT faux mais d'apparence confiante. Le plus grave risque actif — il touche la mémoire de continuité elle-même. Mitigation (à graver, voir §10) : vérifier la complétude du contenu avant génération ; si tronqué/absent → INDÉTERMINÉ et refus de générer.
- **Script os:pre-thread** : corrigé ce thread, mais à re-tester sur run réel au prochain pre-thread.
- **retry_count absent** : prérequis bloquant déploiement cloud.

**Stratégiques :**
- **Dette des fichiers critiques (8 fichiers, 3 d'état réconciliés à la main)** : chaque clôture paie une taxe d'alignement. P20 est la seule réponse structurelle ; tant qu'elle n'est pas faite, la taxe augmente.
- **Couche Action toujours vide** : tout le système est mémoire + pilotage embryonnaire. Le but final (agents qui exécutent) n'a aucun début d'implémentation.

**Faux pilotage :**
- **Compter les commits ou le 97/97 comme progression** : 9 commits ce thread, aucun ne touche la couche Action. Utile (consolidation, sûreté) mais à ne pas confondre avec l'avancement vers le but final.

---

## 9. Fichiers produits / modifiés dans ce thread

| Fichier | Chemin | Statut |
|---------|--------|--------|
| os/scripts/pre-thread.mjs | os/scripts/ | Modifié — 3 bugs corrigés (3e81397, 1b35ca0) |
| os-thread-close.mjs | racine | Modifié — garde de sûreté --inject (e71a572) |
| PROMPT_MAITRE_v15_TRANSFERT_DE_THREAD.md | docs/prompts transfert thread/ | Créé (0f425cc) |
| CLAUDE.md | racine | Créé, 111 lignes (9953998) |
| BACKLOG_DEV.md | racine | v05 — P9/P11 DONE, P16 DROPPED, P9b/P20/P21/P22 (732b91b, ad8cc92) |
| BACKLOG_USER.md | racine | v05 — P9 requalifié (routing Opus), P10 ajouté (4582a88 + commit requalif) |
| PRE_THREAD_B09-T39 | racine + docs/pre-threads/ | Régénéré (6483f7f) |
| INSIDE_OS_CONTEXT_v31.md | docs/context/ | Ce fichier — rédigé manuellement (le draft auto-généré était faux), à injecter |

---

## 10. Priorité réelle de redémarrage

**1 action :** graver l'item « os:close Phase 6 — vérifier complétude du contenu de thread avant génération CONTEXT ; si tronqué ou absent → INDÉTERMINÉ + refus de générer, jamais de génération sur fragment ». C'est le défaut le plus dangereux découvert (il corrompt la mémoire de continuité), et c'est le même motif anti-hallucination que tout le thread.

**1 livrable :** item gravé dans BACKLOG_DEV (SYSTEME), + CONTEXT v31 (ce fichier) injecté en B99 à la place du draft auto-généré.

**1 critère de succès :** aucun CONTEXT ne peut plus être généré et injecté à partir d'un contenu de thread incomplet sans signalement explicite.

**Ensuite (objectif B09-T40 proposé) :** premier pas vers la couche Action — soit l'upgrade pilotage Opus 4.7 + routing adaptatif (USER P9), soit un premier agent qui exécute. À trancher en ouverture selon l'envie de Florent (sortir du dev d'infra était son objectif explicite).

---

## 11. Discipline pour le prochain thread

**Socle verrouillé :**
- PROMPT_MAITRE v15 actif (anti-hallucination). CLAUDE.md actif.
- Pipeline 97/97 — ne pas toucher sauf régression.
- os:close --inject : garde de sûreté active — ne pas contourner.
- B09 exclu du pipeline. CONTEXT en B99 uniquement. DS_ID = identifiant Notion.

**À clarifier en ouverture de B09-T40 :**
- Choix de l'objectif : upgrade pilotage Opus (USER P9) vs premier agent qui exécute. Florent veut sortir du dev d'infra — orienter vers l'Action.
- Statut README : créer item README v13 (purger l'état périmé, aligner sur le cap actuel).

**À tester :**
- os:pre-thread sur run réel (les 3 bugs corrigés) — le prochain PRE_THREAD doit sortir propre du premier coup (CONTEXT à jour, nom résolu, divergence honnête).

**À versionner :**
- Ce CONTEXT v31 en clôture, AVANT tout démarrage de B09-T40.
- Caveat UX P9 à noter (première ligne vide ferme la capture post-export sans avertissement) — non bloquant, à garder en vue.

---

## Point de redémarrage minimal

**Objectif B09-T40 (proposé) :** premier mouvement réel vers la couche Action — upgrade pilotage Opus 4.7 + routing adaptatif (USER P9), ou premier agent exécutant. Sortir du dev d'infra.
**Acquis :** pipeline 97/97, os:pre-thread + os:close corrigés et durcis, PROMPT_MAITRE v15 + CLAUDE.md actifs, pilotage déjà sur Claude (Haiku/Sonnet), 4 hallucinations système démasquées et corrigées.
**Contraintes :** graver d'abord la garde os:close Phase 6 (contenu complet avant génération). README v13 à planifier. retry_count toujours absent.
**État :** P9 [DONE], P11 [DONE], P16/P18 [DROPPED], P20/P21/P22 ouverts, couche Action vide.
**Prochaine étape :** injecter ce CONTEXT v31 (manuel, le draft auto-généré était faux) → graver item os:close Phase 6 → ouvrir B09-T40 sur l'Action.
