# INSIDE OS — v10

## Ce qu'est INSIDE OS

INSIDE OS est le système d'exploitation stratégique de F&A CAPITAL et de ses entités (INSIDE SAS, INSIDE ARCHI, Atelier de la Colombe).

Il transforme les conversations, décisions et apprentissages du groupe en mémoire décisionnelle durable, puis active cette mémoire via un réseau d'agents IA spécialisés qui jouent le rôle de collaborateurs permanents — capables de conseiller, challenger et **exécuter** les tâches courantes comme le ferait un salarié compétent dans son domaine.

Trois niveaux indissociables :

- **Mémoire** — capturer ce qui a été dit, décidé, appris
- **Pilotage** — interroger la mémoire pour contextualiser les décisions présentes
- **Action** — exécuter les tâches courantes, produire des livrables, déclencher des actions externes

L'objectif final : Florent dispose d'un copilote décisionnel permanent et d'une équipe d'agents qui grandissent avec le groupe, connaissent son histoire, et peuvent challenger ses décisions comme des collaborateurs de confiance.

---

## Rôles des documents système

**Ces trois documents sont complémentaires et jamais redondants. Si une information est dans l'un, elle n'est pas répétée dans les autres.**

| Document | Rôle | S'adresse à | Contient | Ne contient pas |
|----------|------|------------|----------|-----------------|
| **README vXX** | Référence technique permanente | Quelqu'un qui découvre ou revient sur le projet | Architecture, pipeline, commandes, structure repo, contrats techniques | État actuel, règles de travail inter-thread, décisions en cours |
| **PROMPT vXX** | Règles de travail inter-thread | Claude au démarrage d'un nouveau thread | Protocoles de travail, règles de comportement, pièges à éviter, séquences canoniques | Architecture détaillée, état technique du système |
| **CONTEXT vXX** | Instantané vivant du système | Claude au démarrage du thread suivant | Acquis réels, problèmes actifs, risques, fichiers produits, priorité de redémarrage | Règles permanentes (README), règles de travail (PROMPT) |

**Règle de lecture au démarrage d'un thread :**
- README = comprendre le système
- PROMPT = comprendre comment travailler
- CONTEXT = comprendre où on en est

---

## Quick start

```bash
git clone https://github.com/florentweil-sketch/inside-os
cd inside-os
npm install
cp .env.example .env
```

Variables requises dans `.env` :

```
NOTION_API_KEY
ANTHROPIC_API_KEY
THREAD_DUMP_DS_ID
DECISIONS_DS_ID=3b054e65-6195-4bfe-8411-53bafe98b64b
LESSONS_DS_ID
ROOT_PAGE_ID
```

> DS_ID = Data Source ID (identifiant API Notion) — ne pas confondre avec database_id.
>
> **Note** : `DECISIONS_DS_ID` a été recréé suite à un incident (suppression accidentelle, thread B09-T26).
> Nouveau DS_ID : `3b054e65-6195-4bfe-8411-53bafe98b64b` — valeur à jour dans `.env`.
> Si `.env` est perdu, utiliser cette valeur pour reconfigurer.

---

## Parcours d'un thread

```
1. CONVERSATION
   Thread de travail (claude.ai, réunion, décision)

2. EXPORT
   Export manuel → fichier BXX-TXX-Sujet.txt
   Dépôt dans data/threads_to_process/

3. CLEAN
   npm run os:ingest (étape clean)
   → suppression emojis, puces, code, bruit visuel
   → thread nettoyé → data/thread_clean/
   → thread brut supprimé de threads_to_process/

4. ARCHIVE
   → copie du thread clean → data/data_cemetery/ (archive permanente)
   → thread clean = référence définitive non chunké

5. PASSE 1 LLM — résumé + extraction (chunking adaptatif)
   npm run os:ingest (étape LLM)
   → calcul taille thread → découpe en chunks de CHUNK_SIZE chars (défaut 20 000)
   → 1 thread court = 1 chunk = 1 appel LLM
   → 1 thread long = N chunks = N appels séquentiels → merge
   → produit en une passe par chunk : { summary_partial, decisions, lessons }
   → merge des chunks → résultat unifié
   → extraction_status=done + injection_status=pending écrits automatiquement
   → résumé sauvegardé → data/thread_summarized/{id}.json (archive permanente)

6. PASSE 2 LLM — vérification (systématique)
   → LLM compare thread_clean vs résultat merge
   → détecte les manques et oublis
   → complète si nécessaire, valide si exhaustif
   → résumé final vérifié → thread_summarized/ mis à jour

7. INJECT NOTION
   npm run os:inject
   → lit data/thread_summarized/{id}.json en priorité (pas de limite taille)
   → fallback V1 : propriété extraction_json Notion + blocs de page
   → création/update pages DECISIONS + LESSONS dans Notion
   → champs V2 injectés : bucket, impact, decision_status, lesson_type, agents
   → source_thread renseigné (relation bidirectionnelle)
   → retry_count : max 2 retries auto, blocage BLOCKED au-delà
   → statut : injection_status=done
```

**Configuration passe 1 et 2 (modifiable dans .env) :**
```
INGEST_PROMPT_PASS1=ingest-pass1-v02   # prompt chunking adaptatif
INGEST_PROMPT_PASS2=ingest-pass2-v01
VERIFY_PASS=always      # always | conditional | never
VERIFY_THRESHOLD=12000  # utilisé si VERIFY_PASS=conditional
CHUNK_SIZE=20000        # taille d'un chunk en chars
CHUNK_OVERLAP=500       # overlap entre chunks
```

---

## Pipeline

```bash
npm run os:ingest   # clean + LLM passe 1 + passe 2 vérification
npm run os:inject   # inject DECISIONS + LESSONS dans Notion
```

Interroger la mémoire :

```bash
npm run os:chat -- "ta question"
```

---

## Protocole de clôture de thread B09

En fin de chaque thread de développement INSIDE OS, lancer :

```bash
node os-thread-close.mjs --thread-name "B09-TXX-Sujet"
```

Ce script automatise en une commande :

1. Backup versionné du repo (10 derniers conservés)
2. Retry automatique des inject_error (max 2, alerte si bloqué)
3. Snapshot Notion live (statuts pipeline, comptages)
4. Audit d'alignement (env, dossiers, divergences)
5. Détection fichiers modifiés (git diff)
6. Lecture du contenu du thread si disponible
7. Draft CONTEXT vXX généré par Claude (toutes sections)
8. Détection README/PROMPT bump avec draft de section
9. Injection B99 sur `--inject`

Après validation du draft :

```bash
node os-thread-close.mjs --inject --thread-name "B09-TXX-Sujet"
```

---

## Organisation des dossiers data

```
data/
  threads_to_process/   → thread brut exporté depuis claude.ai
                          non versionné Git
                          supprimé après clean (étape 3)

  thread_clean/         → thread nettoyé (sans emojis, puces, code, bruit)
                          non versionné Git
                          supprimé après copie en data_cemetery (étape 4)

  data_cemetery/        → thread clean complet, archive permanente
                          non versionné Git
                          n'en ressort jamais sauf cas de force majeure documenté

  thread_summarized/    → résumé LLM dense vérifié par thread
                          décisions, conclusions, validations, enseignements
                          non versionné Git
                          conservé définitivement après inject

  thread_chunked/       → chunks temporaires du résumé (si résumé > 12 000 chars)
                          non versionné Git
                          purgé automatiquement après inject

  test_threads/         → fichiers de test pipeline uniquement
                          4 fichiers max — jamais de vrais threads de production
                          versionné Git
```

**Règle absolue data_cemetery :** les threads y entrent après archivage du clean. Ils n'en ressortent jamais. Toute extraction depuis data_cemetery pour retraitement est un cas de force majeure qui doit être documenté explicitement.

### Threads de test

| Fichier | Usage |
|---------|-------|
| `B03-T03-FA-Capital-V1.2.txt` | Test chunk long (133 549 chars, 7 chunks) |
| `B06-T07-Contentieux-client-Prost.txt` | Test chunk court |
| `B09-T23-Notion-Dev-011.txt` | Alignement système |
| `B99-T99-TEST-DENSE-NOCHUNK.txt` | Test no-chunk (6 103 chars, dense, varié) |

---

## Protocole B09

Les threads de développement INSIDE OS (bucket B09) sont exclus du pipeline automatique.

```
thread B09 terminé
→ node os-thread-close.mjs --thread-name "B09-TXX-Sujet"
→ valider draft CONTEXT vXX
→ node os-thread-close.mjs --inject
→ thread brut → data_cemetery/ (jamais dans test_threads/)
```

Override pipeline si nécessaire :

```bash
npm run os:ingest -- --skip-buckets ""
```

---

## Versionning des documents système

| Document | Rôle | Évolue quand |
|----------|------|--------------|
| `README vXX` | Référence architecture | Décision majeure ou changement structurel |
| `PROMPT vXX` | Alignement inter-thread | Gap inter-thread révèle un angle mort ou dérive |
| `CONTEXT vXX` | Instantané d'état | À chaque thread B09 — systématiquement |

Les trois numéros sont indépendants. README v09 + PROMPT v10 + CONTEXT v15 = configuration valide.

---

## Mémoire vivante (B99)

Deux couches :

**Historique (B01–B09)** — mémoire longue, contexte profond par bucket
**Présent (B99)** — état actuel, décisions en cours, pilotage actif

Règle : lire tout, privilégier B99.

B99 = court, clair, actionnable. Ne pas diluer.

---

## Buckets

| Bucket | Domaine |
|--------|---------|
| B01 | Florent — personnel & développement |
| B02 | Inside SAS — bâtiment & opérations |
| B03 | F&A Capital — holding & stratégie |
| B04 | Elior — projet corporate |
| B05 | Marketing & communication |
| B06 | Juridique & fiscal |
| B07 | Chantiers terrain |
| B08 | Infrastructure & tech perso |
| B09 | INSIDE OS — système & dev |
| B99 | Présent vivant — pilotage actif |

---

## Agents IA — Architecture cible

INSIDE OS évoluera vers un réseau d'agents spécialisés. Chaque agent accède à toute la mémoire du groupe et exécute les tâches comme le ferait un salarié compétent dans son domaine.

### Périmètre d'action des agents

| Catégorie | Exemples concrets |
|-----------|-----------------|
| **Documents & admin** | Devis, contrats, comptes rendus, rapports, notes internes |
| **Tri & audit** | Classement documents, audit financier, tri fournitures, contrôle factures |
| **Communication** | Rédaction et envoi emails, relances clients/fournisseurs, notifications |
| **Création digitale** | Développement logiciels et applications internes, sites web, outils métier |
| **Communication externe** | Rédaction et publication contenus texte et visuels, réseaux sociaux, site web, campagnes |
| **Mémoire & conseil** | Interroger, croiser, synthétiser, challenger, arbitrer |
| **Rôle externe** | L'Associé dans des relations externes |

### Niveaux de confirmation

| Type d'action | Niveau |
|---------------|--------|
| Lecture / analyse / production document | Autonome |
| Envoi email / publication contenu | Confirmation sauf règle préétablie |
| Écriture Notion / modification système | Confirmation explicite |
| Développement et mise en production | Validation Florent avant déploiement |
| Engagements financiers | Jamais autonome |

### Contrat JSON extraction (V2)

Chaque thread produit un JSON structuré avec les champs suivants :

```json
{
  "summary": {
    "short": "2-3 phrases pour chat et agents",
    "full": "prose dense 200-400 mots"
  },
  "decisions": [{
    "decision": "énoncé actionnable",
    "rationale": "pourquoi (optionnel)",
    "evidence": "citation thread (optionnel)",
    "bucket": ["B03", "B06"],
    "impact": "critical | major | minor",
    "status": "validated | proposed",
    "agents": ["Agent Financier"],
    "agent_suggestions": [{
      "name": "Nom agent suggéré",
      "rationale": "pourquoi il manque",
      "type": "new | sub-agent",
      "parent": "Agent parent (null si new)"
    }]
  }],
  "lessons": [{
    "lesson": "règle réutilisable",
    "what_happened": "contexte (optionnel)",
    "evidence": "citation (optionnel)",
    "bucket": ["B09"],
    "type": "technical | strategic | operational | process | relational",
    "agents": ["Agent Infrastructure & Tech"],
    "agent_suggestions": []
  }]
}
```

**Règles :**
- `bucket` : maximum 3 par entrée
- `agents` : liste exhaustive dans `os/prompts/` — jamais inventer
- `agent_suggestions` : le LLM propose, Florent valide/adapte/rejette
- `status=superseded` : ajouté manuellement ou par agent de maintenance — jamais à l'extraction

### Prompts LLM

```
os/prompts/
  ingest-pass1-v01.md   → passe 1 v01 (legacy — remplacé par v02)
  ingest-pass1-v02.md   → passe 1 v02 : chunking adaptatif (ACTIF)
  ingest-pass2-v01.md   → passe 2 : vérification delta — manques uniquement (ACTIF)
```

Configuration active dans `.env` :
```
INGEST_PROMPT_PASS1=ingest-pass1-v02
INGEST_PROMPT_PASS2=ingest-pass2-v01
VERIFY_PASS=always
VERIFY_THRESHOLD=12000
CHUNK_SIZE=20000
CHUNK_OVERLAP=500
```

### Mémoire relationnelle — ENTITIES (V3)

Chaque entité externe (client, fournisseur, collaborateur) a un profil dans la base ENTITIES qui s'enrichit au fil des threads :
- **Extraction automatique** — décisions et lessons mentionnant l'entité liées à son profil
- **Saisie manuelle Florent** — tags, notes, qualifications ("gentil", "problématique", "incertain")

Les agents interrogent ENTITIES avant de répondre sur une entité — contexte relationnel complet disponible sans relire les threads.

### Agents groupe F&A CAPITAL (V3)

| Agent | Domaine | Bucket |
|-------|---------|--------|
| Agent Juridique Opérationnel | Contentieux, contrats chantiers, litiges clients | B06 |
| Agent Juridique Corporate | Structure groupe, SCI, holding, pactes | B06 |
| Agent Financier | Trésorerie, cash flow, investissements, arbitrages capital | B03 |
| Agent Fiscal | Optimisation, TVA, IS, structuration, déclarations | B06 |
| Agent Bâtiment & MOE | Maîtrise d'œuvre, techniques, normes, process rénovation | B02 |
| Agent Chantiers Terrain | Suivi opérationnel, sous-traitants, planning, réception | B07 |
| Agent Menuiserie | Atelier de la Colombe, fabrication, devis, production | B02 |
| Agent RH & Social | Organisation, équipes, contrats, paie, conflits | B01 |
| Agent Marketing & Com | Positionnement, image, contenus, réseaux, prospection | B05 |
| Agent Stratégie Groupe | Vision, arbitrages majeurs, allocations, développement | B03 |
| Agent Elior | Projet corporate spécifique, relation grand compte | B04 |
| Agent Fournisseurs | Prestataires, négociations, évaluation, référencement | B02/B07 |
| Agent Clients | Historique relationnel, suivi projets, satisfaction | B02 |
| Agent Infrastructure & Tech | Outils internes, automatisation, systèmes, INSIDE OS | B08/B09 |

### Agents personnels Florent (V3)

B01 reste un seul bucket. Les agents personnels filtrent par tags plutôt que sous-buckets — un thread peut appartenir à plusieurs domaines simultanément.

| Agent | Domaine | Tags B01 |
|-------|---------|----------|
| Agent Développement Personnel | Construction, objectifs, apprentissages, évolution | développement_personnel |
| Agent Santé | Suivi médical, habitudes, énergie, bien-être physique | santé |
| Agent Vie Privée | Famille, relations, projets personnels | vie_privée |
| Agent Patrimoine | Immobilier perso, placements, retraite, transmission | patrimoine_perso |

### Super-agents transversaux (V3)

| Agent | Rôle |
|-------|------|
| **L'Associé** | Copilote décisionnel permanent — accès mémoire complète, peut être en désaccord, challenger une décision, jouer un rôle dans les relations externes ("mon associé n'est pas d'accord"). Prompt système fixe définissant son caractère et ses positions. |
| Agent Synthèse | Croise plusieurs domaines pour une vue consolidée sur demande |

### Deep probing inter-agents (V3)

Les agents peuvent s'interroger entre eux. Exemple : l'agent juridique interroge l'agent financier pour évaluer l'impact économique d'un contentieux. L'agent stratégie peut consulter simultanément juridique, financier et fiscal avant de produire un arbitrage.

---

## Principes fondamentaux

- Notion = mémoire et état — jamais de logique dans Notion
- Node + scripts = orchestration — toute la logique métier côté Node
- Le LLM distingue toujours : mémoire / inférence / manque — ne jamais inventer
- `raw_text` = résumé LLM une ligne — ne jamais lire pour l'extraction, toujours lire les blocs
- B99 = présent vivant — court, clair, actionnable — ne pas diluer
- DS_ID = Data Source ID (identifiant API Notion) — aucune autre interprétation
- Le pipeline ne doit jamais écrire directement depuis le chat
- `notion-memory-chat.mjs` tourne sur Claude haiku-4-5 — dépendance OpenAI supprimée
- `retry_count` max 2 retries auto sur inject_error — blocage BLOCKED au-delà, intervention manuelle

---

## Contrat Notion

Notion = source de vérité.

Bases : THREAD_DUMP / DECISIONS / LESSONS

Les scripts utilisent uniquement :

```js
queryDataSource(...)
createPage(...)
updatePage(...)
```

Traçabilité obligatoire sur chaque entrée : `uid` / `source_thread` / `source_dump_id`

---

## Contrat d'extraction

```json
{
  "decisions": [
    { "decision": "string", "rationale": "string optionnel", "evidence": "string optionnel" }
  ],
  "lessons": [
    { "lesson": "string", "what_happened": "string optionnel", "evidence": "string optionnel" }
  ]
}
```

Règles :
- Extraction directe pour threads <= 12 000 chars
- Extraction chunk par chunk (20 000 chars/chunk) pour threads > 12 000 chars
- Retry progressif `[4000, 6000, 8000, 10000]` tokens
- Parser JSON 3 stratégies en cascade
- Ne jamais lire `raw_text` — toujours lire les blocs Notion

---

## Commandes principales

```bash
# Pipeline
npm run os:ingest       # clean + LLM passe 1 (résumé+extract) + passe 2 (vérification)
npm run os:inject       # inject DECISIONS + LESSONS dans Notion

# Chat
npm run os:chat -- "question"

# Clôture de thread
node os-thread-close.mjs --thread-name "B09-TXX-Sujet"
node os-thread-close.mjs --inject --thread-name "B09-TXX-Sujet"

# Maintenance
npm run os:audit
npm run os:validate-schema
npm run os:repair-extraction
npm run os:list-inject-error-details

# Nettoyage batch
node os/scripts/clean-threads.mjs --in-place
```

---

## Structure du repository

```
os/
  ingest/         → ingest-thread-dump.mjs
  extract/        → extract-thread-dump.mjs
  inject/         → inject-decisions-lessons.mjs
  chat/           → notion-memory-server.mjs (prod) / notion-memory-chat.mjs (test, Claude haiku-4-5)
  lib/            → notion.mjs, config.mjs
  audit/
  repair/
  scripts/

data/
  threads_to_process/   → threads à ingérer (non versionné)
  test_threads/         → test uniquement
  data_cemetery/        → archive permanente (non versionné)

docs/
  context/        → INSIDE_OS_CONTEXT_vXX.md
  readme/         → README_INSIDE_OS_vXX.md
  prompts transfert thread/  → PROMPT_MAITRE_vXX.md

runtime/
  logs/
    pipeline/
    chat/
    thread-close/

archive/          → legacy
```

---

## Chat / Mémoire active

| Script | Usage |
|--------|-------|
| `notion-memory-server.mjs` | **Canonique production** — serveur HTTP, `POST /chat` |
| `notion-memory-chat.mjs` | CLI — test et debug uniquement (Claude claude-haiku-4-5) |

3 modes serveur HTTP :
- `pilotage` → ÉTAT / PROBLÈME / ACTION
- `synthese` → prose libre
- `liste` → faits bruts

Règles de réponse : utiliser la mémoire en priorité / ne pas inventer / signaler les manques / distinguer mémoire / inférence / manque.

---

## Boucle de pilotage

```
travail réel
→ export thread
→ pipeline (ingest + extract + inject)
→ mémoire Notion enrichie
→ chat / agents
→ décision éclairée
→ action
→ nouveau thread
→ boucle continue
```

---

## Roadmap

### V1 — Pipeline de mémoire (EN COURS)

- pipeline stable ingest → extract → inject ✅
- mémoire Notion exploitable ✅
- B99 actif ✅
- chat opérationnel ✅
- boucle de pilotage ✅
- protocole de clôture de thread automatisé ✅
- batch 10 threads réels validé ✅

### V2 — Pipeline distillation intelligente (IMPLÉMENTÉ ✅)

- clean automatique des threads bruts ✅
- double passe LLM : résumé dense + vérification exhaustivité ✅
- archive thread_clean permanente dans data_cemetery ✅
- résumés LLM conservés dans thread_summarized/ (archive locale permanente) ✅
- chunking adaptatif : tout thread découpé en chunks de CHUNK_SIZE chars ✅
  → 1 thread court = 1 chunk, 1 thread long = N chunks → merge
  → validé sur B03-T03 : 133 717 chars → 7 chunks → 50d/50l
- schéma Notion enrichi : bucket, impact, decision_status, lesson_type, agents ✅
- inject lit thread_summarized/ en priorité (pas de limite 2000 chars Notion) ✅
- statuts extraction_status/injection_status automatiques ✅
- paramètre VERIFY_PASS configurable (always / conditional / never) ✅

### V3 — Réseau d'agents spécialisés

- agents pôle (juridique, financier, bâtiment, RH, marketing, stratégie, fiscal)
- deep probing inter-agents
- L'Associé — super-agent copilote décisionnel
- déploiement cloud permanent (Railway, Render ou équivalent)
- accès multi-devices

### V4 — Système autonome

- agents proactifs (alertes, détection d'incohérences, suggestions non sollicitées)
- intégration Claude Code pour évolution sans déconstruction
- mémoire partagée multi-entités du groupe

### Roadmap infrastructure — Migration base de données

#### Court terme — Notion → Supabase
- Remplacer Notion par Supabase (PostgreSQL managé + API REST auto-générée)
- Supabase est open source, déployable en self-hosted, supporte les vraies requêtes SQL
- Seul `os/lib/notion.mjs` est à remplacer par `os/lib/supabase.mjs` — pipeline Node intact
- Élimine les timeouts API, les rate-limits, la dépendance propriétaire
- Décision gravée dans decisions_structural — source B09-T29

#### Moyen terme — PostgreSQL + pgvector
- Ajouter pgvector à la base PostgreSQL pour stocker les embeddings des décisions et lessons
- Les agents V3 interrogent la mémoire par recherche sémantique directement dans la base
- Zéro dépendance externe (pas de Pinecone, pas de Weaviate) — tout dans un seul système
- Prérequis : pipeline V2 stable + ingestion complète des 82 threads
- Décision gravée dans decisions_structural — source B09-T29

#### Long terme — Infrastructure propriétaire (V4)
- PostgreSQL + pgvector + API Node maison sur Railway ou VPS
- Zéro dépendance externe sur la couche données
- Scalable : audio, transcriptions longues, multi-entités du groupe, agents proactifs
- L'architecture actuelle (Node + scripts découplés) migre naturellement vers ce setup
- Décision gravée dans decisions_structural — source B09-T29

---

## Sécurité

- `.env` non versionné
- `data/data_cemetery/` non versionné
- `data/threads_to_process/` non versionné
- Remote Git GitHub opérationnel : `https://github.com/florentweil-sketch/inside-os.git`
- Backup tar.gz automatique via `os-thread-close.mjs`
