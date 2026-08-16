# Récap de session — B09-T42-Notion-Dev-030

Date : 2026-08-16 (régénéré — clôture de session)
Thread : B09-T42 (Notion-Dev-030)
Portée : session longue, 40 commits, plusieurs chantiers enchaînés.

**Note de statut.** Ce fichier n'est pas une résurrection du protocole CONTEXT
(abandonné dans cette même session — voir plus bas). C'est le canal de
transfert de fin de session vers l'architecte-conseil, non versionné, non
référencé par le périmètre docs-sync. Sa réécriture à chaque fin de session,
et la relance d'`os:docs-sync`, sont gravées dans CLAUDE.md comme deux
gestes de fin de session au même titre l'un que l'autre.

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
18. Clôture de session

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
lisaient des propriétés Notion inexistantes (`title`, `raw_text`). Le score
était **toujours 0**, l'agent n'avait **jamais** retourné un seul résultat
depuis sa création. Corrigé par tagging `_itemType` + mapping `ITEM_FIELDS`.
Vérifié en direct : 0 → 10 résultats sourcés sur "Clémence Porret".

Commits : `8411cdb`, `57414cd`, `a0f1df7`
Prompt : `docs/prompts/synthese/PROMPT_AGENT_SYNTHESE_v01.md` + `SPEC_AGENT_SYNTHESE_v01.md`

---

## 3. os:chat — trois bugs de scoring

Méta-mots comptés deux fois dans le score ; boost B99 appliqué sans condition
de pertinence ; pagination tronquée à 80 items. Les trois corrigés et vérifiés.

Commits : `e38efb8`, `54b3cce`, `5409ee2`

---

## 4. os:ingest — SKIP_BUCKETS jamais appliqué (bug historique, avant B09-T42)

Sentinel comparé après `.toUpperCase()`, ne matchait jamais — l'exclusion B09
par défaut ne s'appliquait jamais en pratique. Corrigé (fix du sentinel).
*Note : `DEFAULT_SKIP_BUCKETS` lui-même a depuis été retiré (section 15).*

Commit : `7febefa`

---

## 5. decision_status + created_time, et os:statut

Lecture affichée par le chat + Agent Synthèse (`[statut | date]`). Curation :
`os/scripts/statut.mjs` (`npm run os:statut -- <uid> <statut>`) — seul point
d'écriture pour superseded/archived/rejected. *Refactoré en section 17 pour
exporter une fonction réutilisable (`applyStatut`), consommée par l'Agent
Associé — un bug d'exécution-à-l'import a été trouvé et corrigé au passage.*

Commits : `4ff378e`, `829aada`

---

## 6. Agent Pilotage

Copilote opérationnel ÉTAT/BLOCAGE/ACTION, réutilise le socle Synthèse. Boost
présent/récent modéré (+3/+1) appliqué seulement sur le classement.

Commits : `f8d5b3a`, `f29fc74`
Prompt : `docs/prompts/pilotage/PROMPT_AGENT_PILOTAGE_v01.md`

---

## 7. Fix tokenizer — acronymes courts

Un token de 2-3 caractères est retenu s'il apparaît tout en MAJUSCULES dans
le sujet original ("SAS"). Vérifié sans régression.

Commit : `12e5b8d`

---

## 8. Injection de 3 dumps métier réels (B99-T11/T12/T13)

Manoir Septeuil, Chantier B1 Bis, Régularisation sièges sociaux. Pipeline
complet, 0 erreur. Vérifié via `os:pilotage`.

---

## 9. Agent Ouverture — le brief du matin

`npm run os:ouverture`, sélection déterministe (présent/récent/proposed +
canal essentiel). Itérations : plafond INSIDE OS, anti-monopole en
post-traitement (le pré-filtrage avait cassé Commercial et perdu une tâche
réelle), canal essentiel avec rotation quotidienne déterministe
(`hash(date+uid)`) pour éviter qu'un classement fixe montre toujours les
mêmes items parmi 240 décisions critical.

Commits : `9d7932b`, `f1bcfaa`, `b1fe546`, `c745df3`, `7176bbb`, `db70658`, `95a003f`
Prompt : `docs/prompts/ouverture/PROMPT_AGENT_OUVERTURE_v01.md`

---

## 10. Agent Ingestion Docs

Verse un PDF dans la mémoire — extraction factuelle stricte via l'API Claude,
confirmation interactive obligatoire, id_dump B99-Txx calculé live. **Vérifié
en production réelle** : devis Fernet (252 194,05 € TTC, 15 lots), extraction
validée manuellement par Florent contre le PDF, pipeline complet 0 erreur,
`os:pilotage --sujet "Fernet"` reflète correctement les chiffres.

Commits : `120c35b`, `d316622`
Prompt : `docs/prompts/ingest-doc/PROMPT_INGEST_DOC_v01.md`

---

## 11. Rationalisation documentaire — abandon du protocole de clôture

Décision structurante : le protocole de clôture dédié (`os-thread-close.mjs`,
génération CONTEXT vXX local, audit PRE_THREAD) est abandonné en entier,
remplacé par le flux minimal dump → pipeline. Archivage complet dans
`archive/` (convention existante réutilisée, sous-dossiers par famille :
`context/`, `readme/`, `pre-threads/`, `scripts/`, `docs-notes/`). Renommage
`docs/prompts transfert thread/` → `docs/prompts-transfert-thread/`.

`README.md` stable créé à la racine, `CLAUDE.md` et `PROMPT_MAITRE v17`
réécrits en conséquence (retrait ~180 lignes de génération CONTEXT sans
consommateur). Premier `os:docs-sync` construit (vérification des pointeurs
de version seule — étendu au miroir Notion en section 13).

Commits : `dac40db`, `921512d`, `d6484f4`, `5d3862f`, `188b850`, `1aca679`

---

## 12. Réconciliation BACKLOG_DEV + nettoyage repo

Chaque entrée SYSTEME référençant l'ancien protocole tranchée (DROPPED /
DONE avec note de fin de vie / reformulée) — aucune suppression, trace
conservée. Nettoyage repo : fichiers vides, PDF jetable, dossier backup vide
supprimés après vérification ; `.DS_Store` déjà correctement ignoré ; aucune
copie du PDF Fernet dans le repo.

Commits : `97e90d7`, `32ffd80`, `256c51e`

---

## 13. Miroir Notion doctrine

`os:docs-sync` étendu : après le check des pointeurs, pousse les 13 fichiers
du périmètre (5 simples + 8 familles de prompts) vers des pages Notion
enfants de **"Doctrine — miroir"** (créée sous `INSIDE_OS_ROOT`). Bandeau
"ne pas éditer ici" + markdown converti en blocs Notion (tables, code,
titres). Idempotent (clear + append par titre, jamais de duplication),
fail-loud. L'ancienne page "INSIDE-OS-BACKLOG" (obsolète, miroir manuel
pré-split DEV/USER) repointée vers le nouveau miroir.

**Doctrine — miroir : https://www.notion.so/3be5e503b0ac8102ace7e00e9782552c**
— relancé et vérifié à jour à la clôture de cette session (13/13 pages,
commit `df3902d`).

Commit : `f3c57f6`

---

## 14. Bug threads_to_process/ — diagnostic, fix, purge sélective

Le brut n'était jamais supprimé après clean (doctrine jamais implémentée,
bug présent depuis mai). Corrigé (`fs.unlink` après écriture Notion réussie).
Purge : B99-T14 et B09-T38 (vérifiés extraction+injection done) supprimés ;
B09-T39/T40 laissés en l'état (introuvables dans THREAD_DUMP — jamais
traités par ce pipeline, mémoire passée par l'ancien protocole archivé).

Commit : `0a61360`

---

## 15. P31 — garde d'idempotence + retrait DEFAULT_SKIP_BUCKETS B09

Nouvelle garde `assertNoExistingIdDump` : `os:ingest` refuse fail-loud tout
id_dump déjà présent dans THREAD_DUMP Notion (remplace l'ancienne
confirmation interactive qui laissait passer une mise à jour silencieuse).
`DEFAULT_SKIP_BUCKETS=["B09"]` retiré (désormais `[]`) — B09 passe par le
pipeline standard comme tout bucket. Doctrine corrigée aux 3 endroits qui
affirmaient encore "non résolu". Vérifié en direct : réingestion de B99-T11
rejetée proprement ; `os:audit` 0 erreur.

Commit : `2bd549d`

---

## 16. Doctrine recap-session.md ↔ os:docs-sync, même statut de fin de session

CLAUDE.md précise que réécrire `recap-session.md` et relancer `os:docs-sync`
sont deux gestes de fin de session obligatoires, au même titre l'un que
l'autre — appliqués tous les deux à cette clôture (sections 13 et 18).

Commit : `4df7214`

---

## 17. Agent Associé v1 — point d'entrée conversationnel unique

**Geste 1 — PROMPT_ASSOCIE v03** : dépoussiérage de v02. Conservés
intégralement : posture de confrontation, "la DB prime toujours", niveaux de
confirmation, routing datasource, règle des fiches de différenciation,
statut de L'Associé. Mis à jour : nouvelle section "Outils réels" documentant
les 4 agents réellement construits (Synthèse, Pilotage, Ouverture, Ingestion
Docs) comme outils invoqués ; les 15 agents métier de v02 (jamais construits)
déplacés en section "Casquettes futures — vision non implémentée", marqués
explicitement comme n'existant pas ; ENTITIES marqué "à construire" (v02 le
décrivait comme déjà enrichi, aucune extraction automatique ni saisie
manuelle n'existe).

**Geste 2 — Agent Associé** (`os/agents/associe/`, `npm run os:associe --
"message"`) : un appel LLM léger classifie l'intention (JSON strict,
fail-loud si inexploitable) et route vers Pilotage/Synthèse/Ouverture
(outils réels invoqués directement), repêchage mémoire scoré (intention
"memoire"), ou proposition de curation (intention "curation" — trouve le
candidat via repêchage restreint à DECISIONS, propose la commande
`os:statut` sans l'exécuter). La réponse finale est **toujours** formulée
par un second appel LLM avec le prompt PROMPT_ASSOCIE_v03 complet, à partir
de la sortie brute de l'outil — jamais un relais direct.

**Bug trouvé et corrigé en vérifiant l'agent de bout en bout** :
`os/scripts/statut.mjs` exécutait son `main()` CLI (lecture de
`process.argv`) au moment de l'import de `applyStatut()` par `associe.mjs`,
faute de garde d'exécution ESM — tuait le process avec les mauvais argv.
Corrigé (garde standard `import.meta.url === file://...`).

**Vérifié sur 5 messages réels, chaque route couverte** :
- "où en est le chantier Fernet" → pilotage, chiffres exacts, confrontation
  (angle mort avril-août signalé)
- "fais-moi le point sur Clémence Porret" → pilotage, deux décisions
  validated sourcées, confrontation sur l'absence de preuve d'exécution
- "je fais quoi ce matin" → ouverture, brief reformulé fidèlement, sources
  citées
- "que sait-on des prix Point P" → memoire, items hors-sujet reconnus comme
  tels et explicitement écartés — **pas d'hallucination**
- "la décision X est périmée" → curation, candidat trouvé (par coïncidence
  de scoring, la décision-mère de l'anti-hallucination elle-même) —
  confrontation forte avant de proposer l'exécution, commande **non
  exécutée** sans confirmation, vérifié en direct dans Notion :
  `decision_status` resté `validated`

Commits : `f917a6a` (prompt), `df3902d` (agent)

---

## 18. Clôture de session

Les deux gestes de fin de session (doctrine section 16) appliqués :
`os:docs-sync` relancé (périmètre touché par PROMPT_ASSOCIE v03 + CLAUDE.md)
— miroir Notion "Doctrine — miroir" à jour, 13/13 pages ; ce fichier
régénéré. Tous les commits de la session poussés sur `origin/main`.

**5 agents de la couche Action désormais opérationnels et vérifiés** :
Synthèse, Pilotage, Ouverture, Ingestion Docs, et — nouveau ce thread —
**Associé, point d'entrée conversationnel unique qui orchestre les 4
premiers**. Aucun point ouvert nécessitant une décision à cette clôture.

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
        chore(doctrine): régénération recap-session.md, clôture (ce geste)
```

---

## Prochaine étape suggérée

Le système a désormais un point d'entrée conversationnel unique orchestrant
4 agents lecture seule vérifiés + un canal de curation confirmé. Le prochain
geste naturel est l'usage réel — poser de vraies questions à `os:associe`
sur de la matière métier — plutôt que d'ouvrir un nouveau chantier système.
