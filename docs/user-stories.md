---
id: DOC-030-US
title: User Stories
status: draft
version: 0.1.0
updated: 2025-11-03
owner: ALPE Plaisance du Touch
links: []
---

# Gabarit d’une user story

```yaml
id: US-001
title: Déposer des articles
actor: deposant | benevole | admin
benefit: "…pour …"
as_a: "En tant que …"
i_want: "Je veux …"
so_that: "Afin de …"
acceptance_criteria:
  - GIVEN … WHEN … THEN …
dependencies: [US-xxx]
links:
  - rel: requirement
    id: REQ-F-001
``` 

## US-001 — Activer un compte déposant invité

```yaml
id: US-001
title: Activer un compte déposant invité
actor: deposant
benefit: "...pour préparer et suivre mes dépôts sans monopoliser les bénévoles"
as_a: "En tant que particulier invité par l’équipe ALPE"
i_want: "Je veux activer le compte lié à mon invitation et définir mes accès"
so_that: "Afin de déclarer mes articles, obtenir mes étiquettes et suivre mes ventes"
acceptance_criteria:
  - GIVEN j’ai reçu un email d’invitation valide WHEN je clique sur le lien unique THEN je vois un écran qui me demande de définir mon mot de passe et d’accepter les CGU/RGPD
  - GIVEN je saisis un mot de passe qui respecte le format (≥ 8 caractères, au moins une lettre [a-zA-Z], un chiffre [0-9] et un symbole simple tel que !@#$%^&*_-), et j’indique mes coordonnées WHEN je valide l’écran d’activation THEN le système active mon compte et me connecte à mon espace déposant
  - GIVEN mon lien d’invitation a expiré ou a déjà été utilisé WHEN j’essaie d’y accéder THEN le système me bloque et m’indique de contacter les bénévoles pour une nouvelle invitation
dependencies: []
links:
  - rel: requirement
    id: REQ-F-001
  - rel: requirement
    id: REQ-NF-003
  - rel: requirement
    id: REQ-F-00X
```

# Exemples initiaux (à détailler)

- US-002 — En tant que déposant, je veux enregistrer mes articles avec prix proposé.
- US-003 — En tant que déposant, je veux obtenir/imprimer des étiquettes pour chaque article.
- US-004 — En tant que bénévole, je veux scanner un article et enregistrer la vente.
- US-005 — En tant que bénévole, je veux clôturer la bourse et générer les reversements.
