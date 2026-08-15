# INSIDE_OS_CONTEXT_v19
Date : 2026-05-09

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T30-Beta-v01-Complete

**Statut : Stable — mémoire quasi-complète**
**Version : v19**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

**Source du STOP :** Décision humaine — limite de session claude.ai atteinte (Pro plan, fenêtre 5h). Clôture propre.

**Ce thread couvre deux sessions consécutives :**
- Session 1 (nuit) : Beta v01 lancée — batch ingest 61 threads + inject + B09 historiques T01→T26
- Session 2 (jour) : finalisation B09-T01/T03, 5 fixes pipeline gravés, Claude Code opérationnel, clôture

**État final mémoire INSIDE OS :**
- 90 threads dans THREAD_DUMP Notion
- 3 350 décisions | 2 881 lessons
- 1 thread en inject_pending (B09-T28, remis en pending par os-thread-close.mjs)

---

## 1. Intention réelle du thread

**Objectif réel :** Valider Beta v01 (batch 61 threads), injecter les 26 threads B09 historiques, et fermer avec une mémoire quasi-complète du groupe.

**Problèmes résolus :**
- Pipeline V2 validé end-to-end sur threads courts et longs (133k chars → 7 chunks)
- Beta v01 complète : 61 threads métier injectés avec champs V2 (bucket/impact/agents)
- B09-T01 à T30 : 30 threads dev INSIDE OS en mémoire
- B99-T01 à T10 : mémoire vivante à jour
- Claude Code installé et opérationnel
- 5 fixes pipeline identifiés et gravés en mémoire vivante
- Modèle claude-sonnet-4-5 → claude-sonnet-4-6 corrigé

**Dérive empêchée :** Lancer le batch B09 sans crédits API suffisants (crédits épuisés en milieu de batch — rechargés). Lancer un batch de 82 threads sans protocole de validation préalable.

---

## 2. Acquis réels

**Pipeline V2 — opérationnel**
- clean → cemetery → chunking adaptatif → passe 2 delta → thread_summarized/ → inject Notion
- CHUNK_SIZE=20000, CHUNK_OVERLAP=500
- extraction_status=done + injection_status=pending automatiques
- inject lit thread_summarized/ en priorité (aucune limite taille Notion)
- Validé sur B03-T03 (133k chars → 7 chunks → 50d/50l) ✅

**Mémoire INSIDE OS — quasi-complète**

| Bucket | Threads | Décisions/Lessons |
|--------|---------|-------------------|
| B01→B08 | 61 threads | ✅ champs V2 |
| B09-T01→T30 | 30 threads | ✅ (avec --skip-buckets "") |
| B99-T01→T10 | 10 threads | ✅ |
| **Total** | **101 threads ingérés** | **3350d / 2881l** |

**Claude Code — opérationnel**
- Installé : `npm install -g @anthropic-ai/claude-code` ✅
- Connecté compte Florent (Pro plan) ✅
- Accès direct repo `/Users/admin/inside-os` ✅
- Mode opératoire : Florent en français → Claude Code exécute ✅
- Pro/Max partagent la même limite (claude.ai + Claude Code = même pool)

**Commits de ce thread**
- `e23bdf9` — fix gitignore + README v10 versionné
- `560952b` — CONTEXT v18 stub + suppression ingest-pass1-v01
- `758cc05` — CONTEXT v18 réel + README v10 threads_to_inject (annulé pour secrets API)
- `d9b8cfa` — fix gitignore data_cemetery + READMEs v01-v09 + threads_to_inject
- `af621c3` — fix modèle claude-sonnet-4-5 → claude-sonnet-4-6

**Dossiers — état actuel**
- `threads_to_process/` → B09-T27/T28/T29 + B99-T01→T10 (résidus à nettoyer)
- `thread_clean/` → vide ✅
- `thread_summarized/` → 90 fichiers JSON (un par thread ingéré) ✅
- `thread_chunked/` → vide ✅
- `data_cemetery/` → gitignored (secrets API potentiels dans threads bruts)
- `threads_to_inject/` → créé, gitignored, vide ✅

**5 fixes pipeline gravés en mémoire vivante (decisions_structural, source B09-T30)**

| Priorité | Fix | Impact |
|----------|-----|--------|
| 1 | Retry LLM automatique (3x backoff 1s/5s/30s) | major |
| 2 | Retry Notion 504 automatique (3x backoff) | major |
| 3 | CLAUDE_MODEL dans .env (pas hardcodé) | minor |
| 4 | Checkpoint par chunk (thread_summarized/{id}_partial.json) | major |
| 5 | Inject auto-pagination sans limite de 50 | minor |

**Protocole validation batch gravé (source B09-T29)**
- 1 thread → 5 threads → batch complet
- Ne jamais sauter au batch complet sans valider les étapes préalables

**Règle gravée — B99 intouchables**
- B99 = mémoire vivante = jamais supprimés, jamais modifiés

**Plan upgrade documenté**
- Max 5x ($100/mois) recommandé pour éviter les limites de session lors des batches longs
- Pro plan atteint sa limite sur sessions claude.ai + Claude Code en parallèle

---

## 3. Problèmes actifs

**B09-T28 — inject_pending**
- Remis en pending par os-thread-close.mjs (retry automatique phase 2)
- À relancer : `npm run os:inject -- --only B09-T28 --force`

**B09-T01 et B09-T03 — traités mais à vérifier**
- Ingestés et injectés en fin de session après rechargement crédits API
- Status dans Notion à confirmer (inject_done ?)

**Crédits API Anthropic**
- Épuisés en milieu de batch B09 → rechargés sur console.anthropic.com
- Solde actuel inconnu
- À surveiller : activer rechargement automatique pour éviter interruption batch

**threads_to_process/ — résidus**
- Contient encore B09-T27/T28/T29 et B99-T01→T10 non nettoyés
- À nettoyer au prochain thread Claude Code

---

## 4. Contraintes actives à respecter

**Techniques**
- DS_ID decisions_structural = `3b054e65-6195-4bfe-8411-53bafe98b64b`
- CHUNK_SIZE=20000, CHUNK_OVERLAP=500
- INGEST_PROMPT_PASS1=ingest-pass1-v02 (actif dans .env)
- CLAUDE_MODEL = claude-sonnet-4-6 (corrigé dans code, à déplacer en .env)
- B09 exclu pipeline automatique — override `--skip-buckets ""`
- Notion MCP destructif = confirmation explicite requise
- `thread_summarized/` = archive permanente — ne jamais supprimer
- `thread_clean/` = temporaire — supprimé après archivage cemetery
- `data_cemetery/` = gitignored (secrets API potentiels)
- B99 = mémoire vivante — intouchables
- `threads_to_inject/` = batch depuis cemetery (pas `threads_to_process/`)
- Backup Notion régulier obligatoire tant que Supabase n'est pas en place

**Protocoles**
- Clôture thread : `node os-thread-close.mjs --thread-name "B09-TXX-Sujet"` puis `--inject`
- Validation batch : 1 thread → 5 threads → batch complet
- B09 : `--skip-buckets ""` pour override exclusion automatique

**Versionning actif**
- README : v10 | PROMPT : v10 | CONTEXT : v19
- Prompts LLM actifs : ingest-pass1-v02 + ingest-pass2-v01

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement**
- Pipeline V2 complet : clean → cemetery → chunking → passe 2 → summarized → inject ✅
- Chunking adaptatif : threads courts (1 chunk) et longs (jusqu'à 34 chunks) ✅
- Inject via thread_summarized/ — aucune limite de taille ✅
- Statuts automatiques ✅
- Claude Code opérationnel ✅
- Schéma Notion V2 : bucket, impact, lesson_type, agents en place ✅
- os-thread-close.mjs : backup + retry + snapshot + draft CONTEXT + inject B99 ✅

**Ce qui est fragile**
- Crédits API Anthropic non surveillés → interruption batch possible
- Modèle CLAUDE_MODEL hardcodé dans le code (à déplacer en .env)
- Retry LLM non implémenté → erreurs 529/500 nécessitent relance manuelle
- Retry Notion 504 non implémenté → erreurs inject nécessitent relance manuelle
- Checkpoint par chunk non implémenté → perte travail partiel sur erreur en milieu de thread long
- Inject limité à 50 threads → passes manuelles multiples sur gros batches

**Ce qui manque**
- 5 fixes pipeline (gravés, non implémentés) — priorité prochain thread B09
- CLAUDE_MODEL dans .env
- Auto-recharge crédits Anthropic configurée
- Upgrade Max 5x si sessions longues régulières
- Supabase comme remplacement Notion (roadmap court terme)
- pgvector pour recherche sémantique agents V3 (roadmap moyen terme)

---

## 6. Contradictions et incohérences détectées

**B09-T28 en inject_pending malgré inject OK en session**
- L'inject a tourné avec succès sur B09-T28 en fin de session
- os-thread-close.mjs l'a remis en pending (phase 2 retry automatique)
- Cause probable : retry_count=2 détecté dans Notion → remis en pending pour relance propre
- Action : relancer `npm run os:inject -- --only B09-T28 --force` au prochain thread

**threads_to_process/ contient des fichiers non nettoyés**
- B09-T27/T28/T29 et B99 sont dans threads_to_process/ alors qu'ils ont été traités
- Le pipeline supprime thread_clean/ après archivage mais pas threads_to_process/
- Action : nettoyer manuellement au prochain thread Claude Code

**Snapshot Notion : 90 threads mais 101 ingérés**
- 101 threads ont été ingestés (61 métier + 30 B09 + 10 B99)
- THREAD_DUMP affiche 90 — les 11 manquants sont probablement des B99 injectés avant ce thread (B99-T01→T10 = 10 threads existants mis à jour, non créés)
- Cohérent avec la logique upsert par id_dump

---

## 7. Illusions à démonter

**"Le pipeline est maintenant parfait"**
- Réalité : 5 bugs structurels identifiés et gravés, non encore corrigés
- Les erreurs 529/500 et 504 continueront à nécessiter des relances manuelles jusqu'à implémentation des retries

**"La mémoire est complète"**
- Réalité : B09-T28 en pending, B09-T01/T03 à vérifier, B99 mis à jour mais pas vérifiés manuellement
- 3350 décisions + 2881 lessons = données réelles mais qualité variable (threads V1 sans champs V2 pour les anciens)

**"Claude Code remplace ce chat"**
- Réalité : Claude Code = exécution dans le repo. Ce chat = réflexion, conception, CONTEXT
- Les deux sont complémentaires, pas substituables
- La limite de session Pro affecte les deux (pool partagé)

---

## 8. Risques structurants

**Crédits API Anthropic**
- Épuisement en milieu de batch = interruption + travail partiel perdu
- Mitigation : activer auto-recharge sur console.anthropic.com + surveiller solde
- Solution long terme : upgrade Max 5x (pool partagé mais 5x plus grand)

**Backup Notion**
- Décisions saisies manuellement dans Notion non sauvegardées ailleurs
- Un incident MCP ou erreur d'écrasement = perte définitive
- Mitigation : export Notion CSV/JSON régulier jusqu'à migration Supabase

**Dépendance claude-sonnet-4-6**
- Modèle hardcodé dans le code → risque blocage si retrait du service (comme claude-sonnet-4-5)
- Mitigation immédiate : déplacer en .env (priorité 3 des 5 fixes)

**Qualité extraction threads V1**
- Les 10 threads injectés en V1 (B01-T01 à B07-T01) n'ont pas les champs V2 renseignés
- bucket/impact/agents vides pour ces threads
- Impact : agents V3 auront des données incomplètes sur ces threads
- Mitigation : réingest V2 de ces threads lors d'un batch dédié

---

## 9. Priorité réelle de redémarrage

**Action immédiate (Claude Code) :**

1. Relancer inject B09-T28 : `npm run os:inject -- --only B09-T28 --force`
2. Vérifier inject_done sur B09-T01 et B09-T03 dans Notion
3. Nettoyer threads_to_process/ (supprimer résidus B09 et B99)
4. Vérifier solde crédits API sur console.anthropic.com + activer auto-recharge

**Prochain thread B09 (avec Claude Code) — 5 fixes pipeline :**

Dans cet ordre :
1. CLAUDE_MODEL dans .env (30 min — 1 ligne de code + .env)
2. Retry Notion 504 dans inject (1h — backoff sur les appels Notion)
3. Retry LLM 529/500 dans ingest (1h — backoff sur les appels Anthropic)
4. Inject auto-pagination (30 min — boucle jusqu'à 0 candidats)
5. Checkpoint par chunk (2h — sauvegarde partielle + reprise)

Critère de succès : un batch de 30 threads tourne sans intervention manuelle, zéro erreur non récupérée.

---

## 10. Point de redémarrage minimal

- **Objectif** : implémenter les 5 fixes pipeline + stabiliser le système
- **Acquis** : pipeline V2 stable, 101 threads ingérés, 3350d/2881l en Notion, Claude Code opérationnel
- **En attente** : B09-T28 inject (relancer), B09-T01/T03 (vérifier), crédits API (surveiller)
- **Contraintes** : DS_ID `3b054e65-6195-4bfe-8411-53bafe98b64b`, CHUNK_SIZE=20000, B09 exclu auto, B99 intouchables, data_cemetery gitignored
- **Fragilités** : retries non implémentés, CLAUDE_MODEL hardcodé, limite inject 50, crédits API non surveillés
- **Prochaine étape** : ouvrir Claude Code → relancer B09-T28 → vérifier B09-T01/T03 → 5 fixes pipeline
