import { Outcome, QuickLoopStatus } from '@echo/shared';
import { CallableContext } from './createDecisionCase.js';

export interface RecordOutcomeRequest {
  caseId: string;
  whatHappened?: string;
  assumptionClarification?: string;
  processReflection?: string;
  quickStatus?: QuickLoopStatus;

  // Backward compatibility
  actualResultSummary?: string;
  wasCriteriaMet?: boolean;
  unexpectedLearnings?: string;
}

/**
 * Callable function: recordOutcome
 * Records 3-axis continuous learning reflection.
 */
export async function recordOutcomeHandler(
  data: RecordOutcomeRequest,
  context: CallableContext
) {
  if (!context.auth || !context.auth.uid) {
    throw new Error('UNAUTHENTICATED: User must be signed in.');
  }

  const userId = context.auth.uid;
  if (!data.caseId) {
    throw new Error('INVALID_ARGUMENT: caseId is required.');
  }

  const whatHappened = data.whatHappened || data.actualResultSummary || 'עודכנה התקדמות בהבנה';
  const assumptionClarification = data.assumptionClarification || data.unexpectedLearnings || '';
  const processReflection = data.processReflection || '';

  const now = Date.now();
  const outcome: Outcome = {
    id: `out-${now}`,
    caseId: data.caseId,
    userId,
    whatHappened,
    assumptionClarification,
    processReflection,
    quickStatus: data.quickStatus,
    observedFacts: whatHappened,
    criteriaEvaluation: data.wasCriteriaMet ? 'succeeded' : 'partially_succeeded',
    reflectionNotes: assumptionClarification,
    recordedAt: now
  };

  return {
    success: true,
    outcome,
    caseStatus: 'resolved'
  };
}
