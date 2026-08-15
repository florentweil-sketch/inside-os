# INSIDE OS — CONTEXTE REDEMARRAGE ET TECHNIQUE 
Version : v01  
Date : 2026-03-13  
Statut : Stable (première base structurée)

---

# 1. Origine de ce contexte

Ce document constitue la première version officielle et stable du **contexte redemarrage et technique d’INSIDE OS**.

Il intervient après de nombreux threads exploratoires ayant permis :

- de clarifier l’architecture
- de nettoyer le repository
- de stabiliser le pipeline
- de définir les règles de fonctionnement du projet

Ce document devient la **première référence durable pour redémarrer les threads futurs** sans perdre la continuité stratégique et technique.
Ce document doit être **mis à jour à chaque nouvelle version du contexte**.

# 1.1 Règle fondamentale de continuité

INSIDE OS adopte une règle stricte de continuité :

CONTEXT = PROMPT DE TRANSFERT

Le fichier :

docs/context/INSIDE_OS_CONTEXT_vXX.md

est à la fois :

- la mémoire technique du projet
- le contexte de redémarrage
- le prompt de transfert entre threads

Il n’existe pas de document séparé de transfert.

Quand un thread devient lourd :

1. le contexte est mis à jour
2. une nouvelle version est créée
3. le nouveau thread démarre à partir de ce contexte

Exemple :

docs/context/INSIDE_OS_CONTEXT_v02.md

# 1.2 Chemin du repository

Le repository local de travail se trouve sur la machine :


/Users/admin/inside-os


(macOS : Macintosh HD / Users / admin / inside-os)

Lorsqu'un zip du projet est partagé :

- on archive uniquement **le contenu du dossier inside-os**
- jamais le chemin système complet.

Structure attendue dans un zip :


archive/
data/
docs/
os/
runtime/
scripts/
README.md
package.json
package-lock.json

---

# 2. Objectif d’INSIDE OS

INSIDE OS est un système visant à transformer les échanges et les threads en **connaissance stratégique structurée**.

Principe fondamental :


Threads = matière brute
Décisions = objets durables
Lessons = capital d’expérience

Le pipeline extrait les décisions et les lessons depuis les threads puis les injecte dans **Notion**.

Le système convertit progressivement les discussions en **décisions et enseignements structurés dans Notion**.
INSIDE-OS doit devenir un système d’intelligence organisationnelle.

---

# 3. Architecture générale du système

Architecture actuelle :


Node scripts → orchestration
LLM → extraction sémantique
Notion → mémoire persistante

Rôles :

| composant | rôle |
|-----------|------|
Node | moteur du pipeline |
LLM | extraction décisions |
Notion | stockage structuré |


# 4. Structure actuelle du repository (v03 logique)

La structure du repo doit être **documentée dans chaque version du contexte** afin de suivre son évolution.


inside-os
│
├─ archive/
├─ data/
│
├─ docs/
│ ├─ context/
│ │ └─ INSIDE_OS_CONTEXT_v01.md
│ │
│ ├─ prompts/
│ └─ vision/
│
├─ os/
│ ├─ pipeline.mjs
│ │
│ ├─ ingest/
│ ├─ extract/
│ ├─ inject/
│ │
│ └─ scripts/
│ └─ validate-schema.mjs
│
├─ runtime/
│ └─ logs/
│ ├─ pipeline/
│ └─ schema/
│
├─ scripts/
│
├─ README.md
├─ package.json
└─ package-lock.json


Principe :


os/ → moteur du système
runtime/ → exécution
docs/ → documentation


---

# 5. Pipeline opérationnel

Pipeline Node actuel :


pipeline.mjs
↓
ingest
↓
extract
↓
inject


Statut des modules :

| module | statut |
|------|------|
pipeline.mjs | stable |
ingest | présent mais encore DRY |
extract | opérationnel |
inject | opérationnel |


---

# 6. Flags pipeline validés

Le pipeline supporte :


--only
--force


Exemples :


npm run os:pipeline -- --only B02-T22
npm run os:pipeline -- --only B02-T22 --force
npm run os:pipeline


Les flags ont été **testés et validés par logs**.

---

# 7. Protocole de logs

INSIDE OS adopte une discipline stricte de logs.

Structure :


runtime/logs/
pipeline/
schema/


Format des fichiers :


runtime/logs/pipeline/YYYY-MM-DD_pipeline_testN.txt
runtime/logs/schema/YYYY-MM-DD_schema_checkN.txt


Exemples :


runtime/logs/pipeline/2026-03-13_pipeline_test2.txt
runtime/logs/schema/2026-03-13_schema_check1.txt


Objectifs :

- traçabilité
- reproduction des runs
- debug propre
- éviter la pollution des threads

---

# 8. Validation de schéma (priorité actuelle)

Risque principal identifié :

**dérive du schéma Notion**.

Solution :

création de :


os/scripts/validate-schema.mjs


Fonction :

- vérifier les bases Notion
- vérifier les propriétés
- vérifier les types
- arrêter le pipeline en cas d’écart

Flux futur :


validate-schema
↓
pipeline
↓
ingest
↓
extract
↓
inject


---

# 9. Règles structurelles gravées

1. **Notion est la mémoire du système**
2. **Node est l’orchestrateur**
3. **les décisions sont l’objet central**
4. **les threads sont la matière brute**

---

# 10. Règles d’ingestion de threads longs

Les threads longs ne doivent jamais être envoyés brut au modèle.

Stratégie obligatoire :


chunking
→ résumé intermédiaire
→ fusion finale


Objectif : éviter la perte de signal.

---

# 11. Risque identifié (non prioritaire)

Un risque futur a été identifié :

# Risque systémique — stabilité sémantique des décisions extraites

Un risque structurel a été identifié dans le fonctionnement du pipeline.

Les décisions extraites par LLM peuvent présenter une dérive sémantique :

la même décision peut être formulée de différentes manières.

Exemple :

Notion devient la mémoire principale  
Notion est la source de vérité  
Notion est le stockage central  

Ces formulations peuvent être interprétées comme des décisions distinctes.

Sans correction, cela entraîne :

- duplication des décisions
- fragmentation de la base Notion
- perte de lisibilité stratégique

Une solution future consistera à introduire :

- canonicalisation
ou
- clustering sémantique via embeddings

Cette amélioration n'est pas prioritaire tant que :

- le pipeline
- le schéma
- l'ingestion

ne sont pas complètement stabilisés.

Ce point **n’est pas prioritaire tant que le pipeline et le schéma sont stabilisés**.

---

# 12. Protocole de transfert de thread

Quand un thread devient trop lourd :

1. produire un nouveau contexte :


docs/context/INSIDE_OS_CONTEXT_vXX.md


2. ouvrir un nouveau thread avec :


CONTEXTE DE REDÉMARRAGE — INSIDE OS
voir docs/context/INSIDE_OS_CONTEXT_vXX.md


3. continuer le développement.

---

# 13. Etat actuel du système

Etat actuel du système :


repo nettoyé
pipeline stable
flags validés
logs structurés
Notion connecté

# Risque architectural identifié — structure du dossier `os/`

Une observation importante a été faite lors de l’audit du repository.

Le dossier `os/` contient aujourd’hui :


pipeline.mjs
ingest/
extract/
inject/
lib/
audit/
repair/


Cela indique que le projet n’est plus uniquement un pipeline.

INSIDE OS commence à évoluer vers un **moteur modulaire plus large**.

Ce phénomène est courant dans les projets Node :  
si aucune séparation claire n’est introduite, le dossier principal devient progressivement un mélange de :

- pipeline
- utilitaires
- services
- modules d’analyse

Ce type de dérive finit par rendre le moteur difficile à maintenir.

---

# Direction architecturale possible

Si le projet continue de s’étendre, une organisation plus explicite pourrait être adoptée :


os/
pipeline/
ingest/
extract/
inject/

core/
lib/
config/

services/
audit/
repair/
validate-schema/


Objectif :

- isoler le pipeline
- isoler les briques techniques
- éviter la dérive structurelle du moteur

---

# Décision actuelle

Aucune migration n’est effectuée pour le moment.

Le repository est encore suffisamment simple pour rester lisible.

---

# Direction long terme — OS stratégique

INSIDE OS ne vise pas seulement à extraire des décisions depuis des threads.

L’objectif long terme est de construire un système capable d’activer la connaissance stratégique.

Architecture cible :

threads
→ extraction
→ décisions
→ graphe de décisions
→ activation stratégique

Cela permettrait au système de :

- relier les décisions entre elles
- détecter les incohérences
- prioriser les décisions
- activer les décisions pertinentes selon le contexte

Cette couche n’est pas prioritaire tant que le pipeline, l’ingestion et la validation du schéma ne sont pas stabilisés.

# Priorité du prochain thread

Le prochain thread devra analyser :

- la structure actuelle de `os/`
- l’évolution probable d’INSIDE OS
- l’opportunité d’une séparation `pipeline / core / services`

Cette analyse doit être faite **avant l’ajout de nouvelles briques techniques importantes**.

# Priorité technique identifiée

Un risque d’architecture Node a été identifié dans la structure actuelle du repository.

Ce point sera analysé et corrigé dans le prochain thread avant toute extension du système.

Objectif :

préserver une architecture Node propre et éviter une dérive structurelle du moteur INSIDE OS.

Notion peut devenir un goulot d’étranglement architectural pour INSIDE OS à mesure que :

- le volume de données augmente
- les requêtes se multiplient
- le pipeline devient plus fréquent ou automatisé.

Cela servira de point de vigilance futur lorsque :

- la base DECISIONS grossira,
- les relations THREAD / DECISIONS / LESSONS se multiplieront,
- ou si tu ajoutes des agents ou des analyses automatiques.

Le système est donc maintenant mémorisé comme suit :

- pipeline stabilisé
- contrat Notion verrouillé
- validator en place
- risque architectural futur identifié : Notion scaling

## Contrat officiel Notion

Toutes les bases Notion sont désormais manipulées via leur **Data Source ID** et non via leur Database ID.

Règles :
- `THREAD_DUMP_DB_ID`, `DECISIONS_DB_ID`, `LESSONS_DB_ID` contiennent en pratique des **Data Source IDs**
- le nom `*_DB_ID` est conservé pour éviter de casser le repo, mais il est historiquement trompeur
- toute lecture/validation de structure doit passer par `data_sources`
- toute création de page doit utiliser `parent: { data_source_id: ... }`

Conséquences techniques :
- `validate-schema.mjs` doit être basé sur `notion.dataSources.retrieve(...)`
- `inject` ne doit plus utiliser `getDatabase(...)` pour vérifier la structure
- `repair-extraction-json.mjs` reste un outil de maintenance hors pipeline, à réaligner plus tard

INSIDE OS dispose maintenant d’une **base technique solide pour évoluer proprement**.

---

# Fin du contexte v01
