# INSIDE_OS_CONTEXT_v22
Date : 2026-05-09

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T33-Notion-Dev-021

**Statut : Stable**
**Version : v22**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

**Source du STOP :** Décision humaine — clôture B09-T33 après accomplissement des objectifs du thread.

**Pourquoi :** Objectifs atteints (fix P8, audit Notion complet, nettoyage, architecture entities, protocole de clôture gravé). Aucun bug actif. Prêt pour B09-T34.

---

## 1. Intention réelle du thread

**Objectif réel :** Audit complet repo + Notion INSIDE_OS_DATABASES + fix P8 boucle infinie auto-pagination.

**Problèmes résolus :**
- Fix P8 : filtre `retry_count >= 2` dans `getCandidates()` — commit `06216f0`
- Nettoyage Notion : ds2/ds3 supprimés, 9 entrées test archivées, B99-T99-TEST-DENSE-NOCHUNK supprimé
- BACKLOG Notion INFRA P1 resynchronisé [TODO] → [DONE]
- Écart comptage 90/101 expliqué et clos
- Architecture entities créée (4 entités E01–E04, données à remplir)
- Protocole de clôture canonique défini en 4 phases, gravé dans PROMPT v11
- PROMPT v10 → v11
- BACKLOG mis à jour : P8 [DONE], SYSTEME P3/P4, INFRA P4 ajoutés

**Dérive empêchée :** Supprimer ds2/ds3 sans vérifier leur contenu — vérification faite avant toute action destructive. Supprimer STRUCTURE & ENTITÉS sans contrôle idem.

---

## 2. Acquis réels

**Fix P8 :**
- Commit `06216f0` — filtre `notBlocked` dans `getCandidates()` :
  `retry_count is_empty OR retry_count < 2`
- Appliqué sur `filterBase` → couvre `filterPending` ET `filterForce`
- Tout thread avec `retry_count >= 2` est exclu quelle que soit la valeur de `injection_status`

**Clarification structurelle critique :**
- `injection_status=BLOCKED` n'existe **pas** dans le schéma Notion thread_dump
- Valeurs réelles du schéma : `pending` / `done` / `error`
- Un thread bloqué = `injection_status=error` + `retry_count >= 2`
- Corrigé dans PROMPT v11 — README pas encore corrigé (prochain bump)

**Nettoyage Notion :**
- `lessons_learnings` ds2 + ds3 supprimés (vues + sources)
- 9 entrées test archivées (ds2 : 6, ds3 : 3) — déplacées, non détruites
- `B99-T99-TEST-DENSE-NOCHUNK` supprimé de thread_dump
- Page privée `STRUCTURE & ENTITÉS` et page `@3 avril 2026 13:38` : identifiées comme pages test → à supprimer (corbeille) — **non encore fait, action manuelle Florent**

**Architecture entities :**
- 4 entités créées dans INSIDE_OS_DATABASES : E01–E04
- Structure en place, données vides — à remplir par agent dédié en B09-T34 ou thread spécialisé

**Protocole de clôture canonique :**
- 4 phases définies et gravées dans PROMPT v11
- Désormais obligation de produire CONTEXT vXX + commiter + clôturer proprement à chaque fin de thread

**Thread oublié :**
- B09-T32 est encore dans `threads_to_process/` — ingest + inject non faits pendant B09-T33
- À traiter dès l'ouverture de B09-T34

**Décision gravée :**
- Ne jamais injecter `test_threads/` en production — règle non négociable

---

## 3. Hypothèses, intentions, paris

- **Architecture entities (E01–E04) :** Structure créée mais non remplie. Le remplissage par agent dédié est un pari — aucun test fait, aucun script vérifié pour cette base. Peut nécessiter un thread entier.
- **Fix P8 en production :** Commité et logiquement correct, mais non testé sur un vrai cas de thread bloqué (`retry_count >= 2` réel). La correction est structurellement saine, validation terrain manque.
- **Écart comptage "clos" :** Expliqué par les upserts B99 — raisonnement cohérent, mais non vérifié programmatiquement. Accepté comme explication suffisante, pas prouvé par log.
- **Pipeline cloud :** Mentionné dans la roadmap, aucune action engagée. Aucune estimation de délai, aucun prérequis validé.
- **Migration notion-memory-chat.mjs vers Claude :** Intention gravée, aucun travail commencé.

---

## 4. Contraintes actives à respecter

**Techniques :**
- B09 exclu du pipeline automatique — toujours manuel
- CONTEXT vXX injecté en B99, jamais en B09
- `injection_status=BLOCKED` n'existe pas dans Notion — ne jamais écrire cette valeur dans le code ni dans les docs
- Valeurs valides `injection_status` : `pending` / `done` / `error`
- `notion-memory-chat.mjs` reste sur `claude-haiku-4-5-20251001` — intentionnel, non migré
- `CLAUDE_MODEL` env var = `claude-sonnet-4-6` pour le pipeline principal
- `test_threads/` ne doit jamais être ingéré ni injecté en production
- Noms complets obligatoires dans `data_cemetery/` (format `B09-T32-Notion-Dev-020.txt`)
- `B09-T31.txt` dans `data_cemetery/` reste en nom court — orphelin documenté, non bloquant
- Notion MCP : confirmation manuelle requise avant toute action destructive

**Organisationnelles :**
- Protocole de clôture canonique en 4 phases obligatoire à chaque fin de thread
- Toute décision structurelle grave dans DECISIONS Notion
- Toute leçon opérationnelle grave dans LESSONS Notion
- `raw_text` multi-lignes : ne pas toucher avant implémentation V2 moteur sémantique
- `retry_count` : propriété à ajouter dans THREAD_DUMP (max 2 retries auto) — non encore implémenté côté schéma Notion

---

## 5. Architecture actuelle

**Ce qui fonctionne :**
- Pipeline THREAD_DUMP → EXTRACT → INJECT : stable, 91 threads inject_done
- Fix P8 en place : boucle auto-pagination ne se bloque plus sur threads error + retry_count >= 2
- `CLAUDE_MODEL` env var opérationnelle, injectée dans tous les scripts sauf `notion-memory-chat.mjs`
- `ANTHROPIC_API_KEY` restaurée dans ingest (commit `dc2484c`) après suppression accidentelle
- Protocole de clôture canonique gravé dans PROMPT v11
- INSIDE_OS_DATABASES : 10 bases présentes, nettoyées, cohérentes
- Architecture entities (E01–E04) : structure créée, données vides

**En apparence :**
- `retry_count` fonctionne comme garde-fou côté code — mais la propriété n'est pas encore dans le schéma Notion officiel (ou non documentée comme telle). Le fix P8 repose sur cette propriété sans que sa présence dans le schéma soit confirmée formellement dans ce thread.

**Fragile :**
- `notion-memory-chat.mjs` : script isolé, modèle figé, non intégré au protocole de versioning
- Architecture entities : structure vide, aucun agent ni script dédié défini
- README non corrigé pour `injection_status=BLOCKED` — risque de confusion au prochain thread si non corrigé rapidement

**Manque :**
- Aucun test automatisé sur le pipeline
- Déploiement cloud : non engagé, aucun prérequis validé
- B09-T32 non ingéré/injecté : trou dans la mémoire Notion

---

## 6. Contradictions et incohérences détectées

- **README vs PROMPT v11 sur `injection_status=BLOCKED` :** PROMPT v11 corrigé, README pas encore. Les deux documents décrivent la même architecture mais sont désynchronisés sur ce point. Risque de réintroduire l'erreur si le README est lu sans le PROMPT.
- **`retry_count` dans le code vs schéma Notion :** Fix P8 filtre sur `retry_count >= 2` dans le code. La propriété est supposée présente dans Notion (sinon le filtre ne fait rien), mais son ajout au schéma est listé en roadmap comme "à faire" (`retry_count` : propriété à ajouter). Contradiction possible entre l'état réel du schéma et l'état supposé par le code.
- **`B09-T31.txt` en nom court dans `data_cemetery/` :** La règle active exige des noms complets. Ce fichier viole la règle et est documenté comme "orphelin acceptable" — c'est une exception non normalisée.
- **BACKLOG.md vs Notion BACKLOG avant correction :** INFRA P1 était [DONE] dans le fichier, [TODO] dans Notion. Corrigé pendant B09-T33, mais indique que les deux sources peuvent dériver silencieusement entre deux threads.

---

## 7. Illusions à démonter

- **"Le pipeline est stable donc tout va bien."** 91 threads inject_done est un compteur de volume, pas un indicateur de qualité. La qualité des extractions (DECISIONS, LESSONS) n'a jamais été auditée sur un échantillon réel.
- **"Les entities E01–E04 sont en place."** La structure est créée. Sans données et sans agent de remplissage testé, ce sont des cases vides dans Notion — pas une fonctionnalité.
- **"L'écart comptage est résolu."** Il est expliqué de manière cohérente. Il n'est pas prouvé. Si l'explication est fausse, 11 threads sont perdus sans signal d'erreur.
- **"Fix P8 résout les boucles infinies."** Le fix couvre le cas connu. Si un thread se bloque pour une raison autre que `retry_count >= 2` (ex : erreur réseau persistante, propriété Notion corrompue), la boucle peut encore tourner.
- **"PROMPT v11 + CONTEXT v22 = mémoire complète."** Ces documents couvrent la session active. Les threads non encore ingérés/injectés (B09-T32 au minimum) représentent des décisions et leçons non versées dans Notion.

---

## 8. Risques structurants

**Techniques :**
- `retry_count` absent du schéma Notion officiel → fix P8 sans effet réel si la propriété n'existe pas dans les pages thread_dump — à vérifier en priorité en B09-T34
- README désynchronisé sur `injection_status` → risque de réintroduction du bug conceptuel dans un futur script
- Pipeline sans test automatisé → les régressions passent inaperçues jusqu'à un batch raté

**Stratégiques :**
- Architecture entities créée sans ownership ni calendrier → risque d'abandon silencieux
- B09-T32 non ingéré → trou de mémoire Notion qui grossit à chaque thread non traité
- Déploiement cloud non engagé → le système reste local, aucune résilience

**Faux pilotage :**
- THREAD_DUMP affiche `DECISIONS: 0 | LESSONS: 0` dans le THREAD_DUMP de ce thread — si le protocole de clôture n'a pas gravé les décisions/leçons dans Notion, le bilan de B09-T33 est incomplet indépendamment de ce CONTEXT
- Les métriques du THREAD_DUMP (inject_done, extract_done) mesurent le volume mais pas la pertinence ni l'exhaustivité

---

## 9. Fichiers produits dans ce thread

| Fichier | Chemin | Statut |
|---|---|---|
| CONTEXT v21 | `docs/INSIDE_OS_CONTEXT_v21.md` | Produit, commité (`01d3ec2`) |
| PROMPT v11 | `docs/PROMPT_MAITRE_v11_TRANSFERT_DE_THREAD.md` | Produit, commité (`01d3ec2`) |
| BACKLOG.md | `BACKLOG.md` | Mis à jour, commité (`01d3ec2`) |
| Fix P8 | `os/inject/inject-decisions-lessons.mjs` | Modifié, commité (`06216f0`) |
| CONTEXT v22 | `docs/INSIDE_OS_CONTEXT_v22.md` | **À commiter — non encore dans le repo** |
| B09-T33-Notion-Dev-021.txt | `data/data_cemetery/` | **À produire et archiver** |
| Pages Notion test | INSIDE_OS_DATABASES | **Suppression manuelle Florent : `STRUCTURE & ENTITÉS` + `@3 avril 2026 13:38`** |

---

## 10. Priorité réelle de redémarrage

**1 action :** Vérifier que la propriété `retry_count` existe bien dans le schéma des pages thread_dump dans Notion — si absente, l'ajouter avant tout nouveau batch d'injection.

**1 livrable :** B09-T32 ingéré et injecté (thread oublié, trou de mémoire actif).

**1 critère de succès :** `inject_done` passe à 92, aucun thread reste dans `threads_to_process/` après le batch.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé :**
- Protocole de clôture canonique en 4 phases — obligatoire, non négociable
- Jamais d'action destructive Notion sans vérification du contenu au préalable
- `injection_status=BLOCKED` n'existe pas — ne pas écrire, ne pas coder, ne pas documenter
- `test_threads/` ne touche jamais le pipeline production

**À clarifier en B09-T34 :**
- Présence réelle de `retry_count` dans le schéma Notion thread_dump
- Suppression manuelle des 2 pages test Notion (`STRUCTURE & ENTITÉS`, `@3 avril 2026 13:38`)
- Correction README sur `injection_status`

**À tester :**
- Fix P8 sur un vrai cas de thread bloqué (forcer `retry_count >= 2` sur un thread de test)

**À versionner :**
- CONTEXT v22 → commit dans le repo après validation hum