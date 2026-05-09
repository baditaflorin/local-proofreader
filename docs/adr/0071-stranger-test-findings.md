# 0071 Stranger Test Findings And Response

- Status: accepted

## Context

Phase 3 requires a cold-user pass after the completeness work lands.

## Decision

Use the stranger path documented in `docs/phase3/stranger-test.md` as the final gate:

1. Import a real file.
2. Wait for a useful suggestion.
3. Export a session.
4. Copy a share URL.
5. Reload and confirm local restore.

The top three earlier confusion points were closed by adding input completeness, output completeness, and persistent local restore.

## Consequences

The release gate is tied to a real user story instead of only unit tests.

## Alternatives Considered

Relying only on analyzer fixtures was rejected because usability failures often live above the engine.
