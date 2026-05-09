import { openDB, type DBSchema } from "idb";
import type {
  AnalysisResult,
  AnalysisSnapshot,
  AppSettings,
  DraftSessionRecord,
  SavedSession,
  SuggestionCategory,
} from "../../shared/types";
import { defaultAppSettings, normalizeSettings } from "../session/state";

interface DictionaryEntry {
  word: string;
  addedAt: string;
}

interface SettingsEntry {
  key: "app-settings";
  value: AppSettings;
  updatedAt: string;
}

interface LocalProofreaderDb extends DBSchema {
  dictionary: {
    key: string;
    value: DictionaryEntry;
  };
  analyses: {
    key: string;
    value: AnalysisSnapshot;
  };
  settings: {
    key: SettingsEntry["key"];
    value: SettingsEntry;
  };
  drafts: {
    key: DraftSessionRecord["key"];
    value: DraftSessionRecord;
  };
}

const dbPromise = openDB<LocalProofreaderDb>("local-proofreader", 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      db.createObjectStore("dictionary", { keyPath: "word" });
      db.createObjectStore("analyses", { keyPath: "id" });
      db.createObjectStore("settings", { keyPath: "key" });
    }

    if (oldVersion < 2 && !db.objectStoreNames.contains("drafts")) {
      db.createObjectStore("drafts", { keyPath: "key" });
    }
  },
});

export async function getCustomWords(): Promise<string[]> {
  const db = await dbPromise;
  const rows = await db.getAll("dictionary");

  return rows.map((row) => row.word).sort();
}

export async function addCustomWord(word: string): Promise<void> {
  const normalized = word.toLowerCase().trim();

  if (!normalized) {
    return;
  }

  const db = await dbPromise;
  await db.put("dictionary", {
    word: normalized,
    addedAt: new Date().toISOString(),
  });
}

export async function removeCustomWord(word: string): Promise<void> {
  const normalized = word.toLowerCase().trim();

  if (!normalized) {
    return;
  }

  const db = await dbPromise;
  await db.delete("dictionary", normalized);
}

export async function replaceCustomWords(words: string[]): Promise<void> {
  const db = await dbPromise;
  const transaction = db.transaction("dictionary", "readwrite");

  await transaction.store.clear();

  for (const word of [
    ...new Set(words.map((entry) => entry.toLowerCase().trim())),
  ]
    .filter(Boolean)
    .sort()) {
    await transaction.store.put({
      word,
      addedAt: new Date().toISOString(),
    });
  }

  await transaction.done;
}

export async function clearCustomWords(): Promise<void> {
  const db = await dbPromise;
  await db.clear("dictionary");
}

export async function saveAnalysisSnapshot(
  text: string,
  result: AnalysisResult,
): Promise<AnalysisSnapshot> {
  const snapshot: AnalysisSnapshot = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    textHash: await hashText(text),
    schemaVersion: result.provenance.schemaVersion,
    appVersion: result.provenance.appVersion,
    sourceHash: result.provenance.sourceHash,
    documentKind: result.document.kind,
    wordCount: result.stats.words,
    suggestionCount: result.suggestions.length,
    grammarCount: countByCategory(result, "grammar"),
    spellingCount: countByCategory(result, "spelling"),
    styleCount: countByCategory(result, "style"),
    rewriteCount: countByCategory(result, "rewrite"),
  };

  const db = await dbPromise;
  await db.put("analyses", snapshot);

  return snapshot;
}

export async function listAnalysisSnapshots(): Promise<AnalysisSnapshot[]> {
  const db = await dbPromise;
  const rows = await db.getAll("analyses");

  return rows
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
}

export async function clearAnalysisSnapshots(): Promise<void> {
  const db = await dbPromise;
  await db.clear("analyses");
}

export async function loadAppSettings(): Promise<AppSettings> {
  const db = await dbPromise;
  const row = await db.get("settings", "app-settings");

  return normalizeSettings(row?.value ?? defaultAppSettings);
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  const db = await dbPromise;
  await db.put("settings", {
    key: "app-settings",
    value: normalizeSettings(settings),
    updatedAt: new Date().toISOString(),
  });
}

export async function loadDraftSession(): Promise<SavedSession | null> {
  const db = await dbPromise;
  const row = await db.get("drafts", "last-session");

  return row?.session ?? null;
}

export async function saveDraftSession(session: SavedSession): Promise<void> {
  const db = await dbPromise;
  await db.put("drafts", {
    key: "last-session",
    savedAt: new Date().toISOString(),
    session,
  });
}

export async function clearDraftSession(): Promise<void> {
  const db = await dbPromise;
  await db.delete("drafts", "last-session");
}

function countByCategory(
  result: AnalysisResult,
  category: SuggestionCategory,
): number {
  return result.suggestions.filter(
    (suggestion) => suggestion.category === category,
  ).length;
}

async function hashText(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return hash.slice(0, 16);
}
