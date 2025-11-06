---
id: DOC-099-CHANGELOG
title: Changelog (SemVer)
status: draft
version: 0.4.0
updated: 2025-11-06
owner: ALPE Plaisance du Touch
links:
  - rel: source
    href: Reglement_deposant.md
    title: Règlement déposant
---

# Historique des versions

## [0.4.0] - 2025-11-06
- **Intégration complète du Règlement déposant**
  - **Source** : docs/Reglement_deposant.md (règlement officiel ALPE du 23/09/2025)

  - **US-002 (nouvelle)** : Déclarer mes articles dans mes listes
    - 15 critères d'acceptation détaillés couvrant toutes les règles métier
    - Gestion des 2 listes max par déposant (24 articles max dont 12 vêtements)
    - Lignes 1-12 réservées vêtements, lignes 13-24 pour toutes catégories
    - Contraintes par catégorie (1 manteau, 1 sac, 2 foulards, 1 tour de lit, 1 peluche, 5 livres adultes max)
    - Gestion des lots (vêtements enfant bodys/pyjamas jusqu'à 36 mois, 3 articles max)
    - Validation prix (1€ min, 150€ max pour poussettes)
    - Liste noire d'articles refusés (sièges-autos, CD/DVD, casques, etc.)
    - Date limite de déclaration avec blocage après échéance
    - Certification de conformité obligatoire par article
    - Aide contextuelle avec prix indicatifs selon catégorie
    - 20 cas de test suggérés

  - **Exigences (v0.3.0)** : enrichissement avec contraintes réglementaires
    - REQ-F-002 : ajout contraintes listes (2 max), articles (24 max dont 12 vêtements), prix (1-150€), catégories
    - REQ-F-002-BIS (nouveau) : validation qualité articles selon règlement
    - REQ-F-005 : ajout tarification précise (5€ frais + 20% commission)
    - REQ-F-011 (nouveau) : gestion date limite de déclaration avec avertissement 3 jours avant
    - REQ-F-012 (nouveau) : affichage rappels réglementaires jour de dépôt

  - **Modèle de domaine (v0.3.0)** : refonte avec entité Liste
    - Ajout entité **Liste** avec attributs (numero, statut, compteurs articles/vêtements)
    - Refonte entité **Article** avec (numero_ligne 1-24, is_lot, lot_quantity, lot_marque, conformite_certifiee)
    - Mise à jour **Edition** avec date_limite_declaration
    - Mise à jour **Deposant** avec creneau_depot
    - Relations : Deposant → Liste (max 2) → Articles (max 24)
    - Ajout 9 invariants pour contraintes listes et articles
    - Règles métier détaillées par entité avec références REQ
    - Documentation tarification ALPE (5€ + 20% commission)

  - **Catégories articles (v1.0.0)** : nouveau document de référence pour bénévoles
    - Guide complet des catégories acceptées avec critères qualité
    - Liste exhaustive des articles refusés (liste noire)
    - Grille de prix indicatifs par type d'article
    - Procédure de vérification au dépôt (checklist bénévole)
    - Gestion des refus et rappels réglementaires

  - **US-007 enrichie** : ajout date limite déclaration et tarification
    - Configuration date_limite_declaration (avant première date de dépôt)
    - Taux commission par défaut 20%
    - Note informative sur frais inscription 5€ (Billetweb)
    - Validation ordre chronologique incluant date limite
    - Blocage modification listes après date limite

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

