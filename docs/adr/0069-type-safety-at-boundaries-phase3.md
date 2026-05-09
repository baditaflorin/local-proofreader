# 0069 Type Safety At Boundaries For Phase 3

- Status: accepted

## Context

Import/export and persistence work increases the number of untrusted boundaries.

## Decision

Validate these boundaries with `zod` or typed store contracts:

1. `version.json`
2. saved session imports
3. share-link decoded payloads
4. persisted settings and draft records

Reduce ad hoc casts in storage code by using typed `idb` schemas.

## Consequences

Completeness features do not open silent corruption paths.

## Alternatives Considered

Trusting imported JSON because it came from “our own app” was rejected because users edit files and links manually.
