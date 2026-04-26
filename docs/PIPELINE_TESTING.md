# PIPELINE TESTING — INSIDE OS

## Objectif

Tester le pipeline sans relancer tout l’historique.

On travaille uniquement avec des threads de test :
→ B99-TXX

---

## Règle

Toujours utiliser le mode ciblé :

--only B99-TXX

---

## Commandes standard

### 1. Ingest

Créer / mettre à jour le thread dans Notion :

```bash
npm run os:ingest -- --only B99-T03