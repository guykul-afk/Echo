import {
  DecisionCase,
  Statement,
  Outcome,
  AssumptionRegistryEntry,
  CalibrationTracker,
  PatternHypothesis
} from '@echo/shared';

export interface ConsolidationResult {
  updatedRegistry: AssumptionRegistryEntry[];
  updatedCalibration: CalibrationTracker;
  updatedPatterns: PatternHypothesis[];
}

export class EpistemicConsolidationService {
  static processOutcomeConsolidation(
    userId: string,
    decisionCase: DecisionCase,
    statements: Statement[],
    outcome: Outcome,
    registry: AssumptionRegistryEntry[],
    calibration: CalibrationTracker,
    patterns: PatternHypothesis[]
  ): ConsolidationResult {
    const updatedRegistry = [...registry];
    const updatedPatterns = [...patterns];

    const updatedCalibration: CalibrationTracker = {
      ...calibration,
      totalVerifiablePredictions: (calibration.totalVerifiablePredictions || 0) + 1,
      updatedAt: Date.now()
    };

    return {
      updatedRegistry,
      updatedCalibration,
      updatedPatterns
    };
  }
}
