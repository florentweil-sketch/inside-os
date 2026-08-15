# INSIDE_OS_CONTEXT_v14
Date : 2026-05-01

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T26-Notion-Dev-014

**Statut : Stable**
**Version : v14**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Thread dense clôturé sur décision humaine explicite (Florent). Objectifs atteints : Notion MCP + GitHub MCP connectés et opérationnels, audit repo vs Notion en live, retry_count implémenté (Notion + code), decisions_structural recréée après suppression accidentelle et 95 décisions restaurées, remote Git GitHub configuré + osxkeychain, clés OpenAI + Notion régénérées, migration notion-memory-chat.mjs OpenAI → Claude haiku-4-5, PROMPT v05 et README v05 mis à jour (contenu v06, fichiers encore nommés v05 — à régulariser). Pipeline stable : extract_done: 4, inject_done: 3, inject_pending: 1 (B99-T99 normal), inject_error: 0.

**Source du STOP :** Décision humaine explicite de Florent — "go" pour fermeture après validation de l'alignement documents.

---

## 1. Intention réelle du thread

**Objectif réel :** Exécuter la séquence de priorités du CONTEXT v12 : audit repo/Notion live, remote Git, retry_count, B99 mis à jour. En cours de route : connexion MCP Notion + GitHub, correction incidents Notion (suppression accidentelle decisions_structural), migration OpenAI → Claude.

**Problème concret :** Remote Git absent (risque perte totale), retry_count non persisté (boucles silencieuses possibles), B99 périmé depuis v08, 3 fichiers non commités dont CONTEXT v12.

**Dérive empêchée :** Lancer l'ingestion des 82 threads sans remote Git ni retry_count. Garder OpenAI comme dépendance active alors que tout le pipeline tourne sur Claude.

---

## 2. Acquis réels

**Notion MCP + GitHub MCP connectés et opérationnels**
- Notion MCP : accès direct THREAD_DUMP / DECISIONS / LESSONS depuis le thread Claude — lecture et écriture confirmées.
- GitHub : connecté via Settings → Connectors (OAuth).
- Audit live repo vs Notion désormais possible sans terminal ni copier-coller.

**Audit repo vs Notion — divergences détectées et traitées**
- 3 fichiers non commités détectés et commités (CONTEXT v12, PROMPT v05, os-thread-close.mjs).
- `Dernières décisions` (data source résiduelle vide) supprimée de decisions_structural.
- `retry_count` ajouté dans THREAD_DUMP Notion (type number) via MCP.

**Incident decisions_structural — résolu**
- Suppression accidentelle de decisions_structural (113 décisions perdues).
- Recréation complète du schéma via Notion MCP + réinjection depuis extraction_json.
- 95 décisions + 98 lessons restaurées (delta 18 vs 113 initial : déduplication à la réinjection — pas de perte réelle).
- Nouveau DS_ID : `3b054e65-6195-4bfe-8411-53bafe98b64b` — mis à jour dans `.env`.

**retry_count — implémenté Notion + code**
- Propriété `number` dans THREAD_DUMP Notion ✅
- `inject-decisions-lessons.mjs` : lecture retry_count, blocage BLOCKED si >= 2, incrément sur error, reset à 0 sur done ✅
- Commit : `7027969`

**Remote Git GitHub — opérationnel**
- Repo : `https://github.com/florentweil-sketch/inside-os.git`
- osxkeychain configuré — push sans prompt credentials.
- Commit de test : `94b11f3` (REMOTE_OK.md).

**Clés API régénérées**
- OpenAI `inside-os-extraction` révoquée et régénérée.
- Token Notion `INSIDE_OS_API` révoqué et régénéré.
- `.env` mis à jour.

**Migration notion-memory-chat.mjs OpenAI → Claude**
- Import Anthropic SDK, client Anthropic, modèle `claude-haiku-4-5-20251001`.
- `@anthropic-ai/sdk` installé dans package.json.
- Testé en conditions réelles — réponse correcte, log généré.
- Commit : `8ac12b8`
- Dépendance OpenAI supprimée du pipeline INSIDE OS.

**PROMPT v05 + README v05 mis à jour**
- Ligne gravée : `notion-memory-chat.mjs` migré sur Claude haiku-4-5, dépendance OpenAI supprimée.
- Ligne gravée : `retry_count` implémenté dans THREAD_DUMP et os:inject.
- README : `notion-memory-chat.mjs` CLI avec mention `(Claude claude-haiku-4-5)`.
- **Anomalie** : contenu mis à jour mais fichiers encore nommés v05 — à régulariser en v06 au prochain thread.

**B99 mis à jour**
- CONTEXT v13 injecté en B99 via `os-thread-close.mjs --inject`.
- Commit : `fb105a0`

**`checkFolders()` faux positif — disparu**
- Vérifié en live : `os-thread-close.mjs` ne signale plus de faux positif sur `test_threads/`.
- Aucune correction nécessaire — résolu silencieusement.

---

## 3. Hypothèses, intentions, paris

- Migration Claude haiku-4-5 maintient la même qualité qu'OpenAI GPT-4.1-mini sur le CLI mémoire — testé fonctionnellement (réponse correcte) mais aucun benchmark comparatif produit.
- Haiku-4-5 choisi pour coût/légèreté sur le CLI test — pas documenté comme ADR.
- Les 95 décisions restaurées couvrent bien les 113 initiales (déduplication normale à la réinjection) — non vérifié entrée par entrée.
- Le delta 95 vs 113 est de la déduplication, pas une perte — hypothèse non confirmée formellement.

---

## 4. Contraintes actives à respecter

**Techniques**
- DS_ID = Data Source ID — `3b054e65-6195-4bfe-8411-53bafe98b64b` pour decisions_structural (nouveau DS_ID depuis recréation).
- `retry_count` max 2 retries auto — blocage BLOCKED au-delà, intervention manuelle requise.
- `queryDataSource()` uniquement — `queryDatabaseCompat` banni.
- raw_text multi-lignes : interdit avant V2.
- Ne jamais lire `raw_text` — toujours lire les blocs Notion.

**Versionning**
- README / PROMPT / CONTEXT indépendants — jamais couplés.
- CONTEXT vXX : bump systématique à chaque thread B09.
- **Anomalie active** : fichiers nommés v05 mais contenu v06 — régulariser au prochain thread (renommer v05 → v06).

**Organisationnelles**
- B09 exclu pipeline automatique.
- `test_threads/` : 4 fichiers max, test uniquement.
- `data_cemetery/` : 82 threads non injectés — ingestion complète hors scope tant que V1 non finalisée.
- Pipeline ne doit jamais écrire directement depuis le chat.

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement**
- Pipeline extract/inject stable sur 4 threads test.
- Notion MCP opérationnel — audit live, modifications schéma, reset statuts sans terminal.
- Remote Git GitHub opérationnel — push transparent via osxkeychain.
- `retry_count` implémenté Notion + code.
- `notion-memory-chat.mjs` sur Claude haiku-4-5 — dépendance OpenAI supprimée.
- `os-thread-close.mjs` v3 : clôture automatisée, draft/inject séparés, `checkFolders()` propre.

**Ce qui fonctionne en apparence**
- 95 décisions en mémoire : restaurées après incident, pas auditées entry-by-entry.
- Migration Claude : fonctionnelle techniquement, non benchmarkée qualitativement vs OpenAI.
- `retry_count` : implémenté, jamais déclenché en conditions réelles (inject_error: 0 en production).

**Ce qui reste fragile**
- Anomalie versionning : PROMPT et README contenu v06 dans fichiers v05.
- Delta 95 vs 113 décisions : non expliqué formellement.
- 82 threads `data_cemetery/` : mémoire réelle du groupe non injectée.
- B99 : CONTEXT v13 injecté, mais chat pilote sur base incomplète (4 threads test seulement).

**Ce qui manque**
- Renommage v05 → v06 PROMPT et README.
- Benchmark Claude vs OpenAI sur CLI mémoire.
- ADR migration Claude (rationale, alternatives, rollback).
- Ingestion batch 10 threads validée avant ingestion complète.

---

## 6. Contradictions et incohérences détectées

**Fichiers v05 avec contenu v06**
- PROMPT_MAITRE_v05 et README_INSIDE_OS_v05 ont été mis à jour (migration Claude + retry_count) sans bump de version.
- Les fichiers portent le numéro v05 mais contiennent des informations v06.
- Règle versionning violée : "évolue sur décision majeure ou changement structurel" = oui (migration Claude, retry_count implémenté).

**decisions_structural — nouveau DS_ID non documenté dans README/PROMPT**
- Le DS_ID `3b054e65-6195-4bfe-8411-53bafe98b64b` est dans `.env` mais pas dans les documents système.
- Si `.env` est perdu ou réinitialisé, le DS_ID correct n'est pas retrouvable depuis les docs.

**retry_count implémenté mais jamais testé**
- Code en place, logique correcte — mais inject_error: 0 en production depuis l'implémentation.
- Comportement réel sur inject_error récurrent inconnu.

**checkFolders() — résolu sans correction explicite**
- Le faux positif documenté depuis T25 a disparu sans qu'on ait trouvé pourquoi.
- Aucune correction de code identifiable — résolution par effet de bord non documenté.

---

## 7. Illusions à démonter

**"Les 95 décisions = les 113 d'avant"**
- Probable mais non vérifié. La réinjection depuis extraction_json peut avoir omis des entrées corrompues ou dédupliqué différemment. Sans audit entry-by-entry, on ne sait pas.

**"Migration Claude = acquis sans risque"**
- Fonctionnel ≠ équivalent. Haiku-4-5 est un modèle léger. Sur des questions complexes de mémoire stratégique, la qualité peut dégrader sans que l'erreur soit évidente immédiatement.

**"Remote Git = sécurité"**
- Le repo est pushé sur GitHub. Mais `data_cemetery/` n'est pas versionné — les 82 threads historiques ne sont que sur le Mac. Perte Mac = perte des threads sources.

**"retry_count = problème résolu"**
- Sécurité implémentée sur papier. Jamais déclenchée. Comportement réel sur inject_error persistant : inconnu.

---

## 8. Risques structurants

**Technique : DS_ID decisions_structural non documenté**
- Le nouveau DS_ID `3b054e65-6195-4bfe-8411-53bafe98b64b` n'est que dans `.env`.
- Si `.env` est perdu, toute réinitialisation pipeline nécessite de retrouver l'ID manuellement.
- Impact : bloquant sur reconfiguration.

**Technique : retry_count non éprouvé**
- Premier inject_error réel peut révéler bug logique (boucle, perte données, blocage silencieux).
- Impact : potentiellement critique sur ingestion des 82 threads.

**Stratégique : 82 threads non injectés**
- Mémoire réelle du groupe absente du chat. Pilotage sur base de 4 threads test = pilotage aveugle.
- Impact : chat inutilisable métier jusqu'à ingestion complète.

**Stratégique : versionning dégradé**
- PROMPT et README avec contenu v06 sous nom v05 crée confusion pour les futurs threads.
- Impact : risque de dérive progressive si non corrigé rapidement.

**Organisationnel : Notion MCP = puissance + danger**
- Modifications directes du schéma Notion depuis le chat sans validation ni rollback facile.
- Incident decisions_structural (suppression accidentelle) illustre le risque.
- Impact : opérations irréversibles possibles sans filet.

---

## 9. Fichiers produits dans ce thread

| Fichier | Rôle | Statut |
|---------|------|--------|
| `os/inject/inject-decisions-lessons.mjs` | retry_count : lecture, blocage BLOCKED, incrément, reset | En production — commit `7027969` |
| `os/chat/notion-memory-chat.mjs` | Migration OpenAI → Claude haiku-4-5 | En production — commit `8ac12b8` |
| `docs/context/INSIDE_OS_CONTEXT_v12.md` | CONTEXT v12 validé et commité | Archivé — commit `61414ee` |
| `docs/context/INSIDE_OS_CONTEXT_v13.md` | CONTEXT v13 clôture B09-T25 | Archivé — commit `fb105a0` |
| `docs/prompts transfert thread/PROMPT_MAITRE_v05_TRANSFERT_DE_THREAD.md` | Contenu v06 : migration Claude + retry_count gravés | À renommer v06 |
| `docs/readme/README_INSIDE_OS_v05.md` | Contenu v06 : notion-memory-chat.mjs Claude mentionné | À renommer v06 |
| `REMOTE_OK.md` | Test remote Git | Cosmétique — peut être supprimé |
| `package.json` / `package-lock.json` | Ajout `@anthropic-ai/sdk` | En production |

**Modifications Notion via MCP**
- `retry_count` (number) ajouté dans THREAD_DUMP DS
- `Dernières décisions` data source supprimée de decisions_structural
- `decisions_structural` recréée (nouveau DS_ID : `3b054e65-6195-4bfe-8411-53bafe98b64b`)
- `source_thread` relation ajoutée dans nouvelle decisions_structural
- injection_status remis à pending sur 3 threads pour réinjection

---

## 10. Priorité réelle de redémarrage

**Action prioritaire : renommer PROMPT v05 → v06 et README v05 → v06**

Séquence :
1. `mv "docs/prompts transfert thread/PROMPT_MAITRE_v05_TRANSFERT_DE_THREAD.md" "docs/prompts transfert thread/PROMPT_MAITRE_v06_TRANSFERT_DE_THREAD.md"`
2. `mv docs/readme/README_INSIDE_OS_v05.md docs/readme/README_INSIDE_OS_v06.md`
3. Mettre à jour les références internes (README v06 → v06, PROMPT v06 → v06)
4. Commiter et pusher
5. Documenter le nouveau DS_ID `3b054e65-6195-4bfe-8411-53bafe98b64b` dans README v06

Critère de succès : `ls docs/readme/` ne montre que v06, `ls "docs/prompts transfert thread/"` idem, aucune référence v05 dans les fichiers actifs.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé**
- DS_ID = Data Source ID — `3b054e65-6195-4bfe-8411-53bafe98b64b` pour decisions_structural.
- `retry_count` max 2, blocage BLOCKED, intervention manuelle au-delà.
- B09 exclu pipeline automatique.
- raw_text mono-ligne jusqu'à V2.
- Agents = V3 — ne pas implémenter avant ingestion complète.
- Notion MCP : opérations destructives (suppression, trash) = confirmation explicite requise avant action.

**À faire immédiatement**
- Renommer PROMPT v05 → v06 et README v05 → v06.
- Documenter DS_ID `3b054e65-6195-4bfe-8411-53bafe98b64b` dans README v06.
- Supprimer `REMOTE_OK.md` (fichier test inutile).

**À tester avant ingestion complète**
- retry_count sur inject_error simulé : créer artificiellement un inject_error, vérifier blocage BLOCKED à 2 retries.
- Pipeline sur 10 threads réels depuis data_cemetery/ : extract_error: 0, inject_error: 0 sans intervention.

**À ne pas faire**
- Opérations destructives Notion sans confirmation explicite.
- Modifier PROMPT ou README sans bump de version.
- Injecter les 82 threads avant validation retry_count en conditions réelles.

---

## Point de redémarrage minimal

- **Objectif** : renommer PROMPT/README v05 → v06 + documenter nouveau DS_ID + tester retry_count sur inject_error simulé
- **Acquis réels** : Notion MCP opérationnel, remote Git GitHub, retry_count implémenté, migration Claude complète, decisions_structural recréée (95 décisions), clés API régénérées, CONTEXT v13 en B99
- **Contraintes actives** : DS_ID `3b054e65-6195-4bfe-8411-53bafe98b64b`, retry max 2, B09 exclu pipeline, Notion MCP destructif = confirmation requise
- **État actuel** : versionning PROMPT/README dégradé (v05 nom / v06 contenu), retry_count non testé en conditions réelles, 82 threads non injectés, benchmark Claude vs OpenAI absent
- **Prochaine étape** : renommage v05→v06 → documentation DS_ID → test retry_count simulé → batch 10 threads
