# Code Quality & Security

## Security (OWASP Top 10 Awareness)
- Never introduce command injection, XSS, SQL injection vulnerabilities
- Sanitize user input at system boundaries
- Never hardcode secrets, tokens, or credentials
- Never commit sensitive files (.env, private keys, credentials.json)
- If you notice insecure code you wrote, fix it immediately

## Code Changes
- Make the smallest change that satisfies the requirement
- Verify your changes compile/parse correctly before considering them done
- When fixing a bug, understand the root cause before applying a fix
- Prefer standard library solutions over reinventing the wheel

## Backwards Compatibility
- Do not add backwards-compatibility hacks: no renaming to `_unused`, no re-exporting dead types, no `// removed` comments
- If something is unused, delete it completely

## Performance
- Do not optimize prematurely; only optimize when there is a measurable problem
- Prefer readable code over micro-optimized code
- Be mindful of N+1 queries, unbounded loops, and memory leaks

## Dependencies
- Do not upgrade or add dependencies unless required for the task
- If adding a dependency, prefer well-maintained packages with clear licenses
- Check if the functionality already exists in the project or its existing dependencies
