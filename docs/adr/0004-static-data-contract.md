# 0004 Static Data Contract

## Status

Accepted

## Context

Mode A uses static assets, not an API. The app needs packaged metadata, dictionaries, rule metadata, and version information.

## Decision

Static assets live under `public/` and are copied into `docs/` by Vite. The version contract is `/version.json` with `name`, `version`, `commit`, `dirty`, and `builtAt`. Dictionary assets live under `/dictionaries/` when packaged. Breaking static-data changes use versioned paths such as `/data/v2/`.

## Consequences

The frontend can fetch static files with a base-path-aware helper. No secrets or user text are ever embedded into static artifacts. The browser extension packages its own manifest and scripts separately.

## Alternatives Considered

A runtime REST API was rejected by ADR 0001. Large release-hosted artifacts were deferred until there is a dataset large enough to justify Mode B-style release downloads.
