# INSIDE OS

Système d'exploitation stratégique de F&A CAPITAL et de ses entités (INSIDE SAS, INSIDE ARCHI, Atelier de la Colombe).

Il transforme les conversations, décisions et apprentissages du groupe en mémoire décisionnelle durable, puis active cette mémoire via un réseau d'agents IA spécialisés qui jouent le rôle de collaborateurs permanents — capables de conseiller, challenger et **exécuter** les tâches courantes comme le ferait un salarié compétent dans son domaine.

Trois niveaux indissociables :

- **Mémoire** — capturer ce qui a été dit, décidé, appris
- **Pilotage** — interroger la mémoire pour contextualiser les décisions présentes
- **Action** — exécuter les tâches courantes, produire des livrables, déclencher des actions externes

L'objectif final : Florent dispose d'un copilote décisionnel permanent et d'une équipe d'agents qui grandissent avec le groupe, connaissent son histoire, et peuvent challenger ses décisions comme des collaborateurs de confiance.

---

## Rôles des documents système

Depuis l'abandon du protocole CONTEXT (dev INSIDE OS, B09-T42), le système documentaire tient sur deux documents complémentaires — jamais redondants :

| Document | Rôle | S'adresse à | Contient |
|----------|------|------------|----------|
| **README.md** (ce fichier) | Référence technique permanente | Quelqu'un qui découvre ou revient sur le projet | Architecture, pipeline, commandes, structure repo, contrats techniques |
| **PROMPT_MAITRE vXX** | Règles de travail inter-thread | Claude au démarrage d'un nouveau thread | Protocoles de travail, règles de comportement, posture, doctrine anti-hallucination |

L'état courant du système (décisions actives, chantiers en cours) n'est plus capturé dans un document local versionné — il vit dans **Notion, page B99** (présent vivant), alimentée par le même pipeline mémoire que tout le reste.

**Règle de lecture au démarrage d'un thread :**
- README = comprendre le système
- PROMPT_MAITRE = comprendre comment travailler
- Notion B99 + BACKLOG_DEV/BACKLOG_USER = comprendre où on en est

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
> **Note** : `DECISIONS_DS_ID` a été recréé suite à un incident (suppression accidentelle, thread B09-T26). Nouveau DS_ID : `3b054e65-6195-4bfe-8411-53bafe98b64b` — valeur à jour dans `.env`. Si `.env` est perdu, utiliser cette valeur pour reconfigurer.

---

## Parcours d'un thread

```
1. CONVERSATION
   Thread de travail (claude.ai, réunion, décision, document PDF)

2. EXPORT / EXTRACTION
   Export manuel → fichier BXX-TXX-Sujet.txt dans data/threads_to_process/
   OU document PDF → npm run os:ingest-doc (Agent Ingestion Docs, voir plus bas)

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

6. PASSE 2 LLM — vérification (systématique — VERIFY_PASS=always recommandé)
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
   → retry_count : max 2 retries auto — au-delà (retry_count >= 2), thread exclu de la boucle, intervention manuelle requise
   → statut : injection_status=done
```

**Configuration passe 1 et 2 (modifiable dans .env) :**
```
INGEST_PROMPT_PASS1=ingest-pass1-v02   # prompt chunking adaptatif
INGEST_PROMPT_PASS2=ingest-pass2-v01
VERIFY_PASS=always      # always | conditional | never — always recommandé
VERIFY_THRESHOLD=12000  # utilisé si VERIFY_PASS=conditional
CHUNK_SIZE=20000        # taille d'un chunk en chars
CHUNK_OVERLAP=500       # overlap entre chunks
```

---

## Pipeline — commandes

```bash
npm run os:ingest   # clean + LLM passe 1 + passe 2 vérification
npm run os:inject   # inject DECISIONS + LESSONS dans Notion
npm run os:pipeline # chaîne ingest + inject
npm run os:extract  # extraction seule (sans inject)
```

Interroger la mémoire :

```bash
npm run os:chat -- "ta question"
```

---

## Clôture de thread (protocole minimal, depuis B09-T42)

Le protocole dédié (`os-thread-close.mjs`, génération d'un `CONTEXT vXX` local, audit `PRE_THREAD`) est **abandonné** — archivé dans `archive/scripts/` et `archive/context/`. Un thread se clôture désormais exactement comme n'importe quel autre thread de travail :

```
1. Dump texte du thread → data/threads_to_process/
2. npm run os:ingest / os:extract / os:inject
3. IDEAS.md revu (npm run os:idea a capturé les idées brutes en cours de route)
```

**Résolu (B09-T42)** : `os:ingest` n'exclut plus aucun bucket par défaut (`DEFAULT_SKIP_BUCKETS=[]`) — un thread B09 passe par le pipeline standard comme tout autre bucket. Protection contre les collisions/écrasements silencieux : garde d'idempotence — `os:ingest` refuse fail-loud tout id_dump déjà présent dans THREAD_DUMP Notion.

---

## Organisation des dossiers data

```
data/
  threads_to_process/   → thread brut exporté (texte ou dump PDF), non versionné Git
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

  threads_to_inject/    → file d'attente pour batch d'ingestion depuis cemetery
                          non versionné Git

  test_threads/         → fichiers de test pipeline uniquement
                          4 fichiers max — jamais de vrais threads de production
                          versionné Git
```

**Règle absolue data_cemetery :** les threads y entrent après archivage du clean. Ils n'en ressortent jamais. Toute extraction depuis data_cemetery pour retraitement est un cas de force majeure qui doit être documenté explicitement.

**Règle threads_to_inject/ :** utiliser ce dossier pour tout batch de production depuis data_cemetery/. Ne jamais utiliser threads_to_process/ pour des batchs.

### Threads de test

| Fichier | Usage |
|---------|-------|
| `B03-T03-FA-Capital-V1.2.txt` | Test chunk long (133 549 chars, 7 chunks) |
| `B06-T07-Contentieux-client-Prost.txt` | Test chunk court |
| `B09-T23-Notion-Dev-011.txt` | Alignement système |
| `B99-T99-TEST-DENSE-NOCHUNK.txt` | Test no-chunk (6 103 chars, dense, varié) |

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

## Mémoire vivante (B99)

Deux couches :

**Historique (B01–B09)** — mémoire longue, contexte profond par bucket
**Présent (B99)** — état actuel, décisions en cours, pilotage actif

Règle : lire tout, privilégier B99. B99 = court, clair, actionnable. Ne pas diluer.

---

## Agents — couche Action (implémentés)

Réseau d'agents lecture-seule construits sur un socle technique commun (`os/agents/synthese/sources.mjs` : lecture paginée, scoring, statut/date). Aucun n'écrit dans Notion.

| Agent | Commande | Rôle |
|-------|----------|------|
| **Agent Synthèse** | `npm run os:synthese -- --sujet "..."` | Synthèse sourcée sur un sujet donné, croise DECISIONS/LESSONS/THREAD_DUMP |
| **Agent Pilotage** | `npm run os:pilotage -- --sujet "..."` | Copilote opérationnel — format ÉTAT/BLOCAGE/ACTION, priorité au présent (B99) |
| **Agent Ouverture** | `npm run os:ouverture` | Brief du matin — balaie la mémoire du présent sans sujet, liste de tâches par famille métier |
| **Agent Ingestion Docs** | `npm run os:ingest-doc -- <fichier.pdf> --bucket B0X` | Verse un document (PDF) dans la mémoire : extraction factuelle via API Claude, confirmation interactive, dépôt dans `data/threads_to_process/` |
| **os:statut** (curation) | `npm run os:statut -- <uid> <superseded\|archived\|rejected>` | Seul point d'écriture pour les statuts de curation humaine sur DECISIONS |

Chaque agent (sauf `os:statut`, un script de curation) a un prompt système versionné dans `docs/prompts/<famille>/` — voir périmètre docs-sync dans `CLAUDE.md`.

---

## Agents IA — Architecture cible (roadmap, non encore implémenté)

Au-delà de la couche Action ci-dessus, INSIDE OS évoluera vers un réseau d'agents métier spécialisés. Chaque agent accède à toute la mémoire du groupe et exécute les tâches comme le ferait un salarié compétent dans son domaine.

### Périmètre d'action visé

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

### Agents groupe F&A CAPITAL (cible)

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
| Agent Directeur des Achats | Politique achats groupe, négociations cadre, référencement prestataires | B03 |
| Agent Fournisseurs | Prestataires opérationnels chantiers, suivi livraisons, logistique | B02/B07 |
| Agent Clients | Historique relationnel, suivi projets, satisfaction | B02 |
| Agent Infrastructure & Tech | Outils internes, automatisation, systèmes, INSIDE OS | B08/B09 |

### Agents personnels Florent (cible)

B01 reste un seul bucket. Les agents personnels filtrent par tags plutôt que sous-buckets.

| Agent | Domaine | Tags B01 |
|-------|---------|----------|
| Agent Développement Personnel | Construction, objectifs, apprentissages, évolution | développement_personnel |
| Agent Santé | Suivi médical, habitudes, énergie, bien-être physique | santé |
| Agent Vie Privée | Famille, relations, projets personnels | vie_privée |
| Agent Patrimoine | Immobilier perso, placements, retraite, transmission | patrimoine_perso |

### Super-agents transversaux (cible)

| Agent | Rôle |
|-------|------|
| **L'Associé** | Copilote décisionnel permanent — accès mémoire complète, peut être en désaccord, challenger une décision, jouer un rôle dans les relations externes. Prompt système versionné (`docs/prompts/associe/`). |
| **Agent Intégration IA** | Conception, déploiement et orchestration des agents IA dans INSIDE OS. Gardien de la cohérence du réseau d'agents. Bucket B09. |
| **Agent Classifieur Documents** | Routing automatique IA des documents métier entrants vers DB Notion cible et/ou dossier repo. Bucket B09. |

Référence complète des agents, fiches de différenciation et règles de définition : voir `docs/prompts/associe/PROMPT_ASSOCIE_vXX.md`.

---

## Contrat JSON extraction (V2)

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
- `status=superseded` : ajouté manuellement (`npm run os:statut`) — jamais à l'extraction

### Prompts LLM du pipeline

```
os/prompts/
  ingest-pass1-v01.md   → passe 1 v01 (legacy — remplacé par v02)
  ingest-pass1-v02.md   → passe 1 v02 : chunking adaptatif (ACTIF)
  ingest-pass2-v01.md   → passe 2 : vérification delta — manques uniquement (ACTIF)
```

---

## Mémoire relationnelle — ENTITIES (V3)

Chaque entité externe (client, fournisseur, collaborateur) a un profil dans la base ENTITIES qui s'enrichit au fil des threads :
- **Extraction automatique** — décisions et lessons mentionnant l'entité liées à son profil
- **Saisie manuelle Florent** — tags, notes, qualifications ("gentil", "problématique", "incertain")

Les agents interrogent ENTITIES avant de répondre sur une entité — contexte relationnel complet disponible sans relire les threads. Les données financières seront alimentées par un agent dédié — pas encore implémenté.

Toujours vérifier l'existant avant de créer via MCP pour éviter les doublons.

---

## Principes fondamentaux

- Notion = mémoire et état — jamais de logique dans Notion
- Node + scripts = orchestration — toute la logique métier côté Node
- Le LLM distingue toujours : mémoire / inférence / manque — ne jamais inventer
- `raw_text` = résumé LLM une ligne — ne jamais lire pour l'extraction, toujours lire les blocs
- B99 = présent vivant — court, clair, actionnable — ne pas diluer
- DS_ID = Data Source ID (identifiant API Notion) — aucune autre interprétation
- Le pipeline ne doit jamais écrire directement depuis le chat
- `notion-memory-chat.mjs` tourne sur Claude haiku-4-5 (test) — `notion-memory-server.mjs` = production
- `retry_count` max 2 retries auto sur inject_error — au-delà (retry_count >= 2), intervention manuelle requise
- BACKLOG_DEV.md et BACKLOG_USER.md = sources de vérité backlog — Notion miroir lecture seule
- Tout agent lecture-seule (Synthèse/Pilotage/Ouverture/Ingestion Docs) réutilise le socle `os/agents/synthese/sources.mjs` — pas de duplication de logique de lecture/scoring

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

## Contrat d'extraction (V1, compatibilité)

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
npm run os:pipeline     # chaîne ingest + inject
npm run os:extract      # extraction seule

# Chat / Pilotage
npm run os:chat -- "question"

# Agents — couche Action
npm run os:synthese -- --sujet "..."
npm run os:pilotage -- --sujet "..."
npm run os:ouverture
npm run os:ingest-doc -- <fichier.pdf> --bucket B0X
npm run os:statut -- <uid> <superseded|archived|rejected>

# Maintenance
npm run os:audit
npm run os:validate-schema
npm run os:repair-extraction
npm run os:list-inject-error-details
npm run os:docs-sync    # vérifie les pointeurs CLAUDE.md vs dernières versions sur disque

# Pense-bête inter-thread
npm run os:idea -- "texte de l'idée"
```

---

## Structure du repository

```
os/
  ingest/         → ingest-thread-dump.mjs
  extract/        → extract-thread-dump.mjs
  inject/         → inject-decisions-lessons.mjs
  chat/           → notion-memory-server.mjs (prod) / notion-memory-chat.mjs (test, Claude haiku-4-5)
  agents/
    synthese/     → Agent Synthèse + socle technique partagé (sources.mjs)
    pilotage/     → Agent Pilotage
    ouverture/    → Agent Ouverture
    ingest-doc/   → Agent Ingestion Docs
  lib/            → notion.mjs, config.mjs, claude.mjs, guard.mjs, uid.mjs
  audit/
  repair/
  scripts/        → audit-system, idea, statut, validate-schema, docs-sync, etc.

data/
  threads_to_process/   → threads bruts exportés (non versionné)
  threads_to_inject/    → batch d'ingestion depuis cemetery (non versionné)
  test_threads/         → test uniquement (4 fichiers max)
  data_cemetery/        → archive permanente (non versionné)

docs/
  prompts-transfert-thread/   → PROMPT_MAITRE_vXX.md
  prompts/
    associe/                 → PROMPT_ASSOCIE_vXX.md
    synthese/                → PROMPT_AGENT_SYNTHESE_vXX.md, SPEC_AGENT_SYNTHESE_vXX.md
    pilotage/                → PROMPT_AGENT_PILOTAGE_vXX.md
    ouverture/                → PROMPT_AGENT_OUVERTURE_vXX.md
    ingest-doc/               → PROMPT_INGEST_DOC_vXX.md
    agent/                    → PROMPT_AGENT_INFRA_TECH_vXX.md

runtime/
  logs/
    pipeline/
    chat/
  synthese/ pilotage/ ouverture/   → sorties datées des agents (console + fichier)

archive/            → protocoles/versions abandonnés (context, readme, pre-threads,
                       scripts de clôture, notes ponctuelles résolues)
```

---

## Chat / Mémoire active

| Script | Usage |
|--------|-------|
| `notion-memory-server.mjs` | **Canonique production** — serveur HTTP, `POST /chat` |
| `notion-memory-chat.mjs` | CLI — test et debug uniquement (Claude haiku-4-5) |

3 modes serveur HTTP :
- `pilotage` → ÉTAT / PROBLÈME / ACTION
- `synthese` → prose libre
- `liste` → faits bruts

Règles de réponse : utiliser la mémoire en priorité / ne pas inventer / signaler les manques / distinguer mémoire / inférence / manque.

---

## Boucle de pilotage

```
travail réel
→ export thread (ou document PDF via os:ingest-doc)
→ pipeline (ingest + extract + inject)
→ mémoire Notion enrichie
→ chat / agents (Synthèse, Pilotage, Ouverture)
→ décision éclairée
→ action
→ nouveau thread
→ boucle continue
```

---

## Roadmap

### V1 — Pipeline de mémoire (STABLE)

- pipeline stable ingest → extract → inject ✅
- mémoire Notion exploitable ✅
- B99 actif ✅
- chat opérationnel ✅
- boucle de pilotage ✅
- batch de threads réels validé ✅
- protocole de clôture de thread dédié — **abandonné** (B09-T42), remplacé par le flux minimal dump → pipeline

### V2 — Pipeline distillation intelligente (IMPLÉMENTÉ ✅)

- clean automatique des threads bruts ✅
- double passe LLM : résumé dense + vérification exhaustivité ✅
- archive thread_clean permanente dans data_cemetery ✅
- résumés LLM conservés dans thread_summarized/ (archive locale permanente) ✅
- chunking adaptatif : tout thread découpé en chunks de CHUNK_SIZE chars ✅
- schéma Notion enrichi : bucket, impact, decision_status, lesson_type, agents ✅
- inject lit thread_summarized/ en priorité ✅
- statuts extraction_status/injection_status automatiques ✅
- paramètre VERIFY_PASS configurable (always / conditional / never) ✅

### V2.5 — Couche Action, premiers agents (IMPLÉMENTÉ ✅, B09-T41/T42)

- Agent Synthèse ✅ — synthèse sourcée sur un sujet donné
- Agent Pilotage ✅ — copilote opérationnel ÉTAT/BLOCAGE/ACTION
- Agent Ouverture ✅ — brief du matin, sélection par famille métier, rotation quotidienne du canal essentiel
- Agent Ingestion Docs ✅ — verse un PDF dans la mémoire (extraction factuelle via API Claude)
- os:statut ✅ — curation manuelle des statuts de décision (superseded/archived/rejected)
- Lecture decision_status + created_time par tous les agents lecture-seule ✅
- docs-sync — vérifie la cohérence des pointeurs de version (en cours, B09-T42)

### V3 — Réseau d'agents métier spécialisés (roadmap, non implémenté)

- agents pôle (juridique, financier, bâtiment, RH, marketing, stratégie, fiscal, achats)
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
- Seul `os/lib/notion.mjs` est à remplacer par `os/lib/supabase.mjs` — pipeline Node intact
- Élimine les timeouts API, les rate-limits, la dépendance propriétaire
- Décision gravée dans decisions_structural — source B09-T29
- **Séquencement (CLAUDE.md) : après la migration pilotage (faite) et avant/après priorité Action selon avancement — pas avant que la couche Action soit établie**

#### Moyen terme — PostgreSQL + pgvector
- Ajouter pgvector à la base PostgreSQL pour stocker les embeddings des décisions et lessons
- Les agents V3 interrogent la mémoire par recherche sémantique directement dans la base
- Décision gravée dans decisions_structural — source B09-T29

#### Long terme — Infrastructure propriétaire (V4)
- PostgreSQL + pgvector + API Node maison sur Railway ou VPS
- Scalable : audio, transcriptions longues, multi-entités du groupe, agents proactifs
- Décision gravée dans decisions_structural — source B09-T29

---

## Sécurité & Backup

### Accès et credentials

- Accès workspace Notion F&A CAPITAL : Florent uniquement — aucun autre accès humain
- Intégration API prod : périmètre limité à INSIDE-OS-DATABASES uniquement
- Intégration API sandbox : périmètre limité à INSIDE-OS-SANDBOX uniquement
- Règle permanente : toute nouvelle intégration = périmètre minimal défini explicitement avant activation
- `.env` et `.env.test` : non versionnés Git — contiennent les credentials Notion API et Anthropic API
- Process rotation/révocation credentials : à documenter après implémentation (BACKLOG_DEV INFRA P7)

### Fichiers non versionnés (machine locale uniquement)

Les dossiers suivants ne sont pas dans Git et n'ont pas de backup automatique à ce stade :

| Dossier | Contenu | Risque si perdu |
|---------|---------|-----------------|
| `data/data_cemetery/` | Threads clean complets — archive permanente | Perte de la source brute de tous les threads |
| `data/thread_summarized/` | Résumés LLM vérifiés par thread | Perte des résumés — réinjection possible depuis cemetery mais coûteuse |

**Statut backup :** non automatisé — BACKLOG_DEV INFRA P6 [TODO]. Mettre à jour cette section une fois le backup implémenté.

### Audit sécurité

Audit complet à réaliser (BACKLOG_DEV INFRA P7 [TODO]) :
- Vérifier et consolider `.gitignore`
- Chiffrement `.env` au repos sur machine locale
- Audit historique git (aucun secret exposé)
- Restreindre périmètre intégrations API Notion si nécessaire
- Anticiper système auth admin/user/dev pour interfaces UI avant implémentation

### Remote Git

- GitHub repo : `https://github.com/florentweil-sketch/inside-os.git`
- Backup automatique du repo : abandonné avec `os-thread-close.mjs` (BACKLOG_DEV — à reconstruire indépendamment si besoin)
