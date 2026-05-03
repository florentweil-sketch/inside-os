# INSIDE OS

INSIDE OS est un système de mémoire structurée pour transformer des threads bruts en décisions et learnings exploitables dans Notion.

## Principe

Pipeline actuel :

THREAD_DUMP → EXTRACT → INJECT

Objectif :
- conserver la trace des décisions
- capitaliser les learnings
- structurer la mémoire stratégique
- rendre les décisions auditables et réutilisables

## Contexte du projet

La mémoire technique du projet est versionnée dans :

docs/context/

Le fichier :

INSIDE_OS_CONTEXT_vXX.md

sert de :

mémoire technique du projet

contexte de redémarrage des threads

prompt de transfert entre threads

Règle INSIDE OS :

CONTEXT = PROMPT DE TRANSFERT

## Logs

Les exécutions du système sont enregistrées dans :

runtime/logs/

Structure :

runtime/logs/pipeline/
runtime/logs/schema/

Convention :

runtime/logs/pipeline/YYYY-MM-DD_pipeline_testN.txt
runtime/logs/schema/YYYY-MM-DD_schema_checkN.txt

Les logs permettent :

audit du pipeline

reproduction des runs

debug du système

Les logs sont utilisés pour :

- tracer les runs du pipeline
- auditer les transformations
- reproduire un run en cas de bug
- analyser l’évolution du système

## Observabilité

Chaque étape du pipeline produit des informations de diagnostic :

extract :
nombre de décisions et lessons extraites

inject :
résumé d’injection incluant :
- nombre d’items détectés
- nombre d’items conservés
- nombre d’items rejetés
- nombre d’objets créés ou mis à jour

Ces informations sont enregistrées dans la base THREAD_DUMP
afin de faciliter l’audit du pipeline.

## Chemin local du repository

Le projet est développé localement dans :

/Users/admin/inside-os

Lors d’un partage zip, seul le contenu du dossier inside-os est archivé.

## Architecture du repo

### `os/`
Noyau vivant du système.

Contient le pipeline actif :
- `os/ingest/ingest-thread-dump.mjs`
- `os/extract/extract-thread-dump.mjs`
- `os/inject/inject-decisions-lessons.mjs`

Contient aussi les briques techniques :
- `os/lib/`
- `os/audit/`
- `os/repair/`

### `scripts/`
Outils utilitaires (audit, inspection, maintenance)
non utilisés par le pipeline principal.

### `archive/`
Ancien code, scripts legacy, anciennes tentatives.
Ne pas utiliser comme chemin principal d’exécution.

### `data/`
Données brutes, dumps, threads historiques.

### `docs/`
Contexte projet, prompts, documentation technique.

### `runtime/`
Sorties et artefacts générés à l’exécution.

## Commandes actuelles

Les commandes actives sont définies dans `package.json`.

Pipeline actuel :

- `npm run os:ingest`
- `npm run os:extract`
- `npm run os:inject`

Le script `os:pipeline` existe mais reste expérimental.
Exécution standard :

npm run os:ingest
npm run os:extract
npm run os:inject

## État actuel

Ce qui fonctionne :

- extraction LLM stabilisée
- normalisation du payload d'extraction
- injection idempotente (UID + upsert)
- archivage en mode overwrite
- traçabilité par source_thread et source_dump_id
- validation du schéma Notion via validate-schema

Ce qui reste à améliorer :

- propagation correcte des arguments dans `os:pipeline`
- industrialisation de l’ingest
- observabilité du pipeline

## Règles structurelles

- Notion = mémoire / état
- Node scripts = orchestration
- `os/` = seul noyau vivant
- les scripts legacy restent dans `archive/`
- ne pas réintroduire de chemins concurrents au pipeline actif

## Décisions structurantes déjà prises

- une normalisation du payload d'extraction protège le pipeline
- les décisions et lessons sont filtrées avant injection
- seuls les champs du contrat V1 sont conservés
- l’objet fondamental du système est la décision
- les threads sont la matière brute
- les décisions sont l’objet central durable
- les threads longs devront être traités par :
  - chunking intelligent
  - résumé intermédiaire par segment
  - fusion finale
- une validation de schéma est assurée via :
  - `os/scripts/validate-schema.mjs`

## Prochaine priorité

- améliorer l’observabilité du pipeline
- ajouter un script d’audit V1
- suivre la qualité de l’extraction

## Contrat Notion

Le pipeline INSIDE OS interagit avec Notion exclusivement via des Data Source IDs.

C’est une règle structurelle du projet.

Variables d’environnement utilisées :

THREAD_DUMP_DB_ID
DECISIONS_DB_ID
LESSONS_DB_ID

Malgré leur nom historique _DB_ID, ces variables contiennent en réalité des Data Source IDs Notion, et non des Database IDs.

Les scripts utilisent des Data Source IDs via les helpers internes du projet :

queryDatabaseCompat(...)
createPage(...)
updatePage(...)

et jamais :

notion.databases.retrieve(...)
parent: { database_id: ... }

La validité du schéma Notion peut être vérifiée avec :

npm run os:validate-schema

Le nom `_DB_ID` est conservé pour compatibilité historique dans le code,
mais ces variables contiennent en réalité des **Data Source IDs**.

## Pipeline

Le pipeline de transformation des conversations vers la base de connaissance INSIDE OS est composé de trois étapes :

ingest
ingestion des threads dans la base THREAD_DUMP

extract
extraction LLM des décisions et des leçons

inject
injection des décisions et leçons dans leurs bases respectives

Commandes disponibles :

npm run os:ingest
npm run os:extract
npm run os:inject

Pipeline complet :

npm run os:pipeline

## Validation du schéma

Le script :

npm run os:validate-schema

permet de vérifier :

l’accessibilité des Data Sources Notion

la présence des propriétés minimales utilisées par le pipeline

Bases vérifiées :

THREAD_DUMP

DECISIONS

LESSONS

Ce script agit comme contrat structurel entre le code et Notion.

Amélioration future identifiée

Le mécanisme d’injection repose sur :

makeUid(...)
+
upsert(...)

Dans certains cas, si la formulation d’une décision évolue légèrement entre deux extractions, un nouvel UID peut être généré, produisant des doublons sémantiques.

Ce comportement n’est pas critique dans la version actuelle, mais pourra être amélioré plus tard par :

canonicalisation des décisions extraites

clustering sémantique

détection de similarité

## Réparation du pipeline

INSIDE OS inclut plusieurs scripts de maintenance permettant
de diagnostiquer et corriger les problèmes éventuels.

Scripts disponibles :

- npm run os:audit  
  Vérifie l’état global du pipeline

- npm run os:list-inject-error-details  
  Liste les threads ayant échoué lors de l’injection

- npm run os:repair-extraction  
  Répare les payloads JSON d’extraction corrompus

Ces scripts permettent de restaurer la cohérence du système
sans modifier manuellement les données dans Notion.

## Philosophie du projet

INSIDE OS n’est pas seulement un pipeline technique.  
C’est un système destiné à transformer des conversations en **mémoire stratégique exploitable**.

Principes directeurs :

- **Les threads sont la matière brute.**
- **Les décisions sont l’unité de connaissance centrale.**
- **Les leçons ("lessons learned") permettent d’éviter les erreurs répétées.**

Le système vise à :

- conserver une trace des décisions réelles
- rendre ces décisions auditables
- capitaliser les apprentissages
- transformer les discussions en connaissance durable

Le projet suit quelques règles simples :

- Notion sert de **mémoire et d’état du système**
- les scripts Node servent d’**orchestration**
- le dossier `os/` contient le **noyau vivant du moteur**
- les scripts legacy restent dans `archive/`

INSIDE OS doit rester :

- simple
- traçable
- reproductible
- évolutif

INSIDE OS a vocation à devenir un moteur cognitif.

threads
→ extraction
→ décisions
→ graphe de décisions
→ activation stratégique

Fondations actuelles :

- uid
- source_thread
- source_dump_id

Fondations à construire :

- décisions comme unité centrale
- logs
- pipeline stable
- validator de schéma

## Sécurité / secrets

Le projet utilise des variables d’environnement stockées dans `.env`.

Ce fichier **ne doit jamais être versionné dans le repository**.

Variables utilisées :

NOTION_API_KEY  
OPENAI_API_KEY  
THREAD_DUMP_DB_ID  
DECISIONS_DB_ID  
LESSONS_DB_ID  
ROOT_PAGE_ID  

Ces variables permettent :

- l’accès à l’API Notion
- l’accès à l’API OpenAI
- la configuration des Data Sources utilisées par le pipeline

Le fichier `.env` doit rester local.

Un exemple minimal de configuration :

NOTION_API_KEY=...
OPENAI_API_KEY=...

THREAD_DUMP_DB_ID=...
DECISIONS_DB_ID=...
LESSONS_DB_ID=...

ROOT_PAGE_ID=...

En cas de partage du projet, les secrets doivent être **régénérés ou remplacés**.

## Contribution et évolution du projet

INSIDE OS est conçu comme un moteur évolutif.  
Afin d’éviter une dérive structurelle du projet, certaines règles doivent être respectées lors de l’ajout ou de la modification de code.

### 1. Le dossier `os/` est le noyau vivant

Le dossier `os/` contient le moteur actif du système :

- pipeline (`ingest`, `extract`, `inject`)
- bibliothèques techniques (`lib`)
- outils internes (`audit`, `repair`, `validate`)

Tout nouveau code participant au fonctionnement du pipeline doit être intégré dans ce dossier.

### 2. Ne pas créer de pipelines concurrents

Le pipeline officiel est :

INGEST → EXTRACT → INJECT

Les nouvelles fonctionnalités doivent **s’intégrer à ce pipeline** plutôt que créer des chemins parallèles.

### 3. Les scripts expérimentaux doivent rester isolés

Les scripts de test ou d’expérimentation doivent être placés dans :

scripts/

ou dans :

archive/

Ils ne doivent pas devenir des chemins d’exécution implicites du système.

### 4. Les modifications du schéma Notion doivent être explicites

Toute modification du schéma Notion doit :

- être documentée dans le README
- rester compatible avec `os/scripts/validate-schema.mjs`
- préserver la stabilité du pipeline existant

### 5. Maintenir la traçabilité

Le système repose sur la traçabilité des décisions.

Les éléments suivants doivent toujours être conservés :

- `uid`
- `source_thread`
- `source_dump_id`

Ces champs garantissent l’auditabilité du système.

### 6. Priorité à la stabilité

INSIDE OS privilégie :

- la stabilité
- la reproductibilité
- la traçabilité

Les évolutions doivent rester compatibles avec ces principes.

## Roadmap

INSIDE OS évolue par étapes.

### V1 — Pipeline de mémoire (objectif actuel)

Stabiliser le pipeline :

ingest → THREAD_DUMP
extract → décisions / lessons
inject → bases DECISIONS / LESSONS

Objectifs :

- pipeline stable
- schéma Notion stable
- accumulation de décisions
- mémoire stratégique structurée

Contrat d'extraction

Le script extract-thread-dump.mjs produit un JSON structuré qui est ensuite consommé par inject-decisions-lessons.mjs.

Le contrat V1 est volontairement simple.

Format attendu :

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

Une étape de normalisation est appliquée avant l'écriture dans Notion afin de :

- supprimer les items invalides
- nettoyer les champs texte
- garantir un payload stable

Cela protège le pipeline contre les variations de sortie du modèle.

### Qualité d'extraction

Résumé d'injection :

Chaque injection produit un résumé enregistré dans THREAD_DUMP.

Ce résumé inclut :

- nombre d’items présents dans le JSON brut
- nombre d’items conservés après normalisation
- nombre d’items rejetés
- nombre d’objets créés
- nombre d’objets mis à jour

Cela permet d’évaluer rapidement la qualité de l’extraction sans ouvrir les pages Notion.

### V2 — Mémoire interrogeable

Une fois la V1 stabilisée, INSIDE OS ajoutera une couche de récupération :

Notion → API → retrieval → IA

Objectif :

permettre à l’IA d’interroger directement la base de connaissance
sans devoir redonner tout le contexte à chaque nouveau thread.

### V3 — Moteur stratégique

À terme, INSIDE OS pourrait évoluer vers :

threads  
→ décisions  
→ graphe de décisions  
→ activation stratégique
