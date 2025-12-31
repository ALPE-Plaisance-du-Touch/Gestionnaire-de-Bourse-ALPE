# TODO US-008 — Importer les inscriptions depuis Billetweb

## Critères d'acceptation

- [ ] **AC-1** : Bouton "Importer les inscriptions Billetweb" visible sur édition en statut "Configurée"
- [ ] **AC-2** : Modale d'import avec sélection fichier (.xlsx/.xls), instructions et boutons Prévisualiser/Importer
- [ ] **AC-3** : Prévisualisation avec tableau récapitulatif (lignes totales, payés/valides, existants/nouveaux, doublons, erreurs)
- [ ] **AC-4** : Import réussi : association existants, création nouveaux comptes, envoi invitations, redirection liste déposants
- [ ] **AC-5** : Gestion doublons email dans le fichier (seule 1ère occurrence gardée)
- [ ] **AC-6** : Déposants déjà associés à l'édition ignorés sans erreur
- [ ] **AC-7** : Erreur format fichier invalide (colonnes manquantes)
- [ ] **AC-8** : Erreur créneaux non reconnus (bloquant)
- [ ] **AC-10** : Erreur données invalides (emails, téléphones) avec option ignorer
- [ ] **AC-11** : Notification email aux déposants existants associés
- [ ] **AC-12** : Limite 5 Mo ou 500 lignes max
- [ ] **AC-13** : Contrôle d'accès (gestionnaire/admin uniquement)

## Tâches Backend

### Modèles et migrations

- [ ] Créer le modèle `EditionDepositor` (association déposant-édition avec type de liste et créneau)
- [ ] Créer la table d'audit des imports (`billetweb_import_log`)
- [ ] Migration Alembic

### Service d'import Billetweb

- [ ] Créer `BilletwebImportService` dans `backend/app/services/`
- [ ] Parser le fichier Excel (.xlsx/.xls) avec openpyxl
- [ ] Extraire les colonnes utiles (D, F, G, J, K, L, P, Y, Z, AE, AF, AG, AH)
- [ ] Filtrer : Payé="Oui" ET Valide="Oui"
- [ ] Valider le format du fichier (colonnes requises présentes)
- [ ] Valider les emails (format RFC 5322)
- [ ] Valider les téléphones (format français)
- [ ] Mapper les créneaux (Séance) vers les `DepositSlot` de l'édition
- [ ] Mapper les tarifs vers les types de liste (standard/1000/2000)
- [ ] Détecter les doublons email dans le fichier
- [ ] Identifier déposants existants vs nouveaux (par email)
- [ ] Identifier déposants déjà associés à l'édition

### Logique d'import

- [ ] Associer les déposants existants à l'édition
- [ ] Créer les nouveaux comptes utilisateurs (statut "invitation_envoyee")
- [ ] Générer les invitations (token 7 jours) pour les nouveaux
- [ ] Enregistrer l'import dans les logs d'audit

### Service d'email

- [ ] Template email invitation nouveaux déposants (avec créneau et type liste)
- [ ] Template email notification déposants existants
- [ ] Envoi des emails en batch

### API Endpoints

- [ ] `POST /api/v1/editions/{id}/billetweb/preview` - Prévisualisation
- [ ] `POST /api/v1/editions/{id}/billetweb/import` - Import effectif
- [ ] Schémas Pydantic pour requête (multipart file) et réponses
- [ ] Validation : édition en statut "Configurée"
- [ ] Validation : rôle gestionnaire ou admin
- [ ] Validation : taille fichier <= 5 Mo, <= 500 lignes

### Repository

- [ ] Créer `EditionDepositorRepository`
- [ ] Créer `BilletwebImportLogRepository`
- [ ] Méthodes : association déposant-édition, vérification doublon, etc.

### Tests Backend

- [ ] Tests unitaires `BilletwebImportService`
- [ ] Tests parsing Excel (fichier valide, colonnes manquantes, etc.)
- [ ] Tests validation (emails, téléphones, créneaux)
- [ ] Tests intégration API endpoints
- [ ] Tests contrôle d'accès
- [ ] Fixtures : fichiers Excel de test

## Tâches Frontend

### Types TypeScript

- [ ] `BilletwebPreviewResult` (résumé prévisualisation)
- [ ] `BilletwebImportResult` (résumé import)
- [ ] `BilletwebError` (erreur ligne par ligne)

### API Client

- [ ] `previewBilletwebImport(editionId, file)` dans `api/billetweb.ts`
- [ ] `importBilletweb(editionId, file, options)` dans `api/billetweb.ts`

### Composants

- [ ] `BilletwebImportButton` - Bouton sur page édition (si statut Configurée)
- [ ] `BilletwebImportModal` - Modale d'import
  - [ ] Zone de sélection fichier (drag & drop)
  - [ ] Instructions et liste colonnes requises
  - [ ] Bouton Prévisualiser / Importer
- [ ] `BilletwebPreviewTable` - Tableau récapitulatif prévisualisation
  - [ ] Statistiques (total, payés, nouveaux, existants, doublons)
  - [ ] Liste des erreurs ligne par ligne
  - [ ] Avertissement doublons
- [ ] `BilletwebImportResult` - Résultat après import
  - [ ] Résumé (X associés, Y invitations envoyées)
  - [ ] Bouton vers liste déposants

### Pages

- [ ] Intégrer `BilletwebImportButton` dans page détail édition
- [ ] Route vers liste déposants de l'édition (à créer si inexistante)

### Tests Frontend

- [ ] Tests composants (modal, preview, result)
- [ ] Tests API client (mocks)
- [ ] Tests intégration page édition

## Fichiers à créer/modifier

### Backend

- `backend/app/models/edition_depositor.py` (nouveau)
- `backend/app/models/billetweb_import_log.py` (nouveau)
- `backend/app/models/__init__.py` (export nouveaux modèles)
- `backend/app/repositories/edition_depositor.py` (nouveau)
- `backend/app/repositories/billetweb_import_log.py` (nouveau)
- `backend/app/services/billetweb_import.py` (nouveau)
- `backend/app/services/email.py` (nouveaux templates)
- `backend/app/schemas/billetweb.py` (nouveau)
- `backend/app/api/v1/endpoints/billetweb.py` (nouveau)
- `backend/app/api/v1/router.py` (ajouter route)
- `backend/migrations/versions/xxx_add_billetweb_import.py` (nouveau)
- `backend/requirements.txt` (ajouter openpyxl)
- `backend/tests/test_billetweb_import.py` (nouveau)
- `backend/tests/fixtures/billetweb_*.xlsx` (nouveaux)

### Frontend

- `frontend/src/types/billetweb.ts` (nouveau)
- `frontend/src/api/billetweb.ts` (nouveau)
- `frontend/src/components/billetweb/BilletwebImportButton.tsx` (nouveau)
- `frontend/src/components/billetweb/BilletwebImportModal.tsx` (nouveau)
- `frontend/src/components/billetweb/BilletwebPreviewTable.tsx` (nouveau)
- `frontend/src/components/billetweb/BilletwebImportResult.tsx` (nouveau)
- `frontend/src/components/billetweb/index.ts` (nouveau)
- `frontend/src/pages/admin/EditionDetailPage.tsx` (modifier)
- `frontend/src/tests/billetweb.test.tsx` (nouveau)

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
