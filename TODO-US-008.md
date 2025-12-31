# TODO US-008 — Importer les inscriptions depuis Billetweb

## Critères d'acceptation

- [x] **AC-1** : Bouton "Importer les inscriptions Billetweb" visible sur édition en statut "Configurée"
- [x] **AC-2** : Modale d'import avec sélection fichier (.xlsx/.xls), instructions et boutons Prévisualiser/Importer
- [x] **AC-3** : Prévisualisation avec tableau récapitulatif (lignes totales, payés/valides, existants/nouveaux, doublons, erreurs)
- [x] **AC-4** : Import réussi : association existants, création nouveaux comptes, envoi invitations, redirection liste déposants
- [x] **AC-5** : Gestion doublons email dans le fichier (seule 1ère occurrence gardée)
- [x] **AC-6** : Déposants déjà associés à l'édition ignorés sans erreur
- [x] **AC-7** : Erreur format fichier invalide (colonnes manquantes)
- [ ] **AC-8** : Erreur créneaux non reconnus (bloquant)
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
- [x] Parser le fichier Excel (.xlsx/.xls) avec openpyxl
- [x] Extraire les colonnes utiles (D, F, G, J, K, L, P, Y, Z, AE, AF, AG, AH)
- [x] Filtrer : Payé="Oui" ET Valide="Oui"
- [x] Valider le format du fichier (colonnes requises présentes)
- [x] Valider les emails (format RFC 5322)
- [x] Valider les téléphones (format français)
- [ ] Mapper les créneaux (Séance) vers les `DepositSlot` de l'édition
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

- [ ] Tests unitaires `BilletwebImportService`
- [ ] Tests parsing Excel (fichier valide, colonnes manquantes, etc.)
- [ ] Tests validation (emails, téléphones, créneaux)
- [ ] Tests intégration API endpoints
- [ ] Tests contrôle d'accès
- [ ] Fixtures : fichiers Excel de test

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
  - [ ] Bouton vers liste déposants

### Pages

- [x] Intégrer `BilletwebImportButton` dans page détail édition
- [ ] Route vers liste déposants de l'édition (à créer si inexistante)

### Tests Frontend

- [ ] Tests composants (modal, preview, result)
- [ ] Tests API client (mocks)
- [ ] Tests intégration page édition

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
- [x] `backend/requirements.txt` (ajouter openpyxl)
- [x] `backend/templates/email/billetweb_invitation.html` (nouveau)
- [x] `backend/templates/email/billetweb_invitation.txt` (nouveau)
- [x] `backend/templates/email/edition_registration.html` (nouveau)
- [x] `backend/templates/email/edition_registration.txt` (nouveau)
- [ ] `backend/tests/test_billetweb_import.py` (nouveau)
- [ ] `backend/tests/fixtures/billetweb_*.xlsx` (nouveaux)

### Frontend

- [x] `frontend/src/types/billetweb.ts` (nouveau)
- [x] `frontend/src/api/billetweb.ts` (nouveau)
- [x] `frontend/src/components/billetweb/BilletwebImportButton.tsx` (nouveau)
- [x] `frontend/src/components/billetweb/BilletwebImportModal.tsx` (nouveau)
- [x] `frontend/src/components/billetweb/BilletwebPreviewTable.tsx` (nouveau)
- [x] `frontend/src/components/billetweb/BilletwebImportResult.tsx` (nouveau)
- [x] `frontend/src/components/billetweb/index.ts` (nouveau)
- [x] `frontend/src/pages/admin/EditionDetailPage.tsx` (modifier)
- [ ] `frontend/src/tests/billetweb.test.tsx` (nouveau)

## Mapping Tarifs Billetweb -> Type de liste

| Tarif Billetweb | Type de liste | Code |
|-----------------|---------------|------|
| "Standard" | Standard | 100-600 |
| "Adhérent ALPE" | Liste 1000 | 1000+ |
| "Famille/Ami" | Liste 2000 | 2000+ |

> Note : Confirmer les libellés exacts des tarifs Billetweb avec l'équipe ALPE.

## Mapping Créneaux

Le champ "Séance" de Billetweb doit correspondre **exactement** au label des créneaux configurés dans l'édition (US-007).

Exemple :
- Billetweb : "Samedi 15 mars 9h-12h"
- Créneau configuré : "Samedi 15 mars 9h-12h"

> Note : Définir la stratégie de matching (exact, fuzzy, ou normalisation).

## Dépendances techniques

- `openpyxl` : Lecture fichiers Excel (.xlsx)
- `xlrd` : Lecture fichiers Excel anciens (.xls) - optionnel

## Notes

- Volume attendu : 200-300 inscriptions par édition
- Token invitation : 7 jours de validité
- Code postal 31830 = Plaisançois (info utile pour stats)

## Reste à faire

1. **AC-8** : Mapper les créneaux Billetweb vers les `DepositSlot` - nécessite de connaître le format exact du champ "Séance"
2. **Tests** : Écrire les tests unitaires et d'intégration (backend + frontend)
3. **Page liste déposants** : Créer la route/page pour afficher les déposants d'une édition
