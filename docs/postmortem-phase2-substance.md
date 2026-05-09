# Phase 2 Substance Postmortem

## Real-Data Pass Rate

Before:

- Useful first pass: 3/10 lenient, 1/10 strict.

After:

- Fixture contract pass rate: 10/10.
- Determinism: 10/10 fixtures stable across repeated runs.

Per fixture:

| Fixture                        | Before                       | After |
| ------------------------------ | ---------------------------- | ----- |
| `rd01-clean-sec-10k`           | Useful but noisy             | Pass  |
| `rd02-hn-missing-space`        | Missed obvious spacing error | Pass  |
| `rd03-hn-soundalike-error`     | Useful but noisy             | Pass  |
| `rd04-sec-ocr-artifacts`       | Missed OCR split artifacts   | Pass  |
| `rd05-hn-nested-quote`         | Wrongly empty                | Pass  |
| `rd06-project-readme-markdown` | URL/code false positives     | Pass  |
| `rd07-empty-input`             | Wrong empty-state stats      | Pass  |
| `rd08-huge-sec-repeat`         | Overwhelming flat list       | Pass  |
| `rd09-council-pdf-lines`       | Shallow understanding        | Pass  |
| `rd10-email-template-code`     | Template false positives     | Pass  |

## Top 5 Logic Gaps Closed

1. Normalization layer added for copied-web, OCR, punctuation-spacing, quote markers, and repeated-pattern anomalies.
2. Zone inference added so URLs, code fences, inline code, email headers, template tags, and metadata stop polluting prose checks.
3. Document-shape inference added for legal, public-sector PDF, Markdown, email-template, social-comment, mixed, empty, and huge inputs.
4. Grouping and explicit analysis states added so repeated patterns and long inputs stop flooding the UI.
5. Confidence, reasoning text, and debug provenance added so low-certainty behavior is visible instead of silent.

## Smart Behaviors That Now Work

1. Missing sentence-boundary spaces now surface as normalization suggestions.
2. Markdown, URLs, and template syntax are suppressed as non-prose zones.
3. Empty input now produces explicit empty-state behavior with zero-minute read time.
4. Huge repeated input groups repeated findings and enters a cancellable large-analysis state.

## Determinism Check

All 10 fixtures passed repeated deterministic checks.

## Performance

See `docs/perf/phase2-fixtures.md`.

Headline numbers:

1. Median fixture analysis stayed under 2 ms for all but the huge repeated input.
2. The huge repeated input measured 26.1 ms median and 77.6 ms worst in the analyzer harness.

## Surprises

1. The biggest gain came from input normalization and segmentation, not from adding more rules.
2. The engine itself was already fast; the real pain was wrong confidence and wrong boundaries.

## Still Open For Phase 3

1. Real import and export paths.
2. Full draft restore.
3. Real settings surface.
4. Honest README alignment.
5. A stranger-usable end-to-end path.

## Honest Take

The app felt smarter after Phase 2, but it still felt like a sharp demo rather than a fully usable tool. It understood messy text far better, yet users still had to bring data in manually, trust weak persistence, and scrape their work back out.
