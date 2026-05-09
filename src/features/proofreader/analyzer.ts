import nspell from "nspell";
import type {
  Suggestion,
  AnalysisRequest,
  AnalysisResult,
} from "../../shared/types";
import {
  grammarRules,
  regexSuggestions,
  rewriteRules,
  styleRules,
} from "./rules";
import {
  anomalySuggestions,
  ignoredZoneKindsList,
  normalizationChangeSuggestions,
  overlapsIgnoredZone,
  prepareInput,
} from "./inference";

interface SpellChecker {
  correct(word: string): boolean;
  suggest(word: string): string[];
  add(word: string): void;
}

let spellPromise: Promise<SpellChecker | null> | null = null;
let dictionaryWords = 0;

const domainWords = [
  "api",
  "cheerpj",
  "duckdb",
  "github",
  "grammarly",
  "hunspell",
  "indexeddb",
  "javascript",
  "languagetool",
  "localhost",
  "markdown",
  "typescript",
  "vale",
  "vite",
  "wasm",
];

export async function analyzeText(
  request: AnalysisRequest,
): Promise<AnalysisResult> {
  const started = performance.now();
  const prepared = prepareInput(request.text);
  const text = prepared.text;
  const customWords = request.customWords.map((word) => normalizeWord(word));
  const spell = await loadSpellchecker(request.basePath);

  if (spell) {
    for (const word of [
      ...domainWords,
      ...documentVocabulary(prepared.document.kind),
      ...customWords,
    ]) {
      if (word) {
        spell.add(word);
      }
    }
  }

  const rawSuggestions = [
    ...normalizationChangeSuggestions(
      prepared.normalizations.filter(
        (change) =>
          !overlapsIgnoredZone(change.start, change.end, prepared.zones),
      ),
    ),
    ...anomalySuggestions(
      prepared.anomalies.filter(
        (anomaly) =>
          !overlapsIgnoredZone(anomaly.start, anomaly.end, prepared.zones),
      ),
    ),
    ...filterIgnored(regexSuggestions(text, grammarRules), prepared.zones),
    ...filterIgnored(repeatedWordSuggestions(text), prepared.zones),
    ...filterIgnored(capitalizationSuggestions(text), prepared.zones),
    ...finalPunctuationSuggestion(text, prepared.document.kind),
    ...filterIgnored(passiveVoiceSuggestions(text), prepared.zones),
    ...longSentenceSuggestions(text, prepared.zones),
    ...(spell
      ? spellingSuggestions(text, spell, new Set(customWords), prepared.zones)
      : []),
    ...rewriteSuggestions(text, prepared.zones),
  ].sort((a, b) => a.start - b.start || a.ruleId.localeCompare(b.ruleId));

  const suggestions = groupSuggestions(rawSuggestions);
  const words = countWords(text);
  const generatedAt = request.now ?? new Date().toISOString();

  return {
    suggestions,
    stats: {
      characters: text.length,
      words,
      sentences: splitSentences(text).length,
      readingTimeMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / 225)),
      analyzedAt: generatedAt,
      elapsedMs: Math.round(performance.now() - started),
      inputHash: stableHash(text),
      state: analysisState(words, suggestions.length),
    },
    engine: {
      spellcheckerReady: Boolean(spell),
      dictionaryWords,
      grammarRules: grammarRules.length + 3,
      styleRules: styleRules.length + 2,
      rewriteRules: rewriteRules.length,
    },
    document: prepared.document,
    zones: prepared.zones,
    anomalies: prepared.anomalies,
    normalizations: prepared.normalizations,
    provenance: {
      schemaVersion: "phase2.v1",
      appVersion: request.appVersion ?? "v0.1.0",
      sourceHash: stableHash(text),
      generatedAt,
      parameters: {
        customWordCount: customWords.length,
        ignoredZoneKinds: ignoredZoneKindsList(),
      },
    },
  };
}

async function loadSpellchecker(
  basePath: string,
): Promise<SpellChecker | null> {
  spellPromise ??= (async () => {
    try {
      const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
      const [affResponse, dicResponse] = await Promise.all([
        fetch(`${base}dictionaries/en.aff`),
        fetch(`${base}dictionaries/en.dic`),
      ]);

      if (!affResponse.ok || !dicResponse.ok) {
        return null;
      }

      const [aff, dic] = await Promise.all([
        affResponse.text(),
        dicResponse.text(),
      ]);
      dictionaryWords = Number.parseInt(dic.split("\n")[0] ?? "0", 10) || 0;

      return nspell({ aff, dic }) as SpellChecker;
    } catch {
      return null;
    }
  })();

  return spellPromise;
}

function spellingSuggestions(
  text: string,
  spell: SpellChecker,
  customWords: Set<string>,
  zones: ReturnType<typeof prepareInput>["zones"],
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const seen = new Set<string>();
  const pattern = /\b[A-Za-z][A-Za-z']{2,}\b/g;
  let match = pattern.exec(text);

  while (match && suggestions.length < 18) {
    const original = match[0];
    const normalized = normalizeWord(original);

    if (
      normalized.length > 2 &&
      !seen.has(normalized) &&
      !customWords.has(normalized) &&
      !/^[A-Z]{2,}$/.test(original) &&
      !overlapsIgnoredZone(match.index, match.index + original.length, zones) &&
      !spell.correct(original)
    ) {
      const replacements = spell.suggest(original).slice(0, 4);
      seen.add(normalized);
      suggestions.push({
        id: `spelling.${normalized}:${match.index}`,
        ruleId: "spelling.hunspell",
        category: "spelling",
        severity: "error",
        source: "Hunspell",
        title: "Possible misspelling",
        message: `"${original}" is not in the local Hunspell dictionary.`,
        explanation:
          "Suggestions are generated locally from the packaged English dictionary.",
        reason:
          "The word is in a prose zone and was not found in the local Hunspell dictionary.",
        start: match.index,
        end: match.index + original.length,
        original,
        replacements,
        confidence: replacements.length > 0 ? 0.82 : 0.55,
      });
    }

    match = pattern.exec(text);
  }

  return suggestions;
}

function repeatedWordSuggestions(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const pattern = /\b([A-Za-z]+)\s+\1\b/gi;
  let match = pattern.exec(text);

  while (match) {
    suggestions.push({
      id: `grammar.repeated-word:${match.index}`,
      ruleId: "grammar.repeated-word",
      category: "grammar",
      severity: "error",
      source: "LanguageTool-style rules",
      title: "Repeated word",
      message: "The same word appears twice in a row.",
      explanation: "Repeated words are often accidental typing mistakes.",
      reason: "Two identical words appear with only whitespace between them.",
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      replacements: [match[1]],
      confidence: 0.96,
    });
    match = pattern.exec(text);
  }

  return suggestions;
}

function capitalizationSuggestions(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const pattern = /(^|[.!?]\s+)([a-z])/g;
  let match = pattern.exec(text);

  while (match) {
    const start = match.index + match[1].length;
    suggestions.push({
      id: `grammar.capitalization:${start}`,
      ruleId: "grammar.capitalization",
      category: "grammar",
      severity: "warning",
      source: "LanguageTool-style rules",
      title: "Capitalize sentence start",
      message: "Sentences should usually begin with a capital letter.",
      explanation:
        "The local grammar pass checks sentence-boundary capitalization.",
      reason: "A lowercase letter appears at a likely sentence boundary.",
      start,
      end: start + 1,
      original: match[2],
      replacements: [match[2].toUpperCase()],
      confidence: 0.86,
    });
    match = pattern.exec(text);
  }

  return suggestions;
}

function finalPunctuationSuggestion(
  text: string,
  documentKind: AnalysisResult["document"]["kind"],
): Suggestion[] {
  const trimmed = text.trimEnd();

  if (
    !trimmed ||
    /[.!?]$/.test(trimmed) ||
    ["markdown", "email-template", "empty"].includes(documentKind)
  ) {
    return [];
  }

  return [
    {
      id: `grammar.final-punctuation:${trimmed.length}`,
      ruleId: "grammar.final-punctuation",
      category: "grammar",
      severity: "info",
      source: "LanguageTool-style rules",
      title: "Add ending punctuation",
      message: "The final sentence may need punctuation.",
      explanation: "This mirrors a common grammar-tool document cleanup rule.",
      reason: "The final prose sentence has no ending punctuation.",
      start: trimmed.length,
      end: trimmed.length,
      original: "",
      replacements: ["."],
      confidence: 0.72,
    },
  ];
}

function passiveVoiceSuggestions(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const pattern =
    /\b(am|is|are|was|were|be|been|being)\s+([a-z]+ed|built|made|seen|known|given|taken)\b/gi;
  let match = pattern.exec(text);

  while (match) {
    suggestions.push({
      id: `style.passive-voice:${match.index}`,
      ruleId: "style.passive-voice",
      category: "style",
      severity: "warning",
      source: "Vale-style rules",
      title: "Check passive voice",
      message: "Passive voice can hide the actor.",
      explanation: "Use active voice when the actor matters.",
      reason: "A form of 'to be' is followed by a likely past participle.",
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      replacements: [],
      confidence: 0.7,
    });
    match = pattern.exec(text);
  }

  return suggestions;
}

function longSentenceSuggestions(
  text: string,
  zones: ReturnType<typeof prepareInput>["zones"],
): Suggestion[] {
  return splitSentences(text)
    .filter((sentence) => countWords(sentence.text) > 28)
    .filter(
      (sentence) => !overlapsIgnoredZone(sentence.start, sentence.end, zones),
    )
    .map((sentence) => ({
      id: `style.long-sentence:${sentence.start}`,
      ruleId: "style.long-sentence",
      category: "style",
      severity: "warning",
      source: "Vale-style rules",
      title: "Split long sentence",
      message: "This sentence is long enough to slow readers down.",
      explanation:
        "Vale-style editorial rules flag long sentences for scannability.",
      reason:
        "The sentence is over the configured 28-word readability threshold.",
      start: sentence.start,
      end: sentence.end,
      original: sentence.text,
      replacements: [],
      confidence: 0.75,
    }));
}

function rewriteSuggestions(
  text: string,
  zones: ReturnType<typeof prepareInput>["zones"],
): Suggestion[] {
  const sentences = splitSentences(text).filter(
    (sentence) => !overlapsIgnoredZone(sentence.start, sentence.end, zones),
  );
  const firstLongSentence = sentences.find(
    (sentence) => countWords(sentence.text) > 14,
  );

  if (!firstLongSentence) {
    return [];
  }

  const concise = firstLongSentence.text
    .replace(/\b(very|really|basically|actually|just)\b\s*/gi, "")
    .replace(/\butilize\b/gi, "use")
    .replace(/\s+/g, " ")
    .trim();

  if (concise === firstLongSentence.text.trim()) {
    return [];
  }

  return [
    {
      id: `rewrite.local:${firstLongSentence.start}`,
      ruleId: "rewrite.local-concise",
      category: "rewrite",
      severity: "info",
      source: "Local rewrite",
      title: "Local concise rewrite",
      message: "A deterministic local rewrite can make this sentence tighter.",
      explanation:
        "This v1 rewrite adapter is local-only and does not call an LLM service.",
      reason:
        "The sentence contains removable filler or a simpler replacement.",
      start: firstLongSentence.start,
      end: firstLongSentence.end,
      original: firstLongSentence.text,
      replacements: [concise],
      confidence: 0.62,
    },
  ];
}

function splitSentences(
  text: string,
): Array<{ text: string; start: number; end: number }> {
  const sentences: Array<{ text: string; start: number; end: number }> = [];
  const pattern = /[^.!?]+[.!?]?/g;
  let match = pattern.exec(text);

  while (match) {
    const sentence = match[0];
    if (sentence.trim()) {
      sentences.push({
        text: sentence,
        start: match.index,
        end: match.index + sentence.length,
      });
    }
    match = pattern.exec(text);
  }

  return sentences;
}

function countWords(text: string): number {
  return text.match(/\b[\w']+\b/g)?.length ?? 0;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/^'+|'+$/g, "");
}

function filterIgnored(
  suggestions: Suggestion[],
  zones: ReturnType<typeof prepareInput>["zones"],
): Suggestion[] {
  return suggestions.filter(
    (suggestion) =>
      !overlapsIgnoredZone(suggestion.start, suggestion.end, zones),
  );
}

function groupSuggestions(suggestions: Suggestion[]): Suggestion[] {
  const grouped = new Map<string, Suggestion>();

  for (const suggestion of suggestions) {
    const key = groupKey(suggestion);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        ...suggestion,
        groupId: key,
        occurrences: suggestion.occurrences ?? 1,
      });
      continue;
    }

    existing.occurrences =
      (existing.occurrences ?? 1) + (suggestion.occurrences ?? 1);
    existing.confidence = Math.max(existing.confidence, suggestion.confidence);
    existing.reason =
      existing.occurrences > 1
        ? `${existing.reason} This pattern appears ${existing.occurrences} times.`
        : existing.reason;
  }

  return Array.from(grouped.values()).sort(
    (a, b) => a.start - b.start || a.ruleId.localeCompare(b.ruleId),
  );
}

function groupKey(suggestion: Suggestion): string {
  if (suggestion.ruleId === "style.long-sentence") {
    return suggestion.ruleId;
  }

  if (suggestion.ruleId === "anomaly.repeated-pattern") {
    return suggestion.ruleId;
  }

  return `${suggestion.ruleId}:${suggestion.start}:${suggestion.end}:${suggestion.replacements.join("|")}`;
}

function analysisState(
  words: number,
  suggestionCount: number,
): AnalysisResult["stats"]["state"] {
  if (words === 0) {
    return "loaded-empty";
  }

  if (suggestionCount === 0) {
    return "loaded-no-issues";
  }

  if (suggestionCount > 25) {
    return "loaded-many";
  }

  return "loaded-some";
}

function documentVocabulary(
  kind: AnalysisResult["document"]["kind"],
): string[] {
  const common = [
    "cybersecurity",
    "digitalisation",
    "unsubscribe",
    "baditaflorin",
    "local",
    "proofreader",
  ];
  const byKind: Record<AnalysisResult["document"]["kind"], string[]> = {
    empty: [],
    plain: [],
    "legal-sec": [
      "adversaries",
      "cybersecurity",
      "infrastructure",
      "initiative",
      "tenants",
    ],
    "public-sector-pdf": ["council", "digitalisation", "fundamental", "press"],
    markdown: ["npm", "repo", "github", "install", "local-proofreader"],
    "email-template": [
      "unsubscribe",
      "mailto",
      "href",
      "newsletter",
      "placeholder",
    ],
    "social-comment": ["atleast"],
    "mixed-language": [],
    huge: [
      "adversaries",
      "cybersecurity",
      "infrastructure",
      "initiative",
      "tenants",
    ],
  };

  return [...common, ...byKind[kind]];
}

function stableHash(text: string): string {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
