# INSIDE_OS_CONTEXT_v12
Date : 2026-05-01

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T25-Notion-Dev-013

**Statut : Stable**
**Version : v12**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Thread clôturé sur objectif atteint. `os-thread-close.mjs` v3 opérationnel (draft/inject séparés), règles de versionning gravées, README v05 et PROMPT v05 produits et commités, liste complète des agents validée. Pipeline propre : extract_done: 4, inject_done: 4, inject_error: 0. Ce document permet le redémarrage sans relire T24 et T25.

**Source du STOP :** seuil objectif — tous les livrables produits, testés, commités.

---

## 1. Intention réelle du thread

**Objectif réel :** Automatiser la clôture de thread (protocole fiable, reproductible), graver les règles de versionning définitives, et poser la vision long terme d'INSIDE OS (agents pôle, L'Associé) dans les documents de référence.

**Problème concret :** Chaque clôture était manuelle — backup, vérification pipeline, rédaction CONTEXT, détection bumps, injection B99 — tout à la main, risque d'oubli à chaque étape. Les règles de versionning existaient en discussion mais n'étaient pas formalisées. La vision agents était éparpillée dans les threads.

**Dérive empêchée :** Ingestion complète des 82 threads sans audit préalable. Hypothèse fausse "README et PROMPT évoluent toujours ensemble" (invalidée — numéros indépendants confirmés). Fichiers auto-générés non validés dans le dépôt (CONTEXT v12/v13 supprimés).

---

## 2. Acquis réels

**`os-thread-close.mjs` v3 — opérationnel**
- 9 phases automatisées : backup → retry inject_error → snapshot Notion → audit alignement → git diff → lecture thread → draft CONTEXT (suffixe `_draft`) → détection bumps → injection B99 sur `--inject`.
- Séparation draft/inject : le script génère `CONTEXT_vXX_draft.md`, jamais une version définitive sans validation humaine. Le `--inject` lit le draft, l'injecte en B99, le renomme en `CONTEXT_vXX.md`.
- Testé en conditions réelles : ~93 secondes, draft CONTEXT v12 généré avec contenu réel du thread.
- Faux positif `checkFolders()` identifié : `test_threads` signalé à tort — à corriger en v4.

**Règles de versionning — gravées**
- README vXX : évolue sur décision majeure ou changement stratégique.
- PROMPT vXX : évolue quand un gap inter-thread révèle un angle mort ou dérive.
- CONTEXT vXX : évolue à chaque thread B09 — systématiquement.
- Les trois numéros sont indépendants — jamais couplés par symétrie.
- Fichier de référence : `VERSIONING_RULE.md` à la racine.

**README v05 — commité**
- Section "Ce qu'est INSIDE OS" — objectif clair.
- Parcours complet d'un thread (export → archive).
- `os-thread-close.mjs` documenté.
- Structure `data/` actuelle : threads_to_process / test_threads / data_cemetery.
- Vision agents V3 documentée.
- Roadmap V1 → V4 restructurée.

**PROMPT v05 — commité**
- DS_ID = Data Source ID gravé.
- Règles de versionning intégrées.
- Vision agents documentée.
- Règles de rédaction CONTEXT enrichies (aucune section vide, DS_ID correct, ignorer fichiers terminal).

**Liste complète des agents — validée**

Agents groupe F&A CAPITAL :

| Agent | Domaine | Bucket |
|-------|---------|--------|
| Agent Juridique Opérationnel | Contentieux, contrats chantiers, litiges clients | B06 |
| Agent Juridique Corporate | Structure groupe, SCI, holding, pactes | B06 |
| Agent Financier | Trésorerie, cash flow, investissements, arbitrages capital | B03 |
| Agent Fiscal | Optimisation, TVA, IS, structuration, déclarations | B06 |
| Agent Bâtiment & MOE | Maîtrise d'œuvre, techniques, normes, process rénovation | B02 |
| Agent Chantiers Terrain | Suivi opérationnel, sous-traitants, planning, réception | B07 |
| Agent Menuiserie | Atelier de la Colombe, fabrication, devis, production | B02 |
| Agent RH & Social | Organisation, équipes, contrats, paie, conflits | B01 |
| Agent Marketing & Com | Positionnement, image, contenus, réseaux, prospection | B05 |
| Agent Stratégie Groupe | Vision, arbitrages majeurs, allocations, développement | B03 |
| Agent Elior | Projet corporate spécifique, relation grand compte | B04 |
| Agent Fournisseurs | Prestataires, négociations, évaluation, référencement | B02/B07 |
| Agent Clients | Historique relationnel, suivi projets, satisfaction | B02 |
| Agent Infrastructure & Tech | Outils internes, automatisation, systèmes, INSIDE OS | B08/B09 |

Agents personnels Florent :

| Agent | Domaine | Bucket / Tags |
|-------|---------|---------------|
| Agent Développement Personnel | Construction, objectifs, apprentissages, évolution | B01 — tag: développement_personnel |
| Agent Santé | Suivi médical, habitudes, énergie, bien-être physique | B01 — tag: santé |
| Agent Vie Privée | Famille, relations, projets personnels | B01 — tag: vie_privée |
| Agent Patrimoine | Immobilier perso, placements, retraite, transmission | B01/B03 — tag: patrimoine_perso |

Super-agents transversaux :

| Agent | Domaine |
|-------|---------|
| L'Associé | Copilote décisionnel global — accès mémoire complète, permanent, peut être en désaccord |
| Agent Synthèse | Croise plusieurs domaines pour une vue consolidée |

**Décisions architecture agents — gravées**
- Chaque agent accède à toute la mémoire (DECISIONS + LESSONS) — pas de silo par bucket.
- Chaque agent contextualise sa réponse dans son domaine de spécialité.
- Deep probing : les agents peuvent s'interroger entre eux.
- B01 reste un seul bucket — les agents personnels filtrent par tags (`santé`, `développement_personnel`, `vie_privée`, `patrimoine_perso`, `famille`) plutôt que sous-buckets. Raison : un thread peut appartenir à plusieurs domaines simultanément, les tags sont plus flexibles.
- L'Associé = agent permanent accessible en permanence — pas un mode ponctuel. Prompt système fixe définissant son caractère, ses positions, ses désaccords habituels. Alimenté par toute la mémoire stratégique.

**Pipeline — état validé**
- 4 threads traités : extract_done: 4, inject_done: 4, inject_error: 0.
- 113 DECISIONS, 98 LESSONS en mémoire.
- `source_thread` bidirectionnel fonctionnel.

**Git — actif**
- Historique sémantique propre, commits refactor/chore/docs/fix.
- Remote non configuré — à faire.

---

## 3. Hypothèses, intentions, paris

- `os-thread-close.mjs` va réellement accélérer les transferts — testé une fois, pas encore prouvé sur 10+ threads.
- La vision agents (V3) est réalisable sans déconstruire l'architecture V1 — pari architectural non testé.
- L'Associé comme agent permanent est faisable avec l'architecture actuelle — dépend du volume de mémoire et qualité du retrieval, non prouvé.
- Tags sur B01 suffisent pour les agents personnels sans créer de sous-buckets — cohérent architecturalement, non encore testé en production.
- `notion-memory-chat.mjs` peut rester sur OpenAI pendant la phase d'ingestion — migration Claude non bloquante à court terme.

---

## 4. Contraintes actives à respecter

**Nomenclature**
- DS_ID = Data Source ID (identifiant API Notion) — aucune autre interprétation.
- `queryDataSource()` uniquement — `queryDatabaseCompat` banni.

**Protocole B09**
- B09 exclu pipeline automatique — CONTEXT vXX en B99 uniquement.
- `os-thread-close.mjs` obligatoire en fin de chaque thread B09.
- Aucun fichier auto-généré non validé dans le dépôt.

**Structure data/**
- `threads_to_process/` → `test_threads/` (4 max) → `data_cemetery/` (permanent).
- Jamais de thread B09 dans `threads_to_process/` ou `test_threads/`.

**Pipeline**
- Ne jamais lire `raw_text` — toujours lire les blocs Notion.
- `RETRY_TOKEN_STEPS = [4000, 6000, 8000, 10000]` — seule variable retry extract.
- Parser JSON 3 stratégies en cascade.
- retry_count max 2 sur inject_error — au-delà, intervention manuelle.

**Versionning**
- README / PROMPT / CONTEXT indépendants — `VERSIONING_RULE.md`.
- `CONTEXT_vXX_draft.md` = non validé. `CONTEXT_vXX.md` = validé par Florent.

**Agents**
- Ne pas implémenter avant que V1 (ingestion complète 82 threads) soit finalisée.
- raw_text multi-lignes = V2 — ne pas toucher avant.

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement**
- Pipeline ingest → extract → inject sur 4 threads test.
- `os-thread-close.mjs` v3 : protocole clôture automatisé, draft/inject séparés.
- `os/lib/notion.mjs` : API Notion unifiée, DS_ID cohérent, fonctions obsolètes supprimées.
- Git actif, historique propre.
- README v05 et PROMPT v05 à jour avec vision complète.

**Ce qui fonctionne en apparence**
- Chat local : répond, mais 113 DECISIONS sur 4 threads = base inutilisable métier.
- Retry inject_error dans `os-thread-close.mjs` : fonctionne mais `retry_count` non persisté en base — compteur perdu si redémarrage.
- Détection bumps README/PROMPT : fonctionne sur git diff mais peut produire des faux positifs si le LLM manque de contexte.

**Ce qui reste fragile**
- Ingestion complète non réalisée — 82 threads dans `data_cemetery/`.
- `retry_count` non implémenté dans THREAD_DUMP Notion.
- Faux positif `checkFolders()` dans `os-thread-close.mjs`.
- Remote Git non configuré.
- `notion-memory-chat.mjs` encore sur OpenAI GPT-4.1-mini.
- B99 périmé — non mis à jour depuis v08.
- Agents = vision documentée, zéro implémentation.

**Ce qui manque**
- Ingestion batch 10-20 threads validée.
- `retry_count` dans THREAD_DUMP + retry dans `os:inject`.
- Remote Git.
- B99 mis à jour avec CONTEXT v12.
- Tags sur THREAD_DUMP / DECISIONS / LESSONS pour filtrage agents personnels B01.

---

## 6. Contradictions et incohérences détectées

**`notion-memory-chat.mjs` encore sur OpenAI**
- Le serveur HTTP utilise Claude, le CLI utilise OpenAI GPT-4.1-mini.
- Deux LLMs pour la même fonction selon le mode d'accès.
- Décision de migration reportée mais non datée.

**Faux positif `checkFolders()` non corrigé**
- `test_threads` signalé comme "ancien dossier à supprimer" alors qu'il est dans `.gitignore`.
- Identifié depuis le thread précédent, toujours présent en v3.
- Crée du bruit dans l'audit alignement à chaque clôture.

**B99 périmé**
- Dernier CONTEXT injecté en B99 = v08 (avril 2026).
- Chat répond sur une base désynchronisée du présent réel.
- Identifié comme problème depuis v08, toujours non résolu.

**`retry_count` identifié mais non implémenté**
- Mentionné depuis CONTEXT v10 comme "à implémenter avant ingestion complète".
- Toujours absent de THREAD_DUMP Notion.
- La clôture de chaque thread rappelle ce manque sans qu'une action soit prise.

---

## 7. Illusions à démonter

**"Le protocole de clôture est complet"**
- `os-thread-close.mjs` v3 fonctionne. Mais testé une seule fois en conditions réelles. Les faux positifs et les sections subjectives générées par inférence (sans contenu thread) restent des angles morts non résolus.

**"Le système est prêt pour l'ingestion complète"**
- Pipeline propre sur 4 threads ≠ robuste sur 82. `retry_count` non implémenté, Notion non audité sur les "dossiers maître et vieux", comportement API sous charge inconnu.

**"Les agents sont définis"**
- Vision documentée dans README v05 et PROMPT v05. Architecture technique = zéro. Aucun agent implémenté, aucun prompt agent défini, aucun test de retrieval par domaine.

**"Git = sécurité"**
- Repository local sans remote. Perte du Mac = perte totale de l'historique.

**"B99 est à jour"**
- Faux. Dernier inject = v08. Le chat pilote sur une mémoire périmée.

---

## 8. Risques structurants

**Technique : retry_count non persisté**
- Un thread peut être retry à l'infini sans détection si le script redémarre.
- Impact : boucles silencieuses, faux diagnostics.

**Technique : remote Git absent**
- Perte hardware = perte totale historique.
- Impact : catastrophique et irréversible.

**Stratégique : ingestion incomplète**
- 82 threads dans `data_cemetery/` = mémoire réelle du groupe non injectée.
- Sans ingestion, le chat ne pilote rien, les agents n'auront pas de base réelle.

**Stratégique : B99 périmé**
- Mémoire vivante désynchronisée du présent réel.
- Impact : réponses chat déconnectées des décisions actuelles.

**Organisationnel : faux positif audit répété**
- `checkFolders()` signale une erreur inexistante à chaque clôture.
- Impact : bruit dans les rapports, risque de banaliser les vraies alertes.

**Vision agents sans architecture**
- V3 documentée, aucun travail technique commencé.
- Risque : la vision crée une attente non satisfaite si V1 n'est pas finalisée d'abord.

---

## 9. Fichiers produits dans ce thread

| Fichier | Rôle | Statut |
|---------|------|--------|
| `os-thread-close.mjs` v3 | Protocole clôture — draft/inject séparés, renommage automatique | En production |
| `docs/readme/README_INSIDE_OS_v05.md` | README mis à jour — agents, parcours thread, roadmap V1-V4 | En production |
| `docs/prompts transfert thread/PROMPT_MAITRE_v05_TRANSFERT_DE_THREAD.md` | PROMPT v05 — DS_ID, versionning, agents, règles CONTEXT | En production |
| `docs/context/INSIDE_OS_CONTEXT_v11.md` | Context thread T25 validé | Archivé |
| `VERSIONING_RULE.md` | Règles versionning README/PROMPT/CONTEXT | Référence permanente |
| `patch-ds-rename.mjs` | Patch DB_ID → DS_ID (99 occurrences) | Utilisé — archivable |
| `patch-rename-folders.mjs` | Patch historical_threads → test_threads | Utilisé — archivable |

---

## 10. Priorité réelle de redémarrage

**Action prioritaire : finaliser liste agents + remote Git + retry_count + ingestion batch 10 threads**

Séquence exacte :
1. Mettre à jour README v05 et PROMPT v05 avec liste agents complète (19 agents + L'Associé + décision tags B01)
2. Configurer remote Git (GitHub)
3. Ajouter propriété `retry_count` dans THREAD_DUMP Notion
4. Implémenter retry automatique dans `os:inject`
5. Corriger faux positif `checkFolders()` dans `os-thread-close.mjs`
6. Déplacer 10 threads de `data_cemetery/` vers `threads_to_process/`
7. `npm run os:ingest && npm run os:extract && npm run os:inject`
8. Valider : extract_error: 0, inject_error: 0 sans intervention manuelle
9. Mettre à jour B99 avec CONTEXT v12

Critère de succès : 10 threads réels ingestés sans intervention manuelle, `retry_count` en base, remote Git configuré.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé**
- DS_ID = Data Source ID — définition unique.
- `os-thread-close.mjs` obligatoire en fin de thread B09.
- Versionning README/PROMPT/CONTEXT indépendants.
- B09 exclu pipeline automatique.
- raw_text multi-lignes = V2 — ne pas toucher.
- Agents = V3 — ne pas implémenter avant V1 complète.
- `CONTEXT_vXX_draft.md` = non validé, `CONTEXT_vXX.md` = validé.
- Tags sur B01 pour agents personnels (santé, développement_personnel, vie_privée, patrimoine_perso, famille).

**À faire immédiatement**
- README v05 + PROMPT v05 : ajouter liste agents complète (19 agents + L'Associé + tags B01).
- `retry_count` dans THREAD_DUMP + retry dans `os:inject`.
- Corriger `checkFolders()` dans `os-thread-close.mjs`.
- Remote Git.

**À tester avant ingestion complète**
- Batch 10 threads depuis `data_cemetery/` : extract_error: 0, inject_error: 0 sans intervention.
- Comportement sur threads longs (>100k chars).

**À versionner**
- CONTEXT v12 → injecter en B99 (ce document).
- README v06 quand liste agents finalisée dans les documents.

---

## Point de redémarrage minimal

- **Objectif** : liste agents dans README/PROMPT + remote Git + retry_count + ingestion 10 threads batch
- **Acquis réels** : os-thread-close v3 opérationnel (draft/inject séparés), DS_ID unifié, README v05 + PROMPT v05 commités, règles versionning gravées, liste 19 agents + L'Associé validée, décision tags B01 gravée, pipeline 4/4 propre, 113 DECISIONS / 98 LESSONS
- **Contraintes actives** : DS_ID = Data Source ID, B09 exclu pipeline, test_threads 4 max, raw_text multi-lignes = V2, agents = V3, CONTEXT_draft ≠ CONTEXT validé
- **État actuel** : ingestion complète non faite, B99 périmé, retry_count non implémenté, remote Git absent, agents = vision sans implémentation
- **Prochaine étape** : README v05 maj agents → remote Git → retry_count → batch 10 threads → ingestion complète → B99
