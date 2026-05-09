# 0047 Error Taxonomy And Messaging

## Status

Accepted

## Context

Errors need to be actionable and phrased in writing-domain terms.

## Decision

Errors and anomalies use what/why/now-what copy. Recoverable errors preserve draft text and previous results. Fatal errors are limited to worker recreation failure or browser storage denial.

## Consequences

No user-facing error should be a raw exception or "undefined" failure.

## Alternatives Considered

Letting worker errors bubble to React was rejected.
