export type EpistemicRole =
  | 'goal'
  | 'observation'
  | 'evaluation'
  | 'assumption'
  | 'prediction'
  | 'unknown';

export type ProvenanceSource =
  | 'user_verbatim'
  | 'inferred_by_ai';

export interface Statement {
  id: string; // UUID v4
  caseId: string;
  userId: string;
  text: string;
  role: EpistemicRole;
  provenanceSource: ProvenanceSource;
  confidenceScore: number; // 0.0 - 1.0 (extraction confidence, NOT truth of the claim)
  createdAt: number;
}
