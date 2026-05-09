# Phase 3 Findings

Audit date: 2026-05-09

## Top 5 Usability Gaps

1. Users cannot load their own files into the app.
2. Users cannot export analysis or saved state in a reusable format.
3. Reload continuity is weak: history exists, but the working draft does not reliably come back.
4. There is no settings surface even though a settings store exists.
5. The app’s main module is carrying too much responsibility, which slows every behavior change.

## Top 5 Half-Baked Features

1. DuckDB history report: finish export and richer output or narrow the README claim.
2. Extension wrapper: keep it, but make the README honest about its lighter scope.
3. Settings store: finish with visible settings or delete the dead store.
4. Integration test target: replace the placeholder with a real shell test.
5. Analysis history: finish the restore/export story or keep it clearly report-only.

## Top 5 Codebase Pain Points

1. `App.tsx` is the app, the workflow, and the persistence coordinator all at once.
2. Rule duplication between the web app and extension invites drift.
3. Persistence is under-modeled.
4. Real-user paths are under-tested compared with the happy-path analyzer.
5. Output contracts are implicit instead of versioned and typed.

## Top 5 Documentation / Reality Mismatches

1. The DuckDB report sounds fuller than it is.
2. The extension description should mention it is a lightweight local pass, not the whole app engine.
3. Quickstart proves build/smoke, but not reload persistence or real-data import.
4. There is no documented limitation section for unsupported input paths.
5. Phase 2 promises around explicit states now exist in analysis output, but not yet across all user journeys.

## Fully Usable Means

1. A stranger can paste text, drop a `.txt` or `.md` file, or import a saved state file and get a useful local pass without opening devtools.
2. The stranger can leave, reload, and come back to the same draft and settings.
3. The stranger can export the current draft state, export the analysis JSON, and copy a shareable summary without manual scraping.
4. The stranger can understand every failure and recover without losing work.
5. The README only claims behaviors that are test-backed in the shipped app.

## Phase 3 Success Metrics

1. Every row in the input and output audits is `green` or explicitly documented as out of scope.
2. Draft + settings restore succeeds after reload in the smoke/integration path.
3. Saved state round-trip is deterministic for the same draft and settings.
4. Real-data fixture suite stays green at 10/10.
5. Placeholder integration coverage is replaced by at least one real UI-shell test.

## Out Of Scope

1. New grammar or LLM capabilities.
2. Visual polish passes, animation work, or marketing surfaces.
3. Runtime backend work or architecture escalation beyond Mode A.
