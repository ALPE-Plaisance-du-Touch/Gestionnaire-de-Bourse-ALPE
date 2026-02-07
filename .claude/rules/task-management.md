# Task Management

## Before Starting
- Read and understand existing code before making changes
- For non-trivial tasks (3+ steps, multi-file changes, architectural decisions), use plan mode first
- Check project specifications and documentation if they exist
- Search the codebase for related patterns before implementing new ones

## During Execution
- Use the todo list to track multi-step tasks
- Mark tasks as completed immediately when done, not in batches
- Only one task should be in_progress at a time
- If blocked, investigate root causes; do not brute-force retry the same approach
- Compact context proactively when working on long tasks (before hitting limits)

## File Management
- Prefer editing existing files over creating new ones
- Never proactively create documentation files (README, *.md) unless explicitly asked
- Do not create helper/utility files for one-time operations
- Delete unused code completely; do not leave backwards-compatibility shims or "removed" comments

## Testing
- Run existing tests after making changes to verify nothing is broken
- If the project has a test framework, write tests for new functionality when asked
- Do not mark a task as completed if tests are failing

## Scope Control
- Only make changes that are directly requested or clearly necessary
- Do not add features, refactor surrounding code, or make "improvements" beyond what was asked
- A bug fix does not need surrounding code cleaned up
- A simple feature does not need extra configurability
