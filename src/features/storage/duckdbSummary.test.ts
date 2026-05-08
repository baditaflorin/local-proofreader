import { describe, expect, it } from "vitest";
import { buildDuckDbSummary } from "./duckdbSummary";
import type { AnalysisSnapshot } from "../../shared/types";

describe("buildDuckDbSummary", () => {
  it("returns an empty fallback summary without history", async () => {
    await expect(buildDuckDbSummary([])).resolves.toMatchObject({
      mode: "fallback",
      totalRuns: 0,
      topCategory: "none",
    });
  });

  it("falls back to an in-memory summary when DuckDB cannot initialize", async () => {
    const snapshots: AnalysisSnapshot[] = [
      snapshot({
        grammarCount: 3,
        spellingCount: 1,
        styleCount: 0,
        rewriteCount: 0,
      }),
      snapshot({
        grammarCount: 0,
        spellingCount: 1,
        styleCount: 4,
        rewriteCount: 1,
      }),
    ];

    const summary = await buildDuckDbSummary(snapshots);

    expect(summary.totalRuns).toBe(2);
    expect(summary.totalSuggestions).toBe(10);
    expect(summary.topCategory).toBe("style");
  });
});

function snapshot(
  overrides: Pick<
    AnalysisSnapshot,
    "grammarCount" | "spellingCount" | "styleCount" | "rewriteCount"
  >,
): AnalysisSnapshot {
  const suggestionCount =
    overrides.grammarCount +
    overrides.spellingCount +
    overrides.styleCount +
    overrides.rewriteCount;

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    textHash: "abc",
    wordCount: 100,
    suggestionCount,
    ...overrides,
  };
}
