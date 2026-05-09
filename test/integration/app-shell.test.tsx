import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../../src/App";
import { defaultAppSettings } from "../../src/features/session/state";

const analyzeMock = vi.fn(async ({ text }: { text: string }) => ({
  suggestions: [
    {
      id: "grammar.repeated-word:0",
      ruleId: "grammar.repeated-word",
      category: "grammar",
      severity: "error",
      source: "LanguageTool-style rules",
      title: "Repeated word",
      message: "The same word appears twice in a row.",
      explanation: "Repeated words are often accidental typing mistakes.",
      reason: "Two identical words appear with only whitespace between them.",
      start: 0,
      end: 11,
      original: "hello hello",
      replacements: ["hello"],
      confidence: 0.96,
    },
  ],
  stats: {
    characters: text.length,
    words: 2,
    sentences: 1,
    readingTimeMinutes: 1,
    analyzedAt: "2026-05-09T12:00:00.000Z",
    elapsedMs: 12,
    inputHash: "hash",
    state: "loaded-some",
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
}));

vi.mock("../../src/features/proofreader/worker/client", () => ({
  createProofreaderClient: () => ({
    analyze: analyzeMock,
    dispose: vi.fn(),
  }),
}));

vi.mock("../../src/features/storage/localStore", () => ({
  addCustomWord: vi.fn(),
  clearAnalysisSnapshots: vi.fn(),
  clearCustomWords: vi.fn(),
  clearDraftSession: vi.fn(),
  getCustomWords: vi.fn(async () => []),
  listAnalysisSnapshots: vi.fn(async () => []),
  loadAppSettings: vi.fn(async () => defaultAppSettings),
  loadDraftSession: vi.fn(async () => null),
  removeCustomWord: vi.fn(),
  saveAnalysisSnapshot: vi.fn(async () => null),
  saveAppSettings: vi.fn(async () => null),
  saveDraftSession: vi.fn(async () => null),
}));

vi.mock("../../src/features/storage/duckdbSummary", () => ({
  buildDuckDbSummary: vi.fn(async () => ({
    mode: "fallback",
    totalRuns: 1,
    totalSuggestions: 1,
    topCategory: "grammar",
  })),
}));

vi.mock("../../src/features/version/version", () => ({
  fetchVersionInfo: vi.fn(async () => ({
    name: "Local Proofreader",
    version: "v0.2.0",
    commit: "abcdef123456",
    dirty: false,
    builtAt: "2026-05-09T12:00:00.000Z",
  })),
}));

describe("app shell", () => {
  it("renders the usability controls and supports start fresh", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    await screen.findByRole("heading", { name: "Local Proofreader" });
    await screen.findByRole("button", { name: "Import files" });
    await screen.findByRole("button", { name: "Session JSON" });
    await screen.findByLabelText("Show debug panel");

    const editor = await screen.findByLabelText("Draft text");
    await waitFor(() => expect(editor).not.toHaveValue(""));

    await user.click(screen.getByRole("button", { name: "Start fresh" }));
    expect(editor).toHaveValue("");
  }, 15000);
});
