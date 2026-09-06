import {
  RetrievalBeforeAskResult,
  GraphAssertion,
  KnowledgeEntity
} from '@echo/shared';
import { KnowledgeGraphService } from './knowledgeGraph.service.js';

export class RetrievalBeforeAskService {
  constructor(private knowledgeGraphService: KnowledgeGraphService = new KnowledgeGraphService()) {}

  /**
   * Evaluates a draft question against the user's personal Knowledge Graph.
   * If a relevant fact is already known, it prevents redundant questions and
   * converts them to a confirmation question or smart silence.
   */
  async checkBeforeAsk(
    userId: string,
    draftQuestion: string,
    rawText: string
  ): Promise<RetrievalBeforeAskResult> {
    const activeAssertions = await this.knowledgeGraphService.getActiveAssertionsByUser(userId);
    const entities = await this.knowledgeGraphService.getEntitiesByUser(userId);

    const questionLower = (draftQuestion + ' ' + rawText).toLowerCase();

    // 1. Check for entity relevance
    const relevantEntities: KnowledgeEntity[] = entities.filter(e =>
      questionLower.includes(e.name.toLowerCase())
    );

    // 2. Check for matching assertions (by entity or semantic keywords)
    const relevantAssertions: GraphAssertion[] = [];
    for (const assertion of activeAssertions) {
      const stmtLower = assertion.statement.toLowerCase();
      // Extract significant keywords (length >= 3)
      const keywords = stmtLower
        .split(/[\s,.:;״"()]+/)
        .filter(w => w.length >= 3 && !['אתה', 'היה', 'זה', 'על', 'עם', 'של', 'לא', 'כן'].includes(w));

      const matchCount = keywords.filter(k => questionLower.includes(k)).length;
      const isEntityMatch = assertion.entityId && relevantEntities.some(e => e.id === assertion.entityId);

      if (isEntityMatch || matchCount >= 2) {
        relevantAssertions.push(assertion);
      }
    }

    if (relevantAssertions.length === 0) {
      return {
        entities: relevantEntities,
        assertions: [],
        hasKnownAnswer: false,
        shouldConvertToConfirmation: false,
        canSuppressIntervention: false
      };
    }

    // Sort by confidence and freshness
    const topAssertion = relevantAssertions.sort((a, b) => b.timestamp - a.timestamp)[0];

    // Determine whether to convert to confirmation or suppress
    const ageDays = (Date.now() - topAssertion.timestamp) / (1000 * 60 * 60 * 24);

    if (topAssertion.sourceType === 'user_stated' && ageDays < 14 && topAssertion.confidenceLevel >= 80) {
      // Very fresh and explicit -> convert to 1-tap confirmation
      return {
        entities: relevantEntities,
        assertions: relevantAssertions,
        hasKnownAnswer: true,
        knownAnswerFact: topAssertion.statement,
        shouldConvertToConfirmation: true,
        confirmationQuestion: `בעבר ציינת ש"${topAssertion.statement}". האם נתון זה עדיין תקף?`,
        canSuppressIntervention: false
      };
    } else if (ageDays >= 14 || topAssertion.sourceType === 'ai_inferred') {
      // Slightly older or inferred -> ask confirmation before relying on it
      return {
        entities: relevantEntities,
        assertions: relevantAssertions,
        hasKnownAnswer: false,
        knownAnswerFact: topAssertion.statement,
        shouldConvertToConfirmation: true,
        confirmationQuestion: `בהחלטה קודמת עלה ש"${topAssertion.statement}". האם המצב הזה עדיין נכון?`,
        canSuppressIntervention: false
      };
    }

    return {
      entities: relevantEntities,
      assertions: relevantAssertions,
      hasKnownAnswer: true,
      knownAnswerFact: topAssertion.statement,
      shouldConvertToConfirmation: false,
      canSuppressIntervention: true
    };
  }
}
