# Development Roadmap

This file tracks the implementation progress of the Bourse ALPE application based on the [specifications v1.0.0](docs/README.md).

## Versioning Strategy

We follow [Semantic Versioning](https://semver.org/):
- **0.x.y** - Development phase (pre-release)
- **1.0.0** - First production release (full functional scope)

Each functional milestone increments the minor version (0.1 → 0.2 → ... → 0.x → 1.0.0).

## Quick Status

| Version | Milestone | Status | Progress |
|---------|-----------|--------|----------|
| 0.1 | Project Scaffolding | ✅ Done | 100% |
| 0.2 | Authentication System | ✅ Done | 100% |
| 0.3 | Edition Management | ✅ Done | 100% |
| 0.4 | Billetweb Import | ✅ Done | 100% |
| 0.5 | Article Declaration | ✅ Done | 100% |
| 0.6 | Label Generation | ✅ Done | 100% |
| 0.7 | Sales & Checkout | 🔄 In Progress | 80% |
| 0.8 | Payout Calculation | 🔲 Not Started | 0% |
| 0.9 | Dashboard & Reports | 🔲 Not Started | 0% |
| 0.10 | Edition Closure | 🔲 Not Started | 0% |
| 0.11 | PWA & Offline Mode | 🔲 Not Started | 0% |
| **1.0.0** | **Production Release** | 🔲 Not Started | 0% |

**Current Version:** 0.6 (Label Generation complete)
**Next Target:** 0.7 - Sales & Checkout (US-004)

---

## v0.1 - Project Scaffolding ✅

- [x] Backend structure (FastAPI, SQLAlchemy, Alembic)
- [x] Frontend structure (React, Vite, TailwindCSS)
- [x] Docker development environment
- [x] Makefile with helper commands

---

## v0.2 - Authentication System (US-001, US-010) ✅

**Branch:** `feature/us-001-invitation-activation`

### Backend Tasks ✅
- [x] **0.2.1** Create initial Alembic migration for all models
- [x] **0.2.2** Implement auth schemas (Pydantic)
  - [x] `LoginRequest`, `LoginResponse`
  - [x] `ActivateAccountRequest`
  - [x] `TokenResponse`, `RefreshTokenRequest`
- [x] **0.2.3** Implement auth service
  - [x] Password hashing (bcrypt, 12 rounds)
  - [x] JWT token generation/validation
  - [x] Token refresh logic
- [x] **0.2.4** Implement auth repository
  - [x] User CRUD operations
  - [x] Token management
- [x] **0.2.5** Implement auth API endpoints
  - [x] `POST /api/v1/auth/login`
  - [x] `POST /api/v1/auth/logout`
  - [x] `POST /api/v1/auth/refresh`
  - [x] `POST /api/v1/auth/activate`
  - [x] `GET /api/v1/auth/me`
  - [x] `POST /api/v1/auth/password/reset-request`
  - [x] `POST /api/v1/auth/password/reset`
- [x] **0.2.6** Implement invitation system
  - [x] `POST /api/v1/invitations` (create invitation)
  - [x] `POST /api/v1/invitations/bulk` (bulk create)
  - [x] `POST /api/v1/invitations/{id}/resend`
  - [x] Token generation and validation
- [x] **0.2.7** Rate limiting middleware
  - [x] General rate limit (100 req/min)
  - [x] Login-specific rate limit (5 attempts, 15 min lockout)
- [x] **0.2.8** Write unit tests for auth service
- [x] **0.2.9** Write integration tests for auth endpoints

### Frontend Tasks ✅
- [x] **0.2.10** Create AuthContext for global auth state
  - [x] `AuthProvider`, `useAuth`, `useUser`, `useIsAuthenticated` hooks
- [x] **0.2.11** Implement LoginPage
  - [x] Login form with email/password
  - [x] Error handling
  - [x] Redirect after login
- [x] **0.2.12** Implement ActivatePage
  - [x] Activation form with password validation
  - [x] Terms acceptance checkbox
  - [x] Profile fields (name, phone)
  - [x] Error states (expired, invalid)
- [x] **0.2.13** Implement ProtectedRoute component
  - [x] Role-based access control
  - [x] Redirect to login if not authenticated
- [x] **0.2.14** Update Header with auth state
  - [x] Display user name
  - [x] Logout button
  - [x] Admin link for managers/admins
- [x] **0.2.15** Add token refresh logic in API client
  - [x] Automatic refresh on 401
  - [x] Request queue during refresh
- [x] **0.2.16** Write component tests
  - [x] AuthContext tests
  - [x] LoginPage tests
  - [x] ProtectedRoute tests
- [x] **0.2.17** Email service and templates
  - [x] SMTP async service (aiosmtplib)
  - [x] Invitation email template (HTML + text)
  - [x] Password reset email template (HTML + text)
  - [x] Configurable support email
- [x] **0.2.18** Token validation and error handling
  - [x] `GET /api/v1/auth/validate-token/{token}` endpoint
  - [x] `GET /api/v1/invitations` endpoint (list pending)
  - [x] `GET /api/v1/config/public` endpoint (public config)
  - [x] Frontend token validation with error pages
- [x] **0.2.19** Password reset frontend
  - [x] ForgotPasswordPage (`/forgot-password`)
  - [x] ResetPasswordPage (`/reset-password?token=xxx`)
  - [x] useConfig hook for dynamic support email
- [x] **0.2.20** Invitation management frontend (US-010)
  - [x] API client for invitations (`getInvitations`, `createInvitation`, `createBulkInvitations`, `resendInvitation`)
  - [x] InvitationsPage (`/admin/invitations`) with table, filters, statistics
  - [x] InvitationCreateModal for single invitation creation
  - [x] BulkInvitationModal for CSV import
  - [x] Resend action for pending/expired invitations
  - [x] Route protection (manager, administrator roles)
  - [x] Admin dropdown menu in Header
  - [x] Unit tests for all invitation components

---

## v0.3 - Edition Management (US-006, US-007) ✅

**Branches:** `feature/us-006-edition-management`, `feature/us-007-edition-configuration`

### Backend Tasks ✅
- [x] **0.3.1** Implement edition schemas (EditionCreate, EditionUpdate, EditionResponse)
- [x] **0.3.2** Implement edition service
  - [x] Lifecycle state machine (draft → configured → registrations_open → in_progress → closed)
  - [x] Date validations (chronological order)
- [x] **0.3.3** Implement edition repository
- [x] **0.3.4** Implement edition API endpoints
  - [x] CRUD operations (GET, POST, PUT, DELETE /editions)
  - [x] Status transitions (PATCH /editions/{id}/status)
- [x] **0.3.5** Implement deposit slots
  - [x] DepositSlot model with migration
  - [x] CRUD endpoints (/editions/{id}/deposit-slots)
  - [x] Capacity and local reservation support
- [x] **0.3.6** Write tests (20 backend tests)

### Frontend Tasks ✅
- [x] **0.3.7** Implement EditionsListPage (table with filters, pagination)
- [x] **0.3.8** Implement EditionCreateModal
- [x] **0.3.9** Implement EditionDetailPage (/editions/:id)
  - [x] General info (name, dates, location, description)
  - [x] Configuration dates (declaration, deposit, sale, retrieval)
  - [x] Commission rate (0-100%, default 20%)
  - [x] Auto status transition (draft → configured)
- [x] **0.3.10** Implement DepositSlotsEditor component
- [x] **0.3.11** Write tests (109 frontend tests total)

---

## v0.4 - Billetweb Import (US-008) ✅

**Branch:** `feature/us-008-billetweb-import`

### Backend Tasks ✅
- [x] **0.4.1** CSV parser service (Billetweb format)
- [x] **0.4.2** Import API endpoints
  - [x] `POST /editions/{id}/billetweb/preview` - Preview import
  - [x] `POST /editions/{id}/billetweb/import` - Execute import
  - [x] `GET /editions/{id}/billetweb/stats` - Import statistics
  - [x] `GET /editions/{id}/depositors` - List depositors
- [x] **0.4.3** Duplicate detection (email, order ref)
- [x] **0.4.4** EditionDepositor model and repository
- [x] **0.4.5** BilletwebImportLog model for audit trail
- [x] **0.4.6** Write tests (116 backend tests total)

### Frontend Tasks ✅
- [x] **0.4.7** BilletwebImportButton component
- [x] **0.4.8** BilletwebImportModal with multi-step flow
  - [x] File upload step
  - [x] Preview step with stats and errors
  - [x] Import execution step
  - [x] Result display step
- [x] **0.4.9** BilletwebPreviewStats component
- [x] **0.4.10** BilletwebImportResult component
- [x] **0.4.11** EditionDepositorsPage (`/editions/:id/depositors`)
- [x] **0.4.12** Write tests (152 frontend tests total)

---

## v0.5 - Article Declaration (US-002)

**Branch:** `feature/us-002-article-declaration`

### Backend Tasks ✅
- [x] **0.5.1** Implement item_list schemas
- [x] **0.5.2** Implement article schemas
- [x] **0.5.3** Implement item_list service
  - [x] Max 2 lists per depositor (4 for list_2000)
  - [x] Max 24 articles per list (12 clothing)
  - [x] Deadline validation
- [x] **0.5.4** Implement article service
  - [x] Category validation
  - [x] Price validation (1€ min, 150€ max for strollers)
  - [x] Lot handling (max 3 items, 36 months age limit)
  - [x] Blacklisted items rejection
  - [x] Category limits (1 coat, 1 handbag, 2 scarves, etc.)
- [x] **0.5.5** Implement item_list repository
- [x] **0.5.6** Implement article repository
- [x] **0.5.7** Implement API endpoints
  - [x] `GET/POST /depositor/editions/{id}/lists` - List management
  - [x] `GET/POST/DELETE /depositor/lists/{id}` - List operations
  - [x] `POST /depositor/lists/{id}/validate` - List validation
  - [x] `GET/POST /depositor/lists/{id}/articles` - Article management
  - [x] `PUT/DELETE /depositor/lists/{id}/articles/{id}` - Article operations
  - [x] `GET /categories` - Category constraints
  - [x] `GET /price-hints` - Indicative prices
- [x] **0.5.8** Write backend tests (42 unit tests)

### Frontend Tasks ✅
- [x] **0.5.9** Implement MyListsPage
  - [x] List overview with statistics
  - [x] Create/delete list actions
  - [x] Navigation to list detail
- [x] **0.5.10** Implement ListDetailPage
  - [x] Article list display
  - [x] Add/edit/delete article flow
  - [x] List validation with confirmation
- [x] **0.5.11** Implement ArticleForm
  - [x] Category/subcategory select
  - [x] Price input with validation
  - [x] Size/brand/color/gender fields
  - [x] Lot toggle with quantity
  - [x] Conformity certification checkbox
- [x] **0.5.12** Implement ArticleList component
  - [x] Table view with all article fields
  - [x] Edit/delete actions for draft lists
  - [x] Certification status indicators
- [x] **0.5.13** Add API clients and types
  - [x] depositor-lists API client
  - [x] articles API client
  - [x] TypeScript types for constraints

---

## v0.6 - Label Generation (US-003) ✅

**Branch:** `feature/us-003-label-generation`

### Backend Tasks
- [x] **0.6.1** Label generation service with QR codes (WeasyPrint + qrcode)
  - [x] QR code generation (base64 PNG, version 3, error correction M)
  - [x] Unique label code format: `EDI-{id[:8]}-L{list}-A{line:02d}`
  - [x] Color mapping (8 colors by list number range)
  - [x] PDF structure: cover page, separator, article list, label grid (3x4, 70x74mm)
- [x] **0.6.2** Label schemas (LabelGenerationRequest, LabelStatsResponse)
- [x] **0.6.3** API endpoints
  - [x] `POST /editions/{id}/labels/generate` - Generate PDF (sync, StreamingResponse)
  - [x] `GET /editions/{id}/labels/stats` - Label statistics
- [x] **0.6.4** Repository extensions (by slot, by depositors, stats)
- [x] **0.6.5** Unit tests for label service

### Frontend Tasks
- [x] **0.6.6** TypeScript types and API client (with blob download)
- [x] **0.6.7** LabelsManagementPage
  - [x] Stats cards (depositors, lists, labels)
  - [x] Mode selector (complete, by slot, by selection)
  - [x] Slot selector / depositor multi-select
  - [x] PDF download with loading state
- [x] **0.6.8** Route and navigation
  - [x] `/editions/:id/labels` route (manager/admin)
  - [x] Link from EditionDetailPage (visible for registrations_open/in_progress)

---

## v0.7 - Sales & Checkout (US-004)

**Branch:** `feature/us-004-sales-checkout`

### Backend Tasks
- [x] **0.7.1** Sale schemas (ScanRequest, ScanArticleResponse, RegisterSaleRequest, SaleResponse, SaleStatsResponse)
- [x] **0.7.2** Sale repository (CRUD, stats, top depositors)
- [x] **0.7.3** Sale service
  - [x] Barcode scan and article lookup
  - [x] Sale registration with payment method
  - [x] Double-sale prevention (UNIQUE constraint + application check)
  - [x] Sale cancellation (< 5 min volunteer, > 5 min manager only)
  - [x] Live stats aggregation
- [x] **0.7.4** API endpoints
  - [x] `POST /editions/{id}/sales/scan` - Scan article by barcode
  - [x] `POST /editions/{id}/sales` - Register sale
  - [x] `GET /editions/{id}/sales` - List sales (paginated)
  - [x] `POST /editions/{id}/sales/{id}/cancel` - Cancel sale
  - [x] `GET /editions/{id}/stats/sales-live` - Live statistics
- [x] **0.7.5** Unit tests (14 tests: scan, register, cancel, response formatting)

### Frontend Tasks
- [x] **0.7.6** TypeScript types and API client (sale.ts, sales.ts)
- [x] **0.7.7** Sound utility (Web Audio API: success/error beeps)
- [x] **0.7.8** QR Scanner component (html5-qrcode camera + manual input)
- [x] **0.7.9** SalesPage (caisse)
  - [x] QR camera scanner + manual barcode input
  - [x] Article preview with label color
  - [x] Payment method selection (Especes/CB/Cheque)
  - [x] Sale registration with sound feedback
  - [x] Recent sales list with cancel action
- [x] **0.7.10** LiveStatsPage
  - [x] Real-time stats (auto-refresh 10s)
  - [x] Revenue by payment method
  - [x] Top 5 depositors
- [x] **0.7.11** Routing and navigation
  - [x] `/editions/:id/sales` route (volunteer+)
  - [x] `/editions/:id/stats` route (manager/admin)
  - [x] Links from EditionDetailPage (visible for in_progress editions)

---

## v0.8 - Payout Calculation (US-005)

**Branch:** `feature/us-005-payout`

- [ ] **0.8.1** Payout calculation service
  - [ ] Commission (20%)
  - [ ] List fees (1000/2000 types)
- [ ] **0.8.2** Payout API endpoints
- [ ] **0.8.3** Payout summary UI
- [ ] **0.8.4** Export functionality
- [ ] **0.8.5** Write tests

---

## v0.9 - Dashboard & Reports

**Branch:** `feature/dashboard`

- [ ] **0.9.1** Sales statistics API
- [ ] **0.9.2** Dashboard UI with charts
- [ ] **0.9.3** Export reports (CSV/PDF)

---

## v0.10 - Edition Closure (US-009)

**Branch:** `feature/us-009-edition-closure`

- [ ] **0.10.1** Closure validation service
- [ ] **0.10.2** Final payout generation
- [ ] **0.10.3** Archive functionality
- [ ] **0.10.4** Closure UI

---

## v0.11 - PWA & Offline Mode

**Branch:** `feature/pwa-offline`

### Service Worker Setup
- [ ] **0.11.1** Workbox configuration
- [ ] **0.11.2** App manifest
- [ ] **0.11.3** Install prompt

### Offline Sales
- [ ] **0.11.4** IndexedDB setup
- [ ] **0.11.5** Offline sale storage
- [ ] **0.11.6** Sync service
- [ ] **0.11.7** Conflict resolution
- [ ] **0.11.8** Offline indicator UI

---

## v1.0.0 - Production Release

**Prerequisites:** All versions 0.1 through 0.11 completed and tested.

- [ ] **1.0.1** Final integration testing
- [ ] **1.0.2** Performance optimization
- [ ] **1.0.3** Security audit
- [ ] **1.0.4** Documentation review
- [ ] **1.0.5** Production deployment configuration

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

1. **Find current version:** Look for "Current Version" and "Next Target" at the top
2. **Start work:** Create branch as specified, check off tasks as you complete them
3. **Update progress:** After completing a milestone, update the Quick Status table
4. **Tag releases:** When a version is complete, create a git tag (e.g., `v0.2`)
5. **Commit this file:** Include DEVELOPMENT.md changes in your feature commits

---

## Related Documents

- [Specifications README](docs/README.md)
- [User Stories](docs/user-stories.md)
- [Requirements](docs/exigences.md)
- [Architecture](docs/architecture.md)
- [API Specification](docs/api/openapi.yaml)
- [Best Practices](docs/bonnes-pratiques.md)
