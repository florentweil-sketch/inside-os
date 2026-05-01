# INSIDE_OS_CONTEXT_v10
Date : 2026-05-01

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T24-DS-Rename-Protocol-Tooling

**Statut : Stable**
**Version : v10**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Thread clôturé sur objectif atteint : refactoring DS_ID complet + protocole de clôture de thread opérationnel. Pipeline propre : extract_done: 4, inject_done: 4, inject_error: 0. Git actif avec historique sémantique. Script `os-thread-close.mjs` v2 testé et validé. Ce document permet le redémarrage sans relire l'ancien thread.

**Source du STOP :** seuil objectif — protocole de clôture validé, pipeline propre, documentation alignée.

---

## 1. Intention réelle du thread

**Objectif réel :** Régler définitivement la confusion database_id / data_source_id qui revenait depuis le début du projet, et mettre en place un protocole automatisé de clôture de thread pour ne plus perdre de temps à chaque transfert.

**Problème concret :** Le codebase utilisait `queryDatabaseCompat` comme patch silencieux sur une confusion de nomenclature. Les variables s'appelaient `_DB_ID` mais contenaient des data source IDs. Chaque nouveau thread risquait de réintroduire la confusion. Parallèlement, les transferts de thread étaient manuels, lents, et sujets à oubli.

**Dérive empêchée :** Lancer l'ingestion des 82 threads avec une nomenclature instable et sans protocole de clôture fiable.

---

## 2. Acquis réels (validés, utilisables, non spéculatifs)

**Refactoring DS_ID — définitif**
- `THREAD_DUMP_DB_ID` → `THREAD_DUMP_DS_ID`, `DECISIONS_DB_ID` → `DECISIONS_DS_ID`, `LESSONS_DB_ID` → `LESSONS_DS_ID` dans tout le codebase.
- `queryDatabaseCompat()` supprimée de `os/lib/notion.mjs` — remplacée par `queryDataSource()` directement.
- `getDatabase()` et `resolveFirstDataSourceId()` supprimées — inutilisées en production, source de confusion.
- DS_ID = Data Source ID (identifiant API Notion) — définition gravée et verrouillée.
- 99 occurrences patchées en une passe via `patch-ds-rename.mjs`.

**Structure dossiers data/ — clarifiée**
- `data/threads_to_process/` : créé — zone de dépôt des threads exportés en attente d'ingest.
- `data/test_threads/` : renommé depuis `historical_threads/` — 4 fichiers max, test uniquement.
- `data/data_cemetery/` : inchangé — archive permanente, 82 threads.
- `data/_backup_threads/`, `data/dumps_archived/`, `data/dumps_test/` : supprimés (vides ou doublons).

**Git — initialisé et opérationnel**
- Repository initialisé avec `.gitignore` standard Node.js.
- Historique de commits propre : `refactor/chore/feat` sémantiques.
- `docs/Terminal/` exclu du repo et déplacé vers `/Users/admin/terminal-sessions/`.

**Protocole de clôture de thread — `os-thread-close.mjs` v2**
- Phase 1 : backup versionné automatique (10 derniers conservés).
- Phase 2 : retry automatique inject_error (max 2, alerte si bloqué).
- Phase 3 : snapshot Notion live (statuts pipeline, comptages).
- Phase 4 : audit alignement (env, dossiers, divergences).
- Phase 5 : git diff filtré (exclut docs/Terminal/).
- Phase 6 : lecture du contenu du thread si disponible dans threads_to_process/ ou data_cemetery/.
- Phase 7 : draft CONTEXT vXX généré par Claude (toutes sections remplies).
- Phase 8 : détection README/PROMPT bump avec draft de section.
- Phase 9 : injection B99 sur `--inject`.
- Durée mesurée : ~90 secondes.

**Pipeline — état validé**
- 4 threads test traités de bout en bout : extract_done: 4, inject_done: 4, inject_error: 0.
- 113 décisions en mémoire, 98 lessons en mémoire.
- `source_thread` bidirectionnel confirmé fonctionnel (relation Notion DECISIONS/LESSONS → THREAD_DUMP).

**Règles de versionning — gravées**
- README vXX : évolue sur décision majeure ou changement d'architecture.
- PROMPT vXX : évolue quand un gap inter-thread révèle un angle mort ou dérive.
- CONTEXT vXX : évolue à chaque thread B09 — automatique.
- Les trois numéros sont indépendants.

---

## 3. Hypothèses, intentions, paris

- Le retry automatique inject_error (max 2) couvrira les cas Notion 504/timeout sans intervention manuelle — non prouvé à grande échelle.
- Le draft CONTEXT généré par le LLM sans contenu du thread (inférence depuis données système) est suffisamment utile pour accélérer la clôture — à valider sur les prochains threads.
- La structure `threads_to_process/` → `test_threads/` → `data_cemetery/` tiendra sans ambiguïté sur les 82 threads à ingérer.
- `notion-memory-chat.mjs` peut rester sur OpenAI GPT-4.1-mini pendant l'ingestion complète — migration Claude non bloquante.

---

## 4. Contraintes actives à respecter

**Nomenclature verrouillée**
- DS_ID = Data Source ID (identifiant API Notion) — aucune autre interprétation tolérée.
- `DB_ID` banni du codebase — tout nouveau script doit utiliser `DS_ID`.
- `queryDataSource()` uniquement — jamais `queryDatabaseCompat()`.

**Protocole B09**
- B09 strictement exclu de `threads_to_process/` et `test_threads/`.
- Thread B09 terminé → `os-thread-close.mjs` → CONTEXT vXX → injection manuelle en B99.
- Thread B09 brut → `data_cemetery/` uniquement.

**Structure dossiers**
- `data/threads_to_process/` = dépôt threads à ingérer — vidé après ingest.
- `data/test_threads/` = 4 fichiers max, jamais de vrais threads de production.
- `data/data_cemetery/` = archive permanente après injection, n'en ressortent jamais.

**Pipeline**
- Ne jamais lire `raw_text` pour l'extraction — toujours lire les blocs Notion.
- `RETRY_TOKEN_STEPS = [4000, 6000, 8000, 10000]` — seule variable à modifier pour le retry.
- Parser JSON 3 stratégies en cascade obligatoire.
- Pagination Notion obligatoire — limite 100 résultats par requête.

**Git**
- Jamais commiter `data/data_cemetery/`, `data/test_threads_clean/`, `runtime/out/`.
- Messages de commit sémantiques : feat/fix/refactor/chore.
- Backup tar.gz automatique via `os-thread-close.mjs` — pas de backup manuel.

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement**
- Pipeline `os:ingest` → `os:extract` → `os:inject` de bout en bout sur 4 threads test.
- `os/lib/notion.mjs` : API Notion unifiée, nomenclature DS_ID cohérente, fonctions obsolètes supprimées.
- `os/ingest/ingest-thread-dump.mjs` : ingest + cleanText() + résumé LLM + protocole B09.
- `os/extract/extract-thread-dump.mjs` : parser JSON robuste, retry progressif 4 paliers.
- `os/inject/inject-decisions-lessons.mjs` : injection DECISIONS + LESSONS, source_thread relation.
- `os-thread-close.mjs` v2 : protocole de clôture automatisé, testé sur ce thread.
- Backup automatique versionné (10 derniers conservés).

**Ce qui fonctionne seulement en apparence**
- `notion-memory-chat.mjs` utilise OpenAI GPT-4.1-mini — deux LLMs différents selon le mode d'accès (CLI vs serveur HTTP Claude).
- `os-thread-close.mjs` sans fichier de thread disponible : sections subjectives du CONTEXT basées sur inférence, pas sur le contenu réel.

**Ce qui reste fragile**
- Ingestion complète non validée — testé sur 4 threads uniquement.
- Retry automatique inject_error non implémenté dans le pipeline (prévu dans `os-thread-close.mjs` uniquement, pas dans `os:inject`).
- Propriété `retry_count` non encore créée dans THREAD_DUMP Notion.
- Serveur HTTP local — s'arrête si le Mac dort.
- B99 périmé — dernière mise à jour avril 2026.

**Ce qui manque pour parler d'un système robuste**
- Ingestion des 82 threads de `data_cemetery/` validée.
- `retry_count` dans THREAD_DUMP + retry automatique dans `os:inject`.
- Déploiement cloud permanent.
- B99 remis à jour avec le contexte actuel.
- Remote Git configuré (backup externe).

---

## 6. Contradictions et incohérences détectées

**inject_error: 1 → 0 entre v09 et v10 sans explication documentée**
Le v09 indiquait inject_error: 1. Ce thread a corrigé B09-T23 manuellement (remis en pending + relance). L'erreur était un 504 Notion sur gros volume. Résolu mais non prévenu : le même problème peut revenir sur les 82 threads. Pas de mécanisme de retry dans `os:inject` actuellement.

**`notion-memory-chat.mjs` encore sur OpenAI**
Le serveur HTTP utilise Claude, le CLI utilise OpenAI GPT-4.1-mini. Deux LLMs pour la même fonction selon le mode d'accès. Décision de migration reportée mais non datée.

**README v04 non mis à jour**
Le README mentionne encore `historical_threads/` et ne documente pas `threads_to_process/`. README bump v05 détecté comme nécessaire — non encore produit.

---

## 7. Illusions à démonter

**"Le pipeline est prêt pour l'ingestion complète"**
4 threads test validés ≠ 82 threads historiques variés. Formats inconnus, longueurs variables, threads potentiellement corrompus. Le retry automatique n'est pas encore dans `os:inject`. Une erreur sur 82 threads nécessite encore une intervention manuelle.

**"Le protocole de clôture est complet"**
`os-thread-close.mjs` fonctionne mais sans le fichier du thread, les sections subjectives du CONTEXT sont des inférences LLM. La qualité du CONTEXT dépend de l'export du thread — étape manuelle non automatisable.

**"Git = sécurité"**
Repository local sans remote configuré. Perte du Mac = perte de tout l'historique git. Le backup tar.gz est là mais il ne remplace pas un remote.

**"DS_ID est réglé"**
Le renommage est fait dans le code. Mais les prompts LLM, commentaires inline et messages utilisateur peuvent encore introduire des interprétations erronées. Aucun test automatisé ne vérifie l'absence de `DB_ID` résiduel.

---

## 8. Risques structurants

**Technique : inject_error non prévenu**
Le mécanisme de retry est dans `os-thread-close.mjs` mais pas dans `os:inject`. Sur 82 threads, une erreur 504 Notion bloque silencieusement sans retry automatique. Impact : intervention manuelle requise à chaque erreur.

**Technique : pas de remote Git**
Repository local uniquement. Incident hardware = perte totale. Impact : catastrophique et irréversible.

**Stratégique : B99 périmé**
Mémoire vivante non mise à jour depuis le v08. Le chat répond sur une base incomplète et désynchronisée du présent réel. Impact : réponses déconnectées de l'état actuel du projet.

**Stratégique : ingestion incomplète**
113 décisions et 98 lessons sur 4 threads test. Les 82 threads de data_cemetery/ contiennent la mémoire réelle du groupe. Sans ingestion, le copilote ne pilote rien. Impact : système fonctionnel mais inutile en production.

**Organisationnel : faux positif audit dossiers**
`os-thread-close.mjs` signale `data/test_threads/` comme "ancien dossier à supprimer" — bug dans `checkFolders()`. À corriger dans la prochaine version du script.

---

## 9. Fichiers produits dans ce thread

| Fichier | Rôle | Statut |
|---------|------|--------|
| `os-thread-close.mjs` v2 | Protocole de clôture automatisé (backup + snapshot + audit + draft CONTEXT + injection B99) | En production |
| `patch-ds-rename.mjs` | Patch renommage DB_ID → DS_ID sur 99 occurrences | Utilisé, archivable |
| `patch-rename-folders.mjs` | Patch renommage historical_threads → test_threads dans code et docs | Utilisé, archivable |
| `os/lib/notion.mjs` | Refactorisé : DS_ID unifié, fonctions obsolètes supprimées | En production |
| `os/lib/config.mjs` | Mis à jour : variables DS_ID, commentaire explicatif | En production |
| `snapshot.mjs` | Snapshot Notion live (diagnostic) | Utilitaire, garder |
| `docs/context/INSIDE_OS_CONTEXT_v09.md` | Context précédent | Archivé |
| `docs/context/INSIDE_OS_CONTEXT_v10.md` | Ce document | En production |
| `VERSIONING_RULE.md` | Règle de versionning README/PROMPT/CONTEXT gravée | Référence |

---

## 10. Priorité réelle de redémarrage

**Action prioritaire : README v05 + retry_count THREAD_DUMP + ingestion batch 10 threads**

Séquence exacte :
1. Produire README v05 (documenter threads_to_process/, test_threads/, data_cemetery/, os-thread-close.mjs, roadmap DS_ID)
2. Ajouter propriété `retry_count` dans THREAD_DUMP Notion + implémenter retry automatique dans `os:inject`
3. Corriger faux positif `checkFolders()` dans `os-thread-close.mjs`
4. Configurer remote Git (GitHub ou équivalent)
5. Déplacer 10 threads de `data_cemetery/` vers `threads_to_process/`, lancer `os:ingest && os:extract && os:inject`
6. Valider : extract_error: 0, inject_error: 0 sur ce batch
7. Répéter jusqu'à épuisement des 82 threads
8. Mettre à jour B99 avec ce CONTEXT v10

Pourquoi dans cet ordre : README v05 et retry automatique doivent être en place avant l'ingestion massive. Sans retry, chaque erreur est manuelle. Sans README à jour, le prochain contributeur (ou Claude Code) ne comprend pas la structure.

Critère de succès : lancer `os:ingest && os:extract && os:inject` sur 10 threads réels de data_cemetery/ et obtenir extract_error: 0, inject_error: 0 sans intervention manuelle.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé**
- DS_ID = Data Source ID — définition unique, non négociable
- `queryDataSource()` uniquement dans tout nouveau code
- Structure data/ : threads_to_process / test_threads / data_cemetery
- Protocole B09 : exclu pipeline, CONTEXT en B99
- `os-thread-close.mjs` obligatoire en fin de thread B09
- raw_text multi-lignes : reporter à V2 (moteur recherche sémantique) — ne pas toucher avant

**À faire immédiatement**
- README v05 : documenter architecture actuelle complète
- `retry_count` dans THREAD_DUMP + retry dans `os:inject`
- Corriger `checkFolders()` dans `os-thread-close.mjs` (faux positif test_threads)
- Configurer remote Git

**À tester avant ingestion complète**
- Batch de 10 threads depuis data_cemetery/ : extract_error: 0, inject_error: 0 sans intervention
- Comportement sur threads longs (>100k chars) et formats variés

**À versionner**
- Ce CONTEXT v10 → injecter en B99
- README v05 : produire en début de prochain thread

---

## Point de redémarrage minimal

- **Objectif** : README v05 + retry automatique inject + ingestion 82 threads + B99 à jour
- **Acquis réels** : DS_ID unifié, pipeline 4/4 propre, os-thread-close v2 opérationnel, git actif, 113 décisions / 98 lessons
- **Contraintes actives** : DS_ID = Data Source ID, B09 exclu pipeline, test_threads 4 max, data_cemetery permanente, raw_text multi-lignes = V2
- **État actuel** : pipeline propre, ingestion complète non faite, B99 périmé, pas de remote git, retry inject non implémenté
- **Prochaine étape** : README v05 → retry_count → batch 10 threads → ingestion complète → B99 → remote git
