import {
  RetrievalBeforeAskResult,
  GraphAssertion,
  KnowledgeEntity,
  DeepDecisionMechanisms
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
   * 1. Deep Decision Mechanisms matching (Trade-offs, Principles, Qualified Conditions).
   * 2. Entity-based and concept phrase matching.
   * 3. Novelty Gate: never repeat confirmed assertions within 14-30 days.
   * 4. Contradiction Retrieval: surfaces opposing memories to prevent confirmation bias.
   * 5. Memory Budget: max 1-2 short assertions (<=120 chars), qualified preamble context.
   */
  async checkBeforeAsk(
    userId: string,
    draftQuestion: string,
    rawText: string,
    deepMechanisms?: DeepDecisionMechanisms
  ): Promise<RetrievalBeforeAskResult> {
    const activeAssertions = await this.knowledgeGraphService.getActiveAssertionsByUser(userId);
    const entities = await this.knowledgeGraphService.getEntitiesByUser(userId);
    const now = Date.now();

    const inputLower = (rawText + ' ' + draftQuestion).toLowerCase();

    // 1. Strict Entity Matching
    const relevantEntities: KnowledgeEntity[] = entities.filter(e =>
      e.name && e.name.trim().length >= 2 && inputLower.includes(e.name.toLowerCase().trim())
    );

    // 2. Filter candidate assertions by Deep Mechanisms, Entity, Concept Phrase, or Thematic Overlap
    const candidateAssertions: { assertion: GraphAssertion; score: number; reason: string }[] = [];
    const inputWords = new Set(
      inputLower
        .split(/[\s,.:;״"()!?\-\/]+/)
        .map(w => w.trim())
        .filter(w => w.length >= 3 && !HEBREW_STOPWORDS.has(w))
    );

    for (const assertion of activeAssertions) {
      let score = 0;
      let reason = '';

      const stmtClean = assertion.statement.toLowerCase().trim();

      // Deep Mechanism Match: Tradeoffs
      if (deepMechanisms?.tradeoffs && deepMechanisms.tradeoffs.length > 0) {
        for (const t of deepMechanisms.tradeoffs) {
          const prot = (t.protectedValue || '').toLowerCase().trim();
          const sacr = (t.sacrificedValue || '').toLowerCase().trim();
          if ((prot && stmtClean.includes(prot)) || (sacr && stmtClean.includes(sacr))) {
            const tradeScore = (prot && stmtClean.includes(prot) && sacr && stmtClean.includes(sacr)) ? 0.98 : 0.92;
            if (tradeScore > score) {
              score = tradeScore;
              reason = `deep_tradeoff_match(${t.protectedValue}/${t.sacrificedValue})`;
            }
          }
        }
      }

      // Deep Mechanism Match: Operating Principles
      if (deepMechanisms?.operatingPrinciples && deepMechanisms.operatingPrinciples.length > 0) {
        for (const p of deepMechanisms.operatingPrinciples) {
          const pClean = p.toLowerCase().trim();
          if (pClean.length >= 6 && (stmtClean.includes(pClean) || pClean.includes(stmtClean))) {
            if (0.95 > score) {
              score = 0.95;
              reason = `operating_principle_match`;
            }
          }
        }
      }

      // Deep Mechanism Match: Framework & Topology
      if (assertion.category === 'decision_mechanism' && deepMechanisms) {
        if (deepMechanisms.dilemmaTopology && stmtClean.includes(deepMechanisms.dilemmaTopology)) {
          score = Math.max(score, 0.88);
          reason = reason ? `${reason}+topology_match` : 'deep_topology_match';
        }
        if (deepMechanisms.dominantEvidenceType && stmtClean.includes(deepMechanisms.dominantEvidenceType)) {
          score = Math.max(score, 0.88);
          reason = reason ? `${reason}+evidence_match` : 'deep_evidence_match';
        }
      }

      // Lexical & Entity matching (fallback/complementary)
      const isEntityMatch = Boolean(
        assertion.entityId && relevantEntities.some(e => e.id === assertion.entityId)
      );

      const conceptPhrases = extractConceptPhrases(assertion.statement);
      const hasConceptMatch = conceptPhrases.some(phrase => inputLower.includes(phrase));
      const isFullSubstring = stmtClean.length >= 8 && inputLower.includes(stmtClean);

      const stmtWords = stmtClean
        .split(/[\s,.:;״"()!?\-\/]+/)
        .map(w => w.trim())
        .filter(w => w.length >= 3 && !HEBREW_STOPWORDS.has(w));
      const sharedWords = stmtWords.filter(w => inputWords.has(w));

      if (isEntityMatch) {
        score = Math.max(score, 0.92);
        reason = reason ? `${reason}+entity` : 'entity_match';
      }
      if (hasConceptMatch || isFullSubstring) {
        score = Math.max(score, 0.88);
        reason = reason ? `${reason}+concept` : 'concept_phrase_overlap';
      }

      // Substantial domain word overlap (strictly requires >= 4 significant keywords to avoid incidental noise)
      if (sharedWords.length >= 4) {
        const overlapScore = Math.min(0.86, 0.70 + (sharedWords.length * 0.04));
        if (overlapScore > score) {
          score = overlapScore;
          reason = `thematic_keywords(${sharedWords.slice(0, 5).join(',')})`;
        }
      }

      if (assertion.category === 'outcome' && score >= 0.80) {
        score = Math.min(0.99, score + 0.12);
        reason += '+historical_outcome_precedent';
      }

      // Bonus for qualified condition presence (Horizon 2)
      if (assertion.condition && score >= 0.80) {
        score = Math.min(0.99, score + 0.05);
        reason += '+qualified_condition';
      }

      // STRICT QUALITY GATE:
      // Must have an authentic structural anchor:
      // (1) Entity match, (2) Deep tradeoff/principle match, (3) Concrete bigram concept match,
      // or (4) Substantial >= 4 keyword overlap with an outcome.
      const hasAuthenticAnchor = isEntityMatch ||
        reason.includes('deep_tradeoff_match') ||
        reason.includes('operating_principle_match') ||
        hasConceptMatch ||
        isFullSubstring ||
        (sharedWords.length >= 4 && assertion.category === 'outcome');

      // Reject anything below 0.85 or lacking an authentic anchor
      if (score >= 0.85 && hasAuthenticAnchor) {
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

    // Sort candidates:
    // 1. Closed loop outcome assertions receive primary precedence
    // 2. Retrieval Score
    // 3. Confidence level and freshness
    candidateAssertions.sort((a, b) => {
      const aIsOutcome = a.assertion.category === 'outcome' ? 1 : 0;
      const bIsOutcome = b.assertion.category === 'outcome' ? 1 : 0;
      if (aIsOutcome !== bIsOutcome) return bIsOutcome - aIsOutcome;
      if (b.score !== a.score) return b.score - a.score;
      return (b.assertion.confidenceLevel || 0) - (a.assertion.confidenceLevel || 0) || b.assertion.timestamp - a.assertion.timestamp;
    });
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
      if (topAssertion.condition) {
        memoryPreamble = `מתקדים עבר: "${topAssertion.statement.slice(0, 60)}" (סייג שהוגדר: "${topAssertion.condition.slice(0, 45)}")`;
      } else {
        memoryPreamble = `מהקשר קודם: "${topAssertion.statement.slice(0, 70)}"`;
      }
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
    const shouldConfirm = (topAssertion.sourceType === 'user_stated' || topAssertion.category === 'principle' || topAssertion.category === 'decision_mechanism') &&
      !topContradiction &&
      (topAssertion.confidenceLevel >= 85) &&
      !topAssertion.lastAskedAt;

    if (shouldConfirm) {
      await this.knowledgeGraphService.recordAssertionAsked(userId, topAssertion.id);
      const confQuestion = topAssertion.condition
        ? `בעבר פעלת לפי: "${topAssertion.statement}" [סייג: "${topAssertion.condition}"]. האם סייג זה מתקיים גם בדילמה הנוכחית?`
        : `בעבר ציינת ש"${topAssertion.statement}". האם זה עדיין תקף?`;

      return {
        entities: relevantEntities,
        assertions: budgetAssertions,
        contradictingAssertions: [],
        memoryPreamble,
        hasKnownAnswer: true,
        knownAnswerFact: topAssertion.statement,
        shouldConvertToConfirmation: true,
        confirmationQuestion: confQuestion,
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
