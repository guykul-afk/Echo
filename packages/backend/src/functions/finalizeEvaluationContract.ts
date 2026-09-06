import { EvaluationContract } from '@echo/shared';
import { CallableContext } from './createDecisionCase.js';

export interface FinalizeContractRequest {
  caseId: string;
  selectedOptionId: string;
  targetCriteria: string;
  checkHorizonDays: number;
  falsificationSignal?: string;
  subjectiveConfidence?: number;
  predictedOutcome?: string;
}

/**
 * Callable function: finalizeEvaluationContract
 * Locks evaluation criteria before the outcome is known.
 */
export async function finalizeEvaluationContractHandler(
  data: FinalizeContractRequest,
  context: CallableContext
) {
  if (!context.auth || !context.auth.uid) {
    throw new Error('UNAUTHENTICATED: User must be signed in.');
  }

  const userId = context.auth.uid;
  if (!data.caseId || !data.targetCriteria) {
    throw new Error('INVALID_ARGUMENT: caseId and targetCriteria are required.');
  }

  const now = Date.now();
  const reviewDate = now + (data.checkHorizonDays || 14) * 24 * 60 * 60 * 1000;

  const contract: EvaluationContract = {
    id: `contract-${now}`,
    caseId: data.caseId,
    userId,
    targetCriteria: data.targetCriteria,
    failureSignals: data.falsificationSignal || 'קריטריון היעד לא התממש במועד הנקוב',
    reviewDate,
    triggerType: 'scheduled_date',
    isTriggered: false,
    subjectiveConfidence: data.subjectiveConfidence,
    predictedOutcome: data.predictedOutcome,
    createdAt: now
  };

  return {
    success: true,
    contract,
    status: 'contract_locked'
  };
}
