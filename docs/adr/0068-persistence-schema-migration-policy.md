# 0068 Persistence Schema And Migration Policy

- Status: accepted

## Context

Phase 3 adds durable settings and last-session state, which need a migration-safe contract.

## Decision

1. Upgrade IndexedDB with explicit versioned stores for dictionary entries, analysis history, settings, and drafts.
2. Export saved sessions as versioned JSON using a schema-validated contract.
3. Keep analysis snapshots lightweight and text-free; store draft text only in the draft/session pathway.

## Consequences

Users can restore work safely without bloating the history store.

## Alternatives Considered

Dumping everything into one untyped settings blob was rejected because it makes migration and testing brittle.
