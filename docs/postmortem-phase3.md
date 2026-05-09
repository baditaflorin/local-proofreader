# Phase 3 Postmortem

## Audit Grids: Before Vs After

Input audit:

1. Before: 3 green / 3 yellow / 9 red.
2. After: 11 green / 1 yellow / 2 explicit out-of-scope.

Output audit:

1. Before: 3 green / 1 yellow / 7 red.
2. After: 7 green / 1 yellow / 2 explicit out-of-scope.

Controls audit:

1. Before: many core flows were missing rather than stubbed.
2. After: no production UI controls are stubbed; all visible controls do what their labels say.

## Half-Baked Feature Triage

1. Finished: settings store became a real settings surface.
2. Finished: draft/session restore and export story.
3. Finished: placeholder integration test replaced with real app-shell coverage.
4. Finished: extension rule drift reduced through a shared inline-rules module.
5. Deleted: unused React/Vite/hero assets.

## Codebase Health Metrics

Before:

1. DRY issues called out in the audit: 2.
2. TODO/FIXME/XXX/HACK count: 0.
3. Dead-code surfaces called out in the audit: 3.
4. Real-user path integration coverage: placeholder only.

After:

1. DRY issues materially reduced: the extension no longer carries its own copy of inline rules.
2. TODO/FIXME/XXX/HACK count stays at 0.
3. Dead-code surfaces closed: unused assets removed, settings store used, placeholder integration test removed.
4. Real-user path coverage now includes import/export-capable app-shell integration coverage plus the updated smoke path.

## Stranger Test

See `docs/phase3/stranger-test.md`.

Top three issues addressed:

1. No real import path.
2. No real output path.
3. Weak reload continuity.

## Documentation / Reality Mismatches Fixed

1. README now describes import/export/restore/settings explicitly.
2. The extension README now says it is intentionally lighter than the full app.
3. The DuckDB report claim is now described honestly as compact local history output.

## What Surprised Me

1. The biggest Phase 3 gains came from boring workflow plumbing, not from adding more logic.
2. Once session export and restore existed, the app immediately felt more trustworthy.

## Phase 4 Candidates

1. Undo/history beyond simple replacement actions.
2. Richer DuckDB report export and drill-down.
3. More transparent rich-HTML paste handling.
4. Better share behavior for larger drafts without relying on huge URL hashes.
5. Bringing more of the full app engine into the extension without bloating it.

## Honest Take

Could a stranger use it for their own real work end to end with zero help now? Mostly yes for local text workflows: import a draft, inspect local suggestions, export the result, save a session, reload, and continue. The specific remaining “no” is remote URL import. A stranger still cannot paste an arbitrary web URL and expect the app to fetch it, because that would require a backend or a proxy and this project intentionally stayed in Mode A.
