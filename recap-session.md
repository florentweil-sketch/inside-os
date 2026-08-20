# Récap de session — B09-T43

Date : 2026-08-20 (régénéré — clôture de session)
Thread : B09-T43 (B09-T42 brûlé — dérive d'étiquetage août 2026, non réutilisé,
documenté dans le dump B09-T41 et gravé dans CLAUDE.md, commit `fc4e0d5`).
Portée : session très longue à cheval sur deux étiquettes de thread (T42 puis
T43 sur la même conversation continue) — migration Drive hors repo, doctrine
de numérotation, lot documentaire corporate INSIDE SAS (11 actes + synthèse),
4 bugs pipeline trouvés et gravés, docs-sync clôturé ROUGE et diagnostiqué.

**Note de statut.** Ce fichier n'est pas une résurrection du protocole CONTEXT
(abandonné — voir section 11). C'est le canal de transfert de fin de session
vers l'architecte-conseil, non versionné, non référencé par le périmètre
docs-sync. Sa réécriture à chaque fin de session, et la relance d'`os:docs-sync`
quand le périmètre est touché, sont gravées dans CLAUDE.md comme deux gestes
de fin de session au même titre l'un que l'autre — **y compris quand
`os:docs-sync` échoue : le geste est de le relancer et de constater, pas de
supposer un succès** (voir section 26).

---

## Sommaire

1. Garde anti-réinjection B99-T99
2. Agent Synthèse — construction, deux bugs structurels trouvés et corrigés
3. os:chat — trois bugs de scoring corrigés (méta-mots, pagination, boost B99)
4. os:ingest — bug SKIP_BUCKETS jamais appliqué, corrigé
5. Lecture decision_status + created_time (chat, agents) + os:statut (curation)
6. Agent Pilotage — ÉTAT/BLOCAGE/ACTION
7. Fix tokenizer — préservation des acronymes courts (sources.mjs)
8. Injection de 3 dumps métier réels (B99-T11/T12/T13)
9. Agent Ouverture — brief du matin, plusieurs itérations (plafond B09, anti-monopole, largeur, canal essentiel + rotation)
10. Agent Ingestion Docs — verser un PDF dans la mémoire, testé de bout en bout (devis Fernet réel)
11. Rationalisation documentaire majeure — abandon du protocole de clôture/CONTEXT/PRE_THREAD, archive/, README.md stable, CLAUDE.md/PROMPT_MAITRE v17, os:docs-sync (check pointeurs)
12. Réconciliation BACKLOG_DEV + nettoyage repo
13. Miroir Notion doctrine (fonction d'origine de docs-sync, livrée)
14. Bug threads_to_process/ — diagnostic, fix, purge sélective
15. P31 — garde d'idempotence + retrait DEFAULT_SKIP_BUCKETS B09
16. Doctrine recap-session.md ↔ os:docs-sync, même statut de fin de session
17. Agent Associé v1 — point d'entrée conversationnel unique
18. Inventaire lecture seule Google Drive (rapports locaux, hors repo versionné)
19. P33 — script de déduplication Drive gravé au backlog (roadmap, pas construit)
20. Migration Google Drive réelle — nomenclature B99-T16 (exécutée en direct, hors repo)
21. Clôture précédente (régénération sous l'étiquette B09-T42, avant relabellisation)
22. **Doctrine — règle de numérotation des threads (B09-T42 brûlé)**
23. **BLOC 1 — dump B99-T17 (clôture migration Drive) injecté en mémoire**
24. **BLOC 3 — lot documentaire corporate INSIDE SAS (11 actes + dump de synthèse)**
25. **4 bugs pipeline trouvés et gravés (P13 → P16, famille sorties silencieuses/indéterminées)**
26. **docs-sync — état final ROUGE, miroir Notion partiellement stale (détail exact)**
27. Clôture de session B09-T43

---

## 1. Garde anti-réinjection B99-T99

`os/lib/guard.mjs` : `assertNotBlockedDumpId()`, motif bloqué `/^B99-T99(-.*)?$/`.
Câblée fail-loud dans `os/inject/inject-decisions-lessons.mjs` et
`os/extract/extract-thread-dump.mjs`. Contexte : 27 items de fausse donnée
B99-T99 retirés de Notion le 2026-08-07. Vérifié : B99-T07 non bloqué.

Commit : `bd8d1bb`

---

## 2. Agent Synthèse

Premier agent de la couche Action — synthèse sourcée, lecture seule.
**Bug structurel majeur** : `scoreItem`/`describePage` lisaient des propriétés
Notion inexistantes (`title`, `raw_text`) — score toujours 0, l'agent n'avait
jamais retourné un seul résultat depuis sa création. Corrigé. Vérifié :
0 → 10 résultats sourcés sur "Clémence Porret".

Commits : `8411cdb`, `57414cd`, `a0f1df7`
Prompt : `docs/prompts/synthese/PROMPT_AGENT_SYNTHESE_v01.md` + `SPEC_AGENT_SYNTHESE_v01.md`

---

## 3. os:chat — trois bugs de scoring

Méta-mots comptés deux fois ; boost B99 sans condition de pertinence ;
pagination tronquée à 80 items. Corrigés et vérifiés.

Commits : `e38efb8`, `54b3cce`, `5409ee2`

---

## 4. os:ingest — SKIP_BUCKETS jamais appliqué (bug historique)

Sentinel comparé après `.toUpperCase()`, ne matchait jamais. Corrigé.
*`DEFAULT_SKIP_BUCKETS` lui-même retiré depuis (section 15).*

Commit : `7febefa`

---

## 5. decision_status + created_time, et os:statut

Lecture affichée par chat + Agent Synthèse. Curation : `os/scripts/statut.mjs`
(`npm run os:statut -- <uid> <statut>`). *Refactoré en section 17 pour exporter
`applyStatut`, consommée par l'Agent Associé — bug d'exécution-à-l'import
trouvé et corrigé au passage.*

Commits : `4ff378e`, `829aada`

---

## 6. Agent Pilotage

Copilote opérationnel ÉTAT/BLOCAGE/ACTION, socle Synthèse réutilisé, boost
présent/récent sur le classement seulement.

Commits : `f8d5b3a`, `f29fc74`
Prompt : `docs/prompts/pilotage/PROMPT_AGENT_PILOTAGE_v01.md`

---

## 7. Fix tokenizer — acronymes courts

Token 2-3 caractères retenu si tout en MAJUSCULES dans le sujet original
("SAS"). Vérifié sans régression.

Commit : `12e5b8d`

---

## 8. Injection de 3 dumps métier réels (B99-T11/T12/T13)

Manoir Septeuil, Chantier B1 Bis, Régularisation sièges sociaux. 0 erreur.

---

## 9. Agent Ouverture — le brief du matin

Sélection déterministe (présent/récent/proposed + canal essentiel). Itérations :
plafond INSIDE OS, anti-monopole en post-traitement, canal essentiel avec
rotation quotidienne déterministe pour éviter qu'un classement fixe montre
toujours les mêmes items parmi 240 décisions critical.

Commits : `9d7932b`, `f1bcfaa`, `b1fe546`, `c745df3`, `7176bbb`, `db70658`, `95a003f`
Prompt : `docs/prompts/ouverture/PROMPT_AGENT_OUVERTURE_v01.md`

---

## 10. Agent Ingestion Docs

Verse un PDF en mémoire, extraction factuelle stricte, confirmation
interactive obligatoire. **Vérifié en production réelle** : devis Fernet
(252 194,05 € TTC), extraction validée par Florent, pipeline 0 erreur.
*Repris et durci en profondeur en section 24-25 de cette même session
(bugs max_tokens/stop_reason/timeout, +2 exports, +2 fixes).*

Commits : `120c35b`, `d316622`
Prompt : `docs/prompts/ingest-doc/PROMPT_INGEST_DOC_v01.md`

---

## 11. Rationalisation documentaire — abandon du protocole de clôture

Protocole de clôture dédié (`os-thread-close.mjs`, CONTEXT vXX local,
PRE_THREAD) abandonné en entier, remplacé par dump → pipeline. Archivage
complet dans `archive/` (convention réutilisée). `README.md` stable créé,
`CLAUDE.md`/`PROMPT_MAITRE v17` réécrits. Premier `os:docs-sync` construit
(check pointeurs).

Commits : `dac40db`, `921512d`, `d6484f4`, `5d3862f`, `188b850`, `1aca679`

---

## 12. Réconciliation BACKLOG_DEV + nettoyage repo

Chaque entrée SYSTEME référençant l'ancien protocole tranchée (DROPPED /
DONE avec note / reformulée). Nettoyage repo (fichiers vides, PDF jetable,
dossier backup vide) après vérification.

Commits : `97e90d7`, `32ffd80`, `256c51e`

---

## 13. Miroir Notion doctrine

`os:docs-sync` étendu : pousse les 13 fichiers du périmètre vers des pages
enfants de **"Doctrine — miroir"** (sous `INSIDE_OS_ROOT`), idempotent en
théorie (voir section 26 pour la faille trouvée). Ancienne page
"INSIDE-OS-BACKLOG" repointée.

**Doctrine — miroir : https://www.notion.so/3be5e503b0ac8102ace7e00e9782552c**
— **état réel au moment de cette clôture : PARTIELLEMENT STALE, voir section
26 pour le détail exact (8/13 pages au commit `2f0503b`, 5/13 encore au
commit `2a60bf0`).**

Commit : `f3c57f6`

---

## 14. Bug threads_to_process/ — diagnostic, fix, purge sélective

Le brut n'était jamais supprimé après clean. Corrigé. Purge sélective :
B99-T14/B09-T38 (vérifiés done) supprimés ; B09-T39/T40 laissés en l'état
(jamais traités par ce pipeline).

Commit : `0a61360`

---

## 15. P31 — garde d'idempotence + retrait DEFAULT_SKIP_BUCKETS B09

`assertNoExistingIdDump` : refuse fail-loud tout id_dump déjà présent.
`DEFAULT_SKIP_BUCKETS` retiré. Doctrine corrigée. Vérifié en direct.

Commit : `2bd549d`

---

## 16. Doctrine recap-session.md ↔ os:docs-sync

CLAUDE.md : deux gestes de fin de session obligatoires au même titre.

Commit : `4df7214`

---

## 17. Agent Associé v1 — point d'entrée conversationnel unique

**PROMPT_ASSOCIE v03** : posture/DB-primauté/confirmation/routing/fiches
conservés ; 4 outils réels documentés ; 15 agents métier déplacés en
"casquettes futures" ; ENTITIES marqué "à construire".

**Agent Associé** (`os/agents/associe/`, `npm run os:associe -- "message"`) :
classification LLM légère → route vers Pilotage/Synthèse/Ouverture/repêchage
mémoire/proposition de curation (jamais exécutée sans confirmation explicite)
→ réponse finale toujours formulée par un second appel LLM (persona complet).

**Bug trouvé et corrigé** : `statut.mjs` exécutait son CLI à l'import
(absence de garde ESM standard) — corrigé.

**5/5 tests réels concluants**, chaque route couverte, dont un cas notable :
"la décision X est périmée" a fait remonter par coïncidence de scoring la
décision-mère de l'anti-hallucination elle-même — l'Associé a refusé
d'exécuter sans clarification, garde de confirmation vérifiée tenue en
direct dans Notion.

Commits : `f917a6a` (prompt), `df3902d` (agent)

---

## 18. Inventaire lecture seule Google Drive

Sur demande, hors périmètre repo versionné (fichiers gitignorés, aucun commit
de contenu) :
- `drive-inventaire.md` — architecture des dossiers (3 premiers niveaux,
  fichiers/volume), incohérences détectées : deux arborescences clients
  parallèles et divergentes (`BACKUP INSIDE` vs `2. DRIVE INSIDE` —
  probable instantané figé vs arbre vivant), doublon quasi-identique
  "2. PROJETS TERMINES"/"3. PROJETS_TERMINES", dossiers fourre-tout
  (`A TRIER`, `TEMP`/`DIVERS`/`OLD` dispersés), convention "corbeille" non
  uniformisée (4 graphies), mélange pro/perso au même niveau (`FW_CP`
  contient FAMILLE/VOYAGES/SANTE à côté de l'arbre business), 114 fichiers
  isolés à la racine.
- `drive-arbo.txt` — liste complète des 5 269 dossiers (sur 5 508), tous
  niveaux, corbeilles et dossiers techniques `.tmp*` exclus (239 exclusions,
  sous-arbres compris), un chemin par ligne, triée.

Les deux fichiers sont dans `.gitignore` (rapports locaux, jamais commités).
Méthode : métadonnées seules (`du`/`find`), aucun contenu de fichier ouvert,
aucun déplacement, aucun téléchargement. *Cet inventaire est devenu la carte
de référence pour la migration exécutée en section 20.*

---

## 19. P33 — script de déduplication Drive (gravé, pas construit)

BACKLOG_DEV SYSTEME P33 `[ROADMAP]` : script de déduplication par empreinte
SHA, produit une liste à valider par Florent, ne supprime jamais rien de
lui-même. À construire sur preuve de douleur réelle (saturation Drive ou
confusion entre versions constatée), pas préventivement. Décidé B99-T16-bis.

Commit : `29c64ba`

---

## 20. Migration Google Drive réelle — nomenclature B99-T16 (hors repo)

Exécution en direct sur le Drive réel (terrain :
`~/Library/CloudStorage/GoogleDrive-florent.weil@gmail.com/Mon Drive/`, via
le point de montage `~/Mon Drive`), en suivant la nomenclature gravée en
B99-T16 (dump du 2026-08-16, section 18). **Protocole tenu strictement à
chaque étape** : dry-run exact (source → destination) → OK explicite de
Florent → exécution → vérification. Aucune suppression à aucun moment —
uniquement des `mv`. Aucun commit — travail entièrement hors du repo Git.

**10 dossiers de tête créés** : `00_INBOX`, `01_FA-CAPITAL`, `02_INSIDE-SAS`,
`03_INSIDE-ARCHI`, `04_ATELIER-COLOMBE`, `05_CPSARL`, `06_ELIOR`, `07_TECH`,
`08_PERSO`, `99_ARCHIVE`.

**Étape 2 (gel)** : `BACKUP INSIDE` (27 Go) → `99_ARCHIVE/SNAPSHOT_BACKUP-INSIDE` ;
3 TEMP d'INSIDE SAS (COMELIT, MACBOOKPRO2, MCBOOKPRO) → `99_ARCHIVE/` ;
4 orphelins clients terminés (CARON, THOUMELIN, VEDEL, TERDJMAN, trouvés à la
racine d'INSIDE CLIENTS hors de l'arbre `1. CLIENTS/`) → `99_ARCHIVE/CLIENTS_TERMINES/`.

**Étape 3 (entités)** : toutes les entités rangées dans leur dossier de tête —
FA-CAPITAL (VISION/PROJET-ZERO/IMMOBILIER), INSIDE-SAS (10 dossiers métier +
3 résidus de `2. DRIVE INSIDE`), INSIDE-ARCHI/ATELIER-COLOMBE/CPSARL/ELIOR/PERSO
(contenu fusionné, dossier source vidé mais pas supprimé), TECH (IT/DEV/OS/
AUTOMATOR/SCRIPT EDITOR). **4 écarts entre la nomenclature gravée et les noms
réels du Drive résolus par les noms réels** (nomenclature → réel) :
`FOURNISSEURS INSIDE`→`FOURNISSEURS`, `1. INSIDE CRR`+`GENERAL INSIDE`→
`1. INSIDE CRR GENERAL` (un seul dossier, pas deux), `PROJET ZERO`→
`INSIDE PROJET ZERO`, `IT`→`INSIDE IT`. `INSIDE SAS` intégralement vidé par
cette étape (17 items répartis), `2. DRIVE INSIDE`/`0. INSIDE UPLIFT` réduits
à des coquilles vides.

**Étape 4 (vrac)** : 113 fichiers isolés de la racine + 5 dossiers
(`A TRIER`, `Enregistré depuis Chrome`, `Meet Recordings`, `3D`, `PRIVATE`)
→ `00_INBOX/`, sans tri fin (doctrine explicite de l'utilisateur). `PARTAGE
INSIDE` non touché (partages actifs possibles), signalé seulement.

**Étape 5 (résidus clients + complément)** : `LE PRIOL` réintégré dans
`INSIDE CLIENTS/1. CLIENTS/`. **GUERIN, doublon non fusionné** : les deux
dossiers listés en détail (arborescence, tailles, dates) pour arbitrage —
`1. CLIENTS/GUERIN` (111 Mo, actif jusqu'à cette semaine, sous-traitance +
facturation SCI Coignières) confirmé comme la référence vivante ;
`INSIDE CLIENTS/GUERIN` (17 Mo, inactif depuis ~9 mois, sous-ensemble
"Bazoches" recoupant partiellement l'autre) archivé sous
`99_ARCHIVE/GUERIN_COPIE-PARTIELLE-2025`. Complément demandé après coup :
15 fichiers marqués "GR" (= chantier Grosrouvre = LE PRIOL, et non Guérin —
correction explicite de Florent) reclassés depuis `00_INBOX` vers
`LE PRIOL/`. `DOCS TECHNIQUES` (1 fichier plomberie générique, orphelin de
la racine d'INSIDE CLIENTS) → `00_INBOX/`.

**Vérification finale** : racine du Drive conforme — exactement les 10
dossiers numérotés + `PARTAGE INSIDE`, rien d'autre hormis les coquilles
vides ci-dessous. Racine d'`INSIDE CLIENTS` propre (`1. CLIENTS/` +
`DESCRIPTIF TRAVAUX/` vide).

**Anomalie non résolue par ce travail** : `Google Earth` (racine) apparaît
dans les listings de répertoire mais son accès direct échoue
(`stat`/`ls` dessus → "No such file or directory") depuis le début de cette
phase — symptôme d'un problème de synchronisation Google Drive sur ce
dossier précis, pas un effet de la migration. Signalé, non résolu (seul le
Finder pourra trancher).

**6 coquilles vides restent à supprimer au Finder** (aucune ne contient de
fichier réel, vérifié) : `2. DRIVE INSIDE/`, `2. DRIVE INSIDE/0. INSIDE
UPLIFT/`, `IMMOBILIER/`, `0 (1).TRASH/`,
`02_INSIDE-SAS/INSIDE CLIENTS/DESCRIPTIF TRAVAUX/`, `Google Earth/`
(anomalie ci-dessus). **Point ouvert, toujours non traité à cette clôture**
— suppression manuelle laissée à Florent, hors du périmètre `mv`-seul de
cette migration.

Aucun commit associé (hors repo). Aucune donnée supprimée à aucun moment.

**Clôturé en mémoire Notion en section 23** (dump B99-T17, injecté ce thread).

---

## 21. Clôture précédente (régénération sous l'étiquette B09-T42, avant relabellisation)

Ce fichier avait été régénéré une première fois immédiatement après la
section 20, sous l'étiquette **B09-T42** — au dernier commit repo `29c64ba`,
sans commit associé à la migration Drive (hors repo). Cette clôture s'est
avérée prématurée : la conversation s'est poursuivie sans interruption, et
Florent a ouvert explicitement **B09-T43** juste après (section 22), en
précisant que B09-T42 était un id brûlé. Conservé ici comme trace honnête de
l'enchaînement réel — la présente régénération (section 27) est la clôture
qui fait foi.

---

## 22. Doctrine — règle de numérotation des threads (B09-T42 brûlé)

Gravée dans CLAUDE.md, section doctrine, à côté de la règle recap-session :
« Un thread B09-Txx = une conversation architecte-conseil complète. Les
sessions Claude Code héritent de l'id du thread en cours (fourni par Florent
en début de session), jamais de numéro propre. B09-T42 est un id brûlé
(dérive d'étiquetage août 2026, documentée dans le dump B09-T41), non
réutilisé. »

Commit : `fc4e0d5`

---

## 23. BLOC 1 — dump B99-T17 (clôture migration Drive) injecté en mémoire

Fichier `/Users/florentweil/Dev/dump/B99-T17.txt`, rédigé en T41, jamais
injecté avant ce thread. Convention de nommage vérifiée dans le code
(`os/ingest/ingest-thread-dump.mjs:450`, regex `^(B\d{2}-T\d{2})`) avant
tout geste — le préfixe suffisait, slug ajouté par cohérence. Copié dans
`data/threads_to_process/`, pipeline lancé (`--mode batch`, le mode
interactif ayant d'abord échoué silencieusement — voir section 25, P13).

**6 décisions créées**, toutes `validated`, vérifiées en direct dans Notion
(`source_dump_id=B99-T17`) : validation de la migration Drive comme exécutée
et clôturée, doctrine 00_INBOX = porte d'entrée unique, report de la
renumérotation 02_INSIDE-SAS, rappel des 6 coquilles à supprimer, relance du
chantier LE PRIOL (poignées + solde ~3 000 €), arbitrage GUERIN documenté.

---

## 24. BLOC 3 — lot documentaire corporate INSIDE SAS (11 actes + dump de synthèse)

**Bucket cible confirmé, pas supposé** : indice B02 vérifié contre
`README.md:203` (registre déclaré) et corroboré par 15+ précédents Notion
live (actes juridiques déjà classés systématiquement `[entité, "B06"]`,
jamais l'entité seule).

**Document pilote (statuts à jour 10/11/2021, `B99-T18`)** : premier test a
révélé une **extraction tronquée en plein milieu d'une clause** — voir
section 25 pour le fix. Une fois corrigé, texte relu intégralement par
Florent (contrôle croisé avec une lecture indépendante faite ce midi dans
l'app Claude) AVANT toute écriture — écrit **verbatim** via `writeDump()`
réutilisant le texte déjà relu, aucune ré-extraction (le non-déterminisme
LLM rendait un second appel dangereux — texte injecté ≠ texte validé sinon).
13 décisions / 12 lessons, buckets réels posés `["B02","B06"]` sur l'identité
société, mais majoritairement `["B06","B03"]` sur les clauses de gouvernance
génériques (les statuts eux-mêmes donnent à INSIDE SAS une double capacité
opérationnelle + holding — classement passe 2 plausible, pas une erreur).
**Politique actée** : le classement passe 2 fait foi sur l'ensemble du lot,
divergence signalée jamais corrigée manuellement (voir la lesson buckets,
section 25bis / B99-T30).

**Document 1/9 de la boucle (statuts constitutifs 2011, `B99-T19`) = test
officiel du code corrigé** (post-fix stop_reason) : extraction unique,
garde non déclenchée, écriture, pipeline, injection — vérifié bout en bout.
22 décisions / 15 lessons. Révèle la société d'origine "INSIDE PRODUCTIONS"
(production audiovisuelle), associés fondateurs Florent Weil (65%),
Stéphane Rotenberg (30%), Laurent Varlet (5%).

**9 documents restants (`B99-T20` → `B99-T28`)**, alternance stricte
extraction→écriture→pipeline→injection par document (jamais de batch
d'extractions à l'avance — vérifié via id_dump séquentiels et
`threads_to_process/` resté vide entre chaque geste) :

- **B99-T20** — Dépôt d'actes 1 : statuts à jour 01/02/2016, siège Garancières.
- **B99-T21** — Dépôt d'actes 2 : PV changement objet social 01/02/2016.
  *(mentionne encore "INSIDE PRODUCTIONS" dans le corps — anomalie #4,
  manquée dans le compte-rendu de l'époque, rattrapée ensuite — voir la
  lesson section 25bis.)*
- **B99-T22** — Dépôt d'actes 3 : certificat de dépôt de fonds HSBC 15/07/2011.
- **B99-T23** — Dépôt d'actes 4 : bulletin de souscription — **anomalie #1**
  (7 000 actions × 1 € vs 700 × 10 € dans les statuts constitutifs signés
  4 jours plus tard, même capital).
- **B99-T24** — Dépôt d'actes 5 : PV AG mixte 24/11/2012 — **anomalie #2**
  (feuille de présence "1 000 actions" vs 665+35=700 réels) ; révèle un
  changement de Président (Weil → Nicolas Boizot) et transfert de siège
  jusqu'ici inconnu du système.
- **B99-T25** — Dépôt d'actes 6 : statuts à jour 12/10/2015. **Deux incidents
  d'exécution distincts, tous deux diagnostiqués avant retry, jamais
  relancés en aveugle** : (a) timeout silencieux du LLM d'extraction
  (>2 min, exit 143) — diagnostic PDF externe avant retry (`mdls`/`strings` :
  12 pages, JBIG2, profil identique au doc 1 qui avait déjà réussi → pas un
  document dégradé → retry unique autorisé, réussi en ~4 min) ; (b)
  `ConnectTimeoutError` réseau distinct sur l'ingest passe 1 lui-même, retry
  immédiat réussi.
- **B99-T26** — Dépôt d'actes 7 : PV pivot 12/10/2015 — Florent Weil redevient
  Président, dénomination INSIDE PRODUCTIONS→INSIDE SAS, objet social changé.
- **B99-T27** — Dépôt d'actes 8 : "Liste des sièges antérieurs" — **anomalie
  #3** (ne remonte qu'à 2012, omet le vrai premier siège de 2011).
- **B99-T28** — Dépôt d'actes 9 (sans numéro) : PV transfert de siège
  10/11/2021 vers Méré (raccorde avec B99-T18).

**Total lot documentaire : 90 décisions + 62 lessons créées**, tous les
`injection_status` vérifiés `done` en direct dans Notion (aucun document
écarté sur les 11).

**Dump de synthèse transversale (`B99-T29`)** — fichier pré-rédigé
`/Users/florentweil/Dev/dump/DUMP_INSIDE_SAS_CORPORATE_2011-2021.md` (analyse
croisée faite dans l'app Claude le 20/08, thread brut non ingéré séparément
par choix documenté dans le dump lui-même). Vérifié avant ingestion : l'Agent
Synthèse (`sources.mjs`) ne lit **aucune** base entities (seulement
DECISIONS/LESSONS/THREAD_DUMP) → dump ingéré sans risque de doublon. Section
4 du dump (INDÉTERMINÉ — trou documentaire sur les cessions d'actions
2011-2015) vérifiée en direct : n'est devenue **aucune décision assertant les
faits non prouvés** — passée en LESSON prudente ("l'absence d'actes de
cession ne signifie pas que les cessions n'ont pas eu lieu — conformité
indéterminée, ne jamais conclure par défaut de preuve contraire"). 7d/7l.

---

## 25. 4 bugs pipeline trouvés et gravés (famille sorties silencieuses/indéterminées)

Tous constatés en direct pendant le BLOC 3, tous gravés au BACKLOG_DEV
(PIPELINE, table SYSTEME pour P34), commit séparé par item :

- **P13** (`2a60bf0`) — `os:ingest` en mode interactif : prompt fermé sans
  réponse (stdin non-TTY) = exit 0 silencieux, aucun traitement, aucun
  signalement. Constaté sur le tout premier geste du BLOC 1.
- **P14** (`cccd35e`) — Agent Ingestion Docs sans mode non-interactif
  extract-then-write déterministe. Contournement construit ce thread
  (script de revue externe + réutilisation manuelle du texte relu via
  `writeDump()`), fix structurel souhaitable : CLI scindé
  `--extract-only`/`--write-from`.
- **P34** (`a50b61f`, table SYSTEME) — `claudeFetch()` jette `stop_reason`
  par défaut, 7 appelants (passe 1/2, agents Synthèse/Associé/Ouverture/
  Pilotage) ne détectent pas une réponse tronquée par `max_tokens`. **Fix
  appliqué pour un seul appelant** (Agent Ingestion Docs, root cause du
  pilote tronqué) : `claudeFetch({ full: true })` expose désormais
  `{ text, stopReason }`, rétro-compatible — commits `f799fe2` (mitigation
  max_tokens 8000→16000), `73aa307` (fix racine, throw si
  `stopReason !== "end_turn"`), `c7ca7a3` (export `buildDumpText`
  nécessaire à la réutilisation verbatim).
- **P15** (`2f0503b`) — timeout API silencieux (exit 143 externe) non
  distingué en interne d'un échec de contenu. Constaté sur le document 6/9
  du lot corporate (diagnostic PDF externe requis avant de pouvoir juger
  s'il fallait retenter — voir section 24).
- **P16** (`85ec443`) — `clearBlockChildren`/`deleteBlock`
  (`os/lib/notion.mjs:153`) non idempotent sur un bloc déjà archivé (état
  résiduel après un 504 ayant interrompu un run `os:docs-sync` antérieur) :
  `deleteBlock` renvoie `400 "Can't edit block that is archived"`,
  `os:docs-sync` plante mi-course. Constaté à la clôture — voir section 26.

**Une LESSON distincte gravée en mémoire Notion (pas au BACKLOG)**,
`B99-T30`, sur demande explicite de Florent :
1. Le contenu juridique/statutaire fait se chevaucher B02/B03/B06 sans
   critère de classement stable posé en amont — affluent de la question
   d'architecture ouverte (docs dans buckets métier vs système documentaire
   séparé, déjà notée dans INSIDE_OS_VISION, thread T39).
2. Corollaire opérationnel constaté en direct sur ce thread : l'anomalie #4
   (PV 2016 "INSIDE PRODUCTIONS") a été manquée dans le compte-rendu
   pendant la période où les comptes-rendus par document du BLOC 3 avaient
   été compressés en une ligne (documents 2 à 5), et n'a été rattrapée
   qu'au retour à des comptes-rendus complets — **la granularité du
   compte-rendu document par document est un canal de détection des
   anomalies à part entière, pas un confort de présentation**.

0 décision parasite (vérifié en direct : 0d/2l sur `B99-T30`).

---

## 26. docs-sync — état final ROUGE, miroir Notion partiellement stale

**Verdict explicite, pas supposé** (conforme à la consigne de ce thread :
« vert constaté ou rouge signalé », jamais « probablement passé »).

Relancé après 3 commits BACKLOG (P13/P14/P15) depuis le dernier vert connu
(`2a60bf0`) : tourné ~6 minutes, **échoué** :
```
❌ Notion 400 : "Can't edit block that is archived. You must unarchive the block before editing."
```
sur la page miroir `PROMPT_AGENT_PILOTAGE`, juste après un 504 retried avec
succès sur `PROMPT_AGENT_SYNTHESE`. Cause diagnostiquée (pas seulement
constatée) et gravée en P16, section 25 : `clearBlockChildren()` liste les
blocs enfants puis les archive un par un sans tolérer qu'un bloc soit déjà
archivé (état résiduel d'un run antérieur interrompu par un 504) —
`deleteBlock` plante au lieu de traiter le cas comme un succès idempotent.

**État exact du miroir Notion à cette clôture — la session suivante doit
lire ceci avant de faire confiance au miroir :**

| Page miroir | État |
|---|---|
| CLAUDE.md | ✅ à jour au commit `2f0503b` |
| README.md | ✅ à jour au commit `2f0503b` |
| BACKLOG_DEV.md | ⚠️ à jour au commit `2f0503b` (P13/P14/P15) — **manque P16** (`85ec443`, postérieur à ce push) |
| BACKLOG_USER.md | ✅ à jour au commit `2f0503b` |
| IDEAS.md | ✅ à jour au commit `2f0503b` |
| PROMPT_MAITRE v17 | ✅ à jour au commit `2f0503b` |
| PROMPT_ASSOCIE v03 | ✅ à jour au commit `2f0503b` |
| PROMPT_AGENT_SYNTHESE | ✅ à jour au commit `2f0503b` (poussée juste avant l'échec) |
| **PROMPT_AGENT_PILOTAGE** | ❌ **STALE — encore au commit `2a60bf0`** (échec sur cette page précisément) |
| **PROMPT_AGENT_OUVERTURE** | ❌ **STALE — encore au commit `2a60bf0`** (jamais atteinte ce run) |
| **PROMPT_INGEST_DOC** | ❌ **STALE — encore au commit `2a60bf0`** (jamais atteinte ce run) |
| **PROMPT_AGENT_INFRA_TECH** | ❌ **STALE — encore au commit `2a60bf0`** (jamais atteinte ce run) |
| **Repointage ancienne page "INSIDE-OS-BACKLOG"** | ❌ **jamais exécuté ce run** (dernière étape du script, jamais atteinte) |

Contenu réel de PROMPT_AGENT_PILOTAGE/OUVERTURE/INGEST_DOC/INFRA_TECH non
modifié ce thread (donc pas de divergence de fond sur ces 4 prompts eux-mêmes)
— le risque concret est que **BACKLOG_DEV.md sur le miroir ne montre pas P16**
tant que le prochain `os:docs-sync` n'aura pas réussi. **Pas de fix tenté ce
soir** (décision explicite de Florent) — le fix (traiter "already archived"
comme un succès dans `deleteBlock`) est gravé en P16, à faire une prochaine
session avant de relancer `os:docs-sync`, faute de quoi le même échec se
reproduira probablement au même point.

---

## 27. Clôture de session B09-T43

Les deux gestes de fin de session appliqués, avec un aménagement assumé sur
le premier : `os:docs-sync` a été relancé et a produit un **verdict ROUGE
diagnostiqué** (section 26) plutôt qu'un vert — conforme à la consigne
explicite de ce thread, pas une omission. Aucune nouvelle tentative de fix
ou de relance ce soir. Ce fichier, régénéré, documente l'état stale exact
pour que la session suivante ne le suppose jamais aligné sans vérifier.

**Bilan de la session B09-T43** : migration Drive clôturée en mémoire
(B99-T17), doctrine de numérotation des threads gravée, 11 actes corporate
+ 1 dump de synthèse + 1 lesson buckets ingérés (90 décisions, 62 lessons,
0 document écarté), 4 bugs pipeline diagnostiqués et gravés (P13-P16, dont
1 fix appliqué en direct — stop_reason sur l'Agent Ingestion Docs), miroir
Notion partiellement stale et documenté avec précision plutôt que supposé
à jour.

**Points ouverts, non traités à cette clôture, portés à la session
suivante** :
- P16 à corriger avant la prochaine relance `os:docs-sync` (sinon échec
  probable au même point).
- BACKLOG P13, P14, P15 : fixes non appliqués, seulement gravés.
- Lesson buckets (B99-T30) : gravée en mémoire mais l'arbitrage de fond
  (taxonomie buckets sur actes de société, question docs-métier vs
  système-documentaire) reste ouvert — affluent d'INSIDE_OS_VISION T39.
- 6 coquilles vides du Drive toujours à supprimer au Finder (section 20).
- `.gitignore` non commité, couverture `runtime/` incomplète (portés depuis
  la clôture précédente, section 21, toujours non traités).
- `docs-a-ingerer/` : les 11 PDF sont ingérés, référence désormais dans le
  Drive — **rappel : le sas peut être vidé** (geste manuel, aucune
  suppression faite par cette session).

---

## Commits de la session (chronologique)

```
bd8d1bb chore(inject): garde anti-réinjection B99-T99
8411cdb feat(agents): Agent Synthèse v01
ed0a7a6 chore(data_cemetery): normalise permissions 644
a0f1df7 fix(agents): Agent Synthèse — date d'exemple périmée
e38efb8 fix(chat) — scoring : exclusion des méta-mots du boost
54b3cce fix(chat) — gate des boosts B99 sur la pertinence réelle
5409ee2 fix(chat) — pagination complète des datasources
7f6f93c chore(backlog): grave P26/P27
57414cd fix(agents): Agent Synthèse — bug structurel scoreItem/describePage
4ff378e feat(chat,agents): decision_status + created_time
829aada feat(scripts): os:statut
f8d5b3a feat(agents): Agent Pilotage v01
f29fc74 docs(prompts): PROMPT_AGENT_PILOTAGE_v01
216a58c chore(backlog): grave P28
12e5b8d fix(tokenize) — préservation des acronymes courts
7febefa fix(ingest) — garde SKIP_BUCKETS jamais appliquée
54b792e chore(backlog): grave P29
9d7932b feat(agents): Agent Ouverture v01
f1bcfaa docs(prompts): PROMPT_AGENT_OUVERTURE_v01
b1fe546 fix(ouverture) — plafond famille INSIDE OS
c745df3 fix(ouverture) — diversité minimale + anti-monopole
7176bbb chore(backlog): grave P30
db70658 feat(ouverture) — canal essentiel
95a003f chore(backlog): P30 [DONE]
120c35b feat(ingest-doc): Agent Ingestion Docs
d316622 docs(prompts): PROMPT_INGEST_DOC v01
dac40db chore(docs): archivage protocole abandonné et notes résolues
921512d feat(readme): README.md stable à la racine
d6484f4 docs(claude): doctrine post-abandon clôture/CONTEXT
5d3862f docs(prompt-maitre): v17
97e90d7 chore(backlog): entrées de réconciliation post-abandon clôture
188b850 feat(docs-sync): os:docs-sync (check pointeurs)
1aca679 chore(docs): archive REGLES_DOCS_SYSTEME... .txt
32ffd80 chore(backlog): réconciliation post-abandon protocole
256c51e chore(repo): nettoyage scories
9550053 chore(doctrine): récap de session standardisé
f3c57f6 feat(docs-sync): miroir doctrine repo → Notion
0a61360 fix(ingest): purge des bruts après clean
2bd549d fix(ingest): garde d'idempotence + retrait DEFAULT_SKIP_BUCKETS B09
4df7214 chore(doctrine): recap-session.md ↔ os:docs-sync, fin de session
f917a6a docs(prompts): PROMPT_ASSOCIE v03
df3902d feat(agents): Agent Associé v1
ed46d4d chore(doctrine): régénération recap-session.md (clôture précédente)
29c64ba chore(backlog): P33 — script de déduplication Drive par hash SHA
        chore(doctrine): régénération recap-session.md (clôture sous B09-T42)
f498511 chore(doctrine): régénération recap-session.md, clôture — B09-T42

--- migration Drive hors repo (section 20), aucun commit ---
--- relabellisation du thread : B09-T42 brûlé → B09-T43 ---

ad62898 chore(doctrine): régénération recap-session.md — migration Drive B99-T16 close
fc4e0d5 chore(doctrine): règle de numérotation des threads — B09-T43
2a60bf0 chore(backlog): grave P13 — os:ingest exit silencieux si prompt interactif fermé sans réponse
f799fe2 fix(ingest-doc): max_tokens 8000→16000 — extraction tronquée sur document dense
73aa307 fix(ingest-doc): stop_reason vérifié — fail-loud sur extraction tronquée
a50b61f chore(backlog): grave P34 — claudeFetch() jette stop_reason sur 7 appelants
cccd35e chore(backlog): grave P14 — Agent Ingestion Docs sans mode extract-then-write déterministe
c7ca7a3 refactor(ingest-doc): exporte buildDumpText — réutilisable sans ré-extraction
2f0503b chore(backlog): grave P15 — timeout API silencieux non distingué en interne
85ec443 chore(backlog): grave P16 — clearBlockChildren non idempotent sur bloc archivé, docs-sync plante mi-course
        chore(doctrine): régénération recap-session.md, clôture — B09-T43 (ce geste)
```

---

## Prochaine étape suggérée

**Avant tout autre chantier** : corriger P16 (`deleteBlock` idempotent sur
bloc déjà archivé) puis relancer `os:docs-sync` une fois — sans ça, le
miroir Notion reste stale sur 4 pages + le repointage de l'ancienne page
backlog, et toute session future qui s'y fierait sans relire ce recap serait
trompée. Ensuite, fixer P13/P14/P15 reste possible mais moins urgent (déjà
contournés manuellement pendant ce thread, pas bloquants pour l'usage).

Sur le fond métier : le lot corporate INSIDE SAS (12 pièces, chronologie
2011-2021 complète, 4 anomalies documentées, trou documentaire sur les
cessions 2011-2015 explicitement marqué INDÉTERMINÉ) est la première
matière juridique/corporate réelle absorbée par le système — un bon test de
charge pour l'Agent Synthèse sur une entité, si l'usage réel continue de
primer sur l'empilement de nouveaux chantiers système. Le Drive reste à
finir de ranger côté Florent (6 coquilles au Finder). La question
d'architecture documents (buckets métier vs système documentaire séparé,
relancée par la lesson B99-T30) reste ouverte — pas à trancher par défaut,
mais elle a maintenant un deuxième cas d'usage concret pour informer la
décision le jour où elle sera prise.
