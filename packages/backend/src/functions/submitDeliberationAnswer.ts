import { RefinedInsight, Statement } from '@echo/shared';
import { CallableContext } from './createDecisionCase.js';
import { DecisionService } from '../services/decision.service.js';

export interface SubmitAnswerRequest {
  caseId: string;
  answerText?: string;
  skip?: boolean; // כפתור "מספיק לי לעכשיו"
}

/**
 * Callable function: submitDeliberationAnswer
 * Records user's answer (or skip) and produces immediate RefinedInsight (Before & After).
 */
export async function submitDeliberationAnswerHandler(
  data: SubmitAnswerRequest,
  context: CallableContext,
  decisionService: DecisionService = new DecisionService()
) {
  if (!context.auth || !context.auth.uid) {
    throw new Error('UNAUTHENTICATED: User must be signed in.');
  }

  const userId = context.auth.uid;
  if (!data.caseId) {
    throw new Error('INVALID_ARGUMENT: caseId is required.');
  }

  const answer = data.answerText || '';
  const result = await decisionService.submitDeliberationAnswer(data.caseId, answer, data.skip, userId);

  const now = Date.now();
  const statement: Statement = {
    id: `stmt-${now}-answer`,
    caseId: data.caseId,
    userId,
    text: data.skip ? 'המשתמש בחר לשמור ולהמשיך (מספיק לי לעכשיו)' : answer,
    role: 'evaluation',
    provenanceSource: 'user_verbatim',
    confidenceScore: 1.0,
    createdAt: now
  };

  return {
    success: true,
    statement,
    refinedInsight: result.refinedInsight,
    nextStep: result.nextStep
  };
}
