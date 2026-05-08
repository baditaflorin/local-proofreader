import type { AnalysisSnapshot } from '../../shared/types'

export interface DuckDbSummary {
  mode: 'duckdb-wasm' | 'fallback'
  totalRuns: number
  totalSuggestions: number
  averageSuggestions: number
  topCategory: string
}

export async function buildDuckDbSummary(
  snapshots: AnalysisSnapshot[],
): Promise<DuckDbSummary> {
  if (snapshots.length === 0) {
    return {
      mode: 'fallback',
      totalRuns: 0,
      totalSuggestions: 0,
      averageSuggestions: 0,
      topCategory: 'none',
    }
  }

  try {
    return await buildWithDuckDb(snapshots)
  } catch {
    return buildFallbackSummary(snapshots)
  }
}

async function buildWithDuckDb(snapshots: AnalysisSnapshot[]): Promise<DuckDbSummary> {
  const duckdb = await import('@duckdb/duckdb-wasm')
  const duckdbWasm = await import('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url')
  const mvpWorker = await import('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url')

  const bundles = {
    mvp: {
      mainModule: duckdbWasm.default,
      mainWorker: mvpWorker.default,
    },
  }
  const bundle = await duckdb.selectBundle(bundles)
  if (!bundle.mainWorker) {
    throw new Error('DuckDB worker bundle is unavailable.')
  }
  const worker = new Worker(bundle.mainWorker)
  const logger = new duckdb.VoidLogger()
  const db = new duckdb.AsyncDuckDB(logger, worker)

  try {
    await db.instantiate(bundle.mainModule)
    const connection = await db.connect()
    const csv = toCsv(snapshots)

    await db.registerFileText('analyses.csv', csv)
    await connection.query(
      "CREATE TABLE analyses AS SELECT * FROM read_csv_auto('analyses.csv', HEADER = TRUE)",
    )
    const total = await connection.query(
      'SELECT count(*)::INT AS runs, sum(suggestionCount)::INT AS suggestions, avg(suggestionCount)::DOUBLE AS averageSuggestions FROM analyses',
    )
    const categories = await connection.query(`
      SELECT category, sum(total)::INT AS total
      FROM (
        SELECT 'grammar' AS category, sum(grammarCount) AS total FROM analyses
        UNION ALL SELECT 'spelling', sum(spellingCount) FROM analyses
        UNION ALL SELECT 'style', sum(styleCount) FROM analyses
        UNION ALL SELECT 'rewrite', sum(rewriteCount) FROM analyses
      )
      GROUP BY category
      ORDER BY total DESC
      LIMIT 1
    `)
    const totalRow = total.toArray()[0]?.toJSON() as
      | { runs: number; suggestions: number; averageSuggestions: number }
      | undefined
    const categoryRow = categories.toArray()[0]?.toJSON() as
      | { category: string; total: number }
      | undefined

    await connection.close()

    return {
      mode: 'duckdb-wasm',
      totalRuns: totalRow?.runs ?? snapshots.length,
      totalSuggestions: totalRow?.suggestions ?? 0,
      averageSuggestions: Math.round((totalRow?.averageSuggestions ?? 0) * 10) / 10,
      topCategory: categoryRow?.category ?? 'none',
    }
  } finally {
    await db.terminate()
    worker.terminate()
  }
}

function buildFallbackSummary(snapshots: AnalysisSnapshot[]): DuckDbSummary {
  const totalSuggestions = snapshots.reduce(
    (sum, snapshot) => sum + snapshot.suggestionCount,
    0,
  )
  const totals = {
    grammar: snapshots.reduce((sum, snapshot) => sum + snapshot.grammarCount, 0),
    spelling: snapshots.reduce((sum, snapshot) => sum + snapshot.spellingCount, 0),
    style: snapshots.reduce((sum, snapshot) => sum + snapshot.styleCount, 0),
    rewrite: snapshots.reduce((sum, snapshot) => sum + snapshot.rewriteCount, 0),
  }
  const topCategory = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none'

  return {
    mode: 'fallback',
    totalRuns: snapshots.length,
    totalSuggestions,
    averageSuggestions: Math.round((totalSuggestions / snapshots.length) * 10) / 10,
    topCategory,
  }
}

function toCsv(snapshots: AnalysisSnapshot[]): string {
  const header =
    'id,createdAt,wordCount,suggestionCount,grammarCount,spellingCount,styleCount,rewriteCount'
  const rows = snapshots.map((snapshot) =>
    [
      snapshot.id,
      snapshot.createdAt,
      snapshot.wordCount,
      snapshot.suggestionCount,
      snapshot.grammarCount,
      snapshot.spellingCount,
      snapshot.styleCount,
      snapshot.rewriteCount,
    ].join(','),
  )

  return `${header}\n${rows.join('\n')}`
}
