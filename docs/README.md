---
id: DOC-000-README
title: Spécifications — Gestionnaire de Bourse ALPE
status: draft
version: 0.1.0
updated: 2025-11-03
owner: ALPE Plaisance du Touch
links:
  - rel: site
    href: https://alpe-plaisance.org/
  - rel: bourse-description
    href: https://alpe-plaisance.org/nos-actions/bourse-aux-vetements/
---

# Vision et objectifs

Application web pour gérer les Bourses d’ALPE (inscriptions/dépôts, étiquettes, suivi des ventes, paiements, pilotage bénévole). Cible grand public (déposants) et bénévoles gestionnaires.

# Navigation

- Glossaire: `glossaire.md`
- Personas: `personas.md`
- User stories: `user-stories.md`
- Exigences: `exigences.md`
- Modèle de domaine: `domain-model.md`
- Architecture: `architecture.md`
- UI & flux: `ui.md`
- Sécurité: `securite.md`
- Opérations: `operations.md`
- Bonnes pratiques: `bonnes-pratiques.md`
- Déploiement: `deploiement.md`
- API (OpenAPI): `api/openapi.yaml`
- Manifest: `index.yaml`
- Changelog: `CHANGELOG.md`

# Conventions “AI-friendly”

- Front matter YAML par fichier: `id`, `title`, `status`, `version`, `updated`, `owner`, `links`.
- Identifiants: exigences `REQ-xxx`, user stories `US-xxx`, décisions `DEC-xxx`.
- Traçabilité: chaque `REQ-xxx` référence les `US-xxx` associées et inversement.
- Diagrammes Mermaid autorisés (séquences, ERD, C4) et OpenAPI comme source de vérité pour l’API.

# Portée initiale

- Déposants: création de compte, déclaration de lots/articles, génération d’étiquettes, dépôt, suivi ventes, récupération et paiement.
- Bénévoles: préparation de bourse, enregistrement des dépôts, scannage/encaissement, pilotage (tableaux de bord), clôture et reversements.

