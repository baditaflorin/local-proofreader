# 0017 Dependency Policy

## Status

Accepted

## Context

The bootstrap requires battle-tested libraries and no custom implementation where mature libraries exist.

## Decision

Use maintained production libraries for the core platform: Vite, React, Zod, TanStack Query, Comlink, idb, nspell, DuckDB-WASM, Vitest, Playwright, ESLint, Prettier, and Vite PWA. Custom code is limited to local rules, UI, adapters, and glue.

## Consequences

The project avoids inventing storage, build, testing, or spellchecking primitives. Dependency updates should be reviewed for bundle size, browser compatibility, and privacy behavior.

## Alternatives Considered

Hand-written spellchecking and custom test runners were rejected. Larger grammar engines are deferred behind adapters until their performance and Pages constraints are acceptable.
