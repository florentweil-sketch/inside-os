# INSIDE_OS_CONTEXT_v13
Date : 2026-05-01

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T26-test

**Statut : Stable**
**Version : v13**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Thread de test système clôturé sans modification fonctionnelle. Objectif : vérifier la stabilité post-T25 et tester `os-thread-close.mjs` v3 en conditions réelles. Pipeline intact : extract_done: 4, inject_done: 3, inject_pending: 1, inject_error: 0. Aucune régression détectée. Commit 94b11f3 (test remote Git) confirme la connexion dépôt distant opérationnelle.

**Source du STOP :** thread de vérification — aucun livrable fonctionnel attendu, système confirmé stable.

---

## 1. Intention réelle du thread

**Objectif réel :** Valider la stabilité du système après les modifications majeures de T25 (os-thread-close v3, règles versionning, documentation V3). Tester la génération automatique de CONTEXT en conditions réelles sans contenu métier.

**Problème concret :** Après refonte complète du pipeline de clôture (T25), risque de régression silencieuse. Besoin de vérifier que `os-thread-close.mjs` v3 génère bien un draft CONTEXT exploitable même sur un thread vide/test.

**Dérive empêchée :** Lancer l'ingestion massive des 82 threads sans validation système préalable. Considérer un thread test comme un thread métier — il n'y a aucun contenu à transférer ici, c'est une validation technique pure.

---

## 2. Acquis réels

**Stabilité système confirmée**
- Pipeline extract/inject opérationnel : 4 extractions réussies, 3 injections réussies, 1 en attente (comportement normal).
- `os-thread-close.mjs` v3 testé en situation réelle : draft CONTEXT généré, structure respectée, durée ~93 secondes conforme.
- Git remote opérationnel : commit 94b11f3 poussé avec succès.
- Aucun thread bloqué (extract_error: 0, inject_error: 0).

**Faux positif `checkFolders()` reproduit**
- `test_threads/` signalé comme anomalie alors que c'est un dossier légitime documenté dans README v05.
- Confirmation technique : le bug identifié en T25 est reproductible — `checkFolders()` doit ignorer explicitement `test_threads/`.
- Action requise : corriger en v4 avec whitelist `['threads_to_process', 'test_threads', 'data_cemetery']`.

**Thread test valide le protocole de clôture**
- CONTEXT v13 généré depuis état système uniquement (aucun contenu métier disponible).
- Démontre que le script peut fonctionner même sur threads vides/incomplets — robustesse confirmée.

---

## 3. Hypothèses, intentions, paris

**Hypothèse à valider :** `os-thread-close.mjs` v3 est prêt pour l'ingestion des 82 threads historiques sans supervision continue.

**Pari :** Le faux positif `checkFolders()` est cosmétique et ne bloque pas l'utilisation opérationnelle du script — on peut corriger en v4 après l'ingestion.

**Intention non testée :** Comportement du script sur threads avec inject_error > 0. Le retry automatique (phase 2) n'a pas été éprouvé en conditions réelles — aucun inject_error dans le système actuellement.

**Zone grise :** La durée d'exécution (~93 secondes par thread) implique ~2h15 pour traiter 82 threads en séquentiel. Acceptable pour ingestion unique, mais à optimiser si clôtures fréquentes (parallélisation ou sélection phases).

---

## 4. Contraintes actives à respecter

**Techniques**
- DS_ID = Data Source ID (identifiant API Notion) — jamais autre signification.
- B09 exclu du pipeline automatique — traitement manuel obligatoire.
- CONTEXT vXX injecté en B99 uniquement après validation humaine du draft.
- Séparation draft/inject obligatoire : `--inject` lit le draft, ne génère jamais directement la version finale.
- raw_text multi-lignes interdit jusqu'à V2 (moteur recherche sémantique).

**Versionning**
- README vXX : bump sur décision majeure ou changement stratégique.
- PROMPT vXX : bump sur gap inter-thread révélé ou dérive constatée.
- CONTEXT vXX : bump systématique à chaque thread B09.
- Numéros indépendants — jamais couplés.

**Organisationnelles**
- Aucune modification fonctionnelle sans documentation synchrone (README/PROMPT).
- Fichiers auto-générés interdits dans le dépôt sans validation humaine explicite.
- Structure `data/` figée : threads_to_process / test_threads / data_cemetery.

**Non négociables**
- Zéro formulation flatteuse dans les documents de transfert.
- Zéro section vide ou [À COMPLÉTER] dans les CONTEXT.
- Signaler explicitement les manques d'information plutôt que d'inventer.

---

## 5. Architecture actuelle

**Ce qui fonctionne**
- Pipeline extract/inject stable sur 4 threads test.
- `os-thread-close.mjs` v3 génère des drafts CONTEXT exploitables.
- Git remote opérationnel (push/pull confirmés).
- Documentation V3 complète : README v05, PROMPT v05, VERSIONING_RULE.md commités.
- Séparation draft/inject empêche les commits accidentels de fichiers non validés.

**En apparence stable mais non éprouvé**
- Retry automatique sur inject_error (phase 2 de os-thread-close) : code écrit, jamais testé en conditions réelles.
- Comportement du système sur volume : 82 threads jamais traités en continu, durée totale et risques de rate-limit API Notion non mesurés.

**Fragile**
- `checkFolders()` génère un faux positif sur `test_threads/` — cosmétique mais pollue la sortie.
- Durée d'exécution ~93 secondes par thread : acceptable pour usage ponctuel, bloquant si usage fréquent (> 10 threads/jour).

**Manque**
- `retry_count` property dans THREAD_DUMP (roadmap V2) : actuellement, impossible de tracer le nombre de tentatives d'injection.
- Tests automatisés du pipeline : tout repose sur validation manuelle.
- Métriques de performance : pas de monitoring durée extract/inject, taux d'erreur dans le temps, consommation tokens LLM.

---

## 6. Contradictions et incohérences détectées

**`test_threads/` documenté mais rejeté par `checkFolders()`**
- README v05 documente explicitement `test_threads/` comme dossier légitime.
- `os-thread-close.mjs` v3 le signale comme anomalie à chaque exécution.
- Incohérence entre documentation et code — à corriger en v4.

**Séparation draft/inject vs workflow réel**
- Le script génère `CONTEXT_vXX_draft.md`, mais le workflow suppose un rename manuel en `CONTEXT_vXX.md` avant `--inject`.
- Risque : si l'humain lance `--inject` sans avoir renommé, le script cherchera un fichier inexistant ou lira un ancien draft.
- Comportement actuel : `--inject` lit `CONTEXT_vXX_draft.md` puis le renomme. Contradiction avec l'idée de "validation humaine du draft avant injection" — la validation est censée se faire avant le rename, pas automatiquement pendant l'inject.

**Thread test vs CONTEXT métier**
- T26 est un thread de validation technique, pas un transfert de connaissances métier.
- Pourtant, CONTEXT v13 suit le format canonique conçu pour des threads métier riches.
- Résultat : sections 1-3-7-8 remplies avec inférences génériques faute de contenu réel — le format force du contenu où il n'y en a pas.

---

## 7. Illusions à démonter

**"Le système est production-ready après T25"**
- Faux. `os-thread-close.mjs` v3 n'a été testé que sur 1 thread test vide. Aucun thread métier riche n'a été clôturé avec le nouveau pipeline. Le retry automatique (phase 2) n'a jamais fonctionné en conditions réelles.

**"Un thread test valide le comportement sur 82 threads"**
- Faux. T26 n'a pas de contenu métier, pas d'inject_error, pas de modifications fichiers complexes. Les 82 threads historiques peuvent révéler des edge cases non anticipés (threads très longs, extractions partielles, injections échouées multiples).

**"checkFolders() est un bug mineur"**
- Vrai pour l'usage actuel, faux si on automatise. Un faux positif à chaque exécution pollue les logs, masque les vrais problèmes, et décrédibilise le monitoring. Risque de "alert fatigue" — ignorer les warnings jusqu'à ce qu'un vrai problème passe inaperçu.

**"La durée d'exécution est acceptable"**
- Acceptable pour ingestion ponctuelle (82 threads = 2h15 en séquentiel). Non acceptable si clôtures fréquentes (quotidiennes) ou si monitoring continu requis. L'architecture actuelle ne scale pas pour usage intensif.

**"Validation humaine du draft est garantie par la séparation draft/inject"**
- Faux. `--inject` lit le draft et l'injecte automatiquement. L'humain peut lancer `--inject` sans avoir lu le draft — aucune vérification technique ne force la validation. La séparation est procédurale, pas technique.

---

## 8. Risques structurants

**Techniques**
- **Retry automatique non testé** : Si inject_error survient sur les 82 threads historiques, le comportement réel du retry (phase 2) est inconnu. Risque de boucle infinie, double injection, ou échec silencieux.
- **Rate-limit API Notion** : 82 threads en continu = centaines de requêtes API. Pas de throttling implémenté, pas de mesure du taux actuel. Risque de bannissement temporaire ou perte de données.
- **Durée d'exécution non maîtrisée** : ~93s par thread mesurés sur thread test vide. Threads riches (> 50 décisions) peuvent prendre 2-3 minutes. Risque de timeout réseau ou session LLM expirée.

**Stratégiques**
- **Illusion de maturité** : T25 + T26 donnent l'impression d'un système éprouvé. Réalité : 1 thread test ≠ validation production. Risque de lancer l'ingestion massive sans filet.
- **Dette technique masquée** : checkFolders() faux positif, retry non testé, pas de tests automatisés — la dette s'accumule sous l'apparence de stabilité. Risque d'effet domino si un composant casse.
- **Dépendance LLM non maîtrisée** : Génération CONTEXT repose sur LLM (actuellement OpenAI GPT-4.1-mini). Changement de modèle, drift, ou régression qualité = CONTEXT inutilisables. Aucun fallback ou validation automatique de cohérence.

**Faux pilotage**
- **THREAD_DUMP comme seule métrique** : extract_done/inject_done donnent une illusion de contrôle, mais ne mesurent ni qualité (CONTEXT exploitables ?), ni performance (temps réel, coût tokens), ni fiabilité (injections partielles ?).
- **Confiance aveugle dans os-thread-close** : Le script peut terminer avec succès et générer un CONTEXT incohérent ou incomplet — aucune validation sémantique automatique. Risque de découvrir les problèmes 10 threads plus tard.

---

## 9. Fichiers produits dans ce thread

**Aucun fichier fonctionnel produit.**

**Fichiers systèmes générés :**
- `CONTEXT_v13_draft.md` (ce document, avant injection) — statut : draft en cours de validation.

**Commits dans ce thread :**
- `94b11f3` : `chore: test remote Git` — validation connexion dépôt distant.

---

## 10. Priorité réelle de redémarrage

**1 action :** Corriger `checkFolders()` faux positif en v4 avec whitelist explicite `['threads_to_process', 'test_threads', 'data_cemetery']`.

**1 livrable :** `os-thread-close.mjs` v4 opérationnel avec sortie propre (aucun faux positif) et retry automatique testé en conditions réelles sur 1 thread avec inject_error simulé.

**1 critère de succès :** Exécuter `os-thread-close.mjs` v4 sur un thread test avec `inject_error: 1` artificiellement créé, vérifier que le retry fonctionne (inject_done passe à 1, inject_error retombe à 0), et confirmer aucun warning `checkFolders()` sur `test_threads/`.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé**
- README v05, PROMPT v05, VERSIONING_RULE.md : aucune modification sans justification technique majeure.
- Structure `data/` : threads_to_process / test_threads / data_cemetery — figée.
- Séparation draft/inject : obligatoire, non négociable.

**À clarifier**
- Comportement exact de `--inject` : lit-il `CONTEXT_vXX_draft.md` ou `CONTEXT_vXX.md` ? La documentation dit "valider le draft avant inject" mais le code renomme automatiquement pendant inject — contradiction à lever.

**À tester**
- Retry automatique (phase 2) en conditions réelles avec inject_error simulé.
- Pipeline sur thread métier riche (> 30 décisions, > 20 lessons) pour mesurer durée réelle et qualité du CONTEXT généré.

**À versionner**
- `os-thread-close.mjs` v4 : correction checkFolders() + validation retry.
- CONTEXT v14 : premier thread métier clôturé avec le nouveau pipeline, benchmark qualité.

---

## Point de redémarrage minimal

**Objectif :** Valider `os-thread-close.mjs` v4 avec correction checkFolders() et test retry automatique.

**Acquis :** Pipeline stable (extract/inject opérationnels), os-thread-close v3 fonctionnel mais avec faux positif cosmétique, documentation V3 complète et commise.

**Contraintes :** Aucune modification fonctionnelle sans test ré