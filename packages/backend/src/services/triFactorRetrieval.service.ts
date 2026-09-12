import { DecisionCase, DecisionSignature, OperatingContext, DecisionRelation } from '@echo/shared';

export interface ScoredAnalogy {
  targetCase: DecisionCase;
  targetSignature?: DecisionSignature;
  relevanceScore: number;
  similarityReason: string;
  analogyStrength: 'weak' | 'partial' | 'strong';
}

export class TriFactorRetrievalService {
  /**
   * Tri-Factor Relevance Formula:
   * Relevance = 0.45 * StructuralMatch + 0.35 * ContextualMatch + 0.20 * SemanticMatch
   */
  static calculateRelevance(
    sourceSignature: DecisionSignature,
    targetSignature: DecisionSignature,
    sourceEra?: OperatingContext,
    targetEra?: OperatingContext,
    semanticCosineSimilarity: number = 0.8
  ): { score: number; reason: string; strength: 'weak' | 'partial' | 'strong' } {
    // 1. Structural Match (45%)
    const diffCommitment = Math.abs(sourceSignature.commitmentGradient - targetSignature.commitmentGradient);
    const diffInfoCost = Math.abs(sourceSignature.informationCostRatio - targetSignature.informationCostRatio);
    const structuralScore = Math.max(0, 1.0 - (diffCommitment * 0.6 + diffInfoCost * 0.4));

    // 2. Contextual Match (35%)
    let contextualScore = 0.7; // default moderate
    if (sourceEra && targetEra) {
      if (sourceEra.primaryScarcity === targetEra.primaryScarcity && sourceEra.riskTolerance === targetEra.riskTolerance) {
        contextualScore = 1.0;
      } else if (sourceEra.riskTolerance === targetEra.riskTolerance) {
        contextualScore = 0.85;
      } else {
        contextualScore = 0.4; // Different risk era warning
      }
    }

    // 3. Total Weighted Score
    const totalScore = (0.45 * structuralScore) + (0.35 * contextualScore) + (0.20 * semanticCosineSimilarity);

    // Formulation of human-readable analogy explanation based on actual properties
    const commitmentDesc = sourceSignature.commitmentGradient > 0.6 
      ? 'רמת מחויבות גבוהה וקשה להפיכה' 
      : sourceSignature.commitmentGradient < 0.4 
        ? 'רמת מחויבות מודולרית והפיכה' 
        : 'רמת מחויבות מדורגת';

    const structuralQuality = structuralScore > 0.8 
      ? 'התאמה מבנית גבוהה בפרופיל ההפיכות ועלות המידע' 
      : structuralScore > 0.6 
        ? 'התאמה מבנית חלקית במאפייני המחויבות' 
        : 'קרבה מבנית בסיסית';

    let reason = `${structuralQuality} (${commitmentDesc})`;

    if (sourceEra && targetEra && sourceEra.name !== targetEra.name) {
      reason += ` | מקרה עבר מתקופת "${targetEra.name}"`;
    }

    const strength = totalScore >= 0.82 ? 'strong' : totalScore >= 0.70 ? 'partial' : 'weak';

    return { score: Math.round(totalScore * 100) / 100, reason, strength };
  }
}
