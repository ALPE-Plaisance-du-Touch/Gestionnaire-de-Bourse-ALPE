---
id: DOC-005-PLAN
title: Plan de rédaction des spécifications
status: draft
version: 0.9.0
updated: 2025-12-24
owner: ALPE Plaisance du Touch
links:
  - rel: overview
    href: README.md
  - rel: source
    href: Reglement_deposant.md
  - rel: source
    href: Reglement_interne.md
---

# Objectif

Organiser la production et la validation des spécifications de l’application « Gestionnaire de Bourse ALPE » en fournissant un tableau de bord partagé des tâches, responsabilités et jalons.

# Backlog synthétique

| Document | Livrable de référence | Statut actuel | Responsable | Échéance cible |
|---|---|---|---|---|
| README (DOC-000) | Vision, conventions | Ossature initiale à enrichir (exemples, FAQ) | Produit | 2025-11-10 |
| Plan (DOC-005) | Pilotage & suivi | ✅ Mis à jour (v0.6.0) | Produit | 2025-11-07 |
| Glossaire (DOC-010) | Table complète des termes | ✅ Enrichi (v0.4.0) - Listes 1000/2000, créneaux capacités, couleurs étiquettes | UX | 2025-11-06 |
| Personas (DOC-020) | 4 personas cibles | ✅ Complétés (v0.2.0) - 4 personas détaillés (Déposant, Bénévole, Gestionnaire, Admin) | UX | 2025-11-05 |
| User Stories (DOC-030) | US complètes + critères | ✅ Complétées (v0.4.0) - US-001 à US-010 détaillées (9/9 US : 100%) | Produit | 2025-11-07 |
| Exigences (DOC-040) | REQ fonctionnelles & NF traçables | ✅ Enrichies (v0.4.0) - REQ-F-001 à F-017 avec règlements déposant/intérieur | Produit | 2025-11-06 |
| Traçabilité (DOC-100) | Matrice US ↔ REQ ↔ Tests | ✅ Créée (v1.0.0) - 860 lignes, 82% couverture complète, 1 REQ manquante | Produit | 2025-11-07 |
| Architecture (DOC-050) | C4 niv. 1-3 + contraintes | ✅ Complétée (v0.5.0) - C4 Contexte/Container/Component, 5 ADRs, mode offline, schéma données | Tech Lead | 2025-11-22 |
| Modèle de domaine (DOC-060) | Diagramme + règles métiers | ✅ Enrichi (v0.4.0) - 8 entités (Creneau ajouté) + types listes + 23 invariants | Produit + Tech | 2025-11-06 |
| Catégories articles (DOC-011) | Guide bénévoles | ✅ Créé (v1.0.0) - 317 lignes, acceptés/refusés, prix indicatifs, checklist | Produit | 2025-11-06 |
| UI (DOC-070) | Parcours + wireframes clés | ✅ Complétée (v0.5.0) - Parcours 3 rôles, 15+ wireframes, états erreur, accessibilité WCAG AA | UX | 2025-11-25 |
| Sécurité (DOC-080) | Politique sécurité/RGPD | ✅ Complétée (v0.5.0) - Matrice CRUD 4 rôles × 10 ressources, endpoints par rôle, RGPD, audit | SecOps | 2025-11-22 |
| Opérations (DOC-090) | SLO, observabilité, runbooks | ✅ Complétée (v0.5.0) - SLOs, checklists ouverture/fermeture, mode offline, alerting, 6 runbooks | Ops | 2025-11-25 |
| API (API-OPENAPI) | Contrat REST initial | ✅ Complétée (v1.0.0) - 50+ endpoints, 11 tags, 40+ schémas, auth JWT | Tech Lead | 2025-11-22 |
| Tests (DOC-110) | Stratégie de tests | ✅ Complétée (v0.5.0) - Pyramide tests, unitaires/intégration/E2E, couverture 80%, CI/CD | QA | 2025-11-25 |
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
- [x] ✅ Détailler US-002 (enregistrement articles) avec AC métier (catégories, validation prix, date limite, restrictions dépôts)
- [x] ✅ Détailler US-003 (génération étiquettes) en masse par gestionnaire avec QR codes et traçabilité

### Gestion des bénévoles
- [x] ✅ Détailler US-004 (scannage vente) : 15 AC avec offline-first, conflits, performance <3s, 20 tests
- [x] ✅ Détailler US-005 (génération reversements) : 13 AC avec bordereaux PDF, 80/20, clôture édition, 20 tests

### Gestion des invitations
- [x] ✅ Créer US-010 (émission invitations en masse) : 15 AC avec CSV, tokens, relances, traçabilité, 20 tests

### Traçabilité
- [x] ✅ Mettre en place traçabilité croisée US ↔ REQ ↔ tests (DOC-100 créé : 860 lignes, 82% couverture)

## DOC-040 — Exigences
- [x] ✅ Restructurer par domaine fonctionnel (éditions, utilisateurs, articles/ventes)
- [x] ✅ Créer REQ-F-006 à REQ-F-009 (gestion éditions)
- [x] ✅ Créer REQ-F-010 (gestion rôles)
- [x] ✅ Ajouter critères d'acceptation mesurables pour REQ-F-001 à F-010
- [x] ✅ Ajouter priorités (MoSCoW) et responsables de validation
- [x] ✅ Créer REQ-F-011 (date limite déclaration articles - 3 semaines avant collecte)
- [x] ✅ Créer REQ-F-013 (restrictions dépôts : 1 dépôt/semaine, créneaux Plaisançois)
- [x] ✅ Créer REQ-F-014 (gestion créneaux avec capacités par édition)
- [x] ✅ Créer REQ-F-015 (listes spéciales 1000/2000 adhérents ALPE)
- [x] ✅ Créer REQ-F-016 (horaires restitution différenciés standard/1000/2000)
- [x] ✅ Créer REQ-F-017 (vente privée écoles/ALAE)
- [x] ✅ Compléter REQ-F-004 (scannage/encaissement : interface caisse, scan caméra, mode offline fallback, annulation gestionnaire, 5 caisses max)
- [x] ✅ Compléter REQ-F-002 (enregistrement articles : sauvegarde auto, duplication, pas de photos, lots, liste noire, validation finale)
- [x] ✅ Compléter REQ-F-003 (génération étiquettes : interface gestionnaire, QR code, couleurs listes, PDF async 1min/300 étiquettes, stockage serveur)
- [x] ✅ Compléter REQ-F-005 (reversements : calcul commission 20%, bordereaux PDF, paiement espèces/chèque/virement, email confirmation, invendus stock ALPE)
- [x] ✅ Créer REQ-F-018 (émission invitations manuelles pour US-010)
- [x] ✅ Compléter exigences non-fonctionnelles (REQ-NF-001 à REQ-NF-012 : performance, sécurité, RGPD, accessibilité, scalabilité)

## DOC-100 — Traçabilité
- [x] ✅ Créer document de traçabilité croisée US ↔ REQ ↔ Tests (860 lignes)
- [x] ✅ Établir matrice globale : 9 US × 21 REQ × 134+ tests
- [x] ✅ Vue détaillée par User Story (10 sections avec REQ et tests)
- [x] ✅ Vue détaillée par Exigence (21 sections avec couverture US)
- [x] ✅ Analyse de couverture (89% US→REQ, 57% REQ→Tests complète, 38% partielle)
- [x] ✅ Graphique de dépendances Mermaid (relations visuelles)
- [x] ✅ Actions prioritaires court/moyen/long terme
- [ ] Créer REQ-F-018 pour US-010 (identifiée comme manquante)
- [ ] Ajouter tests manquants pour REQ partiellement testées (REQ-F-012, F-013, F-015, F-016)
- [ ] Créer tests de charge pour REQ-NF-001 (disponibilité 99.5%)
- [ ] Faire audit accessibilité WCAG 2.1 AA complet (REQ-NF-004)
- [ ] Tester exhaustivement droits RGPD (REQ-NF-003)
- [ ] Atteindre objectif 95% de couverture complète avant développement

## DOC-060 — Modèle de domaine
- [x] ✅ Refonte complète avec entité Edition comme pivot central
- [x] ✅ Créer diagramme de classes avec 8 entités (Edition, User, Deposant, Creneau, Liste, Article, Vente, Reversement, Invitation)
- [x] ✅ Ajouter diagramme de cycle de vie Edition (6 états)
- [x] ✅ Définir règles métier par entité (Edition, Users/rôles, Créneaux, Listes, Articles, Ventes, Reversements, Invitations)
- [x] ✅ Décrire 23 invariants système (unicités, cohérence dates, capacités créneaux, contraintes listes)
- [x] ✅ Détailler attributs et types pour Edition (dates, commission, statut, etc.)
- [x] ✅ Ajouter entité Creneau avec capacités et réservations Plaisançois
- [x] ✅ Enrichir entité Liste avec types (standard/1000/2000), couleurs, frais
- [ ] Ajouter diagrammes séquence pour dépôts et ventes
- [ ] Détailler états et transitions des Articles (brouillon → récupéré)

## DOC-010 — Glossaire
- [x] ✅ Enrichir avec 20+ nouveaux termes organisés par catégories
- [x] ✅ Ajouter concepts généraux (Edition, Cycle de vie)
- [x] ✅ Définir acteurs et rôles (Administrateur, Gestionnaire, Bénévole, Déposant)
- [x] ✅ Décrire processus et dates clés (inscriptions, dépôt, vente, récupération, clôture)
- [x] ✅ Documenter outils externes (Billetweb)
- [x] ✅ Ajouter termes règlement intérieur (listes 1000/2000, créneaux, couleurs étiquettes)
- [ ] Ajouter acronymes si nécessaire (MVP, API, etc.)

## DOC-011 — Catégories articles
- [x] ✅ Créer guide de référence rapide pour bénévoles (317 lignes)
- [x] ✅ Documenter critères de qualité par catégorie (vêtements, chaussures, puériculture, jouets, livres)
- [x] ✅ Lister articles acceptés avec prix indicatifs
- [x] ✅ Lister articles refusés (liste noire complète)
- [x] ✅ Créer checklist de vérification au dépôt pour bénévoles

## DOC-020 — Personas
- [x] ✅ Créer persona Déposant (Marie) détaillé avec profil, objectifs, freins, scénarios
- [x] ✅ Créer persona Bénévole opérationnel (Jean) détaillé
- [x] ✅ Créer persona Gestionnaire (Sophie) détaillé avec responsabilités éditions
- [x] ✅ Créer persona Administrateur (Pierre) détaillé avec pouvoirs complets
- [ ] Ajouter scénarios d'usage par persona (parcours détaillés)
- [ ] Documenter émotions/frustrations par phase de la bourse

## DOC-050 — Architecture & ADR
- [x] ✅ Produire diagrammes C4 niveau Contexte, Conteneur et Composant (3 diagrammes Mermaid)
- [x] ✅ Documenter hypothèses d'hébergement (mutualisé OVH/o2switch) et modes offline (fallback PWA)
- [x] ✅ Rédiger 5 ADRs : React+TS frontend, FastAPI backend, MySQL/MariaDB, stratégie offline, hébergement mutualisé
- [x] ✅ Documenter stack technique (frontend, backend, base de données, infrastructure)
- [x] ✅ Créer schéma de données simplifié (ERD avec 7 entités principales)
- [x] ✅ Documenter flux d'authentification JWT et matrice rôles/permissions
- [x] ✅ Analyser risques et mitigations (6 risques identifiés)
- [x] ✅ Lister évolutions futures (mobile native, paiement en ligne, multi-tenant)

## DOC-070 — UI & Flux
- [x] ✅ Concevoir wireframes basse fidélité pour parcours déposant (accueil, listes, articles, ventes, validation)
- [x] ✅ Concevoir wireframes basse fidélité pour parcours bénévole/caisse (scan, vente, modes online/offline)
- [x] ✅ Concevoir wireframes basse fidélité pour parcours gestionnaire (dashboard, import, étiquettes, stats live)
- [x] ✅ Décrire états d'erreur et notifications (12 types : succès, erreur, warning, info avec exemples)
- [x] ✅ Proposer guidelines accessibilité WCAG 2.1 AA (contraste, tailles, navigation clavier, ARIA)
- [x] ✅ Définir charte graphique (couleurs par type liste, typographie Inter, espacements, composants)

## DOC-080 — Sécurité
- [x] ✅ Détailler matrice d'autorisations CRUD par rôle (4 rôles × 10 ressources)
- [x] ✅ Documenter hiérarchie des rôles (Déposant → Bénévole → Gestionnaire → Admin)
- [x] ✅ Lister endpoints autorisés par niveau de rôle
- [x] ✅ Définir règles de propriété des données (isolation déposant)
- [x] ✅ Spécifier mécanisme JWT (access/refresh tokens, payload, TTL)
- [x] ✅ Documenter politique de mot de passe (complexité, blocage)
- [x] ✅ Spécifier politique de conservation et anonymisation données (RGPD)
- [x] ✅ Documenter droits utilisateurs (accès, rectification, effacement, portabilité)
- [x] ✅ Définir chiffrement (bcrypt/Argon2, AES-256, TLS 1.3)
- [x] ✅ Documenter journalisation et audit (événements, format, rétention)
- [x] ✅ Lister protections contre attaques (SQL injection, XSS, CSRF, brute force)
- [x] ✅ Définir headers de sécurité et rate limiting
- [x] ✅ Documenter sécurité caisses offline (signature HMAC, verrouillage)
- [x] ✅ Définir anti-fraude étiquettes (codes uniques, QR sécurisé)
- [x] ✅ Créer plan de réponse aux incidents (classification, contacts, procédure)
- [ ] Définir exigences MFA pour bénévoles/administrateurs (optionnel v2)

## DOC-090 — Opérations
- [x] ✅ Définir SLOs (disponibilité 99.5% bourse, latence scan ≤1.5s, encaissement ≤3s)
- [x] ✅ Formaliser procédures d'ouverture bourse (checklists J-7, J-1, Jour J)
- [x] ✅ Formaliser procédures de fermeture bourse (fin journée, clôture édition J+7)
- [x] ✅ Décrire plan de continuité mode offline (architecture, données sync, fallback manuel)
- [x] ✅ Documenter procédure de resynchronisation (détection, conflits, validation)
- [x] ✅ Définir métriques business et techniques avec seuils d'alerte
- [x] ✅ Créer dashboard temps réel gestionnaire (wireframe ASCII)
- [x] ✅ Définir alerting P1-P4 avec règles et escalade
- [x] ✅ Créer 6 runbooks : réseau offline, étiquette, conflit sync, panne caisse, reversement, panne serveur
- [x] ✅ Définir maintenance planifiée (quotidienne, hebdomadaire, pré-bourse)
- [x] ✅ Créer annexes : checklist équipement, modèle rapport incident, glossaire ops

## DOC-110 — Stratégie de Tests
- [x] ✅ Définir pyramide de tests (unitaires 55-65%, intégration 25-30%, E2E 10-15%)
- [x] ✅ Documenter stack de tests frontend (Vitest, React Testing Library, MSW, Cypress)
- [x] ✅ Documenter stack de tests backend (pytest, pytest-asyncio, httpx, factory_boy)
- [x] ✅ Créer exemples tests unitaires composants React (ArticleForm, ScannerView)
- [x] ✅ Créer exemples tests unitaires services Python (VenteService, ReversementService)
- [x] ✅ Documenter tests d'intégration API (endpoints critiques, sync offline)
- [x] ✅ Créer 4 scénarios E2E complets (déposant, caisse offline, gestionnaire, reversements)
- [x] ✅ Définir tests de performance (k6, seuils latence, charge)
- [x] ✅ Définir tests d'accessibilité (axe-core, WCAG 2.1 AA)
- [x] ✅ Définir tests de sécurité (injection SQL, XSS, authentification)
- [x] ✅ Définir objectifs de couverture (80% global, 90% services critiques)
- [x] ✅ Créer pipeline CI/CD GitHub Actions (tests, sécurité, déploiement)
- [x] ✅ Définir gates de qualité bloquants (tests, couverture, vulnérabilités)
- [x] ✅ Créer fixtures et jeux de données de test
- [x] ✅ Créer checklist avant release

## API — OpenAPI
- [x] ✅ Documenter endpoints Auth (login, logout, refresh, activate, password reset)
- [x] ✅ Documenter endpoints Éditions (CRUD, configure, import-inscriptions, clôturer)
- [x] ✅ Documenter endpoints Créneaux (CRUD par édition)
- [x] ✅ Documenter endpoints Utilisateurs (CRUD, profil, recherche)
- [x] ✅ Documenter endpoints Invitations (création, bulk, resend)
- [x] ✅ Documenter endpoints Listes (CRUD, validation)
- [x] ✅ Documenter endpoints Articles (CRUD, duplication)
- [x] ✅ Documenter endpoints Étiquettes (génération async, téléchargement, stats)
- [x] ✅ Documenter endpoints Ventes (scan, création, annulation, sync offline)
- [x] ✅ Documenter endpoints Reversements (calcul, bordereaux, paiement)
- [x] ✅ Documenter endpoints Stats (édition, ventes live)
- [x] ✅ Définir 40+ schémas de données (enums, entités, requêtes/réponses)
- [x] ✅ Définir schémas d'erreur normalisés et sécurité (JWT Bearer)

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

# Bilan d'avancement (au 2025-11-07)

## ✅ Réalisations clés (version 0.8.0)

### Fondations conceptuelles établies
- **Concept central : Gestion des Éditions** introduit et documenté
- **Cycle de vie complet** : Brouillon → Configurée → Inscriptions → En cours → Clôturée → Archivée
- **4 rôles définis** : Déposant, Bénévole, Gestionnaire, Administrateur
- **Intégration complète des règlements** : Règlement déposant (v0.4.0) + Règlement intérieur (v0.5.0)
- **Listes spéciales 1000/2000** : Système d'adhérents ALPE documenté
- **Gestion des créneaux** : Capacités configurables, créneaux réservés Plaisançois
- **Architecture offline-first** : Mode déconnecté pour scannage ventes, synchronisation automatique
- **Workflow reversements** : Commission 20%/80%, bordereaux PDF signés, clôture édition
- **Gestion des invitations** : Tokens sécurisés 7 jours, import CSV masse, relances automatiques
- **Traçabilité bidirectionnelle** : Matrice complète US ↔ REQ ↔ Tests (82% couverture, objectif 95%)

### Livrables complétés
| Livrable | Statut | Détails |
|----------|--------|---------|
| Glossaire (v0.4.0) | ✅ | 30+ termes incluant listes 1000/2000, créneaux, couleurs étiquettes |
| Personas (v0.2.0) | ✅ | 4 personas détaillés avec profils complets |
| User Stories (v0.4.0) | ✅ 100% | US-001 à US-010 détaillées (9/9 US complètes) |
| Exigences (v0.4.0) | ✅ | REQ-F-001 à F-017 avec règlements déposant + intérieur |
| Modèle domaine (v0.4.0) | ✅ | 8 entités + 23 invariants + types listes + créneaux |
| Catégories articles (v1.0.0) | ✅ | Guide bénévoles complet (317 lignes) |
| Traçabilité (v1.0.0) | ✅ | Matrice US↔REQ↔Tests complète (860 lignes, 82% couverture) |

### Métriques
- **User Stories détaillées** : 9 (US-001 à US-010 — 100% complètes)
  - US-001 : Activer compte déposant (14 AC, 16 tests)
  - US-002 : Déclarer articles (16 AC, 15 tests)
  - US-003 : Générer étiquettes par gestionnaire (15 AC, 18 tests)
  - US-004 : Scanner article et enregistrer vente (15 AC, 20 tests)
  - US-005 : Générer reversements fin édition (13 AC, 20 tests)
  - US-006 : Créer édition (9 AC, 9 tests)
  - US-007 : Configurer dates clés (6 AC, 8 tests)
  - US-008 : Importer inscriptions Billetweb (13 AC, 15 tests) — 🔄 Mise à jour format Billetweb
  - US-009 : Clôturer édition (8 AC, 9 tests)
  - US-010 : Émettre invitations en masse (15 AC, 20 tests)
- **Critères d'acceptation** : 105 (répartis sur 9 US avec règles métier complexes)
- **Scénarios de test** : 134+ (couvrant parcours nominaux, alternatifs, offline, sécurité, performance)
- **Exigences fonctionnelles** : 17 (REQ-F-001 à F-017)
- **Exigences non-fonctionnelles** : 4 (disponibilité, performance, RGPD, accessibilité)
- **Entités du domaine** : 8 (Edition, User, Deposant, Creneau, Liste, Article, Vente, Reversement, Invitation)
- **Invariants système** : 23 (contraintes métier, unicités, cohérences temporelles)

## 🎯 Priorités immédiates

### Court terme (semaine prochaine)
1. ✅ **US-003** : Génération d'étiquettes en masse par gestionnaire (COMPLÉTÉ)
2. ✅ **US-004** : Scannage article et enregistrement vente avec offline-first (COMPLÉTÉ)
3. ✅ **US-005** : Génération reversements avec bordereaux PDF et clôture édition (COMPLÉTÉ)
4. ✅ **US-010** : Émission manuelle d'invitations en masse avec CSV et tokens (COMPLÉTÉ)
5. **REQ-F-004** : Compléter exigence performance scans (< 3s par article)
6. **DOC-060** : Ajouter diagrammes séquence pour parcours dépôt et vente
7. **Traçabilité** : Établir matrice de traçabilité US ↔ REQ ↔ tests

### Moyen terme (2 semaines)
1. ✅ **Architecture** : Diagrammes C4 (Conteneur + Composant) + 5 ADR choix technologiques (COMPLÉTÉ)
2. ✅ **API** : Spécification OpenAPI complète - 50+ endpoints, 11 tags, 40+ schémas (COMPLÉTÉ)
3. ✅ **Sécurité** : Matrice d'autorisations CRUD 4 rôles × 10 ressources, RGPD, audit, anti-fraude (COMPLÉTÉ)
4. ✅ **UI/UX** : Wireframes basse fidélité pour parcours déposant, bénévole, gestionnaire (COMPLÉTÉ)
5. ✅ **Tests** : Stratégie de test (unitaires, intégration, E2E) et critères couverture (COMPLÉTÉ)

# Prochain check-in

Réunion de synchronisation le 2025-11-08 pour examiner l'avancement US/REQ et réajuster priorités si nécessaire.
