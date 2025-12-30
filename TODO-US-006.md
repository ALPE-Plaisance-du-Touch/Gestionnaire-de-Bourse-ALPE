# US-006 - Créer une nouvelle édition de bourse

**Branche:** `feature/us-006-edition-management`
**User Story:** En tant qu'administrateur, je veux créer une nouvelle édition de bourse
**Statut:** ✅ TERMINÉ

## Contexte

Une édition représente un événement de bourse (ex: "Bourse Printemps 2025"). Seuls les administrateurs peuvent créer des éditions. Une édition créée est en statut "Brouillon" jusqu'à configuration complète (US-007).

### Cycle de vie d'une édition
1. **Brouillon** → Création (US-006)
2. **Configurée** → Configuration dates (US-007)
3. **Inscriptions_ouvertes** → Import Billetweb (US-008)
4. **En_cours** → Période de dépôt/vente active
5. **Clôturée** → Terminée (US-009)

### Modèle de données Edition
- `id` (UUID)
- `name` (string, unique, max 100 caractères, obligatoire)
- `start_datetime` (datetime, obligatoire)
- `end_datetime` (datetime, obligatoire)
- `location` (string, max 200 caractères, optionnel)
- `description` (text, optionnel)
- `status` (enum: brouillon, configurée, inscriptions_ouvertes, en_cours, clôturée)
- `created_at`, `created_by`, `updated_at`, `updated_by`

## Tâches

### 1. Backend - Schemas Pydantic
- [x] **1.1** Créer `backend/app/schemas/edition.py`
  - [x] `EditionStatus` enum (brouillon, configuree, inscriptions_ouvertes, en_cours, cloturee)
  - [x] `EditionBase` (name, start_datetime, end_datetime, location?, description?)
  - [x] `EditionCreate` extends EditionBase
  - [x] `EditionUpdate` (tous champs optionnels)
  - [x] `EditionResponse` (inclut id, status, created_at, created_by, etc.)
  - [x] `EditionListResponse` (liste paginée)

### 2. Backend - Repository
- [x] **2.1** Créer `backend/app/repositories/edition.py`
  - [x] `create(edition_data, created_by_id)` → Edition
  - [x] `get_by_id(id)` → Edition | None
  - [x] `name_exists(name)` → bool (pour vérifier unicité)
  - [x] `list_editions(skip, limit, status?)` → list[Edition]
  - [x] `update(id, edition_data)` → Edition
  - [x] `delete(id)` → bool

### 3. Backend - Service
- [x] **3.1** Créer `backend/app/services/edition.py`
  - [x] `create_edition(data, admin_user)` → Edition
    - Valider unicité du nom
    - Valider datetime_fin > datetime_debut
    - Créer avec status = "brouillon"
  - [x] `get_edition(id)` → Edition
  - [x] `list_editions(skip, limit)` → list[Edition]
  - [x] `update_edition(id, data, user)` → Edition
    - Valider transitions de statut
  - [x] `update_status(id, new_status)` → Edition
    - Valider transitions de statut valides
  - [x] `delete_edition(id)` → bool
    - Seulement si status = "brouillon"

### 4. Backend - API Endpoints
- [x] **4.1** Créer `backend/app/api/v1/endpoints/editions.py`
  - [x] `POST /api/v1/editions` - Créer une édition (admin only)
  - [x] `GET /api/v1/editions` - Lister les éditions (manager, admin)
  - [x] `GET /api/v1/editions/{id}` - Détail d'une édition (manager, admin)
  - [x] `PUT /api/v1/editions/{id}` - Modifier une édition (manager, admin)
  - [x] `PATCH /api/v1/editions/{id}/status` - Changer le statut (manager, admin)
  - [x] `DELETE /api/v1/editions/{id}` - Supprimer une édition brouillon (admin only)
- [x] **4.2** Enregistrer le router dans `api/v1/__init__.py`

### 5. Backend - Tests
- [x] **5.1** Tests d'intégration pour les endpoints (`backend/tests/integration/test_editions_api.py`)
  - [x] Test création nominale
  - [x] Test nom en doublon
  - [x] Test dates incohérentes
  - [x] Test suppression édition brouillon
  - [x] Test suppression édition non-brouillon (refusée)
  - [x] Test CRUD complet
  - [x] Test permissions (admin vs manager vs deposant)
  - [x] Test validations

### 6. Frontend - Types TypeScript
- [x] **6.1** Mettre à jour `frontend/src/types/edition.ts`
  - [x] Type `EditionStatus`
  - [x] Interface `Edition` (avec champs camelCase)
  - [x] Interface `EditionCreator`
  - [x] Interface `CreateEditionRequest`
  - [x] Interface `UpdateEditionRequest`
  - [x] Interface `EditionListResponse`

### 7. Frontend - API Client
- [x] **7.1** Mettre à jour `frontend/src/api/editions.ts`
  - [x] Transformation snake_case (API) → camelCase (frontend)
  - [x] `getEditions(params?)` → EditionListResponse
  - [x] `getEdition(id)` → Edition
  - [x] `createEdition(data)` → Edition
  - [x] `updateEdition(id, data)` → Edition
  - [x] `updateEditionStatus(id, status)` → Edition
  - [x] `deleteEdition(id)` → void

### 8. Frontend - Page liste des éditions
- [x] **8.1** Créer `EditionsListPage` (`frontend/src/pages/admin/EditionsListPage.tsx`)
  - [x] Tableau avec colonnes: Nom, Dates, Lieu, Statut, Créée par, Actions
  - [x] Badge coloré selon statut
  - [x] Statistiques (Total, Brouillons, En cours, Clôturées)
  - [x] Filtre par statut
  - [x] Bouton "Nouvelle édition" (admin only)
  - [x] Bouton "Modifier" pour chaque édition
  - [x] Bouton "Supprimer" pour éditions brouillon (admin only)
  - [x] Modal de confirmation de suppression

### 9. Frontend - Modal création d'édition
- [x] **9.1** Créer `EditionCreateModal` (`frontend/src/components/editions/EditionCreateModal.tsx`)
  - [x] Champs: Nom, Date/heure début, Date/heure fin, Lieu, Description
  - [x] Validation formulaire (nom requis, dates requises, fin > début)
  - [x] Gestion erreur nom en doublon
  - [x] Message succès et option "Créer une autre édition"

### 10. Frontend - Routes et navigation
- [x] **10.1** Ajouter route `/editions` (manager, admin)
- [x] **10.2** Ajouter route `/admin/editions` (manager, admin)
- [x] **10.3** Créer `EditionsPageWrapper` pour intégrer page et modals
- [x] **10.4** Protéger avec ProtectedRoute (roles: manager, administrator)

### 11. Frontend - Tests
- [x] **11.1** Tests unitaires `EditionsListPage` (`EditionsListPage.test.tsx`)
- [x] **11.2** Tests unitaires `EditionCreateModal` (`EditionCreateModal.test.tsx`)

## Critères d'acceptation (depuis US-006)

- [x] AC-1: Interface liste éditions accessible aux gestionnaires/admins
- [x] AC-2: Formulaire création avec champs obligatoires (nom, dates)
- [x] AC-3: Création réussie → statut "Brouillon", message confirmation
- [x] AC-4: Erreur si nom d'édition en double
- [x] AC-5: Validation dates (fin > début)
- [x] AC-6: Seuls les administrateurs peuvent créer/supprimer des éditions

## Fichiers créés/modifiés

### Backend
- `backend/app/schemas/edition.py` (nouveau)
- `backend/app/schemas/__init__.py` (modifié)
- `backend/app/repositories/edition.py` (nouveau)
- `backend/app/repositories/__init__.py` (modifié)
- `backend/app/services/edition.py` (nouveau)
- `backend/app/services/__init__.py` (modifié)
- `backend/app/api/v1/endpoints/editions.py` (nouveau)
- `backend/app/api/v1/__init__.py` (modifié)
- `backend/tests/integration/test_editions_api.py` (nouveau)

### Frontend
- `frontend/src/types/edition.ts` (modifié)
- `frontend/src/api/editions.ts` (réécrit)
- `frontend/src/components/editions/EditionCreateModal.tsx` (nouveau)
- `frontend/src/components/editions/EditionCreateModal.test.tsx` (nouveau)
- `frontend/src/components/editions/index.ts` (nouveau)
- `frontend/src/pages/admin/EditionsListPage.tsx` (nouveau)
- `frontend/src/pages/admin/EditionsListPage.test.tsx` (nouveau)
- `frontend/src/pages/admin/EditionsPageWrapper.tsx` (nouveau)
- `frontend/src/pages/admin/index.ts` (modifié)
- `frontend/src/routes.tsx` (modifié)

## Notes techniques

- React Query pour la gestion du cache
- Composants UI avec TailwindCSS (cohérent avec le reste de l'app)
- Format datetime: ISO 8601
- Transformation snake_case (API) ↔ camelCase (frontend) dans le client API
- Le modèle Edition existait déjà dans `backend/app/models/edition.py`
