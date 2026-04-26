INSIDE_OS_CONTEXT_v06
Date: 2026-04-18

STATUT GLOBAL
- INSIDE OS dispose désormais d’une mémoire conversationnelle vivante en beta V0.
- Le système est connecté à Notion.
- Les bases DECISIONS et LESSONS sont lues correctement par le chat.
- Le pipeline ingest → extract → inject fonctionne.
- Le présent peut être injecté dans la mémoire et ressortir dans les réponses.

ARCHITECTURE MÉMOIRE
- B01 / B02 / suivants = mémoire longue / historique Florent / INSIDE.
- B99 = présent vivant du système.
- Le système doit lire tout l’historique, mais privilégier fortement B99 pour répondre sur l’état actuel.
- B99 ne doit pas être un journal diffus.
- B99 doit rester une séquence courte, claire, actionnable, orientée pilotage.

RÈGLES STRUCTURELLES ACTÉES
- extract = composant déterministe
- inject = logique métier
- chat = lecture mémoire et réponse
- la boucle conversationnelle ne doit pas écrire directement dans la mémoire
- le LLM doit utiliser la mémoire récupérée en priorité
- le LLM doit distinguer ce que la mémoire dit, ce qu’il infère, et ce qui manque
- le LLM ne doit pas inventer une décision absente

BUG STRUCTUREL IDENTIFIÉ
- le pipeline dépend d’une cohérence stricte entre extraction_status et injection_status
- toute incohérence de statuts peut bloquer silencieusement la chaîne
- ce bug a été constaté puis documenté dans docs/PIPELINE_BUG.md

CORRECTIONS TECHNIQUES VALIDÉES
- ajout de injection_status = pending dès ingest
- ajout du mode --only dans os:ingest
- ajout du mode --only dans os:extract
- ajout du mode --only dans os:inject
- le pipeline ciblé est maintenant testable proprement sur B99

MODE DE TEST VALIDÉ
- zone de test / calibration = B99
- commandes validées :
  - npm run os:ingest -- --only B99-TXX
  - npm run os:extract -- --only B99-TXX
  - npm run os:inject -- --only B99-TXX
  - npm run os:chat -- "question"
- règle absolue : ne jamais relancer toute la base pour un micro-test

CHAT / MÉMOIRE VIVANTE
- notion-memory-chat.mjs fonctionne
- le ranking a été corrigé pour favoriser fortement B99
- un boost spécifique a été ajouté pour les threads d’état opératoire
- le chat sait maintenant répondre en mode :
  - ÉTAT
  - PROBLÈME
  - ACTION
- le point faible restant n’est plus le branchement technique
- le point faible restant est la qualité du présent injecté dans B99

THREADS B99 STRUCTURANTS DÉJÀ GRAVÉS
- B99-T01 : mémoire conversationnelle vivante avant beta v01
- B99-T02 : durcissement V1 et mémoire conversationnelle
- B99-T03 : validation automatique des statuts pipeline
- B99-T04 : état réel INSIDE OS
- B99-T05 : état opératoire INSIDE OS
- B99-T06 : pilotage opérationnel / rendre le chat plus direct
- B99-T07 : pilotage automatique décision → action
- B99-T08 : boucle de pilotage continue
- B99-T09 : état réel Florent / INSIDE
- B99-T10 : n'est plus une priorité

ÉTAT RÉEL À DATE
- INSIDE OS n’est plus une idée abstraite
- INSIDE OS est désormais un système vivant, utilisable, testable, et relié à une mémoire Notion
- la mémoire conversationnelle V0 est réelle et fonctionnelle
- la beta V1 solide n’est pas encore l’objectif
- l’objectif actuel est la fiabilisation + l’enrichissement discipliné du présent

PIVOT STRATÉGIQUE ACTUEL
- le système ne doit plus seulement décrire
- le système doit pousser à l’action
- INSIDE OS doit devenir un outil de pilotage réel de Florent / INSIDE

DÉCISION BUSINESS ACTUELLE
- priorité unique retenue : COMMERCIAL
- horizon : 30 jours
- tout le reste devient secondaire pendant ce cycle

B99-T10 — PRIORITÉ COMMERCIALE
- objectif : générer du chiffre rapidement et créer du flux de projets haut de gamme
- cible :
  - agences immobilières haut de gamme
  - architectes / prescripteurs
  - clients directs à fort budget
- action du jour actée :
  - lister 10 contacts qualifiés
  - envoyer 3 premiers messages aujourd’hui
- critère de succès à 30 jours :
  - 10 à 15 rendez-vous
  - 3 à 5 projets enclenchés
  - au moins 1 signature

LECTURE JUSTE DU SYSTÈME
- la qualité du chat dépend directement de la qualité des threads B99
- une mémoire riche sans orientation d’action produit des réponses intelligentes mais inutiles
- la mémoire vivante doit rester courte, tendue, opérationnelle

PROCHAINE ÉTAPE LOGIQUE
- quitter le chantier technique d’INSIDE OS
- utiliser INSIDE OS pour piloter l’activité réelle de Florent / INSIDE
- prochain thread = finalisation de la mémoire Inside-OS => Flo
- angle attendu du nouveau thread :
  - transformer INSIDE OS en copilote de Florent
  - priorisation business réelle
  - exploitation concrète de la mémoire vivante au service de l’action

RÈGLE DE TRAVAIL
- ne pas repartir dans la théorie mémoire déjà actée
- considérer la doctrine mémoire comme validée
- travailler désormais en mode vivant, direct, orienté exécution