# 0042 Inference Engine

## Status

Accepted

## Context

The app needs to infer document shape and zones before applying grammar, spelling, style, and rewrite rules.

## Decision

Add a deterministic inference pass that detects zones, document shape, anomalies, and confidence. Zones include prose, URL, code fence, inline code, email header, template tag, quote, heading, and metadata. Document shapes include empty, huge, markdown, email template, legal/SEC, public-sector PDF, social comment, mixed-language, and plain.

## Consequences

Rules can skip or specialize non-prose zones. Confidence and reasons become part of the analysis result and debug surface.

## Alternatives Considered

Only adding more regex grammar rules was rejected because it would not fix false positives in non-prose content.
