---
id: DOC-060-DOMAIN
title: Modèle de domaine
status: draft
version: 0.1.0
updated: 2025-11-03
owner: ALPE Plaisance du Touch
links: []
---

# Entités principales (ébauche)

```mermaid
classDiagram
  class Bourse {
    +id
    +nom
    +dates
    +reglesTarifaires
  }
  class Deposant {
    +id
    +nom
    +contact
    +iban?
  }
  class Article {
    +id
    +libelle
    +categorie
    +taille?
    +prixPropose
    +etat
  }
  class Vente {
    +id
    +prixVente
    +date
  }
  class Reversement {
    +id
    +montant
    +date
  }

  Deposant "1" -- "*" Article : possede
  Article "0..1" -- "1" Vente : vendu_par
  Bourse "1" -- "*" Article : comprend
  Vente "1" -- "1" Reversement : alimente
```

# Règles métier (exemples)

- Une étiquette identifie de manière unique un article au sein d’une bourse.
- Le reversement = somme ventes du déposant − commissions − frais.

