# INSIDE OS

## Quick start

Clone the repository:

git clone https://github.com/<user>/inside-os
cd inside-os

Install dependencies:

npm install

Configure environment variables:

cp .env.example .env

Run the pipeline:

npm run os:ingest
npm run os:extract
npm run os:inject

INSIDE OS est un système de mémoire structurée qui transforme des threads de travail en **décisions** et **leçons exploitables** stockées dans Notion.

Le système vise à transformer des discussions en **mémoire stratégique durable**.

---

# Principe

Pipeline actuel :

THREAD_DUMP → EXTRACT → INJECT

Objectifs :

- conserver la trace des décisions
- capitaliser les learnings
- structurer la mémoire stratégique
- rendre les décisions auditables et réutilisables

---

# Architecture du système

Les conversations brutes sont transformées en connaissance structurée.

threads  
→ extraction LLM  
→ décisions / lessons  
→ bases de connaissance

Principes :

- **Les threads sont la matière brute**
- **La décision est l’unité de connaissance centrale**
- **Les lessons capturent les apprentissages**

---

## Structure du repository

```
os/
```

Noyau vivant du système.

Contient le pipeline actif :

- `os/ingest/ingest-thread-dump.mjs`
- `os/extract/extract-thread-dump.mjs`
- `os/inject/inject-decisions-lessons.mjs`

Contient aussi les briques techniques :

- `os/lib/`
- `os/audit/`
- `os/repair/`

Autres dossiers :

scripts/   outils utilitaires  
archive/   code legacy  
data/      dumps et données brutes  
docs/      documentation projet  
runtime/   logs et artefacts


---

# Commandes principales

Pipeline :

npm run os:ingest
npm run os:extract
npm run os:inject

---

# Contrat d'extraction

Le script `extract-thread-dump.mjs` produit un JSON structuré consommé par `inject-decisions-lessons.mjs`.

Format V1 :

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

Une étape de normalisation est appliquée avant l'injection afin de :
	•	supprimer les items invalides
	•	nettoyer les champs texte
	•	stabiliser le payload

## Observabilité
Chaque étape du pipeline produit des informations de diagnostic.
Extraction :
	•	nombre de décisions extraites
	•	nombre de lessons extraites
Injection :
	•	items détectés
	•	items conservés
	•	items rejetés
	•	objets créés
	•	objets mis à jour
Ces informations sont enregistrées dans THREAD_DUMP.

## Logs

Les exécutions sont enregistrées dans :

runtime/logs/

Structure :

runtime/logs/pipeline/
runtime/logs/schema/

Convention :

runtime/logs/pipeline/YYYY-MM-DD_pipeline_testN.txt
runtime/logs/schema/YYYY-MM-DD_schema_checkN.txt

Les logs permettent :
	•	audit du pipeline
	•	reproduction des runs
	•	debug du système

## Contrat Notion

INSIDE OS utilise Data Source IDs Notion.
Variables d’environnement :

THREAD_DUMP_DB_ID
DECISIONS_DB_ID
LESSONS_DB_ID

Malgré leur nom historique _DB_ID, ces variables contiennent des Data Source IDs.
Les scripts utilisent uniquement :

queryDatabaseCompat(...)
createPage(...)
updatePage(...)

et jamais :

notion.databases.retrieve(...)
parent: { database_id: ... }

Validation du schéma :

npm run os:validate-schema


## Réparation et maintenance

Scripts disponibles :

npm run os:audit
npm run os:list-inject-error-details
npm run os:repair-extraction

Ces scripts permettent :
	•	diagnostiquer les problèmes du pipeline
	•	corriger les payloads corrompus
	•	restaurer la cohérence du système

## Règles structurelles

Principes du projet :
	•	Notion = mémoire et état
	•	Node scripts = orchestration
	•	os/ = noyau vivant
	•	les scripts legacy restent dans archive/
Éléments indispensables pour la traçabilité :
	•	uid
	•	source_thread
	•	source_dump_id

## Sécurité

Les secrets sont stockés dans .env (non versionné).
Variables utilisées :

NOTION_API_KEY
OPENAI_API_KEY

THREAD_DUMP_DB_ID
DECISIONS_DB_ID
LESSONS_DB_ID
ROOT_PAGE_ID


## État actuel

Fonctionnel :
	•	extraction LLM stabilisée
	•	normalisation du payload
	•	injection idempotente (UID + upsert)
	•	archivage overwrite
	•	validation du schéma Notion
Améliorations prévues :
	•	observabilité du pipeline
	•	industrialisation de l’ingest
	•	propagation correcte des arguments dans os:pipeline

## Roadmap

V1 — Pipeline de mémoire
Objectifs :
	•	pipeline stable
	•	schéma Notion stabilisé
	•	accumulation de décisions
	•	mémoire stratégique exploitable

V2 — Mémoire interrogeable
Ajout d’une couche de récupération :
Notion → API → retrieval → IA
Objectif :
interroger directement la base de décisions.

V3 — Moteur stratégique
threads  
→ décisions  
→ graphe de décisions  
→ activation stratégique
