import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  BookOpenCheck,
  Check,
  Database,
  GitFork,
  Heart,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react'
import './App.css'
import type { AnalysisResult, Suggestion } from './shared/types'
import { createProofreaderClient, type ProofreaderClient } from './features/proofreader/worker/client'
import {
  addCustomWord,
  getCustomWords,
  listAnalysisSnapshots,
  saveAnalysisSnapshot,
} from './features/storage/localStore'
import { buildDuckDbSummary, type DuckDbSummary } from './features/storage/duckdbSummary'
import { fetchVersionInfo } from './features/version/version'

const sampleText =
  "this are a very rough draft that could of been shipped faster. The team will utilize synergy to make make the product more best-in-class, but alot of users are worried about privacy and their writting being sent away"

const categoryLabels = {
  grammar: 'Grammar',
  spelling: 'Spelling',
  style: 'Style',
  rewrite: 'Rewrite',
} as const

function App() {
  const clientRef = useRef<ProofreaderClient | null>(null)
  const [text, setText] = useState(sampleText)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [customWords, setCustomWords] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<'all' | Suggestion['category']>('all')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [duckDbSummary, setDuckDbSummary] = useState<DuckDbSummary | null>(null)
  const [isBuildingReport, setIsBuildingReport] = useState(false)

  const versionQuery = useQuery({
    queryKey: ['version'],
    queryFn: fetchVersionInfo,
    staleTime: Number.POSITIVE_INFINITY,
  })

  useEffect(() => {
    clientRef.current = createProofreaderClient()
    void getCustomWords().then(setCustomWords).catch(() => setCustomWords([]))

    return () => clientRef.current?.dispose()
  }, [])

  const analyze = useCallback(async () => {
    const client = clientRef.current

    if (!client) {
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const result = await client.analyze({
        text,
        basePath: import.meta.env.BASE_URL,
        customWords,
      })
      setAnalysis(result)
      await saveAnalysisSnapshot(text, result)
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setError('The local proofreader could not finish this pass. Your draft was not sent anywhere.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [customWords, text])

  useEffect(() => {
    void analyze()
  }, [analyze])

  const filteredSuggestions = useMemo(() => {
    if (!analysis) {
      return []
    }

    if (activeCategory === 'all') {
      return analysis.suggestions
    }

    return analysis.suggestions.filter((suggestion) => suggestion.category === activeCategory)
  }, [activeCategory, analysis])

  const counts = useMemo(() => {
    const suggestions = analysis?.suggestions ?? []

    return {
      all: suggestions.length,
      grammar: suggestions.filter((suggestion) => suggestion.category === 'grammar').length,
      spelling: suggestions.filter((suggestion) => suggestion.category === 'spelling').length,
      style: suggestions.filter((suggestion) => suggestion.category === 'style').length,
      rewrite: suggestions.filter((suggestion) => suggestion.category === 'rewrite').length,
    }
  }, [analysis])

  const applySuggestion = (suggestion: Suggestion, replacement: string) => {
    setText((current) =>
      `${current.slice(0, suggestion.start)}${replacement}${current.slice(suggestion.end)}`,
    )
  }

  const addWord = async (word: string) => {
    await addCustomWord(word)
    setCustomWords(await getCustomWords())
  }

  const buildReport = async () => {
    setIsBuildingReport(true)
    setError(null)

    try {
      const snapshots = await listAnalysisSnapshots()
      setDuckDbSummary(await buildDuckDbSummary(snapshots))
    } catch {
      setError('The local SQL report could not be built from IndexedDB history.')
    } finally {
      setIsBuildingReport(false)
    }
  }

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
              : 'Dictionary loading locally'}
          </span>
        </div>
        <div>
          <Sparkles aria-hidden="true" />
          <span>{analysis ? `${analysis.suggestions.length} suggestions` : 'Ready'}</span>
        </div>
      </section>

      <section className="workspace" aria-label="Proofreader workspace">
        <div className="editorPane">
          <div className="paneHeader">
            <div>
              <h2>Editor</h2>
              <p>Grammar, spelling, style, and rewrite checks run in a worker.</p>
            </div>
            <button type="button" onClick={analyze} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <LoaderCircle className="spin" aria-hidden="true" size={18} />
              ) : (
                <RefreshCw aria-hidden="true" size={18} />
              )}
              Analyze
            </button>
          </div>
          <textarea
            aria-label="Draft text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
          />
          <div className="statsGrid" aria-label="Document stats">
            <Metric label="Words" value={analysis?.stats.words ?? 0} />
            <Metric label="Sentences" value={analysis?.stats.sentences ?? 0} />
            <Metric label="Read time" value={`${analysis?.stats.readingTimeMinutes ?? 1} min`} />
            <Metric label="Last save" value={lastSavedAt ?? 'local'} />
          </div>
        </div>

        <aside className="suggestionPane">
          <div className="paneHeader">
            <div>
              <h2>Suggestions</h2>
              <p>Apply, ignore, or add spellings to your local dictionary.</p>
            </div>
          </div>

          <div className="filters" aria-label="Suggestion filters">
            <FilterButton
              label="All"
              count={counts.all}
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
            />
            {Object.entries(categoryLabels).map(([category, label]) => (
              <FilterButton
                key={category}
                label={label}
                count={counts[category as keyof typeof categoryLabels]}
                active={activeCategory === category}
                onClick={() => setActiveCategory(category as Suggestion['category'])}
              />
            ))}
          </div>

          {error ? (
            <div className="errorBox" role="alert">
              <AlertCircle aria-hidden="true" />
              {error}
            </div>
          ) : null}

          <div className="suggestionList">
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((suggestion) => (
                <article className="suggestionCard" key={suggestion.id}>
                  <div className="suggestionTitle">
                    <span data-category={suggestion.category}>
                      {categoryLabels[suggestion.category]}
                    </span>
                    <strong>{suggestion.title}</strong>
                  </div>
                  <p>{suggestion.message}</p>
                  <blockquote>{suggestion.original || 'End of document'}</blockquote>
                  <div className="suggestionActions">
                    {suggestion.replacements.slice(0, 3).map((replacement) => (
                      <button
                        type="button"
                        key={replacement}
                        onClick={() => applySuggestion(suggestion, replacement)}
                      >
                        <Check aria-hidden="true" size={16} />
                        {replacement || 'Remove'}
                      </button>
                    ))}
                    {suggestion.category === 'spelling' ? (
                      <button type="button" onClick={() => void addWord(suggestion.original)}>
                        Add word
                      </button>
                    ) : null}
                  </div>
                  <small>
                    {suggestion.source} · {Math.round(suggestion.confidence * 100)}%
                  </small>
                </article>
              ))
            ) : (
              <div className="emptyState">
                <Wand2 aria-hidden="true" />
                <p>{analysis ? 'No suggestions in this filter.' : 'Run a local pass to begin.'}</p>
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="labBand" aria-label="Local analysis report">
        <div>
          <h2>Local SQL Report</h2>
          <p>
            Build a local aggregate from IndexedDB history with DuckDB-WASM. Text is not included in
            the report.
          </p>
        </div>
        <button type="button" onClick={buildReport} disabled={isBuildingReport}>
          {isBuildingReport ? (
            <LoaderCircle className="spin" aria-hidden="true" size={18} />
          ) : (
            <Database aria-hidden="true" size={18} />
          )}
          Build report
        </button>
        {duckDbSummary ? (
          <div className="reportGrid">
            <Metric label="Mode" value={duckDbSummary.mode} />
            <Metric label="Runs" value={duckDbSummary.totalRuns} />
            <Metric label="Suggestions" value={duckDbSummary.totalSuggestions} />
            <Metric label="Top category" value={duckDbSummary.topCategory} />
          </div>
        ) : null}
      </section>

      <footer>
        <span>
          Version {versionQuery.data?.version ?? 'v0.1.0'} · commit{' '}
          {versionQuery.data?.commit ?? 'loading'}
        </span>
        <span>Repository: https://github.com/baditaflorin/local-proofreader</span>
      </footer>
    </main>
  )
}

interface MetricProps {
  label: string
  value: string | number
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

interface FilterButtonProps {
  active: boolean
  count: number
  label: string
  onClick: () => void
}

function FilterButton({ active, count, label, onClick }: FilterButtonProps) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}>
      {label}
      <span>{count}</span>
    </button>
  )
}

export default App
