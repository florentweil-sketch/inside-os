# INSIDE OS — v06

## Ce qu'est INSIDE OS

INSIDE OS est le système d'exploitation stratégique de F&A CAPITAL et de ses entités (INSIDE SAS, INSIDE ARCHI, Atelier de la Colombe).

Il transforme les conversations en mémoire décisionnelle durable, structure la direction du groupe, et alimente un réseau d'agents IA spécialisés capables de piloter, conseiller et challenger les décisions.

Trois niveaux d'usage :

- **Mémoire** — stocker ce qui a été dit, décidé, appris
- **Pilotage** — interroger la mémoire pour contextualiser les décisions présentes
- **Action** — activer des agents spécialisés pour produire des recommandations, des arbitrages, des synthèses

Ce n'est pas un système de notes bien rangées. C'est un copilote décisionnel qui grandit avec le groupe.

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

3. INGEST
   npm run os:ingest
   → choix interactif : [1] Batch production / [2] Test pipeline
   → nettoyage texte (cleanText)
   → résumé LLM une ligne (raw_text)
   → création entrée THREAD_DUMP Notion
   → statuts : extraction_status=pending, injection_status=pending
   → sur update : statuts existants préservés (pas d'écrasement si déjà done)
   → guard pré-ingest : alerte si threads déjà traités détectés

4. EXTRACT
   npm run os:extract
   → lecture blocs Notion (jamais raw_text)
   → extraction LLM → JSON décisions + lessons
   → retry progressif [4000, 6000, 8000, 10000] tokens
   → parser JSON 3 stratégies en cascade
   → statut : extraction_status=done

5. INJECT
   npm run os:inject
   → création pages DECISIONS + LESSONS dans Notion
   → source_thread renseigné (relation bidirectionnelle)
   → retry_count : max 2 retries auto, blocage BLOCKED au-delà
   → statut : injection_status=done

6. ARCHIVE
   → thread déplacé vers data/data_cemetery/
   → entrée THREAD_DUMP archivée définitivement
```

---

## Pipeline

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
  threads_to_process/   → threads exportés en attente d'ingest
                          non versionné dans Git (.gitignore)
                          vidé manuellement après ingest + inject
  test_threads/         → fichiers de test pipeline uniquement
                          4 fichiers max — jamais de vrais threads de production
  data_cemetery/        → archive permanente de tous les threads traités
                          les threads y entrent après injection, n'en ressortent jamais
                          non versionné dans Git (.gitignore)
```

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

Les trois numéros sont indépendants. README v06 + PROMPT v06 + CONTEXT v15 = configuration valide.

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

INSIDE OS évoluera vers un réseau d'agents spécialisés. Chaque agent a accès à toute la mémoire du groupe pour contextualiser sa réponse dans son domaine.

### Principes communs à tous les agents

- Accès à toute la mémoire DECISIONS + LESSONS — pas de silo par bucket
- Contextualise sa réponse dans son domaine de spécialité
- Signale les manques et distingue mémoire / inférence / manque
- Deep probing : peut interroger d'autres agents pour croiser les domaines

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
npm run os:ingest       # choix interactif batch/test au démarrage
npm run os:extract
npm run os:inject

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

### V2 — Mémoire interrogeable

- moteur de recherche sémantique sur les threads
- raw_text multi-lignes par sujet détecté
- retrieval vectoriel sur DECISIONS + LESSONS
- API publique pour accès externe

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

---

## Sécurité

- `.env` non versionné
- `data/data_cemetery/` non versionné
- `data/threads_to_process/` non versionné
- Remote Git GitHub opérationnel : `https://github.com/florentweil-sketch/inside-os.git`
- Backup tar.gz automatique via `os-thread-close.mjs`
