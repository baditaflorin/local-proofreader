# 0013 Testing Strategy

## Status

Accepted

## Context

The app needs confidence in local analysis behavior, build output, and Pages compatibility without GitHub Actions.

## Decision

Use Vitest for proofreader and UI unit tests, Playwright for a headless smoke test against a static preview server, and Makefile targets for all checks. Local git hooks run lint, typecheck, tests, build, and smoke before pushes.

## Consequences

The project remains CI-free by design while still giving contributors repeatable local checks. Smoke tests cover homepage load, version display, and one proofreader interaction.

## Alternatives Considered

GitHub Actions were rejected by the user's constraint. Manual-only testing was rejected because the product has enough moving parts to require automated smoke coverage.
