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

## [0.3.0] - 2025-11-05
- **Concept fondamental : Gestion des Éditions de bourse**
  - **Glossaire (v0.2.0)** : ajout de 20+ termes (Édition, cycle de vie, rôles Administrateur/Gestionnaire, Billetweb, dates clés)
  - **Personas (v0.2.0)** : ajout de 2 nouveaux personas détaillés
    - Gestionnaire (Sophie) : configuration éditions, import Billetweb, pilotage
    - Administrateur (Pierre) : création/clôture éditions, gestion utilisateurs, conformité
    - Enrichissement Déposant et Bénévole avec profils détaillés
  - **User Stories (v0.3.0)** : ajout de 4 nouvelles US pour gestion éditions
    - US-006 : Créer une nouvelle édition (administrateur) - 9 AC
    - US-007 : Configurer les dates clés (gestionnaire) - 6 AC
    - US-008 : Importer inscriptions Billetweb (gestionnaire) - 11 AC
    - US-009 : Clôturer une édition (administrateur) - 8 AC
    - Total : 34 critères d'acceptation + règles métier + 36 tests suggérés
  - **Modèle de domaine (v0.2.0)** : refonte complète
    - Ajout entité Edition avec 7 entités (Edition, User, Deposant, Article, Vente, Reversement, Invitation)
    - Diagramme cycle de vie Edition (6 états : Brouillon → Archivée)
    - Règles métier par entité + 7 invariants système
  - **Exigences (v0.2.0)** : restructuration et enrichissement
    - Ajout REQ-F-006 à REQ-F-009 (gestion éditions)
    - Ajout REQ-F-010 (gestion rôles)
    - Organisation par domaine : éditions, utilisateurs, articles/ventes
    - Critères d'acceptation, priorités et responsables de validation pour chaque REQ

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

