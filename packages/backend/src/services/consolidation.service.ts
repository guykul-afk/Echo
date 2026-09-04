import {
  Outcome,
  DecisionCase,
  Statement,
  AssumptionRegistryEntry,
  CalibrationTracker,
  PatternHypothesis
} from '@echo/shared';

export class EpistemicConsolidationService {
  /**
   * Runs the background consolidation job when a decision outcome is recorded.
   * Modifies only higher-order longitudinal assets, strictly NEVER touching the frozen source.
   */
  static processOutcomeConsolidation(
    userId: string,
    decisionCase: DecisionCase,
    statements: Statement[],
    outcome: Outcome,
    currentRegistry: AssumptionRegistryEntry[],
    currentCalibration: CalibrationTracker,
    currentPatterns: PatternHypothesis[]
  ): {
    updatedRegistry: AssumptionRegistryEntry[];
    updatedCalibration: CalibrationTracker;
    updatedPatterns: PatternHypothesis[];
    fragilityAlerts: string[];
  } {
    const fragilityAlerts: string[] = [];

    // 1. Update Assumption Registry
    const updatedRegistry = [...currentRegistry];
    const assumptions = statements.filter(s => s.role === 'assumption');

    for (const assumption of assumptions) {
      // Determine assumption family
      const familyKey = this.inferAssumptionFamily(assumption.text);
      let entry = updatedRegistry.find(r => r.assumptionFamily === familyKey);

      if (!entry) {
        entry = {
          id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId,
          assumptionFamily: familyKey,
          totalRecordedInstances: 0,
          failedInstancesCount: 0,
          fragilityRatio: 0.0
        };
        updatedRegistry.push(entry);
      }

      entry.totalRecordedInstances += 1;

      // If the outcome failed or partially succeeded, mark potential assumption fragility
      if (outcome.criteriaEvaluation === 'failed' || outcome.criteriaEvaluation === 'partially_succeeded') {
        entry.failedInstancesCount += 1;
      }

      entry.fragilityRatio = Math.round((entry.failedInstancesCount / entry.totalRecordedInstances) * 100) / 100;

      if (entry.totalRecordedInstances >= 3 && entry.fragilityRatio >= 0.6) {
        fragilityAlerts.push(
          `הנחה מסוג "${entry.assumptionFamily}" נשברה ב-${Math.round(entry.fragilityRatio * 100)}% מהמקרים שנבדקו בעברך.`
        );
      }
    }

    // 2. Update Calibration Tracker
    const updatedCalibration: CalibrationTracker = {
      ...currentCalibration,
      totalVerifiablePredictions: currentCalibration.totalVerifiablePredictions + 1,
      // Brier score: lower is better (0.0 is perfect)
      brierScore: Math.round(
        (currentCalibration.brierScore * currentCalibration.totalVerifiablePredictions +
          (outcome.criteriaEvaluation === 'succeeded' ? 0.05 : 0.4)) /
          (currentCalibration.totalVerifiablePredictions + 1) * 100
      ) / 100,
      updatedAt: Date.now()
    };

    // 3. Update Pattern Hypotheses
    const updatedPatterns = currentPatterns.map(pattern => {
      // If the case tested this pattern, update sample size
      if (!pattern.supportingCaseIds.includes(decisionCase.id) && !pattern.contradictingCaseIds.includes(decisionCase.id)) {
        const isSupporting = outcome.criteriaEvaluation === 'succeeded';
        return {
          ...pattern,
          sampleSizeN: pattern.sampleSizeN + 1,
          supportingCaseIds: isSupporting ? [...pattern.supportingCaseIds, decisionCase.id] : pattern.supportingCaseIds,
          contradictingCaseIds: !isSupporting ? [...pattern.contradictingCaseIds, decisionCase.id] : pattern.contradictingCaseIds,
          epistemicStatus: (pattern.sampleSizeN + 1 >= 3 ? 'supported' : 'emerging') as any,
          updatedAt: Date.now()
        };
      }
      return pattern;
    });

    return {
      updatedRegistry,
      updatedCalibration,
      updatedPatterns,
      fragilityAlerts
    };
  }

  private static inferAssumptionFamily(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('לקוח') || lower.includes('תשלום') || lower.includes('הכנסה') || lower.includes('paid')) {
      return 'customer_paid_conversion';
    }
    if (lower.includes('רכש') || lower.includes('זמן') || lower.includes('procurement') || lower.includes('חודש')) {
      return 'procurement_and_timeline_speed';
    }
    if (lower.includes('עובד') || lower.includes('מועמד') || lower.includes('גיוס') || lower.includes('hire')) {
      return 'senior_hiring_impact';
    }
    return 'general_execution_assumptions';
  }
}
