# 0049 Inspectability And Debug Surface

## Status

Accepted

## Context

Power users and support need to see why the checker made a decision without adding a new product surface.

## Decision

`?debug=1` shows internal analysis metadata inline: document shape, zones, anomalies, elapsed time, and confidence details. It is hidden by default and contains no draft text beyond already visible suggestion excerpts.

## Consequences

Support can debug false positives without collecting user drafts.

## Alternatives Considered

Always-visible internal metadata was rejected as polish clutter.
