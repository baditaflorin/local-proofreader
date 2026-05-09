# Phase 2 Substance Real-Data Audit

Audit date: 2026-05-08

Audited app: `v0.1.0`

Live URL: https://baditaflorin.github.io/local-proofreader/

Repository: https://github.com/baditaflorin/local-proofreader

## Method

I ran the existing v1 happy path: open the app, paste text into the editor, click Analyze, and inspect the suggestion filters, first suggestion titles, stats, and visible state. The measured elapsed times below are manual Playwright timings around the Analyze action; they are useful directional numbers, not a profiler trace.

## 10 Real-World Inputs

| ID                            | Source / shape                                                                                                                                                                                                               | Messiness class                             | v1 result                                                                                                                                  | What it should have done                                                                                                                                  | Why it failed                                                                                      | Failure style                           | Manual work pushed to user                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| RD-01 clean-sec-10k           | Microsoft 2025 Form 10-K cybersecurity prose from SEC HTML: https://www.sec.gov/Archives/edgar/data/789019/000095017025100235/msft-20250630.htm                                                                              | Clean but domain-specific                   | 2 suggestions: 1 long sentence, 1 spelling. ~344 ms.                                                                                       | Recognize SEC/legal-technical context, avoid treating established domain terms/acronyms as likely typos, explain long-sentence confidence in legal prose. | No domain vocabulary or document-shape context; spelling/style rules operate on plain tokens only. | Mildly wrong-but-confident.             | User must decide which domain terms are false positives and add them manually.                                |
| RD-02 hn-missing-space        | Real Hacker News comment with a missing space after a period: https://news.ycombinator.com/item?id=25825917                                                                                                                  | Mildly messy social prose                   | 1 rewrite suggestion. It missed the obvious `period + next sentence` spacing problem. ~324 ms.                                             | Detect missing sentence boundary whitespace and offer a safe one-click fix.                                                                               | Parser treats the input as acceptable prose; no punctuation-boundary normalization.                | Silent wrongness.                       | User must proofread punctuation manually before trusting the app.                                             |
| RD-03 hn-soundalike-error     | Real HN discussion about “could of / should of”: https://news.ycombinator.com/item?id=41058107                                                                                                                               | Messy social prose with real grammar errors | 5 suggestions: caught sound-alike errors and several spellings. ~369 ms.                                                                   | Catch the errors, de-duplicate related suggestions, distinguish typo vs dialect/variant with confidence.                                                  | Grammar rules are local regexes with no clustering, no variant policy, and limited explanations.   | Partially useful, but noisy.            | User must interpret duplicate-looking “Use could have” titles and decide whether spellings are true mistakes. |
| RD-04 sec-ocr-artifacts       | SEC/PDF extraction artifact with split words such as section headings from 10-K output: https://www.sec.gov/Archives/edgar/data/789019/000095017025100235/msft-20250630.htm                                                  | Genuinely messy OCR/PDF text                | 1 rewrite suggestion. It missed split-heading artifacts and broken words. ~310 ms.                                                         | Normalize OCR/PDF line artifacts before linting; flag suspicious intra-word spaces with low-confidence repair.                                            | No pre-normalization phase; checker sees malformed headings as normal tokens.                      | Silent wrongness.                       | User must manually clean pasted PDF/SEC text before analysis.                                                 |
| RD-05 hn-nested-quote         | HN nested quote text with `>` markers glued to words: https://news.ycombinator.com/item?id=46250205                                                                                                                          | Broken copied web text                      | 0 suggestions. ~323 ms.                                                                                                                    | Recognize quoted/threaded markup, separate quote markers from prose, and flag missing spaces around punctuation/quote markers.                            | No pasted-web normalization or Markdown-ish quote handling.                                        | Wrong-but-confident: no issues shown.   | User must notice the app missed the broken structure.                                                         |
| RD-06 project-readme-markdown | This repo’s README-style Markdown with URLs and fenced shell commands: https://github.com/baditaflorin/local-proofreader                                                                                                     | Structured prose plus code/URLs             | 4 suggestions: mostly spelling/final-punctuation false positives inside URLs/code-ish text. ~308 ms.                                       | Segment prose from URLs, code fences, commands, and metadata before checking.                                                                             | No non-prose detection; all tokens are fed to the same rules.                                      | Noisy wrongness.                        | User must mentally ignore suggestions that the app should suppress.                                           |
| RD-07 empty-input             | Empty editor                                                                                                                                                                                                                 | Edge case empty                             | 0 suggestions, but stats still show 1 minute read time and a “last save” value. ~307 ms.                                                   | Show an explicit empty state with 0 min read time and no saved-analysis snapshot.                                                                         | Stats force `Math.max(1)` read time and the happy path autosaves every run.                        | Bad intuition.                          | User has to infer that empty input was not meaningfully analyzed.                                             |
| RD-08 huge-sec-repeat         | Large input made by repeating real SEC prose to 84,778 characters / 12,600 words                                                                                                                                             | Huge                                        | 181 suggestions, mostly repeated long-sentence entries. UI stayed responsive in this run, ~335 ms, but showed no progress/cancel/grouping. | Stream/chunk analysis, group repeated findings, show progress if work is non-trivial, and make cancellation possible.                                     | Engine returns a flat list; no operation state model, grouping, or cancellation contract.          | Overwhelming, not technically crashing. | User must scroll through repeated low-value findings.                                                         |
| RD-09 council-pdf-lines       | Council of the EU press-release/PDF text with headers and line breaks: https://www.consilium.europa.eu/en/press/press-releases/2023/10/20/council-sets-out-vision-for-protecting-fundamental-rights-in-the-digital-world/pdf | PDF-ish public-sector text                  | 2 suggestions: one rewrite, one spelling. ~313 ms.                                                                                         | Recognize headers, dates, public-body labels, and line-break artifacts before checking prose.                                                             | No document-shape detection; headers and body text are merged into one plain stream.               | Partially useful but shallow.           | User must remove headers and decide what is body copy.                                                        |
| RD-10 email-template-code     | Real email-template/unsubscribe-link shapes from email vendor docs: https://www.airship.com/docs/guides/messaging/messages/content/email/email-unsubscribe-links/                                                            | Adversarial structured text                 | 5 suggestions, mostly spelling/final-punctuation false positives in headers, URLs, and template syntax. ~310 ms.                           | Recognize email headers, URLs, template tags, and placeholders; lint prose only.                                                                          | No boundary validation or structured-zone segmentation.                                            | Noisy wrongness.                        | User must know which parts are code/template and ignore the app.                                              |

## Baseline Read

Useful without meaningful manual filtering: RD-01, RD-03, partly RD-09.

Clearly mishandled today: RD-02, RD-04, RD-05, RD-06, RD-07, RD-08, RD-10.

Baseline pass rate: 3/10 if “useful first pass” allows mild noise; 1/10 if “little manual filtering” is required.

## Top 5 Logic Gaps

1. No input normalization layer for copied real-world text. Missing spaces after punctuation, PDF line-break artifacts, OCR split words, glued quote markers, NBSP, and malformed headings go straight into rules.
2. No prose vs non-prose segmentation. URLs, Markdown fences, shell commands, email headers, template tags, and placeholders are linted as normal prose.
3. No document-shape/domain context. SEC filings, public-sector PDFs, support docs, email templates, README Markdown, and social comments all get the same rule sensitivity and vocabulary.
4. Suggestions are flat and ungrouped. Huge inputs produce repetitive findings instead of grouped patterns with counts, confidence, and representative examples.
5. State/stat logic is too happy-path. Empty input still shows a 1 minute read time; analysis autosaves even when no meaningful document exists; long work has no progress or cancellation contract.

## Top 3 Intuition Failures

1. Empty input looks “successfully analyzed” instead of explicitly empty.
2. Pasting Markdown/email/code produces confident-looking spelling suggestions on URLs and syntax the app should know not to proofread.
3. Broken copied-web/PDF text can produce zero or shallow suggestions, making the app look certain when it actually failed to understand the input.

## Top 3 “Feels Stupid” Moments

1. The user has to clean PDF/OCR artifacts before the proofreader can help.
2. The user has to mentally exclude URLs, commands, headers, and template tags from suggestions.
3. The user has to infer why a suggestion exists; the app has confidence numbers internally, but not enough reasoning or “this may be low confidence” guidance.

## What Smart Means For Local Proofreader

1. Pasting messy text should trigger a normalization pass first: fix obvious whitespace/punctuation artifacts, detect suspicious split words, and preserve the original for reversibility.
2. The checker should infer zones: prose, quote, code fence, URL, email header, template tag, heading, and metadata. Prose gets proofread; non-prose is ignored or treated with specialized rules.
3. The engine should infer document shape and adjust vocabulary/rules: SEC/legal, technical README, public-sector PDF, email template, social comment, empty, huge, multilingual/mixed.
4. Every suggestion should carry confidence and a short reason. Low-confidence suggestions should never look as authoritative as high-confidence grammar fixes.
5. Large or repetitive inputs should produce grouped, deterministic, cancellable analysis rather than hundreds of repeated cards.

## Phase 2 Substance Success Metrics

1. Real-data pass rate: at least 7/10 audit fixtures produce a useful first pass with no manual cleanup before analysis.
2. No silent wrongness: every low-confidence or structurally uncertain inference is surfaced as low-confidence or recoverable, not as a confident suggestion.
3. Non-prose false positives: Markdown/code/URL/email-template fixtures reduce false-positive suggestions by at least 80% from the v1 baseline.
4. Empty state correctness: empty input produces 0 suggestions, 0 min read time, no saved-analysis snapshot, and an explicit empty-state reason.
5. Determinism: all 10 real-data fixtures produce byte-identical normalized output and suggestion output across 5 consecutive runs.
6. Performance honesty: median paste-to-useful-suggestions under 700 ms on the fixture set; p95 under 2 seconds; inputs over 5,000 words expose progress and cancellation.
7. Huge-input usefulness: repeated findings are grouped so RD-08 shows fewer than 25 user-facing groups while preserving full counts in metadata.
8. Error/actionability audit: every recoverable failure states what failed, why in writing-domain terms, and what the user can do next.

## Explicitly Out Of Scope

- No backend, auth, sync, or deployment-mode change.
- No new product surfaces beyond the existing editor, suggestion list, local report, and extension wrapper.
- No visual polish pass, dark mode, command palette, landing-page redesign, or decorative work.
- No hosted LLM or server-side grammar API.
- No broad multilingual grammar engine in Phase 2; mixed-language detection and “do not confidently lint this” behavior are in scope.
- No browser-store packaging work for the extension.
- No export feature expansion beyond metadata needed for reproducibility if existing local report/history output touches it.

## Completion Note

Phase 2 closed at a 10/10 fixture-contract pass rate with deterministic repeated runs. The detailed completion notes live in `docs/postmortem-phase2-substance.md` and `docs/perf/phase2-fixtures.md`.
