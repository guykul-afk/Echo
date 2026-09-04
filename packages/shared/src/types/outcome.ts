export type CriteriaEvaluation =
  | 'succeeded'
  | 'failed'
  | 'partially_succeeded'
  | 'unmeasurable';

export interface Outcome {
  id: string; // UUID v4
  caseId: string;
  userId: string;
  observedFacts: string; // What actually happened in reality, strictly separated from retrospective story
  criteriaEvaluation: CriteriaEvaluation;
  reflectionNotes?: string; // Was the original criterion a good and sufficient test in hindsight?
  recordedAt: number; // epoch ms
}
