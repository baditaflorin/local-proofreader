# Phase 3 Output Audit

Audit date: 2026-05-09

Legend:

- `green` works fully
- `yellow` works partially
- `scope` intentionally out of scope in Phase 3 with ADR coverage

| Output                       | Status | Evidence                                                         | Gap                                        |
| ---------------------------- | ------ | ---------------------------------------------------------------- | ------------------------------------------ |
| On-screen suggestions        | green  | Suggestion cards render with apply actions and confidence states | None                                       |
| Apply replacement into draft | green  | Suggestion buttons replace editor text                           | No multi-step undo stack yet               |
| Add spelling to dictionary   | green  | Add, remove, and clear custom words all work locally             | None                                       |
| Local aggregate report       | yellow | DuckDB summary renders total runs and counts and can be cleared  | Still a compact summary rather than export |
| Copy analysis summary        | green  | `Copy summary` writes a human-readable local summary             | None                                       |
| Export JSON                  | green  | `Analysis JSON` downloads a provenance-rich payload              | None                                       |
| Export state file            | green  | `Session JSON` downloads a versioned restore file                | None                                       |
| Export plain corrected text  | green  | `Draft text` downloads the current draft                         | None                                       |
| Shareable URL                | green  | `Share URL` exports and restores smaller sessions through hash   | Large drafts still need session JSON       |
| Print / PDF-friendly view    | scope  | Explicitly deferred in ADR 0062                                  | Lower-value than import/export continuity  |
| API-ready output snippet     | scope  | Explicitly deferred in ADR 0062                                  | JSON export is enough for this phase       |

Summary:

- Green: 7
- Yellow: 1
- Out of scope: 2

Notes:

1. The remaining output limitation is depth of the compact local report, not the portability of the main workflow.
