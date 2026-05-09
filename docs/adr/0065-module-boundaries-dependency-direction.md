# 0065 Module Boundaries And Dependency Direction

- Status: accepted

## Context

`App.tsx` currently mixes view rendering, worker orchestration, persistence, and transfer logic.

## Decision

Use these boundaries:

1. `proofreader/` owns analysis and inline rules.
2. `storage/` owns IndexedDB persistence and migrations.
3. `session/` owns import/export/share-state contracts.
4. `version/` owns build metadata.
5. `App.tsx` composes the workflow and UI, but does not own serialization or storage implementation details.

## Consequences

The main app file still coordinates the page, but the policy-heavy logic moves behind smaller seams.

## Alternatives Considered

Full component-library extraction was rejected because it adds files without solving the logic coupling by itself.
