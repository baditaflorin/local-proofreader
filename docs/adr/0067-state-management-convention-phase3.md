# 0067 State Management Convention For Phase 3

- Status: accepted

## Context

The app needs deterministic startup behavior across sample text, share links, saved sessions, and locally restored drafts.

## Decision

Hydration precedence is:

1. Share-link session from URL hash.
2. Imported session chosen by the user.
3. Last locally restored draft if `restoreSession` is enabled.
4. Built-in sample text.

Settings are loaded before draft hydration. Auto-analysis only starts after hydration completes.

## Consequences

Reload and share behavior become predictable instead of racey.

## Alternatives Considered

Analyzing immediately on first render was rejected because it races with restored state.
