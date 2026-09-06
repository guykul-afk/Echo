export type CriteriaEvaluation =
  | 'succeeded'
  | 'failed'
  | 'partially_succeeded'
  | 'unmeasurable';

export type QuickLoopStatus =
  | 'succeeded_as_expected'
  | 'failed_due_to_assumption'
  | 'lucky_unexpected'
  | 'still_unfolding'
  | 'clarified'
  | 'not_yet'
  | 'irrelevant';

/**
 * Continuous Learning Outcome Loop
 * 3-Axis reflection separating facts, assumption reality, and process quality
 * Distinguishes Decision Quality from Outcome Quality (Luck/Noise)
 */
export interface Outcome {
  id: string; // UUID v4
  caseId: string;
  userId: string;
  
  // 1. מה קרה בפועל
  whatHappened: string;
  
  // 2. מה התברר לגבי ההנחה שעליה נשענת
  assumptionClarification: string;
  
  // 3. בהתחשב במה שיכולת לדעת אז, מה היית משנה בדרך שבה בחנת את ההחלטה?
  processReflection: string;

  // 4 כפתורי מענה מהיר (Phase 5 4-Option Fast Status)
  quickStatus?: QuickLoopStatus;

  // Phase 5: Decision Quality vs. Outcome Quality
  decisionQualityRating?: 'high_rationality' | 'acceptable_process' | 'rushed_blindspots';
  outcomeQualityRating?: 'favorable' | 'unfavorable' | 'mixed';
  luckAttribution?: 'skill_process' | 'external_luck' | 'bad_luck_good_decision';

  // Optional legacy fields for backward compatibility
  observedFacts?: string;
  criteriaEvaluation?: CriteriaEvaluation;
  reflectionNotes?: string;

  recordedAt: number; // epoch ms
}
