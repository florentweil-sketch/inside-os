# INSIDE_OS_CONTEXT_v13
Date : 2026-05-01

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T25-Notion-Dev-013

**Statut : Stable**
**Version : v13**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Thread clôturé sur objectif atteint : protocole de clôture automatisé `os-thread-close.mjs` v2 opérationnel et validé en conditions réelles (97s, draft CONTEXT v11 généré). Règles de versionning gravées dans `VERSIONING_RULE.md`. README v05 produit avec vision agents pôle et L'Associé documentée. PROMPT v05 prêt à injection. Pipeline propre : extract_done: 4, inject_done: 4, extract_error: 0, inject_error: 0, inject_pending: 0.

**Source du STOP :** seuil objectif — tous les livrables du thread produits, testés et validés. Aucun blocage technique. Système en état de démarrer l'audit Notion pré-ingestion.

**Décision de Florent à la fin du thread :** Bloquer toute ingestion massive avant d'avoir (1) audité complètement Notion (dossiers maîtres/vieux à nettoyer), (2) validé le système sur version light sans chunking, (3) résolu définitivement les problèmes de pending, (4) aligné README/PROMPT/CONTEXT via script automatique.

---

## 1. Intention réelle du thread

**Objectif réel :** Automatiser complètement la clôture de thread B09 pour éliminer les oublis et accélérer les transferts. Graver définitivement les règles de versionning README/PROMPT/CONTEXT dans un fichier de référence. Documenter la vision long terme (agents pôle, deep probing, L'Associé) dans le README v05.

**Problème concret :** Les transferts de thread étaient manuels (20-30 min), sujets à oubli de snapshot Notion ou d'injection B99. Les règles de versionning n'étaient pas gravées — chaque nouveau thread risquait de les réinventer ou de les contredire. La vision du système restait orale ou dispersée dans les threads, jamais centralisée dans un document de référence.

**Dérive empêchée :** Ingestion massive des 82 threads sans audit préalable de Notion. Versioning couplé README=PROMPT (hypothèse initialement posée, invalidée en cours de thread — "README et PROMPT ont toujours le même numéro" — démentie par la vraie logique d'évolution indépendante). Passage en production cloud sans protocole de clôture fiable et reproductible.

---

## 2. Acquis réels

**`os-thread-close.mjs` v2 — opérationnel et validé**
- 9 phases automatisées en 97 secondes : backup versionné → retry inject_error → snapshot Notion → audit alignement README/PROMPT/CONTEXT → git diff → lecture thread → draft CONTEXT → détection bumps de version → injection CONTEXT en B99.
- Draft CONTEXT v11 généré avec contenu réel du thread (sections 0 à 11 remplies).
- Faux positif identifié : `checkFolders()` signale `test_threads` à tort comme non listé dans le README — à corriger dans la prochaine version du script.
- Commit : `ac6709e docs: CONTEXT v11 + PROMPT v05 — agents, versionning, clôture thread`.

**Règles de versionning — gravées et verrouillées**
- README vXX : évolue sur décision majeure ou changement stratégique (rarement).
- PROMPT vXX : évolue quand un gap inter-thread révèle un angle mort, une ambiguïté ou une dérive que le prompt actuel ne couvre pas.
- CONTEXT vXX : évolue à chaque thread B09 — systématiquement, numérotation indépendante.
- Les trois numéros sont indépendants. Ils peuvent diverger — c'est normal et attendu.
- Fichier de référence : `VERSIONING_RULE.md` à la racine du projet.
- Décision : ne jamais inventer de signification pour les acronymes techniques. DS_ID = Data Source ID (identifiant API Notion) — aucune autre interprétation autorisée.

**README v05 — vision long terme documentée**
- Agents pôle documentés : agents conversationnels spécialisés par domaine métier (gestion, social, stratégie, opérations), utilisant `notion-memory-chat.mjs` pour interroger les bases Notion.
- L'Associé : assistant conversationnel unifié connecté aux agents pôle, capable de déléguer les requêtes à l'agent métier pertinent et d'agréger les réponses.
- Deep probing : capacité d'extraction et d'analyse contextualisée à partir des threads — priorité de développement après stabilisation du pipeline.

**PROMPT v05 — prêt à injection**
- Intègre les règles de versionning.
- Rôle "architecte de continuité stratégique" formalisé.
- Consignes strictes : pas d'invention de signification pour les acronymes, remplir toutes les sections, signaler explicitement les manques d'information, zéro formulation flatteuse.

**Pipeline stabilisé sur 4 threads de test**
- THREAD_DUMP : 4 threads | extract_done: 4 | extract_error: 0 | inject_done: 4 | inject_pending: 0 | inject_error: 0.
- DECISIONS : 113 entrées.
- LESSONS : 98 entrées.
- Aucun thread bloqué. Aucune régression détectée.

---

## 3. Hypothèses, intentions, paris

**Hypothèse non testée : `os-thread-close.mjs` passe à l'échelle sur 82 threads**
- Le script a été validé sur 1 thread (B09-T25). Rien ne prouve qu'il tient la charge sur 82 threads d'un coup — injection B99 pourrait échouer, snapshot Notion pourrait timeout, draft CONTEXT pourrait exploser en taille. À tester en batch de 10-20 threads avant ingestion complète.

**Pari : l'audit Notion révèle des incohérences structurelles**
- Florent mentionne des "dossiers maîtres et vieux qui doivent disparaître" — aucune visibilité actuelle sur leur contenu, leur impact sur les bases THREAD_DUMP/DECISIONS/LESSONS, ou leur duplication potentielle avec les threads en production. L'audit pourrait révéler des doublons, des threads corrompus, ou des dépendances cassées.

**Intention : version light sans chunking avant artillerie lourde**
- Florent veut valider tout le système sur une version light (probablement les 4 threads actuels) avant d'injecter les 82 threads. C'est une discipline de test saine — mais "version light" reste flou. Qu'est-ce qu'on valide exactement ? Les agents pôle ? Le chat local ? L'alignement README/PROMPT/CONTEXT ? À clarifier dans le prochain thread.

**Pari : les problèmes de pending sont structurels, pas anecdotiques**
- Florent veut "être sûr que les problèmes de pending sont réglés et patchés avant d'aller plus loin". Aucun inject_pending détecté actuellement — mais le risque existe que sur 82 threads, des erreurs réseau ou des timeouts Notion réapparaissent. Le mécanisme de retry automatique n'existe pas encore (retry_count à implémenter).

**Hypothèse non prouvée : script d'auto-alignement README/PROMPT/CONTEXT faisable**
- Florent demande "un script qui à chaque nouveau thread ou évolution de inside-os se mette à jour automatiquement grâce à un audit qui aligne README, PROMPT, CONTEXT". C'est ambitieux — ça suppose qu'un script puisse détecter les écarts sémantiques entre trois documents, décider lequel est la source de vérité, et mettre à jour les autres sans intervention humaine. Ça n'existe pas aujourd'hui. Faisabilité à étudier — probablement un assistant LLM guidé plutôt qu'un script pur.

---

## 4. Contraintes actives à respecter

**Contraintes techniques**
- DS_ID = Data Source ID (identifiant API Notion) — ne jamais interpréter autrement.
- B09 exclu du pipeline automatique — injection manuelle uniquement.
- Notion = source de vérité — toute modification de structure doit être auditée avant ingestion.
- `test_threads/` limité à 4-5 fichiers max — nettoyer systématiquement après validation.
- raw_text multi-lignes : ne pas toucher avant V2 (moteur recherche sémantique).

**Contraintes organisationnelles**
- Aucune ingestion massive avant audit complet de Notion.
- Tout changement d'architecture nécessite validation sur version light avant production.
- Les règles de versionning (VERSIONING_RULE.md) sont non négociables — aucune modification sans décision explicite de Florent.

**Règles non négociables**
- Remplir TOUTES les sections du CONTEXT — aucune case vide ni [À COMPLÉTER].
- Sections factuelles : données réelles uniquement.
- Sections subjectives : propositions honnêtes basées sur le contexte, clairement identifiées comme propositions.
- Zéro formulation flatteuse, zéro récit rassurant.
- Si information manquante : écrire ce qu'on sait + signaler le manque explicitement.

---

## 5. Architecture actuelle

**Ce qui fonctionne**
- Pipeline THREAD_DUMP → EXTRACT → INJECT stable sur 4 threads.
- `os-thread-close.mjs` v2 opérationnel : clôture automatisée en 97s, draft CONTEXT généré, injection B99 validée.
- Bases Notion THREAD_DUMP (4), DECISIONS (113), LESSONS (98) peuplées et cohérentes.
- Chat local `notion-memory-chat.mjs` fonctionnel (OpenAI GPT-4.1-mini) sur base actuelle.
- Versioning gravé dans `VERSIONING_RULE.md`.
- README v05 et PROMPT v05 à jour.

**Ce qui fonctionne en apparence**
- La règle "B09 exclu du pipeline automatique" est documentée dans le README, mais aucun verrou technique n'empêche son ingestion accidentelle — à implémenter si le risque devient réel.
- `checkFolders()` dans `os-thread-close.mjs` signale des faux positifs (test_threads) — la logique de détection est trop stricte, à affiner.

**Ce qui est fragile**
- Chat local limité à 4 threads — base trop petite pour tester des requêtes métier complexes ou des agents pôle.
- `notion-memory-chat.mjs` utilise OpenAI GPT-4.1-mini — migration vers Claude prévue, mais non urgente. Dépendance externe à une API payante non auditée côté coût/usage.
- Aucun mécanisme de retry automatique en cas d'inject_error (retry_count inexistant).
- Audit Notion non fait — risque de doublons, threads corrompus, ou dossiers obsolètes non identifiés.

**Ce qui manque**
- Audit complet de Notion : inventaire des dossiers maîtres/vieux, détection des doublons, validation de la cohérence THREAD_DUMP/DECISIONS/LESSONS.
- Script d'auto-alignement README/PROMPT/CONTEXT (demandé par Florent) — non conçu, faisabilité à étudier.
- Validation système sur version light : définir ce qu'on valide exactement (agents pôle ? chat local ? alignement docs ?).
- Mécanisme de retry automatique (retry_count max 2).
- Tests de charge : `os-thread-close.mjs` sur batch de 10-20 threads, injection B99 sur base complète de 82 threads.

---

## 6. Contradictions et incohérences détectées

**Contradiction : règle de versioning initiale vs règle finale**
- Règle initiale (début du thread) : "README et PROMPT ont toujours le même numéro."
- Règle finale (gravée dans VERSIONING_RULE.md) : "README vXX et PROMPT vXX ont des numéros indépendants. Ils peuvent diverger — c'est normal et attendu."
- Impact : la première règle a été démentie en cours de thread. Si un thread futur se base sur une version obsolète du CONTEXT, il risque de réintroduire la mauvaise règle. Solution : `VERSIONING_RULE.md` est la source de vérité unique — tout CONTEXT/README/PROMPT doit pointer vers ce fichier, pas reproduire son contenu.

**Incohérence : `test_threads/` listé ou non dans le README**
- `os-thread-close.mjs` signale `test_threads/` comme absent du README.
- README v05 ne liste effectivement pas `test_threads/` dans la section "Structure de données".
- Mais `test_threads/` est mentionné dans la contrainte "test_threads/ limité à 4-5 fichiers max".
- Incohérence mineure — à corriger : soit ajouter `test_threads/` dans "Structure de données", soit retirer la contrainte du README et la déplacer dans le PROMPT.

**Incohérence : chat local "opérationnel" mais "base trop petite"**
- Le CONTEXT v12 affirme "chat local opérationnel sur une base trop petite pour piloter quoi que ce soit".
- Si la base est trop petite pour piloter, le chat n'est pas "opérationnel" au sens métier — il est techniquement fonctionnel, mais stratégiquement inutile.
- À reformuler : "Chat local techniquement fonctionnel, mais base actuelle (4 threads) insuffisante pour tests métier réels."

---

## 7. Illusions à démonter

**Illusion : le système est prêt pour l'ingestion massive**
- Le pipeline fonctionne sur 4 threads, `os-thread-close.mjs` a été validé 1 fois, aucun inject_pending ni inject_error détecté. Ça ressemble à du vert. Mais :
  - Notion n'a jamais été audité — on ne sait pas ce qu'on va injecter.
  - Aucun test de charge sur 82 threads — timeouts, memory leaks, race conditions possibles.
  - Aucun mécanisme de reprise sur erreur (retry_count).
  - Chat local inutilisable pour validation métier réelle.
- Vérité : le système est stable sur une base de test minimale. Il n'est pas prêt pour la production.

**Illusion : un script peut auto-aligner README/PROMPT/CONTEXT**
- Florent demande "un script qui à chaque nouveau thread ou évolution de inside-os se mette à jour automatiquement