# Phase 3 Input Audit

Audit date: 2026-05-09

Legend:

- `green` works fully
- `yellow` works partially
- `scope` intentionally out of scope in Phase 3 with ADR coverage

| Pathway                        | Status | Evidence                                                                    | Gap                                                       |
| ------------------------------ | ------ | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| Sample draft on first load     | green  | `Sample` control and default sample draft                                   | None                                                      |
| Direct typing in editor        | green  | `<textarea>` remains the main input surface                                 | None                                                      |
| Paste plain text into editor   | green  | Native textarea paste works                                                 | None                                                      |
| Paste rich HTML into editor    | yellow | Rich paste still becomes plain text in the textarea                         | Importing `.html` files is clearer than direct HTML paste |
| File upload                    | green  | `Import files` accepts `.txt`, `.md`, `.html`, and session `.json`          | None                                                      |
| Drag and drop file input       | green  | Editor pane is a drop target                                                | None                                                      |
| Clipboard read button          | green  | `Clipboard` uses `navigator.clipboard.readText()` with actionable failures  | Browser permission prompts still vary by platform         |
| URL input                      | scope  | Explicitly documented as out of scope in ADR 0061 and in the UI             | Mode A browser CORS limits external fetches               |
| Multi-file input               | green  | Multiple text-like files import into one working draft                      | None                                                      |
| Folder input                   | scope  | Explicitly deferred in ADR 0061                                             | Lower-value than file import for v1                       |
| Mobile picker                  | green  | Standard file input works on mobile file pickers                            | Device-specific picker UX depends on browser              |
| Imported state file            | green  | Versioned session `.json` import restores draft, settings, and custom words | None                                                      |
| Deep link / share state        | green  | URL hash import/export works for smaller sessions                           | Large drafts still need session export                    |
| Restored autosave              | green  | Last-session draft restore is persisted locally                             | None                                                      |
| Browser extension inline input | green  | Extension works on textareas, text inputs, and contenteditable fields       | It intentionally remains lighter than the full app        |

Summary:

- Green: 11
- Yellow: 1
- Out of scope: 2

Notes:

1. The only intentionally unsupported input path is remote URL fetch, because Pages cannot make that reliable without adding a backend.
2. Rich HTML paste is acceptable but still less transparent than importing an HTML file.
