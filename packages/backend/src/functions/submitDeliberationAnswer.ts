import { Statement } from '@echo/shared';
import { CallableContext } from './createDecisionCase.js';

export interface SubmitAnswerRequest {
  caseId: string;
  answerText: string;
}

/**
 * Callable function: submitDeliberationAnswer
 * Records user's answer to the single illumination question.
 */
export async function submitDeliberationAnswerHandler(
  data: SubmitAnswerRequest,
  context: CallableContext
) {
  if (!context.auth || !context.auth.uid) {
    throw new Error('UNAUTHENTICATED: User must be signed in.');
  }

  const userId = context.auth.uid;
  if (!data.caseId || !data.answerText) {
    throw new Error('INVALID_ARGUMENT: caseId and answerText are required.');
  }

  const now = Date.now();
  const statement: Statement = {
    id: `stmt-${now}-answer`,
    caseId: data.caseId,
    userId,
    text: data.answerText,
    role: 'evaluation',
    provenanceSource: 'user_verbatim',
    confidenceScore: 1.0,
    createdAt: now
  };

  return {
    success: true,
    statement
  };
}
