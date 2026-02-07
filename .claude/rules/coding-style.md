# Coding Style

## General
- Write clear, readable code that favors simplicity over cleverness
- Use descriptive variable and function names; the code should be self-documenting
- Do not add comments for obvious logic; only comment on the "why", never the "what"
- Do not add docstrings, type annotations, or comments to code you did not change
- Avoid over-engineering: no premature abstractions, no feature flags for one-time operations, no design for hypothetical future requirements
- Three similar lines of code is better than a premature abstraction

## Formatting
- Follow the existing project's formatting conventions (linter, prettier, editorconfig)
- If no convention exists, use the language's community standard
- Do not reformat code that is unrelated to the current change

## Naming
- All identifiers in English (variables, functions, classes, files)
- Follow the project's existing naming convention (camelCase, snake_case, etc.)
- Boolean variables: use `is`, `has`, `can`, `should` prefixes
- Functions: use verbs (`get`, `create`, `update`, `delete`, `validate`, `handle`)

## Imports & Dependencies
- Keep imports organized: stdlib, third-party, local (follow project conventions)
- Do not add dependencies unless strictly necessary
- Prefer built-in language features over external libraries for simple tasks

## Error Handling
- Only validate at system boundaries (user input, external APIs)
- Trust internal code and framework guarantees
- Do not add error handling for scenarios that cannot happen
- Use specific error types, not generic catch-all handlers
