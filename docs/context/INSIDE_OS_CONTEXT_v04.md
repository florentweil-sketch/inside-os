# INSIDE OS — CONTEXTE REDEMARRAGE ET TECHNIQUE 

Version : v04
Date : 2026-03-14
Statut: pipeline V1 stabilisé

Rôle de ce document
Ce fichier sert de contexte de redémarrage officiel pour le projet INSIDE OS.
Il permet de :
	•	redémarrer un nouveau thread sans perte d’information
	•	rappeler les décisions structurantes
	•	éviter les dérives d’architecture
	•	maintenir la cohérence du pipeline
Règle INSIDE OS :
CONTEXT = PROMPT DE TRANSFERT
Ce document est la source de vérité pour le redémarrage d’un thread de travail.

Objectif du projet
INSIDE OS transforme des conversations en mémoire stratégique structurée.
Pipeline conceptuel :
threads
→ extraction LLM
→ décisions
→ base de connaissance
→ activation stratégique
Principes fondamentaux :
	•	les threads sont la matière brute
	•	les décisions sont l’unité centrale de connaissance
	•	les lessons capturent les apprentissages

## Architecture générale
Architecture actuelle :
	•	Node scripts → orchestration du pipeline
	•	LLM → extraction sémantique
	•	Notion → mémoire persistante
Pipeline principal :
thread source→ ingest→ extract→ inject→ Notion

## Règle de séparation des responsabilités

Chaque étape du pipeline possède une responsabilité stricte.

ingest  
→ collecte et stockage brut des conversations

extract  
→ interprétation sémantique via LLM  
→ production d’un JSON brut structuré

inject  
→ normalisation finale  
→ génération des UID  
→ écriture dans Notion

Règle fondamentale :

extract ne doit jamais :

- écrire dans Notion
- générer des UID
- appliquer la logique d’archivage
- modifier la structure métier

Toute logique métier doit rester dans **inject**.

Cette séparation garantit :

- la stabilité du pipeline
- la reproductibilité des extractions
- la possibilité de rejouer l’injection sans relancer l’extraction.

## Étapes du pipeline
ingest
Import des conversations dans la base Notion :
THREAD_DUMP
Champs principaux :
	•	id_dump
	•	raw_text
	•	extraction_status

extract
Analyse du thread via LLM.
Produit un JSON structuré :
	•	decisions
	•	lessons
Stockage :
extraction_json

inject
Injection des objets extraits dans :
	•	DECISIONS
	•	LESSONS
Logique principale :
	•	makeUid(...)
	•	upsert(...)
Objectif :
garantir une injection idempotente.

## Contrat extract → inject
Le script extract-thread-dump.mjs produit un JSON consommé par inject-decisions-lessons.mjs.
Format V1 :

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


## Normalisation du payload d'extraction
Avant l’injection, une normalisation est appliquée :
fonction :
normalizeExtractionPayload(...)
Objectifs :
	•	supprimer les items invalides
	•	nettoyer les champs texte
	•	stabiliser la structure JSON
Cette étape protège le pipeline contre les variations du modèle LLM.

Contrat Notion
INSIDE OS interagit avec Notion exclusivement via Data Source IDs.
Variables d’environnement :
THREAD_DUMP_DB_ID
DECISIONS_DB_ID
LESSONS_DB_ID
Malgré leur nom _DB_ID, ces variables contiennent des Data Source IDs Notion.
Les scripts utilisent uniquement :

queryDatabaseCompat(...)
createPage(...)
updatePage(...)

et jamais :

notion.databases.retrieve(...)
parent: { database_id: ... }


Validation du schéma
Le script :

npm run os:validate-schema

permet de vérifier :
	•	l’accès aux Data Sources Notion
	•	la présence des propriétés minimales
Bases vérifiées :
THREAD_DUMP
DECISIONS
LESSONS
Ce script agit comme contrat structurel entre le code et Notion.

Résumé d’injection
Chaque injection produit un résumé stocké dans THREAD_DUMP.
Format typique :

raw(dec=X,les=Y) | kept(dec=A,les=B) | rej(dec=C,les=D) | created=E | updated=F | overwrite=yes|no | LIVE

Objectif :
permettre l’audit rapide de la qualité d’extraction.

Stabilisation récente du pipeline
Corrections majeures réalisées :
	•	alignement complet sur les Data Source IDs
	•	suppression des usages database_id
	•	normalisation de NOTION_API_KEY
	•	mise en place de validate-schema
	•	normalisation du contrat extract → inject
	•	ajout de normalizeExtractionPayload(...)
	•	correction de inject-decisions-lessons.mjs
	•	reprise explicite des statuts error via --force
	•	gestion des extraction_json longs via stockage dans les blocks Notion
	•	ajout d’un audit système (os:audit)

État opérationnel actuel
À la date de ce contexte :
	•	pipeline V1 techniquement stabilisé
	•	extraction sans erreur
	•	injection sans erreur
	•	audit système opérationnel
	•	README projet stabilisé
	•	gestion des extraction_json longs fonctionnelle
Règle importante :

pending = candidat automatique
error   = échec technique d’injection (reprise explicite)
done    = traité (ignoré sauf overwrite)

Important :

error ≠ forcément thread non chunké

Un chunking conforme ne doit pas produire error.

Scripts de maintenance
Scripts principaux :

npm run os:audit
npm run os:list-inject-error-details
npm run os:repair-extraction

Ces scripts permettent :
	•	diagnostic du pipeline
	•	correction des payloads JSON corrompus
	•	restauration de la cohérence du système

Stratégie de développement
Principes de stabilité :
	•	Notion = mémoire / état
	•	Node scripts = orchestration
	•	os/ = noyau vivant
	•	éviter les pipelines concurrents
Les évolutions doivent préserver :
	•	la stabilité
	•	la reproductibilité
	•	la traçabilité

Prochaines priorités
Les prochaines étapes probables sont :
	1	fiabiliser définitivement os:pipeline
	2	améliorer l’observabilité du pipeline
	3	surveiller la qualité d’extraction
	4	limiter la dérive sémantique des décisions
	5	préparer la future couche de retrieval

Direction d’évolution
INSIDE OS pourrait évoluer vers :
threads→ extraction→ décisions→ graphe de décisions→ activation stratégique

Conclusion
INSIDE OS est actuellement :
	•	un pipeline de mémoire stratégique fonctionnel
	•	basé sur Notion comme mémoire persistante
	•	orchestré par Node scripts
	•	alimenté par extraction LLM
L’objectif est de transformer les conversations en connaissance durable et exploitable
