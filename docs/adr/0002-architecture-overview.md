# 0002 Architecture Overview And Module Boundaries

## Status

Accepted

## Context

The project needs a static website, a local analysis engine, persistence, and a browser extension wrapper. The code should stay modular enough to later swap in heavier WASM engines.

## Decision

Use feature-oriented frontend modules under `src/features/`. The editor owns UI state, the proofreader feature owns rules and analysis types, the storage feature owns IndexedDB and DuckDB-facing summaries, and the extension wrapper under `extension/` owns web-page injection. Shared contracts live in `src/shared/`.

## Consequences

The web app and extension can share rule semantics without requiring a backend. Analysis runs off the main UI path where possible. A future CheerpJ/LanguageTool or larger local LLM adapter can be added behind the proofreader engine boundary.

## Alternatives Considered

A monolithic `App.tsx` was rejected because it would make worker and extension reuse brittle. A runtime service boundary was rejected by ADR 0001.
