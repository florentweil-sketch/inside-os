# INSIDE_OS_CONTEXT_v16
Date : 2026-05-02

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T28-Notion-Dev-016

**Statut : Stable**
**Version : v16**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Thread exceptionnel — le plus dense de l'historique B09. Couvre à la fois l'audit repo/Notion/MCP, la résolution d'incidents (decisions_structural supprimée accidentellement, remote Git, clés régénérées), l'analyse complète des problèmes de protocole T27, et une refonte architecturale majeure : pipeline V2 distillation intelligente, contrat JSON enrichi, vision agents exécutants, mémoire relationnelle ENTITIES. Ce thread correspond à B09-T26 enrichi après analyse de B09-T27 — le script l'a nommé B09-T28 car il suit T27 dans la séquence.

**Source du STOP :** Décision humaine explicite de Florent — pipeline propre confirmé, fichiers déployés, système stable.

---

## 1. Intention réelle du thread

**Objectif réel :** Audit repo vs Notion live, connexion MCP Notion + GitHub, résolution des priorités CONTEXT v12 (remote Git, retry_count, B99), puis analyse des problèmes de protocole T27, et refonte architecturale V2.

**Problème concret :** Remote Git absent, retry_count non persisté, decisions_structural supprimée accidentellement (incident MCP), protocole de fin de thread mal compris, pipeline ingest hardcodé sur test_threads/, architecture V1 sans distillation LLM.

**Dérive empêchée :** Lancer l'ingestion des 82 threads sans remote Git ni retry_count. Laisser le CONTEXT v16 avec des erreurs factuelles (le draft auto-généré contenait 5 affirmations fausses). Implémenter les agents avant que V1 soit finalisée.

---

## 2. Acquis réels

**Notion MCP + GitHub connectés**
- Audit live repo vs Notion depuis le thread Claude ✅
- Modifications schéma Notion directes (retry_count, suppression résidu, reset statuts) ✅
- GitHub : connecté via Settings → Connectors (OAuth) ✅

**Incident decisions_structural — résolu**
- Suppression accidentelle via MCP → recréation complète du schéma
- 95 décisions + 98 lessons restaurées depuis extraction_json
- Nouveau DS_ID : `3b054e65-6195-4bfe-8411-53bafe98b64b` → documenté dans `.env` et README v09

**retry_count — implémenté Notion + code**
- Propriété `number` dans THREAD_DUMP ✅
- `inject-decisions-lessons.mjs` : lecture, blocage BLOCKED si >= 2, incrément sur error, reset à 0 sur done ✅
- Commit : `7027969` ✅

**Remote Git GitHub — opérationnel**
- Repo : `https://github.com/florentweil-sketch/inside-os.git`
- osxkeychain configuré — push transparent ✅
- Alias terminal : `ios` = `cd /Users/admin/inside-os` ✅

**Migration notion-memory-chat.mjs OpenAI → Claude**
- `claude-haiku-4-5-20251001` — dépendance OpenAI supprimée ✅
- Commit : `8ac12b8` ✅

**Clés API régénérées**
- OpenAI `inside-os-extraction` révoquée et régénérée ✅
- Token Notion `INSIDE_OS_API` révoqué et régénéré ✅

**Batch 10 threads réels — validé**
- B01-T01, B01-T02, B02-T01, B02-T02, B03-T01, B03-T02, B04-T01, B05-T01, B06-T01, B07-T01
- ingest/extract/inject : 10/10 ✅ — inject_error: 0 ✅

**Bug ingest écrasement statuts — corrigé**
- `buildThreadDumpProperties` écrasait extraction_status/injection_status à `pending` sur update
- Fix : `buildUpdateProperties` (update) + `buildCreateProperties` (création) + `guardCheckExistingDone()`
- Commit : `f935702` ✅

**ingest — mode batch/test interactif**
- Choix au démarrage : [1] Batch production → threads_to_process/ / [2] Test pipeline → test_threads/ ✅

**REGLES DOCS SYSTEME gravées — README v07→v09 + PROMPT v08→v10**

Règle fondamentale rôles documents :
- README = référence technique permanente
- PROMPT = règles de travail inter-thread
- CONTEXT = instantané vivant du système
- Les trois complémentaires, jamais redondants

**Vision agents reformulée — agents exécutants permanents**

Les agents INSIDE OS sont des collaborateurs permanents qui exécutent les tâches comme un salarié compétent :
- Documents & admin, tri & audit, communication, création digitale, com externe, conseil, rôle externe

Niveaux de confirmation :
- Autonome : lecture/analyse/production document
- Confirmation : envoi email/publication
- Validation Florent : développement/mise en production
- Jamais autonome : engagements financiers

**Architecture pipeline V2 — validée**

```
threads_to_process/
→ CLEAN → thread_clean/
→ ARCHIVE → data_cemetery/ (copie permanente)
→ PASSE 1 LLM : { summary, decisions, lessons } en une passe
   → thread_summarized/ + blocs Notion THREAD_DUMP
→ PASSE 2 LLM : vérification delta (systématique — VERIFY_PASS=always)
→ CHUNK si résumé > 12 000 → thread_chunked/ (exception)
→ INJECT NOTION DECISIONS + LESSONS
→ purge thread_chunked/
```

**Contrat JSON enrichi — validé**

```json
{
  "summary": { "short": "2-3 phrases", "full": "200-400 mots prose" },
  "decisions": [{
    "decision": "", "rationale": null, "evidence": null,
    "bucket": ["B03"], "impact": "critical|major|minor",
    "status": "validated|proposed",
    "agents": ["Agent Financier"],
    "agent_suggestions": [{ "name": "", "rationale": "", "type": "new|sub-agent", "parent": null }]
  }],
  "lessons": [{
    "lesson": "", "what_happened": null, "evidence": null,
    "bucket": ["B09"],
    "type": "technical|strategic|operational|process|relational",
    "agents": ["Agent Infrastructure & Tech"],
    "agent_suggestions": []
  }]
}
```

**Prompts LLM produits et versionnés**
- `os/prompts/ingest-pass1-v01.md` — passe 1 : résumé dense + extraction décisions + lessons
- `os/prompts/ingest-pass2-v01.md` — passe 2 : vérification delta uniquement
- Config `.env` : `VERIFY_PASS=always | conditional | never`

**Mémoire relationnelle ENTITIES (V3) — architecture définie**
- Base Notion ENTITIES : profil par entité (client, fournisseur, collaborateur)
- Enrichissement auto (threads) + saisie manuelle Florent (tags, notes, qualifications)
- Agents interrogent ENTITIES avant de répondre sur une entité

**Documents système produits et déployés**
- README v07, v08, v09
- PROMPT v08, v09, v10
- CONTEXT v15
- `os/prompts/ingest-pass1-v01.md` + `ingest-pass2-v01.md`

**Nettoyage repo**
- threads_to_process/ désindexé de Git (gitignore + `git rm --cached`) ✅
- B09-T24/T25/T26 archivés dans data_cemetery ✅
- REMOTE_OK.md supprimé ✅
- Legacy PROMPT v02/v03 renommés ✅

---

## 3. Hypothèses, intentions, paris

- Les 95 décisions restaurées après incident couvrent les 113 initiales — delta 18 = déduplication à la réinjection. Non vérifié entrée par entrée.
- Haiku-4-5 choisi pour coût/légèreté sur CLI test — qualité vs GPT-4.1-mini non benchmarkée.
- Pipeline V2 (double passe LLM) coûtera ~$3.50 pour les 82 threads restants — estimation acceptable, non validée sur thread réel.
- `agent_suggestions` LLM = mécanisme d'évolution organique du réseau agents — non testé en conditions réelles.

---

## 4. Contraintes actives à respecter

**Techniques**
- DS_ID decisions_structural = `3b054e65-6195-4bfe-8411-53bafe98b64b`
- `retry_count` max 2, blocage BLOCKED, intervention manuelle au-delà
- `queryDataSource()` uniquement — `queryDatabaseCompat` banni
- raw_text mono-ligne jusqu'à V2 (remplacé par summary.full en V2)
- Notion MCP : opérations destructives = confirmation explicite requise

**Versionning**
- README / PROMPT / CONTEXT indépendants — jamais couplés
- Règle bump : commiter avant renommer, utiliser `cp` pas `mv`
- README actif : v09. PROMPT actif : v10. CONTEXT actif : v16.
- Prompts LLM actifs : ingest-pass1-v01 + ingest-pass2-v01

**Organisationnelles**
- B09 exclu pipeline automatique
- `data_cemetery/` : archive permanente — n'en ressort jamais sauf cas de force majeure documenté
- Agents = V3 — ne pas implémenter avant ingestion complète
- Pipeline ne doit jamais écrire directement depuis le chat

---

## 5. Architecture actuelle

**Ce qui fonctionne réellement**
- Pipeline ingest/extract/inject stable — validé sur 10 threads réels
- ingest : batch/test interactif, guard pré-ingest, préservation statuts done sur update
- Notion MCP opérationnel — audit live, modifications schéma, corrections statuts
- Remote Git GitHub + osxkeychain — push transparent
- `retry_count` implémenté Notion + code
- `notion-memory-chat.mjs` sur Claude haiku-4-5
- `os-thread-close.mjs` v3 : clôture automatisée propre
- ENTITIES : architecture définie, non implémentée (V3)

**Ce qui fonctionne en apparence**
- 10 threads batch injectés : extraction technique OK, qualité décisions/lessons non auditée
- retry_count : implémenté, jamais déclenché en conditions réelles

**Ce qui reste fragile**
- 72 threads restants dans data_cemetery non injectés
- B07-T01 skip silencieux au premier extract — cause non documentée
- Draft CONTEXT auto-généré par le script = inexact si thread non fourni (5 erreurs factuelles dans v16 draft)

**Ce qui manque**
- Implémentation pipeline V2 (clean, double passe LLM, nouveaux dossiers)
- Schéma Notion mis à jour avec contrat JSON enrichi (bucket[], impact, status, agents, agent_suggestions, type relational)
- Benchmark Claude vs OpenAI sur CLI mémoire
- Test retry_count sur inject_error simulé proprement (depuis retry_count=0)
- Ingestion des 72 threads restants

---

## 6. Contradictions et incohérences détectées

**Draft CONTEXT auto-généré = source d'erreurs**
- Le script génère le CONTEXT depuis l'état système sans le thread source
- 5 affirmations factuellement fausses dans le draft v16 auto-généré
- Solution appliquée ce thread : fournir le thread B09-T28 pour correction manuelle
- À documenter dans le protocole de clôture : si thread non disponible en phase 6, le CONTEXT draft doit être corrigé manuellement avant inject

**B99-T99 inject_pending permanent**
- Thread de test avec extraction_json vide — ne s'injectera jamais
- Apparaît comme anomalie dans chaque snapshot Notion
- À documenter comme exception connue dans os-thread-close.mjs (exclure B99-T99 des warnings)

**Versions PROMPT multiples dans le repo**
- v02, v03, v04, v05, v06, v07, v08, v09, v10 tous présents dans `docs/prompts transfert thread/`
- Seul v10 est actif — les autres sont de l'historique
- Risque : confusion sur la version active au démarrage d'un thread

---

## 7. Illusions à démonter

**"Le draft CONTEXT auto-généré est fiable"**
- Faux si le thread source n'est pas disponible en phase 6. Le script infère depuis les commits et l'état Notion — il peut inverser des acquis réels (retry_count "non implémenté" alors qu'il est dans le code depuis T26).

**"Pipeline V2 est implémenté"**
- Non. L'architecture est validée et documentée. Le code n'existe pas encore. Le pipeline actuel reste ingest/extract/inject V1.

**"72 threads = bientôt fini"**
- Le batch 10 a pris un thread entier avec bugs. 72 threads = au moins 5-7 sessions, plus si nouveaux edge cases.

**"Les agents sont définis donc prêts à implémenter"**
- Le périmètre, le contrat JSON et les prompts sont définis. L'implémentation V3 reste entière — et elle dépend de V2 (pipeline distillation) qui n'existe pas encore.

---

## 8. Risques structurants

**Technique : implémentation V2 sous-estimée**
- Clean, double passe LLM, 6 nouveaux dossiers, nouveau schéma Notion, paramètres config
- Risque : plusieurs threads de dev avant stabilisation, régression possible sur V1

**Technique : schéma Notion non mis à jour**
- Le contrat JSON V2 (bucket[], impact, agents, agent_suggestions, type relational) n'est pas dans Notion
- Les 242 décisions + 238 lessons actuelles sont au format V1
- Migration schéma = risque de perte ou d'incohérence sur les données existantes

**Stratégique : 72 threads non injectés**
- Mémoire réelle du groupe très partielle (10/82 threads)
- Chat/agents inutilisables métier jusqu'à ingestion complète

**Organisationnel : Notion MCP destructif**
- Incident decisions_structural illustre le risque
- Règle gravée : confirmation explicite requise — mais aucune vérification technique ne force cette confirmation

---

## 9. Fichiers produits dans ce thread

| Fichier | Rôle | Statut |
|---------|------|--------|
| `os/inject/inject-decisions-lessons.mjs` | retry_count : lecture, blocage, incrément, reset | En production — commit `7027969` |
| `os/chat/notion-memory-chat.mjs` | Migration OpenAI → Claude haiku-4-5 | En production — commit `8ac12b8` |
| `os/ingest/ingest-thread-dump.mjs` | Mode batch/test + guard + préservation statuts | En production — commit `f935702` |
| `os/prompts/ingest-pass1-v01.md` | Prompt LLM passe 1 — résumé + extraction | Versionné — à implémenter en V2 |
| `os/prompts/ingest-pass2-v01.md` | Prompt LLM passe 2 — vérification delta | Versionné — à implémenter en V2 |
| `docs/readme/README_INSIDE_OS_v09.md` | Vision agents exécutants, pipeline V2, contrat JSON, ENTITIES | Actif |
| `docs/prompts transfert thread/PROMPT_MAITRE_v10_TRANSFERT_DE_THREAD.md` | Rôles docs, pipeline V2, contrat JSON, ENTITIES | Actif |
| `docs/context/INSIDE_OS_CONTEXT_v15.md` | Clôture B09-T27 | Archivé |
| `.gitignore` | Ajout `data/threads_to_process/` | En production |

**Modifications Notion via MCP**
- `decisions_structural` recréée (nouveau DS_ID : `3b054e65-6195-4bfe-8411-53bafe98b64b`)
- `retry_count` (number) ajouté dans THREAD_DUMP
- `source_thread` relation ajoutée dans decisions_structural
- B09-T23, B05-T01 : statuts corrigés → done

---

## 10. Priorité réelle de redémarrage

**Action prioritaire : implémenter pipeline V2**

Séquence :
1. Créer les nouveaux dossiers data (`thread_clean/`, `thread_summarized/`, `thread_chunked/`) + `.gitignore`
2. Refactoring `os:ingest` : étape clean + passe 1 LLM + passe 2 delta
3. Mettre à jour schéma Notion THREAD_DUMP + DECISIONS + LESSONS avec contrat JSON V2
4. Tester sur 1 thread réel depuis threads_to_process/
5. Valider qualité extraction (décisions/lessons pertinentes ?)
6. Batch 20 threads suivants depuis data_cemetery

Critère de succès : 1 thread traité par le pipeline V2 complet sans erreur, résumé dense + décisions/lessons enrichies dans Notion, thread_clean archivé dans data_cemetery.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé**
- DS_ID decisions_structural = `3b054e65-6195-4bfe-8411-53bafe98b64b`
- retry_count max 2, blocage BLOCKED, intervention manuelle au-delà
- B09 exclu pipeline automatique
- raw_text mono-ligne jusqu'à implémentation V2
- Agents = V3 — ne pas implémenter avant V2 stable
- Notion MCP destructif = confirmation explicite requise
- Règle bump version : commiter avant renommer, `cp` pas `mv`

**À faire immédiatement**
- Implémenter pipeline V2 (priorité absolue)
- Documenter B99-T99 comme exception connue dans os-thread-close.mjs
- Tester retry_count depuis retry_count=0 proprement

**À ne pas faire**
- Modifier le schéma Notion sans plan de migration des données existantes
- Lancer batch 20 threads avant pipeline V2 testé sur 1 thread réel
- Lancer le close thread sans fournir le fichier thread source en phase 6

---

## Point de redémarrage minimal

- **Objectif** : implémenter pipeline V2 — clean + double passe LLM + nouveaux dossiers + schéma Notion enrichi
- **Acquis réels** : pipeline V1 stable (10 threads réels validés), architecture V2 complète documentée, prompts LLM v01 versionnés, contrat JSON enrichi validé, README v09 + PROMPT v10 actifs, remote Git + MCP opérationnels
- **Contraintes actives** : DS_ID `3b054e65-6195-4bfe-8411-53bafe98b64b`, retry max 2, B09 exclu pipeline, Notion MCP destructif = confirmation explicite
- **État actuel** : V1 stable, V2 architecture validée non implémentée, 72 threads non injectés, schéma Notion V1, agents V3 définis non implémentés
- **Prochaine étape** : créer dossiers V2 → refactoring ingest → update schéma Notion → test 1 thread réel → batch 20
