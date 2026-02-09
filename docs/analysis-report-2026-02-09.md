# Code Compliance Analysis Report
**Generated**: 2026-02-09 14:30:00
**Project**: Gestionnaire de Bourse ALPE
**Analyzer**: Spec Compliance Analyzer Agent
**Status**: Versions 0.1 - 0.11 Complete | v1.0.0 Production Readiness Assessment

---

## Table of Contents

1. [Specification Documents Analyzed](#specification-documents-analyzed)
2. [Code Analysis Summary](#code-analysis-summary)
3. [Discrepancies Found](#discrepancies-found)
4. [Prioritized Task List](#prioritized-task-list)
5. [Task Tracking Table](#task-tracking-table)
6. [Execution Guide](#execution-guide)

---

## PART 1: Specification Documents Analyzed

### Document Inventory

| Document | Path | Lines | Status | Coverage |
|----------|------|-------|--------|----------|
| User Stories | `docs/user-stories.md` | 2363 | Validated v1.0.0 | US-001 to US-010 |
| Requirements | `docs/exigences.md` | 812 | Validated v1.0.0 | REQ-F + REQ-NF |
| Domain Model | `docs/domain-model.md` | 815 | Validated v1.0.0 | Entities & Rules |
| Development Roadmap | `DEVELOPMENT.md` | 491 | Current | v0.1 - v0.11 ✅ |

### Coverage Assessment

**Functional Coverage:**
- ✅ US-001: Account activation via invitation (v0.2)
- ✅ US-002: Article declaration with constraints (v0.5)
- ✅ US-003: Label generation with QR codes (v0.6)
- ✅ US-004: Sales & checkout with offline mode (v0.7, v0.11)
- ✅ US-005: Payout calculation and receipts (v0.8)
- ✅ US-006: Edition creation (v0.3)
- ✅ US-007: Edition configuration (v0.3)
- ✅ US-008: Billetweb import (v0.4)
- ✅ US-009: Edition closure (v0.10)
- ✅ US-010: Invitation management (v0.2)

**Non-Functional Coverage:**
- ✅ REQ-NF-002: Performance (3s checkout target)
- ✅ REQ-NF-005: 5 concurrent checkouts supported
- ✅ REQ-NF-007: Secure authentication (JWT, bcrypt)
- ✅ REQ-NF-008: Role-based access control (RBAC)
- ⚠️ REQ-NF-001: 99.5% availability (deployment-dependent)
- ⚠️ REQ-NF-003: RGPD compliance (partial)
- ⚠️ REQ-NF-004: WCAG 2.1 AA accessibility (partial)
- ⚠️ REQ-NF-009: Audit trail (partial)
- ⚠️ REQ-NF-010: Data encryption (deployment-dependent)
- ⚠️ REQ-NF-011: Scalability (not tested)
- ⚠️ REQ-NF-012: Backup/restore (not implemented)

---

## PART 2: Code Analysis Summary

### Analyzed Components

**Backend Structure** (`c:\dev\alpe\Gestionnaire-de-Bourse-ALPE\backend\`):
- 73 Python files analyzed
- 13 models: User, Edition, DepositSlot, ItemList, Article, Sale, Payout, Invitation, EditionDepositor, BilletwebImportLog
- 13 API endpoint modules
- 7 service modules (auth, email, billetweb_import, label, payout, pdf, sync)
- 3 repository modules

**Frontend Structure** (`c:\dev\alpe\Gestionnaire-de-Bourse-ALPE\frontend\`):
- 104 TypeScript/TSX files analyzed
- 4 page directories: auth, admin, depositor, volunteer
- 20+ reusable UI components
- 7 API client modules
- 5 custom hooks (useAuth, useConfig, useNetworkStatus, useOfflineSales)
- PWA configured with service worker

### Technology Stack Detected

**Backend:**
- FastAPI (async)
- SQLAlchemy 2.0 (async ORM)
- Alembic (migrations)
- MariaDB 10.11
- bcrypt (password hashing, cost=12)
- PyJWT (RS256 tokens)
- WeasyPrint (PDF generation)
- qrcode[pil] (QR code generation)
- aiosmtplib (async email)

**Frontend:**
- React 18.3 with TypeScript
- Vite 6.0
- TailwindCSS v4
- React Router DOM v6
- React Query (TanStack Query)
- Axios with interceptors (snake_case ↔ camelCase)
- html5-qrcode (QR scanner)
- recharts (dashboard charts)
- idb (IndexedDB wrapper)
- VitePWA (offline support)

**Infrastructure:**
- Docker Compose (dev environment)
- Services: backend, frontend, db, phpMyAdmin, MailHog

### Code Structure Overview

The codebase follows a clean layered architecture:
1. **Backend**: FastAPI endpoints → Services → Repositories → Models
2. **Frontend**: Pages → Components → API clients → Contexts
3. **Clear separation of concerns** with dedicated service layers
4. **Test coverage**: 116 backend tests, 152 frontend tests

### Analysis Metrics

- **Total requirements identified**: 66 (18 REQ-F + 12 REQ-NF + 36 from US acceptance criteria)
- **Requirements fully implemented**: 52 (79%)
- **Requirements partially implemented**: 10 (15%)
- **Requirements not implemented**: 4 (6%)
- **Total discrepancies found**: 28 gaps/issues

---

## PART 3: Discrepancies Found

### Critical Issues

**None identified** - All critical functional requirements for v1.0.0 are implemented.

---

### High Priority Issues

#### DISC-001: RGPD Compliance - User Data Rights (REQ-NF-003)
**Category**: Compliance Gap
**Specification**: `docs/exigences.md:722-742`
**Current State**: Partial implementation
- ✅ Consent checkboxes during activation (CGU/RGPD)
- ✅ Password hashing (bcrypt)
- ❌ **Missing**: Droit d'accès (export personal data JSON/PDF)
- ❌ **Missing**: Droit de rectification (user profile edit)
- ❌ **Missing**: Droit à l'effacement (account deletion + anonymization)
- ❌ **Missing**: Droit à la portabilité (export format standard)
- ❌ **Missing**: Privacy policy page
- ❌ **Missing**: DPO contact information
- ❌ **Missing**: Data retention policy automation (3 years inactive)

**Impact**: Legal non-compliance, CNIL sanctions risk

**Files to Create/Modify**:
- `backend/app/api/v1/endpoints/users.py` (new endpoint for GDPR rights)
- `backend/app/services/gdpr.py` (new service for data export/anonymization)
- `frontend/src/pages/PrivacyPolicyPage.tsx` (new page)
- `frontend/src/pages/depositor/ProfilePage.tsx` (new page for profile management)

---

#### DISC-002: Audit Trail - Incomplete Logging (REQ-NF-009)
**Category**: Security Gap
**Specification**: `docs/exigences.md:677-699`
**Current State**: Partial implementation
- ✅ Login/logout tracked in some endpoints
- ✅ BilletwebImportLog model for import audit
- ❌ **Missing**: Centralized audit logging service
- ❌ **Missing**: IP address + User-Agent capture
- ❌ **Missing**: Systematic logging for:
  - Article modifications
  - Payout generation/payment
  - Edition closure
  - Invitation actions
- ❌ **Missing**: Audit log UI for administrators
- ❌ **Missing**: 2-year retention policy enforcement

**Impact**: Forensics impossible, compliance gap

**Files to Create/Modify**:
- `backend/app/services/audit_logger.py` (new centralized service)
- `backend/app/models/audit_log.py` (new model)
- `backend/app/middleware/audit.py` (new middleware for auto-logging)
- `frontend/src/pages/admin/AuditLogsPage.tsx` (new admin page)
- Apply audit logging to all sensitive endpoints

---

#### DISC-003: HTTPS/TLS Configuration Missing (REQ-NF-010)
**Category**: Deployment Gap
**Specification**: `docs/exigences.md:701-718`
**Current State**: Dev environment only (HTTP)
- ✅ Docker Compose dev setup
- ❌ **Missing**: HTTPS configuration for production
- ❌ **Missing**: Let's Encrypt certificate setup
- ❌ **Missing**: HTTP → HTTPS redirect
- ❌ **Missing**: HSTS headers
- ❌ **Missing**: Production deployment documentation

**Impact**: Data in transit not encrypted, man-in-the-middle attacks possible

**Files to Create/Modify**:
- `docker-compose.prod.yml` (new production config)
- `nginx/nginx.conf` (new nginx reverse proxy with SSL)
- `docs/deploiement.md` (update with SSL setup)
- `backend/app/main.py` (add security headers middleware)

---

#### DISC-004: Backup/Restore Procedures Not Implemented (REQ-NF-012)
**Category**: Operations Gap
**Specification**: `docs/exigences.md:788-798`
**Current State**: Not implemented
- ❌ **Missing**: Automated daily database backups
- ❌ **Missing**: Pre-edition snapshot automation
- ❌ **Missing**: 30-day + 1-year retention policy
- ❌ **Missing**: Restore procedure documentation
- ❌ **Missing**: Backup testing schedule

**Impact**: Data loss risk, no disaster recovery

**Files to Create/Modify**:
- `scripts/backup.sh` (new backup script)
- `scripts/restore.sh` (new restore script)
- `docker-compose.prod.yml` (add backup service)
- `docs/operations.md` (new operations playbook)
- `.github/workflows/backup-test.yml` (optional: backup testing CI)

---

### Medium Priority Issues

#### DISC-005: WCAG 2.1 AA Accessibility - Incomplete (REQ-NF-004)
**Category**: Accessibility Gap
**Specification**: `docs/exigences.md:744-767`
**Current State**: Partial implementation (25 aria-* occurrences found)
- ✅ Some aria-label attributes on UI components
- ❌ **Missing**: Systematic keyboard navigation testing
- ❌ **Missing**: Screen reader testing (NVDA/VoiceOver)
- ❌ **Missing**: Color contrast validation (4.5:1 ratio)
- ❌ **Missing**: Focus indicators on all interactive elements
- ❌ **Missing**: ARIA landmarks (main, nav, complementary)
- ❌ **Missing**: HTML lang="fr" declaration
- ❌ **Missing**: Skip to main content link

**Impact**: Users with disabilities cannot use the app effectively

**Files to Modify**:
- `frontend/src/index.html` (add lang="fr", skip link)
- All page components (add ARIA landmarks)
- `frontend/src/components/ui/*.tsx` (ensure focus indicators)
- `frontend/src/index.css` (validate color contrasts)

---

#### DISC-006: Price Hints Missing in Article Form (US-002 AC-13)
**Category**: UX Gap
**Specification**: `docs/user-stories.md:428-434`
**Current State**: Not implemented
- ❌ **Missing**: Contextual help bubble with indicative prices
- ❌ **Missing**: `GET /categories/{category}/price-hints` endpoint
- ❌ **Missing**: Price hint display in `ArticleForm` component

**Impact**: Depositors don't know appropriate pricing

**Files to Create/Modify**:
- `backend/app/api/v1/endpoints/config.py` (add price hints endpoint)
- `frontend/src/api/categories.ts` (add API client)
- `frontend/src/components/depositor/ArticleForm.tsx` (add help bubble)

---

#### DISC-007: List Preview for Depositors Missing (US-002 AC-16)
**Category**: Feature Gap
**Specification**: `docs/user-stories.md:463-478`
**Current State**: Not implemented
- ❌ **Missing**: "Consulter l'aperçu de mes listes" button
- ❌ **Missing**: Preview modal with formatted article table
- ❌ **Missing**: PDF download option for depositor

**Impact**: Depositors cannot review their lists before validation

**Files to Create/Modify**:
- `frontend/src/components/depositor/ListPreviewModal.tsx` (new component)
- `frontend/src/pages/depositor/MyListsPage.tsx` (add preview button)
- `backend/app/api/v1/endpoints/depositor_lists.py` (add PDF export endpoint)

---

#### DISC-008: Deposit Slot Capacity Enforcement Missing (REQ-F-014)
**Category**: Business Logic Gap
**Specification**: `docs/exigences.md:78-92`
**Current State**: Model exists, enforcement not implemented
- ✅ `DepositSlot` model has `capacity` and `reserved_local` fields
- ❌ **Missing**: Slot capacity check during Billetweb import
- ❌ **Missing**: Visual indicator of remaining places
- ❌ **Missing**: Waitlist functionality (optional)

**Impact**: Overbooking of deposit slots possible

**Files to Modify**:
- `backend/app/services/billetweb_import.py` (add capacity validation)
- `frontend/src/pages/admin/EditionDetailPage.tsx` (show remaining places)

---

#### DISC-009: Special Lists 1000/2000 Management Incomplete (REQ-F-015)
**Category**: Feature Gap
**Specification**: `docs/exigences.md:94-114`
**Current State**: Partial implementation
- ✅ List type field exists in data model
- ❌ **Missing**: Automatic list numbering (1100, 1101... 2100, 2101...)
- ❌ **Missing**: Fee deduction logic (1€ for 1000, 5€ for 2000)
- ❌ **Missing**: Special deposit/retrieval time slots
- ❌ **Missing**: Label color differentiation (white for 1000, groseille for 2000)

**Impact**: ALPE members cannot benefit from special conditions

**Files to Modify**:
- `backend/app/services/item_list.py` (add numbering logic)
- `backend/app/services/payout.py` (add fee deduction)
- `backend/app/services/label.py` (fix color mapping)
- `frontend/src/api/deposit-slots.ts` (filter slots by list type)

---

#### DISC-010: Private Sale for Schools Not Implemented (REQ-F-017)
**Category**: Feature Gap
**Specification**: `docs/exigences.md:123-130`
**Current State**: Not implemented
- ❌ **Missing**: Friday 17h-18h special slot configuration
- ❌ **Missing**: School/ALAE whitelist
- ❌ **Missing**: "Private sale" marking on sales
- ❌ **Missing**: Separate statistics for private sales

**Impact**: Schools cannot access priority sale

**Files to Create/Modify**:
- `backend/app/models/edition.py` (add school whitelist field)
- `backend/app/api/v1/endpoints/sales.py` (add private sale flag)
- `frontend/src/pages/volunteer/SalesPage.tsx` (show private sale mode)

---

#### DISC-011: Deadline Enforcement - Article Modifications After Deadline (REQ-F-011)
**Category**: Business Logic Gap
**Specification**: `docs/exigences.md:59-67`
**Current State**: Partially enforced
- ⚠️ Frontend shows read-only UI after deadline
- ❌ **Missing**: Backend enforcement (API should return 403)
- ❌ **Missing**: 3-day warning before deadline
- ❌ **Missing**: Auto-notification if lists incomplete

**Impact**: Depositors might bypass frontend restrictions

**Files to Modify**:
- `backend/app/services/item_list.py` (add deadline check decorator)
- `backend/app/services/email.py` (add deadline reminder emails)
- Add cron job for reminder emails

---

#### DISC-012: Absent Depositor Reminder Email (US-005 AC-11)
**Category**: Feature Gap
**Specification**: `docs/user-stories.md:1306-1313`
**Current State**: Not implemented
- ✅ Payout notes field exists
- ✅ "Mark as absent" functionality exists
- ❌ **Missing**: Automatic reminder email to absent depositors
- ❌ **Missing**: Reminder scheduling (e.g., 3 days after retrieval date)

**Impact**: Absent depositors not notified, unclaimed items pile up

**Files to Create/Modify**:
- `backend/app/services/email.py` (add absent reminder template)
- `backend/app/api/v1/endpoints/payouts.py` (add reminder endpoint)
- Add cron job for automatic reminders

---

### Low Priority Issues

#### DISC-013: Closure Prerequisites - Strict Enforcement Missing (US-009 AC-2)
**Category**: Business Logic Gap
**Specification**: `docs/user-stories.md:1900-1909`
**Current State**: Basic checks implemented
- ✅ Status check (in_progress)
- ✅ Retrieval date passed check
- ❌ **Missing**: "All payouts calculated" check
- ❌ **Missing**: "All payments finalized" check (no pending)
- ❌ **Missing**: "No pending sales" check

**Impact**: Editions might be closed prematurely

**Files to Modify**:
- `backend/app/services/edition.py` (add comprehensive closure checks)

---

#### DISC-014: Dashboard Export - Invitation Statistics Excel (US-010 AC-13)
**Category**: Feature Gap
**Specification**: `docs/user-stories.md:2200-2217`
**Current State**: Invitation stats page exists, Excel export missing
- ✅ InvitationStatsPage with charts
- ❌ **Missing**: Excel export button
- ❌ **Missing**: 3-sheet export (full list, stats, to relaunch)

**Impact**: Managers cannot easily share stats reports

**Files to Create/Modify**:
- `backend/app/api/v1/endpoints/invitations.py` (add export endpoint)
- `frontend/src/pages/admin/InvitationStatsPage.tsx` (add export button)

---

#### DISC-015: QR Scanner - Manual Barcode Input Fallback (US-004 AC-7)
**Category**: UX Gap
**Specification**: `docs/user-stories.md:938-946`
**Current State**: Manual input exists but UX could be improved
- ✅ Manual input field in SalesPage
- ⚠️ Could improve: timeout detection (5s), clearer messaging

**Impact**: Minor usability issue when QR codes are damaged

**Files to Modify**:
- `frontend/src/pages/volunteer/SalesPage.tsx` (add 5s timeout hint)

---

#### DISC-016: Invitation Tracking - Detection of Existing Depositors (US-010 AC-11)
**Category**: UX Gap
**Specification**: `docs/user-stories.md:2177-2187`
**Current State**: Not implemented
- ❌ **Missing**: Auto-detection when typing email
- ❌ **Missing**: Display of depositor history
- ❌ **Missing**: Pre-fill name/list type suggestion

**Impact**: Managers re-enter data for known depositors

**Files to Modify**:
- `backend/app/api/v1/endpoints/invitations.py` (add lookup endpoint)
- `frontend/src/components/invitations/InvitationCreateModal.tsx` (add auto-suggest)

---

#### DISC-017: Sale Cancellation Time Window - Manager Override (US-004 AC-9)
**Category**: Feature Gap
**Specification**: `docs/user-stories.md:958-970`
**Current State**: 5-minute volunteer window implemented
- ✅ Volunteers can cancel < 5 min
- ❌ **Missing**: Manager override for > 5 min cancellations

**Impact**: Managers cannot correct errors > 5 min old

**Files to Modify**:
- `backend/app/services/sale.py` (add manager override logic)
- `frontend/src/pages/admin/SalesManagementPage.tsx` (new page for manager overrides)

---

#### DISC-018: Edition Archival After 1 Year (US-009 AC-7)
**Category**: Feature Gap
**Specification**: `docs/user-stories.md:1952-1956`
**Current State**: Archive button exists, automation missing
- ✅ Manual archive button on EditionDetailPage
- ❌ **Missing**: Auto-suggestion after 1 year
- ❌ **Missing**: Archived editions in separate tab

**Impact**: Old editions clutter the main list

**Files to Modify**:
- `frontend/src/pages/admin/EditionsListPage.tsx` (add archived filter/tab)
- Add cron job for archive suggestions

---

#### DISC-019: Password Strength Indicator (US-001 AC-2)
**Category**: UX Gap
**Specification**: `docs/user-stories.md:63-72`
**Current State**: Basic validation, no visual indicator
- ✅ Password validation (8 chars, letter, digit, symbol)
- ❌ **Missing**: Visual strength indicator (weak/medium/strong)

**Impact**: Minor UX issue, users don't see strength in real-time

**Files to Modify**:
- `frontend/src/pages/auth/ActivatePage.tsx` (add strength indicator component)

---

#### DISC-020: Bulk Actions - Invitation Resend for Multiple (US-010 AC-12)
**Category**: Feature Gap
**Specification**: `docs/user-stories.md:2188-2198`
**Current State**: Notification exists, bulk resend missing
- ✅ Email notification 3 days before expiration
- ❌ **Missing**: "Resend these invitations in bulk" button

**Impact**: Managers must resend invitations one by one

**Files to Create/Modify**:
- `backend/app/api/v1/endpoints/invitations.py` (add bulk resend endpoint)
- `frontend/src/pages/admin/InvitationsPage.tsx` (add bulk action button)

---

### Discrepancy Categories Summary

- **Compliance Gaps**: 3 (RGPD, Audit, HTTPS)
- **Deployment Gaps**: 2 (HTTPS, Backup)
- **Security Gaps**: 1 (Audit logging)
- **Business Logic Gaps**: 4 (Slots, Lists 1000/2000, Deadline, Closure)
- **Feature Gaps**: 10 (Price hints, Preview, Private sale, Reminders, etc.)
- **UX Gaps**: 5 (Accessibility, Manual input, Strength indicator, etc.)
- **Operations Gaps**: 3 (Backup, Monitoring, Archival automation)

---

## PART 4: Prioritized Task List

### Critical Tasks

**No critical blocking issues for v1.0.0 functional release**. All critical user-facing features are implemented.

---

### High Priority Tasks

#### TASK-001: Implement RGPD User Data Rights
**Severity**: High
**Category**: Compliance Gap
**Impact**: Legal requirement for EU deployment, affects all user data

**Specification Reference**:
- Document: `docs/exigences.md`
- Section: REQ-NF-003
- Requirement: Lines 722-742

**Current State**:
Consent checkboxes exist during activation, but no user-facing tools for exercising GDPR rights.

**Required Changes**:
- File: `backend/app/api/v1/endpoints/users.py` (New)
  - `GET /api/v1/users/me/export` - Export personal data (JSON + PDF)
  - `PUT /api/v1/users/me/profile` - Edit profile (name, phone, email)
  - `DELETE /api/v1/users/me` - Request account deletion
- File: `backend/app/services/gdpr.py` (New)
  - `export_user_data()` - Gather all personal data
  - `anonymize_user_data()` - Replace PII with anonymized values
  - `schedule_deletion()` - Mark for deletion after 30-day grace period
- File: `frontend/src/pages/PrivacyPolicyPage.tsx` (New)
  - Privacy policy text with DPO contact
- File: `frontend/src/pages/depositor/ProfilePage.tsx` (New)
  - Profile editing form
  - Data export button
  - Account deletion button
- File: `backend/app/migrations/versions/xxx_add_gdpr_fields.py` (New)
  - Add `deleted_at`, `anonymized_at`, `deletion_requested_at` to `users` table

**Ready-to-Use Prompt**:
```
Implement RGPD user data rights (REQ-NF-003) for the Bourse ALPE application:

1. Create backend/app/services/gdpr.py with functions:
   - export_user_data(user_id) -> dict: gather all personal data from users, invitations, item_lists, articles, sales, payouts tables
   - anonymize_user_data(user_id): replace email with "anonymized_{id}@deleted.local", hash phone/address, keep article/sale data for accounting
   - schedule_deletion(user_id, requested_at): mark account for deletion after 30-day grace period

2. Create backend/app/api/v1/endpoints/users.py with routes:
   - GET /users/me/export (deposant+ role) - returns JSON + option for PDF
   - PUT /users/me/profile (deposant+ role) - update first_name, last_name, phone
   - DELETE /users/me (deposant+ role) - schedule deletion with confirmation email

3. Create frontend/src/pages/PrivacyPolicyPage.tsx:
   - Privacy policy text in French
   - DPO contact: dpo@alpe-plaisance.org (example)
   - Data retention periods (3 years inactive, 5 years sales)
   - User rights explanation

4. Create frontend/src/pages/depositor/ProfilePage.tsx:
   - Profile edit form (name, phone)
   - Button "Exporter mes données" → calls /users/me/export
   - Button "Supprimer mon compte" → confirmation modal → calls DELETE /users/me

5. Add Alembic migration for GDPR fields:
   - deleted_at (timestamp nullable)
   - anonymized_at (timestamp nullable)
   - deletion_requested_at (timestamp nullable)

6. Add link to Privacy Policy in footer of all pages

Test: Verify depositor can export data (JSON), edit profile, request deletion. Verify admin sees anonymized users after 30 days.
```

**Verification Criteria**:
- [ ] Depositor can export personal data (JSON + PDF)
- [ ] Depositor can edit profile (name, phone)
- [ ] Depositor can request account deletion
- [ ] 30-day grace period before anonymization
- [ ] Privacy policy page accessible from all pages
- [ ] Anonymization preserves sales/articles data for accounting

---

#### TASK-002: Implement Centralized Audit Logging
**Severity**: High
**Category**: Security Gap
**Impact**: Forensic analysis impossible without comprehensive audit trail

**Specification Reference**:
- Document: `docs/exigences.md`
- Section: REQ-NF-009
- Requirement: Lines 677-699

**Current State**:
Some login/logout events logged, BilletwebImportLog exists, but no centralized audit system.

**Required Changes**:
- File: `backend/app/models/audit_log.py` (New)
  - AuditLog model (id, timestamp, user_id, action, entity_type, entity_id, ip_address, user_agent, result, details_json)
- File: `backend/app/services/audit_logger.py` (New)
  - `log_action()` async function
  - `get_audit_logs()` with filters
- File: `backend/app/middleware/audit.py` (New)
  - Middleware to auto-log all POST/PUT/DELETE requests
- File: `backend/app/api/v1/endpoints/audit.py` (New)
  - `GET /api/v1/audit/logs` (admin only)
- File: `frontend/src/pages/admin/AuditLogsPage.tsx` (New)
  - Paginated table with filters (user, action, date range)
- Modify: All sensitive endpoints (add manual audit log calls)

**Ready-to-Use Prompt**:
```
Implement comprehensive audit logging (REQ-NF-009) for the Bourse ALPE application:

1. Create backend/app/models/audit_log.py:
   - AuditLog model with fields: id (UUID), timestamp (UTC), user_id, action (enum: login, logout, create, update, delete), entity_type (string), entity_id (UUID), ip_address, user_agent, result (success/failure), details (JSON)

2. Create backend/app/services/audit_logger.py:
   - async def log_action(user_id, action, entity_type, entity_id, ip, user_agent, result, details)
   - async def get_audit_logs(filters: dict, page, limit) -> paginated logs

3. Create backend/app/middleware/audit.py:
   - FastAPI middleware to capture all POST/PUT/DELETE requests
   - Extract user_id from JWT, IP from request.client.host, user_agent from headers
   - Call audit_logger.log_action() after request completion

4. Create backend/app/api/v1/endpoints/audit.py:
   - GET /audit/logs?user_id=&action=&entity_type=&start_date=&end_date=&page=&limit= (admin only)

5. Create frontend/src/pages/admin/AuditLogsPage.tsx:
   - Table: Timestamp | User | Action | Entity | IP | Result
   - Filters: user dropdown, action dropdown, date range picker
   - Pagination (50 per page)

6. Apply manual logging to sensitive actions not caught by middleware:
   - backend/app/api/v1/endpoints/auth.py: login success/failure, logout
   - backend/app/api/v1/endpoints/editions.py: edition closure, archive
   - backend/app/api/v1/endpoints/payouts.py: payment recording

7. Add Alembic migration for audit_logs table

8. Add data retention: delete logs > 2 years (cron job or scheduled task)

Test: Verify all sensitive actions are logged (login, article update, sale, payout, closure). Verify admin can view logs with filters. Verify IP and user_agent captured.
```

**Verification Criteria**:
- [ ] All login/logout events logged
- [ ] All article modifications logged
- [ ] All payout actions logged
- [ ] All edition closure actions logged
- [ ] IP address and user_agent captured
- [ ] Admin page shows audit logs with filters
- [ ] 2-year retention enforced (cron job)

---

#### TASK-003: Configure Production HTTPS/TLS
**Severity**: High
**Category**: Deployment Gap
**Impact**: Data transmitted in clear text without HTTPS, critical security risk

**Specification Reference**:
- Document: `docs/exigences.md`
- Section: REQ-NF-010
- Requirement: Lines 701-718

**Current State**:
Development environment uses HTTP only. No production deployment configuration.

**Required Changes**:
- File: `docker-compose.prod.yml` (New)
  - Production Docker Compose with nginx reverse proxy
- File: `nginx/nginx.conf` (New)
  - SSL configuration, HTTP → HTTPS redirect, HSTS headers
- File: `docs/deploiement.md` (Update)
  - Let's Encrypt certificate setup instructions
  - Production deployment checklist
- File: `backend/app/main.py` (Update)
  - Add security headers middleware (X-Frame-Options, CSP)
- File: `.env.prod.example` (New)
  - Production environment variables template

**Ready-to-Use Prompt**:
```
Configure production HTTPS/TLS deployment (REQ-NF-010) for the Bourse ALPE application:

1. Create docker-compose.prod.yml:
   - Add nginx service as reverse proxy
   - Mount SSL certificates from /etc/letsencrypt
   - Expose ports 80 (redirect) and 443 (HTTPS)
   - Backend internal on port 8000 (not exposed)
   - Frontend served by nginx

2. Create nginx/nginx.conf:
   - Server block for port 80: redirect all to HTTPS
   - Server block for port 443:
     - SSL certificate paths
     - TLS 1.2 minimum, prefer TLS 1.3
     - HSTS header: max-age=31536000; includeSubDomains
     - Proxy /api to backend:8000
     - Serve frontend static files from /usr/share/nginx/html
   - Security headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, CSP default-src 'self'

3. Update docs/deploiement.md:
   - Section: "Configuration HTTPS avec Let's Encrypt"
   - Steps: Install certbot, run certbot --nginx, auto-renewal cron
   - Certificate renewal: certbot renew --dry-run

4. Update backend/app/main.py:
   - Add Starlette middleware for security headers
   - @app.middleware("http") to add X-Frame-Options, CSP, X-Content-Type-Options

5. Create .env.prod.example:
   - APP_ENV=production
   - DEBUG=false
   - DATABASE_URL=mysql+aiomysql://user:pass@db:3306/bourse_prod
   - JWT_SECRET_KEY=<CHANGE_ME_256_BITS>
   - SMTP_HOST=smtp.gmail.com (or real SMTP)
   - CORS_ORIGINS=https://bourse.alpe-plaisance.org

6. Create scripts/deploy-prod.sh:
   - Pull latest code
   - docker compose -f docker-compose.prod.yml down
   - docker compose -f docker-compose.prod.yml build
   - docker compose -f docker-compose.prod.yml up -d
   - Run database migrations

Test: Verify HTTP redirects to HTTPS. Verify certificate valid. Verify HSTS header present. Verify security headers present (X-Frame-Options, CSP).
```

**Verification Criteria**:
- [ ] HTTPS enabled with valid certificate
- [ ] HTTP automatically redirects to HTTPS
- [ ] HSTS header present (max-age ≥ 1 year)
- [ ] Security headers present (X-Frame-Options, CSP, X-Content-Type-Options)
- [ ] Certificate auto-renewal configured
- [ ] Deployment documentation complete

---

#### TASK-004: Implement Automated Backup/Restore
**Severity**: High
**Category**: Operations Gap
**Impact**: No disaster recovery plan, data loss risk

**Specification Reference**:
- Document: `docs/exigences.md`
- Section: REQ-NF-012
- Requirement: Lines 788-798

**Current State**:
No automated backup system. No restore procedures documented.

**Required Changes**:
- File: `scripts/backup.sh` (New)
  - Database dump with compression
  - Upload to S3/external storage
- File: `scripts/restore.sh` (New)
  - Download backup from S3
  - Restore database
- File: `docker-compose.prod.yml` (Update)
  - Add backup service (cron container)
- File: `docs/operations.md` (New)
  - Backup/restore procedures
  - RTO/RPO documentation
- File: `.github/workflows/backup-test.yml` (Optional)
  - Monthly backup restoration test

**Ready-to-Use Prompt**:
```
Implement automated backup/restore (REQ-NF-012) for the Bourse ALPE application:

1. Create scripts/backup.sh:
   - Export database: mysqldump --single-transaction bourse_prod | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
   - Upload to S3 or external storage: aws s3 cp backup_*.sql.gz s3://alpe-backups/daily/
   - Keep 30 daily backups + 12 monthly backups
   - Log backup result to /var/log/backup.log

2. Create scripts/restore.sh:
   - List available backups: aws s3 ls s3://alpe-backups/
   - Download specified backup: aws s3 cp s3://alpe-backups/daily/backup_20260209.sql.gz .
   - Stop application: docker compose down
   - Restore database: gunzip < backup_20260209.sql.gz | mysql bourse_prod
   - Restart application: docker compose up -d
   - Verify restoration: check record counts

3. Update docker-compose.prod.yml:
   - Add backup service:
     services:
       backup:
         image: alpine:3.19
         volumes:
           - ./scripts:/scripts
           - backup-data:/backups
         command: crond -f
         environment:
           - AWS_ACCESS_KEY_ID
           - AWS_SECRET_ACCESS_KEY
   - Mount crontab: 0 2 * * * /scripts/backup.sh (daily at 2 AM)

4. Create docs/operations.md:
   - Section "Sauvegardes":
     - Automated daily backups at 2 AM
     - Retention: 30 days + 12 months
     - Location: s3://alpe-backups/
   - Section "Restauration":
     - Step-by-step restore procedure
     - RTO: < 4 hours
     - RPO: < 24 hours
   - Section "Test de restauration":
     - Quarterly backup restoration test
     - Checklist: verify data integrity, application startup

5. Add pre-edition snapshot:
   - Before each edition starts, trigger manual backup: scripts/backup.sh --snapshot --tag="edition-$(date +%Y%m)"
   - Store in s3://alpe-backups/editions/

6. Optional: Create .github/workflows/backup-test.yml:
   - Monthly scheduled workflow
   - Download latest backup, restore to test database, verify integrity

Test: Run backup script manually, verify .sql.gz created and uploaded. Run restore script, verify database restored correctly. Verify cron executes daily at 2 AM.
```

**Verification Criteria**:
- [ ] Daily automated backups at 2 AM
- [ ] 30-day retention + 1-year monthly retention
- [ ] Pre-edition snapshots
- [ ] Restore procedure documented and tested
- [ ] RTO < 4 hours, RPO < 24 hours
- [ ] Quarterly restore test scheduled

---

### Medium Priority Tasks

#### TASK-005: Enhance WCAG 2.1 AA Accessibility
**Severity**: Medium
**Category**: Accessibility Gap
**Impact**: Users with disabilities cannot fully access the application

**Specification Reference**:
- Document: `docs/exigences.md`
- Section: REQ-NF-004
- Requirement: Lines 744-767

**Current State**:
Some aria-* attributes present (25 occurrences), but systematic accessibility not implemented.

**Required Changes**:
- File: `frontend/src/index.html` (Update)
  - Add `<html lang="fr">`
  - Add skip-to-content link
- File: `frontend/src/index.css` (Update)
  - Validate color contrasts (4.5:1 ratio)
  - Add focus indicators (:focus-visible styles)
- All page components (Update)
  - Add ARIA landmarks (main, nav, complementary)
  - Ensure keyboard navigation (Tab, Enter, Escape)
- File: `frontend/src/components/ui/*.tsx` (Update)
  - Ensure all interactive elements have visible focus
  - Add aria-label where text not visible

**Ready-to-Use Prompt**:
```
Enhance WCAG 2.1 AA accessibility (REQ-NF-004) for the Bourse ALPE frontend:

1. Update frontend/src/index.html:
   - Add lang="fr" to <html> tag
   - Add skip-to-content link before <div id="root">:
     <a href="#main-content" class="sr-only focus:not-sr-only">Aller au contenu principal</a>

2. Update frontend/src/index.css:
   - Add .sr-only utility class (screen reader only, visible on focus)
   - Validate all color contrasts using WebAIM Contrast Checker
   - Add focus-visible styles:
     *:focus-visible {
       outline: 2px solid #2563eb;
       outline-offset: 2px;
     }

3. Update all page components (LoginPage, EditionsListPage, SalesPage, etc.):
   - Wrap main content in <main id="main-content" role="main">
   - Add <nav role="navigation" aria-label="Navigation principale"> for Header
   - Add role="complementary" for sidebars/secondary content

4. Update frontend/src/components/ui/*.tsx:
   - Button.tsx: ensure focus-visible style, add aria-label if icon-only
   - Input.tsx: ensure label associated with input (htmlFor), add aria-describedby for errors
   - Modal.tsx: add role="dialog", aria-labelledby, aria-modal="true", trap focus
   - Select.tsx: ensure aria-label or visible label

5. Test with keyboard navigation:
   - Tab through all interactive elements (buttons, links, inputs)
   - Enter/Space to activate buttons
   - Escape to close modals
   - No keyboard traps

6. Test with screen reader (NVDA on Windows or VoiceOver on Mac):
   - Navigate by landmarks (main, nav)
   - Verify form fields announced correctly
   - Verify error messages announced

Test: Run axe DevTools in Chrome to detect accessibility issues. Verify keyboard navigation works. Test with NVDA screen reader.
```

**Verification Criteria**:
- [ ] HTML lang="fr" declared
- [ ] Skip-to-content link functional
- [ ] Color contrasts ≥ 4.5:1 (validated with tool)
- [ ] All interactive elements have visible focus
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] ARIA landmarks on all pages (main, nav)
- [ ] Screen reader test passes (NVDA or VoiceOver)
- [ ] No axe DevTools errors

---

#### TASK-006: Add Price Hints to Article Form
**Severity**: Medium
**Category**: Feature Gap
**Impact**: Depositors don't know appropriate pricing, may set too high/low

**Specification Reference**:
- Document: `docs/user-stories.md`
- Section: US-002 AC-13
- Requirement: Lines 428-434

**Current State**:
No contextual price help in ArticleForm component.

**Required Changes**:
- File: `backend/app/api/v1/endpoints/config.py` (Update)
  - Add `GET /api/v1/categories/{category}/price-hints` endpoint
- File: `frontend/src/api/categories.ts` (New)
  - API client for price hints
- File: `frontend/src/components/depositor/ArticleForm.tsx` (Update)
  - Add help bubble with indicative prices based on selected category

**Ready-to-Use Prompt**:
```
Add price hints to article form (US-002 AC-13):

1. Update backend/app/api/v1/endpoints/config.py:
   - Add endpoint GET /categories/{category}/price-hints
   - Return price ranges by category (Vêtements enfants: 1-7€, Vêtements adultes: 3-10€, etc.)
   - Use hardcoded dictionary based on docs/user-stories.md lines 539-556 (prix_indicatifs)

2. Create frontend/src/api/categories.ts:
   - async function getPriceHints(category: string): Promise<{min: number, max: number, examples: string}>

3. Update frontend/src/components/depositor/ArticleForm.tsx:
   - When category selected, fetch price hints
   - Display help bubble next to price input:
     <div className="text-sm text-gray-600">
       💡 Prix indicatif : {priceHints.min}€ - {priceHints.max}€
       <br />
       {priceHints.examples}
     </div>

4. Price hint data (from specification):
   - Vêtements adultes: Jupe 3-10€, Tee-shirt 3-8€, Robe 5-23€, Pantalon 4-13€, Manteau 8-31€
   - Vêtements enfants: Jupe 2-8€, Tee-shirt 1-7€, Robe 3-13€, Pantalon 3-10€, Manteau 3-13€, Layette 1-8€
   - Poussettes/Landaus: max 150€

Test: Select category "Vêtements enfants > Tee-shirt", verify hint shows "1€ - 7€". Select "Poussettes", verify hint shows "max 150€".
```

**Verification Criteria**:
- [ ] Price hints displayed for all categories
- [ ] Hints update when category changes
- [ ] Examples clear and helpful
- [ ] Backend endpoint returns correct ranges

---

#### TASK-007: Add List Preview for Depositors
**Severity**: Medium
**Category**: Feature Gap
**Impact**: Depositors cannot review their lists before validation

**Specification Reference**:
- Document: `docs/user-stories.md`
- Section: US-002 AC-16
- Requirement: Lines 463-478

**Current State**:
No preview functionality for depositors to view their lists.

**Required Changes**:
- File: `frontend/src/components/depositor/ListPreviewModal.tsx` (New)
  - Modal component with formatted article table
- File: `frontend/src/pages/depositor/MyListsPage.tsx` (Update)
  - Add "Consulter l'aperçu" button per list
- File: `backend/app/api/v1/endpoints/depositor_lists.py` (Update)
  - Add `GET /lists/{id}/export-pdf` endpoint (optional)

**Ready-to-Use Prompt**:
```
Add list preview for depositors (US-002 AC-16):

1. Create frontend/src/components/depositor/ListPreviewModal.tsx:
   - Props: isOpen, onClose, itemList (with articles)
   - Display:
     - Title: "Aperçu Liste {listNumber} - {depositorName}"
     - Table: N° | Catégorie | Description | Taille | Prix
     - Articles sorted by category (auto)
     - Total: "{count} articles - {totalAmount}€"
     - Info note: "ℹ️ Les étiquettes et une copie de cette liste vous seront remises dans une pochette transparente lors de votre créneau de dépôt."
   - Buttons: "Télécharger en PDF" (optional), "Imprimer", "Fermer"

2. Update frontend/src/pages/depositor/MyListsPage.tsx:
   - Add "Consulter l'aperçu" button next to each list (validated status only)
   - Open ListPreviewModal when clicked

3. Optional: Add PDF export endpoint:
   - backend/app/api/v1/endpoints/depositor_lists.py
   - GET /lists/{id}/export-pdf (depositor can export their own list)
   - Use WeasyPrint to generate simple PDF (similar to label PDF but depositor-facing)

Test: Create a list with 5 articles, validate it, click "Consulter l'aperçu", verify modal shows all articles with correct totals.
```

**Verification Criteria**:
- [ ] Preview button visible on validated lists
- [ ] Modal shows all articles sorted by category
- [ ] Total count and amount correct
- [ ] Print button functional (browser print dialog)
- [ ] (Optional) PDF download works

---

#### TASK-008: Enforce Deposit Slot Capacity
**Severity**: Medium
**Category**: Business Logic Gap
**Impact**: Overbooking of deposit slots possible

**Specification Reference**:
- Document: `docs/exigences.md`
- Section: REQ-F-014
- Requirement: Lines 78-92

**Current State**:
DepositSlot model has capacity field, but not enforced during Billetweb import.

**Required Changes**:
- File: `backend/app/services/billetweb_import.py` (Update)
  - Add capacity check: if slot.reserved_local >= slot.capacity, reject
- File: `frontend/src/pages/admin/EditionDetailPage.tsx` (Update)
  - Show "X / Y places" for each slot

**Ready-to-Use Prompt**:
```
Enforce deposit slot capacity (REQ-F-014):

1. Update backend/app/services/billetweb_import.py:
   - In process_import(), before associating depositor to slot:
     - Query DepositSlot by slot_id
     - Check: if slot.reserved_local >= slot.capacity, add error to report
     - Error message: "Créneau {slot_name} complet (capacité {capacity} atteinte)"
   - Add validation in preview phase (not just import phase)

2. Update frontend/src/pages/admin/EditionDetailPage.tsx:
   - In DepositSlotsEditor section, display:
     - Slot name, datetime, capacity, reserved_local
     - Visual indicator: "{reserved_local} / {capacity} places"
     - Color: green if < 80% full, orange if 80-100%, red if full

3. Optional: Add waitlist functionality (future enhancement, low priority)

Test: Import Billetweb file where a slot has 20 capacity and 21 registrations. Verify 1 rejected with "créneau complet" error.
```

**Verification Criteria**:
- [ ] Import rejects depositors when slot full
- [ ] Preview phase shows capacity errors
- [ ] Frontend shows "X / Y places" for each slot
- [ ] Color indicator (green/orange/red) based on occupancy

---

#### TASK-009: Implement Special Lists 1000/2000 Management
**Severity**: Medium
**Category**: Feature Gap
**Impact**: ALPE members cannot benefit from special list conditions

**Specification Reference**:
- Document: `docs/exigences.md`
- Section: REQ-F-015
- Requirement: Lines 94-114

**Current State**:
List type field exists, but no automatic numbering, fee deduction, or color differentiation.

**Required Changes**:
- File: `backend/app/services/item_list.py` (Update)
  - Auto-assign list numbers (1100, 1101... for 1000; 2100, 2101... for 2000)
- File: `backend/app/services/payout.py` (Update)
  - Deduct fees: 1€ for list_1000, 2.50€ for list_2000
- File: `backend/app/services/label.py` (Update)
  - Color mapping: white for 1000, groseille for 2000
- File: `frontend/src/api/deposit-slots.ts` (Update)
  - Filter slots by list type (special times for 1000/2000)

**Ready-to-Use Prompt**:
```
Implement special lists 1000/2000 management (REQ-F-015):

1. Update backend/app/services/item_list.py:
   - In create_item_list(), if list_type is "list_1000":
     - Assign list_number starting at 1100 (find max existing, increment)
     - Limit: 2 lists for first edition, 4 for subsequent (check depositor history)
   - If list_type is "list_2000":
     - Assign list_number starting at 2100
     - Limit: 4 lists for 2 people max (enforce in validation)

2. Update backend/app/services/payout.py:
   - In calculate_payout(), deduct list fees:
     - list_1000: 1€ per list
     - list_2000: 2.50€ per list (5€ for 2 lists)
   - Update net_amount calculation: net_amount = (gross_amount * 0.80) - list_fees
   - Ensure net_amount >= 0 (clip if negative)

3. Update backend/app/services/label.py:
   - In get_label_color(), fix color mapping:
     - 1000-1999: white (background-color: #FFFFFF)
     - 2000-2999: groseille (background-color: #DC143C or similar)

4. Update frontend/src/api/deposit-slots.ts:
   - Add filter: if depositor has list_1000 or list_2000, show special slots (Tuesday late, Wednesday 12-14h/18-20h, Thursday 21-22h)
   - Standard depositors see only standard slots (Wednesday morning/afternoon, Thursday, Friday)

5. Add validation in Billetweb import:
   - If tarif maps to list_1000, check depositor is ALPE member (custom field or manual flag)
   - If tarif maps to list_2000, check depositor linked to ALPE member

Test: Create list_1000, verify number 1100 assigned. Calculate payout with 59€ sales + 1 list_1000, verify net = (59*0.8) - 1 = 46.20€. Generate labels for list_1000, verify white background.
```

**Verification Criteria**:
- [ ] List 1000 auto-numbered 1100, 1101, 1102...
- [ ] List 2000 auto-numbered 2100, 2101, 2102...
- [ ] Limit enforced: 2 lists for first edition, 4 for next (list_1000)
- [ ] Limit enforced: 4 lists for 2 people (list_2000)
- [ ] Fees deducted: 1€/list for 1000, 2.50€/list for 2000
- [ ] Label colors: white for 1000, groseille for 2000
- [ ] Special deposit slots visible for 1000/2000

---

#### TASK-010: Add Private Sale for Schools
**Severity**: Medium
**Category**: Feature Gap
**Impact**: Schools cannot access priority Friday sale

**Specification Reference**:
- Document: `docs/exigences.md`
- Section: REQ-F-017
- Requirement: Lines 123-130

**Current State**:
Not implemented.

**Required Changes**:
- File: `backend/app/models/edition.py` (Update)
  - Add `school_whitelist` field (JSON array)
- File: `backend/app/api/v1/endpoints/sales.py` (Update)
  - Add `is_private_sale` flag to sale model
- File: `frontend/src/pages/volunteer/SalesPage.tsx` (Update)
  - Show "Vente privée écoles" banner if Friday 17h-18h

**Ready-to-Use Prompt**:
```
Add private sale for schools (REQ-F-017):

1. Update backend/app/models/edition.py:
   - Add field: school_whitelist = Column(JSON, default=list)
   - Example: ["École Plaisance Centre", "ALAE Mairie", "École Montaigne"]

2. Update backend/app/models/sale.py:
   - Add field: is_private_sale = Column(Boolean, default=False)

3. Update backend/app/api/v1/endpoints/sales.py:
   - In POST /sales, check if current time is Friday 17h-18h
   - If yes, set is_private_sale=True

4. Update frontend/src/pages/volunteer/SalesPage.tsx:
   - If current time is Friday 17h-18h, show banner:
     <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
       🏫 Vente privée écoles/ALAE en cours (17h-18h)
     </div>

5. Add statistics endpoint:
   - GET /editions/{id}/stats/private-sales
   - Return: total_private_sales, total_public_sales, private_sale_amount, public_sale_amount

6. Update EditionDetailPage configuration section:
   - Add "Écoles autorisées" multi-select input
   - Allow admin to add/remove schools from whitelist

Test: Set system time to Friday 17h30, register a sale, verify is_private_sale=True. Check stats endpoint shows private vs public breakdown.
```

**Verification Criteria**:
- [ ] School whitelist configurable in edition settings
- [ ] Sales between Friday 17h-18h marked as private
- [ ] Banner visible during private sale hours
- [ ] Statistics show private vs public sales
- [ ] Private sale accessible to all volunteers (no restriction yet)

---

#### TASK-011: Enforce Article Declaration Deadline
**Severity**: Medium
**Category**: Business Logic Gap
**Impact**: Depositors might bypass frontend deadline restrictions

**Specification Reference**:
- Document: `docs/exigences.md`
- Section: REQ-F-011
- Requirement: Lines 59-67

**Current State**:
Frontend shows read-only UI after deadline, but backend not enforcing.

**Required Changes**:
- File: `backend/app/services/item_list.py` (Update)
  - Add decorator to check deadline before mutations
- File: `backend/app/services/email.py` (Update)
  - Add 3-day reminder email template
- Add cron job for deadline reminders

**Ready-to-Use Prompt**:
```
Enforce article declaration deadline (REQ-F-011):

1. Update backend/app/services/item_list.py:
   - Create decorator @check_declaration_deadline(edition_id)
   - Decorator checks: if datetime.now() > edition.declaration_deadline, raise HTTPException(403, "Date limite dépassée")
   - Apply decorator to: update_item_list(), create_article(), update_article(), delete_article()

2. Update backend/app/services/email.py:
   - Add template: deadline_reminder_3days.html
   - Content: "Rappel : il vous reste 3 jours pour compléter vos listes pour l'édition {edition_name}. Date limite : {deadline}. Lien : {link}"

3. Add cron job:
   - Script: scripts/send_deadline_reminders.py
   - Run daily at 9 AM
   - Query editions where declaration_deadline is in 3 days
   - For each edition, query depositors with incomplete lists (status != validated)
   - Send deadline_reminder_3days email to each

4. Add incomplete lists notification:
   - On deadline day, send final reminder to depositors with status != validated
   - Email: "Date limite atteinte. Vos listes ne sont pas complétées. Votre dépôt ne sera pas pris en compte."

Test: Set edition declaration_deadline to yesterday. Try to add article via API, verify 403 error. Set deadline to +3 days, run reminder script, verify emails sent.
```

**Verification Criteria**:
- [ ] Backend returns 403 after deadline for all mutations
- [ ] 3-day reminder emails sent automatically
- [ ] Final reminder sent on deadline day
- [ ] Depositors with incomplete lists notified

---

#### TASK-012: Add Absent Depositor Reminder Email
**Severity**: Medium
**Category**: Feature Gap
**Impact**: Absent depositors not contacted, unclaimed items pile up

**Specification Reference**:
- Document: `docs/user-stories.md`
- Section: US-005 AC-11
- Requirement: Lines 1306-1313

**Current State**:
"Mark as absent" functionality exists, but no automatic reminder email.

**Required Changes**:
- File: `backend/app/services/email.py` (Update)
  - Add absent_reminder template
- File: `backend/app/api/v1/endpoints/payouts.py` (Update)
  - Add `POST /payouts/{id}/send-reminder` endpoint
- Add cron job for automatic reminders (3 days after retrieval date)

**Ready-to-Use Prompt**:
```
Add absent depositor reminder email (US-005 AC-11):

1. Update backend/app/services/email.py:
   - Add template: absent_depositor_reminder.html
   - Content:
     "Bonjour {first_name},
     Vous n'avez pas récupéré vos invendus et votre reversement de {net_amount}€ pour l'édition {edition_name}.
     Merci de nous contacter pour organiser une récupération : {contact_email}
     Passé 2 mois, les articles non récupérés seront donnés à des associations."

2. Update backend/app/api/v1/endpoints/payouts.py:
   - Add endpoint: POST /payouts/{payout_id}/send-reminder (manager/admin only)
   - Send absent_depositor_reminder email
   - Log reminder sent in payout.notes: "Relance envoyée le {date}"

3. Add cron job:
   - Script: scripts/send_absent_reminders.py
   - Run daily at 10 AM
   - Query editions where retrieval_end_date was 3 days ago
   - For each edition, query payouts with status = "ready" (not paid) AND notes contains "Absent"
   - Send reminder email to each
   - Update notes: append "Relance automatique envoyée le {date}"

4. Add button in PayoutsManagementPage:
   - "Envoyer un rappel" button for absent depositors
   - Calls POST /payouts/{id}/send-reminder
   - Toast: "Rappel envoyé à {depositor_email}"

Test: Mark a depositor as absent, click "Envoyer un rappel", verify email sent. Set retrieval date to 3 days ago, run reminder script, verify automatic emails.
```

**Verification Criteria**:
- [ ] Manual reminder button in PayoutsManagementPage
- [ ] Automatic reminder 3 days after retrieval date
- [ ] Email content clear with net amount and contact info
- [ ] Reminder logged in payout notes
- [ ] No duplicate reminders (check notes before sending)

---

### Low Priority Tasks

#### TASK-013: Strengthen Closure Prerequisites Checks
**Severity**: Low
**Category**: Business Logic Gap
**Impact**: Editions might be closed prematurely if checks incomplete

**Specification Reference**:
- Document: `docs/user-stories.md`
- Section: US-009 AC-2
- Requirement: Lines 1900-1909

**Current State**:
Basic checks (status, retrieval date) implemented, but not all prerequisites.

**Required Changes**:
- File: `backend/app/services/edition.py` (Update)
  - Add comprehensive checks in `check_closure_prerequisites()`

**Ready-to-Use Prompt**:
```
Strengthen closure prerequisites (US-009 AC-2):

Update backend/app/services/edition.py in check_closure_prerequisites():
- Check 1: edition.status == "in_progress" ✅ (already done)
- Check 2: retrieval_end_date < now() ✅ (already done)
- Check 3: All payouts calculated
  - Query: payouts = await payout_repo.get_all_by_edition(edition_id)
  - If count(payouts) != count(edition_depositors): return ClosureCheckItem(name="Reversements calculés", passed=False, message="X déposants sans reversement calculé")
- Check 4: All payments finalized (no pending)
  - Query: pending_payouts = [p for p in payouts if p.status == "ready"]
  - If len(pending_payouts) > 0: return ClosureCheckItem(name="Paiements finalisés", passed=False, message="X reversements en attente de paiement")
- Check 5: No pending sales (optional, low risk)
  - Query: pending_sales = await sale_repo.get_pending(edition_id)
  - If len(pending_sales) > 0: return ClosureCheckItem(name="Ventes finalisées", passed=False, message="X ventes en attente de validation")

Test: Create edition with 2 depositors, calculate only 1 payout, try to close, verify error "Reversements calculés: Non (1 déposant sans reversement)".
```

**Verification Criteria**:
- [ ] All payouts calculated check
- [ ] All payments finalized check
- [ ] No pending sales check
- [ ] Closure blocked if any check fails
- [ ] Clear error messages for each failed check

---

#### TASK-014: Add Invitation Statistics Excel Export
**Severity**: Low
**Category**: Feature Gap
**Impact**: Managers cannot easily share invitation reports

**Specification Reference**:
- Document: `docs/user-stories.md`
- Section: US-010 AC-13
- Requirement: Lines 2200-2217

**Current State**:
InvitationStatsPage with charts exists, but no Excel export.

**Required Changes**:
- File: `backend/app/api/v1/endpoints/invitations.py` (Update)
  - Add `GET /invitations/export-excel` endpoint
- File: `frontend/src/pages/admin/InvitationStatsPage.tsx` (Update)
  - Add "Exporter Excel" button

**Ready-to-Use Prompt**:
```
Add invitation statistics Excel export (US-010 AC-13):

1. Update backend/app/api/v1/endpoints/invitations.py:
   - Add endpoint: GET /invitations/export-excel?edition_id={id} (manager/admin only)
   - Use openpyxl library (already in dependencies for payout export)
   - Generate 3-sheet Excel:
     - Sheet 1 "Invitations": Email | Nom | Prénom | Type Liste | Statut | Date Envoi | Date Activation
     - Sheet 2 "Statistiques": Totals (envoyées, activées, en attente, expirées), Taux activation, Délai moyen
     - Sheet 3 "À relancer": Invitations with status="pending" older than 5 days
   - Return StreamingResponse with content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

2. Update frontend/src/pages/admin/InvitationStatsPage.tsx:
   - Add button at top: "Exporter Excel"
   - onClick: downloadFile(`/api/v1/invitations/export-excel?edition_id=${editionId}`, `invitations_${editionId}.xlsx`)
   - Show loading spinner during download

Test: Click "Exporter Excel", verify 3-sheet Excel downloaded with correct data.
```

**Verification Criteria**:
- [ ] Excel export button visible on InvitationStatsPage
- [ ] 3 sheets generated: full list, stats, to relaunch
- [ ] Data matches what's displayed on page
- [ ] File downloads correctly (.xlsx format)

---

#### TASK-015: Improve QR Scanner Manual Input UX
**Severity**: Low
**Category**: UX Gap
**Impact**: Minor usability issue when QR codes damaged

**Specification Reference**:
- Document: `docs/user-stories.md`
- Section: US-004 AC-7
- Requirement: Lines 938-946

**Current State**:
Manual input exists, but could be clearer.

**Required Changes**:
- File: `frontend/src/pages/volunteer/SalesPage.tsx` (Update)
  - Add 5-second timeout hint
  - Improve manual input messaging

**Ready-to-Use Prompt**:
```
Improve QR scanner manual input UX (US-004 AC-7):

Update frontend/src/pages/volunteer/SalesPage.tsx:
1. When QR scanner is active, show message:
   "Placez le QR code devant la caméra. Si le code ne se lit pas après 5 secondes, utilisez la saisie manuelle ci-dessous."

2. Below scanner, always show manual input:
   <Input
     placeholder="Ou saisissez le code manuellement (ex: EDI-...)"
     value={manualCode}
     onChange={(e) => setManualCode(e.target.value)}
     onKeyDown={(e) => {
       if (e.key === 'Enter' && manualCode.trim()) {
         handleScan(manualCode.trim());
       }
     }}
   />

3. Add validation for manual input format:
   - Must start with "EDI-"
   - Pattern: EDI-{uuid}-L{number}-A{number}
   - Show error if format invalid: "Format invalide. Exemple: EDI-2024-11-L245-A03"

Test: Enter invalid code "ABC123", verify error. Enter valid code "EDI-2024-11-L245-A01", verify scan proceeds.
```

**Verification Criteria**:
- [ ] 5-second timeout hint visible
- [ ] Manual input always visible below scanner
- [ ] Enter key triggers scan
- [ ] Format validation with clear error message
- [ ] Error beep if format invalid

---

#### TASK-016: Add Existing Depositor Detection in Invitations
**Severity**: Low
**Category**: UX Gap
**Impact**: Managers re-enter data for known depositors

**Specification Reference**:
- Document: `docs/user-stories.md`
- Section: US-010 AC-11
- Requirement: Lines 2177-2187

**Current State**:
Not implemented.

**Required Changes**:
- File: `backend/app/api/v1/endpoints/invitations.py` (Update)
  - Add `GET /invitations/lookup?email={email}` endpoint
- File: `frontend/src/components/invitations/InvitationCreateModal.tsx` (Update)
  - Add auto-suggest on email input

**Ready-to-Use Prompt**:
```
Add existing depositor detection in invitations (US-010 AC-11):

1. Update backend/app/api/v1/endpoints/invitations.py:
   - Add endpoint: GET /invitations/lookup?email={email} (manager/admin only)
   - Query: user = await user_repo.get_by_email(email)
   - If found, return:
     {
       "found": true,
       "first_name": user.first_name,
       "last_name": user.last_name,
       "phone": user.phone,
       "history": {
         "edition_count": 3,
         "last_edition": "Printemps 2024",
         "total_articles_sold": 87,
         "sell_rate": 72,
         "suggested_list_type": "standard"
       }
     }
   - If not found, return: {"found": false}

2. Update frontend/src/components/invitations/InvitationCreateModal.tsx:
   - Add debounced onEmailChange handler (500ms delay)
   - Call /invitations/lookup?email={email}
   - If found, show info box:
     <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
       ℹ️ Déposant existant : {last_name} {first_name}
       <br />
       Dernière participation : {last_edition}
       <br />
       Historique : {edition_count} éditions, {total_articles_sold} articles vendus ({sell_rate}% taux de vente)
     </div>
   - Auto-fill: first_name, last_name, suggested_list_type
   - Manager can still edit if needed

Test: Type existing email in invitation form, verify info box appears with history. Type new email, verify no info box.
```

**Verification Criteria**:
- [ ] Lookup triggered after 500ms email typing pause
- [ ] Info box shows depositor history if found
- [ ] Name and list type auto-filled
- [ ] No lookup for new emails (no error)
- [ ] Manager can override auto-filled values

---

#### TASK-017: Add Manager Sale Cancellation Override
**Severity**: Low
**Category**: Feature Gap
**Impact**: Managers cannot correct errors > 5 minutes old

**Specification Reference**:
- Document: `docs/user-stories.md`
- Section: US-004 AC-9
- Requirement: Lines 958-970

**Current State**:
Volunteers can cancel < 5 min, no manager override.

**Required Changes**:
- File: `backend/app/services/sale.py` (Update)
  - Add manager_override parameter to cancel_sale()
- File: `frontend/src/pages/admin/SalesManagementPage.tsx` (New)
  - Page for managers to view/cancel any sale

**Ready-to-Use Prompt**:
```
Add manager sale cancellation override (US-004 AC-9):

1. Update backend/app/services/sale.py:
   - Modify cancel_sale(sale_id, user_id, reason, manager_override=False):
     - If not manager_override and (now - sale.created_at) > 5 minutes:
       raise HTTPException(403, "Délai de 5 minutes dépassé. Contactez un gestionnaire.")
     - If manager_override and user.role not in ["manager", "administrator"]:
       raise HTTPException(403, "Seuls les gestionnaires peuvent annuler après 5 minutes.")
   - Add "manager_override" field to audit log

2. Create frontend/src/pages/admin/SalesManagementPage.tsx:
   - List all sales (paginated)
   - Filters: date range, depositor, volunteer, status
   - Columns: Date | Heure | Article | Déposant | Prix | Bénévole | Statut | Actions
   - Actions: "Annuler" button (always visible for managers, calls cancel with override=true)

3. Add route: /editions/:id/sales-management (manager/admin only)

4. Link from EditionDetailPage: "Gestion des ventes" button

Test: Volunteer cancels sale after 6 minutes, verify 403 error. Manager cancels same sale, verify success with override logged.
```

**Verification Criteria**:
- [ ] Volunteers blocked after 5 minutes
- [ ] Managers can cancel anytime
- [ ] SalesManagementPage shows all sales
- [ ] Cancel action logs "manager_override=true"
- [ ] Link accessible from EditionDetailPage

---

#### TASK-018: Add Edition Archival Automation
**Severity**: Low
**Category**: Feature Gap
**Impact**: Old editions clutter main list

**Specification Reference**:
- Document: `docs/user-stories.md`
- Section: US-009 AC-7
- Requirement: Lines 1952-1956

**Current State**:
Manual archive button exists, no automation.

**Required Changes**:
- File: `frontend/src/pages/admin/EditionsListPage.tsx` (Update)
  - Add "Archives" tab
- Add cron job for archive suggestions

**Ready-to-Use Prompt**:
```
Add edition archival automation (US-009 AC-7):

1. Update frontend/src/pages/admin/EditionsListPage.tsx:
   - Add tab selector: "Actives" | "Clôturées" | "Archivées"
   - "Actives": status != "closed" AND status != "archived"
   - "Clôturées": status = "closed" AND archived_at IS NULL
   - "Archivées": archived_at IS NOT NULL
   - If edition closed > 1 year ago, show badge "À archiver" with auto-archive suggestion

2. Add cron job:
   - Script: scripts/suggest_archival.py
   - Run monthly on 1st day at 8 AM
   - Query editions WHERE status = "closed" AND closed_at < (now - 1 year) AND archived_at IS NULL
   - Send email to admins: "Les éditions suivantes peuvent être archivées : {list}"
   - Include link to EditionsListPage

3. Optional: Add auto-archival after 2 years (requires admin confirmation)

Test: Create edition closed 13 months ago, verify "À archiver" badge. Run suggestion script, verify email sent.
```

**Verification Criteria**:
- [ ] "Archivées" tab shows archived editions
- [ ] "À archiver" badge on editions > 1 year old
- [ ] Monthly suggestion email to admins
- [ ] Archived editions excluded from "Actives" list

---

#### TASK-019: Add Password Strength Visual Indicator
**Severity**: Low
**Category**: UX Gap
**Impact**: Minor UX issue, users don't see strength in real-time

**Specification Reference**:
- Document: `docs/user-stories.md`
- Section: US-001 AC-2
- Requirement: Lines 63-72

**Current State**:
Validation exists, but no visual strength indicator.

**Required Changes**:
- File: `frontend/src/pages/auth/ActivatePage.tsx` (Update)
  - Add strength indicator component

**Ready-to-Use Prompt**:
```
Add password strength visual indicator (US-001 AC-2):

Update frontend/src/pages/auth/ActivatePage.tsx:
1. Create strength calculation function:
   const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
     if (password.length < 8) return 'weak';
     const hasLetter = /[a-zA-Z]/.test(password);
     const hasDigit = /\d/.test(password);
     const hasSymbol = /[!@#$%^&*_-]/.test(password);
     const score = [hasLetter, hasDigit, hasSymbol].filter(Boolean).length;
     if (score === 3 && password.length >= 12) return 'strong';
     if (score >= 2) return 'medium';
     return 'weak';
   };

2. Add indicator below password input:
   <div className="flex items-center gap-2 mt-2">
     <div className="flex-1 h-2 bg-gray-200 rounded">
       <div
         className={`h-2 rounded transition-all ${
           strength === 'strong' ? 'w-full bg-green-500' :
           strength === 'medium' ? 'w-2/3 bg-yellow-500' :
           'w-1/3 bg-red-500'
         }`}
       />
     </div>
     <span className={`text-sm ${
       strength === 'strong' ? 'text-green-700' :
       strength === 'medium' ? 'text-yellow-700' :
       'text-red-700'
     }`}>
       {strength === 'strong' ? 'Fort' : strength === 'medium' ? 'Moyen' : 'Faible'}
     </span>
   </div>

Test: Type "abc", verify "Faible" indicator (red 1/3). Type "abc123!@", verify "Moyen" (yellow 2/3). Type "Abc123!@#def", verify "Fort" (green full).
```

**Verification Criteria**:
- [ ] Indicator updates in real-time as user types
- [ ] Weak (red): < 8 chars or missing requirements
- [ ] Medium (yellow): 8+ chars, 2/3 requirements
- [ ] Strong (green): 12+ chars, all requirements
- [ ] Validation error still shows if weak/medium on submit

---

#### TASK-020: Add Bulk Invitation Resend
**Severity**: Low
**Category**: Feature Gap
**Impact**: Managers must resend invitations one by one

**Specification Reference**:
- Document: `docs/user-stories.md`
- Section: US-010 AC-12
- Requirement: Lines 2188-2198

**Current State**:
Email notification exists, but no bulk resend action.

**Required Changes**:
- File: `backend/app/api/v1/endpoints/invitations.py` (Update)
  - Add `POST /invitations/bulk-resend` endpoint
- File: `frontend/src/pages/admin/InvitationsPage.tsx` (Update)
  - Add "Relancer la sélection" button

**Ready-to-Use Prompt**:
```
Add bulk invitation resend (US-010 AC-12):

1. Update backend/app/api/v1/endpoints/invitations.py:
   - Add endpoint: POST /invitations/bulk-resend (manager/admin only)
   - Request body: {"invitation_ids": ["uuid1", "uuid2", ...]}
   - For each invitation:
     - If status != "pending": skip
     - Generate new token (invalidate old)
     - Send email
     - Update sent_at, status="pending"
   - Return summary: {"resent": 8, "skipped": 2, "failed": 0}

2. Update frontend/src/pages/admin/InvitationsPage.tsx:
   - Add checkbox column for row selection
   - Add "Sélectionner tout" checkbox in header
   - Add button "Relancer la sélection" (visible if selection > 0)
   - onClick: call POST /invitations/bulk-resend with selected IDs
   - Show progress toast: "Relance en cours... 5/8"
   - Show result toast: "8 invitations relancées, 2 ignorées (déjà activées)"

Test: Select 5 pending invitations, click "Relancer la sélection", verify 5 emails sent and tokens renewed.
```

**Verification Criteria**:
- [ ] Checkbox selection works (individual + select all)
- [ ] "Relancer la sélection" button appears when selection > 0
- [ ] Bulk resend endpoint processes all selected invitations
- [ ] Progress toast during processing
- [ ] Result summary shows resent/skipped/failed counts
- [ ] New tokens generated for resent invitations

---

## PART 5: Task Tracking Table

| Task ID | Task Name | Description | Priority | Status |
|---------|-----------|-------------|----------|--------|
| [TASK-001](#task-001-implement-rgpd-user-data-rights) | Implement RGPD User Data Rights | Export, profile edit, account deletion | High | 🔴 Not Started |
| [TASK-002](#task-002-implement-centralized-audit-logging) | Implement Centralized Audit Logging | AuditLog model + admin page | High | 🔴 Not Started |
| [TASK-003](#task-003-configure-production-httpstls) | Configure Production HTTPS/TLS | nginx SSL, Let's Encrypt, HSTS | High | 🔴 Not Started |
| [TASK-004](#task-004-implement-automated-backuprestore) | Implement Automated Backup/Restore | Daily backups, restore docs, RTO/RPO | High | 🔴 Not Started |
| [TASK-005](#task-005-enhance-wcag-21-aa-accessibility) | Enhance WCAG 2.1 AA Accessibility | ARIA, keyboard nav, contrast, SR testing | Medium | 🔴 Not Started |
| [TASK-006](#task-006-add-price-hints-to-article-form) | Add Price Hints to Article Form | Contextual help with indicative prices | Medium | 🔴 Not Started |
| [TASK-007](#task-007-add-list-preview-for-depositors) | Add List Preview for Depositors | Preview modal + PDF export | Medium | 🔴 Not Started |
| [TASK-008](#task-008-enforce-deposit-slot-capacity) | Enforce Deposit Slot Capacity | Capacity check in Billetweb import | Medium | 🔴 Not Started |
| [TASK-009](#task-009-implement-special-lists-10002000-management) | Implement Special Lists 1000/2000 | Numbering, fees, colors, slots | Medium | 🔴 Not Started |
| [TASK-010](#task-010-add-private-sale-for-schools) | Add Private Sale for Schools | Friday 17h-18h special mode | Medium | 🔴 Not Started |
| [TASK-011](#task-011-enforce-article-declaration-deadline) | Enforce Article Declaration Deadline | Backend enforcement + reminders | Medium | 🔴 Not Started |
| [TASK-012](#task-012-add-absent-depositor-reminder-email) | Add Absent Depositor Reminder Email | Auto-reminder 3 days after retrieval | Medium | 🔴 Not Started |
| [TASK-013](#task-013-strengthen-closure-prerequisites-checks) | Strengthen Closure Prerequisites Checks | All payouts/payments finalized checks | Low | 🔴 Not Started |
| [TASK-014](#task-014-add-invitation-statistics-excel-export) | Add Invitation Statistics Excel Export | 3-sheet Excel from stats page | Low | 🔴 Not Started |
| [TASK-015](#task-015-improve-qr-scanner-manual-input-ux) | Improve QR Scanner Manual Input UX | 5s timeout hint, better messaging | Low | 🔴 Not Started |
| [TASK-016](#task-016-add-existing-depositor-detection-in-invitations) | Add Existing Depositor Detection | Auto-suggest with history | Low | 🔴 Not Started |
| [TASK-017](#task-017-add-manager-sale-cancellation-override) | Add Manager Sale Cancellation Override | Override 5-min limit for managers | Low | 🔴 Not Started |
| [TASK-018](#task-018-add-edition-archival-automation) | Add Edition Archival Automation | Archives tab + monthly suggestions | Low | 🔴 Not Started |
| [TASK-019](#task-019-add-password-strength-visual-indicator) | Add Password Strength Visual Indicator | Real-time weak/medium/strong display | Low | 🔴 Not Started |
| [TASK-020](#task-020-add-bulk-invitation-resend) | Add Bulk Invitation Resend | Resend multiple invitations at once | Low | 🔴 Not Started |

**Status Legend:**
- 🔴 **Not Started**: Task has not been initiated
- 🟡 **In Progress**: Task is currently being worked on
- 🟢 **Completed**: Task has been completed and verified

**Instructions:**
- Click on the Task ID to jump directly to the detailed task description
- Update the Status column as you progress through tasks
- Use the status emojis to quickly visualize project progress

---

## PART 6: Execution Guide

### How to Execute Tasks

Each task in this report includes a **Ready-to-Use Prompt** that can be copy-pasted directly to execute the implementation. The prompts are designed to be comprehensive and actionable.

**Workflow:**
1. **Select a task** from the [Prioritized Task List](#part-4-prioritized-task-list) or [Task Tracking Table](#part-5-task-tracking-table)
2. **Read the full task description** to understand context, impact, and required changes
3. **Copy the "Ready-to-Use Prompt"** from the task section
4. **Paste the prompt** into Claude Code (or your development environment)
5. **Execute the implementation** following the prompt instructions
6. **Verify completion** using the "Verification Criteria" checklist
7. **Update the task status** in the tracking table (🔴 → 🟡 → 🟢)
8. **Commit changes** with descriptive commit message referencing the task ID

**Example:**
```bash
# After completing TASK-001
git add backend/app/services/gdpr.py backend/app/api/v1/endpoints/users.py frontend/src/pages/PrivacyPolicyPage.tsx
git commit -m "feat(TASK-001): implement RGPD user data rights (export, profile edit, deletion)

- Add GDPR service for data export and anonymization
- Add /users/me/export, /users/me/profile, /users/me DELETE endpoints
- Create PrivacyPolicyPage and ProfilePage components
- Add migration for deleted_at, anonymized_at fields

Implements REQ-NF-003 for GDPR compliance.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Verification Checklist

Before marking a task as 🟢 **Completed**, ensure:

**For Backend Tasks:**
- [ ] Code compiles without errors (`docker compose exec backend python -m py_compile app/...`)
- [ ] Unit tests pass (`make test-backend`)
- [ ] API endpoints tested with curl or Postman
- [ ] Database migrations applied successfully (`make migrate`)
- [ ] No regressions in existing functionality

**For Frontend Tasks:**
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Component renders correctly in browser
- [ ] All user interactions work as expected
- [ ] Responsive design tested (desktop + mobile)
- [ ] No console errors in browser DevTools

**For Integration Tasks (Full Stack):**
- [ ] Frontend successfully calls backend API
- [ ] Data flows correctly end-to-end
- [ ] Error handling works (network errors, validation errors)
- [ ] User experience smooth and intuitive

**For Compliance Tasks (RGPD, Accessibility, Security):**
- [ ] Legal/compliance requirements verified against specification
- [ ] Third-party validation tools used where applicable (axe DevTools for accessibility, OWASP ZAP for security)
- [ ] Documentation updated (privacy policy, operations manual)

---

### Re-analysis Instructions

After completing several tasks, you may want to re-run the compliance analysis to update progress.

**To request a re-analysis:**

```
Analyze the codebase against the specification documents to identify what is NOT yet implemented or has gaps.

Context: Tasks TASK-001 through TASK-004 from the 2026-02-09 analysis report have been completed.

Focus on:
1. Verifying TASK-001 to TASK-004 are now implemented correctly
2. Identifying any new gaps introduced during implementation
3. Updating the prioritized task list for remaining work

Output a structured report with:
1. Completed tasks verification
2. Updated gaps analysis
3. Revised prioritized task list
```

**Continuous Improvement:**
- Re-run analysis after each major milestone (e.g., after completing all High Priority tasks)
- Use analysis reports to track progress toward v1.0.0 production release
- Adjust priorities based on changing business needs or regulatory requirements

---

## Summary

**Overall Compliance: 79% (52/66 requirements fully implemented)**

**Recommendation for v1.0.0 Release:**
1. **Complete High Priority Tasks (TASK-001 to TASK-004)** - Essential for production deployment
2. **Complete Medium Priority Tasks (TASK-005 to TASK-012)** - Important for user experience and legal compliance
3. **Low Priority Tasks (TASK-013 to TASK-020)** - Nice-to-have, can be deferred to v1.1.0 if needed

**Strengths:**
- ✅ All critical functional requirements (US-001 to US-010) implemented
- ✅ Core business logic complete (articles, sales, payouts, labels)
- ✅ PWA with offline mode functional (v0.11)
- ✅ Solid architecture with clear separation of concerns
- ✅ Good test coverage (116 backend + 152 frontend tests)

**Primary Gaps:**
- ⚠️ RGPD compliance incomplete (user data rights missing)
- ⚠️ Audit logging not comprehensive (security gap)
- ⚠️ Production HTTPS/TLS not configured (deployment gap)
- ⚠️ No automated backup/restore (disaster recovery gap)
- ⚠️ Accessibility needs improvement (WCAG 2.1 AA partial)

**Next Steps:**
1. Prioritize TASK-001 (RGPD) and TASK-003 (HTTPS) for legal and security compliance
2. Implement TASK-002 (Audit) and TASK-004 (Backup) for operational readiness
3. Address Medium Priority tasks for enhanced user experience
4. Schedule accessibility audit (external) for TASK-005
5. Plan v1.1.0 for remaining Low Priority enhancements

---

**Report End** | Generated by Spec Compliance Analyzer Agent | 2026-02-09
