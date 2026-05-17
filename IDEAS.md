# IDEAS.md
# Pense-bete inter-thread INSIDE OS

Format : [RAW] idee horodatee — revue en fin de thread (BACKLOG / DROPPED / KEEP)

---

- [DROPPED] 2026-05-16 19:15 — test idee inter-thread (test fonctionnel os:idea, pas une vraie idée)
- [BACKLOG] 2026-05-17 — P11 suspendu (3e fois, raison architecturale) : au lieu de purger automatiquement threads_to_process/ après inject, os:pre-thread interroge Notion au démarrage de chaque thread et fait un diff automatique entre le snapshot live et le CONTEXT vXX précédent. Toute divergence (fichiers non purgés, inject_pending, état inattendu) est signalée clairement avant ouverture du thread. Vraie solution à la boucle, pas un patch.
