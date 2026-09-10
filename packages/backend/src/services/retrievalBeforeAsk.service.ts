import {
  RetrievalBeforeAskResult,
  GraphAssertion,
  KnowledgeEntity
} from '@echo/shared';
import { KnowledgeGraphService } from './knowledgeGraph.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const HEBREW_STOPWORDS = new Set([
  'את', 'על', 'עם', 'של', 'לא', 'כן', 'זה', 'זו', 'אלה', 'אלו', 'היה', 'היו', 'תהיה', 'יהיה',
  'אני', 'אתה', 'הוא', 'היא', 'אנחנו', 'אתם', 'הם', 'כל', 'רק', 'עוד', 'יותר', 'לפני', 'אחרי',
  'כדי', 'אם', 'כי', 'או', 'גם', 'אבל', 'אך', 'כבר', 'שוב', 'שם', 'פה', 'כאן', 'מאוד', 'מה', 'מי',
  'לגבי', 'בגלל', 'מתוך', 'אצל', 'כמו', 'בין'
]);

function extractConceptPhrases(text: string): string[] {
  const words = text
    .split(/[\s,.:;״"()!?\-\/]+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length >= 3 && !HEBREW_STOPWORDS.has(w));

  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (bigram.length >= 7) {
      phrases.push(bigram);
    }
  }
  return phrases;
}

export class RetrievalBeforeAskService {
  constructor(private knowledgeGraphService: KnowledgeGraphService = new KnowledgeGraphService()) {}

  /**
   * Evaluates a draft question against the user's personal Knowledge Graph.
   * Incorporates:
   * 1. Entity-based and concept phrase matching (no trivial single-word matches).
   * 2. Novelty Gate: never repeat confirmed assertions within 14-30 days.
   * 3. Contradiction Retrieval: surfaces opposing memories to prevent confirmation bias.
   * 4. Memory Budget: max 1-2 short assertions (<=120 chars), preamble context before illumination.
   */
  async checkBeforeAsk(
    userId: string,
    draftQuestion: string,
    rawText: string
  ): Promise<RetrievalBeforeAskResult> {
    const activeAssertions = await this.knowledgeGraphService.getActiveAssertionsByUser(userId);
    const entities = await this.knowledgeGraphService.getEntitiesByUser(userId);
    const now = Date.now();

    const inputLower = (rawText + ' ' + draftQuestion).toLowerCase();

    // 1. Strict Entity Matching
    const relevantEntities: KnowledgeEntity[] = entities.filter(e =>
      e.name && e.name.trim().length >= 2 && inputLower.includes(e.name.toLowerCase().trim())
    );

    // 2. Filter candidate assertions by Entity, Specific Concept Phrase, or Thematic Assumption Overlap
    const candidateAssertions: { assertion: GraphAssertion; score: number; reason: string }[] = [];
    const inputWords = new Set(
      inputLower
        .split(/[\s,.:;״"()!?\-\/]+/)
        .map(w => w.trim())
        .filter(w => w.length >= 3 && !HEBREW_STOPWORDS.has(w))
    );

    for (const assertion of activeAssertions) {
      const isEntityMatch = Boolean(
        assertion.entityId && relevantEntities.some(e => e.id === assertion.entityId)
      );

      // Check if statement shares a distinct 2-word concept phrase with the current dilemma
      const conceptPhrases = extractConceptPhrases(assertion.statement);
      const hasConceptMatch = conceptPhrases.some(phrase => inputLower.includes(phrase));

      const stmtClean = assertion.statement.toLowerCase().trim();
      const isFullSubstring = stmtClean.length >= 8 && inputLower.includes(stmtClean);

      // Keyword / thematic overlap
      const stmtWords = stmtClean
        .split(/[\s,.:;״"()!?\-\/]+/)
        .map(w => w.trim())
        .filter(w => w.length >= 3 && !HEBREW_STOPWORDS.has(w));
      const sharedWords = stmtWords.filter(w => inputWords.has(w));

      let score = 0;
      let reason = '';

      if (isEntityMatch) {
        score = Math.max(score, 0.9);
        reason = 'entity_match';
      }
      if (hasConceptMatch || isFullSubstring) {
        score = Math.max(score, 0.85);
        reason = reason ? `${reason}+concept_phrase` : 'concept_phrase_overlap';
      }
      if (sharedWords.length >= 2) {
        const overlapScore = Math.min(0.8, 0.45 + (sharedWords.length * 0.1));
        if (overlapScore > score) {
          score = overlapScore;
          reason = `thematic_keywords(${sharedWords.join(',')})`;
        }
      }

      if (assertion.category === 'outcome' && score > 0) {
        score = Math.min(0.99, score + 0.15);
        reason += '+historical_outcome_precedent';
      }

      if (score >= 0.5) {
        candidateAssertions.push({ assertion, score, reason });
      }
    }

    if (candidateAssertions.length === 0) {
      return {
        entities: relevantEntities,
        assertions: [],
        hasKnownAnswer: false,
        shouldConvertToConfirmation: false,
        canSuppressIntervention: false,
        retrievalScore: 0,
        retrievalReason: 'no_candidate_overlap',
        retrievedCandidatesCount: 0
      };
    }

    // Sort candidates by score, confidence and freshness
    candidateAssertions.sort((a, b) => b.score - a.score || (b.assertion.confidenceLevel || 0) - (a.assertion.confidenceLevel || 0) || b.assertion.timestamp - a.assertion.timestamp);
    const topCandidate = candidateAssertions[0];
    const topAssertion = topCandidate.assertion;

    // 3. Novelty Gate Evaluation
    // (a) If confirmed >= 2 times: pattern is firmly established, do not ask again.
    const isFirmlyDocumented = (topAssertion.confirmedCount || 0) >= 2;

    // (b) If confirmed within the last 14 days and no new contradicting info: do not re-ask.
    const confirmedRecently = topAssertion.lastConfirmedAt
      ? (now - topAssertion.lastConfirmedAt) < (14 * DAY_MS)
      : false;

    // (c) Do not repeat the same assertion inquiry more than once in 30 days.
    const askedRecently = topAssertion.lastAskedAt
      ? (now - topAssertion.lastAskedAt) < (30 * DAY_MS)
      : false;

    // 4. Contradiction Retrieval
    const contradictions = await this.knowledgeGraphService.findContradictingAssertions(userId, topAssertion);
    const topContradiction = contradictions.length > 0 ? contradictions[0] : undefined;

    // 5. Memory Budget (Maximum 1-2 assertions, <= 120 chars each)
    const budgetAssertions = [topAssertion];
    if (topContradiction && topContradiction.id !== topAssertion.id) {
      budgetAssertions.push(topContradiction);
    }

    // Build balanced Memory Preamble
    let memoryPreamble: string | undefined;
    if (topContradiction) {
      memoryPreamble = `במקרה קודם ציינת "${topAssertion.statement.slice(0, 55)}", אך בהחלטה אחרת: "${topContradiction.statement.slice(0, 55)}".`;
    } else if (budgetAssertions.length > 0) {
      memoryPreamble = `מהקשר קודם: "${topAssertion.statement.slice(0, 70)}"`;
    }

    // Determine if we should suppress, convert to confirmation, or simply provide memory context
    if (isFirmlyDocumented || confirmedRecently || askedRecently) {
      // Novelty Gate active: pattern already known, do not badger user with "is this still true?"
      return {
        entities: relevantEntities,
        assertions: budgetAssertions,
        contradictingAssertions: topContradiction ? [topContradiction] : [],
        memoryPreamble,
        hasKnownAnswer: true,
        knownAnswerFact: topAssertion.statement,
        shouldConvertToConfirmation: false,
        canSuppressIntervention: false, // Keep bespoke question alive with memory context
        retrievalScore: topCandidate.score,
        retrievalReason: `novelty_gate_active(${topCandidate.reason})`,
        retrievedCandidatesCount: candidateAssertions.length
      };
    }

    // Only convert to confirmation in rare, high-confidence, unconfirmed cases (<= 20% target)
    // and when explicitly looking for previously stated user facts
    const shouldConfirm = topAssertion.sourceType === 'user_stated' &&
      !topContradiction &&
      (topAssertion.confidenceLevel >= 90) &&
      !topAssertion.lastAskedAt;

    if (shouldConfirm) {
      await this.knowledgeGraphService.recordAssertionAsked(userId, topAssertion.id);
      return {
        entities: relevantEntities,
        assertions: budgetAssertions,
        contradictingAssertions: [],
        memoryPreamble,
        hasKnownAnswer: true,
        knownAnswerFact: topAssertion.statement,
        shouldConvertToConfirmation: true,
        confirmationQuestion: `בעבר ציינת ש"${topAssertion.statement}". האם זה עדיין תקף?`,
        canSuppressIntervention: false,
        retrievalScore: topCandidate.score,
        retrievalReason: `confirmation_requested(${topCandidate.reason})`,
        retrievedCandidatesCount: candidateAssertions.length
      };
    }

    return {
      entities: relevantEntities,
      assertions: budgetAssertions,
      contradictingAssertions: topContradiction ? [topContradiction] : [],
      memoryPreamble,
      hasKnownAnswer: true,
      knownAnswerFact: topAssertion.statement,
      shouldConvertToConfirmation: false,
      canSuppressIntervention: false,
      retrievalScore: topCandidate.score,
      retrievalReason: `historical_context(${topCandidate.reason})`,
      retrievedCandidatesCount: candidateAssertions.length
    };
  }
}
