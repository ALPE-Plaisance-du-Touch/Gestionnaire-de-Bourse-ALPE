# Security Auditor Memory - Gestionnaire de Bourse ALPE

## Architecture Security Summary (Audit 2026-02-26)

### Authentication
- JWT (HS256) via PyJWT, bcrypt (12 rounds) for passwords
- Access token: 15 min, refresh: 7 days, invitation token: 7 days
- Token type validation (`access` vs `refresh`) is implemented
- Refresh token has `jti` (unique ID) but no server-side revocation/blacklist
- Password reset reuses `invitation_token` field (shared column)
- Anti-enumeration on password reset endpoint (always returns 202)
- Password policy: 8+ chars, 1 letter, 1 digit, 1 special char

### Authorization (RBAC)
- 4 roles: depositor < volunteer < manager < administrator (hierarchical)
- `require_role()` dependency factory used consistently across all endpoints
- Depositor endpoints use `CurrentActiveUser` + ownership checks (list, articles)
- Owner checks present in: `depositor_lists.py`, `depositor_articles.py`

### Key Findings
- Rate limiting middleware exists but is **COMMENTED OUT** in `main.py`
- Fernet encryption key for Billetweb API key is hardcoded in `docker-compose.yml`
- JWT default secret in `config.py` is weak: `"your-secret-key-change-in-production"`
- No HTML escaping in PDF generation (WeasyPrint f-strings with user data)
- Swagger/OpenAPI docs exposed at `/api/docs` in all environments (no prod guard)
- Token storage in `localStorage` (no `httpOnly` cookie alternative)
- No CSRF protection (mitigated by Bearer token auth, not cookie-based)
- No session invalidation on password change (old refresh tokens remain valid)
- Offline sync trusts `sold_at` timestamp from client (tamper risk)

### Well-Secured Areas
- SQLAlchemy ORM used throughout (no raw SQL, no string interpolation)
- No `subprocess`, `os.system`, `eval`, `exec` anywhere in backend
- No `dangerouslySetInnerHTML` in React frontend
- Docker production image runs as non-root user
- Nginx production config has strong TLS, HSTS, CSP, X-Frame-Options
- .gitignore covers `.env` files, credentials, uploads
- Pydantic schemas validate all inputs with `Field()` constraints
- Audit logging implemented for sensitive actions (login, profile updates, etc.)
- Billetweb API key encrypted at rest with Fernet

See `audit-findings.md` for full vulnerability details.
