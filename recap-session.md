# Récap de session — B09-T42-Notion-Dev-030

Date : 2026-08-20 (régénéré — clôture de session)
Thread : B09-T42 (Notion-Dev-030)
Portée : session très longue, 43 commits sur le repo + une migration complète
du Google Drive réel exécutée hors repo (aucun commit associé, ni requis).

**Note de statut.** Ce fichier n'est pas une résurrection du protocole CONTEXT
(abandonné dans cette même session — voir section 11). C'est le canal de
transfert de fin de session vers l'architecte-conseil, non versionné, non
référencé par le périmètre docs-sync. Sa réécriture à chaque fin de session,
et la relance d'`os:docs-sync` quand le périmètre est touché, sont gravées
dans CLAUDE.md comme deux gestes de fin de session au même titre l'un que
l'autre.

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
20. **Migration Google Drive réelle — nomenclature B99-T16 (exécutée en direct, hors repo)**
21. Clôture de session

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
enfants de **"Doctrine — miroir"** (sous `INSIDE_OS_ROOT`), idempotent,
fail-loud. Ancienne page "INSIDE-OS-BACKLOG" repointée.

**Doctrine — miroir : https://www.notion.so/3be5e503b0ac8102ace7e00e9782552c**
— dernière relance vérifiée à jour au commit `29c64ba` (13/13 pages). Non
relancé depuis : aucun commit de cette session n'a touché le périmètre
docs-sync après ce point (la migration Drive, section 20, est hors repo).

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
(anomalie ci-dessus). **Point ouvert à la clôture** — suppression manuelle
laissée à Florent, hors du périmètre `mv`-seul de cette migration.

Aucun commit associé (hors repo). Aucune donnée supprimée à aucun moment.

---

## 21. Clôture de session

**Repo Git** : dernier commit `29c64ba` (P33). Aucun commit n'a suivi car la
section 20 (migration Drive) s'est déroulée entièrement hors repo — le
périmètre docs-sync n'a pas été retouché depuis, `os:docs-sync` n'a donc pas
été relancé à cette clôture (rien à synchroniser). Seul le second geste de
fin de session s'appliquait : ce fichier, régénéré.

**État du repo à noter, non traité à cette clôture** (pré-existant, non
généré par la migration Drive) :
- `.gitignore` — modification locale non commitée depuis la section 18
  (ajout des lignes `drive-inventaire.md`/`drive-arbo.txt`). Toujours en
  attente d'un arbitrage (commit ou abandon).
- `runtime/` — répertoire non suivi contenant `logs/`, `ouverture/`,
  `pilotage/`, `synthese/` (sorties d'exécution des agents). Seul
  `runtime/logs/` est couvert par `.gitignore` ; les trois autres
  sous-dossiers ne le sont pas — écart de couverture à corriger si ces
  sorties ne doivent jamais être versionnées.

**5 agents de la couche Action opérationnels et vérifiés** : Synthèse,
Pilotage, Ouverture, Ingestion Docs, Associé.

**Migration Drive (section 20) : close.** Nomenclature B99-T16 appliquée
intégralement au Drive réel, en 5 étapes vérifiées une à une, sans aucune
suppression. Reste ouvert : 6 coquilles vides à supprimer au Finder (liste
en section 20) — geste manuel laissé à Florent, hors périmètre de cette
session.

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
        chore(doctrine): régénération recap-session.md, clôture (ce geste)
f498511 chore(doctrine): régénération recap-session.md, clôture de session — B09-T42

--- aucun commit après f498511 : la migration Drive (section 20) est hors repo ---
```

---

## Prochaine étape suggérée

La migration Drive (nomenclature B99-T16) est close côté structure : plus
rien à `mv`. Reste un geste manuel Florent-seul (suppression des 6 coquilles
vides au Finder, section 20-21) avant de considérer le Drive totalement
rangé. Côté repo, deux petits arriérés à trancher à la prochaine session
(`.gitignore` non commité, couverture `runtime/` incomplète) — ni l'un ni
l'autre urgent. Sur le fond, le système a 5 agents Action layer opérationnels
et un point d'entrée conversationnel unique : le prochain geste naturel reste
l'usage réel de ces agents sur de la matière métier plutôt que d'empiler un
nouveau chantier système ou de fusion (`BACKUP INSIDE`/`2. DRIVE INSIDE`
n'a jamais été demandé et reste hors périmètre).
