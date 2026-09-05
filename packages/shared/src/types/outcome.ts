export type CriteriaEvaluation =
  | 'succeeded'
  | 'failed'
  | 'partially_succeeded'
  | 'unmeasurable';

export type QuickLoopStatus = 'clarified' | 'not_yet' | 'irrelevant';

/**
 * Continuous Learning Outcome Loop
 * 3-Axis reflection separating facts, assumption reality, and process quality
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

  // מענה מהיר בקליק
  quickStatus?: QuickLoopStatus;

  // Optional legacy fields for backward compatibility
  observedFacts?: string;
  criteriaEvaluation?: CriteriaEvaluation;
  reflectionNotes?: string;

  recordedAt: number; // epoch ms
}
