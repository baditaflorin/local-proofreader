# Phase 3 Codebase Audit

Audit date: 2026-05-09

This is the before-fix measurement pass.

## DRY Violations

1. Suggestion rule logic is duplicated between [src/features/proofreader/rules.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-grammarly-premium-144/src/features/proofreader/rules.ts:14) and [extension/src/content.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-grammarly-premium-144/extension/src/content.ts:205). The extension keeps a hand-maintained subset of rules.
2. Snapshot/category counting logic is local to [src/features/storage/localStore.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-grammarly-premium-144/src/features/storage/localStore.ts:33) while report summarization derives similar aggregates in [src/features/storage/duckdbSummary.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-grammarly-premium-144/src/features/storage/duckdbSummary.ts:101).

## SOLID / Boundary Issues

1. [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-grammarly-premium-144/src/App.tsx:52) is a god module: worker lifecycle, persistence, report building, filtering, links, footer metadata, and most UI all live together.
2. Persistence is split informally: custom words, settings, and analysis history share one store file but there is no typed storage boundary for app state.
3. The extension has its own embedded UI, parsing, and rules without a shared domain seam.

## Dead Code / Dormant Surfaces

1. The `settings` object store exists in [src/features/storage/localStore.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-grammarly-premium-144/src/features/storage/localStore.ts:8) but is not used by the app.
2. The integration test is a placeholder in [test/integration/app-shell.test.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-grammarly-premium-144/test/integration/app-shell.test.ts:1).
3. `src/assets/react.svg`, `src/assets/vite.svg`, and `src/assets/hero.png` are not part of the current app flow.

## TODO / FIXME / HACK Count

- Source count outside generated assets: 0

## Type Safety Holes

1. Several unsafe casts remain at boundaries: `wrap(... ) as Remote<ProofreaderService>`, `nspell(...) as SpellChecker`, IndexedDB `getAll()` casts, and fixture parsing casts.
2. External JSON boundaries are validated for `version.json`, but not yet for any portable app-state format because no such format exists.

## Inconsistent Patterns

1. Error handling is user-facing in the app but absent in the extension.
2. State persistence conventions differ: some things auto-save, some things only exist in memory, and there is no migration policy for user-facing state.

## Real-User Path Test Gaps

1. No test covers import/export because those paths do not exist.
2. No test covers reload persistence of the draft.
3. No integration test covers the actual UI shell.
