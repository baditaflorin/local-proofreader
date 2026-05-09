# 0066 Error Handling Convention For Phase 3

- Status: accepted

## Context

Completeness work adds more boundary failures: bad session files, unsupported file mixes, blocked clipboard permissions, too-large share links, and unavailable storage.

## Decision

All user-facing errors follow `what / why / now what`. The app surfaces recoverable errors inline without clearing the draft. Storage and import helpers throw domain-specific `Error` objects with actionable messages, and the extension follows the same style where practical.

## Consequences

Users keep their work and understand their next step.

## Alternatives Considered

Generic browser error text was rejected because it creates silent or misleading failure paths.
