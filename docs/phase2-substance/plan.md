# Phase 2 Substance Plan

This plan ranks substance items by impact on the real-data audit in `docs/phase2-substance/realdata-audit.md`.

## Picklist

1. A2 Encoding and format normalization: BOM, CRLF, NBSP, smart quotes, glued punctuation, copied quote markers.
2. B9 Format normalization by default: whitespace, punctuation boundaries, suspicious split words.
3. B6 Auto-detect structure: prose, URL, code, email header, template tag, quote, heading, metadata.
4. B7 Auto-classify fields/zones: each detected zone gets type, confidence, and reason.
5. C13 Recognize common shapes: SEC/legal, PDF-ish public sector, Markdown, email template, social comment, empty, huge.
6. C15 Domain conventions baked in: do not proofread code/URLs/templates as prose; respect Markdown fences and email headers.
7. D16 Confidence scores on every inference, including zones and document shape.
8. D19 Explain decisions: every suggestion gets a short reason string.
9. H32 Actionable errors: what, why, now what.
10. H33 Boundary validation: analysis request is normalized at the worker boundary.
11. F24 Enumerate reachable states.
12. F25 No stuck states: each state has an exit.
13. F26 Cancellation cancels by terminating stale worker work.
14. F27 Concurrency safety through request sequencing.
15. G29 Heavy work stays in the worker.
16. G31 Cache expensive things: dictionary load and normalized fixture-derived analysis helpers.
17. G28 Profile real-data inputs and document budgets.
18. D18 Surface anomalies: OCR splits, glued punctuation, huge repetition, non-prose false-positive risk.
19. I35 Deterministic outputs: stable IDs, stable ordering, fixture determinism tests.
20. I37 Debug surface: `?debug=1` shows shape, zones, confidence, and performance metadata.
21. I38 Output provenance: snapshots carry schema/app/source metadata.
22. I36 Inspectable history: local history records stable summary/provenance, not draft text.
23. J39 Remember interaction corrections within the session: custom words and ignored repeated patterns affect subsequent runs.
24. A1 Fuzz/parser fixtures: 10 real fixtures plus synthetic empty/huge/malformed cases run in tests.
25. A3 Huge inputs: define and test 1x, 5x, 10x budgets.
26. A4 Partial inputs: truncated/copied fragments produce anomalies, not crashes.
27. A5 Adversarial input: URLs, template code, broken quote markers, and malformed punctuation are explicit tests.
28. C11 Domain vocabulary: user-facing labels say writing-domain words, not implementation terms.
29. C12 Domain-aware validation: "template tag skipped", "OCR split suspected", "empty draft".
30. C14 Domain-aware output metadata in local report/history.

## Implementation Order

1. Fixture contract and real-data tests.
2. Input normalization and zone inference.
3. Document-shape and domain vocabulary.
4. Suggestion confidence/reasoning and grouping.
5. State machine, cancellation, concurrency.
6. Determinism, debug surface, provenance.
7. Performance measurements and postmortem.
