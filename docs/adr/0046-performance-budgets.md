# 0046 Performance Budgets

## Status

Accepted

## Context

The audit showed acceptable timing on fixtures but no progress/cancel affordance for large inputs.

## Decision

Budgets: median fixture analysis under 700 ms, p95 under 2 seconds, huge input under 5 seconds, and any input over 5,000 words enters large-analysis state with cancellation. Heavy work remains in the worker.

## Consequences

Performance docs record median, p95, and worst values. Build and smoke tests continue to enforce the happy path.

## Alternatives Considered

Only optimizing after user complaints was rejected because scale behavior is part of Phase 2 substance.
