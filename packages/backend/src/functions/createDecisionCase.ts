import { DecisionService } from '../services/decision.service.js';
import { TriFactorRetrievalService } from '../services/triFactorRetrieval.service.js';

export interface CallableContext {
  auth?: {
    uid: string;
    token?: any;
  };
}

export interface CreateCaseRequest {
  rawText?: string;
  rawAudioBase64?: string;
  rawAudioPath?: string;
  mimeType?: string;
  eraId?: string;
}

/**
 * Callable function: createDecisionCase
 * Strictly isolated per user: requires authenticated uid.
 * Accepts raw text or audio stream (Tier 1 Model 3.5 Transcribe -> Raw Freeze -> Tier 2 Model 3.6 Cognitive).
 */
export async function createDecisionCaseHandler(
  data: CreateCaseRequest,
  context: CallableContext,
  decisionService: DecisionService = new DecisionService(),
  _retrievalService: TriFactorRetrievalService = new TriFactorRetrievalService()
) {
  if (!context.auth || !context.auth.uid) {
    throw new Error('UNAUTHENTICATED: User must be signed in to create a decision case.');
  }

  const userId = context.auth.uid;
  const hasText = data.rawText && data.rawText.trim().length > 0;
  const hasAudio = data.rawAudioBase64 && data.rawAudioBase64.length > 0;

  if (!hasText && !hasAudio) {
    throw new Error('INVALID_ARGUMENT: Either rawText or rawAudioBase64 must be provided.');
  }

  const rawAudioBuffer = hasAudio ? Buffer.from(data.rawAudioBase64!, 'base64') : undefined;

  // 1. Create canonical frozen case and extract epistemic schema
  const session = await decisionService.createCase({
    userId,
    rawText: data.rawText,
    rawAudioBuffer,
    rawAudioPath: data.rawAudioPath,
    mimeType: data.mimeType || 'audio/mp3',
    eraId: data.eraId
  });

  return {
    success: true,
    caseId: session.decisionCase.id,
    decisionCase: session.decisionCase,
    statements: session.statements,
    options: session.options,
    signature: session.signature,
    illuminationQuestion: session.illuminationQuestion,
    epistemicState: session.epistemicState,
    bespokeQuestion: session.bespokeQuestion,
    historicalQuestion: session.historicalQuestion
  };
}
