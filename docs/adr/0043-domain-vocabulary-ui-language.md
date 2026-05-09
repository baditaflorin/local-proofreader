# 0043 Domain Vocabulary And UI Language

## Status

Accepted

## Context

Users think in writing terms, not parser terms.

## Decision

Use labels like copied PDF artifact, template tag, email header, Markdown code, quote marker, long legal sentence, and repeated pattern. Avoid exposing implementation labels such as selector, token, or parser node in user-facing copy.

## Consequences

Errors and debug output stay understandable to writers while retaining enough detail for support.

## Alternatives Considered

Developer-centric parser labels were rejected because they make low-confidence behavior feel arbitrary.
