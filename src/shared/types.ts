export type SuggestionCategory = "grammar" | "spelling" | "style" | "rewrite";

export type SuggestionSeverity = "info" | "warning" | "error";

export type SuggestionSource =
  | "LanguageTool-style rules"
  | "Hunspell"
  | "Vale-style rules"
  | "Local rewrite";

export interface Suggestion {
  id: string;
  ruleId: string;
  category: SuggestionCategory;
  severity: SuggestionSeverity;
  source: SuggestionSource;
  title: string;
  message: string;
  explanation: string;
  start: number;
  end: number;
  original: string;
  replacements: string[];
  confidence: number;
}

export interface AnalysisStats {
  characters: number;
  words: number;
  sentences: number;
  readingTimeMinutes: number;
  analyzedAt: string;
  elapsedMs: number;
}

export interface EngineStatus {
  spellcheckerReady: boolean;
  dictionaryWords: number;
  grammarRules: number;
  styleRules: number;
  rewriteRules: number;
}

export interface AnalysisRequest {
  text: string;
  basePath: string;
  customWords: string[];
}

export interface AnalysisResult {
  suggestions: Suggestion[];
  stats: AnalysisStats;
  engine: EngineStatus;
}

export interface VersionInfo {
  name: string;
  version: string;
  commit: string;
  dirty: boolean;
  builtAt: string;
}

export interface AnalysisSnapshot {
  id: string;
  createdAt: string;
  textHash: string;
  wordCount: number;
  suggestionCount: number;
  grammarCount: number;
  spellingCount: number;
  styleCount: number;
  rewriteCount: number;
}
