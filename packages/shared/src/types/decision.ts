export type DecisionStatus =
  | 'deliberating'
  | 'decided'
  | 'monitoring'
  | 'resolved'
  | 'archived';

export type ContextStakes = 'low' | 'medium' | 'high' | 'very_high';
export type ContextReversibility = 'reversible' | 'partially_reversible' | 'irreversible';
export type ContextTimePressure = 'low' | 'medium' | 'high';

export interface Option {
  id: string; // UUID v4
  caseId: string;
  userId: string;
  title: string;
  origin: 'proposed_by_user' | 'suggested_by_ai';
  wasSelected: boolean;
  createdAt: number;
}

export type RelationType =
  | 'SIMILAR_TO'
  | 'TESTS_HYPOTHESIS'
  | 'CONTRADICTS'
  | 'EXTENDS';

export type AnalogyStrength = 'weak' | 'partial' | 'strong';

export interface DecisionRelation {
  id: string; // UUID v4
  userId: string;
  sourceCaseId: string;
  targetCaseId: string;
  relationType: RelationType;
  similarityReason: string;
  analogyStrength: AnalogyStrength;
  createdAt: number;
}

export interface DecisionCase {
  id: string; // UUID v4
  userId: string;
  eraId?: string; // Links to OperatingContext / Era
  title: string;
  status: DecisionStatus;
  family: string; // e.g. hire_or_wait, continue_or_stop, market_entry
  contextStakes: ContextStakes;
  contextReversibility: ContextReversibility;
  contextTimePressure: ContextTimePressure;
  rawCaptureText: string;
  rawAudioPath?: string;
  frozenAt: number; // epoch ms (Crucial: timestamp before AI extraction)
  resolvedAt?: number;
  vectorEmbedding?: number[]; // Vertex AI text-embedding vector
  createdAt: number;
  updatedAt: number;
}
