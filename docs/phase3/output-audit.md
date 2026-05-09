# Phase 3 Output Audit

Audit date: 2026-05-09

Legend:

- `green` works fully
- `yellow` works partially
- `red` claimed but broken or not built

| Output                       | Status | Evidence                                     | Gap                                                         |
| ---------------------------- | ------ | -------------------------------------------- | ----------------------------------------------------------- |
| On-screen suggestions        | green  | Suggestion cards render with apply actions   | No export or copy affordance from the same view             |
| Apply replacement into draft | green  | Suggestion buttons replace editor text       | No undo history beyond manual editing                       |
| Add spelling to dictionary   | green  | `addCustomWord()` persists word in IndexedDB | No visible dictionary management or removal                 |
| Local aggregate report       | yellow | DuckDB summary renders total runs and counts | Report cannot be exported or inspected in detail            |
| Copy analysis summary        | red    | No copy button                               | Users cannot move results into email, issue tracker, or doc |
| Export JSON                  | red    | No download path                             | Analysis and provenance cannot leave the app                |
| Export state file            | red    | No save-state path                           | Reload/cross-device continuity blocked                      |
| Export plain corrected text  | red    | No dedicated download/copy path              | Users must select text manually                             |
| Shareable URL                | red    | No encoded state in URL                      | Support and collaboration blocked                           |
| Print / PDF-friendly view    | red    | No print mode                                | Users cannot produce a stable artifact                      |
| API-ready output snippet     | red    | No stable machine-consumable output from UI  | Automation requires devtools/manual work                    |

Summary:

- Green: 3
- Yellow: 1
- Red: 7

Top blockers:

1. The app has almost no way to take work back out.
2. There is no portable state format.
3. Report output is trapped in a tiny summary card.
