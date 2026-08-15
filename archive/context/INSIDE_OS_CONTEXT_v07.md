# INSIDE_OS_CONTEXT_v07
Date : 2026-04-24

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / BETA TECHNIQUE + PIPELINE

**Statut : En transition**
**Version : v0.7**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Thread interrompu volontairement — longueur excessive, densité technique élevée, mélange de sujets (repo, pipeline, extraction, scoring, déploiement).
Ce document permet le redémarrage sans relire l'ancien thread.

---

## 1. Intention réelle du thread

Transformer INSIDE OS d'un système de stockage passif en un **copilote décisionnel actif** accessible via API à n'importe quel agent IA.

Problème concret résolu : la mémoire Notion était inaccessible programmatiquement. Un agent extérieur ne pouvait pas l'interroger.

Finalité visée : poser les fondations de la beta — pipeline fiable + API chat opérationnelle + mémoire complète interrogeable.

---

## 2. Acquis réels (validés, utilisables, non spéculatifs)

**Repo et organisation**
- Nomenclature des buckets figée : B01 (perso) B02 (Inside SAS) B03 (F&A Capital) B04 (Elior) B05 (Marketing) B06 (Juridique/Fiscal) B07 (Chantiers) B08 (Infrastructure) B09 (INSIDE OS) B99 (présent vivant)
- 81 threads renommés selon la nouvelle nomenclature
- `.gitignore` corrigé — data/historical_threads, runtime/out, README versionnés exclus
- Un seul `README.md` actif à la racine (v03 finale)

**Pipeline**
- `ingest → extract → inject` : fonctionnel et stable
- Bug racine corrigé : `raw_text` tronqué à 2000 chars — le script lit maintenant les blocs Notion complets
- Extraction chunk par chunk : chaque chunk de 20 000 chars extrait indépendamment, fusion avec déduplication
- Retry automatique sur JSON non fermé : tentative 2 avec prompt minimal + max_tokens 5000
- `SHRUNK_CHUNK_SIZE = 20 000`, `max_tokens extractFromChunk = 4 000`
- `os:reset-db` : script de reset complet des 3 bases (archive, non suppression)

**API chat**
- `notion-memory-server.mjs` : serveur HTTP opérationnel sur `POST /chat`
- Basculement OpenAI → Claude (claude-sonnet-4-5) validé
- Pagination complète Notion : toutes les entrées lues (plus de limite à 100)
- Bug scoring corrigé : boost B99 conditionnel — actif uniquement si question système
- Bug tokenizer corrigé : accents supprimés sans casser les mots
- 3 modes opérationnels : `pilotage` (ÉTAT/PROBLÈME/ACTION), `synthese` (prose libre), `liste` (faits bruts)

**Mémoire**
- Ingestion complète en cours : 81 threads, extraction chunk par chunk
- Qualité validée sur B03-T03 (145 Ko) : 80 décisions, 62 lessons — contre 4 avec l'ancien système
- Entités critiques préservées : noms propres, dates, montants dans les champs rationale/evidence

---

## 3. Hypothèses, intentions, paris

- Le scoring par tokens est suffisant pour retrouver les bonnes entrées — **non encore prouvé à grande échelle**
- La déduplication par les 80 premiers chars du texte est assez robuste — **à surveiller sur les threads similaires**
- Claude produit des JSON valides dans 90%+ des cas avec le prompt actuel — **empirique, pas garanti**
- La mémoire B99 reste suffisamment courte et tendue pour piloter — **dépend de la discipline d'injection**

---

## 4. Contraintes actives à respecter

**Techniques**
- Ne jamais lire `raw_text` pour l'extraction — tronqué à 2000 chars par Notion
- Toujours passer `-- --argument` pour les args npm (pas `--argument` directement)
- `injection_status` doit être à `pending` pour que l'inject prenne le thread
- Notion API limite à 100 résultats par requête — pagination obligatoire
- `runtime/out/` et `data/historical_threads/` ne doivent jamais être committés

**Organisationnelles**
- B99 = présent vivant — court, clair, actionnable — ne pas le diluer
- Le pipeline ne doit jamais écrire directement dans la mémoire depuis le chat
- Les threads traités partent en `data_cemetery` une fois injectés (pas encore implémenté)

**Règles non négociables**
- Notion = mémoire et état
- Node scripts = orchestration
- Le LLM distingue mémoire / inférence / manque — ne pas inventer

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement**
- Pipeline ingest → extract → inject de bout en bout
- API HTTP `POST /chat` avec 3 modes
- Lecture pagination complète des 400+ entrées Notion
- Extraction chunk par chunk sur les gros threads (20 000 chars/chunk)
- Retry automatique sur erreur JSON

**Ce qui fonctionne seulement en apparence**
- Le scoring — il remonte les bonnes entrées sur les questions directes, mais reste fragile sur les questions ouvertes ou les noms propres rares
- B99 comme "présent vivant" — les threads B99 existants datent d'avril 2026 et contiennent encore des priorités commerciales devenues caduques

**Ce qui reste fragile**
- 4 threads en `extract_error` (B02-T03, B03-T01, B03-T04, B07-T02) — JSON non fermé sur threads courts
- Le serveur chat tourne en local uniquement — s'arrête si le Mac dort
- Aucun déploiement cloud encore
- Le `data_cemetery` n'existe pas encore — les threads traités restent dans `historical_threads`

**Ce qui manque pour parler d'un système robuste**
- Déploiement cloud permanent (Railway, Render, ou équivalent)
- Endpoint `POST /close-thread` — pipeline automatique déclenché par "Fin du thread"
- Boost noms propres dans le scoring
- Tri Notion par bucket pour le scoring
- Mise à jour du CONTEXT v07 dans B99

---

## 6. Contradictions et incohérences détectées

- Le README v03 mentionne `SHRUNK_THRESHOLD` comme "seuil pré-shrunk" — la logique a changé : ce seuil déclenche maintenant l'extraction chunk par chunk, plus le shrunk. Le README doit être mis à jour.
- `notion-memory-chat.mjs` (ancien script CLI) coexiste avec `notion-memory-server.mjs` (nouveau serveur HTTP) — il faut décider lequel est canonique.
- Le context v06 mentionne une "priorité commerciale 30 jours" comme B99-T10 — cette priorité n'a pas été mise à jour dans B99 et contredit l'orientation actuelle (chantier technique en cours).

---

## 7. Illusions à démonter

- "Le système est prêt" — non. L'API fonctionne en local. Sans déploiement cloud, aucun agent externe ne peut l'appeler de façon fiable.
- "La mémoire est complète" — l'ingestion des 81 threads est en cours. 4 threads sont en erreur. B99 n'a pas été mis à jour depuis avril 2026.
- "Le scoring retrouve tout" — il retrouve bien les entités quand les tokens matchent. Il échoue sur les questions ouvertes et les noms propres absents du texte extrait.

---

## 8. Risques structurants

**Techniques**
- Notion API instable (504/502 récurrents) — l'injection de gros volumes peut échouer silencieusement
- Le serveur local s'arrête à la mise en veille du Mac — aucun agent ne peut l'appeler la nuit

**Stratégiques**
- Risque de rester dans le "chantier technique" sans jamais utiliser le système pour piloter l'activité réelle
- B99 non mis à jour = mémoire vivante périmée = réponses chat déconnectées du présent réel

**Faux pilotage**
- Le chat répond avec confiance même quand la mémoire est partielle — risque de décision basée sur une mémoire incomplète

---

## 9. Priorité réelle de redémarrage

**Action prioritaire : finaliser l'ingestion + déploiement cloud**

1. Vérifier que l'ingestion complète est terminée (`extract_pending: 0`, `inject_pending: 0`)
2. Relancer les 4 threads en erreur (B02-T03, B03-T01, B03-T04, B07-T02)
3. Déployer le serveur sur Railway ou Render — URL permanente, disponible 24h/24
4. Mettre à jour B99 avec le contexte réel actuel (état du système, décisions prises dans ce thread)

**Pourquoi avant le reste :** sans déploiement cloud, aucun agent externe ne peut utiliser INSIDE OS. La beta n'existe que sur le Mac de Florent.

**Livrable concret :** une URL publique qui répond à `POST /chat` depuis n'importe où, sans que le Mac soit allumé.

**Critère de succès :** envoyer une question depuis un téléphone et recevoir une réponse ancrée dans la mémoire Notion.

---

## 10. Discipline pour le prochain thread

**À ne plus rediscuter (socle verrouillé)**
- Architecture pipeline ingest → extract → inject
- Nomenclature des buckets B01 à B99
- Extraction chunk par chunk (20 000 chars, max_tokens 4 000, retry automatique)
- Pagination complète Notion
- 3 modes chat (pilotage / synthese / liste)

**À clarifier immédiatement**
- Quel script est canonique pour le chat : `notion-memory-chat.mjs` ou `notion-memory-server.mjs` ?
- Quel service cloud pour le déploiement ?
- Quand et comment mettre à jour B99 ?

**À tester avant toute extension**
- Déploiement cloud sur un thread de test avant mise en prod complète
- Scoring sur questions ouvertes et noms propres rares
- Comportement du système quand B99 est vide ou périmé

**À versionner dans la suite**
- README v04 : mettre à jour la description du pipeline (extraction chunk par chunk, plus shrunk)
- CONTEXT v07 → injecter dans B99 comme thread structurant

---

## Point de redémarrage minimal

Le prochain thread repart avec :

- **Objectif** : déploiement cloud + mise à jour B99 + boost scoring noms propres
- **Acquis réels** : pipeline stable, API chat 3 modes, 81 threads ingérés, pagination complète
- **Contraintes actives** : raw_text interdit, pagination obligatoire, B99 = présent vivant court
- **État actuel** : serveur local opérationnel, ingestion en cours, 4 threads en erreur
- **Fragilités** : pas de cloud, B99 périmé, scoring fragile sur questions ouvertes
- **Prochaine étape** : déploiement Railway/Render + correction des 4 threads en erreur + mise à jour B99
