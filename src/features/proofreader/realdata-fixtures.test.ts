import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { analyzeText } from "./analyzer";
import type { AnalysisResult } from "../../shared/types";

interface ExpectedFixture {
  id: string;
  documentKind: AnalysisResult["document"]["kind"];
  mustIncludeRuleIds?: string[];
  mustNotIncludeRuleIds?: string[];
  requiresZones?: string[];
  requiresAnomalies?: string[];
  maxSuggestions?: number;
  maxVisibleSuggestions?: number;
  minGroupedOccurrences?: number;
  maxElapsedMs?: number;
  readingTimeMinutes?: number;
}

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const fixtureDir = join(root, "..", "test", "fixtures", "realdata");
const dictionaryDir = join(root, "..", "public", "dictionaries");

describe("real-data fixtures", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const file = url.endsWith("en.aff") ? "en.aff" : "en.dic";
        return new Response(readFileSync(join(dictionaryDir, file)), {
          status: 200,
        });
      }),
    );
  });

  for (const expectedFile of readdirSync(fixtureDir)
    .filter((file) => file.endsWith(".expected.json"))
    .sort()) {
    const expected = JSON.parse(
      readFileSync(join(fixtureDir, expectedFile), "utf8"),
    ) as ExpectedFixture;
    const text = readFileSync(
      join(fixtureDir, expectedFile.replace(".expected.json", ".txt")),
      "utf8",
    ).replace(/\n$/, "");

    it(`${expected.id} produces the expected stable substance summary`, async () => {
      const first = await analyzeFixture(text);
      const second = await analyzeFixture(text);

      expect(stableSummary(first)).toEqual(stableSummary(second));
      expect(first.document.kind).toBe(expected.documentKind);

      const ruleIds = first.suggestions.map((suggestion) => suggestion.ruleId);

      for (const ruleId of expected.mustIncludeRuleIds ?? []) {
        expect(ruleIds).toContain(ruleId);
      }

      for (const ruleId of expected.mustNotIncludeRuleIds ?? []) {
        expect(ruleIds).not.toContain(ruleId);
      }

      for (const zone of expected.requiresZones ?? []) {
        expect(first.zones.some((candidate) => candidate.kind === zone)).toBe(
          true,
        );
      }

      for (const anomaly of expected.requiresAnomalies ?? []) {
        expect(
          first.anomalies.some((candidate) => candidate.kind === anomaly),
        ).toBe(true);
      }

      if (expected.maxSuggestions !== undefined) {
        expect(first.suggestions.length).toBeLessThanOrEqual(
          expected.maxSuggestions,
        );
      }

      if (expected.maxVisibleSuggestions !== undefined) {
        expect(first.suggestions.length).toBeLessThanOrEqual(
          expected.maxVisibleSuggestions,
        );
      }

      if (expected.minGroupedOccurrences !== undefined) {
        expect(
          Math.max(
            ...first.suggestions.map(
              (suggestion) => suggestion.occurrences ?? 1,
            ),
          ),
        ).toBeGreaterThanOrEqual(expected.minGroupedOccurrences);
      }

      if (expected.maxElapsedMs !== undefined) {
        expect(first.stats.elapsedMs).toBeLessThanOrEqual(
          expected.maxElapsedMs,
        );
      }

      if (expected.readingTimeMinutes !== undefined) {
        expect(first.stats.readingTimeMinutes).toBe(
          expected.readingTimeMinutes,
        );
      }
    });
  }
});

async function analyzeFixture(text: string): Promise<AnalysisResult> {
  return analyzeText({
    text,
    basePath: "/local-proofreader/",
    customWords: [],
    now: "2026-05-09T00:00:00.000Z",
    appVersion: "v0.2.0-test",
  });
}

function stableSummary(result: AnalysisResult) {
  return {
    document: result.document,
    zones: result.zones.map((zone) => ({
      kind: zone.kind,
      start: zone.start,
      end: zone.end,
      confidence: zone.confidence,
    })),
    anomalies: result.anomalies.map((anomaly) => ({
      kind: anomaly.kind,
      start: anomaly.start,
      end: anomaly.end,
      confidence: anomaly.confidence,
    })),
    suggestions: result.suggestions.map((suggestion) => ({
      ruleId: suggestion.ruleId,
      start: suggestion.start,
      end: suggestion.end,
      replacements: suggestion.replacements,
      confidence: suggestion.confidence,
      occurrences: suggestion.occurrences ?? 1,
    })),
    stats: {
      inputHash: result.stats.inputHash,
      state: result.stats.state,
      words: result.stats.words,
      readingTimeMinutes: result.stats.readingTimeMinutes,
    },
  };
}
