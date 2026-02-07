# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Global Preferences

### Language
- Code, comments, commits, branch names: **English**
- Communicate with me in **French** unless I write in English
- Specification documents may be in French

### Workflow Principles
- Always read code before modifying it
- Prefer editing existing files over creating new ones
- Start with plan mode for non-trivial tasks
- Keep subtasks small enough to complete within 50% context
- Commit frequently upon task completion when asked

### Corrections & Learning
- When I correct a mistake, update your auto memory so you don't repeat it
- If a pattern keeps failing, document it in memory with the solution

### Rules
- @.claude/rules/coding-style.md
- @.claude/rules/git-workflow.md
- @.claude/rules/task-management.md
- @.claude/rules/code-quality.md
- @.claude/rules/communication.md

## Project Overview

"Gestionnaire de Bourse ALPE" is a web application to manage second-hand goods sales events organized by ALPE Plaisance du Touch (France). The target audience is depositors (sellers) and volunteer staff.

**Current status**: Development phase - v0.3 (Edition Management complete)
**Next milestone**: v0.4 - Billetweb Import (US-008)

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed progress tracking and task breakdown.

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
│   │   │   └── endpoints/   # auth, editions, deposit_slots, invitations
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
│   │   ├── api/             # Axios client + API modules (auth, editions, invitations, deposit-slots)
│   │   ├── components/      # UI components (ui/, auth/, editions/, invitations/)
│   │   ├── contexts/        # React contexts (AuthContext)
│   │   ├── hooks/           # Custom hooks (useConfig)
│   │   ├── pages/           # Page components (auth/, admin/)
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx
│   │   └── routes.tsx
│   └── Dockerfile
├── docs/                    # Specifications (v1.0.0)
├── docker-compose.yml
├── Makefile
└── DEVELOPMENT.md           # Progress tracking
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

1. **Branch naming**: `feature/us-xxx-description` or `feature/description`
2. **Commits**: Conventional Commits format (`feat:`, `fix:`, `docs:`, `chore:`)
3. **Code language**: English (variable names, comments, commits)
4. **Spec language**: French (all docs/ content)

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
| [user-stories.md](docs/user-stories.md) | US-001 to US-010 with acceptance criteria |
| [exigences.md](docs/exigences.md) | Functional/non-functional requirements |
| [domain-model.md](docs/domain-model.md) | Entity model, lifecycles, business rules |
| [architecture.md](docs/architecture.md) | Technical architecture |
| [bonnes-pratiques.md](docs/bonnes-pratiques.md) | Coding standards and conventions |
| [api/openapi.yaml](docs/api/openapi.yaml) | API specification |

## Key Domain Concepts

### Edition Lifecycle
1. **Brouillon** → Created by admin (US-006)
2. **Configurée** → Dates/commission set (US-007)
3. **Inscriptions_ouvertes** → Billetweb import done (US-008)
4. **En_cours** → Deposits and sales active
5. **Clôturée** → Final state (US-009)

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
- **Frontend**: Vitest + React Testing Library (109 tests)
- **Coverage target**: 80%+ for business logic

## Implemented Features

### v0.2 - Authentication ✅
- Login/logout with JWT tokens
- Account activation via invitation link
- Password reset flow
- Role-based access control (depositor, volunteer, manager, administrator)
- Invitation management (single + bulk CSV import)

### v0.3 - Edition Management ✅
- Edition CRUD (create, list, update, delete)
- Edition configuration (operational dates, commission rate)
- Deposit slots management (capacity, local reservation)
- Automatic status transitions (draft → configured)
- Protected routes for manager/admin roles

## Technical Notes

### API Data Transformation
The Axios client has an interceptor that automatically converts snake_case (backend) to camelCase (frontend). When writing API modules:
- Response interfaces should use **camelCase** (already transformed)
- Request payloads should use **snake_case** (for backend)

### Datetime Handling
Backend stores datetimes without timezone info. Frontend should:
- Send dates as local time strings (e.g., `2025-03-15T09:00:00`)
- Parse dates directly without `new Date()` conversion to avoid timezone shifts

## Current Development Focus

Check [DEVELOPMENT.md](DEVELOPMENT.md) for:
- Current version and next target
- Detailed task breakdown with checkboxes
- Branch names for each feature
- Progress tracking
