import { Outcome, QuickLoopStatus, AbstractTheme } from '@echo/shared';
import { CallableContext } from './createDecisionCase.js';
import { DecisionService } from '../services/decision.service.js';
import { KnowledgeGraphService } from '../services/knowledgeGraph.service.js';

export interface RecordOutcomeRequest {
  caseId: string;
  whatHappened?: string;
  assumptionClarification?: string;
  processReflection?: string;
  quickStatus?: QuickLoopStatus;

  // Causal Triad & Thematic Linking
  abstractTheme?: AbstractTheme;
  actionTaken?: string;
  brokenAssumption?: string;

  // Phase 5: Decision Quality vs Outcome Quality
  decisionQualityRating?: 'high_rationality' | 'acceptable_process' | 'rushed_blindspots';
  outcomeQualityRating?: 'favorable' | 'unfavorable' | 'mixed';
  luckAttribution?: 'skill_process' | 'external_luck' | 'bad_luck_good_decision';

  // Backward compatibility & Aliases
  actualResultSummary?: string;
  actualOutcome?: string; // Support simulator alias
  wasCriteriaMet?: boolean;
  wasSuccessful?: boolean; // Support simulator alias
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

  const whatHappened = data.whatHappened || data.actualOutcome || data.actualResultSummary;
  if (!whatHappened || whatHappened.trim().length === 0) {
    throw new Error('INVALID_ARGUMENT: whatHappened or actualOutcome is required for recording an outcome.');
  }

  const isSuccess = data.wasCriteriaMet ?? data.wasSuccessful ?? false;
  const assumptionClarification = data.assumptionClarification || data.brokenAssumption || data.unexpectedLearnings || '';
  const processReflection = data.processReflection || '';
  const actionTaken = data.actionTaken || session.decisionCase.title;
  const abstractTheme = data.abstractTheme || (session.decisionCase.abstractThemes && session.decisionCase.abstractThemes[0]);

  const now = Date.now();
  const outcome: Outcome = {
    id: `out-${now}`,
    caseId: data.caseId,
    userId,
    whatHappened,
    assumptionClarification,
    processReflection,
    abstractTheme,
    actionTaken,
    brokenAssumption: data.brokenAssumption || assumptionClarification,
    quickStatus: data.quickStatus,
    decisionQualityRating: data.decisionQualityRating || (processReflection ? 'high_rationality' : 'acceptable_process'),
    outcomeQualityRating: data.outcomeQualityRating || (isSuccess ? 'favorable' : 'mixed'),
    luckAttribution: data.luckAttribution || 'skill_process',
    observedFacts: whatHappened,
    criteriaEvaluation: isSuccess ? 'succeeded' : 'partially_succeeded',
    reflectionNotes: assumptionClarification,
    recordedAt: now
  };

  session.decisionCase.outcome = outcome;
  session.decisionCase.status = 'resolved';
  session.decisionCase.resolvedAt = now;

  // Save causal lesson / outcome assertion into knowledge graph
  const causalStatement = `לקח: פעולת "${actionTaken}" הביאה ל-"${whatHappened.slice(0, 70)}". לקח/הנחה שנשברה: "${assumptionClarification.slice(0, 60)}"`;

  await knowledgeGraphService.saveAssertion({
    id: `asrt-outcome-${data.caseId}-${now}`,
    userId,
    caseId: data.caseId,
    statement: causalStatement,
    category: 'outcome',
    sourceType: 'user_confirmed',
    domain: session.decisionCase.domain,
    abstractThemes: abstractTheme ? [abstractTheme] : session.decisionCase.abstractThemes,
    timestamp: now,
    confidenceLevel: 100,
    sentimentOrPolarity: isSuccess ? 'pro' : 'con',
    createdAt: now
  });

  return {
    success: true,
    outcome,
    caseStatus: 'resolved'
  };
}
