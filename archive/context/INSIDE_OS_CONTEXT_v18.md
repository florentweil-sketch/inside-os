# INSIDE_OS_CONTEXT_v18
Date : 2026-05-03

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T29-Pipeline-V2-Chunking-Beta (suite)

**Statut : En production — inject batch en cours**
**Version : v18**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

**Source du STOP :** Décision humaine — inject batch des 61 threads en cours en arrière-plan dans Claude Code. Thread fermé pendant l'exécution.

**Ce thread a deux parties :**
- Partie 1 (B09-T29) : pipeline V2 complet + chunking adaptatif + tests → documenté CONTEXT v17
- Partie 2 (suite) : Beta v01 lancée, batch ingest nuit de 61 threads, inject en cours, Claude Code opérationnel

---

## 1. Intention réelle du thread

**Objectif réel :** Valider le pipeline V2 complet en production, lancer Beta v01 (batch 61 threads), et démarrer l'opération de Claude Code comme outil d'exécution principal.

**Problème résolu :** Pipeline V2 validé end-to-end sur threads courts et longs. Beta v01 lancée. Claude Code installé et opérationnel pour exécution directe dans le repo.

**Dérive empêchée :** Lancer le batch 82 threads sans protocole de validation (1 thread → 5 threads → batch complet). La règle est maintenant gravée.

---

## 2. Acquis réels

**Beta v01 — batch ingest complété cette nuit**
- 61 threads traités : 50 créés, 10 mis à jour (V1→V2), 1 erreur (B05-T01) ✅
- Zéro BLOCKED ✅
- Tous les `thread_summarized/` générés localement ✅
- `extraction_status=done` + `injection_status=pending` automatiques ✅

**Inject batch — en cours au moment de la clôture**
- `npm run os:inject` lancé en background dans Claude Code
- Cible : 61 threads en `injection_status=pending`
- À vérifier au prochain thread : résultat inject + comptage décisions/lessons

**B05-T01 — erreur ingest**
- JSON malformé sur chunk 1/2 — LLM a renvoyé JSON invalide
- À relancer : `npm run os:ingest -- --mode batch --only B05-T01`
- Puis inject : `npm run os:inject -- --only B05-T01`

**B09-T01 à T26 — non ingestés**
- 26 threads historiques INSIDE OS dans `data_cemetery/` sans `thread_summarized/`
- Décision : les injecter (mémoire de construction du système — valeur réelle)
- 5 Mo total, ~60-90 min de traitement
- À faire via `threads_to_inject/` — batch dédié hors pipeline auto
- Commande : copier dans `threads_to_inject/` + `npm run os:ingest -- --skip-buckets ""`

**Claude Code — opérationnel**
- Installé : `npm install -g @anthropic-ai/claude-code` ✅
- Connecté au compte Florent ✅
- Accès direct repo `/Users/admin/inside-os` ✅
- Mode opératoire validé : Florent parle en français, Claude Code exécute

**Nettoyage dossiers — fait**
- `thread_clean/` → vide ✅
- `threads_to_process/` → 3 B09 (T27/T28/T29) + 10 B99 uniquement ✅
- `data_cemetery/` → doublons format court supprimés, B09-T27/T28/T29 archivés avec nom descriptif ✅
- B99 préservés intacts (mémoire vivante — intouchables) ✅

**Commits de ce thread**
- `e23bdf9` — gitignore corrigé + README v10 versionné
- `560952b` — CONTEXT v18 placeholder + suppression ingest-pass1-v01.md obsolète

**Règle gravée en mémoire vivante (decisions_structural)**
- Protocole validation pipeline : 1 thread → 5 threads → batch complet. Ne jamais sauter au batch complet sans valider les étapes préalables. Source B09-T29, validated, impact major ✅

**Nouveau dossier `threads_to_inject/`**
- Créé dans les règles docs système
- À créer physiquement dans le repo au prochain thread
- À ajouter dans `.gitignore`
- Remplace l'usage de `threads_to_process/` pour les batchs depuis cemetery

**README v10 mis à jour**
- `threads_to_inject/` ajouté dans les dossiers data
- Règle d'usage documentée

---

## 3. État Notion au moment de la clôture

- `thread_dump` : 61 entrées + anciens threads (B09-T23, tests) — inject en cours
- `decisions_structural` : ~309 + nouvelles décisions batch (à vérifier)
- `lessons_learnings` : ~297 + nouvelles lessons batch (à vérifier)
- `injection_status=pending` sur les 61 threads — l'inject en cours va les passer à `done`

---

## 4. Contraintes actives à respecter

**Techniques**
- DS_ID decisions_structural = `3b054e65-6195-4bfe-8411-53bafe98b64b`
- CHUNK_SIZE=20000, CHUNK_OVERLAP=500
- INGEST_PROMPT_PASS1=ingest-pass1-v02
- B09 exclu pipeline automatique — override manuel uniquement (`--skip-buckets ""`)
- Notion MCP destructif = confirmation explicite requise
- `thread_summarized/` = archive permanente — ne jamais supprimer
- `thread_clean/` = temporaire — supprimé automatiquement après archivage cemetery
- B99 = mémoire vivante — intouchables, jamais supprimés
- `threads_to_inject/` = batch depuis cemetery (pas `threads_to_process/`)
- Backup Notion régulier obligatoire tant que Supabase n'est pas en place

**Protocole validation pipeline (gravé)**
1. Test unitaire : 1 thread court <10k chars
2. Batch test : 5 threads variés
3. Batch complet uniquement si 1 et 2 validés

**Mode opératoire Claude Code**
- Florent parle en français dans le terminal
- Claude Code propose, Florent valide, Claude Code exécute
- Pour les décisions importantes → revenir sur ce chat (Sonnet) pour conception

**Versionning actif**
- README : v10 | PROMPT : v10 | CONTEXT : v18
- Prompts LLM actifs : ingest-pass1-v02 + ingest-pass2-v01

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement**
- Pipeline V2 complet : clean → cemetery → chunking → passe 2 → summarized → inject ✅
- Chunking adaptatif : validé sur 133k chars (7 chunks) ✅
- Inject via `thread_summarized/` — aucune limite de taille ✅
- Statuts automatiques ✅
- Claude Code opérationnel avec accès repo direct ✅
- Schéma Notion V2 : bucket, impact, lesson_type, agents ✅

**Ce qui est en cours**
- Inject batch 61 threads → résultat inconnu (lancé en background)
- B05-T01 → à relancer après inject
- B09-T01 à T26 → batch dédié à planifier

**Ce qui manque**
- `threads_to_inject/` : dossier à créer physiquement + gitignore
- Vérification résultat inject batch (décisions/lessons dans Notion)
- Automatisation protocole clôture thread (Claude Code)
- CONTEXT v18 à injecter en B99 (placeholder actuel = vide)

---

## 6. Risques structurants

**Inject batch en cours sans supervision**
- L'inject tourne en background — si timeout Notion sur un thread, il peut passer en erreur silencieusement
- À vérifier au prochain thread : `injection_status` de tous les threads dans Notion

**B09-T01 à T26 non ingestés**
- 26 threads de dev INSIDE OS sans mémoire V2
- La mémoire de construction du système est absente de Notion
- Impact : agents futurs ne comprennent pas pourquoi INSIDE OS est construit comme il l'est

**CONTEXT v18 en B99 = placeholder vide**
- Le vrai CONTEXT v18 n'est pas encore en B99
- À corriger au prochain thread avec Claude Code

**Backup Notion**
- Décisions manuelles dans Notion non sauvegardées ailleurs
- Migration Supabase = priorité court terme

---

## 7. Priorité réelle de redémarrage

**Séquence exacte (avec Claude Code) :**

1. Vérifier résultat inject batch — combien de threads `injection_status=done` dans Notion
2. Relancer B05-T01 : `npm run os:ingest -- --mode batch --only B05-T01` puis inject
3. Créer `data/threads_to_inject/` + ajouter dans `.gitignore`
4. Remplacer B99 par le vrai CONTEXT v18 dans Notion
5. Batch B09-T01 à T26 via `threads_to_inject/` (60-90 min)
6. Vérifier manuellement dans Notion : 1 décision B09 avec bucket/impact/agents

**Critère de succès :** inject batch terminé sans erreur + B05-T01 traité + B09 historiques en mémoire.

---

## 8. Point de redémarrage minimal

- **Objectif** : finaliser Beta v01 (inject batch + B05-T01 + B09 historiques)
- **Acquis** : pipeline V2 stable, 61 threads ingestés, Claude Code opérationnel
- **En cours** : inject batch 61 threads (background)
- **Contraintes** : DS_ID `3b054e65-6195-4bfe-8411-53bafe98b64b`, CHUNK_SIZE=20000, B09 exclu auto, B99 intouchables, backup Notion obligatoire
- **Prochaine étape** : ouvrir Claude Code → vérifier inject → B05-T01 → threads_to_inject/ → B09 batch
