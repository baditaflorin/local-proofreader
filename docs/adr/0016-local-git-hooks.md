# 0016 Local Git Hooks

## Status

Accepted

## Context

The project must not use GitHub Actions, but checks should run before commits and pushes.

## Decision

Use a repository-local `.githooks/` directory wired through `git config core.hooksPath .githooks`. Hooks are plain shell scripts for portability. Pre-commit runs formatting checks, lint, typecheck, and gitleaks when available. Commit-msg validates Conventional Commits. Pre-push runs tests, build, and smoke.

## Consequences

Contributors must run `make install-hooks` after cloning. Hooks are inspectable and runnable manually through Makefile targets.

## Alternatives Considered

Lefthook was considered but plain hooks are easier to inspect and do not require global tooling.
