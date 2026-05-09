# Phase 2 Fixture Performance

Measured on 2026-05-09 with five analyzer runs per real-data fixture after a warm dictionary load.

| Fixture                        | Median ms | P95 ms | Worst ms |
| ------------------------------ | --------: | -----: | -------: |
| `rd01-clean-sec-10k`           |       1.7 |    5.5 |      5.5 |
| `rd02-hn-missing-space`        |       1.7 |    2.8 |      2.8 |
| `rd03-hn-soundalike-error`     |       0.1 |    0.8 |      0.8 |
| `rd04-sec-ocr-artifacts`       |       0.3 |    0.3 |      0.3 |
| `rd05-hn-nested-quote`         |       0.2 |    0.7 |      0.7 |
| `rd06-project-readme-markdown` |       0.1 |    0.2 |      0.2 |
| `rd07-empty-input`             |       0.0 |    0.2 |      0.2 |
| `rd08-huge-sec-repeat`         |      26.1 |   77.6 |     77.6 |
| `rd09-council-pdf-lines`       |       0.2 |    0.3 |      0.3 |
| `rd10-email-template-code`     |       0.1 |    0.1 |      0.1 |

Takeaways:

1. The median fixture analysis time stays far below the Phase 2 700 ms budget.
2. The huge repeated fixture stays well below the 5 second honesty/cancellation threshold.
3. The browser UI still treats very large drafts as cancellable work even though the core analyzer itself is fast on this hardware.
