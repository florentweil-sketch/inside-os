# INSIDE OS — CONTEXTE REDEMARRAGE ET TECHNIQUE 

Version : v02
Date : 2026-03-14
Statut : Pipeline stabilisé

# Rôle de ce document

Ce document constitue le contexte officiel de redémarrage d’INSIDE OS.

Il sert à :

- redémarrer un nouveau thread sans perte de contexte
- transmettre l’état réel du système
- éviter la dérive du projet

Principe fondamental :

CONTEXT = PROMPT DE TRANSFERT

Le fichier :

docs/context/INSIDE_OS_CONTEXT_vXX.md

sert simultanément de :

- mémoire technique du projet
- contexte de redémarrage
- prompt de transfert entre threads

Quand un thread devient trop long :

- le contexte est mis à jour
- une nouvelle version est créée
- le nouveau thread démarre avec ce fichier

# Objectif du projet

INSIDE OS est un système destiné à transformer des conversations et des threads en connaissance stratégique structurée.

Principe fondamental :

Threads = matière brute
Décisions = objets durables
Lessons = capital d’expérience

Le système extrait les décisions et lessons depuis les conversations et les injecte dans Notion, qui devient la mémoire structurée du système.

Objectif long terme :

Construire une mémoire stratégique exploitable capable de :

- conserver les décisions
- capitaliser les apprentissages
- relier les décisions entre elles
- activer la connaissance selon le contexte.

# Architecture générale

Architecture actuelle :

Node scripts → orchestration
LLM → extraction sémantique
Notion → mémoire persistante

Pipeline principal :

ingest → extract → inject

Étapes :

ingest

Import des conversations dans la base Notion :

THREAD_DUMP

Contenu :

- raw_text
- id_dump
- extraction_status

extract

Analyse du thread via LLM pour produire :

decisions
lessons

Le résultat est stocké dans :

extraction_json
inject

Injection des objets extraits dans :

DECISIONS
LESSONS

Logique principale :

makeUid(...)
+
upsert(...)

# Contrat Notion

INSIDE OS utilise exclusivement des Data Source IDs.

Toutes les interactions avec Notion utilisent :

data_source_id

et jamais :

database_id

Variables d’environnement :

THREAD_DUMP_DB_ID
DECISIONS_DB_ID
LESSONS_DB_ID

Malgré leur nom historique _DB_ID, ces variables contiennent des Data Source IDs.

# Validation du schéma

Le projet inclut un validateur de schéma :

npm run os:validate-schema

Ce script vérifie :

- accessibilité des Data Sources
- présence des propriétés nécessaires

Propriétés minimales requises :

THREAD_DUMP
id_dump
raw_text
extraction_status
extraction_json

DECISIONS
uid
decision
decision_status
source_thread

LESSONS
uid
lesson
source_thread

# Stabilisation récente du pipeline

Date : 2026-03-14

Corrections réalisées :

- alignement complet sur dataSourceId
- suppression des usages databaseId
- correction de inject-decisions-lessons.mjs
- mise en place de validate-schema
- normalisation de la variable NOTION_API_KEY
- correction du .env

Le pipeline est désormais structurellement stable.

# Protocole de logs

INSIDE OS utilise un système de logs pour tracer les exécutions.

Structure :

runtime/logs/
pipeline/
schema/

Format :

runtime/logs/pipeline/YYYY-MM-DD_pipeline_testN.txt
runtime/logs/schema/YYYY-MM-DD_schema_checkN.txt

Objectifs :

- traçabilité
- reproduction des runs
- debug propre

# Risque identifié (non prioritaire)

Le système repose actuellement sur :

makeUid + upsert

Si la formulation d’une décision change légèrement entre deux extractions, un nouvel UID peut être généré et produire un doublon sémantique.

Solution future possible :

- canonicalisation
- clustering sémantique
- détection de similarité

Ce problème n’est pas prioritaire tant que le pipeline reste stable.

# Risque architectural futur

Un risque a été identifié :

Notion pourrait devenir un goulot d’étranglement du système lorsque :

- le volume de décisions augmente
- les relations se multiplient
- les analyses deviennent plus fréquentes

Ce point devra être surveillé si INSIDE OS devient une base de connaissance importante.

# Direction d’évolution

INSIDE OS pourrait évoluer vers un moteur plus large :

threads
→ extraction
→ décisions
→ graphe de décisions
→ activation stratégique

Cela permettrait :

- relier les décisions
- détecter les incohérences
- prioriser les décisions
- activer la connaissance pertinente.

Cette évolution n’est pas prioritaire tant que le pipeline reste stable.

# Prochaines priorités

Les prochaines étapes possibles sont :

1. audit des bases Notion
2. stabilisation des vues et relations
3. amélioration de la déduplication sémantique
4. extension du pipeline vers d’autres sources

# Utilisation de ce contexte

Ce document doit être utilisé :

- pour redémarrer un nouveau thread
- pour rappeler l’architecture du système
- pour éviter la perte de contexte.

Lorsque le thread devient trop long :

1. créer une nouvelle version du contexte
2. ouvrir un nouveau thread
3. repartir à partir de ce fichier.

# Stratégie de développement

INSIDE OS évolue en deux phases.

## Phase 1 — Stabilisation du pipeline (priorité actuelle)

Objectif :

stabiliser le pipeline de transformation :

threads → extract → inject → Notion

Cette phase permet de construire une mémoire stratégique fiable dans Notion.

## Phase 2 — Mémoire interrogeable

Une fois la V1 stabilisée, une couche de récupération sera ajoutée :

Notion → API → retrieval → IA

Cette évolution permettra à l’IA de retrouver automatiquement :

- décisions
- stratégies
- historique
- contexte

sans devoir redonner ces informations dans chaque nouveau thread.