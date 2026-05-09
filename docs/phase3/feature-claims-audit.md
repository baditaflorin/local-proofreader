# Phase 3 Feature Claims Audit

Audit date: 2026-05-09

Legend:

- `green` shipped fully
- `scope` intentionally narrower and documented as such

| Claim                                                                 | Source                             | Status | Reality                                                                             |
| --------------------------------------------------------------------- | ---------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| Local grammar checks inspired by LanguageTool rules                   | `README.md`                        | green  | Delivered through local regex rules and worker analysis                             |
| Hunspell-compatible spelling with packaged English dictionaries       | `README.md`                        | green  | Delivered through `nspell` and bundled assets                                       |
| Vale-style editorial rules                                            | `README.md`                        | green  | Delivered through local style rules                                                 |
| Deterministic local rewrite suggestions                               | `README.md`                        | green  | Delivered with deterministic rewrite rules                                          |
| File import and saved-session restore                                 | `README.md`                        | green  | Delivered through import buttons, drag-drop, share restore, and session JSON import |
| Export of corrected text, analysis JSON, session JSON, and share URLs | `README.md`                        | green  | Delivered through the output controls                                               |
| DuckDB-WASM compact local history report                              | `README.md`                        | green  | Compact local summary is delivered and described honestly                           |
| Browser-extension wrapper for lightweight inline checks               | `README.md`, `extension/README.md` | green  | Wrapper exists and is explicitly described as lighter than the full app             |
| Keeps draft text inside the browser                                   | `README.md`                        | green  | No network send path for draft text                                                 |
| PWA build                                                             | `README.md`                        | green  | Manifest and service worker are present                                             |
| Live app displays version and commit from `/version.json`             | `README.md`                        | green  | Footer shows version and commit metadata                                            |

Result:

1. No README or extension README claims are knowingly ahead of the shipped app surface.
