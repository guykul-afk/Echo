import { CallableContext } from './createDecisionCase.js';
import { DecisionService } from '../services/decision.service.js';

export interface RecordMirrorFeedbackRequest {
  caseId: string;
  feedback: 'accurate' | 'inaccurate';
}

/**
 * Callable function: recordMirrorFeedback
 * Records immediate feedback on the First 20 Seconds Mirror (מדויק / לא בדיוק).
 */
export async function recordMirrorFeedbackHandler(
  data: RecordMirrorFeedbackRequest,
  context: CallableContext,
  decisionService: DecisionService = new DecisionService()
) {
  if (!context.auth || !context.auth.uid) {
    throw new Error('UNAUTHENTICATED: User must be signed in.');
  }

  if (!data.caseId) {
    throw new Error('INVALID_ARGUMENT: caseId is required.');
  }

  if (data.feedback !== 'accurate' && data.feedback !== 'inaccurate') {
    throw new Error("INVALID_ARGUMENT: feedback must be either 'accurate' or 'inaccurate'.");
  }

  const updatedCase = await decisionService.recordMirrorFeedback(data.caseId, data.feedback, context.auth.uid);

  return {
    success: true,
    caseId: updatedCase.id,
    mirrorFeedback: updatedCase.mirrorFeedback
  };
}
