# 0041 Input Robustness And Normalization Policy

## Status

Accepted

## Context

Users paste text from PDFs, email tools, Markdown, websites, and public filings. These inputs contain BOMs, CRLF, NBSP, smart quotes, glued punctuation, quote markers, and OCR-style split words.

## Decision

Normalize at the analysis boundary. The engine records normalization facts, emits user-visible anomaly suggestions for risky repairs, and keeps positions stable wherever possible. Non-destructive normalization is used for analysis; the original draft remains editable until the user applies a suggestion.

## Consequences

The checker can reason about messy input without silently rewriting a user's text. Some offset mapping edge cases remain intentionally conservative.

## Alternatives Considered

Mutating the editor text before analysis was rejected because it would hide what changed.
