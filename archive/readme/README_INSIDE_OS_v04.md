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
→ nettoyage + ingest
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

## Organisation des dossiers data

```
data/
  test_threads/   → dossier de test uniquement (beta v01, v02…)
                          4 fichiers max — jamais les vrais threads de production
  data_cemetery/        → archive permanente de tous les threads traités
                          les threads y entrent après injection, n'en ressortent jamais
```

### Threads de test disponibles

| Fichier | Usage |
|---------|-------|
| `B03-T03-FA-Capital-V1.2.txt` | Test chunk long (133 549 chars, 7 chunks) |
| `B06-T07-Contentieux-client-Prost.txt` | Test chunk court |
| `B09-T23-Notion-Dev-011.txt` | Alignement système |
| `B99-T99-TEST-DENSE-NOCHUNK.txt` | Test no-chunk (6 103 chars, dense, varié) |

---

## Protocole B09

Les threads de développement INSIDE OS (bucket B09) sont exclus du pipeline automatique.

Règle :

→ thread B09 terminé → Prompt Maître V3 → CONTEXT vXX → injecté en B99  
→ thread B09 brut → data_cemetery (jamais dans test_threads)

Override possible :

```bash
npm run os:ingest -- --skip-buckets ""
```

---

## Nettoyage des threads

Avant tout ingest, les threads sont nettoyés systématiquement :

- suppression des emojis et caractères Unicode hors BMP
- remplacement des guillemets typographiques par des guillemets droits
- remplacement des tirets longs par des tirets simples
- remplacement des flèches Unicode par des équivalents ASCII
- remplacement des bullets Unicode par des tirets
- suppression des espaces insécables

Script de nettoyage ponctuel (batch) :

```bash
node os/scripts/clean-threads.mjs           # dry-run vers test_threads_clean/
node os/scripts/clean-threads.mjs --in-place # écrase les originaux
```

Objectif :

→ garantir que les caractères spéciaux ne cassent pas l'extraction JSON

---

## Chat / Mémoire active

Deux scripts disponibles :

| Script | Usage |
|--------|-------|
| `notion-memory-server.mjs` | **Canonique production** — serveur HTTP, `POST /chat` |
| `notion-memory-chat.mjs` | CLI — test et debug uniquement |

### Serveur HTTP (production)

```bash
node os/chat/notion-memory-server.mjs
```

Endpoint : `POST /chat`

3 modes :

- `pilotage` → ÉTAT / PROBLÈME / ACTION
- `synthese` → prose libre
- `liste` → faits bruts

### Chat CLI (test)

```bash
npm run os:chat -- "ta question"
```

### Fonctionnement

1. récupération décisions + lessons
2. scoring par tokens
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
  chat/
  lib/
  audit/
  repair/
  scripts/

data/
  test_threads/   → test uniquement
  data_cemetery/        → archive permanente
docs/                   → documentation
runtime/                → logs
archive/                → legacy
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

Organisation :

```bash
node os/scripts/clean-threads.mjs --in-place   # nettoyage batch des threads
node os/scripts/prepare-beta.mjs               # dry-run organisation dossiers
node os/scripts/prepare-beta.mjs --execute     # organisation dossiers
npm run os:reset-db                            # reset complet des 3 bases (archive)
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

### Règles d'extraction

- Extraction directe pour les threads <= 12 000 chars
- Extraction chunk par chunk (20 000 chars/chunk) pour les threads > 12 000 chars
- Retry progressif sur JSON non parseable : tokens croissants jusqu'à résolution
- Parser JSON 3 stratégies en cascade : extraction directe → nettoyage strings → fermeture forcée
- Règle absolue : ne jamais lire `raw_text` pour l'extraction — toujours lire les blocs Notion

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
- `raw_text` = résumé LLM une ligne généré à l'ingest — ne jamais lire pour l'extraction

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
ANTHROPIC_API_KEY

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
- nettoyage systématique à l'ingest
- extraction fiable avec retry progressif
- injection idempotente
- mémoire Notion exploitable
- chat opérationnel (serveur HTTP + CLI)
- B99 actif

En cours :

- ingestion complète des threads historiques
- enrichissement discipliné de B99
- déploiement cloud
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
