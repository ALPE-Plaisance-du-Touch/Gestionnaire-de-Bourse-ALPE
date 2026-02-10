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
| 0.7 | Sales & Checkout | ✅ Done | 100% |
| 0.8 | Payout Calculation | ✅ Done | 100% |
| 0.9 | Dashboard & Reports | ✅ Done | 100% |
| 0.10 | Edition Closure | ✅ Done | 100% |
| 0.11 | PWA & Offline Mode | ✅ Done | 100% |
| 0.12 | GDPR & Audit Logging | ✅ Done | 100% |
| 0.13 | Ops & Deployment | ✅ Done | 100% |
| 0.14 | Special Lists & Business Rules | ✅ Done | 100% |
| 0.15 | Secondary Features | ✅ Done | 100% |
| 0.16 | Accessibility & UX | ✅ Done | 100% |
| 0.17 | Management Enhancements | ✅ Done | 100% |
| **1.0.0** | **Production Release** | 🔲 Not Started | 0% |

**Current Version:** 0.17 (Management Enhancements complete)
**Next Target:** 1.0.0 - Production Release

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

## v0.8 - Payout Calculation (US-005) ✅

**Branch:** `feature/us-005-payout`

### Backend Tasks ✅
- [x] **0.8.1** Payout schemas (CalculatePayoutsResponse, PayoutResponse, RecordPaymentRequest, PayoutStatsResponse)
- [x] **0.8.2** Payout repository (CRUD, bulk create, stats aggregation, unpaid cleanup)
- [x] **0.8.3** Payout service
  - [x] Calculate payouts per item list (commission + list fees)
  - [x] Commission rate from edition (default 20%)
  - [x] List fees: standard=0, list_1000=1EUR, list_2000=2.50EUR
  - [x] Net amount clipped to 0 if negative
  - [x] Record payment (cash/check/transfer)
  - [x] Recalculate individual payout (preserves paid)
  - [x] Update notes / mark absent
  - [x] Stats aggregation with status breakdown
- [x] **0.8.4** PDF receipt service (WeasyPrint bordereaux)
  - [x] Single receipt with sold/unsold article tables
  - [x] Calculation summary (gross, commission, fees, net)
  - [x] Payment section with signatures
  - [x] Bulk generation (all receipts in one PDF)
- [x] **0.8.5** API endpoints (9 routes, manager/admin only)
  - [x] `POST /editions/{id}/payouts/calculate` - Calculate all
  - [x] `GET /editions/{id}/payouts` - List (paginated, filters)
  - [x] `GET /editions/{id}/payouts/stats` - Statistics
  - [x] `GET /editions/{id}/payouts/{pid}` - Detail
  - [x] `GET /editions/{id}/payouts/{pid}/receipt` - Download PDF
  - [x] `POST /editions/{id}/payouts/{pid}/pay` - Record payment
  - [x] `PUT /editions/{id}/payouts/{pid}/notes` - Update notes
  - [x] `POST /editions/{id}/payouts/{pid}/recalculate` - Recalculate
  - [x] `POST /editions/{id}/payouts/receipts` - All receipts PDF
- [x] **0.8.6** Unit tests (22 tests: fees, rounding, calculation, payment, recalculate)

### Frontend Tasks ✅
- [x] **0.8.7** TypeScript types and API client (with blob download for PDFs)
- [x] **0.8.8** PaymentModal component
  - [x] Payment method radio (Especes/Cheque/Virement)
  - [x] Check number / transfer reference (required)
  - [x] Optional notes
- [x] **0.8.9** PayoutsManagementPage
  - [x] Stats cards with polling 10s (total sales, commission, net, progress)
  - [x] Calculate button + download all receipts
  - [x] Status filter + depositor search
  - [x] Paginated table (depositor, list, articles, amounts, status, actions)
  - [x] Row coloring (green=paid, amber=ready)
  - [x] Actions: PDF, Pay, Recalculate, Notes
  - [x] Notes modal with absent marking
- [x] **0.8.10** Routing and navigation
  - [x] `/editions/:id/payouts` route (manager/admin)
  - [x] Link from EditionDetailPage (visible for in_progress/closed)

---

## v0.9 - Dashboard & Reports ✅

**Branch:** `feature/dashboard`

### Backend Tasks ✅
- [x] **0.9.1** Payout dashboard service (category stats, price distribution, top depositors)
- [x] **0.9.2** Excel export - payouts (4 sheets: depositors recap, sales detail, unsold, stats)
- [x] **0.9.3** Excel export - invitations (3 sheets: full list, stats, to relaunch)
- [x] **0.9.4** Invitation statistics service (activation rate, delays, daily evolution)
- [x] **0.9.5** Closure report PDF (WeasyPrint - edition stats, depositor recap)
- [x] **0.9.6** Email reminder for absent depositors
- [x] **0.9.7** API endpoints (dashboard, exports, reminder, closure report, invitation stats)
- [x] **0.9.8** Unit tests (10 dashboard service tests)

### Frontend Tasks ✅
- [x] **0.9.9** PayoutDashboardPage with recharts (category BarChart, price distribution, top 10)
- [x] **0.9.10** InvitationStatsPage with recharts (daily evolution LineChart, list type breakdown)
- [x] **0.9.11** Excel export and reminder buttons on PayoutsManagementPage
- [x] **0.9.12** Closure report button on EditionDetailPage
- [x] **0.9.13** Statistics link on InvitationsPage
- [x] **0.9.14** Routing for dashboard and invitation stats pages

---

## v0.10 - Edition Closure (US-009) ✅

**Branch:** `feature/us-009-edition-closure`

### Backend Tasks ✅
- [x] **0.10.1** Edition model: closure fields (closed_at, closed_by_id, archived_at) + migration
- [x] **0.10.2** Closure schemas (ClosureCheckItem, ClosureCheckResponse, EditionResponse updated)
- [x] **0.10.3** Closure validation service (4 prerequisites: status, retrieval date, payouts calculated, all finalized)
- [x] **0.10.4** Repository: close_edition(), archive_edition()
- [x] **0.10.5** API endpoints (GET closure-check, POST close, POST archive) with admin guard
- [x] **0.10.6** Email notification on closure (HTML + text templates)
- [x] **0.10.7** Read-only guard on recalculate_payout for closed editions
- [x] **0.10.8** Unit tests (9 tests: prerequisites, close, archive)

### Frontend Tasks ✅
- [x] **0.10.9** TypeScript types (closedAt, closedBy, archivedAt, ClosureCheckResponse)
- [x] **0.10.10** API client methods (getClosureCheck, closeEdition, archiveEdition)
- [x] **0.10.11** Closure button + modal with prerequisite checklist on EditionDetailPage
- [x] **0.10.12** Archive button on EditionDetailPage (closed editions)
- [x] **0.10.13** EditionsListPage: includeArchived filter for archived status

---

## v0.11 - PWA & Offline Mode (US-004 AC-12/AC-13) ✅

**Branch:** `feature/pwa-offline`

### PWA Setup ✅
- [x] **0.11.1** VitePWA plugin with Workbox (service worker, runtime caching for API)
- [x] **0.11.2** App manifest (name, icons, theme color, standalone display)
- [x] **0.11.3** Service worker registration with update prompt and nginx no-cache rule

### Backend Tasks ✅
- [x] **0.11.4** Article catalog endpoint (`GET /editions/{id}/articles/catalog`) for offline caching
- [x] **0.11.5** Batch sync endpoint (`POST /editions/{id}/sales/sync`) with first-write-wins conflict resolution
- [x] **0.11.6** Conflict notification email to managers (HTML + text templates)
- [x] **0.11.7** Unit tests (sync nominal, conflict, error, mixed results, catalog)

### Frontend Tasks ✅
- [x] **0.11.8** IndexedDB schema (3 stores: articles, pendingSales, syncMeta) via `idb`
- [x] **0.11.9** Catalog cache service (prefetch, barcode lookup, article removal)
- [x] **0.11.10** Offline sales service (store, limit 50, mark synced/conflict, cleanup)
- [x] **0.11.11** Network status hook (browser events + active healthcheck every 10s)
- [x] **0.11.12** OfflineBanner component (offline/sync/conflict states)
- [x] **0.11.13** useOfflineSales hook (scan/register routing, auto-sync on reconnect)
- [x] **0.11.14** SalesPage integration (offline scan via IndexedDB, offline sale queue, merged sales list, disabled cancel offline)
- [x] **0.11.15** Sync service (batch sync, status updates, conflict display)

---

## v0.12 - GDPR & Audit Logging ✅

**Branch:** `feature/rgpd-security`

### GDPR - User Data Rights ✅
- [x] **0.12.1** Backend: GDPR service (JSON data export, account anonymization)
- [x] **0.12.2** Backend: endpoints `/users/me/export`, `DELETE /users/me`, `PATCH /users/me`
- [x] **0.12.3** Backend: migration `deleted_at`, `anonymized_at` on User model
- [x] **0.12.4** Frontend: Profile page (edit name, phone, address)
- [x] **0.12.5** Frontend: Privacy policy page + footer link
- [x] **0.12.6** Frontend: "Delete my account" button with confirmation + prior export

### Audit Logging ✅
- [x] **0.12.7** Backend: `AuditLog` model (timestamp, user_id, role, ip, user_agent, action, entity, result)
- [x] **0.12.8** Backend: migration + `log_action()` service (never-raise design)
- [x] **0.12.9** Backend: audit integration on auth, profile, export, and deletion endpoints
- [x] **0.12.10** Frontend: AuditLogPage (paginated list, filters by action/user/date)

### Tests & Docs ✅
- [x] **0.12.11** Unit tests GDPR (5 tests: export, anonymization, timestamps)
- [x] **0.12.12** Unit tests audit logging (8 tests: creation, filtering, pagination, error resilience)
- [x] **0.12.13** Update DEVELOPMENT.md

---

## v0.13 - Ops & Deployment ✅

**Branch:** `feature/ops-deploy`

### HTTPS/TLS Production ✅
- [x] **0.13.1** Nginx production config: SSL termination, Let's Encrypt, auto-renew
- [x] **0.13.2** Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy, Permissions-Policy
- [x] **0.13.3** HTTP → HTTPS automatic redirect
- [x] **0.13.4** docker-compose.prod.yml with production environment variables

### Backup/Restore ✅
- [x] **0.13.5** Daily backup script (`scripts/backup.sh`) with retention policy
- [x] **0.13.6** Restore script (`scripts/restore.sh`) with integrity verification
- [x] **0.13.7** Cron configuration (`scripts/setup-cron.sh`) for daily backup at 3 AM
- [x] **0.13.8** Pre-edition snapshot script (`scripts/backup-pre-edition.sh`)
- [x] **0.13.9** Automated restore test (`scripts/test-restore.sh`)

### Tests & Docs ✅
- [x] **0.13.10** Bash syntax validation for all scripts
- [x] **0.13.11** Update DEVELOPMENT.md

---

## v0.14 - Special Lists & Business Rules (REQ-F-011, REQ-F-014, REQ-F-015) ✅

**Branch:** `feature/special-lists`

### Slot Capacity & Preview Enrichment ✅
- [x] **0.14.9** Slot capacity check during Billetweb import (warning if over capacity)
- [x] **0.14.4** List type breakdown (standard/1000/2000) in preview response

### Deposit Slot Occupancy ✅
- [x] **0.14.10** Registered count in deposit slot API response
- [x] **0.14.10** Occupancy display ("X / Y places") with color coding in DepositSlotsEditor

### Deadline Reminder ✅
- [x] **0.14.7** Email template (HTML + text) for deadline reminder
- [x] **0.14.7** `send_deadline_reminder()` in email service
- [x] **0.14.7** POST `/editions/{id}/deadline-reminder` endpoint

### Frontend Business Rules ✅
- [x] **0.14.8** Deadline warning banner on MyListsPage and ListDetailPage
- [x] **0.14.4** Auto-detect list type from depositor registration on list creation
- [x] **0.14.4** Slot occupancy bars and list type breakdown in Billetweb preview

### Tests & Docs ✅
- [x] **0.14.11** Unit tests for slot capacity schemas and tarif mapping
- [x] **0.14.11** Unit tests for deadline reminder email
- [x] **0.14.12** Update DEVELOPMENT.md

---

## v0.15 - Secondary Features (TASK-006, TASK-007, TASK-010, TASK-012) ✅

**Branch:** `feature/secondary-features`

### Private Sale for Schools (TASK-010) ✅
- [x] **0.15.1** Backend: `is_private_sale` flag on Sale model + migration
- [x] **0.15.1** Backend: auto-detection in `register_sale()` and `sync_offline_sales()` (Friday 17h-18h)
- [x] **0.15.1** Backend: `is_private_sale` field in SaleResponse schema
- [x] **0.15.2** Frontend: PrivateSaleBanner component on SalesPage (informational, no access restriction)

### List PDF Download (TASK-007) ✅
- [x] **0.15.7** Backend: `GET /depositor/lists/{id}/pdf` endpoint (ownership check + StreamingResponse)
- [x] **0.15.8** Frontend: `downloadListPdf()` API method with blob response
- [x] **0.15.8** Frontend: "Telecharger PDF" button on ListDetailPage

### Bulk Payout Reminder (TASK-012) ✅
- [x] **0.15.3** Backend: `POST /editions/{id}/payouts/bulk-remind` endpoint (unpaid payouts, BackgroundTasks)
- [x] **0.15.4** Frontend: `sendBulkReminder()` API method
- [x] **0.15.4** Frontend: "Relancer tous les absents" button on PayoutsManagementPage

### Price Hints (TASK-006) ✅ (already implemented in v0.5)
- [x] **0.15.5** Backend: `PriceHint` schema + `get_price_hints()` + `GET /price-hints` endpoint
- [x] **0.15.6** Frontend: price hint tooltip in ArticleForm

### Tests & Docs ✅
- [x] **0.15.9** Unit tests: private sale detection (8 tests), schema validation (4 tests) — 12 new tests
- [x] **0.15.10** Update PLAN.md and DEVELOPMENT.md

---

## v0.16 - Accessibility & UX (REQ-NF-004, TASK-005, TASK-015, TASK-016, TASK-019) ✅

**Branch:** `feature/a11y-ux`

### WCAG 2.1 AA (TASK-005) ✅
- [x] **0.16.1** Skip link + ARIA landmarks (aria-label on nav, id on main)
- [x] **0.16.2** Keyboard navigation for admin dropdown menu (ArrowUp/Down, Escape, role="menu")
- [x] **0.16.3** Contrast audit (TailwindCSS defaults are WCAG AA compliant)
- [x] **0.16.4** Explicit labels on all form fields (QR scanner manual input)

### Password Strength Indicator (TASK-019) ✅
- [x] **0.16.6** PasswordStrengthIndicator component (4 criteria, 3-level bar, checklist)
- [x] **0.16.6** Integration on ActivatePage and ResetPasswordPage

### QR Scanner UX (TASK-015) ✅
- [x] **0.16.7** 5-second timeout hint ("Difficulty scanning? Use manual input below")
- [x] **0.16.7** Visible label for manual barcode input
- [x] **0.16.7** Non-blocking format validation warning

### Depositor Detection (TASK-016) ✅
- [x] **0.16.8** Backend: `GET /v1/invitations/lookup?email=` endpoint (participation history)
- [x] **0.16.9** Frontend: debounced lookup in InvitationCreateModal with pre-fill banner

### Tests & Docs ✅
- [x] **0.16.10** Unit tests: depositor lookup + invitation status computation (8 tests)
- [x] **0.16.11** Update PLAN.md and DEVELOPMENT.md

---

## v0.17 - Management Enhancements (TASK-013, TASK-014, TASK-017, TASK-018, TASK-020) ✅

**Branch:** `feature/management-enhancements`

### Manager Sale Oversight (TASK-017) ✅
- [x] **0.17.1** Backend: cancel_sale() already bypasses 5-min limit for managers
- [x] **0.17.2** Frontend: SalesManagementPage (paginated table, payment filter, cancel with confirmation)

### Excel Export - Invitation Stats (TASK-014) ✅ (already implemented in v0.9)
- [x] **0.17.3** Backend: `GET /invitations/export-excel` endpoint (3 sheets)
- [x] **0.17.4** Frontend: "Export Excel" button on InvitationStatsPage

### Edition Archiving UI (TASK-018) ✅
- [x] **0.17.5** Frontend: "Archiver" button on EditionsListPage for closed editions
- [x] **0.17.6** Amber "A archiver" badge for editions closed > 1 year ago

### Bulk Resend Invitations (TASK-020) ✅
- [x] **0.17.7** Backend: `POST /invitations/bulk-resend` endpoint + BulkResendRequest/Result schemas
- [x] **0.17.8** Frontend: "Relancer la sélection" button with confirmation modal on InvitationsPage

### Closure Prerequisites (TASK-013) ✅ (already implemented in v0.10)
- [x] **0.17.9** Backend: payout calculation + payment finalization checks in closure endpoint

### Tests & Docs ✅
- [x] **0.17.10** Unit tests: bulk resend schema validation (7 tests)
- [x] **0.17.11** Update PLAN.md and DEVELOPMENT.md

---

## v1.0.0 - Production Release

**Prerequisites:** All versions 0.1 through 0.17 completed and tested.

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
