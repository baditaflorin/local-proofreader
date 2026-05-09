# 0050 Interaction Learning Policy

## Status

Accepted

## Context

Users correct spellings and repeated false positives during a session.

## Decision

Use transparent local-only learning: custom dictionary additions and ignored repeated pattern groups affect subsequent runs in the same browser profile. No hidden model training occurs.

## Consequences

The app gets less noisy without surprising users or sending data anywhere.

## Alternatives Considered

Silent behavioral learning was rejected because it would feel unpredictable.
