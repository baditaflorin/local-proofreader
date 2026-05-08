# 0007 Data Generation Pipeline

## Status

Accepted

## Context

Mode A does not require scheduled scraping or external data refreshes. Some static assets may still be copied or normalized during local builds.

## Decision

There is no Mode B data-generation pipeline in v1. Static asset preparation is limited to deterministic build scripts, such as version metadata and packaged dictionary assets.

## Consequences

`make data` is intentionally omitted. If future versions add large rule packs or model metadata refreshed from external sources, this ADR must be superseded with a Mode B pipeline contract.

## Alternatives Considered

A release-hosted static data pipeline was deferred because v1 assets are small and repository-contained.
