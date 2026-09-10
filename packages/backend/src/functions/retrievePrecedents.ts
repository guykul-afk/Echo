import { RetrievalBeforeAskService } from '../services/retrievalBeforeAsk.service.js';
import { FirestoreKnowledgeHydrationService } from '../services/firestoreKnowledgeHydration.service.js';
import { DeepDecisionMechanisms } from '@echo/shared';
import { CallableContext } from './createDecisionCase.js';

export interface RetrievePrecedentsRequest {
  rawText: string;
  consideration: string;
  deepMechanisms?: DeepDecisionMechanisms;
  forceRefresh?: boolean;
}

export async function retrievePrecedentsHandler(
  data: RetrievePrecedentsRequest,
  context: CallableContext,
  retrievalService: RetrievalBeforeAskService = new RetrievalBeforeAskService(),
  hydrationService: FirestoreKnowledgeHydrationService = new FirestoreKnowledgeHydrationService()
) {
  if (!context.auth || !context.auth.uid) {
    throw new Error('UNAUTHENTICATED: User must be signed in.');
  }

  const userId = context.auth.uid;

  // Hydrate user knowledge graph with real Firestore decisions & closed loops
  try {
    await hydrationService.hydrateUser(userId, data.forceRefresh);
  } catch (hydrationErr) {
    console.warn('[retrievePrecedentsHandler] Hydration notice:', hydrationErr);
  }

  const result = await retrievalService.checkBeforeAsk(
    userId,
    data.consideration,
    data.rawText,
    data.deepMechanisms
  );

  return {
    success: true,
    result
  };
}

