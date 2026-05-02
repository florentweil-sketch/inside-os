# INSIDE_OS_CONTEXT_v16
Date : 2026-05-02

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T28-Notion-Dev-016

**Statut : Stable**
**Version : v16**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

Thread clôturé après consolidation post-batch : 14 threads ingestés (13 extraits/injectés avec succès, 1 en attente), correction bug écrasement statuts validée en production, documentation DS_ID complétée, PROMPT v10 produit, CONTEXT v16 généré.

**Source du STOP :** Détection automatique — 13/14 threads inject_done, 1 inject_pending, 0 erreur système. État stable après validation pipeline batch 10 + correction bug ingest. Pas de décision humaine explicite enregistrée — inférence basée sur état THREAD_DUMP et absence d'erreur bloquante.

---

## 1. Intention réelle du thread

**Objectif réel :** Consolider acquis B09-T27, finaliser documentation DS_ID, itérer PROMPT_MAITRE (v08→v10), traiter inject_pending restant du batch 10, valider stabilité pipeline après patch ingest.

**Problème concret :** 1 thread inject_pending sur 14, nécessité de documenter DS_ID dans toute la chaîne (PROMPT/CONTEXT), besoin d'itération PROMPT suite retours terrain.

**Dérive empêchée :** Relancer batch 11 sans consolider inject_pending. Laisser DS_ID non documenté dans CONTEXT v16. Avancer sur features (agents/UI) sans valider stabilité post-patch.

---

## 2. Acquis réels

**Pipeline batch 10+4 — validé en production**
- 14 threads ingestés : B01-T01, B01-T02, B02-T01, B02-T02, B03-T01, B03-T02, B04-T01, B05-T01, B06-T01, B07-T01 + 4 threads non identifiés
- extract_done : 13/14 ✅
- inject_done : 13/14 ✅
- inject_pending : 1/14 (identité non précisée dans THREAD_DUMP)
- inject_error : 0 ✅
- Bug écrasement statuts ingest confirmé résolu en production (aucun retour de statut done→pending détecté) ✅

**Documentation DS_ID — complétée**
- DS_ID = Data Source ID (identifiant API Notion) documenté dans PROMPT v08/v09/v10 ✅
- Règle absolue ajoutée : "Ne jamais interpréter DS_ID autrement qu'identifiant API Notion" ✅
- Signalement explicite dans CONTEXT v16 (cette version) ✅

**PROMPT_MAITRE — itération v08→v10**
- v08 : Documentation DS_ID + règle absolue anti-interprétation ✅
- v09 : [contenu non précisé — fichier modifié détecté] ✅
- v10 : [contenu non précisé — fichier modifié détecté] ✅
- 3 itérations successives = signal ajustements terrain ou clarifications contextuelles

**Commits récents — tracés**
- `0668bae` : ajout threads_to_process dans .gitignore ✅
- `f935702` : patch ingest (guard pré-ingest + préservation statuts done) ✅
- `2756a4b` : archivage B09-T24/T25/T26 dans data_cemetery ✅

**Architecture de mémoire — stable**
- 242 DECISIONS + 238 LESSONS injectées dans Notion ✅
- Pipeline THREAD_DUMP → EXTRACT → INJECT opérationnel sur données réelles ✅
- Aucun thread bloqué détecté ✅

---

## 3. Hypothèses, intentions, paris

**Hypothèse inject_pending restant**
- 1 thread inject_pending = probablement latence API Notion, pas erreur système (inject_error: 0).
- **À prouver :** Relancer inject ou attendre timeout résout inject_pending sans intervention manuelle.
- **Risque :** inject_pending = erreur silencieuse non remontée dans statuts (ex : rate limit API, timeout réseau).

**Intention PROMPT v10**
- 3 itérations successives (v08→v10) = signal ajustements terrain.
- **Hypothèse :** v10 intègre retours utilisateur Florent ou clarifications post-batch 10.
- **Non vérifié :** Contenu exact v09/v10 — fichiers modifiés détectés mais diff non fourni.

**Pari stabilité pipeline post-patch**
- Correction bug ingest validée sur batch 10 = patch robuste.
- **À prouver :** Batch 11 (70+ threads restants) sans régression statuts.
- **Risque :** Edge cases non couverts par batch 10 (ex : threads avec propriétés Notion custom, relations complexes).

**Intention agents exécutants**
- Vision clarifiée B09-T27 : agents = collaborateurs permanents, pas conseillers.
- **Non vérifié :** Périmètre d'action agents jamais défini dans CONTEXT v15 (phrase coupée : "Périmètre d'action").
- **À clarifier :** Quelles actions autorisées sans validation humaine ? Seuils décisionnels ? Protocole escalade ?

---

## 4. Contraintes actives à respecter

**Techniques**
- DS_ID = Data Source ID (identifiant API Notion) — ne jamais interpréter autrement ✅
- raw_text multi-lignes : ne pas toucher avant V2 (moteur recherche sémantique) ✅
- retry_count : propriété à ajouter dans THREAD_DUMP (max 2 retries auto sur inject_error) — **non implémenté** ⚠️
- B09 exclu du pipeline automatique (threads dev/méta) ✅
- CONTEXT vXX injecté en B99 uniquement ✅
- threads_to_process/ = données sensibles → .gitignore ✅

**Organisationnelles**
- Pipeline validé sur données réelles avant déploiement features (agents/UI) ✅
- Archivage obligatoire dans data_cemetery après injection ✅
- Aucun fichier vide ni [À COMPLÉTER] dans CONTEXT — signaler manque explicitement ✅
- Zéro formulation flatteuse, zéro récit rassurant dans CONTEXT ✅

**Règles non négociables**
- THREAD_DUMP = source de vérité état pipeline ✅
- Notion = mémoire/état | Node = orchestration | LLM = extraction/génération ✅
- Toute modification ingest/extract/inject = commit tracé + test sur batch réel avant production ✅

---

## 5. Architecture actuelle

**Ce qui fonctionne**
- Pipeline THREAD_DUMP → EXTRACT → INJECT stable sur 13/14 threads batch 10 ✅
- Guard pré-ingest bloque écrasement statuts done ✅
- Mode batch/test interactif ingest opérationnel ✅
- Notion API écriture/lecture DECISIONS/LESSONS validée ✅
- Archivage automatique data_cemetery après injection ✅

**En apparence stable mais non testé sous charge**
- Gestion 1 inject_pending isolé — comportement sur 10+ pending simultanés inconnu
- Retry automatique inject_error — retry_count non implémenté dans THREAD_DUMP (détection boucle infinie impossible)
- API Notion rate limits — aucun test 50+ threads/heure effectué

**Fragile**
- Migration notion-memory-chat.mjs OpenAI→Claude annoncée mais non effectuée — dépendance OpenAI GPT-4.1-mini active
- raw_text mono-ligne stocké — perte structure paragraphes/listes (accepté temporairement, à corriger V2)
- PROMPT_MAITRE itérations rapides (v08→v10 en 1 thread) — signal instabilité spécifications ou retours terrain non anticipés

**Manque**
- retry_count dans THREAD_DUMP (implémentation reportée) ⚠️
- Logs structurés inject_pending (impossible tracer cause latence vs erreur silencieuse) ⚠️
- Tests automatisés pipeline (validation manuelle uniquement) ⚠️
- Monitoring API Notion (rate limits, timeouts, erreurs réseau non tracés) ⚠️
- Périmètre d'action agents défini (phrase coupée CONTEXT v15) ⚠️

---

## 6. Contradictions et incohérences détectées

**Contradiction retry_count**
- CONTEXT v15 : "retry_count : propriété à ajouter dans THREAD_DUMP (max 2 retries auto sur inject_error)"
- THREAD_DUMP B09-T28 : retry_count non présent dans propriétés listées
- **Impact :** Impossible implémenter retry automatique tant que propriété absente — risque boucle infinie sur inject_error persistant

**Incohérence inject_pending**
- 1 inject_pending + 0 inject_error = état ambigu
- **Question :** inject_pending = attente API ou erreur silencieuse non remontée ?
- **Manque :** Logs différenciant latence normale vs timeout/rate limit

**Contradiction vision agents**
- CONTEXT v15 : "agents = collaborateurs exécutants permanents, pas juste conseillers"
- CONTEXT v15 : "Périmètre d'action" [phrase coupée, jamais complétée]
- **Impact :** Vision stratégique affirmée mais périmètre opérationnel non défini = risque dérive exécution agents sans garde-fous

**Incohérence priorisation**
- CONTEXT v15 : "Déploiement cloud : priorité après ingestion complète des 82 threads"
- État actuel : 14/82 threads injectés (17% complété), mais 3 itérations PROMPT_MAITRE dans ce thread
- **Signal :** Temps investi itérations PROMPT > temps résolution inject_pending ou batch 11 — drift priorités ?

---

## 7. Illusions à démonter

**Illusion "pipeline stable"**
- 13/14 threads OK ≠ pipeline robuste à 70+ threads restants
- Batch 10 = threads structure simple (dev personnel, organigramme, conventions) — pas testé sur threads complexes (ex : relations Notion multiples, propriétés custom, raw_text 10k+ mots)

**Illusion "bug ingest résolu définitivement"**
- Patch f935702 résout écrasement statuts done → pending
- **Non testé :** Comportement si update Notion simultané (conflit écriture API), si propriété corrompue (null/undefined), si thread supprimé manuellement dans Notion après ingest

**Illusion "inject_pending = latence normale"**
- 0 inject_error ≠ absence d'erreur — erreurs réseau/timeout peuvent ne pas remonter en inject_error si gestion erreur incomplète
- **À prouver :** inject_pending résolu automatiquement sans intervention

**Illusion "agents = collaborateurs exécutants"**
- Vision stratégique claire ≠ implémentation actionable
- **Manque :** Périmètre d'action, seuils décisionnels, protocole escalade, interface humain-agent définis
- Risque : discours ambitieux sans fondations techniques = pilotage par narrative

**Illusion "DS_ID documenté = problème résolu"**
- Règle absolue ajoutée dans PROMPT v08/v09/v10 + CONTEXT v16
- **Non vérifié :** DS_ID mal interprété dans threads précédents ? Impact rétroactif sur DECISIONS/LESSONS injectées ?

---

## 8. Risques structurants

**Techniques**
- **Risque inject_pending non résolu** : Si 1/14 pending aujourd'hui, projection 5-10/82 pending batch 11 → investigation manuelle chronophage, blocage pipeline
- **Risque absence retry_count** : inject_error sur thread complexe → retry manuel obligatoire ou perte thread (aucun mécanisme auto-recovery)
- **Risque raw_text mono-ligne** : Recherche sémantique V2 compromise si structure document perdue (paragraphes/listes/hiérarchie effacées)
- **Risque dépendance OpenAI** : Migration Claude annoncée mais non effectuée → vendor lock-in, coûts API non optimisés, latence requêtes non mesurée

**Stratégiques**
- **Risque drift priorités** : 3 itérations PROMPT dans 1 thread vs 1 inject_pending non résolu → signal focus documentation > exécution ?
- **Risque déploiement prématuré** : 17% threads injectés, agents non implémentés, monitoring absent → pression déploiement cloud = dette technique massive
- **Risque vision agents floue** : "Collaborateurs exécutants" sans périmètre défini → risque actions destructrices (suppression données, modifications Notion non validées) ou paralysie décisionnelle (tout escalade)

**Faux pilotage**
- **Risque narrative "pipeline validé"** : 13/14 threads OK présentés comme succès → masque inject_pending non diagnostiqué, edge cases non testés, monitoring absent
- **Risque itérations PROMPT rapides** : v08→v10 en 1 thread = ajustements terrain ou instabilité spécifications ? Sans contenu diff, impossible valider pertinence itérations
- **Risque CONTEXT rassurant** : Tentation lisser contradictions (ex : "inject_pending résolu prochainement") au lieu nommer blocages explicitement

---

## 9. Fichiers produits dans ce thread

**Fichiers modifiés (16 fichiers détectés)**
```
data/threads_to_process/B01-T01-Developpement-personnel.txt — Statut : extrait + injecté ✅
data/threads_to_process/B01-T02-Memoire-frontale-QI.txt — Statut : extrait + injecté ✅
data/threads_to_process/B02-T01-Organigramme-Inside-SAS.txt — Statut : extrait + injecté ✅
data/threads_to_process/B02-T02-Charte-EPI-batiment.txt — Statut : extrait + injecté ✅
data/threads_to_process/B03-T01-FA-Capital-V1.0.txt — Statut : extrait + injecté ✅
data/threads_to_process/B03-T02-FA-Capital-V1.1.txt — Statut : extrait + injecté ✅
data/threads_to_process/B04-T01-Elior-convention-Florent.txt — Statut : extrait + injecté ✅
data/threads_to_process/B05-T01-Contexte-marketing.txt — Statut : extrait +