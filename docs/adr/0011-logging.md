# 0011 Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs. Browser logs can leak draft text if careless.

## Decision

Do not log user draft text. Production builds use minimal console output limited to startup and recoverable engine-status messages. Errors shown to users are summarized without including sensitive text.

## Consequences

Debuggability is intentionally constrained to protect drafts. Developers can use local tests and browser devtools during development.

## Alternatives Considered

Client analytics logging was rejected for v1. Full verbose browser logging was rejected because it can expose private writing.
