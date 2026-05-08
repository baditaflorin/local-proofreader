import { wrap, type Remote } from 'comlink'
import type { AnalysisRequest, AnalysisResult } from '../../../shared/types'
import type { ProofreaderService } from '../service'

export interface ProofreaderClient {
  analyze(request: AnalysisRequest): Promise<AnalysisResult>
  dispose(): void
}

export function createProofreaderClient(): ProofreaderClient {
  const worker = new Worker(new URL('./proofreader.worker.ts', import.meta.url), {
    type: 'module',
  })
  const service = wrap<ProofreaderService>(worker) as Remote<ProofreaderService>

  return {
    analyze(request) {
      return service.analyze(request)
    },
    dispose() {
      worker.terminate()
    },
  }
}
