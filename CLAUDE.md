# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Global Preferences

- Communicate with me in **French** unless I write in English
- When I correct a mistake, update your auto memory so you don't repeat it

### Rules
- @.claude/rules/coding-style.md
- @.claude/rules/git-workflow.md
- @.claude/rules/task-management.md
- @.claude/rules/code-quality.md
- @.claude/rules/communication.md

## Project Overview

"Gestionnaire de Bourse ALPE" is a web application to manage second-hand goods sales events organized by ALPE Plaisance du Touch (France). The target audience is depositors (sellers) and volunteer staff.

**Current status**: Development phase - v0.19 complete (Billetweb API Integration)
**Next milestone**: v1.0.0 - Production Release

See [PLAN.md](PLAN.md) for the unified roadmap and [DEVELOPMENT.md](DEVELOPMENT.md) for detailed task breakdown.

## Tech Stack

### Backend
- **Framework**: FastAPI (async)
- **Database**: MariaDB 10.11 with SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Auth**: JWT tokens with bcrypt password hashing
- **Email**: SMTP (MailHog for dev)

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite
- **Styling**: TailwindCSS v4
- **State**: React Query (server state), React Context (auth)
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios with interceptors

### Infrastructure
- **Containers**: Docker Compose (dev environment)
- **Services**: backend, frontend, db, phpMyAdmin, MailHog

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API routes
│   │   │   └── endpoints/   # auth, editions, deposit_slots, invitations, billetweb, articles, labels, sales, payouts, users, audit, config
│   │   ├── models/          # SQLAlchemy models (User, Edition, DepositSlot, etc.)
│   │   ├── repositories/    # Data access layer
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   ├── config.py        # Settings (Pydantic)
│   │   ├── dependencies.py  # FastAPI dependencies
│   │   ├── exceptions.py    # Custom exceptions
│   │   └── main.py          # FastAPI app entry point
│   ├── migrations/          # Alembic migrations
│   ├── tests/               # Pytest tests
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client + API modules (auth, editions, invitations, deposit-slots, articles, billetweb, labels, sales, payouts, users, config)
│   │   ├── components/      # UI components (ui/, auth/, editions/, invitations/, articles/, billetweb/, layout/, payouts/, sales/)
│   │   ├── contexts/        # React contexts (AuthContext)
│   │   ├── hooks/           # Custom hooks (useConfig, useNetworkStatus, useOfflineSales)
│   │   ├── pages/           # Page components (auth/, admin/, depositor/, volunteer/, home/, account/, help/)
│   │   ├── services/        # IndexedDB offline services
│   │   ├── types/           # TypeScript types
│   │   └── routes.tsx
│   └── Dockerfile
├── docs/                    # Specifications (v1.0.0)
├── scripts/                 # Backup/restore, deployment scripts
├── tests/                   # E2E test scripts and fixtures
├── docker-compose.yml
├── docker-compose.prod.yml  # Production config with nginx/SSL
├── Makefile
├── PLAN.md                  # Unified roadmap (source of truth)
└── DEVELOPMENT.md           # Detailed task breakdown per version
```

## Shell Commands

**Working directory**: The shell is already positioned at the project root (`c:\dev\alpe\Gestionnaire-de-Bourse-ALPE`). Do not use `cd` to navigate to the project - all commands can be run directly.

## Common Commands

```bash
# Start development environment
make dev

# Stop all containers
make down

# View logs
make logs

# Backend only
make backend-shell    # Enter backend container
make test-backend     # Run pytest
make migrate          # Run Alembic migrations
make migration msg="description"  # Create new migration

# Frontend only
make frontend-shell   # Enter frontend container
make test-frontend    # Run vitest

# Database
make db-shell         # MySQL CLI
```

## Development Workflow

### Starting a New User Story
When beginning work on a new US, create a `TODO-US-XXX.md` file at project root with:
- Acceptance criteria checklist from the spec
- Technical tasks breakdown (backend/frontend)
- Files to create/modify
- Test requirements

This file tracks progress during development and is deleted after the PR is merged.

### Git Flow
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches (merge to develop)

### Versioning
We follow semver with versions tracked in [DEVELOPMENT.md](DEVELOPMENT.md):
- `0.x` - Development milestones
- `1.0.0` - First production release (full scope)

## Specification Documents

All specs are in `docs/` (v1.0.0 validated):

| Document | Purpose |
|----------|---------|
| [README.md](docs/README.md) | Vision, objectives, navigation |
| [glossaire.md](docs/glossaire.md) | French domain terminology |
| [user-stories.md](docs/user-stories.md) | US-001 to US-012 with acceptance criteria |
| [exigences.md](docs/exigences.md) | Functional/non-functional requirements |
| [domain-model.md](docs/domain-model.md) | Entity model, lifecycles, business rules |
| [architecture.md](docs/architecture.md) | Technical architecture |
| [bonnes-pratiques.md](docs/bonnes-pratiques.md) | Coding standards and conventions |
| [api/openapi.yaml](docs/api/openapi.yaml) | API specification |

## Key Domain Concepts

### Edition Lifecycle
1. **Brouillon** (draft) → Created by admin (US-006)
2. **Configurée** (configured) → Dates/commission set (US-007)
3. **Inscriptions_ouvertes** (registrations_open) → Billetweb import done (US-008)
4. **En_cours** (in_progress) → Deposits and sales active
5. **Clôturée** (closed) → Edition closed (US-009)
6. **Archivée** (archived) → Auto-archived after retention period

### Roles (hierarchical)
- **Déposant** (seller) - declares articles, views sales
- **Bénévole** (volunteer) - scans/sells items
- **Gestionnaire** (manager) - configures editions, imports data
- **Administrateur** - full control, creates/closes editions

### List Types (REQ-F-015)
- **Standard** (100-600): Regular depositors
- **Liste 1000**: ALPE members, white labels, 1€/list
- **Liste 2000**: Family/friends, pink labels, 5€/2 lists

## ID Conventions

| Type | Pattern | Example |
|------|---------|---------|
| User Stories | `US-xxx` | US-001 |
| Functional Req | `REQ-F-xxx` | REQ-F-015 |
| Non-functional | `REQ-NF-xxx` | REQ-NF-001 |
| Dev Tasks | `x.y.z` | 0.2.1 |

## External APIs

- **Billetweb API**: https://www.billetweb.fr/bo/api.php (registration & ticketing platform used for depositor sign-ups)

## Environment Variables

### Backend (.env)
```env
APP_ENV=development
DEBUG=true
DATABASE_URL=mysql+aiomysql://bourse:bourse_dev@db:3306/bourse_dev
JWT_SECRET_KEY=dev-secret-key-change-in-production
SMTP_HOST=mailhog
SMTP_PORT=1025
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

## Testing

- **Backend**: pytest with async support, fixtures in `conftest.py`
- **Frontend**: Vitest + React Testing Library
- **E2E**: Functional test scripts in `tests/` (119/142 scenarios passing)
- **Coverage target**: 80%+ for business logic

## Implemented Features (v0.1–v0.18)

- **Authentication** (v0.2): JWT login, account activation, password reset, RBAC (4 roles), invitation management (single + bulk CSV)
- **Edition Management** (v0.3): CRUD, configuration, deposit slots, automatic status transitions
- **Billetweb Import** (v0.4): CSV file import of registrations from Billetweb
- **Article Declaration** (v0.5): Depositor article lists, article CRUD, list validation
- **Label Generation** (v0.6): PDF label generation (WeasyPrint), QR codes, bulk printing
- **Sales & Checkout** (v0.7): Barcode scanning, sale recording, volunteer sales interface
- **Payout Calculation** (v0.8): Commission calculation, payout reports, PDF receipts
- **Dashboard & Reports** (v0.9): Admin dashboard, live stats, invitation stats
- **Edition Closure** (v0.10): Closing workflow, summary reports, auto-archiving
- **PWA & Offline Mode** (v0.11): Service worker, IndexedDB offline sales, sync on reconnect
- **GDPR & Security** (v0.12): Data export/deletion, audit logging, security headers, privacy policy
- **Ops & Deployment** (v0.13): Docker production config, nginx/SSL, backup/restore scripts
- **Special Lists** (v0.14): Liste 1000/2000, declaration deadline, slot capacity enforcement
- **Secondary Features** (v0.15): Private school sales, retrieval reminder, pricing help, preview
- **Accessibility & UX** (v0.16): WCAG 2.1 AA, password strength indicator, scanner UX
- **Management Enhancements** (v0.17): Cancellation override, Excel export, bulk reminders
- **Homepage** (v0.18): Public homepage, active edition constraint

See [PLAN.md](PLAN.md) for the full roadmap including v0.19 (Billetweb API Integration) in progress.

## Technical Notes

### API Data Transformation
The Axios client has an interceptor that automatically converts snake_case (backend) to camelCase (frontend). When writing API modules:
- Response interfaces should use **camelCase** (already transformed)
- Request payloads should use **snake_case** (for backend)

### Datetime Handling
Backend stores datetimes without timezone info. Frontend should:
- Send dates as local time strings (e.g., `2025-03-15T09:00:00`)
- Parse dates directly without `new Date()` conversion to avoid timezone shifts

### Axios Blob Responses
The response interceptor in `client.ts` calls `keysToCamelCase` on `response.data`, which destroys Blob/ArrayBuffer responses. The interceptor checks `instanceof Blob` and `instanceof ArrayBuffer` before transforming.

### Billetweb API Field Mapping
The Billetweb REST API uses non-obvious field names for attendees:
- Payment status: `order_paid` (not `paid`)
- Disabled/cancelled: `disabled` (not `valid`)
- Session ID: `order_session` (not `session_id`)
- Custom fields (phone, zip, city) are in a nested `custom_order` object with French keys: `Téléphone`, `Code postal`, `Ville`

## Current Development Focus

Check [DEVELOPMENT.md](DEVELOPMENT.md) for:
- Current version and next target
- Detailed task breakdown with checkboxes
- Branch names for each feature
- Progress tracking
