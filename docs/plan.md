---
id: DOC-005-PLAN
title: Plan de rédaction des spécifications
status: draft
version: 0.1.0
updated: 2025-11-04
owner: ALPE Plaisance du Touch
links:
  - rel: overview
    href: README.md
---

# Objectif

Organiser la production et la validation des spécifications de l’application « Gestionnaire de Bourse ALPE » en fournissant un tableau de bord partagé des tâches, responsabilités et jalons.

# Backlog synthétique

| Document | Livrable de référence | Statut actuel | Responsable | Échéance cible |
|---|---|---|---|---|
| README (DOC-000) | Vision, conventions | Ossature initiale à enrichir (exemples, FAQ) | Produit | 2025-11-10 |
| Plan (DOC-005) | Pilotage & suivi | Ce document | Produit | 2025-11-04 |
| Glossaire (DOC-010) | Table complète des termes | À étendre (ajout catégories, acronymes) | UX | 2025-11-12 |
| Personas (DOC-020) | 4 personas cibles | À détailler (scénarios + émotions) | UX | 2025-11-12 |
| User Stories (DOC-030) | US complètes + critères | En cours (US-001 done) | Produit | 2025-11-15 |
| Exigences (DOC-040) | REQ fonctionnelles & NF traçables | Ébauche à structurer (priorités/tests) | Produit | 2025-11-18 |
| Architecture (DOC-050) | C4 niv. 1-3 + contraintes | À compléter (diagrammes, ADR) | Tech Lead | 2025-11-22 |
| Modèle de domaine (DOC-060) | Diagramme + règles métiers | Enrichir (attributs, invariants) | Produit + Tech | 2025-11-18 |
| UI (DOC-070) | Parcours + wireframes clés | À produire (écrans détaillés) | UX | 2025-11-25 |
| Sécurité (DOC-080) | Politique sécurité/RGPD | À consolider (contrôles techniques) | SecOps | 2025-11-22 |
| Opérations (DOC-090) | SLO, observabilité, runbooks | À compléter (process run + alerte) | Ops | 2025-11-25 |
| API (API-OPENAPI) | Contrat REST initial | Squelette sans endpoints | Tech Lead | 2025-11-22 |
| ADR (DEC-000+) | Décisions validées | Modèle uniquement | Tech Lead | 2025-11-22 |

# Backlog détaillé

## DOC-030 — User Stories
- [x] Rédiger US-001 (activation sur invitation) avec critères et contraintes mot de passe.
- [x] Enrichir US-001 : 14 AC détaillés, sécurité, accessibilité, RGPD, performance, 16 tests.
- [ ] Détailler US-002 (enregistrement articles) avec AC métier (catégories, validation prix).
- [ ] Détailler US-003 (génération étiquettes) incluant scénarios d'impression/QR.
- [ ] Détailler US-004 (scannage vente) avec cas offline et performance.
- [ ] Détailler US-005 (clôture & reversements) avec règles de calcul et validations.
- [ ] Ajouter US bénévoles pour l'émission des invitations (`REQ-F-00X`).
- [ ] Mettre en place traçabilité croisée US ↔ REQ ↔ tests.

## DOC-040 — Exigences
- [ ] Reprendre chaque REQ-F pour préciser critères d’acceptation mesurables.
- [ ] Ajouter priorités (MoSCoW) et responsables de validation.
- [ ] Introduire exigences non-fonctionnelles supplémentaires (sécurité, scalabilité).
- [ ] Lier chaque REQ aux US correspondantes et futurs cas de test.

## DOC-060 — Modèle de domaine
- [ ] Compléter les attributs (statuts article, règles tarifaires détaillées).
- [ ] Décrire invariants (unicité étiquette, état article vs vente).
- [ ] Ajouter diagrammes séquence pour dépôts et ventes.

## DOC-050 — Architecture & ADR
- [ ] Produire diagrammes C4 niveau Conteneur et Composant.
- [ ] Documenter hypothèses d’hébergement et modes offline.
- [ ] Rédiger ADR pour choix techno front/back, base de données, gestion étiquettes.

## DOC-070 — UI & Flux
- [ ] Concevoir wireframes basse fidélité pour parcours déposant & bénévole.
- [ ] Décrire états d’erreur/notifs (invitation expirée, scan KO).
- [ ] Proposer guidelines accessibilité (WCAG AA).

## DOC-080 — Sécurité
- [ ] Détailler matrice d’autorisations par rôle.
- [ ] Spécifier politique de conservation et anonymisation données.
- [ ] Définir exigences MFA pour bénévoles/administrateurs.

## DOC-090 — Opérations
- [ ] Formaliser procédures d’ouverture/fermeture bourse.
- [ ] Décrire plan de continuité en mode offline + resynchronisation.
- [ ] Définir alerting (seuils, responsables d’astreinte).

## API — OpenAPI
- [ ] Documenter endpoints invitations (création, relance, activation).
- [ ] Ajouter endpoints articles, ventes, reversements.
- [ ] Définir schémas d’erreur normalisés et sécurité (JWT/OAuth).

## Gouvernance & communication
- [ ] Organiser rituel hebdomadaire de revue des spécifications.
- [ ] Mettre en place indicateurs d’avancement (US complètes, REQ validées).
- [ ] Préparer support de présentation pour comité ALPE (vision + planning).

# Jalons
- 2025-11-12 — Ensemble glossaire + personas validés.
- 2025-11-18 — User stories & exigences fonctionnelles complètes.
- 2025-11-22 — Architecture, API, sécurité alignées (version candidate).
- 2025-11-25 — UI, opérations et plan de tests prêts pour revue finale.
- 2025-11-29 — Validation globale des spécifications et gel scope V1.

# Risques & atténuations
- **Disponibilité bénévoles limitée** — planifier séances courtes + async notes.
- **Dépendance informations terrain** — collecter retours bourse précédente avant le 15/11.
- **Complexité RGPD** — solliciter consultation juridique externe pour revue finale.

# Prochain check-in

Réunion de synchronisation le 2025-11-08 pour examiner l’avancement US/REQ et réajuster priorités si nécessaire.
