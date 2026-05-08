# 0001 Deployment Mode

## Status

Accepted

## Context

Local Proofreader must keep draft text on the user's machine. The v1 product is a GitHub Pages app plus a browser extension wrapper. It needs grammar, spelling, style, local rewrite help, local persistence, and static metadata. It does not need hosted auth, team sync, shared state, private runtime secrets, or a mutation API.

## Decision

Use Mode A: Pure GitHub Pages. The web app is served from GitHub Pages and all document analysis runs in browser JavaScript, Web Workers, WASM-capable libraries, IndexedDB, and packaged static assets. The browser extension runs the same local checking model against editable fields on web pages.

## Consequences

The backend, Docker, nginx, runtime API, Prometheus, and server deploy sections are intentionally absent in v1. Build scripts may prepare static files, but no service receives user drafts. GitHub Pages remains the public surface. Any future hosted sync or shared team policy feature must get a new ADR and likely move to Mode C.

## Alternatives Considered

Mode B was considered for scheduled static grammar datasets, but v1 does not need external freshness. Mode C was rejected because it would undercut the privacy promise and add operational surface without a v1 requirement.
