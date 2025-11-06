---
id: DOC-005-PLAN
title: Plan de rédaction des spécifications
status: draft
version: 0.2.0
updated: 2025-11-05
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
| Plan (DOC-005) | Pilotage & suivi | ✅ Mis à jour (v0.2.0) | Produit | 2025-11-05 |
| Glossaire (DOC-010) | Table complète des termes | ✅ Enrichi (v0.2.0) - 20+ termes ajoutés (Edition, rôles, Billetweb) | UX | 2025-11-05 |
| Personas (DOC-020) | 4 personas cibles | ✅ Complétés (v0.2.0) - 4 personas détaillés (Déposant, Bénévole, Gestionnaire, Admin) | UX | 2025-11-05 |
| User Stories (DOC-030) | US complètes + critères | 🔄 En cours (v0.3.0) - US-001, US-006 à US-009 détaillées | Produit | 2025-11-15 |
| Exigences (DOC-040) | REQ fonctionnelles & NF traçables | ✅ Structurées (v0.2.0) - REQ-F-001 à F-010 avec priorités et responsables | Produit | 2025-11-05 |
| Architecture (DOC-050) | C4 niv. 1-3 + contraintes | À compléter (diagrammes, ADR) | Tech Lead | 2025-11-22 |
| Modèle de domaine (DOC-060) | Diagramme + règles métiers | ✅ Refonte complète (v0.2.0) - 7 entités + cycle de vie Edition + invariants | Produit + Tech | 2025-11-05 |
| UI (DOC-070) | Parcours + wireframes clés | À produire (écrans détaillés) | UX | 2025-11-25 |
| Sécurité (DOC-080) | Politique sécurité/RGPD | À consolider (contrôles techniques) | SecOps | 2025-11-22 |
| Opérations (DOC-090) | SLO, observabilité, runbooks | À compléter (process run + alerte) | Ops | 2025-11-25 |
| API (API-OPENAPI) | Contrat REST initial | Squelette sans endpoints | Tech Lead | 2025-11-22 |
| ADR (DEC-000+) | Décisions validées | Modèle uniquement | Tech Lead | 2025-11-22 |

# Backlog détaillé

## DOC-030 — User Stories

### Gestion des éditions (cycle de vie)
- [x] ✅ Créer US-006 : Créer une nouvelle édition (administrateur) - 9 AC, 9 tests
- [x] ✅ Créer US-007 : Configurer les dates clés (gestionnaire) - 6 AC, 8 tests
- [x] ✅ Créer US-008 : Importer inscriptions Billetweb (gestionnaire) - 11 AC, 11 tests
- [x] ✅ Créer US-009 : Clôturer une édition (administrateur) - 8 AC, 9 tests

### Gestion des déposants
- [x] ✅ Rédiger US-001 (activation sur invitation) avec critères et contraintes mot de passe
- [x] ✅ Enrichir US-001 : 14 AC détaillés, sécurité, accessibilité, RGPD, performance, 16 tests
- [ ] Détailler US-002 (enregistrement articles) avec AC métier (catégories, validation prix)
- [ ] Détailler US-003 (génération étiquettes) incluant scénarios d'impression/QR

### Gestion des bénévoles
- [ ] Détailler US-004 (scannage vente) avec cas offline et performance
- [ ] Détailler US-005 (calcul & génération reversements) avec règles de calcul et validations
- [ ] Créer US pour émission manuelle d'invitations (bénévole/gestionnaire)

### Traçabilité
- [ ] Mettre en place traçabilité croisée US ↔ REQ ↔ tests

## DOC-040 — Exigences
- [x] ✅ Restructurer par domaine fonctionnel (éditions, utilisateurs, articles/ventes)
- [x] ✅ Créer REQ-F-006 à REQ-F-009 (gestion éditions)
- [x] ✅ Créer REQ-F-010 (gestion rôles)
- [x] ✅ Ajouter critères d'acceptation mesurables pour REQ-F-001 à F-010
- [x] ✅ Ajouter priorités (MoSCoW) et responsables de validation
- [ ] Compléter REQ-F-002 à REQ-F-005 (articles, étiquettes, ventes, reversements)
- [ ] Introduire exigences non-fonctionnelles supplémentaires (sécurité, scalabilité)
- [ ] Lier chaque REQ aux futurs cas de test

## DOC-060 — Modèle de domaine
- [x] ✅ Refonte complète avec entité Edition comme pivot central
- [x] ✅ Créer diagramme de classes avec 7 entités (Edition, User, Deposant, Article, Vente, Reversement, Invitation)
- [x] ✅ Ajouter diagramme de cycle de vie Edition (6 états)
- [x] ✅ Définir règles métier par entité (Edition, Users/rôles, Articles, Ventes, Reversements, Invitations)
- [x] ✅ Décrire 7 invariants système (unicités, cohérence dates, immutabilité)
- [x] ✅ Détailler attributs et types pour Edition (dates, commission, statut, etc.)
- [ ] Ajouter diagrammes séquence pour dépôts et ventes
- [ ] Détailler états et transitions des Articles (brouillon → récupéré)

## DOC-010 — Glossaire
- [x] ✅ Enrichir avec 20+ nouveaux termes organisés par catégories
- [x] ✅ Ajouter concepts généraux (Edition, Cycle de vie)
- [x] ✅ Définir acteurs et rôles (Administrateur, Gestionnaire, Bénévole, Déposant)
- [x] ✅ Décrire processus et dates clés (inscriptions, dépôt, vente, récupération, clôture)
- [x] ✅ Documenter outils externes (Billetweb)
- [ ] Ajouter acronymes si nécessaire (MVP, API, etc.)

## DOC-020 — Personas
- [x] ✅ Créer persona Déposant (Marie) détaillé avec profil, objectifs, freins, scénarios
- [x] ✅ Créer persona Bénévole opérationnel (Jean) détaillé
- [x] ✅ Créer persona Gestionnaire (Sophie) détaillé avec responsabilités éditions
- [x] ✅ Créer persona Administrateur (Pierre) détaillé avec pouvoirs complets
- [ ] Ajouter scénarios d'usage par persona (parcours détaillés)
- [ ] Documenter émotions/frustrations par phase de la bourse

## DOC-050 — Architecture & ADR
- [ ] Produire diagrammes C4 niveau Conteneur et Composant
- [ ] Documenter hypothèses d'hébergement et modes offline
- [ ] Rédiger ADR pour choix techno front/back, base de données, gestion étiquettes

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

# Bilan d'avancement (au 2025-11-05)

## ✅ Réalisations clés (version 0.3.0)

### Fondations conceptuelles établies
- **Concept central : Gestion des Éditions** introduit et documenté
- **Cycle de vie complet** : Brouillon → Configurée → Inscriptions → En cours → Clôturée → Archivée
- **4 rôles définis** : Déposant, Bénévole, Gestionnaire, Administrateur

### Livrables complétés
| Livrable | Statut | Détails |
|----------|--------|---------|
| Glossaire (v0.2.0) | ✅ | 20+ nouveaux termes structurés par catégorie |
| Personas (v0.2.0) | ✅ | 4 personas détaillés avec profils complets |
| User Stories (v0.3.0) | 🔄 50% | US-001 + US-006 à US-009 détaillées (5/9 US) |
| Exigences (v0.2.0) | ✅ | REQ-F-001 à F-010 structurées avec AC, priorités |
| Modèle domaine (v0.2.0) | ✅ | 7 entités + diagrammes + règles + invariants |

### Métriques
- **User Stories créées** : 5 (US-001, US-006, US-007, US-008, US-009)
- **Critères d'acceptation** : 48 (14 pour US-001 + 34 pour US-006-009)
- **Scénarios de test** : 52 (16 pour US-001 + 36 pour US-006-009)
- **Exigences fonctionnelles** : 10 (REQ-F-001 à F-010)
- **Entités du domaine** : 7 (Edition, User, Deposant, Article, Vente, Reversement, Invitation)

## 🎯 Priorités immédiates

### Court terme (semaine prochaine)
1. **US-002** : Enregistrement des articles (déposant)
2. **US-003** : Génération d'étiquettes (déposant)
3. **US-004** : Scannage et encaissement (bénévole)
4. **US-005** : Calcul reversements (bénévole/gestionnaire)

### Moyen terme (2 semaines)
1. Architecture : Diagrammes C4 + ADR choix technologiques
2. API : Définition endpoints éditions, articles, ventes
3. Sécurité : Matrice d'autorisations détaillée

# Prochain check-in

Réunion de synchronisation le 2025-11-08 pour examiner l'avancement US/REQ et réajuster priorités si nécessaire.
