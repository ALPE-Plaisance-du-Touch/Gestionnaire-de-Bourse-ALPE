# Development Roadmap

This file tracks the implementation progress of the Bourse ALPE application based on the [specifications v1.0.0](docs/README.md).

## Quick Status

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0: Scaffolding | ✅ Done | 100% |
| Phase 1: Core Infrastructure | 🔲 Not Started | 0% |
| Phase 2: Depositor Features | 🔲 Not Started | 0% |
| Phase 3: Volunteer Features | 🔲 Not Started | 0% |
| Phase 4: Manager Features | 🔲 Not Started | 0% |
| Phase 5: PWA & Offline | 🔲 Not Started | 0% |

**Current Task:** Phase 1.1 - Authentication system (US-001)

---

## Phase 0: Project Scaffolding ✅

- [x] Backend structure (FastAPI, SQLAlchemy, Alembic)
- [x] Frontend structure (React, Vite, TailwindCSS)
- [x] Docker development environment
- [x] Makefile with helper commands

---

## Phase 1: Core Infrastructure

### 1.1 Authentication System (US-001, US-010)
**Branch:** `feature/us-001-invitation-activation`

#### Backend Tasks
- [ ] **1.1.1** Create initial Alembic migration for all models
- [ ] **1.1.2** Implement auth schemas (Pydantic)
  - [ ] `LoginRequest`, `LoginResponse`
  - [ ] `ActivateAccountRequest`
  - [ ] `TokenResponse`, `RefreshTokenRequest`
- [ ] **1.1.3** Implement auth service
  - [ ] Password hashing (bcrypt)
  - [ ] JWT token generation/validation
  - [ ] Token refresh logic
- [ ] **1.1.4** Implement auth repository
  - [ ] User CRUD operations
  - [ ] Token management
- [ ] **1.1.5** Implement auth API endpoints
  - [ ] `POST /api/v1/auth/login`
  - [ ] `POST /api/v1/auth/logout`
  - [ ] `POST /api/v1/auth/refresh`
  - [ ] `POST /api/v1/auth/activate`
  - [ ] `GET /api/v1/auth/me`
- [ ] **1.1.6** Implement invitation system
  - [ ] `POST /api/v1/invitations` (create invitation)
  - [ ] `POST /api/v1/invitations/bulk` (bulk create)
  - [ ] Token generation and validation
  - [ ] Email sending (async)
- [ ] **1.1.7** Rate limiting middleware
- [ ] **1.1.8** Write unit tests for auth service
- [ ] **1.1.9** Write integration tests for auth endpoints

#### Frontend Tasks
- [ ] **1.1.10** Create AuthContext for global auth state
- [ ] **1.1.11** Implement LoginPage
  - [ ] Login form with validation (Zod)
  - [ ] Error handling
  - [ ] Redirect after login
- [ ] **1.1.12** Implement ActivatePage
  - [ ] Activation form with password strength indicator
  - [ ] CGU/RGPD checkboxes
  - [ ] Phone validation (French format)
  - [ ] Error states (expired, invalid, already used)
- [ ] **1.1.13** Implement ProtectedRoute component
- [ ] **1.1.14** Update Header with auth state
- [ ] **1.1.15** Add token refresh logic in API client
- [ ] **1.1.16** Write component tests

### 1.2 Edition Management (US-006, US-007)
**Branch:** `feature/us-006-edition-management`

#### Backend Tasks
- [ ] **1.2.1** Implement edition schemas
- [ ] **1.2.2** Implement edition service
  - [ ] Lifecycle state machine
  - [ ] Date validations
- [ ] **1.2.3** Implement edition repository
- [ ] **1.2.4** Implement edition API endpoints
  - [ ] CRUD operations
  - [ ] Status transitions
- [ ] **1.2.5** Write tests

#### Frontend Tasks
- [ ] **1.2.6** Implement EditionListPage
- [ ] **1.2.7** Implement EditionCreatePage
- [ ] **1.2.8** Implement EditionDetailPage
- [ ] **1.2.9** Implement EditionConfigPage (dates)
- [ ] **1.2.10** Write tests

### 1.3 Billetweb Import (US-008)
**Branch:** `feature/us-008-billetweb-import`

- [ ] **1.3.1** CSV parser service
- [ ] **1.3.2** Import API endpoint
- [ ] **1.3.3** Duplicate detection
- [ ] **1.3.4** Import UI with preview
- [ ] **1.3.5** Write tests

---

## Phase 2: Depositor Features

### 2.1 Article Declaration (US-002)
**Branch:** `feature/us-002-article-declaration`

#### Backend Tasks
- [ ] **2.1.1** Implement item_list schemas
- [ ] **2.1.2** Implement article schemas
- [ ] **2.1.3** Implement item_list service
  - [ ] Max 2 lists per depositor
  - [ ] Max 24 articles per list (12 clothing)
- [ ] **2.1.4** Implement article service
  - [ ] Category validation
  - [ ] Price validation (1€-150€)
  - [ ] Lot handling
- [ ] **2.1.5** Implement repositories
- [ ] **2.1.6** Implement API endpoints
- [ ] **2.1.7** Write tests

#### Frontend Tasks
- [ ] **2.1.8** Implement MyListsPage
- [ ] **2.1.9** Implement ListDetailPage
- [ ] **2.1.10** Implement ArticleForm
  - [ ] Category select
  - [ ] Price input with validation
  - [ ] Size/brand/color fields
  - [ ] Lot toggle
- [ ] **2.1.11** Implement article list with edit/delete
- [ ] **2.1.12** Deadline warnings
- [ ] **2.1.13** Write tests

### 2.2 Label Generation (US-003)
**Branch:** `feature/us-003-label-generation`

- [ ] **2.2.1** PDF generation service (WeasyPrint)
- [ ] **2.2.2** Barcode generation
- [ ] **2.2.3** Label template (HTML/CSS)
- [ ] **2.2.4** Batch generation endpoint
- [ ] **2.2.5** Download UI
- [ ] **2.2.6** Write tests

---

## Phase 3: Volunteer Features

### 3.1 Sales & Checkout (US-004)
**Branch:** `feature/us-004-sales-checkout`

#### Backend Tasks
- [ ] **3.1.1** Implement sale schemas
- [ ] **3.1.2** Implement sale service
  - [ ] Barcode lookup
  - [ ] Double-sale prevention
  - [ ] Sale cancellation
- [ ] **3.1.3** Implement sale repository
- [ ] **3.1.4** Implement API endpoints
- [ ] **3.1.5** Write tests

#### Frontend Tasks
- [ ] **3.1.6** Implement ScanPage
  - [ ] Camera barcode scanner
  - [ ] Manual barcode input
  - [ ] Article preview
- [ ] **3.1.7** Implement CheckoutPage
  - [ ] Cart management
  - [ ] Payment method selection
  - [ ] Receipt generation
- [ ] **3.1.8** Implement SaleHistoryPage
- [ ] **3.1.9** Write tests

### 3.2 Payout Calculation (US-005)
**Branch:** `feature/us-005-payout`

- [ ] **3.2.1** Payout calculation service
  - [ ] Commission (20%)
  - [ ] List fees (1000/2000 types)
- [ ] **3.2.2** Payout API endpoints
- [ ] **3.2.3** Payout summary UI
- [ ] **3.2.4** Export functionality
- [ ] **3.2.5** Write tests

---

## Phase 4: Manager Features

### 4.1 Dashboard & Reports
**Branch:** `feature/dashboard`

- [ ] **4.1.1** Sales statistics API
- [ ] **4.1.2** Dashboard UI with charts
- [ ] **4.1.3** Export reports (CSV/PDF)

### 4.2 Edition Closure (US-009)
**Branch:** `feature/us-009-edition-closure`

- [ ] **4.2.1** Closure validation service
- [ ] **4.2.2** Final payout generation
- [ ] **4.2.3** Archive functionality
- [ ] **4.2.4** Closure UI

---

## Phase 5: PWA & Offline Mode

### 5.1 Service Worker Setup
**Branch:** `feature/pwa-offline`

- [ ] **5.1.1** Workbox configuration
- [ ] **5.1.2** App manifest
- [ ] **5.1.3** Install prompt

### 5.2 Offline Sales
- [ ] **5.2.1** IndexedDB setup
- [ ] **5.2.2** Offline sale storage
- [ ] **5.2.3** Sync service
- [ ] **5.2.4** Conflict resolution
- [ ] **5.2.5** Offline indicator UI

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🔲 | Not Started |
| 🔄 | In Progress |
| ✅ | Done |
| ⏸️ | Blocked |
| [ ] | Task not started |
| [x] | Task completed |

---

## How to Use This File

1. **Find current task:** Look for the "Current Task" at the top
2. **Start work:** Create branch as specified, check off tasks as you complete them
3. **Update progress:** After completing a section, update the Quick Status table
4. **Commit this file:** Include DEVELOPMENT.md changes in your feature commits

---

## Related Documents

- [Specifications README](docs/README.md)
- [User Stories](docs/user-stories.md)
- [Requirements](docs/exigences.md)
- [Architecture](docs/architecture.md)
- [API Specification](docs/api/openapi.yaml)
- [Best Practices](docs/bonnes-pratiques.md)
