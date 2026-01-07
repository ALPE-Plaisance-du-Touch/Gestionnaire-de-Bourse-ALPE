# TODO US-008 — Importer les inscriptions depuis Billetweb

## Critères d'acceptation

- [x] **AC-1** : Bouton "Importer les inscriptions Billetweb" visible sur édition en statut "Configurée"
- [x] **AC-2** : Modale d'import avec sélection fichier (.csv), instructions et boutons Prévisualiser/Importer
- [x] **AC-3** : Prévisualisation avec tableau récapitulatif (lignes totales, payés/valides, existants/nouveaux, doublons, erreurs)
- [x] **AC-4** : Import réussi : association existants, création nouveaux comptes, envoi invitations, redirection liste déposants
- [x] **AC-5** : Gestion doublons email dans le fichier (seule 1ère occurrence gardée)
- [x] **AC-6** : Déposants déjà associés à l'édition ignorés sans erreur
- [x] **AC-7** : Erreur format fichier invalide (colonnes manquantes)
- [x] **AC-8** : Erreur créneaux non reconnus (bloquant)
- [x] **AC-10** : Erreur données invalides (emails, téléphones) avec option ignorer
- [x] **AC-11** : Notification email aux déposants existants associés
- [x] **AC-12** : Limite 5 Mo ou 500 lignes max
- [x] **AC-13** : Contrôle d'accès (gestionnaire/admin uniquement)

## Tâches Backend

### Modèles et migrations

- [x] Créer le modèle `EditionDepositor` (association déposant-édition avec type de liste et créneau)
- [x] Créer la table d'audit des imports (`billetweb_import_log`)
- [x] Migration Alembic

### Service d'import Billetweb

- [x] Créer `BilletwebImportService` dans `backend/app/services/`
- [x] Parser le fichier CSV avec le module csv standard
- [x] Extraire les colonnes utiles par nom (Nom, Prénom, Email, Séance, Tarif, Payé, Valide, Téléphone, Code postal, Ville)
- [x] Filtrer : Payé="Oui" ET Valide="Oui"
- [x] Valider le format du fichier (colonnes requises présentes)
- [x] Valider les emails (format RFC 5322)
- [x] Valider les téléphones (format français)
- [x] Mapper les créneaux (Séance) vers les `DepositSlot` de l'édition
- [x] Mapper les tarifs vers les types de liste (standard/1000/2000)
- [x] Détecter les doublons email dans le fichier
- [x] Identifier déposants existants vs nouveaux (par email)
- [x] Identifier déposants déjà associés à l'édition

### Logique d'import

- [x] Associer les déposants existants à l'édition
- [x] Créer les nouveaux comptes utilisateurs (statut "invitation_envoyee")
- [x] Générer les invitations (token 7 jours) pour les nouveaux
- [x] Enregistrer l'import dans les logs d'audit

### Service d'email

- [x] Template email invitation nouveaux déposants (avec créneau et type liste)
- [x] Template email notification déposants existants
- [x] Envoi des emails en batch

### API Endpoints

- [x] `POST /api/v1/editions/{id}/billetweb/preview` - Prévisualisation
- [x] `POST /api/v1/editions/{id}/billetweb/import` - Import effectif
- [x] `GET /api/v1/editions/{id}/billetweb/depositors` - Liste des déposants
- [x] `GET /api/v1/editions/{id}/billetweb/import-logs` - Historique des imports
- [x] `GET /api/v1/editions/{id}/billetweb/stats` - Statistiques
- [x] Schémas Pydantic pour requête (multipart file) et réponses
- [x] Validation : édition en statut "Configurée"
- [x] Validation : rôle gestionnaire ou admin
- [x] Validation : taille fichier <= 5 Mo, <= 500 lignes

### Repository

- [x] Créer `EditionDepositorRepository`
- [x] Créer `BilletwebImportLogRepository`
- [x] Méthodes : association déposant-édition, vérification doublon, etc.

### Tests Backend

- [x] Tests unitaires `BilletwebImportService`
- [x] Tests parsing CSV (fichier valide, colonnes manquantes, etc.)
- [x] Tests validation (emails, téléphones, créneaux)
- [x] Tests intégration API endpoints
- [x] Tests contrôle d'accès
- [x] Fixtures : fichiers CSV de test

## Tâches Frontend

### Types TypeScript

- [x] `BilletwebPreviewResult` (résumé prévisualisation)
- [x] `BilletwebImportResult` (résumé import)
- [x] `BilletwebError` (erreur ligne par ligne)

### API Client

- [x] `previewBilletwebImport(editionId, file)` dans `api/billetweb.ts`
- [x] `importBilletweb(editionId, file, options)` dans `api/billetweb.ts`

### Composants

- [x] `BilletwebImportButton` - Bouton sur page édition (si statut Configurée)
- [x] `BilletwebImportModal` - Modale d'import
  - [x] Zone de sélection fichier (drag & drop)
  - [x] Instructions et liste colonnes requises
  - [x] Bouton Prévisualiser / Importer
- [x] `BilletwebPreviewTable` - Tableau récapitulatif prévisualisation
  - [x] Statistiques (total, payés, nouveaux, existants, doublons)
  - [x] Liste des erreurs ligne par ligne
  - [x] Avertissement doublons
- [x] `BilletwebImportResult` - Résultat après import
  - [x] Résumé (X associés, Y invitations envoyées)
  - [x] Bouton vers liste déposants

### Pages

- [x] Intégrer `BilletwebImportButton` dans page détail édition
- [x] Route vers liste déposants de l'édition (`/editions/:id/depositors`)
- [x] `EditionDepositorsPage` - Liste paginée des déposants avec filtres

### Tests Frontend

- [x] Tests composants (modal, preview, result)
- [x] Tests API client (mocks)
- [x] Tests intégration page édition

## Fichiers créés/modifiés

### Backend

- [x] `backend/app/models/edition_depositor.py` (nouveau)
- [x] `backend/app/models/billetweb_import_log.py` (nouveau)
- [x] `backend/app/models/__init__.py` (export nouveaux modèles)
- [x] `backend/app/repositories/edition_depositor.py` (nouveau)
- [x] `backend/app/repositories/billetweb_import_log.py` (nouveau)
- [x] `backend/app/services/billetweb_import.py` (nouveau)
- [x] `backend/app/services/email.py` (nouveaux templates)
- [x] `backend/app/schemas/billetweb.py` (nouveau)
- [x] `backend/app/api/v1/endpoints/billetweb.py` (nouveau)
- [x] `backend/app/api/v1/__init__.py` (ajouter route)
- [x] `backend/migrations/versions/20251231_0001_add_billetweb_import_tables.py` (nouveau)
- [x] `backend/requirements.txt` (pas de dépendance externe, CSV natif)
- [x] `backend/templates/email/billetweb_invitation.html` (nouveau)
- [x] `backend/templates/email/billetweb_invitation.txt` (nouveau)
- [x] `backend/templates/email/edition_registration.html` (nouveau)
- [x] `backend/templates/email/edition_registration.txt` (nouveau)
- [x] `backend/tests/unit/test_billetweb_import.py` (nouveau)
- [x] `backend/tests/integration/test_billetweb_api.py` (nouveau)
- [x] `backend/tests/fixtures/billetweb_*.csv` (nouveaux)

### Frontend

- [x] `frontend/src/types/billetweb.ts` (nouveau)
- [x] `frontend/src/api/billetweb.ts` (nouveau)
- [x] `frontend/src/components/billetweb/BilletwebImportButton.tsx` (nouveau)
- [x] `frontend/src/components/billetweb/BilletwebImportModal.tsx` (nouveau)
- [x] `frontend/src/components/billetweb/BilletwebPreviewTable.tsx` (nouveau)
- [x] `frontend/src/components/billetweb/BilletwebImportResult.tsx` (nouveau)
- [x] `frontend/src/components/billetweb/index.ts` (nouveau)
- [x] `frontend/src/pages/admin/EditionDetailPage.tsx` (modifier)
- [x] `frontend/src/components/billetweb/BilletwebImportButton.test.tsx` (nouveau)
- [x] `frontend/src/components/billetweb/BilletwebImportModal.test.tsx` (nouveau)
- [x] `frontend/src/components/billetweb/BilletwebPreviewTable.test.tsx` (nouveau)
- [x] `frontend/src/components/billetweb/BilletwebImportResult.test.tsx` (nouveau)
- [x] `frontend/src/pages/admin/EditionDepositorsPage.tsx` (nouveau)
- [x] `frontend/src/pages/admin/index.ts` (export ajouté)
- [x] `frontend/src/routes.tsx` (route ajoutée)

## Mapping Tarifs Billetweb -> Type de liste

| Tarif Billetweb | Type de liste | Code |
|-----------------|---------------|------|
| "Standard", "Normal", "Classique" | Standard | 100-600 |
| "Réservé habitants de Plaisance" | Liste 1000 | 1000+ |
| "Adhérent ALPE", "Membre ALPE" | Liste 1000 | 1000+ |
| "Famille", "Ami", "Famille/Ami" | Liste 2000 | 2000+ |

## Format du fichier CSV Billetweb

**Colonnes requises :**
- `Nom` - Nom de famille
- `Prénom` - Prénom
- `Email` - Adresse email
- `Séance` - Créneau au format datetime (ex: "2025-11-05 20:00")
- `Tarif` - Type de tarif (mappé vers type de liste)
- `Payé` - "Oui" ou "Non"
- `Valide` - "Oui" ou "Non"

**Colonnes optionnelles :**
- `Téléphone (Commande) - #5` - Numéro de téléphone
- `Adresse (Commande) - #7` - Adresse postale
- `Code postal (Commande) - #8` - Code postal
- `Ville (Commande) - #9` - Ville
- `Commande` - Référence de commande Billetweb

## Mapping Créneaux

Le champ "Séance" de Billetweb contient une date/heure au format `YYYY-MM-DD HH:MM`.
Ce format est comparé au `start_datetime` des créneaux de dépôt configurés.

Exemple :
- Billetweb : "2025-11-05 20:00"
- Créneau configuré : start_datetime = 2025-11-05 20:00

## Dépendances techniques

- Module `csv` de Python (standard, pas de dépendance externe)

## Notes

- Volume attendu : 200-300 inscriptions par édition
- Token invitation : 7 jours de validité
- Code postal 31830 = Plaisançois (info utile pour stats)

## Reste à faire

1. ~~**Tests** : Écrire les tests unitaires et d'intégration (backend + frontend)~~ ✅ Complété
2. ~~**Page liste déposants** : Créer la route/page pour afficher les déposants d'une édition~~ ✅ Complété

**US-008 terminée !** Tous les critères d'acceptation sont validés.

## Résumé des tests

### Backend (34 tests)
- **Unit tests** (`test_billetweb_import.py`): 21 tests
  - Validation email/téléphone
  - Normalisation téléphone
  - Mapping tarifs vers types de liste
  - Parsing CSV (fichiers valides, colonnes manquantes, données invalides, non-payés, doublons)
  - Templates email
- **Integration tests** (`test_billetweb_api.py`): 13 tests
  - Authentification requise
  - Contrôle d'accès (rôle manager/admin)
  - Preview/Import endpoints
  - Validation fichier CSV
  - Statistiques et liste déposants

### Frontend (41 tests)
- `BilletwebImportButton.test.tsx`: 9 tests (visibilité, compteur, interactions modal)
- `BilletwebImportModal.test.tsx`: 14 tests (rendu, sélection fichier, preview, import)
- `BilletwebPreviewTable.test.tsx`: 9 tests (statistiques, erreurs, warnings)
- `BilletwebImportResult.test.tsx`: 9 tests (succès, erreur, détails résultat)
