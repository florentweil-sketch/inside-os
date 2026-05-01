# INSIDE_OS_CONTEXT_v12
Date : 2026-05-01

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T25-Notion-Dev-013

**Statut : Stable**
**Version : v12**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Thread clôturé sur objectif atteint : protocole de clôture automatisé `os-thread-close.mjs` v2 opérationnel et validé en conditions réelles (97s, draft CONTEXT v11 généré). Règles de versionning gravées dans `VERSIONING_RULE.md`. README v05 produit avec vision agents pôle et L'Associé documentée. PROMPT v05 prêt à injection. Pipeline propre : extract_done: 4, inject_done: 4, extract_error: 0, inject_error: 0, inject_pending: 0.

**Source du STOP :** seuil objectif — tous les livrables du thread produits, testés et validés. Aucun blocage technique. Système en état de démarrer l'audit Notion pré-ingestion.

---

## 1. Intention réelle du thread

**Objectif réel :** Automatiser complètement la clôture de thread B09 pour éliminer les oublis et accélérer les transferts. Graver définitivement les règles de versionning README/PROMPT/CONTEXT dans un fichier de référence. Documenter la vision long terme (agents pôle, deep probing, L'Associé) dans le README v05.

**Problème concret :** Les transferts de thread étaient manuels (20-30 min), sujets à oubli de snapshot Notion ou d'injection B99. Les règles de versionning n'étaient pas gravées — chaque nouveau thread risquait de les réinventer ou de les contredire. La vision du système restait orale ou dispersée dans les threads, jamais centralisée dans un document de référence.

**Dérive empêchée :** Ingestion massive des 82 threads sans audit préalable de Notion. Versioning couplé README=PROMPT (hypothèse initialement posée, invalidée en cours de thread). Passage en production cloud sans protocole de clôture fiable et reproductible.

---

## 2. Acquis réels

**`os-thread-close.mjs` v2 — opérationnel et validé**
- 9 phases automatisées en 97 secondes : backup versionné → retry inject_error → snapshot Notion → audit alignement README/PROMPT/CONTEXT → git diff → lecture thread → draft CONTEXT → détection bumps de version → injection CONTEXT en B99.
- Draft CONTEXT v11 généré avec contenu réel du thread (sections 0 à 11 remplies).
- Faux positif identifié : `checkFolders()` signale `test_threads` à tort comme non listé dans le README — à corriger dans la prochaine version du script.
- Commit : `ac6709e docs: CONTEXT v11 + PROMPT v05 — agents, versionning, clôture thread`.

**Règles de versionning — gravées et verrouillées**
- README vXX : évolue sur décision majeure ou changement stratégique (rarment).
- PROMPT vXX : évolue quand un gap inter-thread révèle un angle mort, une ambiguïté ou une dérive que le prompt actuel ne couvre pas.
- CONTEXT vXX : évolue à chaque thread B09 — systématiquement, numérotation indépendante.
- Les trois numéros sont indépendants. Ils peuvent diverger — c'est normal et attendu.
- Fichier de référence : `VERSIONING_RULE.md` à la racine du projet.
- Décision : ne jamais recoupler README=PROMPT — cette hypothèse a été invalidée et doit rester invalidée.

**README v05 — produit, commité, complet**
- Section "Ce qu'est INSIDE OS" : objectif clair (mémoire persistante, interrogeable, sans relecture manuelle).
- Parcours complet d'un thread : export → `threads_to_process/` → ingest → extract → inject → archive `data_cemetery/`.
- `os-thread-close.mjs` documenté dans la section "Scripts disponibles".
- Structure `data/` actuelle : `threads_to_process`, `test_threads`, `data_cemetery` — rôle de chaque dossier explicité.
- Vision V3 documentée : 7 agents pôle (Juridique B06, Financier B03, Bâtiment B02/B07, RH & Social B01, Marketing B05, Stratégie B03/B01, Fiscal B06), deep probing (agents s'interrogent entre eux), L'Associé (super-agent copilote, peut être en désaccord, utile dans les relations externes).
- Roadmap V1 → V4 restructurée et clarifiée.

**Vision agents — posée et documentée**
- 7 agents pôle identifiés et mappés sur les bases Notion existantes.
- Chaque agent accède à toute la mémoire (THREAD_DUMP, DECISIONS, LESSONS), contextualise dans son domaine métier.
- Deep probing : les agents s'interrogent entre eux pour croiser les perspectives (ex : agent Juridique interroge agent Financier sur impact fiscal d'une clause).
- L'Associé : super-agent copilote, vision transverse, peut être en désaccord avec Florent, utile dans les relations externes (clients, partenaires, levée de fonds).
- Pas d'agent codé à ce jour — V3 reste une vision, pas un livrable.

**Refactoring DS_ID — confirmé complet**
- 99 occurrences patchées dans tous les fichiers du projet.
- `queryDatabaseCompat` supprimée définitivement.
- Nomenclature stabilisée : DS_ID = Data Source ID (identifiant API Notion) — ne jamais interpréter autrement.
- Aucune régression détectée dans les tests : 4 threads extract_done, 4 threads inject_done, 0 erreur.

**PROMPT v05 — prêt à injection**
- Nouvelle section "Versionning des documents système" ajoutée.
- Règle gravée dans le prompt : README/PROMPT/CONTEXT ont des numéros indépendants.
- Vision agents pôle et L'Associé intégrée dans le contexte permanent.
- Fichier : `PROMPT_MAITRE_v05_TRANSFERT_DE_THREAD.md`.
- Statut : à injecter en B99 au prochain thread.

**Pipeline — état propre confirmé**
- THREAD_DUMP : 4 threads | extract_done: 4 | extract_error: 0 | inject_done: 4 | inject_pending: 0 | inject_error: 0.
- DECISIONS : 113 entrées.
- LESSONS : 98 entrées.
- Aucun thread bloqué, aucune erreur en attente.

---

## 3. Hypothèses, intentions, paris

**Hypothèse 1 : L'audit Notion révèlera des doublons et des structures obsolètes**
- Florent signale des "dossiers maître et vieux qui doivent disparaître".
- Aucun audit automatisé n'existe à ce jour.
- Pari : structurer un audit manuel + semi-automatisé avant ingestion complète permettra d'éviter d'injecter des données corrompues ou redondantes.
- Risque : l'audit révèle des incohérences trop profondes pour être corrigées sans refonte partielle de Notion.

**Hypothèse 2 : La version light (sans chunk) permet de tester sans risque**
- Intention : valider l'ingestion sur un batch de 10-20 threads avant de lancer les 82 threads complets.
- Pari : les erreurs structurelles (duplications, propriétés manquantes, relations cassées) seront visibles sur un petit batch.
- Risque : certains bugs n'apparaissent qu'à grande échelle (performance, rate limits API, propriétés non indexées).

**Hypothèse 3 : `os-thread-close.mjs` reste fiable sur des threads longs**
- Testé sur B09-T25 (thread moyen, ~200 lignes de contenu).
- Pari : le script tient la charge sur des threads longs (1000+ lignes) ou complexes (multiples décisions/lessons).
- Risque : timeout Claude API, draft CONTEXT incomplet, ou erreur d'injection sur gros volumes.

**Hypothèse 4 : Les règles de versionning tiendront dans le temps**
- Gravées aujourd'hui, mais jamais testées sur plusieurs cycles README/PROMPT/CONTEXT en parallèle.
- Pari : la clarté des règles (indépendance des numéros) évitera les dérives.
- Risque : dans 10 threads, quelqu'un (Claude ou Florent) bump PROMPT sans raison valable, ou oublie de bumper CONTEXT.

---

## 4. Contraintes actives à respecter

**Techniques**
- B09 exclu du pipeline automatique (ingest/extract/inject) — ne jamais le traiter comme un thread ordinaire.
- `raw_text` reste mono-ligne jusqu'à V2 (moteur recherche sémantique) — ne pas toucher avant.
- Notion = source de vérité pour l'état (THREAD_DUMP, DECISIONS, LESSONS) — Node orchestre, ne stocke rien.
- Aucun LLM call synchrone dans le pipeline principal — extraction et injection doivent pouvoir tourner sans LLM.

**Organisationnelles**
- Pas d'ingestion massive avant audit complet de Notion.
- Tester sur version light (batch 10-20 threads) avant de lancer les 82 threads.
- Tout script modifiant Notion doit produire un backup versionné avant exécution.

**Règles non négociables**
- VERSIONING_RULE.md est la référence absolue — toute contradiction dans README/PROMPT/CONTEXT doit être corrigée immédiatement.
- Les règles de versionning ne peuvent plus être modifiées sans justification explicite et validation dans un thread B09 dédié.
- Zéro formulation flatteuse, zéro récit rassurant dans les CONTEXT — ce qui est fragile doit être nommé fragile.

---

## 5. Architecture actuelle

**Ce qui fonctionne**
- Pipeline canonique : THREAD_DUMP → os-extract.mjs → os-inject.mjs → data_cemetery/ — testé sur 4 threads, 0 erreur.
- `os-thread-close.mjs` v2 : 9 phases automatisées, 97s, draft CONTEXT généré avec contenu réel.
- `os-audit.mjs` : snapshot JSON versionné des 3 bases Notion (THREAD_DUMP, DECISIONS, LESSONS).
- Chat local `notion-memory-chat.mjs` : opérationnel, recherche dans les 3 bases, mais tourne sur OpenAI GPT-4.1-mini (pas Claude).

**Ce qui fonctionne en apparence**
- Structure `data/` : `threads_to_process`, `test_threads`, `data_cemetery` — documentée dans README v05, mais jamais auditée formellement.
- Relations Notion THREAD_DUMP ↔ DECISIONS ↔ LESSONS : fonctionnent sur les 4 threads testés, mais pas validées sur des cas complexes (thread avec 20+ decisions, ou lessons partagées entre threads).

**Ce qui est fragile**
- Chat local limité à 22 entrées (4 threads) — trop petit pour produire des réponses métier utiles.
- `checkFolders()` dans `os-thread-close.mjs` produit un faux positif (signale `test_threads` à tort).
- Aucun script d'audit Notion structurel (détection doublons, propriétés orphelines, relations cassées).
- Migration `notion-memory-chat.mjs` vers Claude : identifiée comme nécessaire, mais pas priorisée ni planifiée.

**Ce qui manque**
- Audit Notion complet avant ingestion des 82 threads.
- Retry automatique sur `inject_error` : propriété `retry_count` dans THREAD_DUMP (à ajouter en V2).
- `raw_text` multi-lignes pour recherche sémantique (bloqué jusqu'à V2).
- Déploiement cloud : priorité après ingestion complète, mais aucun plan technique posé.

---

## 6. Contradictions et incohérences détectées

**Contradiction 1 : Vision agents documentée, mais aucun agent codé**
- README v05 documente 7 agents pôle + L'Associé.
- Aucun agent n'existe dans le code.
- Risque : le README promet une vision V3 que le système ne peut pas délivrer aujourd'hui.
- Décision à prendre : soit marquer explicitement "Vision V3 — non implémentée" dans le README, soit supprimer la section jusqu'à ce qu'un agent soit codé.

**Contradiction 2 : Chat local opérationnel, mais pas utilisable en production**
- `notion-memory-chat.mjs` tourne et répond.
- Base : 22 entrées (4 threads) — trop petit pour piloter quoi que ce soit.
- Florent n'utilise pas le chat en pratique — il reste un PoC technique.
- Incohérence : le README v05 documente le chat comme un outil utilisable, alors qu'il ne l'est pas en l'état.

**Contradiction 3 : Roadmap cloud prioritaire, mais bloquée par ingestion**
- Florent veut déployer en cloud après ingestion complète des 82 threads.
- Ingestion bloquée par audit Notion (dossiers maître/vieux, doublons).
- Aucun plan d'audit n'existe.
- Risque : la roadmap cloud reste théorique tant que l'audit n'est pas posé.

**Incohérence 4 : `os-thread-close.mjs` détecte les bumps de version, mais ne force rien**
- Le script affiche un warning si README/PROMPT/CONTEXT ne sont pas alignés avec les règles de versionning.
- Il ne bloque pas la clôture si les règles sont violées.
- Décision à prendre : faut-il bloquer la clôture sur violation des règles, ou juste logger un warning ?

---

## 7. Illusions à démonter

**Illusion 1 : "Le pipeline est testé, on peut lancer l'ingestion complète"**
- Vrai : 4 threads testés, 0 erreur.
- Faux : 4 threads propres ne garantissent pas que les 82 threads de `data_cemetery/` sont propres.
- Réalité : certains threads peuvent avoir des structures corrompues, des propriétés manquantes, ou des relations cassées. L'ingestion massive sans audit préalable risque de polluer Notion avec des données inutilisables.

**Illusion 2 : "Les règles de versionning sont gravées, elles seront respectées"**
- Vrai : `VERSIONING_RULE.md` existe et est clair.
- Faux : rien dans