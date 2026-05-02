# INSIDE_OS_CONTEXT_v17
Date : 2026-05-02

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T29-Pipeline-V2-Chunking-Beta

**Statut : Stable**
**Version : v17**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

**Source du STOP :** Décision humaine explicite de Florent — pipeline V2 complet validé, chunking adaptatif opérationnel, décision de passer en mode audit + Beta v01 au prochain thread.

Thread dense mais propre. Pas de saturation. Arrêt volontaire pour préparer le prochain thread proprement avec Claude Code.

---

## 1. Intention réelle du thread

**Objectif réel :** Implémenter le pipeline V2 complet — schéma Notion enrichi, ingest V2 avec double passe LLM, inject V2 avec nouveaux champs, et chunking adaptatif pour les threads de toute taille.

**Problème concret :** Pipeline V1 sans distillation LLM, sans bucket/impact/agents dans Notion, limite 2000 chars bloquant l'inject, statuts manuels, et crash sur threads longs (133 000 chars).

**Dérive empêchée :** Lancer le batch 82 threads sans pipeline fiable. Lancer Beta v01 sans valider le pipeline sur un vrai thread long.

---

## 2. Acquis réels

**Schéma Notion V2 — mis à jour via MCP**
- `decisions_structural` : +bucket (multi_select B01-B99), +impact (critical/major/minor), +agents (text), +agent_suggestions (text) ✅
- `lessons_learnings` : +bucket, +lesson_type (technical/strategic/operational/process/relational), +agents, +agent_suggestions ✅
- `thread_dump` : +summary_short, +summary_full ✅

**Dossiers V2 créés**
- `data/thread_clean/`, `data/thread_summarized/`, `data/thread_chunked/` — commit `24871ae` ✅

**Pipeline ingest V2 — opérationnel**
- clean → archiveToCemetery (+ suppression thread_clean/ après) → passe 1 LLM (chunking adaptatif) → passe 2 delta → saveSummarized → ingest Notion
- `extraction_status=done` + `injection_status=pending` écrits automatiquement après extraction ✅
- Commit `c5dd1db` + `61bc2be` + `9e58df0` ✅

**Chunking adaptatif passe 1 — opérationnel**
- `splitIntoChunks(text, CHUNK_SIZE, CHUNK_OVERLAP)` — pas de seuil, tout thread découpé
- 1 thread court = 1 chunk = 1 appel LLM
- 1 thread long = N chunks = N appels séquentiels → merge → passe 2
- CHUNK_SIZE=20000, CHUNK_OVERLAP=500 (configurables via .env)
- Retries progressifs supprimés — remplacés par 1 appel direct à 8000 tokens par chunk
- Validé sur B03-T03 : 133 717 chars → 7 chunks → 50d/50l → inject OK ✅
- Nouveau prompt : `os/prompts/ingest-pass1-v02.md` — actif via `INGEST_PROMPT_PASS1=ingest-pass1-v02` ✅
- Commit `9e58df0` ✅

**Inject V2 — opérationnel**
- Lit `data/thread_summarized/{id}.json` en priorité (contourne limite 2000 chars Notion)
- Fallback V1 : propriété Notion + blocs de page (rétrocompatibilité threads anciens)
- Mappings V2 gravés : `json.status` → `decision_status`, `json.type` → `lesson_type`
- Champs V2 injectés : bucket (multi_select), impact (select), agents (text JSON), agent_suggestions (text JSON)
- Commit `5bdc3b7` + fix mappings dans `c5dd1db` ✅

**Tests validés**
- B99-T99 (6 102 chars, 1 chunk) : ingest + inject OK ✅
- B03-T03 (133 717 chars, 7 chunks) : ingest + inject OK (1 retry Notion 504, normal) ✅

**Décisions infra gravées en mémoire vivante (decisions_structural)**
- Court terme : Notion → Supabase (PostgreSQL + API REST) — source B09-T29 ✅
- Moyen terme : PostgreSQL + pgvector (recherche sémantique agents V3) — source B09-T29 ✅
- Long terme : infrastructure propriétaire (audio, transcriptions longues, multi-entités) — source B09-T29 ✅

**README v09 mis à jour**
- Section "Roadmap infrastructure — Migration base de données" ajoutée (à vérifier alignement au prochain thread) ✅

**Snapshot Notion clôture**
- THREAD_DUMP : 14 | extract_done: 14 | inject_done: 14 | inject_error: 0
- DECISIONS : 309 | LESSONS : 297

---

## 3. Hypothèses, intentions, paris

- Les 10 threads V1 déjà injectés (B01-T01 à B07-T01) ont leurs décisions/lessons au format V1 (sans bucket/impact/agents). Réingest V2 nécessaire pour les enrichir — non encore fait.
- La passe 2 (vérification delta) sur le merge de chunks n'est pas optimale : elle reçoit le thread_clean complet, ce qui peut dépasser le contexte sur les très longs threads. Acceptable pour l'instant.
- Le coût LLM estimé ~$3.50 pour les 82 threads en V2 reste une estimation — le chunking multiple la multiplie sur les threads longs.
- Supabase comme remplacement Notion : architecture définie, non implémentée — V4.

---

## 4. Contraintes actives à respecter

**Techniques**
- DS_ID decisions_structural = `3b054e65-6195-4bfe-8411-53bafe98b64b`
- retry_count max 2, blocage BLOCKED, intervention manuelle au-delà
- B09 exclu pipeline automatique
- INGEST_PROMPT_PASS1=ingest-pass1-v02 (actif dans .env)
- CHUNK_SIZE=20000, CHUNK_OVERLAP=500 (actif dans .env)
- Notion MCP destructif = confirmation explicite requise
- `thread_summarized/` = source prioritaire pour inject — ne jamais supprimer ces fichiers
- `thread_clean/` = temporaire — supprimé automatiquement après archivage cemetery ✅

**Organisationnelles**
- Agents = V3 — ne pas implémenter avant ingestion complète + V2 stable
- Pipeline ne doit jamais écrire directement depuis le chat
- Backup Notion régulier obligatoire tant que Supabase n'est pas en place — données manuelles Notion non sauvegardées ailleurs
- README v09 section infra à vérifier alignement au prochain thread

**Versionning actif**
- README v09 | PROMPT v10 | CONTEXT v17
- Prompts LLM actifs : ingest-pass1-v02 + ingest-pass2-v01

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement**
- Pipeline V2 complet : clean → cemetery → passe 1 chunking → passe 2 delta → summarized → inject ✅
- Chunking adaptatif : threads courts (1 chunk) et longs (N chunks) traités par le même process ✅
- Inject lit thread_summarized/ — aucune limite de taille ✅
- Statuts extraction_status/injection_status automatiques ✅
- Schéma Notion V2 : bucket, impact, lesson_type, agents en place ✅
- MCP Notion + GitHub opérationnels ✅

**Ce qui fonctionne en apparence**
- 10 threads V1 dans Notion : injectés mais au format V1 (sans champs V2) — données présentes mais incomplètes
- B99-T99 dans thread_clean/ : résidu non supprimé (suppression automatique implémentée pour les futurs runs, pas rétroactivement)

**Ce qui reste fragile**
- Passe 2 sur threads très longs (>80 000 chars) : reçoit le thread_clean complet — peut dépasser contexte LLM
- Merge des chunks : summary.full = concaténation des summaries partiels — qualité inférieure à un summary unifié
- 10 threads V1 non réingérés en V2 : décisions sans bucket/impact/agents dans Notion

**Ce qui manque**
- Réingest V2 des 10 threads V1 (pour enrichir avec champs V2)
- Audit complet repo vs Notion (prévu prochain thread avec Claude Code)
- Beta v01 : pipeline stable mais audit pré-lancement non fait

---

## 6. Contradictions et incohérences détectées

**inject-decisions-lessons.mjs déployé a deux versions**
- Le fichier dans le repo contient les mappings V2 (decision_status, lesson_type, bucket, impact, agents)
- Mais `normalizeExtractionPayload()` dans ce même fichier n'a pas été mis à jour pour passer les champs V2 — elle les extrait du JSON mais ne les transmet pas à `decisionProps`/`lessonProps`
- À vérifier au prochain thread avec Claude Code : est-ce que bucket/impact/agents arrivent bien dans Notion ?

**README v09 section infra**
- Florent a ajouté la section manuellement — non vérifiée depuis ce thread
- Risque de doublon avec roadmap V1/V2/V3/V4 existante ou formulation incorrecte

**B99-T99 dans thread_clean/**
- Fichier résiduel du premier test — la suppression automatique est implémentée pour les futurs runs mais ne nettoie pas les résidus existants
- À nettoyer manuellement

---

## 7. Illusions à démonter

**"Pipeline V2 = mission accomplie"**
- Le pipeline tourne, les tests passent. Mais les 10 threads V1 en Notion sont au format V1, la passe 2 sur chunks longs est approximative, et l'audit pré-Beta n'a pas été fait.

**"14 threads dans Notion = les 10 du batch v16 + 4 nouveaux"**
- Faux. Les 14 = les 10 threads réels batch + B99-T99 (test) + B03-T03 (test long) + probablement 2 doublons de tests. Pas de nouveaux threads réels injectés dans ce thread.

**"Le chunking résout définitivement le problème de taille"**
- Le chunking résout le crash sur les threads longs. Mais la qualité du merge (summary partiel concaténé) est inférieure à un summary unifié. La passe 2 reçoit le thread_clean complet — sur un thread de 200 000 chars, ça plantera aussi.

---

## 8. Risques structurants

**Technique : qualité du merge de chunks**
- Summary.full = concaténation de summaries partiels — incohérent, répétitif possible
- Solution future : passe de synthèse dédiée sur les summaries partiels avant passe 2

**Technique : passe 2 sur threads très longs**
- Passe 2 reçoit le thread_clean complet pour comparaison — viable jusqu'à ~80 000 chars
- Au-delà : passe 2 doit aussi recevoir le merge des chunks, pas le thread brut

**Organisationnel : backup Notion**
- Décisions saisies manuellement dans Notion (ex: infra roadmap) ne sont pas sauvegardées ailleurs
- Un incident MCP ou une erreur d'écrasement = perte définitive
- Mitigation : export Notion régulier en CSV/JSON jusqu'à migration Supabase

**Stratégique : Beta v01 sans audit**
- Le système tourne mais n'a pas été audité complètement (repo vs Notion, scripts alignés, dossiers propres)
- Lancer Beta sans audit = risque de découvrir des incohérences en production

---

## 9. Fichiers produits dans ce thread

| Fichier | Rôle | Statut |
|---------|------|--------|
| `os/ingest/ingest-thread-dump.mjs` | Pipeline V2 complet + chunking adaptatif + statuts auto | En production — commits `c5dd1db`, `61bc2be`, `9e58df0` |
| `os/inject/inject-decisions-lessons.mjs` | Inject V2 — mappings V2, thread_summarized/ prioritaire | En production — commits `c5dd1db`, `5bdc3b7` |
| `os/prompts/ingest-pass1-v02.md` | Prompt passe 1 chunking adaptatif | En production — commit `9e58df0` |
| `docs/readme/README_INSIDE_OS_v09.md` | Section infra roadmap ajoutée manuellement | À vérifier alignement |
| `data/thread_summarized/B99-T99.json` | Résultat extraction V2 thread test | Local — ne pas supprimer |
| `data/thread_summarized/B03-T03.json` | Résultat extraction V2 thread long test | Local — ne pas supprimer |

**Modifications Notion via MCP**
- `decisions_structural` : +bucket, +impact, +agents, +agent_suggestions
- `lessons_learnings` : +bucket, +lesson_type, +agents, +agent_suggestions
- `thread_dump` : +summary_short, +summary_full
- 3 décisions infra créées (Supabase/pgvector/V4) — source B09-T29

---

## 10. Priorité réelle de redémarrage

**Action prioritaire : Audit complet + Beta v01**

Séquence exacte (avec Claude Code) :
1. Audit repo vs Notion : scripts alignés ? dossiers propres ? .env complet ?
2. Vérifier que bucket/impact/agents arrivent bien dans Notion après inject (doute section 6)
3. Nettoyer les résidus : B99-T99 dans thread_clean/, fichiers obsolètes repo
4. Vérifier README v09 section infra (pas de doublon, bonne formulation)
5. Réingest V2 des 10 threads V1 (pour champs V2 dans Notion)
6. Si tout est aligné → lancer Beta v01 = batch complet des 82 threads restants

**Critère de succès Beta v01 :** 1 thread réel injecté avec bucket, impact, lesson_type, agents renseignés dans Notion, vérifiés manuellement. Si OK → batch 82.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé**
- DS_ID decisions_structural = `3b054e65-6195-4bfe-8411-53bafe98b64b`
- CHUNK_SIZE=20000, CHUNK_OVERLAP=500
- INGEST_PROMPT_PASS1=ingest-pass1-v02
- B09 exclu pipeline automatique
- Notion MCP destructif = confirmation explicite
- thread_summarized/ = ne jamais supprimer
- Agents = V3 — pas avant ingestion complète

**À faire immédiatement (prochain thread)**
- Ouvrir avec Claude Code (accès direct repo)
- Audit repo/Notion/dossiers avant toute autre action
- Vérifier champs V2 dans Notion sur une décision récente (bucket/impact/agents)
- Nettoyer thread_clean/ manuellement

**À ne pas faire**
- Lancer batch 82 threads sans audit préalable
- Modifier le schéma Notion sans plan de migration données existantes
- Implémenter agents avant Beta v01 stable

---

## Point de redémarrage minimal

- **Objectif** : audit complet + Beta v01 (batch 82 threads)
- **Acquis réels** : pipeline V2 stable (clean → chunking → passe 2 → summarized → inject), schéma Notion V2 en place, chunking validé sur thread long (133k chars), statuts automatiques, inject sans limite de taille
- **Contraintes actives** : DS_ID `3b054e65-6195-4bfe-8411-53bafe98b64b`, CHUNK_SIZE=20000, INGEST_PROMPT_PASS1=ingest-pass1-v02, B09 exclu, backup Notion obligatoire
- **État actuel** : V2 opérationnel, 14 threads dans Notion (10 V1 + 4 tests), 68 threads en attente dans data_cemetery/, audit pré-Beta non fait
- **Fragilités** : merge summary chunks approximatif, 10 threads V1 sans champs V2, doute sur transmission bucket/impact/agents dans inject, README infra non vérifié
- **Prochaine étape** : ouvrir avec Claude Code → audit → vérification champs V2 → nettoyage → Beta v01
