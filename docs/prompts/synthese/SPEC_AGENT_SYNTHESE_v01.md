# SPEC D'EXÉCUTION — Agent Synthèse v01
Produit dans : B09-T40-Notion-Dev-028
Cible : implémentation par l'Agent Infrastructure & Tech / Claude Code

Ce document décrit COMMENT l'Agent Synthèse tourne dans la stack réelle.
Le prompt système (PROMPT_AGENT_SYNTHESE_v01.md) décrit CE QU'il fait.

---

## 1. Place dans le repo

Proposition (à valider par Infra-Tech, cohérente avec l'arbo CLAUDE.md) :

```
os/
  agents/
    synthese/
      run.mjs            → point d'entrée CLI
      synthese.mjs       → logique : routing datasource + appel LLM + formatage
  prompts/
    agents/
      synthese/
        PROMPT_AGENT_SYNTHESE_v01.md   → versionné, jamais écrasé
  lib/
    notion.mjs           → EXISTANT (queryDataSource) — réutilisé tel quel
    claude.mjs           → EXISTANT — réutilisé tel quel
    config.mjs           → EXISTANT (.env) — réutilisé tel quel
```

Commande npm proposée : `npm run os:synthese -- --sujet "état technique du système"`

---

## 2. Flux d'exécution

```
1. Charger le prompt système (prompts/agents/synthese/PROMPT_AGENT_SYNTHESE_v01.md)
   → si fichier absent : THROW (fail-loud, jamais de fallback) — doctrine CLAUDE.md
2. Recevoir le sujet (--sujet, obligatoire)
   → si absent : exit non-zéro + message clair
3. Router : décider quelles datasources interroger selon le sujet
   (decisions_structural / lessons_learnings / thread_dump)
4. Interroger via lib/notion.mjs queryDataSource (LECTURE SEULE)
   → DS_ID lus depuis .env (DECISIONS_DS_ID, LESSONS_DS_ID, THREAD_DUMP_DS_ID)
   → DS_ID = Data Source ID, JAMAIS database_id (contrainte non négociable)
   → si une datasource pertinente échoue : marquer complétude PARTIEL ou
     INDÉTERMINÉ, NE PAS substituer une valeur par défaut
5. Lire les BLOCS des pages, jamais raw_text (raw_text = résumé une ligne,
   ne pas lire pour le fond — piège connu CLAUDE.md)
6. Passer les résultats au LLM (lib/claude.mjs, modèle via CLAUDE_MODEL)
   avec le prompt système + consigne stricte : citer chaque affirmation,
   déclarer les trous, ne rien combler
7. Formater la sortie au format standard (voir prompt § Format de sortie)
8. Écrire le document en SORTIE LOCALE uniquement (fichier .md dans un dossier
   de sortie type out/synthese/ — JAMAIS dans Notion)
   → AUCUNE écriture Notion, AUCUNE modif repo : garde-fou agent
```

---

## 3. Garde-fous techniques (traduction des règles du prompt en code)

- **Lecture seule absolue :** le code n'importe aucune fonction d'écriture Notion.
  Si `lib/notion.mjs` expose des writers, l'agent ne les référence pas. À vérifier
  à l'implémentation : aucun `createPage`, `updatePage`, `update*` dans l'agent.
- **Fail-loud (doctrine CLAUDE.md « crash > silence ») :** toute lecture qui échoue
  → throw ou complétude dégradée explicite. Jamais une valeur par défaut silencieuse.
- **Complétude vérifiée avant génération (même motif que P23 os:close Phase 6) :**
  si les datasources pertinentes n'ont pas toutes répondu, la sortie porte le niveau
  PARTIEL ou INDÉTERMINÉ — la synthèse consolidée n'est PAS produite sous label COMPLET
  sur des données incomplètes.
- **Citations obligatoires :** le formateur rejette (ou marque INDÉTERMINÉ) toute
  affirmation sans source. Une synthèse sans citations n'est pas une sortie valide.
- **Coût (principe d'optimisation Infra-Tech) :** ne pas tirer les 3 datasources si
  le sujet n'en concerne qu'une. Router d'abord, interroger ensuite.

---

## 4. Critère de validation de la mise en service

L'agent est considéré opérationnel quand son premier livrable (synthèse de l'état
technique réel) passe les 4 critères de succès du prompt :
1. chaque affirmation citée,
2. rien d'inventé,
3. rien de gravé-connu omis (présent ou déclaré absent),
4. décidé ≠ implémenté respecté.

Validation par Florent à l'œil, puisque le sujet (état technique) est celui qu'il
connaît le mieux. C'est le banc d'essai : si l'agent ment ou comble, Florent le voit.

---

## 5. Dépendances et prérequis

- `.env` : DECISIONS_DS_ID, LESSONS_DS_ID, THREAD_DUMP_DS_ID, ANTHROPIC_API_KEY,
  CLAUDE_MODEL, NOTION_API_KEY — tous EXISTANTS (pipeline actuel les utilise déjà).
- Aucune nouvelle dépendance npm a priori (réutilise notion.mjs + claude.mjs).
- Aucun accès externe, aucun credential nouveau : périmètre strictement interne.

---

## 6. Hors scope explicite (à ne pas glisser dedans)

- Accès ENTITIES : pas encore (mémoire relationnelle, agent dédié à venir — BACKLOG_USER MEMOIRE).
- Écriture de la synthèse en Notion : non. Sortie locale seulement.
- Bouclage automatique vers l'Agent Infra-Tech : non. La synthèse est produite,
  Florent (ou un thread dédié) s'en sert pour corriger le prompt Infra-Tech. Le
  chaînage inter-agents automatique est V3 (déploiement mémoire live), pas maintenant.
- Routing modèle adaptatif (Opus/Sonnet/Haiku) : c'est BACKLOG_USER P9, séparé.
  L'agent utilise CLAUDE_MODEL tel quel pour l'instant.
