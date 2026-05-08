# 0010 GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live URL must work from day one. ADRs and documentation also need to live under `docs/`.

## Decision

Publish GitHub Pages from `main` branch `/docs`. Vite uses base path `/local-proofreader/` and writes the built app to `docs/`. The build cleans generated assets and generated HTML only, preserving `docs/adr/` and Markdown documentation. `docs/404.html` is copied from `docs/index.html` for SPA fallback behavior.

## Consequences

The repo keeps Pages output committed and reviewable. Stale generated assets are removed without deleting ADRs. No custom domain is configured in v1; if added, `docs/CNAME` and DNS instructions will be updated.

## Alternatives Considered

A `gh-pages` branch was considered but rejected to keep all work on `main`. Publishing from repository root was rejected because it would expose source and tooling files as the site root.
