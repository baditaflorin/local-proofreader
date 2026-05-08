# 0003 Frontend Framework And Build Tooling

## Status

Accepted

## Context

The product needs a polished interactive editor, strict TypeScript, fast local builds, a browser-extension-friendly codebase, and GitHub Pages compatibility.

## Decision

Use React, strict TypeScript, and Vite. Use Vitest for unit tests, Playwright for smoke tests, Prettier for formatting, ESLint for static checks, and Vite PWA support for offline-friendly installs.

## Consequences

The app builds into `docs/` for Pages and keeps the development loop fast. The framework choice keeps the UI maintainable while leaving the proofreader engine framework-agnostic.

## Alternatives Considered

Plain TypeScript was considered, but interactive editor state would become noisier. Next.js was rejected because a static Vite build is simpler for GitHub Pages.
