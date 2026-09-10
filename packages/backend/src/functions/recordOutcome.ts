import { Outcome, QuickLoopStatus } from '@echo/shared';
import { CallableContext } from './createDecisionCase.js';
import { DecisionService } from '../services/decision.service.js';
import { KnowledgeGraphService } from '../services/knowledgeGraph.service.js';

export interface RecordOutcomeRequest {
  caseId: string;
  whatHappened?: string;
  assumptionClarification?: string;
  processReflection?: string;
  quickStatus?: QuickLoopStatus;

  // Phase 5: Decision Quality vs Outcome Quality
  decisionQualityRating?: 'high_rationality' | 'acceptable_process' | 'rushed_blindspots';
  outcomeQualityRating?: 'favorable' | 'unfavorable' | 'mixed';
  luckAttribution?: 'skill_process' | 'external_luck' | 'bad_luck_good_decision';

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
  context: CallableContext,
  decisionService: DecisionService = new DecisionService(),
  knowledgeGraphService: KnowledgeGraphService = new KnowledgeGraphService()
) {
  if (!context.auth || !context.auth.uid) {
    throw new Error('UNAUTHENTICATED: User must be signed in.');
  }

  const userId = context.auth.uid;
  if (!data.caseId) {
    throw new Error('INVALID_ARGUMENT: caseId is required.');
  }

  // Enforce zero-trust ownership verification
  const session = decisionService.getCase(data.caseId, userId);
  if (!session) {
    throw new Error(`Case ${data.caseId} not found.`);
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
    decisionQualityRating: data.decisionQualityRating || (processReflection ? 'high_rationality' : 'acceptable_process'),
    outcomeQualityRating: data.outcomeQualityRating || (data.wasCriteriaMet ? 'favorable' : 'mixed'),
    luckAttribution: data.luckAttribution || 'skill_process',
    observedFacts: whatHappened,
    criteriaEvaluation: data.wasCriteriaMet ? 'succeeded' : 'partially_succeeded',
    reflectionNotes: assumptionClarification,
    recordedAt: now
  };

  session.decisionCase.outcome = outcome;
  session.decisionCase.status = 'resolved';
  session.decisionCase.resolvedAt = now;

  // Save lesson / outcome assertion into knowledge graph
  await knowledgeGraphService.saveAssertion({
    id: `asrt-outcome-${data.caseId}-${now}`,
    userId,
    caseId: data.caseId,
    statement: `תוצאה בפועל: "${whatHappened.slice(0, 100)}"`,
    category: 'outcome',
    sourceType: 'user_confirmed',
    timestamp: now,
    confidenceLevel: 100,
    sentimentOrPolarity: data.wasCriteriaMet ? 'pro' : 'con',
    createdAt: now
  });

  return {
    success: true,
    outcome,
    caseStatus: 'resolved'
  };
}
