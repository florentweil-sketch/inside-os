# Récap de session — B09-T42-Notion-Dev-030

Date : 2026-08-16
Thread : B09-T42 (Notion-Dev-030)
Portée : session longue, ~35 commits, plusieurs chantiers enchaînés.

**Note de statut.** Ce fichier n'est pas une résurrection du protocole CONTEXT
(abandonné dans cette même session — voir plus bas). C'est un récap de travail
ordinaire, non versionné, non référencé par CLAUDE.md ni par le périmètre
docs-sync — un instantané écrit à la demande, pas un document système.

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
11. Rationalisation documentaire majeure — abandon du protocole de clôture/CONTEXT/PRE_THREAD, archive/, README.md stable, CLAUDE.md/PROMPT_MAITRE v17, os:docs-sync
12. Réconciliation BACKLOG_DEV + nettoyage repo
13. Points ouverts en attente de décision

---

## 1. Garde anti-réinjection B99-T99

`os/lib/guard.mjs` : `assertNotBlockedDumpId()`, motif bloqué `/^B99-T99(-.*)?$/`.
Câblée fail-loud dans `os/inject/inject-decisions-lessons.mjs` et
`os/extract/extract-thread-dump.mjs` — throw immédiat, pas de skip silencieux.
Contexte : 27 items de fausse donnée B99-T99 retirés de Notion le 2026-08-07.
Vérifié : B99-T07 (id légitime) n'est pas bloqué.

Commit : `bd8d1bb`

---

## 2. Agent Synthèse

Premier agent de la couche Action — synthèse sourcée sur un sujet donné, lecture
seule, croise DECISIONS/LESSONS/THREAD_DUMP.

**Bug structurel majeur trouvé** : `scoreItem`/`describePage` (`os/agents/synthese/sources.mjs`)
lisaient des propriétés Notion inexistantes (`title`, `raw_text` — DECISIONS a une
propriété `decision`, LESSONS a `lesson`, aucune n'a `raw_text`). Conséquence :
le score était **toujours 0**, l'agent n'avait **jamais** retourné un seul résultat
depuis sa création. Corrigé par tagging `_itemType` + mapping `ITEM_FIELDS` par type.
Vérifié en direct : 0 → 10 résultats sourcés sur "Clémence Porret".

**Bug secondaire** : prompt système avec une date d'exemple périmée (2026-05-25) —
corrigé, date réelle du run injectée dans le contexte transmis au LLM.

Commits : `8411cdb`, `57414cd`, `a0f1df7`
Prompt : `docs/prompts/synthese/PROMPT_AGENT_SYNTHESE_v01.md` + `SPEC_AGENT_SYNTHESE_v01.md`

---

## 3. os:chat — trois bugs de scoring

- **Méta-mots** : le mot "mémoire" dans la question de l'utilisateur était compté
  deux fois dans le scoring (token réel + `phraseBoosts`), gonflant des items
  hors-sujet au-dessus du seuil. Fix : `META_WORDS` exclus du tokenizer.
- **Boost B99 inconditionnel** : `isPresentDump`/`isStateDump` (+20/+40) s'appliquaient
  à *tout* item B99 quelle que soit la question, même après le fix méta-mots.
  Gaté derrière `questionTargetsCurrentSystem(tokens)`.
- **Pagination tronquée à 80** : `getDecisions`/`getLessons` ne lisaient que la
  première page. Corrigé — pagination complète, plafond configurable
  `CHAT_FETCH_LIMIT` (0/absent = tout lire), total loggé à chaque run.

Vérifié : "Clémence Porret" → résultats réels sourcés (pas de bruit B99) ;
"état du projet" → résultats présents (pagination) ; "où en est le pipeline
INSIDE OS" → items B99 pertinents remontent (boost gaté correctement).

Commits : `e38efb8`, `54b3cce`, `5409ee2`

---

## 4. os:ingest — SKIP_BUCKETS jamais appliqué

`DEFAULT_SKIP_BUCKETS=["B09"]` était comparé après `.toUpperCase()` contre un
sentinel minuscule `"__default__"` — la comparaison n'était jamais vraie, donc
l'exclusion par défaut de B09 ne s'appliquait **jamais** en pratique sur un batch
sans `--skip-buckets` explicite. Corrigé — comparaison sur la valeur brute.

Commit : `7febefa`

---

## 5. decision_status + created_time, et os:statut

`decision_status` (proposed/validated/superseded/archived/draft/rejected) était
rempli à 100% par l'extracteur mais jamais lu ni affiché par le chat ni les
agents, et rien ne posait jamais superseded/archived/rejected.

- Lecture : chat + Agent Synthèse affichent désormais `[statut | date]` par
  item, avec consignes de lecture (proposed = hypothèse, validated = formulation
  ferme dans le thread source PAS validation de Florent, item ancien = marqué
  "à vérifier").
- Curation : `os/scripts/statut.mjs` (`npm run os:statut -- <uid> <statut>`) —
  seul point d'écriture pour superseded/archived/rejected, fail-loud si uid
  introuvable ou statut invalide.

Commits : `4ff378e`, `829aada`

---

## 6. Agent Pilotage

Le "copilote opérationnel" (thread B99-T07) — format strict ÉTAT/BLOCAGE/ACTION,
réutilise le socle Synthèse. Boost présent/récent modéré (+3/+1) appliqué
seulement sur le classement, jamais sur le filtre — pour éviter la classe de
bug trouvée en #3.

Commits : `f8d5b3a`, `f29fc74`
Prompt : `docs/prompts/pilotage/PROMPT_AGENT_PILOTAGE_v01.md`

---

## 7. Fix tokenizer — acronymes courts

`tokenize()` dans le socle partagé (`sources.mjs`) filtrait tout mot < 4 lettres,
éliminant des sigles métier légitimes ("SAS"). Fix : un token de 2-3 caractères
est retenu s'il apparaît tout en MAJUSCULES dans le sujet original. Vérifié :
"Inside SAS" → tokens=[inside,sas], réponse spécifique (au lieu de générique) ;
"Atelier de la Colombe" → inchangé, pas de régression.

Commit : `12e5b8d`

---

## 8. Injection de 3 dumps métier réels (B99-T11/T12/T13)

Manoir Septeuil/Raya Salamé (B02/B07), Chantier B1 Bis/Bougival (B02/B07),
Régularisation sièges sociaux Inside Archi/Inside SAS (B02/B06/B03). Pipeline
complet, 0 erreur (audit 100/100 extract+inject). Vérifié via
`os:pilotage --sujet "B1 Bis"` — reflète démarrage 15/09 et acompte reçu.

---

## 9. Agent Ouverture — le brief du matin

`npm run os:ouverture` (sans sujet — pas de scoring par pertinence textuelle,
sélection déterministe : présent B99, récent 30j, proposed, + canal essentiel).

Itérations, chacune vérifiée en direct avant la suivante :
1. **v01** — agent construit, format familles par bucket (Chantiers/Juridique/
   Holding/Commercial/INSIDE OS/Autre).
2. **Plafond INSIDE OS** — items B09 cappés à 3 max, familles business
   remplissent le cap de 20 en premier.
3. **Diversité/anti-monopole** — deux tentatives : règle en prompt seule (le LLM
   ne la respectait pas en pratique) puis pré-filtrage par bucket en code (a
   cassé Commercial et perdu la tâche "transfert Inside Archi" par un tie-break
   arbitraire) → solution retenue : **post-traiter la sortie texte du LLM**
   (`enforceSourceDumpCap`), préserve le jugement du LLM tout en garantissant
   le plafond.
4. **Canal essentiel manquant** — Commercial/Holding sortaient vides malgré les
   fix précédents ; cause réelle : le canal "essentiel" (décisions
   impact=critical/major des buckets métier, sans filtre de récence) manquait
   de la spec d'origine. Reconstruit avec **rotation quotidienne déterministe**
   (`hash(date+uid)`, FNV-1a) plutôt qu'un classement fixe — 240 décisions
   critical pour 15 places exige une rotation, pas un palmarès figé qui
   montrerait toujours les mêmes items. 10 places critical + 5 places major
   réservées (pas de priority-fill). Vérifié : deux dates simulées → sélections
   différentes ; marqueur "(à vérifier — ancien)" présent sur les items anciens.

Commits : `9d7932b`, `f1bcfaa`, `b1fe546`, `c745df3`, `7176bbb`, `db70658`, `95a003f`
Prompt : `docs/prompts/ouverture/PROMPT_AGENT_OUVERTURE_v01.md`

---

## 10. Agent Ingestion Docs

Verse un document (PDF) dans la mémoire INSIDE OS : lecture via l'API Claude
(content block `document` base64, pas de beta header requis), extraction
factuelle stricte (montants, dates, parties, conditions — incertitudes du
document marquées comme telles, jamais actées), confirmation interactive
obligatoire avant écriture (`--yes` pour l'automatiser), dépôt dans
`data/threads_to_process/` avec le prochain id_dump B99-Txx libre calculé en
lisant Notion live.

Garde-fous : PDF illisible/vide/>20 Mo rejeté explicitement, bucket invalide
rejeté, id_dump déjà pris rejeté (Notion + fichier local), garde anti-B99-T99
appliquée.

**Vérifié en production réelle** (pas un test synthétique) : devis signé
INSIDE SAS / M. & Mme Fernet (252 194,05 € TTC, 15 lots) → extraction validée
manuellement contre le PDF original par Florent → dump B99-T14 → pipeline
(9 décisions, 8 lessons, 0 erreur sur 101/101) → `os:pilotage --sujet "Fernet"`
reflète correctement montant, lots, dates, incertitudes.

Commits : `120c35b`, `d316622`
Prompt : `docs/prompts/ingest-doc/PROMPT_INGEST_DOC_v01.md`

---

## 11. Rationalisation documentaire — abandon du protocole de clôture

Décision structurante du thread : **le protocole de clôture dédié est abandonné
en entier** (`os-thread-close.mjs`, génération d'un `CONTEXT vXX` local,
audit `PRE_THREAD`). Remplacé par le flux minimal : dump texte → pipeline
standard, identique pour tout thread y compris B09. Cause profonde : l'état du
système vit désormais dans Notion (B99) plutôt que dans des `.md` locaux édités
à la main et sujets à divergence (l'incident PRE_THREAD de B09-T39 qui avait
motivé la règle anti-hallucination système).

**Archivage** — convention `archive/` existante réutilisée (pas de `docs/archive/`
parallèle), sous-dossiers par famille :
- `archive/context/` — 32 versions `INSIDE_OS_CONTEXT_v01..v32.md`
- `archive/readme/` — 12 versions `README_INSIDE_OS_v01..v12.md`
- `archive/pre-threads/` — 5 fichiers PRE_THREAD (dont un orphelin resté à la racine)
- `archive/scripts/` — `os-thread-close.mjs`, `pre-thread.mjs`
- `archive/docs-notes/` — `PIPELINE_BUG.md`, `PIPELINE_TESTING.md`, et un fichier
  `.txt` décrivant le même protocole trouvé après coup lors d'un balayage final

Renommage `docs/prompts transfert thread/` → `docs/prompts-transfert-thread/`
(espace supprimé du nom de dossier).

**Contenus réécrits/créés** :
- `README.md` stable à la racine (nom stable, git assure le versionnage) —
  contenu de `README_INSIDE_OS_v12` mis à jour : couche Action documentée
  (absente de v12, produite avant son existence), protocole de clôture
  abandonné retiré, roadmap actualisée
- `CLAUDE.md` — commandes des 5 agents/scripts Action layer ajoutées, tableaux
  "Documents système"/"Sources de vérité" mis à jour (CONTEXT retiré, chemins
  renommés), nouvelles règles doctrinales : modification d'un agent = mise à
  jour du prompt dans le même commit ; périmètre docs-sync documenté +
  obligation de relancer `os:docs-sync` après tout commit le touchant
- `PROMPT_MAITRE v17` — retrait du protocole de clôture 4 phases et de la
  section génération CONTEXT (formats STANDARD/COMPACT, ~180 lignes sans
  consommateur), remplacés par le protocole minimal ; reste inchangé :
  posture de confrontation, anti-hallucination, saturation/STOP (reformulée
  sans présupposer un document CONTEXT formel), contexte permanent, buckets,
  contrat JSON, sécurité, granularité des commits

**Outil construit** : `npm run os:docs-sync` (`os/scripts/docs-sync.mjs`) —
vérifie que les pointeurs "(latest = vNN)" déclarés dans CLAUDE.md correspondent
aux fichiers vXX réellement présents sur disque pour le périmètre docs-sync (8
familles de prompts + 5 fichiers simples). Une famille sans pointeur déclaré est
signalée "non déclarée" (informationnel), jamais faussement "OK". Vérifié en
live : verdict ALIGNÉ, exit 0.

**Point ouvert documenté, pas corrigé** : `DEFAULT_SKIP_BUCKETS=["B09"]` dans
`os/ingest/ingest-thread-dump.mjs` contredit la nouvelle doctrine (B09 devrait
désormais passer par dump→pipeline comme tout thread) — le code n'a pas été
changé. Un `os:ingest` batch sans `--only` exclut donc encore silencieusement
les dumps B09. Suivi : BACKLOG_DEV P31.

Commits : `dac40db`, `921512d`, `d6484f4`, `5d3862f`, `188b850`, `1aca679`

---

## 12. Réconciliation BACKLOG_DEV + nettoyage repo

**BACKLOG_DEV** — chaque entrée SYSTEME référençant l'ancien protocole tranchée
(aucune suppression, trace conservée) :
- `[DROPPED — B09-T42]` : P1, P9b, P23, P24 — n'ont plus d'objet
- `[DONE]` + note de fin de vie : P9, P10, P11, P17, P19 — capacités livrées et
  vérifiées en leur temps, hôte désormais archivé
- `[DONE]` par résolution différente : P12 (volet pointeurs couvert par
  os:docs-sync), P22 (résolu par archivage complet plutôt que suppression)
- Reformulées (besoin survivant) : P2 (sync BACKLOG→Notion, découplée de la
  clôture), P14 (politique d'archivage, CONTEXT/README/PRE_THREAD retirés)
- P20 (source d'état unique) : périmètre réduit — CONTEXT/PRE_THREAD résolus
  par suppression, BACKLOG_DEV/USER hors périmètre, reste `[TODO]`
- P31 (nouveau) : DEFAULT_SKIP_BUCKETS non réconcilié
- P32 (nouveau) : capacité d'audit 3-axes de l'ancien pre-thread.mjs signalée
  comme candidate à reconstruction autonome, pas reconstruite

**Nettoyage repo** (chaque suppression vérifiée avant d'agir) :
- Supprimés : `inside-os@1.0.0` et `node` (fichiers vides, racine, commande mal
  tapée en avril, tracés git) ; `os/_ESRGAN_16698.png - copie.pdf` (10 Mo,
  untracked) ; `inside-os-backup/` (dossier vide)
- Vérifié, rien à faire : aucune copie du PDF Fernet dans le repo (seuls les
  dumps texte légitimes le mentionnent, l'original reste hors repo dans
  `~/Dev/docs-a-ingerer/`) ; `.DS_Store` déjà dans `.gitignore` et déjà non
  tracké
- Balayage final racine + `os/` : tout fichier appartient à une catégorie
  connue, aucun orphelin restant

Commits : `97e90d7`, `32ffd80`, `256c51e`

---

## 13. Points ouverts en attente de décision

1. **Page Notion "INSIDE-OS-BACKLOG"** (`35b5e503-b0ac-81d8-8c6d-f6bb8a796a4d`,
   sous `INSIDE_OS_ROOT`) — trouvée obsolète : dernière maj 2026-05-10
   (B09-T34), reflète l'ancien `BACKLOG.md` monolithique pré-split DEV/USER
   (s'arrête à SYSTEME P8, le repo est maintenant à P32). Aucune page
   "Doctrine — miroir" trouvée dans le workspace — ce nom ne correspond à rien
   d'existant. Décision en attente : réutiliser (mise à jour + restructuration
   DEV/USER) ou remplacer (nécessite de définir où loger la nouvelle page).

2. **`data/threads_to_process/` ne se vide pas après clean** — trouvé lors de
   la vérification "pas de copie du PDF Fernet" : les bruts B99-T14 (Fernet) et
   B09-T38/T39/T40 (mai) sont toujours présents dans `threads_to_process/`
   alors que la doctrine dit que le brut est supprimé après l'étape clean
   d'`os:ingest`. Semble être un bug pipeline réel, présent depuis mai au
   moins. Ni corrigé ni nettoyé manuellement — pas dans le périmètre demandé
   de ce thread. Décision en attente : entrée BACKLOG_DEV, ou diagnostic
   immédiat.

3. **BACKLOG_DEV P31** — `DEFAULT_SKIP_BUCKETS=["B09"]` non réconcilié avec la
   doctrine post-abandon (voir #11 ci-dessus).

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
188b850 feat(docs-sync): os:docs-sync
1aca679 chore(docs): archive REGLES_DOCS_SYSTEME... .txt
32ffd80 chore(backlog): réconciliation post-abandon protocole
256c51e chore(repo): nettoyage scories
```

---

## Prochaine étape suggérée

Trancher les 2 points ouverts (#13.1 Notion, #13.2 threads_to_process/), puis
revenir à la couche Action (au sens de PROMPT_MAITRE : produire de la valeur
entreprise réelle, pas empiler de l'infra) — les 4 agents construits ce thread
et le précédent (Synthèse, Pilotage, Ouverture, Ingestion Docs) sont
opérationnels et vérifiés ; le prochain geste naturel est de les faire tourner
sur de la matière réelle plutôt que d'ouvrir un nouveau chantier système.
