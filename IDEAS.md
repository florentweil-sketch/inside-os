# IDEAS.md
# Pense-bete inter-thread INSIDE OS

Format : [RAW] idee horodatee — revue en fin de thread (BACKLOG / DROPPED / KEEP)

---

- [DROPPED] 2026-05-16 19:15 — test idee inter-thread (test fonctionnel os:idea, pas une vraie idée)
- [BACKLOG] 2026-05-17 — P11 suspendu (3e fois, raison architecturale) : au lieu de purger automatiquement threads_to_process/ après inject, os:pre-thread interroge Notion au démarrage de chaque thread et fait un diff automatique entre le snapshot live et le CONTEXT vXX précédent. Toute divergence (fichiers non purgés, inject_pending, état inattendu) est signalée clairement avant ouverture du thread. Vraie solution à la boucle, pas un patch.
- [RAW] 2026-05-25 17:43 — os:pre-thread ETAPE 3 — bug detection dernier thread B09 : affiche T38 alors que T39 etait clos (decouvert B09-T39). Sans --next, l'auto-calcul repart de la mauvaise base et propose le mauvais numero. Contournement actuel : --next explicite. A corriger : identifier la source lue par ETAPE 3 et la rendre coherente avec l'etat reel post-cloture.
- [RAW] 2026-05-25 17:43 — os:close Phase 6 — genere le CONTEXT a partir d'un fichier de contenu de thread plafonne a 15000 chars SANS verifier la completude. A produit un draft v31 massivement faux (3 commits au lieu de 9, P9 non tranche, P18 prochain chantier) avec label 'confiance elevee'. A corriger : verifier completude du contenu avant generation ; si tronque/absent → INDETERMINE + refus de generer, jamais de generation sur fragment. Meme motif anti-hallucination que tout B09-T39.
