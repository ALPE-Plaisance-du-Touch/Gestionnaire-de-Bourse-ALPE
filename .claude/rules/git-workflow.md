# Git Workflow

## Commits
- Use Conventional Commits format: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- Write commit messages in English
- Focus on "why" not "what" in commit messages
- Keep subject line under 72 characters
- Only commit when explicitly asked
- Never amend a previous commit unless explicitly asked; always create new commits
- Never skip hooks (no `--no-verify`)

## Branches
- Format: `feature/us-xxx-description` or `feature/description`
- Never force-push to `main` or `develop`

## Safety
- Never run destructive git commands without explicit confirmation: `push --force`, `reset --hard`, `checkout .`, `clean -f`, `branch -D`
- Do not stage sensitive files (.env, credentials, secrets)
- Prefer staging specific files over `git add -A` or `git add .`
- Investigate unexpected state (unfamiliar files, branches) before deleting or overwriting

## Pull Requests
- Keep PR title under 70 characters
- Include a Summary section with 1-3 bullet points
- Include a Test Plan section
- Never push to remote unless explicitly asked
