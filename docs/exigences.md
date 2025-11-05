---
id: DOC-040-REQS
title: Exigences (fonctionnelles et non-fonctionnelles)
status: draft
version: 0.2.0
updated: 2025-11-05
owner: ALPE Plaisance du Touch
links: []
---

# Règles d’écriture

- Atomicité, testabilité, traçabilité (REQ ↔ US ↔ tests).
- Forme: « Le système DOIT … » ou « DEVRAIT … » (priorité).
- Chaque REQ inclut critères d’acceptation et métriques si applicable.

# Exigences fonctionnelles

## Gestion des éditions

- REQ-F-006 — Le système DOIT permettre à un administrateur de créer une nouvelle édition de bourse avec nom unique, saison, année, lieu. (US-006)
  - **Critères d'acceptation :** Formulaire de création, validation unicité nom, statut initial "Brouillon"
  - **Priorité :** Must have
  - **Responsable validation :** Administrateur ALPE

- REQ-F-007 — Le système DOIT permettre à un gestionnaire de configurer les dates clés d'une édition (dépôt, vente, récupération) et le taux de commission. (US-007)
  - **Critères d'acceptation :** Validation cohérence chronologique des dates, taux commission 0-100%, passage statut "Configurée"
  - **Priorité :** Must have
  - **Responsable validation :** Gestionnaire

- REQ-F-008 — Le système DOIT permettre à un gestionnaire d'importer un fichier d'inscriptions Billetweb (CSV/Excel) pour associer déposants existants et créer invitations pour nouveaux. (US-008)
  - **Critères d'acceptation :** Prévisualisation avant import, gestion doublons, envoi invitations automatique, limite 1000 inscriptions/fichier
  - **Priorité :** Must have
  - **Responsable validation :** Gestionnaire

- REQ-F-009 — Le système DOIT permettre à un administrateur de clôturer une édition après vérification des pré-requis (reversements calculés, paiements finalisés). (US-009)
  - **Critères d'acceptation :** Checklist pré-requis, génération rapport PDF, passage en lecture seule, traçabilité
  - **Priorité :** Must have
  - **Responsable validation :** Administrateur ALPE

## Gestion des utilisateurs

- REQ-F-001 — Le système DOIT permettre la création de compte déposant via activation d'invitation. (US-001)
  - **Critères d'acceptation :** Token unique 7 jours, validation mot de passe (≥8 car., lettre, chiffre, symbole), acceptation CGU/RGPD
  - **Priorité :** Must have
  - **Responsable validation :** Déposant test

- REQ-F-010 — Le système DOIT gérer 4 rôles utilisateurs avec permissions différenciées : déposant, bénévole, gestionnaire, administrateur.
  - **Critères d'acceptation :** Matrice d'autorisation par rôle, contrôle d'accès sur chaque action sensible
  - **Priorité :** Must have
  - **Responsable validation :** Administrateur ALPE + SecOps

## Gestion des articles et ventes

- REQ-F-002 — Le système DOIT permettre l'enregistrement d'articles avec prix, catégorie, taille, rattachés à un déposant et une édition. (US-002)
  - **Critères d'acceptation :** Validation prix > 0, catégories prédéfinies par édition, rattachement édition active
  - **Priorité :** Must have
  - **Responsable validation :** Déposant test

- REQ-F-003 — Le système DOIT générer des étiquettes scannables uniques par article au sein d'une édition. (US-003)
  - **Critères d'acceptation :** Code unique/édition, format QR code ou code-barres, impression PDF
  - **Priorité :** Must have
  - **Responsable validation :** Déposant + Bénévole

- REQ-F-004 — Le système DOIT permettre le scannage/encaissement rapide des ventes en caisse. (US-004)
  - **Critères d'acceptation :** Scan étiquette < 3s, enregistrement vente avec moyen paiement, traçabilité bénévole vendeur
  - **Priorité :** Must have
  - **Responsable validation :** Bénévole caisse

- REQ-F-005 — Le système DOIT calculer commissions et reversements par déposant en fin d'édition. (US-005)
  - **Critères d'acceptation :** Formule : montant_net = ventes − (commission% × ventes), édition par édition, export liste reversements
  - **Priorité :** Must have
  - **Responsable validation :** Gestionnaire + Administrateur

# Exigences non-fonctionnelles

- REQ-NF-001 — Disponibilité pendant la bourse ≥ 99.5%.
- REQ-NF-002 — Temps moyen de scannage → encaissement ≤ 3 secondes.
- REQ-NF-003 — Conformité RGPD: consentement, droit d’accès, suppression.
- REQ-NF-004 — Accessibilité: respect WCAG 2.1 AA pour les écrans publics.

