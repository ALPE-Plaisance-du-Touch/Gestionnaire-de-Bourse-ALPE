---
id: DOC-099-CHANGELOG
title: Changelog (SemVer)
status: draft
version: 0.1.0
updated: 2025-11-03
owner: ALPE Plaisance du Touch
links: []
---

# Historique des versions

## [0.2.0] - 2025-11-05
- **US-001 enrichie** : ajout de 14 critères d'acceptation détaillés (vs 3 initiaux)
  - Cas d'erreur complets (mot de passe invalide, téléphone, champs manquants, tokens expirés/invalides)
  - Spécifications sécurité (rate limiting, audit logs, bcrypt)
  - Critères d'accessibilité (WCAG 2.1 AA, navigation clavier, lecteurs d'écran)
  - Règles métier explicites (durée validité 7 jours, token unique, email = identifiant)
  - Métriques de performance (< 3s activation, < 5min email confirmation)
  - Données RGPD détaillées avec conservation
  - 16 cas de test suggérés pour validation complète

## [0.1.0] - 2025-11-03
- Création de l'ossature `docs/` (README, glossaire, personas, US, exigences, domaine, archi, UI, sécurité, opérations).
- Ajout `api/openapi.yaml`, `adr/DEC-000.md`, `index.yaml`, `CHANGELOG.md`.

