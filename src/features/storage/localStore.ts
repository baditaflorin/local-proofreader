import { openDB } from 'idb'
import type { AnalysisResult, AnalysisSnapshot } from '../../shared/types'

const dbPromise = openDB('local-proofreader', 1, {
  upgrade(db) {
    db.createObjectStore('dictionary', { keyPath: 'word' })
    db.createObjectStore('analyses', { keyPath: 'id' })
    db.createObjectStore('settings', { keyPath: 'key' })
  },
})

export async function getCustomWords(): Promise<string[]> {
  const db = await dbPromise
  const rows = (await db.getAll('dictionary')) as Array<{ word: string }>

  return rows.map((row) => row.word).sort()
}

export async function addCustomWord(word: string): Promise<void> {
  const normalized = word.toLowerCase().trim()

  if (!normalized) {
    return
  }

  const db = await dbPromise
  await db.put('dictionary', { word: normalized, addedAt: new Date().toISOString() })
}

export async function saveAnalysisSnapshot(
  text: string,
  result: AnalysisResult,
): Promise<AnalysisSnapshot> {
  const snapshot: AnalysisSnapshot = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    textHash: await hashText(text),
    wordCount: result.stats.words,
    suggestionCount: result.suggestions.length,
    grammarCount: countByCategory(result, 'grammar'),
    spellingCount: countByCategory(result, 'spelling'),
    styleCount: countByCategory(result, 'style'),
    rewriteCount: countByCategory(result, 'rewrite'),
  }

  const db = await dbPromise
  await db.put('analyses', snapshot)

  return snapshot
}

export async function listAnalysisSnapshots(): Promise<AnalysisSnapshot[]> {
  const db = await dbPromise
  const rows = (await db.getAll('analyses')) as AnalysisSnapshot[]

  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50)
}

function countByCategory(result: AnalysisResult, category: string): number {
  return result.suggestions.filter((suggestion) => suggestion.category === category).length
}

async function hashText(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return hash.slice(0, 16)
}
