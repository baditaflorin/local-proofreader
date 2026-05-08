# 0005 Client-Side Storage Strategy

## Status

Accepted

## Context

Users need local drafts, accepted words, and analysis history without accounts or sync.

## Decision

Use IndexedDB through `idb` for draft snapshots, local dictionary terms, and recent analysis summaries. Use `localStorage` only for small UI preferences. Avoid OPFS in v1 because the data volume is small.

## Consequences

All user data stays local to the browser profile. Clearing site data removes stored drafts. Cross-device sync is not available in v1.

## Alternatives Considered

Server storage was rejected. OPFS was considered for large local model files, but v1 does not ship a bundled model large enough to require it.
