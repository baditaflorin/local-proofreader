# 0048 Determinism And Reproducibility

## Status

Accepted

## Context

Real-data fixture output must be reproducible, but analysis timestamps and random IDs can destabilize results.

## Decision

Suggestion IDs are derived from rule, position, and normalized text. Fixture tests compare stable summaries, not runtime timestamps. History snapshots include schema version, source hash, app version, and deterministic counts.

## Consequences

Same input produces the same stable summary across repeated runs.

## Alternatives Considered

Comparing the entire raw result including timestamps was rejected because runtime provenance still needs a generation time.
