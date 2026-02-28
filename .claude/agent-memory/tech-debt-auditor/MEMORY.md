# Tech Debt Auditor - Agent Memory

## Project Architecture
- Backend: FastAPI async + SQLAlchemy 2.0 async + MariaDB 10.11 + Alembic
- Frontend: React 19 + TypeScript 5.9 + TailwindCSS v4 + React Query v5 + React Router v7
- Infra: Docker Compose (dev + prod), nginx + certbot for SSL
- Python 3.11, Node 20

## Key Patterns
- Repository pattern for data access (`backend/app/repositories/`)
- Service layer for business logic (`backend/app/services/`)
- Pydantic schemas for API contracts (`backend/app/schemas/`)
- Custom exception hierarchy rooted on `AppException` in `exceptions.py`
- Axios interceptor auto-converts snake_case <-> camelCase
- Role-based auth via `require_role()` dependency factory in `dependencies.py`

## Known Issues Found (2026-02-26 Audit)
- **Dual UserResponse schemas**: `schemas/auth.py` and `schemas/user.py` both define `UserResponse` with different fields
- **datetime.now() without timezone**: Used in sale.py, payout.py, edition.py (not UTC-aware)
- **datetime.utcnow() deprecated**: Used in review.py, item_list.py, edition model
- **Rate limiter is in-memory**: Won't work with multiple Gunicorn workers
- **gunicorn not in requirements.txt**: Production Dockerfile uses it but it's not declared
- **No lazy loading in React router**: All pages eagerly imported
- **EditionDetailPage is 1884 lines**: Massive god component
- **TokenInvalidError alias**: Dead code in `exceptions.py` line 133
- **`_sale_to_response` imported directly**: Private function exported to endpoint layer
- **recharts/html5-qrcode/idb/vite-plugin-pwa missing from package.json**: Dependencies used in code but not declared (likely pruned or never added)
- **Orphan `nul` file**: Empty file at project root from Windows redirect artifact

## Testing
- Backend: pytest with async support, ~40 test files
- Frontend: Vitest + RTL, ~10 test files
- Zero TODO/FIXME in codebase (clean)
- No `any` type usage in frontend TypeScript (clean)
