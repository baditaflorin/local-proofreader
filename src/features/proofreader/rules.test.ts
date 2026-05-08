import { describe, expect, it } from "vitest";
import { grammarRules, regexSuggestions, styleRules } from "./rules";

describe("regexSuggestions", () => {
  it("detects grammar rules with local replacements", () => {
    const suggestions = regexSuggestions(
      "Alot of people could of waited.",
      grammarRules,
    );

    expect(suggestions.map((suggestion) => suggestion.ruleId)).toContain(
      "grammar.alot",
    );
    expect(suggestions.map((suggestion) => suggestion.ruleId)).toContain(
      "grammar.could-of",
    );
    expect(suggestions[0]?.replacements[0]).toBe("A lot");
  });

  it("detects Vale-style wording rules", () => {
    const suggestions = regexSuggestions(
      "We should really utilize synergy.",
      styleRules,
    );

    expect(suggestions.map((suggestion) => suggestion.ruleId)).toEqual([
      "style.weasel-very",
      "style.utilize",
      "style.jargon",
    ]);
  });
});
