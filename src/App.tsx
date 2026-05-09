import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpenCheck,
  Check,
  ClipboardPaste,
  Copy,
  Database,
  Download,
  Eraser,
  GitFork,
  Heart,
  LoaderCircle,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import "./App.css";
import type {
  ActiveSuggestionFilter,
  AnalysisResult,
  AppSettings,
  SavedSession,
  Suggestion,
} from "./shared/types";
import {
  createProofreaderClient,
  type ProofreaderClient,
} from "./features/proofreader/worker/client";
import {
  addCustomWord,
  clearAnalysisSnapshots,
  clearCustomWords,
  clearDraftSession,
  getCustomWords,
  listAnalysisSnapshots,
  loadAppSettings,
  loadDraftSession,
  removeCustomWord,
  saveAnalysisSnapshot,
  saveAppSettings,
  saveDraftSession,
} from "./features/storage/localStore";
import {
  buildDuckDbSummary,
  type DuckDbSummary,
} from "./features/storage/duckdbSummary";
import {
  buildSummaryText,
  createSavedSession,
  decodeShareHash,
  defaultAppSettings,
  encodeShareHash,
  isShareHash,
  normalizeSettings,
  serializeAnalysisExport,
  serializeSavedSession,
} from "./features/session/state";
import { importClipboardText, importFiles } from "./features/session/importers";
import { fetchVersionInfo } from "./features/version/version";

const sampleText =
  "this are a very rough draft that could of been shipped faster. The team will utilize synergy to make make the product more best-in-class, but alot of users are worried about privacy and their writting being sent away";

const categoryLabels = {
  grammar: "Grammar",
  spelling: "Spelling",
  style: "Style",
  rewrite: "Rewrite",
} as const;

type UiState =
  | "idle-ready"
  | "analyzing-small"
  | "analyzing-large"
  | "loaded"
  | "cancelled"
  | "error-recoverable";

function App() {
  const clientRef = useRef<ProofreaderClient | null>(null);
  const requestIdRef = useRef(0);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState(sampleText);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);
  const [activeCategory, setActiveCategory] =
    useState<ActiveSuggestionFilter>("all");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [duckDbSummary, setDuckDbSummary] = useState<DuckDbSummary | null>(
    null,
  );
  const [isBuildingReport, setIsBuildingReport] = useState(false);
  const [uiState, setUiState] = useState<UiState>("idle-ready");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const [inputSource, setInputSource] = useState("sample");

  const versionQuery = useQuery({
    queryKey: ["version"],
    queryFn: fetchVersionInfo,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const appVersion = versionQuery.data?.version ?? "v0.3.0";
  const debugEnabled =
    settings.showDebugPanel ||
    new URLSearchParams(window.location.search).get("debug") === "1";

  useEffect(() => {
    let cancelled = false;
    clientRef.current = createProofreaderClient();

    void (async () => {
      try {
        const [storedWords, storedSettings] = await Promise.all([
          getCustomWords(),
          loadAppSettings(),
        ]);

        if (cancelled) {
          return;
        }

        let nextText = sampleText;
        let nextCategory: ActiveSuggestionFilter = "all";
        let nextWords = storedWords;
        let nextSettings = storedSettings;
        let nextSource = "sample";
        let nextNotice: string | null = null;

        if (isShareHash(window.location.hash)) {
          try {
            const shared = decodeShareHash(window.location.hash);
            nextText = shared.text;
            nextCategory = shared.activeCategory;
            nextWords = shared.customWords;
            nextSettings = normalizeSettings(shared.settings);
            nextSource = shared.source || "share";
            nextNotice = "Loaded a shared session from the URL.";
          } catch {
            setError(
              "Shared link could not be read. The draft was left on the local sample so you can keep working.",
            );
          }
        } else if (storedSettings.restoreSession) {
          const saved = await loadDraftSession();

          if (saved) {
            nextText = saved.text;
            nextCategory = saved.activeCategory;
            nextWords = saved.customWords;
            nextSettings = normalizeSettings(saved.settings);
            nextSource = saved.source || "restored";
            nextNotice = "Restored your last local draft.";
          }
        }

        if (cancelled) {
          return;
        }

        setText(nextText);
        setActiveCategory(nextCategory);
        setCustomWords(nextWords);
        setSettings(nextSettings);
        setInputSource(nextSource);
        setNotice(nextNotice);
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      clientRef.current?.dispose();
    };
  }, []);

  const analyze = useCallback(async () => {
    const client = clientRef.current;

    if (!client) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const wordEstimate = text.match(/\b[\w']+\b/g)?.length ?? 0;

    setIsAnalyzing(true);
    setUiState(wordEstimate > 5000 ? "analyzing-large" : "analyzing-small");
    setError(null);

    try {
      const result = await client.analyze({
        text,
        basePath: import.meta.env.BASE_URL,
        customWords,
        appVersion,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setAnalysis(result);

      if (result.stats.words > 0) {
        await saveAnalysisSnapshot(text, result);
        setLastSavedAt(formatClockTime());
      } else {
        setLastSavedAt(null);
      }

      setUiState("loaded");
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(
        "Analysis failed. The local worker could not finish this draft, usually because the browser interrupted the worker. Your text is still in the editor; retry or split the input.",
      );
      setUiState("error-recoverable");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsAnalyzing(false);
      }
    }
  }, [appVersion, customWords, text]);

  useEffect(() => {
    if (!isHydrated || !settings.autoAnalyze) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void analyze();
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [analyze, isHydrated, settings.autoAnalyze]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void saveAppSettings(settings).catch(() => {
      setError(
        "Settings could not be saved in this browser. They will still work for this tab, but they may not survive a reload.",
      );
    });
  }, [isHydrated, settings]);

  const currentSession = useMemo(
    () =>
      createSavedSession({
        text,
        activeCategory,
        customWords,
        settings,
        source: inputSource,
      }),
    [activeCategory, customWords, inputSource, settings, text],
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!settings.persistDraft) {
      void clearDraftSession();
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveDraftSession(currentSession).catch(() => {
        setError(
          "The draft could not be saved locally. Keep working, but export a session file before closing the tab.",
        );
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [currentSession, isHydrated, settings.persistDraft]);

  const visibleSuggestions = useMemo(() => {
    const suggestions = analysis?.suggestions ?? [];
    return settings.includeRewrite
      ? suggestions
      : suggestions.filter((suggestion) => suggestion.category !== "rewrite");
  }, [analysis, settings.includeRewrite]);

  const filteredSuggestions = useMemo(() => {
    if (activeCategory === "all") {
      return visibleSuggestions;
    }

    return visibleSuggestions.filter(
      (suggestion) => suggestion.category === activeCategory,
    );
  }, [activeCategory, visibleSuggestions]);

  const counts = useMemo(
    () => ({
      all: visibleSuggestions.length,
      grammar: visibleSuggestions.filter(
        (suggestion) => suggestion.category === "grammar",
      ).length,
      spelling: visibleSuggestions.filter(
        (suggestion) => suggestion.category === "spelling",
      ).length,
      style: visibleSuggestions.filter(
        (suggestion) => suggestion.category === "style",
      ).length,
      rewrite: visibleSuggestions.filter(
        (suggestion) => suggestion.category === "rewrite",
      ).length,
    }),
    [visibleSuggestions],
  );

  const cancelAnalysis = () => {
    requestIdRef.current += 1;
    clientRef.current?.dispose();
    clientRef.current = createProofreaderClient();
    setIsAnalyzing(false);
    setUiState("cancelled");
    setNotice("Analysis cancelled. Your draft stayed in place.");
  };

  const applySuggestion = (suggestion: Suggestion, replacement: string) => {
    setText(
      (current) =>
        `${current.slice(0, suggestion.start)}${replacement}${current.slice(suggestion.end)}`,
    );
  };

  const addWord = async (word: string) => {
    await addCustomWord(word);
    const updated = [...customWords, word.toLowerCase().trim()]
      .filter(Boolean)
      .filter((entry, index, entries) => entries.indexOf(entry) === index)
      .sort();
    setCustomWords(updated);
    setNotice(`Added "${word}" to the local dictionary.`);
  };

  const deleteWord = async (word: string) => {
    await removeCustomWord(word);
    setCustomWords((current) => current.filter((entry) => entry !== word));
    setNotice(`Removed "${word}" from the local dictionary.`);
  };

  const resetDictionary = async () => {
    await clearCustomWords();
    setCustomWords([]);
    setNotice("Cleared the local custom dictionary.");
  };

  const buildReport = async () => {
    setIsBuildingReport(true);
    setError(null);

    try {
      const snapshots = await listAnalysisSnapshots();

      if (snapshots.length === 0) {
        setDuckDbSummary(null);
        setNotice("No history is saved yet. Run an analysis first.");
        return;
      }

      setDuckDbSummary(await buildDuckDbSummary(snapshots));
    } catch {
      setError(
        "Local report failed. IndexedDB history could not be queried in this browser session; keep writing and try again after another analysis run.",
      );
    } finally {
      setIsBuildingReport(false);
    }
  };

  const clearHistory = async () => {
    await clearAnalysisSnapshots();
    setDuckDbSummary(null);
    setNotice("Cleared local analysis history.");
  };

  const loadSample = () => {
    setText(sampleText);
    setInputSource("sample");
    setNotice("Loaded the built-in sample draft.");
    setError(null);
  };

  const startFresh = async () => {
    setText("");
    setAnalysis(null);
    setInputSource("fresh");
    setDuckDbSummary(null);
    setError(null);
    setNotice("Started a fresh draft.");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );

    if (settings.persistDraft) {
      await saveDraftSession(
        createSavedSession({
          text: "",
          activeCategory: "all",
          customWords,
          settings,
          source: "fresh",
        }),
      );
    }
  };

  const onImportButtonClick = () => {
    importInputRef.current?.click();
  };

  const onImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    await handleImportedFiles(files);
  };

  const handleImportedFiles = async (files: File[]) => {
    try {
      const payload = await importFiles(files);
      applyImportedPayload(payload.session, payload.text, payload.source);
      setNotice(payload.notice);
      setError(null);
    } catch (importError) {
      setError(messageOf(importError));
    }
  };

  const applyImportedPayload = (
    session: SavedSession | null,
    importedText: string,
    source: string,
  ) => {
    if (session) {
      setText(session.text);
      setActiveCategory(session.activeCategory);
      setCustomWords(session.customWords);
      setSettings(normalizeSettings(session.settings));
      setInputSource(source);
      return;
    }

    setText(importedText);
    setInputSource(source);
  };

  const importFromClipboard = async () => {
    try {
      const payload = await importClipboardText();
      applyImportedPayload(payload.session, payload.text, payload.source);
      setNotice(payload.notice);
      setError(null);
    } catch (clipboardError) {
      setError(messageOf(clipboardError));
    }
  };

  const copySummary = async () => {
    if (!analysis) {
      setError("There is no analysis to copy yet. Run a pass first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(buildSummaryText(analysis, settings));
      setNotice("Copied a local analysis summary.");
      setError(null);
    } catch {
      setError(
        "Summary could not be copied. The browser blocked clipboard write access; export JSON instead.",
      );
    }
  };

  const copyShareLink = async () => {
    try {
      const encoded = encodeShareHash(currentSession);

      if (encoded.length > 4000) {
        throw new Error(
          "This draft is too large for a shareable URL. Export a session JSON file instead.",
        );
      }

      const url = new URL(window.location.href);
      url.hash = `share=${encoded}`;
      await navigator.clipboard.writeText(url.toString());
      window.history.replaceState(null, "", url);
      setNotice("Copied a shareable local session URL.");
      setError(null);
    } catch (shareError) {
      setError(messageOf(shareError));
    }
  };

  const exportSession = () => {
    downloadTextFile(
      "local-proofreader-session.json",
      serializeSavedSession(currentSession),
      "application/json",
    );
    setNotice("Downloaded the saved session file.");
  };

  const exportAnalysis = () => {
    if (!analysis) {
      setError("There is no analysis to export yet. Run a pass first.");
      return;
    }

    downloadTextFile(
      "local-proofreader-analysis.json",
      serializeAnalysisExport(currentSession, analysis),
      "application/json",
    );
    setNotice("Downloaded the analysis JSON file.");
  };

  const exportText = () => {
    downloadTextFile("local-proofreader-draft.txt", text, "text/plain");
    setNotice("Downloaded the corrected draft text.");
  };

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDropActive(true);
  };

  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDropActive(false);
  };

  const onDrop = async (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDropActive(false);
    const files = Array.from(event.dataTransfer.files ?? []);

    if (files.length === 0) {
      setError(
        "Drop one or more files to import them. For web pages, drop an exported HTML file or paste text into the editor.",
      );
      return;
    }

    await handleImportedFiles(files);
  };

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="appShell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local-only writing assistance</p>
          <h1>Local Proofreader</h1>
        </div>
        <nav aria-label="Project links" className="linkCluster">
          <a href="https://github.com/baditaflorin/local-proofreader">
            <GitFork aria-hidden="true" size={18} />
            GitHub
          </a>
          <a href="https://www.paypal.com/paypalme/florinbadita">
            <Heart aria-hidden="true" size={18} />
            PayPal
          </a>
        </nav>
      </header>

      <section className="statusBand" aria-label="Local privacy status">
        <div>
          <ShieldCheck aria-hidden="true" />
          <span>Drafts stay in this browser</span>
        </div>
        <div>
          <BookOpenCheck aria-hidden="true" />
          <span>
            {analysis?.engine.spellcheckerReady
              ? `${analysis.engine.dictionaryWords.toLocaleString()} Hunspell entries`
              : "Dictionary loading locally"}
          </span>
        </div>
        <div>
          <Sparkles aria-hidden="true" />
          <span>
            {analysis
              ? `${analysis.document.label} · ${visibleSuggestions.length} visible suggestions`
              : "Ready"}
          </span>
        </div>
        <div>
          <Upload aria-hidden="true" />
          <span>Source: {inputSource}</span>
        </div>
      </section>

      <section className="controlGrid" aria-label="Input, output, and settings">
        <div className="controlCard">
          <div className="controlHeader">
            <h2>Bring your draft</h2>
            <p>
              Type, paste, drop files, import a saved session, or read from the
              clipboard.
            </p>
          </div>
          <div className="controlActions">
            <button type="button" onClick={loadSample}>
              <RefreshCw aria-hidden="true" size={16} />
              Sample
            </button>
            <button type="button" onClick={onImportButtonClick}>
              <Upload aria-hidden="true" size={16} />
              Import files
            </button>
            <button type="button" onClick={() => void importFromClipboard()}>
              <ClipboardPaste aria-hidden="true" size={16} />
              Clipboard
            </button>
            <button type="button" onClick={() => void startFresh()}>
              <Eraser aria-hidden="true" size={16} />
              Start fresh
            </button>
          </div>
          <small>
            URL import is intentionally not built in Mode A because GitHub Pages
            cannot fetch most external pages through browser CORS.
          </small>
          <input
            ref={importInputRef}
            hidden
            multiple
            type="file"
            accept=".txt,.md,.markdown,.html,.htm,.json,text/plain,text/markdown,text/html,application/json"
            onChange={(event) => void onImportChange(event)}
          />
        </div>

        <div className="controlCard">
          <div className="controlHeader">
            <h2>Take work out</h2>
            <p>
              Export the corrected text, the full analysis, or a versioned
              session you can restore later.
            </p>
          </div>
          <div className="controlActions">
            <button type="button" onClick={() => void copySummary()}>
              <Copy aria-hidden="true" size={16} />
              Copy summary
            </button>
            <button type="button" onClick={exportText}>
              <Download aria-hidden="true" size={16} />
              Draft text
            </button>
            <button type="button" onClick={exportAnalysis}>
              <Download aria-hidden="true" size={16} />
              Analysis JSON
            </button>
            <button type="button" onClick={exportSession}>
              <Download aria-hidden="true" size={16} />
              Session JSON
            </button>
            <button type="button" onClick={() => void copyShareLink()}>
              <Copy aria-hidden="true" size={16} />
              Share URL
            </button>
          </div>
        </div>

        <div className="controlCard">
          <div className="controlHeader">
            <h2>Settings</h2>
            <p>Every toggle changes actual behavior and is stored locally.</p>
          </div>
          <div className="settingsGrid">
            <SettingToggle
              checked={settings.autoAnalyze}
              label="Auto analyze"
              onChange={(checked) => updateSetting("autoAnalyze", checked)}
            />
            <SettingToggle
              checked={settings.includeRewrite}
              label="Show rewrite suggestions"
              onChange={(checked) => updateSetting("includeRewrite", checked)}
            />
            <SettingToggle
              checked={settings.persistDraft}
              label="Save draft locally"
              onChange={(checked) => updateSetting("persistDraft", checked)}
            />
            <SettingToggle
              checked={settings.restoreSession}
              label="Restore last draft"
              onChange={(checked) => updateSetting("restoreSession", checked)}
            />
            <SettingToggle
              checked={settings.showConfidence}
              label="Show confidence"
              onChange={(checked) => updateSetting("showConfidence", checked)}
            />
            <SettingToggle
              checked={settings.showDebugPanel}
              label="Show debug panel"
              onChange={(checked) => updateSetting("showDebugPanel", checked)}
            />
          </div>
        </div>
      </section>

      {error ? (
        <div className="errorBox" role="alert">
          <AlertCircle aria-hidden="true" />
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="noticeBox" role="status">
          <Settings2 aria-hidden="true" />
          {notice}
        </div>
      ) : null}

      <section className="workspace" aria-label="Proofreader workspace">
        <div
          className={`editorPane${isDropActive ? " dropActive" : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={(event) => void onDrop(event)}
        >
          <div className="paneHeader">
            <div>
              <h2>Editor</h2>
              <p>
                Grammar, spelling, style, and rewrite checks run in a worker.
              </p>
            </div>
            <button
              type="button"
              onClick={isAnalyzing ? cancelAnalysis : () => void analyze()}
              aria-label={isAnalyzing ? "Cancel analysis" : "Analyze draft"}
            >
              {isAnalyzing ? (
                <LoaderCircle className="spin" aria-hidden="true" size={18} />
              ) : (
                <RefreshCw aria-hidden="true" size={18} />
              )}
              {isAnalyzing ? "Cancel" : "Analyze"}
            </button>
          </div>
          <textarea
            aria-label="Draft text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
            placeholder="Paste text, drop a file, or import a saved session."
          />
          <div className="statsGrid" aria-label="Document stats">
            <Metric label="Words" value={analysis?.stats.words ?? 0} />
            <Metric label="Sentences" value={analysis?.stats.sentences ?? 0} />
            <Metric
              label="Read time"
              value={`${analysis?.stats.readingTimeMinutes ?? 0} min`}
            />
            <Metric label="Last save" value={lastSavedAt ?? "local"} />
          </div>
        </div>

        <aside className="suggestionPane">
          <div className="paneHeader">
            <div>
              <h2>Suggestions</h2>
              <p>
                Apply fixes, keep only the categories you want, or teach the
                local dictionary new words.
              </p>
            </div>
          </div>

          <div className="filters" aria-label="Suggestion filters">
            <FilterButton
              label="All"
              count={counts.all}
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            />
            {Object.entries(categoryLabels).map(([category, label]) => (
              <FilterButton
                key={category}
                label={label}
                count={counts[category as keyof typeof categoryLabels]}
                active={activeCategory === category}
                onClick={() =>
                  setActiveCategory(category as ActiveSuggestionFilter)
                }
              />
            ))}
          </div>

          <div className="suggestionList">
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((suggestion) => (
                <article className="suggestionCard" key={suggestion.id}>
                  <div className="suggestionTitle">
                    <span data-category={suggestion.category}>
                      {categoryLabels[suggestion.category]}
                    </span>
                    <strong>{suggestion.title}</strong>
                    {suggestion.occurrences && suggestion.occurrences > 1 ? (
                      <em>{suggestion.occurrences} times</em>
                    ) : null}
                  </div>
                  <p>{suggestion.message}</p>
                  <blockquote>
                    {suggestion.original || "End of document"}
                  </blockquote>
                  <div className="suggestionActions">
                    {suggestion.replacements.slice(0, 3).map((replacement) => (
                      <button
                        type="button"
                        key={replacement}
                        onClick={() => applySuggestion(suggestion, replacement)}
                      >
                        <Check aria-hidden="true" size={16} />
                        {replacement || "Remove"}
                      </button>
                    ))}
                    {suggestion.category === "spelling" ? (
                      <button
                        type="button"
                        onClick={() => void addWord(suggestion.original)}
                      >
                        Add word
                      </button>
                    ) : null}
                  </div>
                  {settings.showConfidence ? (
                    <>
                      <small>
                        {suggestion.source} ·{" "}
                        {Math.round(suggestion.confidence * 100)}%
                      </small>
                      <small>Why: {suggestion.reason}</small>
                    </>
                  ) : (
                    <small>{suggestion.source}</small>
                  )}
                </article>
              ))
            ) : (
              <div className="emptyState">
                <Wand2 aria-hidden="true" />
                <p>{emptyStateMessage(analysis, uiState)}</p>
              </div>
            )}
          </div>

          <div className="dictionaryPanel">
            <div className="dictionaryHeader">
              <h3>Local dictionary</h3>
              <button type="button" onClick={() => void resetDictionary()}>
                <Trash2 aria-hidden="true" size={14} />
                Clear
              </button>
            </div>
            {customWords.length > 0 ? (
              <div className="dictionaryList">
                {customWords.map((word) => (
                  <button
                    type="button"
                    key={word}
                    onClick={() => void deleteWord(word)}
                  >
                    {word}
                    <Trash2 aria-hidden="true" size={12} />
                  </button>
                ))}
              </div>
            ) : (
              <small>No custom words saved yet.</small>
            )}
          </div>
        </aside>
      </section>

      {debugEnabled && analysis ? (
        <details className="debugPanel">
          <summary>Debug metadata</summary>
          <pre>
            {JSON.stringify(
              {
                uiState,
                source: inputSource,
                stats: analysis.stats,
                document: analysis.document,
                zones: analysis.zones.map((zone) => ({
                  kind: zone.kind,
                  confidence: zone.confidence,
                  reason: zone.reason,
                  start: zone.start,
                  end: zone.end,
                })),
                anomalies: analysis.anomalies,
                provenance: analysis.provenance,
              },
              null,
              2,
            )}
          </pre>
        </details>
      ) : null}

      <section className="labBand" aria-label="Local analysis report">
        <div>
          <h2>Local SQL Report</h2>
          <p>
            Build a local aggregate from IndexedDB history with DuckDB-WASM.
            Text is not included in the report.
          </p>
        </div>
        <div className="controlActions">
          <button
            type="button"
            onClick={() => void buildReport()}
            disabled={isBuildingReport}
          >
            {isBuildingReport ? (
              <LoaderCircle className="spin" aria-hidden="true" size={18} />
            ) : (
              <Database aria-hidden="true" size={18} />
            )}
            Build report
          </button>
          <button type="button" onClick={() => void clearHistory()}>
            <Trash2 aria-hidden="true" size={16} />
            Clear history
          </button>
        </div>
        {duckDbSummary ? (
          <div className="reportGrid">
            <Metric label="Mode" value={duckDbSummary.mode} />
            <Metric label="Runs" value={duckDbSummary.totalRuns} />
            <Metric
              label="Suggestions"
              value={duckDbSummary.totalSuggestions}
            />
            <Metric label="Top category" value={duckDbSummary.topCategory} />
          </div>
        ) : null}
      </section>

      <footer>
        <span>
          Version {appVersion} · commit{" "}
          {shortCommit(versionQuery.data?.commit ?? "loading")}
        </span>
        <span>
          Repository: https://github.com/baditaflorin/local-proofreader
        </span>
      </footer>
    </main>
  );
}

interface MetricProps {
  label: string;
  value: string | number;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}

function FilterButton({ active, count, label, onClick }: FilterButtonProps) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}>
      {label}
      <span>{count}</span>
    </button>
  );
}

interface SettingToggleProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

function SettingToggle({ checked, label, onChange }: SettingToggleProps) {
  return (
    <label className="settingToggle">
      <input
        checked={checked}
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function emptyStateMessage(
  analysis: AnalysisResult | null,
  uiState: UiState,
): string {
  if (uiState === "cancelled") {
    return "Analysis cancelled. Your previous result is still here.";
  }

  if (!analysis) {
    return "Run a local pass to begin.";
  }

  if (analysis.stats.state === "loaded-empty") {
    return "Empty draft. Paste, type, or import prose to analyze.";
  }

  if (analysis.stats.state === "loaded-no-issues") {
    return "No issues found in the detected prose zones.";
  }

  return "No suggestions in this filter.";
}

function downloadTextFile(
  fileName: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong, but your draft is still in the editor.";
}

function formatClockTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortCommit(commit: string): string {
  return commit === "loading" ? commit : commit.slice(0, 7);
}

export default App;
