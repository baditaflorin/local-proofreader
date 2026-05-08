import type { AnalysisRequest, AnalysisResult } from '../../shared/types'

export interface ProofreaderService {
  analyze(request: AnalysisRequest): Promise<AnalysisResult>
}
