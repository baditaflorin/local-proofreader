# Phase 3 Controls Audit

Audit date: 2026-05-09

Legend:

- `green` label matches end-to-end behavior on real input
- `yellow` partially true or too narrow
- `red` stub, misleading, or missing for an advertised flow

| Control                        | Status | Evidence                                   | Gap                                                                             |
| ------------------------------ | ------ | ------------------------------------------ | ------------------------------------------------------------------------------- |
| `GitHub` link                  | green  | Opens repository                           | None                                                                            |
| `PayPal` link                  | green  | Opens support link                         | None                                                                            |
| `Analyze` / `Cancel` button    | yellow | Runs worker and can cancel current request | State is clearer now, but there is no manual “retry with last state” affordance |
| Filter chips                   | green  | Filter suggestions by category             | None                                                                            |
| Suggestion replacement buttons | green  | Apply replacements into editor             | No undo stack and no “ignore once” control                                      |
| `Add word`                     | yellow | Persists custom word locally               | There is no way to review or remove custom words                                |
| `Build report`                 | yellow | Builds a summary from local history        | No export, no empty-history guidance beyond error text                          |
| Textarea itself                | yellow | Accepts typing and paste                   | Not a complete real-data input surface                                          |

Notes:

- There are no obvious dead buttons in the current UI.
- The real issue is missing controls: import, export, restore, reset, and settings are absent rather than stubbed.
