# INSIDE OS — BACKLOG DEV

Derniere mise a jour : 2026-08-20 (B09-T43)
Version : v11
Pilote : Agent Infrastructure & Tech (B08/B09)

Regle : ce fichier est mis a jour a chaque thread B09-Dev via Claude Code.
Miroir Notion : page INSIDE-OS-BACKLOG-DEV (a creer).

---

## PIPELINE

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | CLAUDE_MODEL dans .env (pas hardcode) | B09-T30 | [DONE] |
| P2 | Retry Notion 502/503/504 automatique (3x backoff) | B09-T30 | [DONE] |
| P3 | Retry LLM 529/500 automatique (3x backoff) | B09-T30 | [DONE] |
| P4 | Inject auto-pagination (boucle jusqu'a 0 candidats) | B09-T30 | [DONE] |
| P5 | Checkpoint par chunk (sauvegarde partielle + reprise) | B09-T30 | [DONE] |
| P6 | Fix data_cemetery/ — brut jamais archive, seulement le clean sous nom complet | B09-T32 | [DONE] |
| P7 | Audit + nettoyage doublons existants dans data_cemetery/ | B09-T32 | [DONE] |
| P8 | Boucle infinie auto-pagination sur thread bloque — exclure les threads retry_count >= 2 de la boucle | B09-T33 | [DONE] |
| P9 | Tokenizer diacritiques + MIN_SCORE=15 pertinence lessons_learnings | B09-T36 | [DONE] |
| P10 | Desambiguisation tag semantique "associe" humain vs agent IA dans scoring | B09-T36 | [DONE] |
| P11 | Purge automatique threads_to_process/ apres inject reussi. [B09-T39] Tranché : ne plus re-suspendre. La détection de divergence 3 axes (SYSTEME P19) couvre désormais le risque d'état incohérent qui motivait la purge. Sortie de la boucle de process. | B09-T34 | [DONE] |
| P12 | Verifier que VERIFY_PASS=always est la config par defaut dans .env.example et documenter explicitement — Passe 1 + Passe 2 deja en place | B09-T37 | [DONE] |
| P13 | `os:ingest` en mode interactif : prompt fermé sans réponse (stdin non-TTY, ex. pipe/CI) = exit 0 silencieux, aucun traitement, aucun signalement. Violation de la règle crash > silence. Constaté en direct B09-T43 (BLOC 1) : `npm run os:pipeline` lancé sans stdin interactif a affiché le prompt de choix de mode puis rendu la main en 0.1s sans ingérer le thread visé ni lever d'erreur — seule une vérification manuelle a posteriori (`os:list-inject-pending`) a révélé que rien n'avait été traité. Cousin de P23 (famille des sorties silencieuses). Fix attendu : échec explicite (exit non-zéro) si le prompt interactif se ferme sans réponse (stdin EOF), ou exiger `--mode batch`/`--mode test` en contexte non-TTY plutôt que de proposer un prompt qui ne peut jamais aboutir. | B09-T43 | [TODO] |

---

## INFRA

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Activer auto-recharge credits API Anthropic | B09-T30 | [DONE] |
| P2 | Migration Notion -> Supabase comme SOURCE D'ÉTAT UNIQUE (support de SYSTEME P20). Déclenchée APRÈS la migration du pilotage vers Claude (BACKLOG_USER AGENTS P9). Ne pas démarrer avant que le pilotage tourne et qu'on sache quel état il doit lire. | B09-T29 | [ROADMAP] |
| P3 | pgvector pour recherche semantique agents V3 | B09-T29 | [ROADMAP] |
| P4 | Remplir donnees financieres entities INSIDE_OS_DATABASES via agent dedie | B09-T33 | [ROADMAP] |
| P5 | Sandbox Notion isolee pour tests pipeline — bloquee API deprecee, a reprendre apres migration Supabase | B09-T36 | [ROADMAP] |
| P6 | Backup automatique regulier INSIDE OS — export Notion + repo + .env chiffre + data_cemetery/ + thread_summarized/ | B09-T37 | [TODO] |
| P7 | Audit securite complet — verifier .gitignore (.env, .env.test, dossiers data), chiffrement .env au repos, audit historique git (pas de secrets exposes), restreindre perimetre integrations API Notion, anticiper auth admin/user/dev pour interfaces UI | B09-T37 | [TODO] |
| P8 | Anticiper pivot Supabase avant lancement ingestion massive documents — Notion devient goulot si volume explose. A integrer dans planification INFRA P2 | B09-T37 | [TODO] |

---

## SYSTEME

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Verification automatique contenu B99 apres inject os-thread-close. [DROPPED B09-T42] Script os-thread-close.mjs abandonné et archivé — la vérification visée n'a plus d'objet dans sa forme d'origine ; la correction B99 générique reste couverte par os:audit/injection_status comme tout bucket. | B09-T31 | [DROPPED] |
| P2 | Synchronisation BACKLOG_DEV.md + BACKLOG_USER.md -> Notion, push one-way (fichiers .md = source de verite, Notion = miroir lecture seule). [REFORMULÉ B09-T42] Ancien déclencheur ("phase 4 de os-thread-close.mjs") caduc, protocole abandonné — plus de couplage à une cérémonie de clôture, mécanisme de déclenchement à redéfinir (manuel ou via os:docs-sync). Page Notion existante "INSIDE-OS-BACKLOG" (sous INSIDE_OS_ROOT) trouvée obsolète : dernière maj 2026-05-10 (B09-T34), reflète l'ancien BACKLOG.md monolithique pré-split DEV/USER (s'arrête à SYSTEME P8) — à réutiliser (mise à jour + restructuration DEV/USER) ou remplacer, décision en attente (voir échange B09-T42). | B09-T32 | [TODO] |
| P3 | Corriger toute reference a injection_status=BLOCKED dans README/PROMPT | B09-T33 | [DONE] |
| P4 | Protocole de cloture canonique grave dans PROMPT v11 | B09-T33 | [DONE] |
| P5 | Upgrade Max 5x si sessions longues regulieres | B09-T30 | [ROADMAP] |
| P6 | Confronter docs/vision/ avec vision actuelle via LLM inside-os | B09-T34 | [TODO] |
| P7 | Script de verification integrite systeme — schema Notion, DS_IDs, fichiers critiques, pipeline executable, .gitignore, etat dossiers non versionnés | B09-T34 | [TODO] |
| P8 | Script os:pre-thread — audit complet avant ouverture thread B09 | B09-T34 | [DONE] |
| P9 | Capture interactive echanges post-export (phase 10 os:close --inject) — appende au rapport de cloture. [B09-T39] Scope tranché = capture + append uniquement (le bouclage Claude est P9b, ticket séparé). Vérifié dans le code : capturePostExport() (os-thread-close.mjs:382) + fs.appendFileSync(reportPath) (ligne 662) opérationnels (cas 1). Statut [DONE] adossé à vérification code, pas à un souvenir. [B09-T42] Protocole os-thread-close.mjs abandonné et archivé (archive/scripts/) — cette capacité, alors vérifiée fonctionnelle, ne tourne plus. | B09-T34 | [DONE] |
| P9b | Passer les echanges post-export captures (P9) a Claude pour regenerer les sections Acquis reels + Fichiers produits du CONTEXT, puis re-injecter en B99. Prerequis : P9 [DONE] (B09-T39, voir P9 ci-dessus). [DROPPED B09-T42] Le document CONTEXT n'existe plus (protocole de clôture abandonné) — regénérer ses sections n'a plus d'objet. | B09-T39 | [DROPPED] |
| P10 | Ameliorer os:pre-thread : audit alignement etendu — verifier BACKLOG_DEV.md, BACKLOG_USER.md, PROMPT_ASSOCIE_vXX.md, thread precedent inject_done en Notion, BACKLOG.md coherent comme index. [B09-T42] os/scripts/pre-thread.mjs abandonné et archivé (archive/scripts/) — cette amélioration, alors livrée, ne tourne plus. | B09-T36 | [DONE] |
| P11 | os:pre-thread archive l'ancien PRE_THREAD dans docs/pre-threads/ avant de generer le nouveau — un seul PRE_THREAD actif a la racine, historique complet dans docs/pre-threads/. [B09-T42] Protocole PRE_THREAD abandonné — pre-thread.mjs archivé (archive/scripts/), historique déplacé archive/pre-threads/. | B09-T36 | [DONE] |
| P12 | Script alignement post-cloture — verifier coherence README / CONTEXT / PROMPT / PROMPT_ASSOCIE / BACKLOG_DEV / BACKLOG_USER apres chaque ingest+inject definitif. [DONE B09-T42, périmètre réduit] CONTEXT n'existe plus (protocole abandonné) — plus d'objet pour ce volet. Le besoin restant (cohérence des pointeurs de version README/PROMPT_MAITRE/PROMPT_ASSOCIE/familles de prompts) est couvert par npm run os:docs-sync (os/scripts/docs-sync.mjs). | B09-T37 | [DONE] |
| P13 | Script tri repo — classement automatique deterministe des fichiers repo dans les bons dossiers cibles (complement de l'agent classifieur documents metier) | B09-T37 | [TODO] |
| P14 | Politique archivage et versionnage fichiers critiques encore actifs — automatiser pour : PROMPT_MAITRE, PROMPT_ASSOCIE, familles de prompts d'agent, BACKLOG_DEV, BACKLOG_USER, ingest-pass1-vXX, ingest-pass2-vXX, .env.example. [REFORMULÉ B09-T42] CONTEXT, README (plus versionné par nom) et PRE_THREAD retirés de la liste — protocole abandonné. Premier geste concret livré : npm run os:docs-sync (vérification des pointeurs de version) — l'automatisation de l'archivage lui-même (déplacement physique à chaque bump) reste [TODO]. | B09-T36 | [TODO] |
| P15 | IDEAS.md + commande os:idea — pense-bete inter-thread : ajouter une idee horodatee en [RAW], revue en fin de thread (BACKLOG / DROPPED / KEEP) | B09-T36 | [TODO] |
| P16 | Sous-pipeline LLM traitement 200 threads bruts — tri importance strategique, classification bucket, synthese, selection ingest/inject. [DROPPED B09-T39] Les 200 threads bruts sont de la data pour la mémoire vivante, sans impact structurel sur le système. N'aligne pas le projet sur son but final (couche Action). Abandonné. | B09-T37 | [DROPPED] |
| P17 | os:pre-thread — générer le PRE_THREAD avec le nom du thread SUIVANT (+1) et non du thread courant. Accepte déjà --next en argument mais doit incrémenter automatiquement sans argument. [B09-T39] Faux DONE corrigé : l'auto-incrément était calculé dans main() et utilisé pour le NOM DE FICHIER mais jamais injecté dans le titre du template — le PRE_THREAD généré affichait encore « B09-TXX-Sujet » en clair. Fixé en commit 3e81397 (fix(pre-thread)) : buildPreThreadDoc reçoit désormais resolvedThreadName et throw si placeholder. [B09-T42] pre-thread.mjs abandonné et archivé — ce fix, alors vérifié, ne tourne plus. | B09-T39 | [DONE] |
| P18 | Infrastructure idle agent — scheduler, sandbox/, budget tokens, rapport session, file sujets idle | B09-T38 | [ROADMAP] |
| P19 | os:pre-thread — détection divergence redéfinie sur 3 axes (commit 1b35ca0, feat(divergence)) : AXE A fraîcheur CONTEXT (numéro fichier == numéro déclaré dans le contenu), AXE B compteurs Notion (inject_pending == 0 && inject_error == 0), AXE C cohérence CONTEXT ↔ Notion live (inject_done / DECISIONS / LESSONS du texte == compteurs live). Verdict ALIGNÉ = preuve positive (3 axes OK), sinon DIVERGENCE ou INDÉTERMINÉ — jamais aligné par défaut. Remplace la purge manuelle P11 comme solution architecturale à la boucle thread. [B09-T42] pre-thread.mjs abandonné et archivé — cette détection, alors livrée et vérifiée, ne tourne plus. Capacité signalée comme possible candidate à reconstruction autonome, voir P32. | B09-T38 | [DONE] |
| P20 | Source d'état unique : séparer ÉTAT (calculé, jamais saisi à la main — compteurs Notion live, git, filesystem) de DOCTRINE (versionnée, peu de fichiers — PROMPT_MAITRE, PROMPT_ASSOCIE, README). Les .md (CONTEXT, PRE_THREAD, BACKLOG) AFFICHENT l'état généré avec timestamp + source, ne le STOCKENT plus à la main. Supprime structurellement la divergence et rend le script d'alignement post-clôture (SYSTEME P12) inutile à terme. Support cible = Supabase (INFRA P2), APRÈS migration pilotage Claude (BACKLOG_USER). [B09-T40] PREMIER GESTE CONCRET en cours : retrait de l'état figé du PROMPT_AGENT_INFRA_TECH (v02→v03, chiffres « 96 threads/v04 » remplacés par renvoi vers la source vivante). Reste à généraliser aux autres fichiers de doctrine (README, etc.) — mais voir P25 (borne) : ne PAS enchaîner cette généralisation en threads infra successifs. Reste [TODO] : un seul fichier traité, principe non généralisé. [B09-T42] CONTEXT et PRE_THREAD : résolus par suppression pure plutôt que par affichage calculé — le protocole qui les produisait est abandonné, le problème structurel qu'ils posaient n'existe plus pour ces deux fichiers. BACKLOG_DEV/BACKLOG_USER restent des fichiers édités à la main, hors du périmètre de cette résolution — P20 reste [TODO] pour ce périmètre réduit. | B09-T39 | [TODO] |
| P21 | Statut [DONE] vérifiable : un item ne passe [DONE] que adossé à une preuve (commit, test qui passe), jamais par saisie humaine seule. Application de la règle anti-hallucination au backlog. Déclenché par le faux [DONE] de P17 découvert en B09-T39. NOTE : déjà appliqué de fait dans ce thread (P17/P19 référencent les hash de commit). À systématiser. | B09-T39 | [TODO] |
| P22 | Nettoyage CONTEXT : supprimer du filesystem les versions antérieures au latest. Git conserve l'historique complet (= la vraie sécurité, pas la redondance de fichiers à la racine). Un seul CONTEXT vivant. Suppression pure, PAS d'archive redondante. PRÉREQUIS DE SÉCURITÉ : vérifier via `git log` que chaque CONTEXT antérieur est bien commité AVANT suppression. [DONE B09-T42, résolution différente] Résolu par archivage complet du dossier docs/context/ (toutes versions, y compris la dernière) vers archive/context/ dans le cadre de l'abandon du protocole CONTEXT — pas par suppression comme demandé à l'origine (archivage plus sûr, cohérent avec la doctrine "jamais écraser sans archiver"). docs/context/ n'existe plus. | B09-T39 | [DONE] |
| P23 | **PRIORITÉ HAUTE** — os:close Phase 6 : vérifier la complétude du contenu de thread AVANT génération du CONTEXT. Aujourd'hui Phase 6 lit un fichier plafonné à 15000 chars sans vérifier qu'il représente le thread complet ; sur un thread B09 (conversation non exportée automatiquement) elle a généré un draft v31 massivement faux (≈70 %) portant le label « confiance élevée ». Si contenu tronqué ou absent → verdict INDÉTERMINÉ + refus de générer, jamais de génération sur fragment. Même motif anti-hallucination que tout B09-T39. Risque n°1 du CONTEXT v31 (§8/§10) : corrompt la mémoire de continuité elle-même. [DROPPED B09-T42] os-thread-close.mjs et la génération CONTEXT sont abandonnés — cette phase n'existe plus. | B09-T40 | [DROPPED] |
| P24 | os:pre-thread ÉTAPE 3 — bug détection « dernier thread B09 traité » : le PRE_THREAD B09-T40 affiche B09-T38 alors que T39 était clos (vérifié dans le fichier généré, champ DERNIER THREAD B09 TRAITÉ). Distinct des 3 bugs corrigés en B09-T39 (fraîcheur CONTEXT + nom thread injecté). Identifier la source lue par l'ÉTAPE 3 et la rendre cohérente avec l'état réel post-clôture. NB : le reste du PRE_THREAD T40 sort propre (nom fichier OK, verdict 3 axes honnête) — seul ce champ ment. [DROPPED B09-T42] pre-thread.mjs abandonné et archivé — ce bug n'a plus d'hôte. | B09-T40 | [DROPPED] |
| P25 | **BORNE DE SORTIE DU TUNNEL INFRA** (règle de pilotage, garde-fou note de recadrage B09-T40). À chaque ouverture de thread, se poser : « ce que je fais ce thread rapproche-t-il d'un agent qui EXÉCUTE pour l'entreprise, ou consolide-t-il encore le système que je maîtrise déjà ? ». Les deux sont parfois nécessaires, MAIS : si la réponse est « consolider » 3 threads de suite, l'Action passe devant, même système imparfait (le parfait est l'ennemi de la beta). CRITÈRE CONCRET ACTÉ : une fois P20 amorcé (état retiré des prompts/doctrine — premier geste = Infra-Tech v03, B09-T40), le prochain agent doit produire de la VALEUR ENTREPRISE réelle (lire un mail, préparer un livrable, challenger une décision réelle), pas de l'infra. Ne PAS généraliser P20 à tous les fichiers de doctrine en enchaînant les threads infra — c'est précisément le tunnel à éviter. | B09-T40 | [TODO] |
| P26 | Calibrage de `META_WORDS` dans `os/chat/notion-memory-chat.mjs` — "pipeline" y est classé méta-mot (14.9% du corpus DECISIONS+LESSONS, mesuré B09-T41) et exclu du scoring/boost. Conséquence constatée : "où en est le pipeline INSIDE OS" tokenize à ZÉRO mot (pipeline/inside = META_WORDS, os/le/en/est/où = stopwords grammaticaux) → 0 item, alors que c'est une formulation naturelle de question système. Revoir si "pipeline" doit rester meta-word pur ou garder un pouvoir discriminant partiel (ex. poids réduit plutôt qu'exclusion totale). | B09-T41 | [TODO] |
| P27 | Comportement fail-loud quand `tokenize()` renvoie 0 mot dans `os/chat/notion-memory-chat.mjs` — aujourd'hui le chat lance quand même la recherche sur un jeu de tokens vide (`Tokens: [aucun]`), ce qui ne peut structurellement rien matcher et retourne silencieusement 0 item sans expliquer pourquoi. Le chat doit détecter ce cas et répondre explicitement "question trop générique, reformule avec des mots de contenu" au lieu de chercher sur rien. Lié à P26 (constaté sur le même cas de test, B09-T41). | B09-T41 | [TODO] |
| P28 | `tokenize()` dans `os/agents/synthese/sources.mjs` (socle partagé Synthèse + Pilotage) filtre les mots < 4 lettres — élimine des sigles business courts et légitimes ("SAS" notamment). Constaté sur Agent Pilotage (B09-T41) : sujet "Inside SAS" → tokens=[inside] (SAS éliminé), réponse quasi identique à "INSIDE OS" (même bascule commerciale générique) au lieu d'une réponse spécifique à l'entité Inside SAS. **[DONE B09-T41]** Fix : acronyme court (2-3 caractères) retenu si tout en MAJUSCULES dans le sujet original (heuristique détectée avant minuscule/diacritiques, stopwords toujours exclus même en casse haute). Vérifié : "Inside SAS" → tokens=[inside,sas], réponse spécifique (adresse réelle, chiffres, blocage juridique concret) au lieu de générique ; "Atelier de la Colombe" → tokens=[atelier,colombe] inchangé, pas de régression. Tokenizer du chat (`os/chat/notion-memory-chat.mjs`) volontairement non aligné dans ce geste — reste un point ouvert distinct si jugé pertinent. | B09-T41 | [DONE] |
| P29 | Sortie de l'Agent Pilotage (`os/agents/pilotage/`) parfois encadrée d'un bloc markdown ` ```...``` ` malgré le format STRICT imposé au prompt système (`PROMPT_AGENT_PILOTAGE_v01.md`, section Format de sortie). Constaté sur le test de bout en bout "B1 Bis" (B09-T41) : contenu ÉTAT/BLOCAGE/ACTION/Sources correct, mais fence markdown en trop. Pas bloquant pour une lecture humaine, mais casserait un parsing mécanique strict en aval. Fix probable : ligne explicite "jamais de bloc markdown ``` " dans le prompt système, comme déjà fait dans ingest-pass1-v02.md ("JSON strict... Aucun bloc markdown"). Non corrigé, pas de fix demandé dans ce thread. | B09-T41 | [TODO] |
| P30 | Ouverture — Commercial (B05) sortait vide, Holding (B03) aussi. Constaté sur 3 runs malgré la règle de largeur et l'anti-monopole. **[DONE B09-T41]** Cause réelle identifiée : ni le plafonnage ni l'anti-monopole n'étaient en cause — le canal "essentiel" (décisions impact=critical/major, buckets métier, sans filtre de récence) manquait de la spec d'origine, perdu dans les itérations. Les seuls candidats Commercial/Holding disponibles dans les canaux présent/récent/proposed étaient soit inexistants soit accidentellement saturés par un autre `source_dump_id`. Le canal essentiel (`gatherEssential`, rotation quotidienne déterministe sur ~700 décisions critical/major qualifiantes, cf. commit `feat(ouverture) — canal essentiel`) fait remonter des décisions B03/B05 anciennes jamais revisitées. Vérifié en direct : Holding ET Commercial non vides simultanément, 5 tâches marquées "(à vérifier — ancien)" dans le même run. | B09-T41 | [DONE] |
| P31 | **[DONE B09-T42]** `DEFAULT_SKIP_BUCKETS=["B09"]` retiré de `os/ingest/ingest-thread-dump.mjs` (désormais `[]`) — un thread B09 passe par le pipeline standard comme tout autre bucket, plus d'exclusion. Tranché en même temps qu'une garde d'idempotence (`assertNoExistingIdDump`, remplace l'ancien `guardCheckExistingDone`) : `os:ingest` refuse fail-loud tout id_dump déjà présent dans THREAD_DUMP Notion, ne met plus jamais à jour silencieusement — protège mieux qu'une exclusion de bucket contre les collisions. Vérifié en direct : re-tenter `--only B99-T11` (déjà en Notion) échoue proprement avec le message d'idempotence. | B09-T42 | [DONE] |
| P32 | Capacité d'audit de divergence 3-axes (`os/scripts/pre-thread.mjs`, archivé en B09-T42 avec le reste du protocole de clôture — comparait versions docs vs contenu déclaré vs compteurs Notion live, cf. P19) : cette détection de divergence documentaire est indépendante de la génération CONTEXT elle-même. Signalé — pas reconstruit dans ce thread — comme candidat à un outil autonome si un besoin de vérification d'alignement doc↔Notion ressurgit, sans reposer sur le protocole de clôture abandonné. | B09-T42 | [ROADMAP] |
| P33 | Script de déduplication du Drive par empreinte (hash SHA) — détecte les fichiers strictement identiques, produit une LISTE à valider par Florent, ne supprime jamais rien de lui-même. À construire sur preuve de douleur (saturation Drive ou confusion réelle entre versions), pas préventivement. Décidé B99-T16-bis. | B99-T16-bis | [ROADMAP] |

---

## UI DEV

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Dashboard pipeline (statuts, logs, lancer ingest/inject) | B09-T32 | [ROADMAP] |

---

## REPO

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Audit repo — suppression fichiers orphelins et dossiers inutiles | B09-T34 | [DONE] |

---

## LEGENDE

[TODO]    = priorite active
[ROADMAP] = decide, pas encore planifie
[DONE]    = implemente et valide
[DROPPED] = abandonné, conservé pour traçabilité de la décision
