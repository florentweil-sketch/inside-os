# INSIDE_OS_CONTEXT_v32
Date : 2026-05-25

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T40-Notion-Dev-028

**Statut : Stable**
**Version : v32**
**Niveau de confiance : Élevé (faits adossés au git log réel et à un inventaire DB Notion à la source, pas à un souvenir ; CONTEXT rédigé manuellement car le draft auto-généré par os:close Phase 6 n'est pas fiable — bug P23 connu)**

---

## 0. Signal de continuité

STOP volontaire en fin de thread B09-T40. Le thread a fait deux choses : (1) consolidé l'infra et la doctrine (geste infra du thread, dans le respect de la nouvelle borne P25), (2) produit une découverte majeure par diagnostic à la source — la mémoire contient déjà du business, contrairement à ce qui était supposé. THREAD_DUMP : extract_done=97, inject_done=97, 0 pending, 0 error. Compteurs Notion : DECISIONS 4042, LESSONS 3434. 6 commits T40 poussés (d11b384 → 121973d) + commit IDEAS de clôture. CONTEXT précédent : v31 (B09-T39).

**Note de méthode marquante :** ce thread a aussi été l'occasion de vivre, de l'intérieur, le problème que le système a avec le suivi de son propre état — confusion sur quel thread était actif (deux fils Claude en parallèle sur le même repo). Résolu par la même discipline que la doctrine grave : regarder la source (git log) au lieu de supposer. Aucune divergence réelle : un seul repo, une seule branche, historique linéaire. Validation vivante de P20/P21.

---

## 1. Intention réelle du thread

**Objectif d'ouverture :** sortir du dev d'infra vers la couche Action (upgrade pilotage Opus / routing, ou premier agent qui exécute).

**Ce qui s'est réellement passé :**
- Geste infra du thread accompli : PROMPT_MAITRE v16 (règle granularité des commits), Infra-Tech v03 (retrait de l'état figé, premier geste P20), BACKLOG v06 (P23/P24/P25 gravés), Agent Synthèse cadré (prompt + spec, NON implémenté).
- Borne P25 gravée : après le geste infra, pas de nouveau chantier infra tant qu'un agent n'a pas produit de valeur entreprise. Mécanisme anti-tunnel.
- Puis un diagnostic à la source qui a renversé une hypothèse de travail : la mémoire n'est PAS dev-only, elle contient du business.

**Dérive empêchée :** avoir conclu (deux fois) « la mémoire ne contient que du dev » sur la foi de requêtes chat mal ciblées. La vérification à la source (inventaire DB) a prouvé le contraire. Anti-hallucination appliqué au diagnostic lui-même.

---

## 2. Acquis réels

**6 commits T40 confirmés (git log, ordre chronologique) :**

| Hash | Libellé |
|------|---------|
| d11b384 | feat(prompt) — PROMPT_MAITRE v16 : règle granularité des commits |
| 1ed4768 | docs(claude) — CLAUDE.md pointeur latest=v16 + retrait mention GPT-4.1-mini |
| d108362 | refactor(prompt-agent) — Infra-Tech v03 : retrait état figé, renvoi sources vivantes (P20 geste 1) |
| 5a73cb9 | chore(backlog) — BACKLOG_DEV v06 : P23 (os:close Phase 6) + P24 (pre-thread ÉTAPE 3) + P25 (borne tunnel infra) + trace P20 |
| 36ebbd8 | feat(agent-synthese) — PROMPT_AGENT_SYNTHESE v01 + SPEC v01 (doctrine premier agent de pilotage) |
| 121973d | chore(backlog) — BACKLOG_USER v06 : P11 Agent Synthèse (Pilotage, pas Action) |
| (+ commit) | chore(ideas) — 5 découvertes diagnostic mémoire B09-T40 |

**Doctrine :**
- **PROMPT_MAITRE v16** : granularité des commits — un geste cohérent = un commit, jamais de fourre-tout (l'historique git fait partie des affirmations d'état ; corollaire de l'anti-hallucination). v15 conservé.
- **Infra-Tech v03** : l'état chiffré périssable (96 threads / v04) retiré du prompt, remplacé par renvoi vers la source vivante. Premier geste concret de P20 (séparation État/Doctrine). v02 conservé.
- **P11 corrigé** : Agent Synthèse = premier agent de **Pilotage** (lecture seule), PAS de l'Action. Correction d'une fausse affirmation (« couche Action ») gravée.

**Backlog :**
- **P23** (os:close Phase 6, priorité haute) : génère le CONTEXT sur contenu tronqué non vérifié — corrompt la mémoire de continuité.
- **P24** (os:pre-thread ÉTAPE 3) : détecte le mauvais « dernier thread » (a affiché T38 après clôture T39). Contournement : --next explicite.
- **P25** (BORNE DE SORTIE DU TUNNEL INFRA) : pas de nouveau chantier infra tant qu'un agent n'a pas produit de valeur entreprise. Question à se reposer chaque thread.
- **P20** : note d'amorce (Infra-Tech v03 = premier geste), reste [TODO] (principe à généraliser).

**Agent Synthèse cadré (NON implémenté) :** prompt + spec dans docs/prompts/synthese/. Lecture seule, autonome, zéro écriture Notion, citations obligatoires, fail-loud. Code (run.mjs + synthese.mjs) PAS écrit.

---

## 3. LA DÉCOUVERTE MAJEURE — la mémoire contient du business

Inventaire DB Notion à la source (script lecture seule, jeté après) :

**Répartition par bucket source :**
| Bucket | DECISIONS | LESSONS | Domaine |
|--------|-----------|---------|---------|
| B09 | 2722 | 2259 | Dev INSIDE OS |
| B03 | 418 | 374 | F&A Capital — holding & stratégie |
| B02 | 252 | 207 | Inside SAS — bâtiment & opérations |
| B05 | 169 | 131 | Marketing & communication |
| B99 | 115 | 79 | Présent vivant (dont 27 items B99-T99 = pollution, voir §4) |
| B06 | 100 | 105 | Juridique & fiscal |
| B01 | 99 | 96 | Florent — personnel |
| B04 | 95 | 101 | Elior — corporate |
| B08 | 37 | 43 | Infrastructure perso |
| B07 | 35 | 39 | Chantiers terrain |

**~2300 items business (B01-B08).** Termes business présents : « chantier » (186 déc), « client » (84), « INSIDE SAS » (95), « F&A Capital » (77), « Atelier de la Colombe » (41), « devis » (41), « Prost » (6).

**Conséquence stratégique :** la matière business est DÉJÀ dans la mémoire. Le prochain pas vers l'Action n'est PAS d'ingérer du business — c'est d'EXPLOITER ce qui existe. Un agent business a déjà de quoi lire.

**Le chat fonctionne :** `npm run os:chat -- "question"` (question en argument, ligne 323 ; guillemets doubles, pas de ? : ' & qui cassent zsh ; sans argument = question figée par défaut). Le chat respecte l'anti-hallucination (a répondu honnêtement « pas d'info » sur une requête mal ciblée, sans combler).

---

## 4. Points ouverts et risques

**Pollution B99-T99 (à traiter, thread dédié) :** 27 items (14 déc + 13 leçons) source_dump_id="B99-T99" = fausse data du fichier de test injecté en prod. Confirmé non-définitif : Prost = procès GAGNÉ donc clos (data périmée), Atelier de la Colombe = existe DANS Inside SAS pas comme entité indépendante (hypothèse). NE PAS hard-delete sur un coup de tête. Traiter avec backup + liste préalable (filtre source_dump_id EXACT, pas contains — le bucket B99 a 194 items dont seulement 27 à retirer). + garde anti-réinjection B99-T99-* (commit séparé).

**Problème de fond — statut des items mémoire :** la base DECISIONS mélange décisions ACTÉES et réflexions / hypothèses / scénarios, sans distinction. Risque : un agent ressort une hypothèse comme décision ferme (ment sur le statut, pas le contenu). À étudier : champ statut (acté / envisagé / périmé). Anti-hallucination appliqué à la mémoire elle-même. INFRA → soumis à borne P25.

**Toujours ouverts (hérités) :** P23 (os:close Phase 6), P24 (pre-thread ÉTAPE 3), README v13 (état périmé), retry_count absent, Agent Synthèse non implémenté.

---

## 5. Leçon de méthode gravée

NE JAMAIS conclure sur le CONTENU de la mémoire depuis une requête chat. Le chat lit un échantillon scoré (~80 items) sur les tokens de la question — il reflète le scoring, pas le contenu. « Rien trouvé » = requête mauvaise, PAS absence. Pour connaître le contenu = inventaire direct des datasources par bucket, jamais le chat. (Erreur commise et corrigée ce thread.)

Corollaire vécu : pour savoir « où en est le projet » (thread actif, état repo), regarder la source (git log), ne pas se fier au récit ou au souvenir. C'est P20/P21 en pratique.

---

## 6. Priorité réelle de redémarrage (B09-T41)

**Le cap est clair et il respecte la borne P25 :** la mémoire contient du business, le chat l'interroge. Le prochain pas est d'EXPLOITER, pas de construire.

**Option recommandée :** tester la beta sur une vraie question business via le chat (ex : dossier Prost, état Inside SAS, Atelier de la Colombe), juger la sortie à l'œil (Florent connaît ces dossiers), et voir si le système l'aide réellement comme dirigeant. C'est l'Action, à portée immédiate, sans rien coder.

**Attention pollution :** avant d'exploiter sérieusement, décider du sort des 27 items B99-T99 (ils faussent les réponses business — ex : ils décrivent un contentieux Prost en cours alors qu'il est gagné). Soit les traiter (backup + retrait), soit en tenir compte en lisant les réponses.

**Ne PAS :** ouvrir un nouveau chantier infra (borne P25), implémenter l'Agent Synthèse avant d'avoir prouvé que le chat simple suffit ou non, généraliser P20 dans la foulée.

---

## 7. Discipline pour le prochain thread

**Socle verrouillé :** PROMPT_MAITRE v16, CLAUDE.md, pipeline 97/97, garde de sûreté os:close, B09 hors pipeline, CONTEXT en B99.

**Méthode obligatoire :** pour toute affirmation sur l'état (mémoire, repo, thread) → vérifier à la source, jamais supposer. Le chat reflète le scoring, pas le contenu.

**À tester en priorité :** la beta sur question business réelle.

**À versionner :** ce CONTEXT v32 en clôture. CONTEXT v33 après premier vrai usage business.

---

## Point de redémarrage minimal

**Objectif B09-T41 (proposé) :** EXPLOITER la mémoire business existante — tester le chat sur un dossier réel (Prost / Inside SAS / Atelier), juger l'utilité réelle. Premier vrai pas Action, sans coder.
**Acquis :** mémoire contient ~2300 items business (vérifié), chat fonctionnel (`npm run os:chat -- "..."`), 6 commits T40, doctrine v16, Infra-Tech v03 (P20 amorcé), borne P25 active.
**Contraintes :** pollution B99-T99 à gérer avant exploitation sérieuse (27 items fausse data). Borne P25 : pas de nouveau chantier infra. Problème acté/hypothèse à garder en tête.
**État :** T40 clos. Business présent et interrogeable. Couche Action à portée via le chat existant — pas besoin de construire d'abord.
**Prochaine étape :** poser au chat une vraie question business, juger la sortie. Si utile → la beta fonctionne. Si la pollution gêne → la traiter d'abord.
