# 0040 Real-Data Audit Findings And Substance Success Metrics

## Status

Accepted

## Context

The v1 app works on the curated demo but fails on copied PDFs, Markdown/code, email templates, empty drafts, and huge repeated inputs.

## Decision

Use the 10 real-data fixtures from `docs/phase2-substance/realdata-audit.md` as the Phase 2 grading rubric. Phase 2 succeeds when at least 7 of 10 fixtures produce a useful first pass without manual cleanup, deterministic fixture output is stable, non-prose false positives fall sharply, and large/empty states are explicit.

## Consequences

Every inference change must update fixture expectations. A red real-data fixture blocks the change unless a later ADR explains the tradeoff.

## Alternatives Considered

Continuing with only unit tests was rejected because toy-like behavior appeared only on real pasted inputs.
