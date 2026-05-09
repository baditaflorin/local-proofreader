# 0062 Output Pathway Coverage Policy

- Status: accepted

## Context

The current app shows results on screen but has almost no way to take work back out.

## Decision

Support these output paths:

1. Copy analysis summary.
2. Download corrected text.
3. Download analysis JSON with provenance.
4. Download saved session JSON that can be re-imported.
5. Generate and copy a shareable URL hash for reasonably small sessions.

Print/PDF view and API-ready code snippets are explicitly deferred.

## Consequences

The app becomes usable for real workflows like review, handoff, and support.

## Alternatives Considered

Keeping output limited to the on-screen editor was rejected because it traps the user’s work.
