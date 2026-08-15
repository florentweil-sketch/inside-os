# INSIDE OS

## Quick start

Clone the repository:

```bash
git clone https://github.com/<user>/inside-os
cd inside-os
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.example .env
```

Run the pipeline:

```bash
npm run os:ingest
npm run os:extract
npm run os:inject
```

Interroger la mémoire :

```bash
npm run os:chat -- "ta question"
```

---

INSIDE OS est un système de mémoire structurée et de pilotage basé sur des conversations.

Il transforme des threads en :

- décisions exploitables
- apprentissages structurés
- mémoire stratégique durable

---

## Principe

Pipeline :

```
THREAD_DUMP → EXTRACT → INJECT
```

Objectifs :

- conserver les décisions
- capitaliser les learnings
- structurer la mémoire
- rendre les décisions réutilisables

Évolution :

→ on ne stocke plus  
→ on pilote

---

## Architecture du système

```
threads
→ extraction LLM
→ décisions / lessons
→ bases Notion
```

Principes :

- le thread = matière brute
- la décision = unité centrale
- la lesson = apprentissage

---

## Mémoire vivante (B99)

Deux couches mémoire :

### Historique (B01 / B02 / …)

- mémoire longue
- contexte profond

### Présent (B99)

- état actuel
- décisions en cours
- pilotage

Règle :

→ lire tout  
→ privilégier B99

Contraintes B99 :

- court
- clair
- actionnable

B99 = outil de pilotage

---

## Chat / Mémoire active

Script : `notion-memory-chat.mjs`

Fonctionnement :

1. récupération décisions + lessons
2. scoring
3. boost B99
4. génération

Format de réponse :

- ÉTAT
- PROBLÈME
- ACTION

Règles :

- utiliser la mémoire en priorité
- ne pas inventer
- signaler les manques
- distinguer mémoire / inférence / manque

---

## Boucle de pilotage

```
1. travail réel
2. thread B99
3. pipeline
4. mémoire
5. chat
6. décision
7. action
8. nouveau B99

→ boucle continue
```

---

## Structure du repository

```
os/
  ingest/
  extract/
  inject/
  lib/
  audit/
  repair/

data/     → threads
docs/     → documentation
runtime/  → logs
scripts/  → outils
archive/  → legacy
```

---

## Commandes principales

Pipeline :

```bash
npm run os:ingest
npm run os:extract
npm run os:inject
```

Chat :

```bash
npm run os:chat -- "question"
```

Maintenance :

```bash
npm run os:audit
npm run os:validate-schema
npm run os:list-inject-error-details
npm run os:repair-extraction
```

---

## Contrat d'extraction

`extract-thread-dump.mjs` produit un JSON consommé par `inject-decisions-lessons.mjs`.

```json
{
  "decisions": [
    {
      "decision": "string",
      "rationale": "string optionnel",
      "evidence": "string optionnel"
    }
  ],
  "lessons": [
    {
      "lesson": "string",
      "what_happened": "string optionnel",
      "evidence": "string optionnel"
    }
  ]
}
```

---

## Normalisation des données

Nettoyage systématique :

- suppression des entrées invalides
- trim des champs
- suppression des champs vides
- respect strict du schéma

Objectif :

→ garantir une base propre et exploitable

---

## Observabilité

### Extraction

- nombre de décisions extraites
- nombre de lessons extraites

### Injection

- items détectés
- items conservés
- items rejetés
- objets créés
- objets mis à jour

Stockage :

→ base THREAD_DUMP

Objectif :

→ comprendre ce que fait le système  
→ auditer  
→ détecter anomalies

---

## Logs

Dossier :

```
runtime/logs/
  pipeline/
  schema/
  chat/
```

Convention :

```
YYYY-MM-DD_pipeline_testN.txt
YYYY-MM-DD_schema_checkN.txt
YYYY-MM-DD_chat_testN.txt
```

Objectif :

- traçabilité
- debug
- audit

---

## Contrat Notion

Notion = source de vérité

Bases :

- THREAD_DUMP
- DECISIONS
- LESSONS

Règles :

- usage Data Source ID (et non database_id)
- logique métier côté Node uniquement
- pas de logique dans Notion

Les scripts utilisent uniquement :

```js
queryDatabaseCompat(...)
createPage(...)
updatePage(...)
```

Et jamais :

```js
notion.databases.retrieve(...)
parent: { database_id: ... }
```

Traçabilité obligatoire sur chaque entrée :

- `uid`
- `source_thread`
- `source_dump_id`

---

## Sécurité

Fichier `.env` non versionné.

Variables :

```
NOTION_API_KEY
OPENAI_API_KEY

THREAD_DUMP_DB_ID
DECISIONS_DB_ID
LESSONS_DB_ID
ROOT_PAGE_ID
```

> Les variables `*_DB_ID` contiennent des Data Source IDs malgré leur nom historique.

---

## Bug connu

Le pipeline dépend d'une cohérence stricte entre `extraction_status` et `injection_status`.

Toute incohérence peut bloquer silencieusement la chaîne sans erreur visible.

Documenté dans : `docs/PIPELINE_BUG.md`

Mitigation en place :

- `injection_status = pending` injecté dès l'ingest
- mode `--only` disponible sur chaque étape pour tests ciblés

---

## État actuel

Fonctionnel :

- pipeline stable
- extraction fiable
- injection idempotente
- mémoire Notion exploitable
- chat opérationnel
- B99 actif

En cours :

- amélioration de la qualité des réponses chat
- enrichissement discipliné de B99
- pilotage réel via la boucle

---

## Roadmap

### V1 — Pipeline de mémoire (EN COURS)

- pipeline stable
- schéma Notion stabilisé
- accumulation de décisions
- mémoire exploitable
- B99 actif
- chat opérationnel
- boucle de pilotage

### V2 — Mémoire interrogeable

```
Notion → API → retrieval → IA
```

Objectif : interroger directement la base de décisions.

### V3 — Moteur stratégique

```
threads
→ décisions
→ graphe de décisions
→ activation stratégique
```

---

## Règle de travail

- pas de mémoire passive
- threads utiles uniquement
- décisions actionnables
- B99 central

---

## Vision

INSIDE OS devient :

- mémoire fiable
- mémoire interrogeable
- moteur stratégique

Objectif final :

→ copilote décisionnel opérationnel
