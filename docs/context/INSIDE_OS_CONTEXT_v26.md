# INSIDE_OS_CONTEXT_v26
Date : 2026-05-16

---

## CONTEXTE DE TRANSFERT CRITIQUE — INSIDE OS / B09-T36-Notion-Dev-024

**Statut : Stable**
**Version : v26**
**Niveau de confiance : Élevé**

---

## 0. Signal de continuité

**Source du STOP :** Clôture après session étendue couvrant B09-T36 + B09-T37 (déclaré nul). Décision humaine volontaire.

**Pourquoi :** Objectifs principaux de B09-T36 atteints (P9, P10, BACKLOG_DEV/USER). B09-T37 absorbé dans v25/v26 sans injection pipeline — choix architectural délibéré.

**Ce que couvre ce CONTEXT v26 :** Consolidation post-session étendue. Aucun nouveau thread de travail n'a été ouvert entre v25 et v26. Ce document est une mise à jour de continuité, pas un rapport de session.

---

## 1. Intention réelle du thread

**Objectif déclaré :** Sandbox Notion (INFRA P5) + PIPELINE P9/P10 + BACKLOG_DEV/USER.

**Objectif réel accompli :**
- P9 : tokenizer diacritiques corrigé + MIN_SCORE=15 → qualité DB portée à 9/9
- P10 : désambiguïsation "associé" humain vs agent IA dans scoring
- BACKLOG_DEV v03 + BACKLOG_USER v03 : scission complète, P12-P15 ajoutés
- Sandbox Notion : workspace créé, .env.test configuré — arrêt sur API dépréciée

**Dérive empêchée :** Tentative de créer la sandbox dans F&A CAPITAL (page au lieu de workspace). Corrigé en session — workspace INSIDE-OS-SANDBOX distinct créé.

**Objectif non accompli :**
- Bases de données sandbox non créées (bloqué API dépréciée)
- SYSTEME P2, P9, P15 : décidés, non implémentés
- Agent Intégration IA : défini, non codé

---

## 2. Acquis réels

**PIPELINE P9 — tokenizer + MIN_SCORE [commit 0fd15f6] :**
- Bug corrigé : `.replace(/\p{Diacritic}/gu, " ")` → `""` dans `normalizeText` (notion-memory-chat.mjs)
- MIN_SCORE=15 ajouté dans notion-memory-chat.mjs
- Effet : résidu qualité 0.5/9 éliminé → DB à 9/9 pertinence

**PIPELINE P10 — désambiguïsation associé [commit 6c14619] :**
- Collision lexicale "associé" humain vs agent IA résolue dans scoring
- Règle fiche différenciation ajoutée dans PROMPT_ASSOCIE v02

**BACKLOG scindé :**
- BACKLOG_DEV v03 : P12-P15 ajoutés, SYSTEME P2 mécanisme gravé
- BACKLOG_USER v03 : AGENTS P7/P8 ajoutés, P1 mis à jour v02

**PROMPT_ASSOCIE v02 :**
- Agent Directeur des Achats (B03) défini
- Agent Classifieur Documents défini
- Règle fiche différenciation humain/agent gravée

**PROMPT_MAITRE v13 :**
- IDEAS.md / os:idea ajoutés
- Fichiers critiques étendus : ingest-pass1/2, .env.example
- SYSTEME P2 Option A documentée
- Section sécurité/backup intégrée

**README v12 :**
- Section Sécurité & Backup ajoutée
- VERIFY_PASS=always
- Push BACKLOG Notion en clôture

**Pipeline état :**
- 95 threads | extract_done: 95 | inject_done: 95 | inject_pending: 0 | inject_error: 0
- DECISIONS : 3767 | LESSONS : 3214
- Aucun thread bloqué

**Commits session :**
- db58947 : chore: regularisation PRE_THREAD archives + nouveau PRE_THREAD T37
- f038199 : feat(pre-thread): P10+P11 DONE — BACKLOG_DEV/USER/PROMPT_ASSOCIE + archivage auto PRE_THREAD
- 9867ca1 : chore: restructuration repo + fichiers critiques v25 session B09-T36/T37

---

## 3. Hypothèses, intentions, paris

**Hypothèses non vérifiées :**
- MIN_SCORE=15 est le bon seuil — choisi empiriquement, pas testé sur corpus élargi. Risque : exclusion de lessons légitimes courtes ou rejection trop sévère sur nouveaux threads.
- La désambiguïsation P10 est suffisamment robuste — testée sur cas connus, pas sur cas limites (ex : agent avec prénom humain, humain avec rôle IA-like).
- La sandbox bloquée sur API dépréciée sera débloquée "après Supabase" — délai réel inconnu, dépendance externe non pilotable.

**Paris stratégiques :**
- Absorber B09-T37 dans v25 sans injection pipeline est un pari de propreté — risque de perte si le CONTEXT v25/v26 est lui-même mal injecté ou corrompu.
- Supabase comme prochain pivot infrastructure : décision prise, pas encore de date, pas de POC.

**Ce qui reste à prouver :**
- SYSTEME P2 (mécanisme clôture thread) : l'Option A fonctionne réellement dans os-thread-close.mjs — non implémenté.
- IDEAS.md inter-thread : concept validé conceptuellement, zéro ligne de code.

---

## 4. Contraintes actives à respecter

**Techniques non négociables :**
- B09 exclu du pipeline automatique — jamais injecter B09 en pipeline standard
- CONTEXT vXX injecté uniquement en B99
- raw_text multi-lignes : ne pas toucher avant V2 (moteur sémantique)
- retry_count : propriété à ajouter THREAD_DUMP (max 2 retries auto sur inject_error) — pas encore implémentée, ne pas contourner avec un hack manuel
- Sandbox : bases de données non créées — ne pas utiliser .env.test en prod ni pointer .env.test vers F&A CAPITAL

**Organisationnelles :**
- Aucun fichier critique modifié sans commit immédiat
- BACKLOG_DEV et BACKLOG_USER : toujours versionner ensemble
- VERIFY_PASS=always : ne jamais bypasser
- Push BACKLOG Notion en clôture de chaque thread

**Règles système :**
- DS_ID = identifiant API Notion uniquement — jamais interpréter autrement
- PROMPT_MAITRE et README : toujours synchronisés sur les règles de sécurité

---

## 5. Architecture actuelle

**Ce qui fonctionne :**
- Pipeline THREAD_DUMP → EXTRACT → INJECT : stable, 95/95, zéro erreur
- DB Notion : 9/9 pertinence post-P9
- BACKLOG_DEV/USER : structure propre, versionnée
- Scoring P10 : désambiguïsation active en production
- Archivage PRE_THREAD : automatisé (commit f038199)

**En apparence fonctionnel (non vérifié en profondeur) :**
- MIN_SCORE=15 : seuil actif, non audité sur corpus complet
- PROMPT_ASSOCIE v02 : agents définis textuellement, aucun test d'exécution réel
- notion-memory-chat.mjs : opérationnel sur GPT-4.1-mini — migration Claude décidée, non faite

**Fragile :**
- Sandbox Notion : workspace existant, .env.test configuré, zéro base de données — inutilisable en l'état
- SYSTEME P2 : mécanisme décidé (Option A), zéro code dans os-thread-close.mjs
- Sécurité/backup : règles écrites dans README + PROMPT MAITRE, aucun test de restauration effectué

**Manque explicite :**
- IDEAS.md : fichier décidé, non créé
- PIPELINE P12 : vérification .env.example — à faire en Claude Code, non fait
- Agent Intégration IA : défini conceptuellement, non implémenté
- Supabase : aucun POC, aucune date, aucune spec technique

---

## 6. Contradictions et incohérences détectées

1. **Sandbox déclarée "bloquée API dépréciée" → repoussée après Supabase.** Or Supabase est lui-même sans date ni spec. La sandbox ne sera probablement jamais créée dans Notion — la décision implicite est d'abandonner la sandbox Notion sans le dire explicitement.

2. **B09-T37 déclaré "nul et non conservé"** mais ses acquis sont intégrés dans v25 et dans les fichiers critiques. Ce n'est pas un thread nul — c'est un thread non injecté en pipeline. La terminologie est inexacte et peut créer de la confusion en relecture.

3. **VERIFY_PASS=always dans README** mais aucun mécanisme technique n'enforce cette règle — c'est une convention documentaire, pas un guard. Risque de dérive silencieuse.

4. **Migration notion-memory-chat.mjs vers Claude** : décidée depuis au moins v23, présente en ROADMAP, sans aucun ticket concret ni critère de déclenchement. Elle reste dans la liste sans jamais avancer.

5. **SYSTEME P9 (perte fin de thread)** : identifié comme non résolu depuis plusieurs versions de CONTEXT. Aucune tentative de solution dans B09-T36. Le problème est nommé mais jamais priorisé réellement.

---

## 7. Illusions à démonter

**"La DB est à 9/9 — c'est réglé."**
MIN_SCORE=15 filtre les entrées faibles mais ne garantit pas la qualité sémantique des entrées qui passent. Le score mesure un seuil de présence lexicale, pas la pertinence réelle. 9/9 est un indicateur de surface.

**"Le thread T37 est absorbé proprement."**
T37 est non injecté et non archivé en pipeline. Ses décisions vivent uniquement dans v25/v26 et les fichiers critiques. Si un de ces fichiers est corrompu ou mal versionné, T37 disparaît sans trace récupérable.

**"La sandbox est prête à l'emploi dès que l'API est disponible."**
Le workspace existe et .env.test est configuré. Mais les bases de données Notion (THREAD_DUMP, DECISIONS, LESSONS) ne sont pas créées. Ce n'est pas "prêt" — c'est un environnement vide avec des credentials.

**"L'architecture agents est définie."**
Deux agents supplémentaires ont été nommés et décrits textuellement. Il n'y a aucun code, aucun test, aucune intégration. "Défini" = "décrit dans un fichier markdown".

**"Le pipeline est stable."**
95/95 inject_done est un état instantané. Aucun mécanisme de monitoring continu n'existe. La stabilité n'est pas prouvée — elle est observée sur le dernier run.

---

## 8. Risques structurants

**Techniques :**
- **Perte de T37** : zéro redondance si CONTEXT v25/v26 ou fichiers critiques sont corrompus
- **Sandbox inutilisable indéfiniment** : sans créer les bases de données, les tests pipeline ne peuvent pas être isolés de la prod — tout développement futur touchera F&A CAPITAL directement
- **SYSTEME P2 non implémenté** : chaque clôture de thread reste manuelle et sujette à oubli ou erreur
- **GPT-4.1-mini toujours en prod** : migration Claude bloquée sans critère de déclenchement → dette technique croissante

**Stratégiques :**
- **Supabase sans date ni spec** : pivot infrastructure annoncé mais sans engagement réel — risque de rester en attente indéfinie pendant que la dette Notion s'accumule
- **BACKLOG_DEV/USER grossit sans priorisation forcée** : P12-P15 ajoutés sans retirer d'items — le backlog devient une liste de souhaits, pas un outil de pilotage

**Faux pilotage :**
- **95/95 comme indicateur de santé** : mesure la complétion du run, pas la qualité des données injectées ni la pertinence des DECISIONS/LESSONS extraites
- **Nombre de DECISIONS (3767) et LESSONS (3214)** : volume sans audit qualité — on ne sait pas combien sont réellement utiles en retrieval

---

## 9. Fichiers produits dans ce thread

| Fichier | Chemin | Statut |
|---|---|---|
| notion-memory-chat.mjs | racine projet | Modifié — P9 tokenizer + MIN_SCORE=15 [commit 0fd15f6] |
| PIPELINE P10 scoring | notion-memory-chat.mjs | Modifié — désambiguïsation associé [commit 6c14619] |
| BACKLOG_DEV.md | racine projet | v03 — P12-P15 ajoutés |
| BACKLOG_USER.md | racine projet | v03 — AGENTS P7/P8 ajoutés |
| PROMPT_ASSOCIE_v02.md | racine projet | Créé — agents Achats + Classifieur + règle différenciation |
| PROMPT_MAITRE_v13.md | racine projet | Mis à jour — IDEAS.md, sécurité, SYSTEME P2 Option A |
| README_INSIDE_OS_v12.md | racine projet | Mis à jour — Sécurité & Backup, VERIFY_PASS, push BACKLOG |
| INSIDE_OS_CONTEXT_v25.md | racine projet | Créé — couverture B09-T36 + T37 absorbé |
| INSIDE_OS_CONTEXT_v26.md | racine projet | Ce document — continuité post-session étendue |
| .env.test | racine projet | Créé — sandbox credentials configurés, bases de données absentes |
| PRE_THREAD T37 | archives PRE_THREAD | Créé puis archivé (thread déclaré nul) [commit db58947] |

**Manque signalé :** IDEAS.md non créé malgré décision prise. PIPELINE P12 non exécuté.

---

## 10. Priorité réelle de redémarrage

**1 action :** Implémenter SYSTEME P2 Option A dans os-thread-close.mjs — mécanisme de clôture automatique capturant l'état de fin de thread.

**1 livrable :** os-thread-close.mjs modifié + test de cl