# 0044 Confidence Model

## Status

Accepted

## Context

V1 showed confidence numbers but not enough reasoning and treated noisy suggestions too similarly.

## Decision

Every suggestion, zone, document-shape inference, and anomaly gets a confidence score and a short reason. Low confidence is surfaced as "review" rather than a hard correction. Grouped suggestions carry the max confidence and occurrence count.

## Consequences

The app is less confidently wrong. Tests can assert confidence ranges for fixtures.

## Alternatives Considered

Hiding confidence was rejected because real-data inputs require honesty about uncertainty.
