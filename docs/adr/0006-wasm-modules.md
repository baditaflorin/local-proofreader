# 0006 WASM Modules

## Status

Accepted

## Context

The target stack mentions LanguageTool/CheerpJ, Hunspell, Vale, a local LLM, and DuckDB. GitHub Pages cannot set arbitrary COOP/COEP headers, so WASM choices must be lazy and static-friendly.

## Decision

Use JavaScript-first adapters in v1: `nspell` with Hunspell dictionary data for spelling, Vale-style local style rules in TypeScript, a local rewrite adapter with deterministic privacy-safe rewrites, and a lazy DuckDB-WASM module for local aggregate summaries. CheerpJ/LanguageTool and larger local LLM runtimes are documented as future adapters behind the worker boundary.

## Consequences

The initial payload remains under budget and no draft leaves the browser. Heavier WASM engines can load only after a user action. DuckDB-WASM is not required for first paint or the basic happy path.

## Alternatives Considered

Loading full LanguageTool through CheerpJ on first page load was rejected for performance and Pages header constraints. A hosted LLM was rejected because it violates the local-only promise.
