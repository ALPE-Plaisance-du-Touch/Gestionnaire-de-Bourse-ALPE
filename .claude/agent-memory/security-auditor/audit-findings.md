# Security Audit Findings - 2026-02-26

## CRITICAL
1. Rate limiting disabled in main.py (L36-37 commented out)
2. HTML injection in PDF generation via unsanitized user data in f-strings

## HIGH
1. JWT default secret weak + no rotation mechanism
2. No refresh token revocation/blacklist
3. Fernet encryption key hardcoded in docker-compose.yml
4. Swagger/OpenAPI docs exposed in production
5. No session invalidation on password change
6. Offline sale sync trusts client-provided timestamps

## MEDIUM
1. localStorage for JWT tokens (XSS exposure)
2. No max_length on UserSelfUpdate.address field
3. Password reset + invitation share the same DB column
4. In-memory rate limiting (not distributed, lost on restart)
5. Email logged with PII in some f-string logger calls

## LOW
1. No Permissions-Policy for all features
2. CSP allows 'unsafe-inline' for styles
3. Nginx security headers not inherited in cached static assets location
