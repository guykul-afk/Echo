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
  'לגבי', 'בגלל', 'מתוך', 'אצל', 'כמו', 'בין', 'האם', 'יש', 'אין', 'כרגע', 'שני', 'נוספים', 'נוספת',
  'שלך', 'שלי', 'שלו', 'שלה', 'אותו', 'אותה', 'אותם', 'אפשר', 'צריך', 'יכול', 'יכולה', 'כעת', 'טוב',
  'פחות', 'משהו', 'דבר', 'דברים',
  // Operational and generic non-value words (prevent spurious collisions)
  'אישור', 'אישורי', 'אישורים', 'מיידי', 'מיידית', 'מיידיים', 'תקציב', 'תקציבים', 'דחוף', 'דחופה',
  'החלטה', 'החלטות', 'לבחור', 'בחירה', 'בדיקה', 'מהר', 'מהיר', 'מהירה', 'רוצה', 'שוקל', 'שוקלת',
  'עושה', 'עושים', 'שעות', 'ימים', 'שבוע', 'חודש', 'שנה', 'סכום', 'כסף', 'דולר', 'שקל'
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

function normalizeHebrewWord(word: string): string {
  let w = word.toLowerCase().trim();
  if (w.length >= 5 && (w.startsWith('ו') || w.startsWith('ה') || w.startsWith('ב') || w.startsWith('ל') || w.startsWith('מ') || w.startsWith('ש') || w.startsWith('כ'))) {
    w = w.slice(1);
  }
  const badFragments = ['ירה', 'ירות', 'וצר', 'שקיע'];
  if (badFragments.includes(w)) return '';
  return w;
}

function extractKeyTokens(text: string): string[] {
  return text
    .split(/[\s,.:;״"()!?\-\/|]+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length >= 3 && !HEBREW_STOPWORDS.has(w))
    .map(normalizeHebrewWord)
    .filter(w => w.length >= 3 && !HEBREW_STOPWORDS.has(w));
}

function computeConceptOverlap(phraseA: string, phraseB: string): { sharedTokens: string[]; overlapRatio: number } {
  if (!phraseA || !phraseB) return { sharedTokens: [], overlapRatio: 0 };
  const lowerA = phraseA.toLowerCase();
  const lowerB = phraseB.toLowerCase();

  // Direct substring check
  if (lowerA.includes(lowerB) || lowerB.includes(lowerA)) {
    return { sharedTokens: [phraseA.trim()], overlapRatio: 1.0 };
  }

  const tokensA = extractKeyTokens(lowerA);
  const tokensB = extractKeyTokens(lowerB);

  if (tokensA.length === 0 || tokensB.length === 0) return { sharedTokens: [], overlapRatio: 0 };

  const sharedTokens: string[] = [];
  for (const tA of tokensA) {
    for (const tB of tokensB) {
      // Exact match or Hebrew suffix variation (e.g. פיתוח / פיתוחים / פיתוחו)
      // Disallows false positive matches between distinct roots (e.g. פיתוח vs פיתוי)
      const isSuffixVariation = (tA.length >= 4 && tB.length >= 4) &&
        ((tA.startsWith(tB) && tA.length - tB.length <= 3) || (tB.startsWith(tA) && tB.length - tA.length <= 3));
      if (tA === tB || isSuffixVariation) {
        sharedTokens.push(tA);
        break;
      }
    }
  }

  const overlapRatio = sharedTokens.length / Math.min(tokensA.length, tokensB.length);
  return { sharedTokens, overlapRatio };
}

function formatStatementQuote(statement: string, maxChars: number = 100): string {
  const clean = (statement || '').trim();
  if (clean.length <= maxChars) return clean;
  const truncated = clean.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

function parseTradeoffAssertion(statement: string): { protectedValue: string; sacrificedValue: string } | null {
  const match = statement.match(/שימור:\s*(.*?)\s*\|\s*ויתור:\s*(.*)/i);
  if (match) {
    return {
      protectedValue: match[1].trim(),
      sacrificedValue: match[2].trim()
    };
  }
  return null;
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
    deepMechanisms?: DeepDecisionMechanisms,
    isTrivialCase: boolean = false
  ): Promise<RetrievalBeforeAskResult> {
    if (isTrivialCase) {
      return {
        memoryPreamble: undefined,
        shouldConvertToConfirmation: false,
        knownAnswerFact: undefined,
        contradictingAssertions: [],
        assertions: [],
        entities: [],
        hasKnownAnswer: false,
        canSuppressIntervention: false
      };
    }

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

      const isEntityMatch = Boolean(
        assertion.entityId && relevantEntities.some(e => e.id === assertion.entityId)
      );

      const stmtClean = assertion.statement.toLowerCase().trim();

      // Domain & Thematic Analysis (Ontology Layer)
      const currentDomain = deepMechanisms?.domain;
      const assertionDomain = assertion.domain;
      const isCrossDomain = Boolean(
        currentDomain &&
        assertionDomain &&
        currentDomain !== 'general' &&
        assertionDomain !== 'general' &&
        currentDomain !== assertionDomain
      );

      const currentThemes = new Set(deepMechanisms?.abstractThemes || []);
      const assertionThemes = assertion.abstractThemes || [];
      const sharedThemes = assertionThemes.filter(t => currentThemes.has(t));
      const hasSharedAbstractTheme = sharedThemes.length > 0;

      // 1. Inter-Domain Rule: Cross-domain retrieval is strictly thematic
      if (isCrossDomain) {
        // Disallow lexical matching across distinct life domains. Only permit thematic outcome or principle cross-pollination.
        if (hasSharedAbstractTheme && (assertion.category === 'outcome' || assertion.category === 'principle')) {
          score = 0.96;
          reason = `cross_domain_thematic_pollination(theme:${sharedThemes.join(',')},from:${assertionDomain}_to:${currentDomain})`;
          candidateAssertions.push({ assertion, score, reason, hasAuthenticAnchor: true } as any);
        }
        // Always skip lexical matching across different domains
        continue;
      }

      // Intra-domain outcome thematic match
      if (hasSharedAbstractTheme && assertion.category === 'outcome') {
        score = 0.98;
        reason = `causal_outcome_theme_match(theme:${sharedThemes.join(',')})`;
      }

      // Deep Mechanism Match: Tradeoffs & Reversals (Contradictions)
      if (deepMechanisms?.tradeoffs && deepMechanisms.tradeoffs.length > 0) {
        if (assertion.category === 'tradeoff') {
          const oldTradeoff = parseTradeoffAssertion(stmtClean);
          if (oldTradeoff) {
            for (const newT of deepMechanisms.tradeoffs) {
              // 1. REVERSAL CONTRADICTION: What was previously protected is now sacrificed!
              const revSacrCheck = computeConceptOverlap(newT.sacrificedValue, oldTradeoff.protectedValue);
              if (revSacrCheck.sharedTokens.length >= 2 || (revSacrCheck.sharedTokens.length === 1 && isEntityMatch)) {
                const reversalScore = 0.70 + (revSacrCheck.overlapRatio * 0.29);
                if (reversalScore > score) {
                  score = reversalScore;
                  reason = `tradeoff_reversal_contradiction(sacrificing_protected:${revSacrCheck.sharedTokens.join(',')})`;
                }
              }

              // 2. RECIPROCAL REVERSAL: What was previously sacrificed is now protected!
              const revProtCheck = computeConceptOverlap(newT.protectedValue, oldTradeoff.sacrificedValue);
              if (revProtCheck.sharedTokens.length > 0) {
                const recipScore = 0.96;
                if (recipScore > score) {
                  score = recipScore;
                  reason = `tradeoff_reversal(protecting_sacrificed:${revProtCheck.sharedTokens.join(',')})`;
                }
              }

              // 3. CONSISTENT TRADEOFF REINFORCEMENT:
              const protCheck = computeConceptOverlap(newT.protectedValue, oldTradeoff.protectedValue);
              const sacrCheck = computeConceptOverlap(newT.sacrificedValue, oldTradeoff.sacrificedValue);
              if (protCheck.sharedTokens.length > 0 && sacrCheck.sharedTokens.length > 0) {
                const consScore = 0.98;
                if (consScore > score) {
                  score = consScore;
                  reason = `deep_tradeoff_match(consistent:${protCheck.sharedTokens.join(',')}/${sacrCheck.sharedTokens.join(',')})`;
                }
              } else if (protCheck.sharedTokens.length > 0) {
                const consScore = 0.92;
                if (consScore > score) {
                  score = consScore;
                  reason = `deep_tradeoff_match(shared_protected:${protCheck.sharedTokens.join(',')})`;
                }
              } else if (sacrCheck.sharedTokens.length > 0) {
                const consScore = 0.90;
                if (consScore > score) {
                  score = consScore;
                  reason = `deep_tradeoff_match(shared_sacrificed:${sacrCheck.sharedTokens.join(',')})`;
                }
              }
            }
          }
        } else {
          // General assertion matching against new tradeoffs using concept overlap
          for (const t of deepMechanisms.tradeoffs) {
            const protCheck = computeConceptOverlap(t.protectedValue, stmtClean);
            const sacrCheck = computeConceptOverlap(t.sacrificedValue, stmtClean);
            if (protCheck.sharedTokens.length > 0 && sacrCheck.sharedTokens.length > 0) {
              const tradeScore = 0.97;
              if (tradeScore > score) {
                score = tradeScore;
                reason = `deep_tradeoff_match(${protCheck.sharedTokens.join(',')}/${sacrCheck.sharedTokens.join(',')})`;
              }
            } else if (protCheck.sharedTokens.length > 0 || sacrCheck.sharedTokens.length > 0) {
              const matchedTokens = [...protCheck.sharedTokens, ...sacrCheck.sharedTokens];
              // Single token match is limited to 0.65 to prevent false matches from breaching the 0.85 quality gate
              const tradeScore = matchedTokens.length >= 2 ? 0.92 : 0.65;
              if (tradeScore > score) {
                score = tradeScore;
                reason = `deep_tradeoff_match(${matchedTokens.join(',')})`;
              }
            }
          }
        }
      }

      // Deep Mechanism Match: Operating Principles & Principle Breach
      if (assertion.category === 'principle') {
        if (deepMechanisms?.operatingPrinciples && deepMechanisms.operatingPrinciples.length > 0) {
          for (const p of deepMechanisms.operatingPrinciples) {
            const overlap = computeConceptOverlap(p, stmtClean);
            if (overlap.sharedTokens.length > 0) {
              const pScore = overlap.overlapRatio >= 0.4 ? 0.98 : 0.94;
              if (pScore > score) {
                score = pScore;
                reason = `operating_principle_match(${overlap.sharedTokens.join(',')})`;
              }
            }
          }
        }
        // Check if input dilemma concepts overlap directly with operating principle
        const directPrincipleOverlap = computeConceptOverlap(stmtClean, inputLower);
        if (directPrincipleOverlap.sharedTokens.length > 0) {
          const directScore = directPrincipleOverlap.overlapRatio >= 0.25 ? 0.94 : 0.88;
          if (directScore > score) {
            score = directScore;
            reason = `operating_principle_relevance(${directPrincipleOverlap.sharedTokens.join(',')})`;
          }
        }
        // Check if a new decision's sacrificed value violates an existing principle!
        if (deepMechanisms?.tradeoffs && deepMechanisms.tradeoffs.length > 0) {
          for (const t of deepMechanisms.tradeoffs) {
            const breachOverlap = computeConceptOverlap(t.sacrificedValue, stmtClean);
            if (breachOverlap.sharedTokens.length >= 2 || (breachOverlap.sharedTokens.length === 1 && isEntityMatch)) {
              // Add variance to the score based on ratio instead of hardcoding 0.99 everywhere
              const breachScore = 0.95 + (breachOverlap.overlapRatio * 0.04);
              if (breachScore > score) {
                score = breachScore;
                reason = `principle_breach_contradiction(sacrificing_principle:${breachOverlap.sharedTokens.join(',')})`;
              }
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

      // Substantial domain word overlap (requires >= 4 unique non-stopword tokens)
      if (sharedWords.length >= 4) {
        const overlapScore = Math.min(0.86, 0.72 + (sharedWords.length * 0.03));
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

      // Evaluate authentic anchor for later
      const hasAuthenticAnchor = isEntityMatch ||
        reason.includes('cross_domain_thematic_pollination') ||
        reason.includes('causal_outcome_theme_match') ||
        reason.includes('deep_tradeoff_match') ||
        reason.includes('tradeoff_reversal') ||
        reason.includes('operating_principle_match') ||
        reason.includes('operating_principle_relevance') ||
        reason.includes('principle_breach') ||
        hasConceptMatch ||
        isFullSubstring ||
        (sharedWords.length >= 4 && (assertion.category === 'outcome' || assertion.category === 'principle'));

      if (score > 0) {
        candidateAssertions.push({ assertion, score, reason, hasAuthenticAnchor } as any);
      }
    }

    // Top-K = 8
    candidateAssertions.sort((a, b) => b.score - a.score);
    const topKCandidates = candidateAssertions.slice(0, 8);

    // Apply Quality Gate
    const qualifiedCandidates = topKCandidates.filter((c: any) => c.score >= 0.85 && c.hasAuthenticAnchor);

    if (qualifiedCandidates.length === 0) {
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

    // Sort qualified candidates:
    // 1. Closed loop outcome assertions receive primary precedence
    // 2. Retrieval Score
    // 3. Confidence level and freshness
    qualifiedCandidates.sort((a, b) => {
      const aIsOutcome = a.assertion.category === 'outcome' ? 1 : 0;
      const bIsOutcome = b.assertion.category === 'outcome' ? 1 : 0;
      if (aIsOutcome !== bIsOutcome) return bIsOutcome - aIsOutcome;
      if (b.score !== a.score) return b.score - a.score;
      return (b.assertion.confidenceLevel || 0) - (a.assertion.confidenceLevel || 0) || b.assertion.timestamp - a.assertion.timestamp;
    });
    const topCandidate = qualifiedCandidates[0];
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
    const isContradiction = Boolean(topContradiction) ||
      topCandidate.reason.includes('contradiction') ||
      topCandidate.reason.includes('reversal') ||
      topCandidate.reason.includes('breach');

    // 5. Memory Budget (Maximum 1-2 assertions, <= 120 chars each)
    const budgetAssertions = [topAssertion];
    if (topContradiction && topContradiction.id !== topAssertion.id) {
      budgetAssertions.push(topContradiction);
    }

    // Build balanced Memory Preamble
    let memoryPreamble: string | undefined;
    const isUserOrigin = topAssertion.sourceType === 'user_confirmed' || topAssertion.sourceType === 'user_stated';
    if (topCandidate.reason.includes('cross_domain_thematic_pollination') || topCandidate.reason.includes('causal_outcome_theme_match')) {
      const fromDomainName = topAssertion.domain === 'professional' ? 'העבודה והניהול' : topAssertion.domain === 'medical' ? 'הטיפול והשיקום' : 'הקשר מקביל';
      memoryPreamble = `מתחום ${fromDomainName} עלה לקח רלוונטי: "${formatStatementQuote(topAssertion.statement)}".`;
    } else if (topCandidate.reason.includes('tradeoff_reversal') || topCandidate.reason.includes('principle_breach')) {
      const cleanStmt = topAssertion.statement.replace(/^שימור:\s*/, '').split('|')[0].trim();
      memoryPreamble = isUserOrigin
        ? `בעבר הגדרת קו אדום/שימור לגבי: "${formatStatementQuote(cleanStmt)}", אך בדילמה הנוכחית מתבצע ויתור עליו.`
        : `בהחלטה קודמת הוגדר שימור לגבי: "${formatStatementQuote(cleanStmt)}", אך בדילמה הנוכחית מתבצע ויתור עליו.`;
    } else if (topContradiction) {
      memoryPreamble = isUserOrigin
        ? `במקרה קודם ציינת "${formatStatementQuote(topAssertion.statement)}", אך בהחלטה אחרת: "${formatStatementQuote(topContradiction.statement)}".`
        : `בהקשר קודם עלה: "${formatStatementQuote(topAssertion.statement)}", לעומת החלטה אחרת: "${formatStatementQuote(topContradiction.statement)}".`;
    } else if (budgetAssertions.length > 0) {
      if (topAssertion.condition) {
        memoryPreamble = `מתקדים עבר: "${formatStatementQuote(topAssertion.statement)}" (סייג שהוגדר: "${formatStatementQuote(topAssertion.condition, 60)}")`;
      } else {
        memoryPreamble = isUserOrigin
          ? `במקרה קודם ציינת: "${formatStatementQuote(topAssertion.statement)}"`
          : `מהקשר קודם: "${formatStatementQuote(topAssertion.statement)}"`;
      }
    }

    // Determine if we should suppress, convert to confirmation, or simply provide memory context
    // Never suppress if a genuine contradiction/reversal is detected!
    if (!isContradiction && (isFirmlyDocumented || confirmedRecently || askedRecently)) {
      // Novelty Gate active: pattern already known, do not badger user with "is this still true?"
      return {
        entities: relevantEntities,
        assertions: budgetAssertions,
        contradictingAssertions: [],
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
    // and when explicitly looking for previously stated user facts (not contradictions)
    const shouldConfirm = !isContradiction &&
      (topAssertion.sourceType === 'user_stated' || topAssertion.sourceType === 'user_confirmed' || topAssertion.category === 'principle' || topAssertion.category === 'decision_mechanism') &&
      !topContradiction &&
      (topAssertion.confidenceLevel >= 85) &&
      !topAssertion.lastAskedAt;

    if (shouldConfirm) {
      await this.knowledgeGraphService.recordAssertionAsked(userId, topAssertion.id);
      const confQuestion = topAssertion.condition
        ? `בעבר פעלת לפי: "${topAssertion.statement}" [סייג: "${topAssertion.condition}"]. האם סייג זה מתקיים גם בדילמה הנוכחית?`
        : (isUserOrigin
            ? `בעבר ציינת ש"${topAssertion.statement}". האם זה עדיין תקף?`
            : `בהחלטה קודמת עלתה ההנחה: "${topAssertion.statement}". האם הנחה זו תקפה גם כעת?`);

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
      contradictingAssertions: isContradiction ? [topContradiction || topAssertion] : [],
      memoryPreamble,
      hasKnownAnswer: true,
      knownAnswerFact: topAssertion.statement,
      shouldConvertToConfirmation: false,
      canSuppressIntervention: false,
      retrievalScore: topCandidate.score,
      retrievalReason: isContradiction ? `contradiction_detected(${topCandidate.reason})` : `historical_context(${topCandidate.reason})`,
      retrievedCandidatesCount: candidateAssertions.length
    };
  }
}
