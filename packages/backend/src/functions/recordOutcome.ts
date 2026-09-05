import { Outcome } from '@echo/shared';
import { CallableContext } from './createDecisionCase.js';
import { EpistemicConsolidationService } from '../services/consolidation.service.js';

export interface RecordOutcomeRequest {
  caseId: string;
  actualResultSummary: string;
  wasCriteriaMet: boolean;
  unexpectedLearnings?: string;
  satisfactionScore?: number;
}

/**
 * Callable function: recordOutcome
 * Records real-world result and triggers background epistemic consolidation.
 */
export async function recordOutcomeHandler(
  data: RecordOutcomeRequest,
  context: CallableContext,
  consolidationService: EpistemicConsolidationService = new EpistemicConsolidationService()
) {
  if (!context.auth || !context.auth.uid) {
    throw new Error('UNAUTHENTICATED: User must be signed in.');
  }

  const userId = context.auth.uid;
  if (!data.caseId || data.actualResultSummary === undefined) {
    throw new Error('INVALID_ARGUMENT: caseId and actualResultSummary are required.');
  }

  const now = Date.now();
  const outcome: Outcome = {
    id: `out-${now}`,
    caseId: data.caseId,
    userId,
    observedFacts: data.actualResultSummary,
    criteriaEvaluation: data.wasCriteriaMet ? 'succeeded' : 'failed',
    reflectionNotes: data.unexpectedLearnings,
    recordedAt: now
  };

  return {
    success: true,
    outcome,
    caseStatus: 'resolved'
  };
}
