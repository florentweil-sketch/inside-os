# INSIDE_OS_CONTEXT_v08
Date : 2026-04-26

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / PIPELINE DEBUG + STABILISATION BETA

**Statut : En transition**
**Version : v0.8**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Thread interrompu sur seuil objectif : +50 échanges, 5 sujets distincts traités (clean, ingest, extract, inject, chat). Tous les bugs identifiés en entrée de thread ont été réglés. Le système est plus robuste qu'au démarrage du thread. Ce document permet le redémarrage sans relire l'ancien thread.

---

## 1. Intention réelle du thread

Régler les bugs d'extraction qui bloquaient 6 threads en erreur, stabiliser le pipeline de bout en bout, valider la beta sur un thread no-chunk avant de lancer l'ingestion complète.

Dérive empêchée : lancer l'ingestion complète sur un pipeline fragile avec des caractères spéciaux non nettoyés et un parser JSON insuffisant.

---

## 2. Acquis réels (validés, utilisables, non spéculatifs)

**Nettoyage**
- `clean-threads.mjs` : nettoyage des 82 threads historiques — 29 664 chars de caractères spéciaux supprimés (emojis, bullets, guillemets typographiques, tirets longs, flèches Unicode, espaces insécables).
- Nettoyage intégré à l'ingest : `cleanText()` appliquée sur chaque thread avant envoi à Notion. Systématique et irréversible.

**Ingest**
- `raw_text` remplacé par un résumé LLM une ligne (20 mots max) généré par Claude pendant l'ingest. Exemple : "Contentieux client Prost, assignation tribunal Versailles 4 septembre 2025, travaux rénovation inachevés". Fallback automatique sur texte brut tronqué si ANTHROPIC_API_KEY absent ou erreur Claude.
- Bug `__DEFAULT__` corrigé : affiche maintenant `Buckets exclus : B09` au lieu de `__DEFAULT__`.
- Protocole B09 acté et implémenté : B09 exclu par défaut du pipeline automatique. CONTEXT vXX injecté en B99 à la place.

**Extract**
- Parser JSON robuste : 3 stratégies en cascade (extraction par parsing de caractères → nettoyage des strings → fermeture forcée du JSON tronqué).
- Retry progressif uniforme : `RETRY_TOKEN_STEPS = [4000, 6000, 8000, 10000]` — même mécanisme sur threads courts ET chunks longs. Tentative 1 = prompt riche. Tentatives 2+ = prompt minimal plus strict.
- Bug thread court corrigé : `max_tokens` était à 2 000 (insuffisant), passé à 4 000 en tentative 1.

**Inject**
- `source_thread` correctement renseigné : relation Notion vers la page THREAD_DUMP transmise via `threadPageId`.

**Chat**
- `source_thread` corrigé dans `notion-memory-chat.mjs` : `getRelationId()` remplace `getPropText()` pour lire les propriétés de type relation Notion. Affiche maintenant l'ID de page THREAD_DUMP.

**Organisation dossiers**
- `historical_threads/` : dossier de test uniquement — 4 fichiers max : B03-T03 (chunk long), B06-T07 (chunk court), B09-T23 (alignement système), B99-T99 (no-chunk dense).
- `data_cemetery/` : créé, tous les threads hors test archivés dedans.
- `historical_threads_clean/` : supprimé (dossier de vérification devenu inutile).

**Beta validée**
- B99-T99 (6 103 chars, no-chunk) : 18 décisions, 4 lessons, source_thread renseigné, chat opérationnel.
- B03-T03 (133 549 chars, 7 chunks) : 49 décisions, 54 lessons.

---

## 3. Hypothèses, intentions, paris

- Le retry progressif à 4 paliers couvre tous les cas — non prouvé à grande échelle (testé sur 2 threads seulement).
- Le résumé LLM sur les 3 000 premiers chars est suffisant pour identifier le sujet du thread — empirique, pas garanti sur tous les formats.
- `notion-memory-chat.mjs` utilise encore OpenAI GPT-4.1-mini pour la génération — pas encore migré vers Claude contrairement à `notion-memory-server.mjs`.

---

## 4. Contraintes actives à respecter

**Techniques**
- Ne jamais lire `raw_text` pour l'extraction — tronqué à 2 000 chars par Notion, toujours lire les blocs.
- `RETRY_TOKEN_STEPS` est la seule variable à modifier pour changer le comportement de retry — ne pas dupliquer la logique.
- Pagination Notion obligatoire — limite 100 résultats par requête.
- `runtime/out/` et `data/historical_threads/` ne doivent jamais être committés.

**Organisationnelles**
- B09 exclu du pipeline automatique — override possible avec `--skip-buckets ""`.
- `data/historical_threads/` = dossier de test uniquement (beta v01, v02…) — 4 fichiers max, jamais les vrais threads de production.
- `data/data_cemetery/` = archive permanente — les threads traités y entrent après injection, n'en ressortent jamais.
- B99 = présent vivant — court, clair, actionnable — ne pas diluer.
- Le pipeline ne doit jamais écrire directement dans la mémoire depuis le chat.

**Règles non négociables**
- Notion = mémoire et état. Node = orchestration. Jamais de logique dans Notion.
- Le LLM distingue mémoire / inférence / manque — ne pas inventer.
- `notion-memory-server.mjs` (HTTP, `POST /chat`, 3 modes : pilotage / synthese / liste) est le script canonique pour la production. `notion-memory-chat.mjs` (CLI) est l'outil de test et debug uniquement.

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement**
- Pipeline ingest → extract → inject de bout en bout sur threads propres.
- Retry progressif sur extract (threads courts et chunks longs) — mécanisme uniforme.
- Chat CLI (`notion-memory-chat.mjs`) opérationnel avec scoring, boost B99, source_thread renseigné.
- Organisation dossiers claire : test / archive / production.

**Ce qui fonctionne seulement en apparence**
- `notion-memory-chat.mjs` utilise OpenAI GPT-4.1-mini pour la génération alors que le serveur HTTP utilise Claude — deux LLMs différents pour la même fonction.

**Ce qui reste fragile**
- Aucune ingestion complète validée — testé sur 4 threads max.
- Le serveur HTTP tourne en local uniquement — s'arrête si le Mac dort.
- B99 non mis à jour depuis avril 2026 — mémoire vivante périmée.

**Ce qui manque pour parler d'un système robuste**
- Ingestion complète des 80 threads de `data_cemetery/` validée.
- Déploiement cloud permanent (Railway, Render, ou équivalent).
- B99 remis à jour avec le contexte actuel réel.

---

## 6. Contradictions et incohérences détectées

- `notion-memory-chat.mjs` utilise OpenAI GPT-4.1-mini, `notion-memory-server.mjs` utilise Claude. Deux LLMs différents pour la même fonction selon le mode d'accès — à unifier.
- Le PROMPT MAÎTRE V3 mentionne "retry automatique sur JSON non fermé" — la description ne correspond plus au mécanisme actuel (retry progressif à 4 paliers). À mettre à jour.

---

## 7. Illusions à démonter

- "Le pipeline est prêt pour l'ingestion complète" — pas encore validé à grande échelle. Il faut d'abord tester sur un batch de 10-20 threads avant de lancer les 80.
- "Le chat est opérationnel" — en local uniquement, sur 22 entrées. Ce n'est pas encore un copilote réel, c'est une validation de beta.

---

## 8. Risques structurants

**Techniques**
- Notion API 504/502 récurrents sur gros volumes — risque d'échec silencieux sur l'ingestion complète.
- Le serveur local s'arrête à la mise en veille du Mac — aucun agent externe ne peut l'appeler de façon fiable.

**Stratégiques**
- Rester dans le chantier technique sans jamais utiliser le système pour piloter l'activité réelle.
- B99 périmé = réponses chat déconnectées du présent réel.

**Faux pilotage**
- Le chat répond avec confiance sur 22 entrées — base trop petite pour être représentative d'une mémoire réelle.

---

## 9. Fichiers produits dans ce thread

| Fichier | Rôle | Statut |
|---------|------|--------|
| `os/scripts/clean-threads.mjs` | Nettoyage des threads historiques (caractères spéciaux) | En production |
| `os/scripts/prepare-beta.mjs` | Organisation historical_threads / data_cemetery | En production |
| `os/ingest/ingest-thread-dump.mjs` | Ingest + nettoyage + résumé LLM + fix __DEFAULT__ | En production |
| `os/extract/extract-thread-dump.mjs` | Extract + parser robuste + retry progressif 4 paliers | En production |
| `os/inject/inject-decisions-lessons.mjs` | Inject + source_thread relation correctement transmis | En production |
| `os/chat/notion-memory-chat.mjs` | Chat CLI + fix source_thread via getRelationId | En production |
| `data/historical_threads/B99-T99-TEST-DENSE-NOCHUNK.txt` | Thread test synthétique no-chunk (6 103 chars) | En production |

---

## 10. Priorité réelle de redémarrage

**Action prioritaire : ingestion complète des 80 threads + mise à jour B99**

Séquence exacte :
1. Déplacer les threads depuis `data_cemetery/` vers `historical_threads/` par batch de 10-20
2. `npm run os:ingest && npm run os:extract -- --limit 100 && npm run os:inject -- --limit 100`
3. Répéter jusqu'à `extract_error: 0` et `inject_pending: 0`
4. Injecter CONTEXT v08 en B99 (ce document)
5. Valider le chat sur 5 questions métier variées avec la mémoire complète

Pourquoi avant le reste : sans ingestion complète et B99 à jour, le chat répond sur 22 entrées — ce n'est pas un copilote, c'est une démo.

Livrable concret : `extract_error: 0`, `inject_pending: 0`, B99 à jour, chat validé sur questions hors B99-T99.

Critère de succès : poser une question sur un sujet non présent dans B99-T99 (ex: Guillaume Berthet, Elior, SCI) et obtenir une réponse ancrée dans la mémoire des vrais threads.

---

## 11. Discipline pour le prochain thread

**À ne plus rediscuter (socle verrouillé)**
- Architecture pipeline ingest → extract → inject
- `RETRY_TOKEN_STEPS = [4000, 6000, 8000, 10000]`
- Organisation `historical_threads/` (test) / `data_cemetery/` (archive)
- Protocole B09 — exclusion pipeline, CONTEXT en B99
- Parser JSON 3 stratégies en cascade

**À clarifier immédiatement**
- Unifier le LLM de génération : migrer `notion-memory-chat.mjs` vers Claude
- Quel service cloud pour le déploiement ?
- Stratégie de batch pour l'ingestion complète (10 par 10 ou tout d'un coup ?)

**À tester avant toute extension**
- Ingestion batch de 10-20 threads avant de lancer les 80
- Comportement du retry progressif sur les anciens threads en erreur (B03-T01, B03-T04, etc.)

**À versionner dans la suite**
- Ce CONTEXT v08 → injecter en B99
- README v04 : à faire quand l'architecture évolue (cloud, multi-agents) — pas maintenant

---

## Point de redémarrage minimal

Le prochain thread repart avec :

- **Objectif** : ingestion complète 80 threads + B99 à jour + déploiement cloud
- **Acquis réels** : pipeline stable, retry progressif 4 paliers, parser robuste, résumé LLM, source_thread renseigné, beta validée sur B99-T99 et B03-T03
- **Contraintes actives** : raw_text interdit, B09 exclu pipeline, historical_threads = test uniquement, data_cemetery = archive permanente, notion-memory-server.mjs = script canonique
- **État actuel** : 4 threads en historical_threads, 22 entrées en mémoire, chat local opérationnel, serveur HTTP local
- **Fragilités** : pas de cloud, B99 périmé, ingestion complète non validée, notion-memory-chat.mjs encore sur OpenAI
- **Prochaine étape** : batch ingestion 10-20 threads → valider → ingestion complète → B99 → déploiement cloud
