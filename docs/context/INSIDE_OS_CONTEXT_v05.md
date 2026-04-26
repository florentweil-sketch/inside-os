# INSIDE OS — CONTEXTE REDEMARRAGE ET TECHNIQUE

Version : v05
Date : 2026-04-17
Statut: pipeline V1 stabilisé (durcissement en cours)

---

## Rôle de ce document

Ce fichier sert de contexte de redémarrage officiel pour le projet INSIDE OS.

Il permet de :
- redémarrer un nouveau thread sans perte d’information
- rappeler les décisions structurantes
- éviter les dérives d’architecture
- maintenir la cohérence du pipeline

Règle INSIDE OS :

CONTEXT = PROMPT DE TRANSFERT

Ce document est la source de vérité pour le redémarrage d’un thread de travail.

---

## Objectif du projet

INSIDE OS transforme des conversations en mémoire stratégique structurée.

Pipeline conceptuel :

threads  
→ extraction LLM  
→ décisions  
→ base de connaissance  
→ activation stratégique  

Principes fondamentaux :

- les threads sont la matière brute  
- les décisions sont l’unité centrale de connaissance  
- les lessons capturent les apprentissages  

---

## Architecture générale

Architecture actuelle :

- Node scripts → orchestration du pipeline  
- LLM → extraction sémantique  
- Notion → mémoire persistante  

Pipeline principal :

thread source  
→ ingest  
→ extract  
→ inject  
→ Notion  

---

## Règle de séparation des responsabilités

Chaque étape du pipeline possède une responsabilité stricte.

ingest  
→ collecte et stockage brut des conversations  

extract  
→ interprétation sémantique via LLM  
→ production d’un JSON structuré  

inject  
→ normalisation finale  
→ génération des UID  
→ écriture dans Notion  

---

### Règle fondamentale

extract ne doit jamais :

- écrire dans DECISIONS / LESSONS  
- générer des UID  
- appliquer la logique métier  
- modifier la structure métier  

Toute logique métier doit rester dans **inject**.

---

## Étapes du pipeline

### ingest

Import des conversations dans la base Notion :

THREAD_DUMP  

Champs principaux :

- id_dump  
- raw_text  
- extraction_status  

---

### extract

Analyse du thread via LLM.

Produit un JSON structuré :

- decisions  
- lessons  

Stockage :

extraction_json  

---

### inject

Injection des objets extraits dans :

- DECISIONS  
- LESSONS  

Logique principale :

- makeUid(...)  
- upsert(...)  

Objectif :

garantir une injection idempotente  

---

## Contrat extract → inject

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