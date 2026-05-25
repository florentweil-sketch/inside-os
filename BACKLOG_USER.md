# INSIDE OS — BACKLOG USER

Derniere mise a jour : 2026-05-25 (B09-T40)
Version : v06
Pilote : L'Associe + agents metier (B01-B08)
Coordination technique : Agent Integration IA (B09)

Regle : ce fichier est mis a jour a chaque thread B09-User via Claude Code.
Miroir Notion : page INSIDE-OS-BACKLOG-USER (a creer).

---

## AGENTS

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Cadrage L'Associe — PROMPT_ASSOCIE_v02.md produit et commite dans docs/prompts/ | B09-T35 | [DONE] |
| P2 | Agent Integration IA — conception, deploiement et orchestration des agents IA dans INSIDE OS. Bucket B09. Gardien de la coherence du reseau d'agents | B09-T35 | [TODO] |
| P3 | Implementer sous-agents specialises F&A Capital (architecture V3) | B09-T35 | [ROADMAP] |
| P4 | Deep probing inter-agents | B09-T35 | [ROADMAP] |
| P5 | Memoire relationnelle ENTITIES — agent dedie | B09-T35 | [ROADMAP] |
| P6 | Agents personnels Florent (Developpement Personnel, Sante, Vie Privee, Patrimoine) | B09-T35 | [ROADMAP] |
| P7 | Agent Infrastructure & Tech — prompt v02 produit (B09-T38). Prochaine étape : routing, accès mémoire Supabase, test comportement | B09-T38 | [TODO] |
| P8 | Agent classifieur documents metier — routing automatique IA des documents entrants (emails, devis, contrats, factures) vers DB Notion cible et/ou dossier repo. Acces memoire INSIDE OS. Complement du script tri repo (BACKLOG_DEV SYSTEME P13) | B09-T37 | [TODO] |
| P9 | Routing modèle adaptatif du pilotage (perf prioritaire, coût optimisé). Migration GPT→Claude DÉJÀ faite (vérifié code B09-T39 : chat claude-haiku-4-5, server claude-sonnet-4-6 ; commentaire server ligne 4 « Remplace OpenAI par Claude »). Le libellé précédent « migrer de GPT-4.1-mini » était un faux TODO hérité d'un CONTEXT non vérifié. Vraie action : rendre le choix de modèle adaptatif selon la complexité de la requête — « à performance équivalente, prendre le moins cher ; monter en Opus 4.7 (claude-opus-4-7) uniquement quand la tâche exige le raisonnement maximum ». Réglage via CLAUDE_MODEL (server). Prérequis : (a) re-benchmark coût (tokenizer Opus 1,0-1,35× + tarif 5/25 $) ; (b) définir le critère de routing Opus/Sonnet/Haiku ; (c) vérifier prompts pilotage (Opus 4.7 plus littéral). Gain : meilleure résistance aux fausses affirmations (aligné règle anti-hallucination). | B09-T39 | [TODO] |
| P10 | Vérificateur de prompt adapté au modèle : composant qui valide qu'un prompt est calibré pour le modèle cible avant envoi (Opus 4.7 interprète littéralement, Sonnet plus souple). Anti-hallucination appliqué au pilotage — ne pas supposer qu'un prompt calé pour un modèle se comporte pareil sur un autre. Lié à P9 (routing adaptatif). | B09-T39 | [TODO] |
| P11 | **PREMIER AGENT DE PILOTAGE AGENTIQUE** (PAS Action — un agent en lecture seule interroge la mémoire pour éclairer, il n'exécute rien dans le monde ; la couche Action reste vide). Agent Synthèse : lit la mémoire (DECISIONS / LESSONS / THREAD_DUMP), produit une synthèse consolidée, citée, sans rien combler. Lecture seule, autonome par construction (aucun effet de bord). Prompt v01 + spec d'exécution produits (B09-T40). ORDRE TRANCHÉ : Synthèse avant L'Associé — priorité « système opérationnel fiable d'abord ». RÔLE RÉEL (recadré B09-T40, note de recadrage) : ne PAS servir à rafraîchir un chiffre figé dans un prompt (ce serait soigner la fuite avec un seau). Il fournit l'état vivant À LA DEMANDE — sa valeur est de DÉMONTRER que figer l'état dans les fichiers de doctrine est inutile (le figement devient superflu quand l'état est disponible vivant = démonstration de P20). Prochaine étape : implémentation (os/agents/synthese/, npm run os:synthese). | B09-T40 | [TODO] |

---

## MEMOIRE

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Ingestion massive threads business (mails, dossiers, historique multi-annees) — phase beta USER | B09-T34 | [ROADMAP] |
| P2 | Statut sources externes L'Associe — trancher injection dans INSIDE OS vs consultation ponctuelle | B09-T35 | [TODO] |

---

## UI USER

| Priorite | Item | Source | Statut |
|----------|------|--------|--------|
| P1 | Interface memoire INSIDE OS (agents V3 / L'Associe) — priorite user : interface friendly avant tout | B09-T32 | [ROADMAP] |

---

## LEGENDE

[TODO]    = priorite active
[ROADMAP] = decide, pas encore planifie
[DONE]    = implemente et valide
