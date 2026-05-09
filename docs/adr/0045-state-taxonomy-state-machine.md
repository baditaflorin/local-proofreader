# 0045 State Taxonomy And State Machine

## Status

Accepted

## Context

Large inputs, cancellation, empty input, stale worker responses, and recoverable errors need explicit states.

## Decision

Use the state taxonomy in `docs/phase2-substance/states.md`. The UI tracks idle, analyzing, loaded, empty, cancelled, and error states explicitly. Cancelling analysis terminates the worker and recreates it for the next run.

## Consequences

No result should arrive into the wrong state. Stale worker responses are ignored.

## Alternatives Considered

A single `isAnalyzing` boolean was rejected because it cannot represent cancelled, stale, empty, or recoverable-error states.
