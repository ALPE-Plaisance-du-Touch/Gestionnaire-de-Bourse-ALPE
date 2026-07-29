# Security

## Secrets
- Never hardcode a secret, token or credential
- Configuration goes through environment variables; `.env` is gitignored
- Every variable must appear in the matching `.env.example` with a dummy value
  (`backend/.env.example`, `frontend/.env.example`, `.env.production.example`)
- Never log a secret, never return one in an error message
- `JWT_SECRET_KEY` is checked at startup in production: the app refuses to boot on a
  known weak value or fewer than 32 characters (`backend/app/main.py`)

## Input validation
- Validate **at the boundaries** only: API endpoints, external APIs (Billetweb), file
  uploads. Trust internal code.
- Pydantic schemas are that boundary — declare the constraints there (type, length,
  format, range) rather than checking by hand in the service layer
- **Allowlist, not denylist**: reject unexpected fields
- SQLAlchemy builds parameterised queries; never interpolate user input into raw SQL

## OWASP essentials

| Risk | Mitigation in this project |
|---|---|
| Injection | SQLAlchemy ORM, parameterised queries |
| XSS | React escapes by default — never `dangerouslySetInnerHTML` on user input |
| Auth bypass | Permissions checked server-side on **every** request |
| Data exposure | Never return a password hash, a token, or an internal id without need |

## Authentication
- Passwords hashed with bcrypt (12 rounds)
- Tokens generated with `secrets.token_urlsafe` / `token_hex`
- Permissions verified **server-side on every request** — hiding a button in the UI is
  not an access control
- `current_user.role` is a `Role` relation, never a string: use `is_administrator`,
  `is_manager`, and the like — never `== "administrator"`
- Rate limiting on login and on the API generally (`backend/app/middleware/`)
- Invitation and reset tokens are looked up by indexed query, not compared in Python.
  If one ever gets compared in code, use `secrets.compare_digest`.

## Security headers
Set by nginx in production (`docker/nginx/security-headers.conf`):
`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy`.

Changing the CSP means re-testing the app: a stricter policy silently breaks inline
scripts and external resources.

## Dependencies
- Run `npm audit` regularly; fix known vulnerabilities quickly
- **Stay within the same major version** unless a migration is planned — a security
  bump should not carry a breaking change
- An advisory whose only offered fix is a downgrade is not a fix: record the decision
  and wait for a real patch
- Do not add a dependency for something the project or its existing dependencies
  already do
