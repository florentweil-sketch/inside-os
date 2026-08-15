# INSIDE_OS_CONTEXT_v15
Date : 2026-05-01

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T27-Notion-Dev-015

**Statut : Stable**
**Version : v15**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Thread clôturé sur décision humaine explicite (Florent). Objectifs atteints : audit alignement complet (repo/Notion/GitHub), batch 10 threads réels ingesté/extrait/injecté avec succès, bug écrasement statuts ingest corrigé (guard pré-ingest + préservation statuts done sur update), `.gitignore` mis à jour, REMOTE_OK.md supprimé, B09-T24/T25/T26 archivés dans data_cemetery, renommage PROMPT v02/v03 legacy, README v06 produit et déployé, PROMPT v07 en cours de production.

**Source du STOP :** Décision humaine explicite de Florent — "thread fini".

---

## 1. Intention réelle du thread

**Objectif réel :** Exécuter les priorités du CONTEXT v14 : renommer PROMPT/README v05→v06, documenter DS_ID, tester retry_count, supprimer REMOTE_OK.md. En cours de route : batch 10 threads réels, correction bug ingest, audit alignement complet.

**Problème concret :** Anomalie versionning PROMPT/README (nom v05 / contenu v06), DS_ID non documenté, retry_count non testé, 82 threads non injectés.

**Dérive empêchée :** Lancer le batch 10 sans corriger le bug d'écrasement des statuts dans ingest. Avancer sur agents/UI avant mémoire réelle injectée.

---

## 2. Acquis réels

**Audit alignement — propre**
- Repo local / GitHub à jour, branch main propre ✅
- B09-T24/T25/T26 récupérés depuis Git et archivés dans data_cemetery ✅
- threads_to_process/ vide, .gitignore mis à jour ✅
- REMOTE_OK.md supprimé (commit 129a7a6) ✅
- Renommage legacy PROMPT v02/v03 ✅

**Notion — statuts corrigés**
- B99-T99 : retry_count remis à 0 ✅
- B03-T03, B06-T07 : injection_status/extraction_status corrigés ✅

**Bug ingest — corrigé et en production**
- Cause : `buildThreadDumpProperties` écrasait `extraction_status` et `injection_status` à `pending` sur tout update, y compris pages déjà `done`.
- Fix Option B : `buildUpdateProperties` ne passe plus les statuts sur update — préservation des statuts done existants.
- Fix Option A : `guardCheckExistingDone()` — vérification Notion avant ingest, alerte + confirmation si threads déjà traités détectés.
- Commit : `f935702` ✅

**Batch 10 threads réels — validé**
- Threads : B01-T01, B01-T02, B02-T01, B02-T02, B03-T01, B03-T02, B04-T01, B05-T01, B06-T01, B07-T01
- ingest : 10/10 created ✅
- extract : 11/11 OK (+ B03-T03 thread test), inject_error: 0 ✅
- inject : 11/11 OK ✅
- Pipeline validé sur données réelles de production ✅

**ingest — mode batch/test interactif**
- Choix au démarrage : [1] Batch production → threads_to_process/ / [2] Test pipeline → test_threads/
- Commit : `f935702` ✅

**.gitignore mis à jour**
- `data/threads_to_process/` ajouté (commit `0668bae`) ✅

**Vision agents clarifiée et gravée**
- Objectif INSIDE OS reformulé : agents = collaborateurs exécutants permanents, pas juste conseillers.
- Périmètre d'action complet gravé : documents, tri/audit, emails, création logiciels/sites, com externe, conseil, rôle externe.
- Niveaux de confirmation définis : autonome / confirmation / validation Florent / jamais autonome.
- Rôles des trois documents système gravés dans README v07 et PROMPT v08 — règle fondamentale de non-redondance.
- README v07 produit, PROMPT v08 produit.

**Alias terminal**
- `ios` = `cd /Users/admin/inside-os` ajouté dans ~/.zshrc ✅

**GitHub token régénéré**
- Token expiré détecté et régénéré en cours de thread — push opérationnel ✅

---

## 3. Hypothèses, intentions, paris

- Les 10 threads batch injectés représentent une diversité suffisante pour valider le pipeline sur données réelles — non vérifié sur qualité d'extraction (décisions/lessons pertinentes).
- retry_count non testé en conditions réelles d'inject_error — comportement réel sur erreur persistante toujours inconnu.
- B07-T01 absent du premier run os:extract (skip silencieux) — cause non identifiée formellement.

---

## 4. Contraintes actives à respecter

**Techniques**
- DS_ID decisions_structural = `3b054e65-6195-4bfe-8411-53bafe98b64b` — documenté dans README v06 et .env.
- `retry_count` max 2, blocage BLOCKED au-delà, intervention manuelle requise.
- `queryDataSource()` uniquement — `queryDatabaseCompat` banni.
- raw_text mono-ligne jusqu'à V2.
- Notion MCP : opérations destructives = confirmation explicite requise.

**Versionning**
- README / PROMPT / CONTEXT indépendants — jamais couplés.
- CONTEXT vXX : bump systématique à chaque thread B09.
- **Règle processus bump version** : commiter le fichier système AVANT de le renommer. Utiliser `cp` (pas `mv`) pour créer la nouvelle version — l'ancienne reste en place.
- README actif : v06. PROMPT actif : v07 (produit ce thread). CONTEXT actif : v15.

**Organisationnelles**
- B09 exclu pipeline automatique.
- `test_threads/` : 4 fichiers max, test uniquement.
- `threads_to_process/` : non versionné dans Git.
- Pipeline ne doit jamais écrire directement depuis le chat.
- Agents = V3 — ne pas implémenter avant ingestion complète des 82 threads.

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement**
- Pipeline ingest/extract/inject stable — validé sur 10 threads réels de production.
- ingest : choix batch/test interactif, guard pré-ingest, préservation statuts done sur update.
- Notion MCP opérationnel — audit live, corrections statuts, modifications schéma.
- Remote Git GitHub opérationnel — push transparent.
- `retry_count` implémenté Notion + code (non testé en conditions réelles).
- `notion-memory-chat.mjs` sur Claude haiku-4-5 — dépendance OpenAI supprimée.
- `os-thread-close.mjs` v3 : clôture automatisée propre.
- Alias `ios` en terminal ✅

**Ce qui fonctionne en apparence**
- 10 threads batch injectés : extraction fonctionnelle techniquement, qualité décisions/lessons non auditée.
- retry_count : implémenté, jamais déclenché en conditions réelles.

**Ce qui reste fragile**
- 72 threads restants dans data_cemetery non injectés — mémoire réelle du groupe encore très partielle.
- B07-T01 skip silencieux au premier extract — cause non documentée.
- Delta 95 vs 113 décisions (incident decisions_structural) : non expliqué formellement.

**Ce qui manque**
- Test retry_count sur inject_error simulé propre (depuis retry_count=0).
- Audit qualité extraction sur batch 10 (décisions/lessons pertinentes ?).
- Ingestion des 72 threads restants.
- PROMPT v07 déployé et commité.

---

## 6. Contradictions et incohérences détectées

**Process bump version mal exécuté**
- `mv` utilisé au lieu de `cp` → v05 perdu sans historique Git.
- v05 n'était pas commité avant renommage — violation de la règle gravée ce thread.

**B07-T01 skip silencieux**
- Absent du premier run os:extract (10 candidats au lieu de 11).
- Extrait avec succès en --only B07-T01 — pas d'erreur visible.
- Cause inconnue : filtre Notion ? Timing ? Non documenté.

**retry_count testé sur mauvaise base**
- Test effectué sur B99-T99 qui avait déjà retry_count=1 — résultat non représentatif d'un test depuis 0.
- Test sur B03-T03 interrompu (thread déjà injecté par run précédent).

---

## 7. Illusions à démonter

**"Le batch 10 valide le pipeline"**
- Le pipeline tourne sans erreur technique. Ça ne dit rien sur la pertinence des décisions/lessons extraites. Qualité non auditée.

**"72 threads restants = bientôt fini"**
- Le batch 10 a pris un thread entier avec bugs à corriger en chemin. 72 threads = au moins 2-3 sessions, potentiellement plus si nouveaux bugs.

**"retry_count est testé"**
- Non. Deux tentatives ratées sur mauvaise base. Le comportement réel sur inject_error persistant reste inconnu.

---

## 8. Risques structurants

**Technique : B07-T01 skip silencieux**
- Cause inconnue — peut se reproduire sur n'importe quel thread des 72 restants sans alerte visible.
- Impact : threads silencieusement ignorés lors des runs batch.

**Technique : retry_count non éprouvé**
- Premier inject_error réel sur les 72 threads peut révéler bug logique.
- Impact : potentiellement critique sur ingestion complète.

**Stratégique : 72 threads non injectés**
- Mémoire réelle du groupe encore très partielle (10/82 threads).
- Chat/agents inutilisables métier jusqu'à ingestion complète.

**Process : règle bump version non encore éprouvée**
- Règle gravée ce thread mais jamais appliquée correctement — risque de répétition au prochain bump.

---

## 9. Fichiers produits dans ce thread

| Fichier | Rôle | Statut |
|---------|------|--------|
| `os/ingest/ingest-thread-dump.mjs` | Mode batch/test interactif + guard pré-ingest + préservation statuts done | En production — commit `f935702` |
| `docs/readme/README_INSIDE_OS_v07.md` | Vision agents élargie, rôles documents gravés, périmètre agents complet | À commiter |
| `docs/prompts transfert thread/PROMPT_MAITRE_v08_TRANSFERT_DE_THREAD.md` | Objectif reformulé, rôles documents, périmètre agents, niveaux confirmation | À commiter |
| `docs/context/INSIDE_OS_CONTEXT_v15.md` | Ce document | À commiter |
| `.gitignore` | Ajout `data/threads_to_process/` | En production — commit `0668bae` |

**Modifications Notion via MCP**
- B99-T99 : retry_count → 0
- B03-T03 : injection_status → done, retry_count → 0
- B06-T07 : extraction_status → done, injection_status → done

---

## 10. Priorité réelle de redémarrage

**Action prioritaire : tester retry_count proprement + continuer ingestion batch**

Séquence :
1. Déployer PROMPT v07 + CONTEXT v15 (commiter + pusher)
2. Test retry_count : mettre un thread à `injection_status=error`, `retry_count=0` → lancer os:inject → vérifier retry_count=1 → relancer → vérifier BLOCKED à 2
3. Investiguer B07-T01 skip silencieux — trouver la cause avant batch suivant
4. Batch 20 threads suivants depuis data_cemetery (si retry_count validé)

Critère de succès : retry_count monte 0→1→2→BLOCKED sans intervention, et le batch suivant tourne sans skip silencieux.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé**
- DS_ID decisions_structural = `3b054e65-6195-4bfe-8411-53bafe98b64b`
- retry_count max 2, blocage BLOCKED, intervention manuelle au-delà
- B09 exclu pipeline automatique
- raw_text mono-ligne jusqu'à V2
- Agents = V3 — ne pas implémenter avant ingestion complète
- Notion MCP destructif = confirmation explicite requise
- threads_to_process/ non versionné dans Git

**Règle bump version (NOUVELLE — gravée ce thread)**
- Toujours commiter le fichier système avant de le renommer
- Utiliser `cp` (pas `mv`) — l'ancienne version reste en place
- Vérifier `git log -- fichier` avant tout renommage

**À faire immédiatement**
- Commiter README v07 + PROMPT v08 + CONTEXT v15
- Tester retry_count depuis retry_count=0 proprement
- Investiguer B07-T01 skip silencieux

**À ne pas faire**
- Lancer batch suivant avant test retry_count validé
- Opérations destructives Notion sans confirmation
- Modifier PROMPT ou README sans bump de version et sans commit préalable

---

## Point de redémarrage minimal

- **Objectif** : test retry_count propre + investigation B07-T01 skip + batch 20 threads suivants
- **Acquis réels** : pipeline validé sur 10 threads réels, bug ingest corrigé, ingest batch/test interactif, README v06 déployé, DS_ID documenté, alias ios, GitHub token OK
- **Contraintes actives** : DS_ID `3b054e65-6195-4bfe-8411-53bafe98b64b`, retry max 2, B09 exclu pipeline, commiter avant renommer
- **État actuel** : 10/82 threads injectés, retry_count non testé proprement, B07-T01 skip cause inconnue, PROMPT v07 à commiter
- **Prochaine étape** : PROMPT v07 + CONTEXT v15 commités → test retry_count → investigation B07-T01 → batch 20
