import { expose } from "comlink";
import type { AnalysisRequest } from "../../../shared/types";
import type { ProofreaderService } from "../service";
import { analyzeText } from "../analyzer";

const service: ProofreaderService = {
  analyze(request: AnalysisRequest) {
    return analyzeText(request);
  },
};

expose(service);
