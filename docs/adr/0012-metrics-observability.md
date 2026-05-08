# 0012 Metrics And Observability

## Status

Accepted

## Context

The project is local-first and static. Usage analytics would create privacy concerns.

## Decision

Use no analytics by default. The app surfaces local-only runtime status: engine readiness, suggestion count, and last local analysis time. No beacon, third-party script, or server metrics endpoint is shipped.

## Consequences

The maintainer receives no production usage telemetry. Privacy is simpler to explain and verify. Users can inspect network traffic and see that drafts are not sent to a service.

## Alternatives Considered

Plausible or a Cloudflare Worker beacon were considered but rejected for v1 because success can be measured through local tests, Pages availability, and user feedback.
