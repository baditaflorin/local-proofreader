import { describe, expect, it } from "vitest";
import {
  buildSummaryText,
  createSavedSession,
  decodeShareHash,
  defaultAppSettings,
  encodeShareHash,
  serializeSavedSession,
} from "./state";

describe("session state", () => {
  it("round-trips a saved session through the share hash", () => {
    const session = createSavedSession({
      text: "hello world",
      activeCategory: "grammar",
      customWords: ["OpenAI", "DuckDB"],
      settings: defaultAppSettings,
      source: "test",
      createdAt: "2026-05-09T12:00:00.000Z",
    });

    const decoded = decodeShareHash(`#share=${encodeShareHash(session)}`);

    expect(decoded).toEqual(session);
  });

  it("serializes a stable saved session", () => {
    const session = createSavedSession({
      text: "draft",
      activeCategory: "all",
      customWords: ["beta", "alpha"],
      settings: defaultAppSettings,
      source: "sample",
      createdAt: "2026-05-09T12:00:00.000Z",
    });

    expect(serializeSavedSession(session)).toContain(
      '"schemaVersion": "session.v1"',
    );
    expect(session.customWords).toEqual(["alpha", "beta"]);
  });

  it("builds a human summary from analysis metadata", () => {
    const summary = buildSummaryText(
      {
        suggestions: [],
        stats: {
          characters: 10,
          words: 2,
          sentences: 1,
          readingTimeMinutes: 1,
          analyzedAt: "2026-05-09T12:00:00.000Z",
          elapsedMs: 10,
          inputHash: "abc123",
          state: "loaded-no-issues",
        },
        engine: {
          spellcheckerReady: true,
          dictionaryWords: 10,
          grammarRules: 1,
          styleRules: 1,
          rewriteRules: 1,
        },
        document: {
          kind: "plain",
          label: "Plain text",
          confidence: 0.9,
          reason: "test",
          wordCount: 2,
          largeInput: false,
        },
        zones: [],
        anomalies: [],
        normalizations: [],
        provenance: {
          schemaVersion: "phase2.v1",
          appVersion: "v0.2.0",
          sourceHash: "feedbeef",
          generatedAt: "2026-05-09T12:00:00.000Z",
          parameters: {
            customWordCount: 0,
            ignoredZoneKinds: ["url"],
          },
        },
      },
      defaultAppSettings,
    );

    expect(summary).toContain("Document: Plain text");
    expect(summary).toContain("Version: v0.2.0");
  });
});
