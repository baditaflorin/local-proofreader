# 0064 DRY Consolidation Map

- Status: accepted

## Context

The app and extension currently duplicate a subset of inline suggestion logic, and import/export behavior has no single home.

## Decision

Create shared modules for:

1. Session import/export and share-hash encoding.
2. Lightweight inline suggestion rules reused by the extension.
3. Typed storage helpers for settings, drafts, and analysis history.

## Consequences

Changes to user-facing contracts happen in one place, with less drift.

## Alternatives Considered

Blind abstraction of all proofreader logic into one giant shared engine was rejected because the extension still has a narrower runtime context.
