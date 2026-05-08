# 0009 Configuration And Secrets Management

## Status

Accepted

## Context

Mode A must not include runtime secrets. GitHub Pages serves public static files.

## Decision

Use build-time public configuration only. `.env.example` documents placeholders, `.env*` files are gitignored, and the frontend never stores or sends API keys. Any future BYO-key feature must keep keys in browser storage only and never commit them.

## Consequences

There is no secret rotation process for v1 because no secrets exist. Gitleaks runs locally through hooks to reduce accidental exposure.

## Alternatives Considered

Encrypted frontend secrets were rejected because the browser would still need the decryption material. Runtime backend proxying was rejected by ADR 0001.
