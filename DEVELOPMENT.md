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
| 0.3 | Edition Management | 🔲 Not Started | 0% |
| 0.4 | Billetweb Import | 🔲 Not Started | 0% |
| 0.5 | Article Declaration | 🔲 Not Started | 0% |
| 0.6 | Label Generation | 🔲 Not Started | 0% |
| 0.7 | Sales & Checkout | 🔲 Not Started | 0% |
| 0.8 | Payout Calculation | 🔲 Not Started | 0% |
| 0.9 | Dashboard & Reports | 🔲 Not Started | 0% |
| 0.10 | Edition Closure | 🔲 Not Started | 0% |
| 0.11 | PWA & Offline Mode | 🔲 Not Started | 0% |
| **1.0.0** | **Production Release** | 🔲 Not Started | 0% |

**Current Version:** 0.2 (Authentication complete)
**Next Target:** 0.3 - Edition Management (US-006, US-007)

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

---

## v0.3 - Edition Management (US-006, US-007)

**Branch:** `feature/us-006-edition-management`

### Backend Tasks
- [ ] **0.3.1** Implement edition schemas
- [ ] **0.3.2** Implement edition service
  - [ ] Lifecycle state machine
  - [ ] Date validations
- [ ] **0.3.3** Implement edition repository
- [ ] **0.3.4** Implement edition API endpoints
  - [ ] CRUD operations
  - [ ] Status transitions
- [ ] **0.3.5** Write tests

### Frontend Tasks
- [ ] **0.3.6** Implement EditionListPage
- [ ] **0.3.7** Implement EditionCreatePage
- [ ] **0.3.8** Implement EditionDetailPage
- [ ] **0.3.9** Implement EditionConfigPage (dates)
- [ ] **0.3.10** Write tests

---

## v0.4 - Billetweb Import (US-008)

**Branch:** `feature/us-008-billetweb-import`

- [ ] **0.4.1** CSV parser service
- [ ] **0.4.2** Import API endpoint
- [ ] **0.4.3** Duplicate detection
- [ ] **0.4.4** Import UI with preview
- [ ] **0.4.5** Write tests

---

## v0.5 - Article Declaration (US-002)

**Branch:** `feature/us-002-article-declaration`

### Backend Tasks
- [ ] **0.5.1** Implement item_list schemas
- [ ] **0.5.2** Implement article schemas
- [ ] **0.5.3** Implement item_list service
  - [ ] Max 2 lists per depositor
  - [ ] Max 24 articles per list (12 clothing)
- [ ] **0.5.4** Implement article service
  - [ ] Category validation
  - [ ] Price validation (1€-150€)
  - [ ] Lot handling
- [ ] **0.5.5** Implement repositories
- [ ] **0.5.6** Implement API endpoints
- [ ] **0.5.7** Write tests

### Frontend Tasks
- [ ] **0.5.8** Implement MyListsPage
- [ ] **0.5.9** Implement ListDetailPage
- [ ] **0.5.10** Implement ArticleForm
  - [ ] Category select
  - [ ] Price input with validation
  - [ ] Size/brand/color fields
  - [ ] Lot toggle
- [ ] **0.5.11** Implement article list with edit/delete
- [ ] **0.5.12** Deadline warnings
- [ ] **0.5.13** Write tests

---

## v0.6 - Label Generation (US-003)

**Branch:** `feature/us-003-label-generation`

- [ ] **0.6.1** PDF generation service (WeasyPrint)
- [ ] **0.6.2** Barcode generation
- [ ] **0.6.3** Label template (HTML/CSS)
- [ ] **0.6.4** Batch generation endpoint
- [ ] **0.6.5** Download UI
- [ ] **0.6.6** Write tests

---

## v0.7 - Sales & Checkout (US-004)

**Branch:** `feature/us-004-sales-checkout`

### Backend Tasks
- [ ] **0.7.1** Implement sale schemas
- [ ] **0.7.2** Implement sale service
  - [ ] Barcode lookup
  - [ ] Double-sale prevention
  - [ ] Sale cancellation
- [ ] **0.7.3** Implement sale repository
- [ ] **0.7.4** Implement API endpoints
- [ ] **0.7.5** Write tests

### Frontend Tasks
- [ ] **0.7.6** Implement ScanPage
  - [ ] Camera barcode scanner
  - [ ] Manual barcode input
  - [ ] Article preview
- [ ] **0.7.7** Implement CheckoutPage
  - [ ] Cart management
  - [ ] Payment method selection
  - [ ] Receipt generation
- [ ] **0.7.8** Implement SaleHistoryPage
- [ ] **0.7.9** Write tests

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
