# 0015 Deployment Topology

## Status

Accepted

## Context

ADR 0001 selected Mode A.

## Decision

Deploy only through GitHub Pages at https://baditaflorin.github.io/local-proofreader/. No Docker, nginx, server, database, or deploy directory is required in v1.

## Consequences

Rollback is a git revert of a publishing commit. Availability depends on GitHub Pages. There is no backend health endpoint.

## Alternatives Considered

Docker Compose and nginx were rejected because there is no runtime API.
