# Phase 3 Feature Claims Audit

Audit date: 2026-05-09

Legend:

- `green` shipped fully
- `yellow` shipped partially
- `red` not shipped or overstated

| Claim                                                           | Source                             | Status | Reality                                                                                  |
| --------------------------------------------------------------- | ---------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Local grammar checks inspired by LanguageTool rules             | `README.md`                        | green  | Delivered through local regex rules and worker analysis                                  |
| Hunspell-compatible spelling with packaged English dictionaries | `README.md`                        | green  | Delivered through `nspell` and bundled assets                                            |
| Vale-style editorial rules                                      | `README.md`                        | green  | Delivered through local style rules                                                      |
| Deterministic local rewrite suggestions                         | `README.md`                        | green  | Delivered with deterministic rewrite rules                                               |
| DuckDB-WASM local aggregate report from IndexedDB history       | `README.md`                        | yellow | Summary exists, but export and deeper inspection do not                                  |
| Browser-extension wrapper for inline checks                     | `README.md`, `extension/README.md` | yellow | Wrapper exists, but it is a lighter parallel ruleset, not the same engine or persistence |
| Keeps draft text inside the browser                             | `README.md`                        | green  | No network send path for draft text                                                      |
| PWA build                                                       | `README.md`                        | green  | Manifest and service worker are present                                                  |
| Live app displays version and commit from `/version.json`       | `README.md`                        | green  | Footer shows version/commit metadata                                                     |

Highest-priority mismatches:

1. “DuckDB report” reads bigger than the current summary-card reality.
2. “Browser extension wrapper” is true, but it is thinner than the app and should be described more honestly unless brought closer.
