# US-006 - Créer une nouvelle édition de bourse

**Branche:** `feature/us-006-edition-management`
**User Story:** En tant qu'administrateur, je veux créer une nouvelle édition de bourse

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
- [ ] **1.1** Créer `backend/app/schemas/edition.py`
  - [ ] `EditionStatus` enum (brouillon, configuree, inscriptions_ouvertes, en_cours, cloturee)
  - [ ] `EditionBase` (name, start_datetime, end_datetime, location?, description?)
  - [ ] `EditionCreate` extends EditionBase
  - [ ] `EditionUpdate` (tous champs optionnels)
  - [ ] `EditionResponse` (inclut id, status, created_at, created_by, etc.)
  - [ ] `EditionListResponse` (liste paginée)

### 2. Backend - Repository
- [ ] **2.1** Créer `backend/app/repositories/edition_repository.py`
  - [ ] `create(edition_data, created_by_id)` → Edition
  - [ ] `get_by_id(id)` → Edition | None
  - [ ] `get_by_name(name)` → Edition | None (pour vérifier unicité)
  - [ ] `get_all(skip, limit)` → list[Edition]
  - [ ] `update(id, edition_data, updated_by_id)` → Edition
  - [ ] `delete(id)` → bool

### 3. Backend - Service
- [ ] **3.1** Créer `backend/app/services/edition_service.py`
  - [ ] `create_edition(data, admin_user)` → Edition
    - Valider unicité du nom
    - Valider datetime_fin > datetime_debut
    - Créer avec status = "brouillon"
  - [ ] `get_edition(id)` → Edition
  - [ ] `list_editions(skip, limit)` → list[Edition]
  - [ ] `update_edition(id, data, user)` → Edition
    - Valider transitions de statut
    - Valider que l'édition n'est pas clôturée
  - [ ] `delete_edition(id)` → bool
    - Seulement si status = "brouillon"

### 4. Backend - API Endpoints
- [ ] **4.1** Créer `backend/app/api/v1/editions.py`
  - [ ] `POST /api/v1/editions` - Créer une édition (admin only)
  - [ ] `GET /api/v1/editions` - Lister les éditions (manager, admin)
  - [ ] `GET /api/v1/editions/{id}` - Détail d'une édition (manager, admin)
  - [ ] `PUT /api/v1/editions/{id}` - Modifier une édition (admin only pour création, manager pour config)
  - [ ] `DELETE /api/v1/editions/{id}` - Supprimer une édition brouillon (admin only)
- [ ] **4.2** Enregistrer le router dans `main.py`

### 5. Backend - Tests
- [ ] **5.1** Tests unitaires pour `edition_service.py`
  - [ ] Test création nominale
  - [ ] Test nom en doublon
  - [ ] Test dates incohérentes
  - [ ] Test suppression édition brouillon
  - [ ] Test suppression édition non-brouillon (refusée)
- [ ] **5.2** Tests d'intégration pour les endpoints
  - [ ] Test CRUD complet
  - [ ] Test permissions (admin vs manager vs deposant)
  - [ ] Test validations

### 6. Frontend - Types TypeScript
- [ ] **6.1** Mettre à jour `frontend/src/types/edition.ts`
  - [ ] Type `EditionStatus`
  - [ ] Interface `Edition`
  - [ ] Interface `EditionCreate`
  - [ ] Interface `EditionUpdate`

### 7. Frontend - API Client
- [ ] **7.1** Créer `frontend/src/api/editions.ts`
  - [ ] `getEditions()` → Edition[]
  - [ ] `getEdition(id)` → Edition
  - [ ] `createEdition(data)` → Edition
  - [ ] `updateEdition(id, data)` → Edition
  - [ ] `deleteEdition(id)` → void

### 8. Frontend - Page liste des éditions
- [ ] **8.1** Créer `EditionsListPage` (`/admin/editions`)
  - [ ] Tableau avec colonnes: Nom, Dates, Lieu, Statut, Actions
  - [ ] Badge coloré selon statut
  - [ ] Bouton "Nouvelle édition" (admin only)
  - [ ] Bouton "Voir" pour chaque édition
  - [ ] Bouton "Supprimer" pour éditions brouillon (admin only)

### 9. Frontend - Modal/Page création d'édition
- [ ] **9.1** Créer `EditionCreateModal` ou `EditionCreatePage`
  - [ ] Champs: Nom, Date/heure début, Date/heure fin, Lieu, Description
  - [ ] Validation formulaire (nom requis, dates requises, fin > début)
  - [ ] Gestion erreur nom en doublon
  - [ ] Message succès et redirection

### 10. Frontend - Routes et navigation
- [ ] **10.1** Ajouter route `/admin/editions`
- [ ] **10.2** Ajouter route `/admin/editions/new` (ou modal)
- [ ] **10.3** Ajouter route `/admin/editions/:id` (détail/configuration)
- [ ] **10.4** Protéger avec ProtectedRoute (roles: manager, administrator)
- [ ] **10.5** Ajouter lien dans le menu admin

### 11. Frontend - Tests
- [ ] **11.1** Tests unitaires EditionsListPage
- [ ] **11.2** Tests unitaires EditionCreateModal

## Critères d'acceptation (depuis US-006)

- [ ] AC-1: Interface liste éditions accessible aux gestionnaires/admins
- [ ] AC-2: Formulaire création avec champs obligatoires (nom, dates)
- [ ] AC-3: Création réussie → statut "Brouillon", message confirmation, redirection
- [ ] AC-4: Erreur si nom d'édition en double
- [ ] AC-5: Validation dates (fin > début)
- [ ] AC-6: Seuls les administrateurs peuvent créer/supprimer des éditions

## Notes techniques

- Utiliser React Query pour la gestion du cache
- Composants UI avec TailwindCSS (cohérent avec le reste de l'app)
- Format datetime: ISO 8601
- Le modèle Edition existe déjà dans `backend/app/models/edition.py`
