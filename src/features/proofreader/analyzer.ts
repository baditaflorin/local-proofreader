import nspell from 'nspell'
import type { Suggestion, AnalysisRequest, AnalysisResult } from '../../shared/types'
import { grammarRules, regexSuggestions, rewriteRules, styleRules } from './rules'

interface SpellChecker {
  correct(word: string): boolean
  suggest(word: string): string[]
  add(word: string): void
}

let spellPromise: Promise<SpellChecker | null> | null = null
let dictionaryWords = 0

const domainWords = [
  'api',
  'cheerpj',
  'duckdb',
  'github',
  'grammarly',
  'hunspell',
  'indexeddb',
  'javascript',
  'languagetool',
  'localhost',
  'markdown',
  'typescript',
  'vale',
  'vite',
  'wasm',
]

export async function analyzeText(request: AnalysisRequest): Promise<AnalysisResult> {
  const started = performance.now()
  const text = request.text
  const customWords = request.customWords.map((word) => normalizeWord(word))
  const spell = await loadSpellchecker(request.basePath)

  if (spell) {
    for (const word of [...domainWords, ...customWords]) {
      if (word) {
        spell.add(word)
      }
    }
  }

  const suggestions = [
    ...regexSuggestions(text, grammarRules),
    ...repeatedWordSuggestions(text),
    ...capitalizationSuggestions(text),
    ...finalPunctuationSuggestion(text),
    ...passiveVoiceSuggestions(text),
    ...longSentenceSuggestions(text),
    ...(spell ? spellingSuggestions(text, spell, new Set(customWords)) : []),
    ...rewriteSuggestions(text),
  ].sort((a, b) => a.start - b.start || a.category.localeCompare(b.category))

  return {
    suggestions,
    stats: {
      characters: text.length,
      words: countWords(text),
      sentences: splitSentences(text).length,
      readingTimeMinutes: Math.max(1, Math.ceil(countWords(text) / 225)),
      analyzedAt: new Date().toISOString(),
      elapsedMs: Math.round(performance.now() - started),
    },
    engine: {
      spellcheckerReady: Boolean(spell),
      dictionaryWords,
      grammarRules: grammarRules.length + 3,
      styleRules: styleRules.length + 2,
      rewriteRules: rewriteRules.length,
    },
  }
}

async function loadSpellchecker(basePath: string): Promise<SpellChecker | null> {
  spellPromise ??= (async () => {
    try {
      const base = basePath.endsWith('/') ? basePath : `${basePath}/`
      const [affResponse, dicResponse] = await Promise.all([
        fetch(`${base}dictionaries/en.aff`),
        fetch(`${base}dictionaries/en.dic`),
      ])

      if (!affResponse.ok || !dicResponse.ok) {
        return null
      }

      const [aff, dic] = await Promise.all([affResponse.text(), dicResponse.text()])
      dictionaryWords = Number.parseInt(dic.split('\n')[0] ?? '0', 10) || 0

      return nspell({ aff, dic }) as SpellChecker
    } catch {
      return null
    }
  })()

  return spellPromise
}

function spellingSuggestions(
  text: string,
  spell: SpellChecker,
  customWords: Set<string>,
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const seen = new Set<string>()
  const pattern = /\b[A-Za-z][A-Za-z']{2,}\b/g
  let match = pattern.exec(text)

  while (match && suggestions.length < 18) {
    const original = match[0]
    const normalized = normalizeWord(original)

    if (
      normalized.length > 2 &&
      !seen.has(normalized) &&
      !customWords.has(normalized) &&
      !/^[A-Z]{2,}$/.test(original) &&
      !spell.correct(original)
    ) {
      const replacements = spell.suggest(original).slice(0, 4)
      seen.add(normalized)
      suggestions.push({
        id: `spelling.${normalized}:${match.index}`,
        ruleId: 'spelling.hunspell',
        category: 'spelling',
        severity: 'error',
        source: 'Hunspell',
        title: 'Possible misspelling',
        message: `"${original}" is not in the local Hunspell dictionary.`,
        explanation: 'Suggestions are generated locally from the packaged English dictionary.',
        start: match.index,
        end: match.index + original.length,
        original,
        replacements,
        confidence: replacements.length > 0 ? 0.82 : 0.55,
      })
    }

    match = pattern.exec(text)
  }

  return suggestions
}

function repeatedWordSuggestions(text: string): Suggestion[] {
  const suggestions: Suggestion[] = []
  const pattern = /\b([A-Za-z]+)\s+\1\b/gi
  let match = pattern.exec(text)

  while (match) {
    suggestions.push({
      id: `grammar.repeated-word:${match.index}`,
      ruleId: 'grammar.repeated-word',
      category: 'grammar',
      severity: 'error',
      source: 'LanguageTool-style rules',
      title: 'Repeated word',
      message: 'The same word appears twice in a row.',
      explanation: 'Repeated words are often accidental typing mistakes.',
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      replacements: [match[1]],
      confidence: 0.96,
    })
    match = pattern.exec(text)
  }

  return suggestions
}

function capitalizationSuggestions(text: string): Suggestion[] {
  const suggestions: Suggestion[] = []
  const pattern = /(^|[.!?]\s+)([a-z])/g
  let match = pattern.exec(text)

  while (match) {
    const start = match.index + match[1].length
    suggestions.push({
      id: `grammar.capitalization:${start}`,
      ruleId: 'grammar.capitalization',
      category: 'grammar',
      severity: 'warning',
      source: 'LanguageTool-style rules',
      title: 'Capitalize sentence start',
      message: 'Sentences should usually begin with a capital letter.',
      explanation: 'The local grammar pass checks sentence-boundary capitalization.',
      start,
      end: start + 1,
      original: match[2],
      replacements: [match[2].toUpperCase()],
      confidence: 0.86,
    })
    match = pattern.exec(text)
  }

  return suggestions
}

function finalPunctuationSuggestion(text: string): Suggestion[] {
  const trimmed = text.trimEnd()

  if (!trimmed || /[.!?]$/.test(trimmed)) {
    return []
  }

  return [
    {
      id: `grammar.final-punctuation:${trimmed.length}`,
      ruleId: 'grammar.final-punctuation',
      category: 'grammar',
      severity: 'info',
      source: 'LanguageTool-style rules',
      title: 'Add ending punctuation',
      message: 'The final sentence may need punctuation.',
      explanation: 'This mirrors a common grammar-tool document cleanup rule.',
      start: trimmed.length,
      end: trimmed.length,
      original: '',
      replacements: ['.'],
      confidence: 0.72,
    },
  ]
}

function passiveVoiceSuggestions(text: string): Suggestion[] {
  const suggestions: Suggestion[] = []
  const pattern =
    /\b(am|is|are|was|were|be|been|being)\s+([a-z]+ed|built|made|seen|known|given|taken)\b/gi
  let match = pattern.exec(text)

  while (match) {
    suggestions.push({
      id: `style.passive-voice:${match.index}`,
      ruleId: 'style.passive-voice',
      category: 'style',
      severity: 'warning',
      source: 'Vale-style rules',
      title: 'Check passive voice',
      message: 'Passive voice can hide the actor.',
      explanation: 'Use active voice when the actor matters.',
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      replacements: [],
      confidence: 0.7,
    })
    match = pattern.exec(text)
  }

  return suggestions
}

function longSentenceSuggestions(text: string): Suggestion[] {
  return splitSentences(text)
    .filter((sentence) => countWords(sentence.text) > 28)
    .map((sentence) => ({
      id: `style.long-sentence:${sentence.start}`,
      ruleId: 'style.long-sentence',
      category: 'style',
      severity: 'warning',
      source: 'Vale-style rules',
      title: 'Split long sentence',
      message: 'This sentence is long enough to slow readers down.',
      explanation: 'Vale-style editorial rules flag long sentences for scannability.',
      start: sentence.start,
      end: sentence.end,
      original: sentence.text,
      replacements: [],
      confidence: 0.75,
    }))
}

function rewriteSuggestions(text: string): Suggestion[] {
  const sentences = splitSentences(text)
  const firstLongSentence = sentences.find((sentence) => countWords(sentence.text) > 14)

  if (!firstLongSentence) {
    return []
  }

  const concise = firstLongSentence.text
    .replace(/\b(very|really|basically|actually|just)\b\s*/gi, '')
    .replace(/\butilize\b/gi, 'use')
    .replace(/\s+/g, ' ')
    .trim()

  if (concise === firstLongSentence.text.trim()) {
    return []
  }

  return [
    {
      id: `rewrite.local:${firstLongSentence.start}`,
      ruleId: 'rewrite.local-concise',
      category: 'rewrite',
      severity: 'info',
      source: 'Local rewrite',
      title: 'Local concise rewrite',
      message: 'A deterministic local rewrite can make this sentence tighter.',
      explanation: 'This v1 rewrite adapter is local-only and does not call an LLM service.',
      start: firstLongSentence.start,
      end: firstLongSentence.end,
      original: firstLongSentence.text,
      replacements: [concise],
      confidence: 0.62,
    },
  ]
}

function splitSentences(text: string): Array<{ text: string; start: number; end: number }> {
  const sentences: Array<{ text: string; start: number; end: number }> = []
  const pattern = /[^.!?]+[.!?]?/g
  let match = pattern.exec(text)

  while (match) {
    const sentence = match[0]
    if (sentence.trim()) {
      sentences.push({
        text: sentence,
        start: match.index,
        end: match.index + sentence.length,
      })
    }
    match = pattern.exec(text)
  }

  return sentences
}

function countWords(text: string): number {
  return text.match(/\b[\w']+\b/g)?.length ?? 0
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/^'+|'+$/g, '')
}
