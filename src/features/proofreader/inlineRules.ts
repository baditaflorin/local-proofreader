export interface InlineSuggestion {
  title: string;
  message: string;
  original: string;
  replacement: string;
  start: number;
  end: number;
}

interface InlineRule {
  title: string;
  message: string;
  pattern: RegExp;
  replacement: string | ((match: RegExpExecArray) => string);
}

const inlineRules: InlineRule[] = [
  {
    title: 'Use "a lot"',
    message: '"Alot" is usually written as two words.',
    pattern: /\balot\b/gi,
    replacement: "a lot",
  },
  {
    title: 'Use "could have"',
    message: '"Could of" is a sound-alike error.',
    pattern: /\b(could|should|would)\s+of\b/gi,
    replacement: (match) => `${match[1].toLowerCase()} have`,
  },
  {
    title: "Repeated word",
    message: "The same word appears twice in a row.",
    pattern: /\b([A-Za-z]+)\s+\1\b/gi,
    replacement: (match) => match[1],
  },
  {
    title: "Prefer simpler wording",
    message: 'Use "use" unless "utilize" adds a technical distinction.',
    pattern: /\butilize\b/gi,
    replacement: "use",
  },
];

export function analyzeInlineText(text: string): InlineSuggestion[] {
  return inlineRules.flatMap((rule) => {
    const suggestions: InlineSuggestion[] = [];
    let match = rule.pattern.exec(text);

    while (match && suggestions.length < 4) {
      suggestions.push({
        title: rule.title,
        message: rule.message,
        original: match[0],
        replacement:
          typeof rule.replacement === "function"
            ? rule.replacement(match)
            : rule.replacement,
        start: match.index,
        end: match.index + match[0].length,
      });
      match = rule.pattern.exec(text);
    }

    return suggestions;
  });
}
