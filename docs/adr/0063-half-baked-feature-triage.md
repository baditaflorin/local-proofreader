# 0063 Half-Baked Feature Triage

- Status: accepted

## Context

Phase 3 requires every half-built surface to be finished, hidden, or deleted.

## Decision

1. Keep and finish the settings store by giving it a real settings surface.
2. Keep and finish local history by pairing it with draft/session persistence and clear-history controls.
3. Keep the DuckDB report, but document it honestly as a compact local summary unless export depth is added.
4. Keep the extension, but remove rule drift by sharing inline logic and documenting that it is lightweight compared with the full app.
5. Delete unused assets and placeholder test surfaces.

## Consequences

The visible UI becomes smaller or more honest, and every remaining control has a real job.

## Alternatives Considered

Leaving dead stores and placeholder tests in place was rejected because it keeps the repo looking more complete than it is.
