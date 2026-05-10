# INSIDE_OS_CONTEXT_v23
Date : 2026-05-10

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T34-Notion-Dev-022

**Statut : Stable**
**Version : v23**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

**Source du STOP :** Décision humaine — clôture B09-T34 après accomplissement des objectifs du thread.

**Pourquoi maintenant :** Toutes les dettes héritées de B09-T33 sont liquidées. Les décisions structurelles DEV/USER sont gravées. Le script os:pre-thread est opérationnel. Aucun travail en cours n'est laissé ouvert.

---

## 1. Intention réelle du thread

**Objectif réel :** Liquider les 6 dettes héritées de B09-T33 + audit repo + README v11 + script os:pre-thread + décisions structurelles DEV/USER.

**Problèmes résolus :**
- CONTEXT v22 auto-commité (inexact) supprimé du repo
- retry_count confirmé présent dans schéma Notion — fix P8 validé opérationnel
- Audit repo : 103 fichiers orphelins supprimés, repo propre
- README v10 → v11 commité — zéro occurrence de BLOCKED
- Miroir Notion BACKLOG mis à jour (B09-T33 → B09-T34)
- BACKLOG v34 finalisé : version explicite + section REPO + items SYSTEME P7/P8
- Script os:pre-thread implémenté et testé — remplace les 4 uploads manuels
- Pages Notion STRUCTURE & ENTITÉS + @3 avril supprimées (action Florent)
- Décisions structurelles DEV/USER gravées dans DECISIONS

**Dérive empêchée :** Restructurer le BACKLOG DEV/USER dans ce thread — repoussé proprement au prochain thread dédié.

---

## 2. Acquis réels

**Fix P8 validé :**
- retry_count présent dans schéma Notion thread_dump (type: number) confirmé via MCP
- Filtre `retry_count is_empty OR retry_count < 2` dans getCandidates() s'applique sur un champ réel
- Fix P8 commit 06216f0 est fonctionnellement opérationnel

**README v11 commité :**
- Ligne 107 : BLOCKED → `thread exclu de la boucle auto-pagination au-delà (retry_count >= 2), intervention manuelle requise`
- Ligne 427 : même correction
- Zéro occurrence de BLOCKED dans le repo après commit

**Audit repo :**
- 103 fichiers orphelins supprimés : dossier archive/, runtime/out/, scripts racine abandonnés
- Repo propre à la date de clôture

**Script os:pre-thread :**
- Commande : `npm run os:pre-thread`
- Produit : `PRE_THREAD_B09-TXX.md` — fichier de transfert de thread complet en une commande
- Remplace les 4 uploads manuels (README + PROMPT + CONTEXT + BACKLOG)
- Testé et fonctionnel — fichier `PRE_THREAD_B09-T35-Dev.md` produit en clôture de ce thread

**BACKLOG v34 :**
- Version explicite (v34) ajoutée dans l'en-tête
- Section REPO créée
- Items SYSTEME P7 (purge auto threads_to_process/ après inject réussi) et P8 (item à préciser — manque dans le dump fourni) ajoutés
- Miroir Notion BACKLOG mis à jour

**Décisions structurelles DEV/USER :**
- Deux chemins distincts : INSIDE OS DEV (infrastructure, pipeline) et INSIDE OS USER (usage, mémoire)
- Priorité DEV : atteindre beta USER le plus vite possible
- Nomenclature : B09-TXX-Dev-Sujet / B09-TXX-User-Sujet
- BACKLOG_DEV.md et BACKLOG_USER.md à créer dans un thread dédié

**État pipeline à la clôture :**
- 93 threads traités : extract_done 93 / inject_done 93 / inject_error 0 / inject_pending 0
- DECISIONS : 3647 | LESSONS : 3116
- Aucun thread bloqué

---

## 3. Hypothèses, intentions, paris

**Hypothèse non vérifiée — fix P8 en conditions réelles :**
retry_count est confirmé dans le schéma Notion, mais son comportement lors d'une vraie séquence inject_error → retry → retry_count >= 2 n'a pas été observé en production. Le fix est structurellement correct ; son effet réel sur un thread en erreur répétée reste à observer.

**Pari DEV/USER :**
La séparation en deux backlogs distincts est une décision structurelle logique, mais la frontière exacte DEV/USER sur certains items existants (notamment les items SYSTEME) n'a pas été tranchée. La migration du BACKLOG actuel vers BACKLOG_DEV.md / BACKLOG_USER.md peut révéler des ambiguïtés.

**Pari os:pre-thread :**
Le script est testé sur un cas (clôture B09-T34). Sa robustesse sur des threads de structure inhabituelle (thread User, thread de test, thread sans commits récents) n'est pas établie.

**Intention non actée — migration notion-memory-chat.mjs :**
Gravée en roadmap depuis plusieurs threads. Aucun travail n'a été engagé. La dépendance OpenAI GPT-4.1-mini reste active.

---

## 4. Contraintes actives à respecter

**Techniques :**
- B09 exclu du pipeline automatique — ne jamais injecter B09 dans le pipeline THREAD_DUMP → EXTRACT → INJECT
- CONTEXT vXX injecté en B99 — chemin spécifique, pas dans le flux standard
- data/test_threads/ : 4-5 fichiers max — ne pas laisser croître
- raw_text multi-lignes : ne pas toucher avant V2 (moteur recherche sémantique)
- DS_ID = identifiant API Notion uniquement — ne jamais interpréter autrement

**Organisationnelles :**
- Script os:pre-thread obligatoire en ouverture de thread — remplace les uploads manuels
- Clôture en 4 phases : CONTEXT vXX → BACKLOG → commit → push
- README = document de référence publique — tout changement doit être versionné
- Toute décision structurelle prise mid-thread doit être gravée dans DECISIONS, pas seulement dans le CONTEXT

**Règles non négociables :**
- Zéro [À COMPLÉTER] dans les documents de transfert
- Zéro invention de signification pour les acronymes techniques
- Aucune mise à jour du README sans bump de version

---

## 5. Architecture actuelle

**Ce qui fonctionne :**
- Pipeline THREAD_DUMP → EXTRACT → INJECT : opérationnel, 93/93 threads traités sans erreur
- MCP Notion : requêtes schéma, lecture/écriture pages — fonctionnel dans le thread
- Script os:pre-thread : opérationnel, testé
- Fix P8 (retry_count) : structurellement correct et champ réel confirmé
- Repo : propre après audit B09-T34

**En apparence fonctionnel mais non testé en conditions dégradées :**
- Fix P8 : correct sur papier, jamais observé sur un vrai cycle inject_error répété
- os:pre-thread : testé sur un seul cas nominal

**Fragile :**
- notion-memory-chat.mjs : dépendance OpenAI non migrée — si l'API OpenAI change de tarif ou de modèle, ce composant tombe sans alternative prête
- Miroir Notion BACKLOG : mis à jour manuellement — risque de dérive dès que le rythme de mise à jour baisse
- BACKLOG.md unique : va devenir ambigu dès que la séparation DEV/USER est actée (items SYSTEME à classer)

**Manque :**
- BACKLOG_DEV.md et BACKLOG_USER.md : non créés — décision prise, exécution repoussée
- Purge automatique threads_to_process/ après inject réussi : non implémentée (BACKLOG SYSTEME P7)
- Déploiement cloud : non engagé — dépend de la complétion de l'ingestion et de la stabilité du pipeline

---

## 6. Contradictions et incohérences détectées

**BACKLOG unique vs décision DEV/USER :**
La décision de séparer en BACKLOG_DEV.md / BACKLOG_USER.md est gravée, mais le BACKLOG.md actuel (v34) reste la seule source de vérité opérationnelle. Les deux états coexistent jusqu'au thread de migration — risque de confusion si un thread intermédiaire ajoute des items sans savoir dans quel backlog ils iront.

**Roadmap CONTEXT vs BACKLOG :**
La section ROADMAP GRAVÉE dans le CONTEXT mentionne `retry_count : propriété à ajouter dans THREAD_DUMP` — or retry_count est déjà présent dans le schéma Notion (confirmé en B09-T34). Cette ligne de roadmap est obsolète et doit être supprimée du prochain CONTEXT.

**os:pre-thread produit PRE_THREAD_B09-TXX.md :**
Le fichier produit porte un numéro de thread futur (B09-T35) dès la clôture de B09-T34. Si le prochain thread change de sujet ou de nomenclature (premier thread User par exemple), le nom du fichier sera incorrect. Le script n'est pas paramétrable sur ce point — manque de flexibilité.

---

## 7. Illusions à démonter

**"Le pipeline est stable donc le système est stable" :**
93/93 threads injectés sans erreur est un indicateur de pipeline, pas un indicateur de qualité des données. La cohérence des DECISIONS et LESSONS n'a pas été auditée depuis la purge lessons_learnings de B09-T33. Un pipeline sans erreur peut très bien avoir injecté des doublons ou des entrées mal structurées.

**"La séparation DEV/USER est une décision prise" :**
Elle est gravée dans DECISIONS. Elle n'est pas encore opérationnelle. Aucun fichier BACKLOG_DEV.md ou BACKLOG_USER.md n'existe. Aucun thread n'a été classé sous la nomenclature B09-TXX-User-Sujet. La décision existe, le système ne la reflète pas encore.

**"Le script os:pre-thread remplace les uploads manuels" :**
Il remplace les 4 uploads manuels pour le cas nominal. Tout thread atypique (User, test, urgence) nécessite de vérifier que le script produit le bon contenu. L'automatisation partielle crée un faux sentiment de robustesse.

**"retry_count >= 2 protège contre les boucles infinies" :**
Le filtre existe et s'applique sur un champ réel. Mais si le champ retry_count n'est jamais incrémenté (bug d'écriture dans le script d'injection), le filtre ne sert à rien. L'incrément n'a pas été audité dans ce thread.

---

## 8. Risques structurants

**Technique — incrément retry_count non audité :**
Le filtre `retry_count >= 2` protège uniquement si le script d'injection incrémente réellement ce champ à chaque échec. Cet incrément n'a pas été vérifié dans le code. Risque : boucle infinie sur un thread en erreur persistante si l'incrément est absent ou cassé.

**Technique — purge threads_to_process/ absente :**
Sans purge automatique après inject réussi, le dossier grossit indéfiniment. Sur volume élevé, risque de traitement en double si un fichier est relu par erreur après injection.

**Stratégique — migration BACKLOG avant beta USER :**
La création de BACKLOG_DEV.md / BACKLOG_USER.md est une dette qui bloque la clarté de priorité. Tant que le BACKLOG est unique, la frontière entre infrastructure et usage reste floue — risque de prioriser du DEV quand l'objectif déclaré est d'atteindre la beta USER.

**Stratégique — dépendance OpenAI non migrée :**
notion-memory-chat.mjs reste sur GPT-4.1-mini. Si ce composant est central dans le chemin vers la beta USER, la dépendance OpenAI est un risque de coût et de continuité non adressé.

**Faux pilotage — miroir Notion BACKLOG :**
Le miroir est mis à jour manuellement. Si la mise à jour est oubliée deux threads de suite, il y a deux sources de vérité divergentes (BACKLOG.md repo vs page Notion). Le BACKLOG.md repo fait foi, mais la divergence visible dans Notion crée de la confusion.

---

## 9. Fichiers produits dans ce thread

| Chemin | Statut |
|---|---|
| `docs/context/INSIDE_OS_CONTEXT_v22.md` | Supprimé du repo (git rm + commit) |
| `docs/README_INSIDE_OS_v11.md` | Créé et commité (remplace v10) |
| `docs/BACKLOG.md` (v34) | Mis à jour et commité |
| `PRE_THREAD_B09-T35-Dev.md` | Produit par os:pre-thread, commité |
| `scripts/os-pre-thread.mjs` (ou équivalent) | Créé et testé — os:pre-thread opérationnel |
| Page Notion INSIDE-OS-BACKLOG | Mise à jour via MCP |
| Page Notion STRUCTURE & ENTITÉS | Supprimée (action Florent) |
| Page Notion @3 avril 2026 13:38 | Supprimée (action Florent) |

**Manque d'information :** Le chemin exact du script os:pre-thread dans le repo n'est pas confirmé dans le dump fourni. À vérifier au démarrage de B09-T35.

---

## 10. Priorité réelle de redémarrage

**1 action :** Créer BACKLOG_DEV.md et BACKLOG_USER.md à partir du BACKLOG.md v34 — classifier chaque item existant.

**1 livrable :** BACKLOG_DEV.md + BACKLOG_USER.md commités, BACKLOG.md v34 archivé ou retiré comme source unique.

**1 critère de succès :** Chaque item du BACKLOG actuel est classé dans l'un des deux fichiers sans item en double et sans item perdu. Le thread suivant ouvre sur BACKLOG_DEV.md uniquement.

---

## 11. Discipline pour le prochain thread

**Socle verrouillé :**
- os:pre-thread en ouverture — vérifier que PRE_THREAD_B