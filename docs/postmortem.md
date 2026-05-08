# Postmortem

## What Was Built

Local Proofreader v0.1.0 is a Mode A GitHub Pages app with a local editor, grammar/style/rewrite engine in a Web Worker, Hunspell-compatible spellchecking through `nspell`, IndexedDB persistence, a lazy DuckDB-WASM report, PWA output, and a Manifest V3 browser-extension wrapper.

Live site: https://baditaflorin.github.io/local-proofreader/

Repository: https://github.com/baditaflorin/local-proofreader

Support: https://www.paypal.com/paypalme/florinbadita

## Was Mode A Correct?

Yes. In hindsight, v1 did not need Mode B or Mode C. The privacy promise is stronger because no runtime service exists, and all checks can run from static assets in the browser. The one tradeoff is that heavyweight engines such as CheerpJ/LanguageTool and large local LLMs need careful lazy loading before they are pleasant on GitHub Pages.

## What Worked

- GitHub Pages from `main` branch `/docs` worked from the first scaffold.
- Web Worker analysis kept UI and checking boundaries clean.
- `nspell` plus packaged Hunspell dictionaries gave useful local spelling without a service.
- Plain local hooks were enough to replace GitHub Actions for this v1.
- Playwright smoke testing caught real Pages/runtime assumptions.

## What Did Not Work

- Generated Pages files and source documentation sharing `docs/` needed a careful clean script.
- Fixed smoke-test ports were flaky locally and had to become randomized.
- Version metadata is inherently awkward when generated static files are committed; v1 shows the build source commit rather than trying to self-reference the publishing commit.

## Surprises

DuckDB-WASM's MVP bundle is about 39 MB. It is lazy-loaded and not precached by the service worker, but it is still a large committed static asset.

## Accepted Tech Debt

- LanguageTool/CheerpJ is represented by local LanguageTool-style rules, not the full Java engine.
- The local LLM is a deterministic rewrite adapter in v1, not a bundled model runtime.
- The extension uses a lightweight inline rule subset instead of sharing the full worker bundle.
- Integration tests are wired but minimal; the Playwright smoke test carries most end-to-end confidence.

## Next Improvements

1. Add a shared extension worker build so the extension can use the full proofreader engine.
2. Add an optional local model adapter using WebGPU or a user-supplied local endpoint that never sends text to a hosted API.
3. Add richer document overlays so textarea highlights align with suggestion ranges.

## Time

Estimated: one focused build session for a strong v1 scaffold and working local demo.

Actual: one focused build session, with extra time spent on Pages build hygiene, hooks, and smoke reliability.
