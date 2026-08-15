# INSIDE_OS_CONTEXT_v11
Date : 2026-05-01

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T25-Notion-Dev-013

**Statut : En transition**
**Version : v11**
**Niveau de confiance : Moyen**

---

## 0. Signal de continuité

Thread clôturé sur objectif atteint : protocole de clôture automatisé validé, règles de versionning gravées, README v05 produit avec vision agents, PROMPT v05 à injecter. Pipeline propre : extract_done: 4, inject_done: 4, inject_error: 0. Ce document permet le redémarrage sans relire les threads T24 et T25.

**Source du STOP :** seuil objectif — tous les livrables du thread produits et validés.

---

## 1. Intention réelle du thread

**Objectif réel :** Mettre en place un protocole automatisé de clôture de thread, graver les règles de versionning définitives, et poser la vision long terme d'INSIDE OS (agents pôle, L'Associé) dans le README.

**Problème concret :** Les transferts de thread étaient manuels, lents, sujets à oubli. Les règles de versionning README/PROMPT/CONTEXT n'étaient pas gravées — chaque thread risquait de les réinventer. La vision du système restait floue dans les documents de référence.

**Dérive empêchée :** Ingestion complète des 82 threads sans audit préalable. Versioning couplé README=PROMPT (hypothèse fausse invalidée en cours de thread). Passage en production sans protocole de clôture fiable.

---

## 2. Acquis réels

**`os-thread-close.mjs` v2 — opérationnel**
- 9 phases automatisées : backup versionné → retry inject_error → snapshot Notion → audit alignement → git diff → lecture thread → draft CONTEXT → détection bumps → injection B99.
- Testé sur ce thread : 97 secondes, draft CONTEXT v11 généré avec contenu réel du thread.
- Faux positif `checkFolders()` identifié (`test_threads` signalé à tort) — à corriger.

**Règles de versionning — gravées et verrouillées**
- README vXX : évolue sur décision majeure ou changement stratégique.
- PROMPT vXX : évolue quand un gap inter-thread révèle un angle mort ou dérive.
- CONTEXT vXX : évolue à chaque thread B09 — systématiquement.
- Les trois numéros sont indépendants. Fichier de référence : `VERSIONING_RULE.md` à la racine.

**README v05 — produit et commité**
- Section "Ce qu'est INSIDE OS" — objectif clair.
- Parcours complet d'un thread (export → archive).
- `os-thread-close.mjs` documenté.
- Structure `data/` actuelle (threads_to_process, test_threads, data_cemetery).
- Agents pôle, deep probing, L'Associé — vision V3 documentée.
- Roadmap V1 → V4 restructurée.

**Vision agents — posée**
- 7 agents pôle : Juridique (B06), Financier (B03), Bâtiment (B02/B07), RH & Social (B01), Marketing (B05), Stratégie (B03/B01), Fiscal (B06).
- Chaque agent accède à toute la mémoire, contextualise dans son domaine.
- Deep probing : agents s'interrogent entre eux.
- L'Associé : super-agent copilote, peut être en désaccord, utile dans les relations externes.

**Refactoring DS_ID — confirmé complet**
- 99 occurrences patchées, `queryDatabaseCompat` supprimée, nomenclature verrouillée.
- `os/lib/notion.mjs` nettoyé définitivement.

**Structure data/ — stabilisée**
- `threads_to_process/` : zone de dépôt threads à ingérer.
- `test_threads/` : 4 fichiers max, test uniquement.
- `data_cemetery/` : 82 threads archivés.

**Git — actif**
- Historique sémantique propre, commits refactor/chore/docs.
- Remote non configuré — à faire.

**Pipeline état**
- 4 threads traités : extract_done: 4, inject_done: 4, inject_error: 0.
- 113 DECISIONS, 98 LESSONS en mémoire.
- `source_thread` bidirectionnel fonctionnel.

---

## 3. Hypothèses, intentions, paris

- Le protocole `os-thread-close.mjs` sera suffisant pour maintenir l'alignement système sans effort manuel — à valider sur les 3 prochains threads.
- La vision agents (V3) tient sans déconstruire l'architecture V1 — pari architectural non encore testé.
- L'Associé comme super-agent est faisable avec l'architecture actuelle — hypothèse non prouvée, dépend du volume de mémoire et de la qualité du retrieval.
- Tester sur 10-20 threads avant les 82 suffira à détecter les edge cases — non prouvé à ce stade.
- `notion-memory-chat.mjs` peut rester sur OpenAI pendant la phase d'ingestion — migration Claude non bloquante à court terme.

---

## 4. Contraintes actives à respecter

**Nomenclature**
- DS_ID = Data Source ID (identifiant API Notion) — aucune autre interprétation.
- `queryDataSource()` uniquement — `queryDatabaseCompat` banni.

**Protocole B09**
- B09 exclu pipeline automatique — CONTEXT vXX en B99 uniquement.
- `os-thread-close.mjs` obligatoire en fin de chaque thread B09.
- Thread B09 brut → `data_cemetery/` uniquement.

**Structure data/**
- `threads_to_process/` → `test_threads/` (4 max) → `data_cemetery/` (permanent).
- Jamais de thread B09 dans `threads_to_process/` ou `test_threads/`.

**Pipeline**
- Ne jamais lire `raw_text` — toujours lire les blocs Notion.
- `RETRY_TOKEN_STEPS = [4000, 6000, 8000, 10000]` — seule variable retry.
- Parser JSON 3 stratégies en cascade.
- Pagination Notion : limite 100 résultats.

**Versionning**
- README / PROMPT / CONTEXT indépendants — règles gravées dans `VERSIONING_RULE.md`.

**Roadmap**
- raw_text multi-lignes : V2 uniquement — ne pas toucher avant.
- `retry_count` dans THREAD_DUMP : à implémenter avant ingestion complète.

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement**
- Pipeline ingest → extract → inject sur 4 threads test.
- `os-thread-close.mjs` v2 : protocole de clôture automatisé opérationnel.
- `os/lib/notion.mjs` : API Notion unifiée, DS_ID cohérent.
- Git actif, historique propre.
- README v05 : documentation à jour avec vision complète.

**Ce qui fonctionne en apparence**
- Chat local : répond, mais 113 DECISIONS sur 4 threads = base inutilisable métier.
- Retry inject_error dans `os-thread-close.mjs` : fonctionne mais `retry_count` non persisté en base — compteur perdu si redémarrage.

**Ce qui reste fragile**
- Ingestion complète non réalisée — 82 threads encore dans `data_cemetery/`.
- `retry_count` non implémenté dans THREAD_DUMP Notion.
- Faux positif `checkFolders()` dans `os-thread-close.mjs`.
- Remote Git non configuré.
- `notion-memory-chat.mjs` encore sur OpenAI GPT-4.1-mini.
- B99 périmé — non mis à jour depuis v08.

**Ce qui manque**
- Ingestion batch 10-20 threads validée.
- `retry_count` dans THREAD_DUMP + retry dans `os:inject`.
- Remote Git (GitHub ou équivalent).
- B99 mis à jour avec CONTEXT v11.
- PROMPT v05 injecté dans les documents maîtres.

---

## 6. Contradictions et incohérences détectées

**Versioning couplé puis découplé**
- Règle initiale du thread : "README et PROMPT ont toujours le même numéro".
- Règle finale gravée : indépendants. README v05, PROMPT v04 actuellement — alignement accidentel, pas structurel.
- Risque : prochain thread réintroduit l'hypothèse de couplage si PROMPT v05 n'est pas injecté.

**Retry logic fragmentée**
- `os-thread-close.mjs` gère max 2 retries.
- THREAD_DUMP ne contient pas `retry_count`.
- Redémarrage = compteur perdu = thread peut être retry à l'infini sans détection.

**Chat validé techniquement, invalide métier**
- `notion-memory-chat.mjs` fonctionne.
- 113 DECISIONS sur 4 threads = pas représentatif.
- Coché "opérationnel" alors que pas utilisable pour piloter l'activité réelle.

**`docs/versioning_rules.md` inexistant**
- Le draft LLM v11 mentionnait ce fichier — il n'a pas été créé.
- Le vrai fichier de référence s'appelle `VERSIONING_RULE.md` à la racine.

---

## 7. Illusions à démonter

**"Le protocole de clôture est complet"**
- `os-thread-close.mjs` fonctionne. Mais sans le fichier du thread disponible, les sections subjectives du CONTEXT sont des inférences. La qualité dépend de l'export manuel du thread — étape non automatisable.

**"Le système est prêt pour l'ingestion complète"**
- Pipeline propre sur 4 threads ≠ robuste sur 82. `retry_count` non implémenté, Notion non audité sur les "dossiers maître et vieux", comportement API sous charge inconnu.

**"Git = sécurité"**
- Repository local sans remote. Perte du Mac = perte totale de l'historique.

**"Les agents sont définis"**
- Vision posée dans README v05. Architecture technique = zéro. Aucun agent implémenté, aucun test, aucun prompt agent défini.

---

## 8. Risques structurants

**Technique : retry_count non persisté**
- Un thread peut être retry à l'infini sans détection si le script redémarre entre deux tentatives.
- Impact : boucles silencieuses, faux diagnostics, pollution Notion.

**Technique : remote Git absent**
- Perte hardware = perte totale de l'historique du projet.
- Impact : catastrophique et irréversible.

**Stratégique : ingestion incomplète**
- 82 threads dans `data_cemetery/` = mémoire réelle du groupe non injectée.
- Sans ingestion, le chat ne pilote rien. Les agents n'auront pas de base réelle.
- Impact : système fonctionnel mais inutile en production.

**Stratégique : vision agents sans architecture**
- V3 documentée dans README v05, mais aucun travail technique commencé.
- Risque : la vision crée une attente non satisfaite si V1 (ingestion complète) n'est pas finalisée d'abord.

**Organisationnel : B99 périmé**
- Mémoire vivante non mise à jour depuis CONTEXT v08.
- Chat répond sur une base désynchronisée du présent réel.

---

## 9. Fichiers produits dans ce thread

| Fichier | Rôle | Statut |
|---------|------|--------|
| `os-thread-close.mjs` v2 | Protocole clôture automatisé 9 phases | En production |
| `patch-ds-rename.mjs` | Patch renommage DB_ID → DS_ID (99 occurrences) | Utilisé — archivable |
| `patch-rename-folders.mjs` | Patch renommage historical_threads → test_threads | Utilisé — archivable |
| `VERSIONING_RULE.md` | Règles versionning README/PROMPT/CONTEXT | Référence — garder |
| `snapshot.mjs` | Snapshot Notion live (diagnostic) | Utilitaire — garder |
| `docs/readme/README_INSIDE_OS_v05.md` | README mis à jour — vision agents, parcours thread | En production |
| `docs/context/INSIDE_OS_CONTEXT_v10.md` | Context thread T24+T25 (corrigé) | Archivé |
| `docs/context/INSIDE_OS_CONTEXT_v11.md` | Ce document | En production |
| `os/lib/notion.mjs` | Refactorisé DS_ID, fonctions obsolètes supprimées | En production |

---

## 10. Priorité réelle de redémarrage

**Action prioritaire : PROMPT v05 + retry_count + remote Git + ingestion batch 10 threads**

Séquence exacte :
1. Injecter PROMPT v05 (règles versionning + agents dans contexte permanent)
2. Ajouter propriété `retry_count` dans THREAD_DUMP Notion
3. Implémenter retry automatique dans `os:inject` (pas seulement dans `os-thread-close.mjs`)
4. Corriger faux positif `checkFolders()` dans `os-thread-close.mjs`
5. Configurer remote Git
6. Déplacer 10 threads de `data_cemetery/` vers `threads_to_process/`
7. `npm run os:ingest && npm run os:extract && npm run os:inject`
8. Valider : extract_error: 0, inject_error: 0 sans intervention manuelle
9. Mettre à jour B99 avec CONTEXT v11

Critère de succès : 10 threads réels ingestés sans intervention manuelle, `retry_count` en base, remote Git configuré.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé**
- DS_ID = Data Source ID — définition unique.
- `os-thread-close.mjs` obligatoire en fin de thread B09.
- Versionning README/PROMPT/CONTEXT indépendants — cf. `VERSIONING_RULE.md`.
- B09 exclu pipeline automatique.
- raw_text multi-lignes = V2 — ne pas toucher.
- Vision agents = V3 — ne pas implémenter avant V1 complète.

**À faire immédiatement**
- PROMPT v05 : intégrer règles versionning + agents dans contexte permanent.
- `retry_count` dans THREAD_DUMP + retry dans `os:inject`.
- Corriger `checkFolders()` dans `os-thread-close.mjs`.
- Remote Git.

**À tester avant ingestion complète**
- Batch 10 threads depuis `data_cemetery/` : extract_error: 0, inject_error: 0 sans intervention.
- Comportement sur threads longs (>100k chars).

**À versionner**
- CONTEXT v11 → injecter en B99.
- PROMPT v05 → injecter dans `docs/prompts transfert thread/`.

---

## Point de redémarrage minimal

- **Objectif** : PROMPT v05 + retry_count + remote Git + ingestion 10 threads batch
- **Acquis réels** : os-thread-close v2 opérationnel, DS_ID unifié, README v05 commité, règles versionning gravées, pipeline 4/4 propre, 113 DECISIONS / 98 LESSONS
- **Contraintes actives** : DS_ID = Data Source ID, B09 exclu pipeline, test_threads 4 max, raw_text multi-lignes = V2, agents = V3
- **État actuel** : ingestion complète non faite, B99 périmé, retry_count non implémenté, remote Git absent, PROMPT encore v04
- **Prochaine étape** : PROMPT v05 → retry_count → remote Git → batch 10 threads → ingestion complète → B99
