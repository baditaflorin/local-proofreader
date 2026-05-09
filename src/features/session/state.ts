import { z } from "zod";
import type {
  AnalysisExport,
  AnalysisResult,
  AppSettings,
  SavedSession,
  ActiveSuggestionFilter,
} from "../../shared/types";

export const defaultAppSettings: AppSettings = {
  autoAnalyze: true,
  includeRewrite: true,
  persistDraft: true,
  restoreSession: true,
  showConfidence: true,
  showDebugPanel: false,
};

const appSettingsSchema = z.object({
  autoAnalyze: z.boolean(),
  includeRewrite: z.boolean(),
  persistDraft: z.boolean(),
  restoreSession: z.boolean(),
  showConfidence: z.boolean(),
  showDebugPanel: z.boolean(),
});

const activeCategorySchema = z.enum([
  "all",
  "grammar",
  "spelling",
  "style",
  "rewrite",
]);

const savedSessionSchema = z.object({
  schemaVersion: z.literal("session.v1"),
  createdAt: z.string(),
  source: z.string(),
  text: z.string(),
  activeCategory: activeCategorySchema,
  customWords: z.array(z.string()),
  settings: appSettingsSchema,
});

export function normalizeSettings(
  settings: Partial<AppSettings> | null | undefined,
): AppSettings {
  return appSettingsSchema.parse({
    ...defaultAppSettings,
    ...(settings ?? {}),
  });
}

export function createSavedSession(input: {
  text: string;
  activeCategory: ActiveSuggestionFilter;
  customWords: string[];
  settings: AppSettings;
  source: string;
  createdAt?: string;
}): SavedSession {
  return {
    schemaVersion: "session.v1",
    createdAt: input.createdAt ?? new Date().toISOString(),
    source: input.source,
    text: input.text,
    activeCategory: input.activeCategory,
    customWords: [...input.customWords].sort(),
    settings: normalizeSettings(input.settings),
  };
}

export function parseSavedSession(value: unknown): SavedSession {
  return savedSessionSchema.parse(value);
}

export function serializeSavedSession(session: SavedSession): string {
  return JSON.stringify(parseSavedSession(session), null, 2);
}

export function createAnalysisExport(
  session: SavedSession,
  analysis: AnalysisResult,
): AnalysisExport {
  return {
    schemaVersion: "analysis-export.v1",
    createdAt: new Date().toISOString(),
    session: parseSavedSession(session),
    analysis,
  };
}

export function serializeAnalysisExport(
  session: SavedSession,
  analysis: AnalysisResult,
): string {
  return JSON.stringify(createAnalysisExport(session, analysis), null, 2);
}

export function buildSummaryText(
  analysis: AnalysisResult,
  settings: AppSettings,
): string {
  const visibleSuggestions = analysis.suggestions.filter(
    (suggestion) =>
      settings.includeRewrite || suggestion.category !== "rewrite",
  );
  const lines = [
    `Document: ${analysis.document.label}`,
    `Suggestions: ${visibleSuggestions.length}`,
    `Words: ${analysis.stats.words}`,
    `Sentences: ${analysis.stats.sentences}`,
    `Read time: ${analysis.stats.readingTimeMinutes} min`,
    `Version: ${analysis.provenance.appVersion}`,
    `Commit hash source: ${analysis.provenance.sourceHash}`,
  ];

  return lines.join("\n");
}

export function encodeShareHash(session: SavedSession): string {
  const json = serializeSavedSession(session);
  const bytes = new TextEncoder().encode(json);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function decodeShareHash(hash: string): SavedSession {
  const normalized = hash.replace(/^#share=/, "");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);

  return parseSavedSession(JSON.parse(json));
}

export function isShareHash(hash: string): boolean {
  return hash.startsWith("#share=");
}
