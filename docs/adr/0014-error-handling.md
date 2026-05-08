# 0014 Error Handling Conventions

## Status

Accepted

## Context

Engine failures, dictionary fetch failures, storage errors, and extension injection errors should be clear without leaking text.

## Decision

Use typed result objects and user-safe error messages. Worker boundaries return structured errors. UI errors render in an alert/toast area. Storage calls fail closed and never block the core editor when optional history persistence fails.

## Consequences

Users see actionable failures, such as dictionary unavailable or storage blocked, without draft snippets in logs. Tests can assert error codes and messages.

## Alternatives Considered

Throwing raw exceptions through React was rejected. Swallowing errors was rejected because it hides privacy and correctness issues.
