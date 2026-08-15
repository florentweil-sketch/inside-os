# PIPELINE BUG — INSIDE OS

## Règle fondamentale

extract = déterministe  
inject = logique métier  

## Contrat pipeline

ingest → crée THREAD_DUMP avec :
- extraction_status = pending
- injection_status = pending

extract → lit THREAD_DUMP et produit :
- extraction_status = done
- extraction_json rempli

inject → lit THREAD_DUMP si :
- extraction_status = done
- injection_status = pending

puis injecte dans DECISIONS / LESSONS et met :
- injection_status = done

## Bug rencontré (avril 2026)

Symptôme :
- extract fonctionne
- inject ne traite rien
- message : "Aucun thread_dump à injecter"

Cause :
- injection_status pas à "pending"
- ou incohérence entre extraction_status et injection_status

Conséquence :
- données extraites mais jamais injectées
- mémoire non mise à jour
- chat aveugle au présent

## Solution validée

Pour forcer l’injection :
- mettre injection_status = pending dans Notion

## Règle à respecter

- ingest DOIT initialiser injection_status = pending
- extract DOIT produire extraction_status = done
- inject NE DOIT PAS dépendre d’un état ambigu

## Conclusion

Le pipeline dépend d’un contrat strict de statuts.
Toute incohérence bloque silencieusement le système.