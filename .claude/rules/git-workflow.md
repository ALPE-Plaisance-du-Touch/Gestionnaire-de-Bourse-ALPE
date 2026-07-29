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

### Model

```
feature/xxx  →  dev-{initial}  →  dev            →  main
 (one topic)     (personal)      (integration)      (production)
```

| Branch | Purpose | Deploys |
|---|---|---|
| `main` | Production | Manual — a push deploys nothing on its own |
| `dev` | Integration / beta | Automatic on push |
| `dev-{initial}` | Personal branch, one per developer (`dev-j`) | Local or dedicated subdomain |
| `feature/*` | One topic, branched **from** the personal branch | — |

### Naming
- `feature/us-xxx-description` when a user story exists, else `feature/description`
- English, kebab-case
- Other prefixes: `fix/`, `chore/`, `docs/`, `test/`
- Personal branches: `dev-` + first initial (`dev-j`); disambiguate as `dev-ju` / `dev-je` on collision

### Rules
- `main` and `dev` are protected: merge via approved PR only, never a direct
  push, never a force-push
- Full rights on your own `dev-{initial}` branch
- **Squash merge** into `dev` and `main` — one clean commit per feature.
  A plain merge is fine from a feature branch into a personal branch
- Delete feature branches after merge, local and remote

### Spotting stale branches after a squash merge
Squash merging rewrites SHAs, so `git branch --merged` reports nothing as merged
and dead branches pile up unnoticed. Compare file trees instead:

```
git ls-tree -r --name-only origin/dev | sort > /tmp/dev.txt
git ls-tree -r --name-only origin/<branch> | sort | comm -23 - /tmp/dev.txt
```

Only files genuinely absent from `dev` come out. Expect a handful of
false positives — files deleted since — so read the list before deleting.
Record the SHAs first (`git rev-parse`): a deleted remote branch is restorable
with `git push origin <sha>:refs/heads/<branch>` only as long as you kept them.

## Safety
- Never run destructive git commands without explicit confirmation: `push --force`, `reset --hard`, `checkout .`, `clean -f`, `branch -D`
- Do not stage sensitive files (.env, credentials, secrets)
- Prefer staging specific files over `git add -A` or `git add .`
- Investigate unexpected state (unfamiliar files, branches) before deleting or overwriting

## Remote Operations
- **Never execute plain git remote commands directly** (`git push`, `git pull`,
  `git fetch`): give the user the exact command and let them run it
- The `gh` CLI is allowed (`gh issue`, `gh pr`, `gh label`, ...)
- Deleting a remote branch is irreversible in practice: record the SHAs, show
  the list, and get explicit confirmation before deleting

## Pull Requests
- Keep PR title under 70 characters
- Include a Summary section with 1-3 bullet points
- Include a Test Plan section

### Closing issues
GitHub only honours closing keywords on a PR merged into the default branch
(`main`). Since PRs into `dev` and `main` are squashed, the original SHAs
disappear and the promotion PR is the only reliable place to carry them:

- Feature PR into a personal branch or `dev`: write `Refs #123` (links
  without closing)
- Promotion PR `dev → main`: write `Closes #123` for **every** issue shipped

### Promotion PR (`dev → main`)
A direct `dev → main` PR can show a bogus `add/add` conflict, because
squashing made the histories diverge. Go through a promotion branch:

```
git checkout dev
git pull origin dev
git checkout -b promote/vX.Y.Z-to-main
git merge origin/main        # resolve by ALWAYS keeping dev's version
```

Beware: a bulk resolution (`-X ours`) can duplicate blocks. Always review the
real diff before merging.

The version bump belongs **in the promotion PR**, never after it — that is what
keeps the displayed version equal to the deployed one.
