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
  reason: string;
  groupId?: string;
  occurrences?: number;
  zoneId?: string;
}

export interface AnalysisStats {
  characters: number;
  words: number;
  sentences: number;
  readingTimeMinutes: number;
  analyzedAt: string;
  elapsedMs: number;
  inputHash: string;
  state: AnalysisState;
}

export type AnalysisState =
  | "loaded-empty"
  | "loaded-no-issues"
  | "loaded-some"
  | "loaded-many";

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
  now?: string;
  appVersion?: string;
}

export interface AnalysisResult {
  suggestions: Suggestion[];
  stats: AnalysisStats;
  engine: EngineStatus;
  document: DocumentProfile;
  zones: DocumentZone[];
  anomalies: AnalysisAnomaly[];
  normalizations: NormalizationChange[];
  provenance: AnalysisProvenance;
}

export type DocumentKind =
  | "empty"
  | "plain"
  | "legal-sec"
  | "public-sector-pdf"
  | "markdown"
  | "email-template"
  | "social-comment"
  | "mixed-language"
  | "huge";

export type ZoneKind =
  | "prose"
  | "url"
  | "code-fence"
  | "inline-code"
  | "email-header"
  | "template-tag"
  | "quote"
  | "heading"
  | "metadata";

export interface DocumentProfile {
  kind: DocumentKind;
  label: string;
  confidence: number;
  reason: string;
  wordCount: number;
  largeInput: boolean;
}

export interface DocumentZone {
  id: string;
  kind: ZoneKind;
  label: string;
  start: number;
  end: number;
  confidence: number;
  reason: string;
}

export interface AnalysisAnomaly {
  id: string;
  kind: string;
  title: string;
  message: string;
  start: number;
  end: number;
  confidence: number;
  nextStep: string;
}

export interface NormalizationChange {
  id: string;
  kind: string;
  start: number;
  end: number;
  original: string;
  replacement: string;
  confidence: number;
  reason: string;
}

export interface AnalysisProvenance {
  schemaVersion: "phase2.v1";
  appVersion: string;
  sourceHash: string;
  generatedAt: string;
  parameters: {
    customWordCount: number;
    ignoredZoneKinds: ZoneKind[];
  };
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
  schemaVersion?: string;
  appVersion?: string;
  sourceHash?: string;
  documentKind?: DocumentKind;
  wordCount: number;
  suggestionCount: number;
  grammarCount: number;
  spellingCount: number;
  styleCount: number;
  rewriteCount: number;
}

export interface AppSettings {
  autoAnalyze: boolean;
  includeRewrite: boolean;
  persistDraft: boolean;
  restoreSession: boolean;
  showConfidence: boolean;
  showDebugPanel: boolean;
}

export type ActiveSuggestionFilter = "all" | SuggestionCategory;

export interface SavedSession {
  schemaVersion: "session.v1";
  createdAt: string;
  source: string;
  text: string;
  activeCategory: ActiveSuggestionFilter;
  customWords: string[];
  settings: AppSettings;
}

export interface DraftSessionRecord {
  key: "last-session";
  savedAt: string;
  session: SavedSession;
}

export interface AnalysisExport {
  schemaVersion: "analysis-export.v1";
  createdAt: string;
  session: SavedSession;
  analysis: AnalysisResult;
}
