# Phase 3 Controls Audit

Audit date: 2026-05-09

Legend:

- `green` label matches end-to-end behavior on real input
- `scope` intentionally out of scope in Phase 3 with ADR coverage

| Control                                         | Status | Evidence                                                           | Gap                    |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------ | ---------------------- |
| `GitHub` link                                   | green  | Opens repository                                                   | None                   |
| `PayPal` link                                   | green  | Opens support link                                                 | None                   |
| `Analyze` / `Cancel` button                     | green  | Runs worker, exposes large-input state, and can cancel             | None                   |
| `Sample`                                        | green  | Reloads the built-in sample draft                                  | None                   |
| `Import files`                                  | green  | Handles text, HTML, Markdown, session JSON, and multi-file imports | None                   |
| `Clipboard`                                     | green  | Reads clipboard text or explains why the browser blocked it        | None                   |
| `Start fresh`                                   | green  | Clears the working draft and share hash                            | None                   |
| `Copy summary`                                  | green  | Copies a human-readable report                                     | None                   |
| `Draft text` / `Analysis JSON` / `Session JSON` | green  | All three exports download correctly                               | None                   |
| `Share URL`                                     | green  | Generates a small-session share link                               | None                   |
| Filter chips                                    | green  | Filter suggestions by category                                     | None                   |
| Suggestion replacement buttons                  | green  | Apply replacements into editor                                     | No multi-step undo yet |
| `Add word`                                      | green  | Persists words and exposes removal/clear controls                  | None                   |
| `Build report`                                  | green  | Builds history summary and handles empty history cleanly           | None                   |
| `Clear history`                                 | green  | Removes saved history end to end                                   | None                   |
| Settings toggles                                | green  | Every toggle changes stored behavior                               | None                   |
| Textarea itself                                 | green  | Accepts typing, paste, and dropped-file workflow around it         | None                   |

Notes:

- There are no stubbed controls left in the production UI.
- The biggest remaining usability gap is the lack of a richer undo/history model, not mislabeled buttons.
