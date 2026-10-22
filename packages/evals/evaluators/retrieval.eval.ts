import { TriFactorRetrievalService } from '@echo/backend/dist/services/triFactorRetrieval.service.js';
import { DecisionSignature, OperatingContext } from '@echo/shared';

export interface RetrievalEvalResult {
  passed: boolean;
  score: number;
  pairId: string;
  relevanceScore: number;
  strength: 'weak' | 'partial' | 'strong';
  reason: string;
  spuriousCollisionAvoided: boolean;
}

export class RetrievalEvaluator {
  static evaluatePair(
    pairId: string,
    sigA: DecisionSignature,
    sigB: DecisionSignature,
    eraA?: OperatingContext,
    eraB?: OperatingContext,
    semanticCosineSimilarity: number = 0.4
  ): RetrievalEvalResult {
    const result = TriFactorRetrievalService.calculateRelevance(
      sigA,
      sigB,
      eraA,
      eraB,
      semanticCosineSimilarity
    );

    // If it's a spurious collision test case, the strength MUST NOT be 'strong', and relevanceScore should remain bounded
    const spuriousCollisionAvoided = result.strength !== 'strong' && result.score < 0.8;
    const passed = spuriousCollisionAvoided;
    const score = passed ? 100 : Math.round((1 - result.score) * 100);

    return {
      passed,
      score,
      pairId,
      relevanceScore: result.score,
      strength: result.strength,
      reason: result.reason,
      spuriousCollisionAvoided
    };
  }
}
