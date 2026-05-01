# INSIDE_OS_CONTEXT_v10
Date : 2026-05-01

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T24-DS-Rename-Protocol

**Statut : Stable**
**Version : v10**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Thread clôturé sur objectif atteint : validation complète du refactoring DS_ID sur pipeline réel. THREAD_DUMP montre 4 threads extract_done: 4 | inject_done: 4 | inject_error: 0. Tous les commits récents confirment l'application systématique du rename protocol. Aucun thread bloqué. Le système est prêt pour l'ingestion des 82 threads historiques.

**Raison de l'arrêt :** Validation réussie du refactoring nomenclature + pipeline stabilisé. Pause naturelle avant ingestion massive.

---

## 1. Intention réelle du thread

**Objectif :** Valider que le refactoring DB_ID → DS_ID tient sur un pipeline réel (extract + inject complet) sans régression.

**Problème concret :** Le v09 montrait inject_error: 1. Ce thread devait soit résoudre cette erreur, soit confirmer que le refactoring n'en est pas la cause.

**Dérive empêchée :** Ne pas lancer l'ingestion des 82 threads avec une nomenclature instable ou une erreur d'injection non diagnostiquée.

---

## 2. Acquis réels

**Pipeline validé**
- 4 threads test traités : extract_done: 4, inject_done: 4, inject_error: 0 (erreur résiduelle du v09 résolue ou non reproductible).
- Nomenclature DS_ID appliquée partout : code, config, docs, messages utilisateur.
- `queryDatabaseCompat()` supprimée définitivement du codebase.

**Refactoring commits**
- `07a1298` : application du rename dans code et docs.
- `215d8a1` : rename folders + os-thread-close v2.
- `55231a6` : suppression des fichiers de session terminal du repo.

**Git stable**
- Repository initialisé et opérationnel.
- `.gitignore` standard Node.js appliqué.
- Historique de commits propre et sémantique (chore/refactor).

**État Notion**
- DECISIONS : 113 entrées.
- LESSONS : 98 entrées.
- Relations source_thread fonctionnelles.

**Fichier modifié identifié**
- `data/test_threads/B09-T22-Notion-Dev-010.txt` : modification non documentée dans le thread dump. **Manque :** raison de la modification, contenu avant/après, impact sur inject_done.

---

## 3. Hypothèses, intentions, paris

**Pari :** Le refactoring DS_ID n'introduit aucune régression fonctionnelle sur le pipeline d'ingestion complet.

**Hypothèse non validée :** L'erreur inject_error: 1 du v09 était ponctuelle (race condition, timeout Notion, JSON malformé sur un thread spécifique). Le passage à inject_error: 0 dans ce thread ne prouve pas qu'elle ne reviendra pas sur les 82 threads historiques.

**Intention implicite :** Préparer le terrain pour une ingestion en série sans intervention manuelle. Reste à prouver : robustesse sur threads longs (>10k tokens), chunks multiples, et diversité de formats réels (pas seulement test_threads/).

**Paris organisationnel :** La discipline B09 (exclusion du pipeline auto + injection manuelle en B99) suffira à maintenir la cohérence du méta-système pendant l'ingestion massive.

---

## 4. Contraintes actives à respecter

**Protocole B09**
- B09 exclu définitivement du pipeline automatique (ingest, extract, inject).
- CONTEXT vXX injecté manuellement en B99 pour traçabilité.
- Aucun fichier B09 dans threads_to_process/ ou test_threads/.

**Nettoyage irréversible**
- `cleanText()` systématique à l'ingest : pas de rollback possible après nettoyage.
- test_threads/ limité à 4-5 fichiers max.
- data_cemetery/ = archive définitive, jamais retraité.

**Extraction LLM**
- max_tokens tentative 1 : 4 000 (courts), 8 000 (chunks longs).
- Retry progressif : `[4000, 6000, 8000, 10000]` avec prompt minimal dès tentative 2.
- Parser JSON robuste obligatoire : 3 stratégies en cascade (JSON direct → regex → fallback).

**Notion API**
- Relations = `getRelationId()` exclusivement.
- `source_thread` obligatoire dans DECISIONS et LESSONS.
- `raw_text` remplacé par résumé LLM (20 mots max), fallback texte brut tronqué.

**Git**
- Jamais commiter data_cemetery/ ni test_threads_clean/.
- Messages de commit sémantiques (feat/fix/refactor/chore).
- Pas de fichiers de session terminal (.txt de logs interactifs).

**Nomenclature verrouillée**
- DS_ID = Data Source ID (identifiant API Notion).
- Aucune autre interprétation tolérée (pas Decision System ID, pas Database ID).
- `DB_ID` banni du codebase.

---

## 5. Architecture actuelle

**Ce qui fonctionne**
- Pipeline extract → inject sur threads test (4/4 validés).
- API Notion unifiée : `lib/notion.mjs` avec nomenclature DS_ID cohérente.
- `scripts/clean-threads.mjs` : nettoyage caractères spéciaux validé.
- `scripts/ingest-thread.mjs` : ingest + création THREAD_DUMP opérationnels.
- `scripts/os-thread-extract.mjs` : extraction LLM avec retry progressif.
- `scripts/os-thread-inject.mjs` : injection DECISIONS/LESSONS dans Notion.
- Git repository initialisé, commits sémantiques appliqués.

**En apparence stable**
- Disparition de inject_error: 1 entre v09 et v10 sans explication formelle. Pas de log d'erreur analysé dans le thread dump.
- Modification de `B09-T22-Notion-Dev-010.txt` non documentée : contenu, raison, impact inconnus.

**Fragile**
- Pas de test sur threads >10k tokens en conditions réelles (seulement test_threads/ contrôlés).
- Pas de validation sur diversité de formats réels des 82 threads historiques.
- Retry automatique sur inject_error non implémenté (prévu mais absent : retry_count dans THREAD_DUMP).
- `notion-memory-chat.mjs` encore sur OpenAI GPT-4.1-mini, migration Claude prévue mais non faite.

**Manque**
- Logs structurés d'injection : pas de trace détaillée des échecs/succès par thread.
- Monitoring pipeline : pas de dashboard ou script de suivi de l'ingestion en série.
- Tests d'intégration automatisés : validation pipeline end-to-end sur threads variés.
- Documentation utilisateur : pas de guide d'utilisation pour lancer une ingestion complète.

---

## 6. Contradictions et incohérences détectées

**inject_error : 1 → 0 sans explication**
Le v09 indiquait inject_error: 1. Le v10 affiche inject_error: 0. Aucun commit, log ou modification de code documentée n'explique la résolution. Soit l'erreur était ponctuelle (timeout, race condition), soit elle est masquée par un retraitement silencieux. **Incohérence :** impossible de reproduire ou prévenir cette erreur sans diagnostic.

**Modification de B09-T22-Notion-Dev-010.txt**
Thread dump indique "Fichiers modifiés : data/test_threads/B09-T22-Notion-Dev-010.txt". **Contradiction :** B09 doit être exclu du pipeline automatique. Si ce fichier est dans test_threads/, il viole le protocole B09. Si modification manuelle, elle devrait être documentée. **Incohérence :** présence d'un B09 dans test_threads/ ou modification non tracée.

**DS_ID = Decision System ID dans v09, Data Source ID dans règles absolues**
Le v09 mentionne "DS_ID (Decision System ID)" dans la documentation Terminal 2.txt. Les règles absolues de ce prompt imposent "DS_ID = Data Source ID (identifiant API Notion)". **Contradiction :** nomenclature instable entre versions, risque de confusion.

**Roadmap : raw_text multi-lignes en V2, mais résumé LLM déjà actif**
Roadmap dit "raw_text multi-lignes : à implémenter en V2". Section 4 dit "`raw_text` remplacé par résumé LLM (20 mots max), fallback texte brut tronqué". **Incohérence :** V2 concerne le stockage multi-lignes ou le remplacement par résumé ? Si résumé déjà actif, raw_text n'est plus stocké tel quel.

---

## 7. Illusions à démonter

**"Le pipeline est stable parce que inject_error: 0"**
inject_error: 0 sur 4 threads test ne prouve rien sur 82 threads historiques variés. L'erreur du v09 a disparu sans diagnostic : elle peut revenir. **Illusion :** 4 threads test = validation suffisante.

**"Le refactoring DS_ID est complet"**
Le refactoring touche code, config, docs. Mais : (1) DS_ID a 2 définitions contradictoires (Decision System vs Data Source), (2) aucun test automatisé ne valide l'absence de `DB_ID` résiduel dans les prompts LLM ou messages utilisateur. **Illusion :** grep + commits = preuve de complétude.

**"B09 est exclu du pipeline"**
`B09-T22-Notion-Dev-010.txt` figure dans test_threads/ et a été modifié. Soit le protocole B09 est violé, soit ce fichier ne devrait pas être là. **Illusion :** discipline déclarative = discipline appliquée.

**"Git initialisé = historique protégé"**
Git est initialisé, mais pas de stratégie de backup externe, pas de remote configuré, pas de tag sur versions stables. **Illusion :** .git/ local = sécurité des données.

**"Prêt pour ingestion des 82 threads"**
Pipeline validé sur 4 threads contrôlés, retry automatique non implémenté, monitoring absent, logs non structurés. **Illusion :** extract + inject fonctionnent = industrialisation prête.

---

## 8. Risques structurants

**Technique : Erreur d'injection non diagnostiquée**
inject_error: 1 → 0 sans explication = erreur non comprise, donc non prévenue. Sur 82 threads, elle peut revenir de manière intermittente (timeout API, payload trop gros, relation manquante). **Impact :** blocage silencieux de l'ingestion, perte de données, debugging manuel coûteux.

**Technique : Pas de retry automatique sur inject_error**
retry_count prévu dans THREAD_DUMP mais non implémenté. Une erreur d'injection nécessite intervention manuelle. Sur 82 threads, c'est ingérable. **Impact :** ingestion interrompue, threads perdus dans l'état inject_pending ou inject_error.

**Stratégique : Nomenclature DS_ID instable**
2 définitions contradictoires (Decision System vs Data Source). Si les prompts LLM, docs utilisateurs ou commentaires code mélangent les deux, la cohérence se dégrade. **Impact :** confusion dans les décisions, perte de sens du refactoring, bugs liés à l'interprétation erronée de DS_ID.

**Organisationnel : Violation du protocole B09**
`B09-T22-Notion-Dev-010.txt` dans test_threads/ viole la règle "B09 exclu du pipeline automatique". Si ce fichier est traité par extract/inject, il pollue les données ou crée des doublons. **Impact :** incohérence du méta-système, perte de traçabilité des CONTEXT vXX.

**Faux pilotage : THREAD_DUMP comme métrique de succès**
extract_done: 4, inject_done: 4 ne dit rien sur la qualité des données injectées (DECISIONS/LESSONS pertinentes, relations correctes, résumés utilisables). **Impact :** illusion de progression sans validation de la valeur produite.

**Stratégique : Pas de backup externe**
Git local sans remote configuré. Perte machine = perte de tout l'historique. **Impact :** catastrophe irréversible sur incident hardware.

**Technique : Dérive du raw_text**
Résumé LLM remplace raw_text. Si LLM hallucine ou perd du contexte, pas de retour possible au texte brut après nettoyage. **Impact :** perte d'information irréversible, décisions basées sur résumés erronés.

---

## 9. Fichiers produits dans ce thread

**Aucun fichier nouveau identifié dans le thread dump.**

**Fichier modifié :**
- `data/test_threads/B09-T22-Notion-Dev-010.txt` — **Statut :** Modification non documentée. **Manque :** contenu avant/après, raison de la modification, impact sur inject_done.

**Commits produits (inférés) :**
- `07a1298` : refactor: apply folder renames in code and docs — **Statut :** Intégré au codebase.
- `215d8a1` : refactor: rename folders, os-thread-close v2 — **Statut :** Intégré au codebase.
- `55231a6` : chore: remove terminal session files from repo — **Statut :** Intégré au codebase.

---

## 10. Priorité réelle de redémarrage

**1 action :** Diagnostiquer et documenter la résolution de inject_error: 1 → 0 entre v09 et v10.

**1 livrable :** Log structuré ou post-mortem expliquant : thread concerné, erreur exacte (stack trace, API response), cause (timeout/payload/relation manquante), action corrective appliquée, test de non-régression.

**1 critère de succès :** Capacité à reproduire ou prévenir l'erreur inject_error sur un thread test en forçant les conditions d'échec (timeout simulé, payload volontairement trop gros, relation manquante).

---

## 11. Discipline pour le prochain thread

**Socle verrouillé**
- DS_ID = Data Source ID (identifiant API Notion) — aucune autre interprétation.
- B09 strictement exclu de test_threads/ et threads_to_process/.
- inject_error: 0 ne suffit pas : exiger logs détaillés par thread injecté.

**À clarifier**
- Statut et raison de la modification de `B