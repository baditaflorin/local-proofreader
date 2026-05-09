# 0061 Input Pathway Coverage Policy

- Status: accepted

## Context

The current app mostly assumes direct typing or paste into one textarea. That is not enough for strangers with real drafts.

## Decision

Support these first-class input paths in the Pages app:

1. Typing and plain paste.
2. File input for `.txt`, `.md`, `.html`, and exported session `.json`.
3. Drag-drop for one or many compatible files.
4. Clipboard read where the browser allows it.
5. Last-session restore and share-link restore.

Remote URL import and folder import are explicitly out of scope in Phase 3. The UI and docs must say why: GitHub Pages cannot reliably fetch arbitrary pages because of browser CORS policy, and folder import is lower-value than the file and share flows.

## Consequences

The app becomes usable for real drafts without inventing a backend.

## Alternatives Considered

Adding a proxy backend for remote fetch was rejected because it would violate the Mode A choice.
