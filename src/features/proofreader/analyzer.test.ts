import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeText } from "./analyzer";

describe("analyzeText", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns local grammar, style, and rewrite suggestions without a server", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    );

    const result = await analyzeText({
      text: "this are a very long sentence that could of been made shorter because it has alot of vague wording and will utilize synergy to make make readers tired",
      basePath: "/",
      customWords: [],
    });

    expect(result.engine.spellcheckerReady).toBe(false);
    expect(
      result.suggestions.some(
        (suggestion) => suggestion.ruleId === "grammar.this-are",
      ),
    ).toBe(true);
    expect(
      result.suggestions.some(
        (suggestion) => suggestion.ruleId === "grammar.repeated-word",
      ),
    ).toBe(true);
    expect(
      result.suggestions.some((suggestion) => suggestion.category === "style"),
    ).toBe(true);
    expect(
      result.suggestions.some(
        (suggestion) => suggestion.category === "rewrite",
      ),
    ).toBe(true);
    expect(result.stats.words).toBeGreaterThan(20);
  });

  it("applies the Vale-style jargon, hedging, and weasel-word rules end to end", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    );

    const result = await analyzeText({
      text: "We should really utilize synergy. This paradigm shift is a low-hanging fruit that maybe, perhaps, somewhat helps.",
      basePath: "/",
      customWords: [],
    });

    const ruleIds = result.suggestions.map((suggestion) => suggestion.ruleId);

    // These rules live in the `styleRules` table (rules.ts) and must be run
    // through `regexSuggestions` inside `analyzeText`, not just unit-tested
    // in isolation, or they silently never fire in the real app.
    expect(ruleIds).toContain("style.weasel-very");
    expect(ruleIds).toContain("style.utilize");
    expect(ruleIds).toContain("style.jargon");
    expect(ruleIds).toContain("style.hedge");
  });
});
