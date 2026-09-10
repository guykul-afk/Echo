import { RetrievalBeforeAskService } from '../services/retrievalBeforeAsk.service.js';
import { DeepDecisionMechanisms } from '@echo/shared';
import { CallableContext } from './createDecisionCase.js';

export interface RetrievePrecedentsRequest {
  rawText: string;
  consideration: string;
  deepMechanisms?: DeepDecisionMechanisms;
}

export async function retrievePrecedentsHandler(
  data: RetrievePrecedentsRequest,
  context: CallableContext,
  retrievalService: RetrievalBeforeAskService = new RetrievalBeforeAskService()
) {
  if (!context.auth || !context.auth.uid) {
    throw new Error('UNAUTHENTICATED: User must be signed in.');
  }

  const result = await retrievalService.checkBeforeAsk(
    context.auth.uid,
    data.consideration,
    data.rawText,
    data.deepMechanisms
  );

  return {
    success: true,
    result
  };
}
