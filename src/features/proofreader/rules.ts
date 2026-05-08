import type { Suggestion, SuggestionCategory } from '../../shared/types'

interface RegexRule {
  id: string
  category: SuggestionCategory
  title: string
  message: string
  explanation: string
  pattern: RegExp
  replacement: string | ((match: RegExpExecArray) => string)
  confidence: number
}

export const grammarRules: RegexRule[] = [
  {
    id: 'grammar.alot',
    category: 'grammar',
    title: 'Use "a lot"',
    message: '"Alot" is usually written as two words.',
    explanation: 'This catches a common informal spelling that grammar tools flag.',
    pattern: /\balot\b/gi,
    replacement: 'a lot',
    confidence: 0.98,
  },
  {
    id: 'grammar.could-of',
    category: 'grammar',
    title: 'Use "could have"',
    message: '"Could of" is a sound-alike error for "could have".',
    explanation: 'Modal verbs pair with "have", not "of".',
    pattern: /\b(could|should|would)\s+of\b/gi,
    replacement: (match) => `${match[1].toLowerCase()} have`,
    confidence: 0.97,
  },
  {
    id: 'grammar.your-welcome',
    category: 'grammar',
    title: 'Use "you\'re welcome"',
    message: '"Your welcome" usually means "you are welcome".',
    explanation: 'Use the contraction when the meaning is "you are".',
    pattern: /\byour\s+welcome\b/gi,
    replacement: "you're welcome",
    confidence: 0.94,
  },
  {
    id: 'grammar.this-are',
    category: 'grammar',
    title: 'Subject and verb agreement',
    message: '"This" usually pairs with "is".',
    explanation: 'Singular demonstratives should use singular verbs.',
    pattern: /\bthis\s+are\b/gi,
    replacement: 'this is',
    confidence: 0.9,
  },
]

export const styleRules: RegexRule[] = [
  {
    id: 'style.weasel-very',
    category: 'style',
    title: 'Trim intensifier',
    message: 'Consider removing weak intensifiers like "very".',
    explanation: 'Vale-style rules prefer direct adjectives over weak emphasis.',
    pattern: /\b(very|really|quite|basically|actually|literally|simply|just)\b/gi,
    replacement: '',
    confidence: 0.7,
  },
  {
    id: 'style.utilize',
    category: 'style',
    title: 'Prefer simpler wording',
    message: 'Use "use" unless "utilize" adds a technical distinction.',
    explanation: 'Plain language is easier to scan and translate.',
    pattern: /\butilize\b/gi,
    replacement: 'use',
    confidence: 0.82,
  },
  {
    id: 'style.jargon',
    category: 'style',
    title: 'Reduce business jargon',
    message: 'This phrase can sound vague or corporate.',
    explanation: 'Vale-style jargon rules nudge copy toward concrete wording.',
    pattern: /\b(synergy|paradigm|best-in-class|low-hanging fruit)\b/gi,
    replacement: 'clearer wording',
    confidence: 0.68,
  },
  {
    id: 'style.hedge',
    category: 'style',
    title: 'Reduce hedging',
    message: 'Check whether this hedge weakens the sentence.',
    explanation: 'Hedges are useful when true, but overuse can make writing less confident.',
    pattern: /\b(maybe|perhaps|somewhat|probably|possibly)\b/gi,
    replacement: '',
    confidence: 0.66,
  },
]

export const rewriteRules = [
  'rewrite.make-concise',
  'rewrite.active-voice',
  'rewrite.simplify',
]

export function regexSuggestions(text: string, rules: RegexRule[]): Suggestion[] {
  const suggestions: Suggestion[] = []

  for (const rule of rules) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags)
    let match = pattern.exec(text)

    while (match) {
      const original = match[0]
      const replacement =
        typeof rule.replacement === 'function'
          ? rule.replacement(match)
          : preserveCase(original, rule.replacement)

      suggestions.push({
        id: `${rule.id}:${match.index}`,
        ruleId: rule.id,
        category: rule.category,
        severity: rule.category === 'grammar' ? 'error' : 'warning',
        source:
          rule.category === 'grammar' ? 'LanguageTool-style rules' : 'Vale-style rules',
        title: rule.title,
        message: rule.message,
        explanation: rule.explanation,
        start: match.index,
        end: match.index + original.length,
        original,
        replacements: replacement ? [replacement] : [],
        confidence: rule.confidence,
      })

      match = pattern.exec(text)
    }
  }

  return suggestions
}

function preserveCase(original: string, replacement: string): string {
  if (!replacement) {
    return replacement
  }

  if (original === original.toUpperCase()) {
    return replacement.toUpperCase()
  }

  if (/^[A-Z]/.test(original)) {
    return `${replacement.charAt(0).toUpperCase()}${replacement.slice(1)}`
  }

  return replacement
}
