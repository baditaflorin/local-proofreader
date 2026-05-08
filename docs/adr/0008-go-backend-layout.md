# 0008 Go Backend Layout

## Status

Accepted

## Context

The bootstrap template specifies Go layout for Mode B/C. ADR 0001 selected Mode A.

## Decision

Skip the Go backend entirely in v1. No `cmd/`, `internal/`, `pkg/`, `api/`, or Docker server layout is created.

## Consequences

The repository is smaller and avoids a fake backend. If Mode B or Mode C becomes necessary, the Go layout will be introduced with a new ADR before implementation.

## Alternatives Considered

Creating placeholder Go directories was rejected because empty production structure invites drift and gives a false impression of a deployed service.
