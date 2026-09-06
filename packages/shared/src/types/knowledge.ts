export type ProvenanceSourceType =
  | 'user_stated'
  | 'user_confirmed'
  | 'ai_inferred'
  | 'historical'
  | 'external';

export interface GraphAssertion {
  id: string;
  userId: string;
  caseId?: string;
  entityId?: string;
  statement: string;
  sourceType: ProvenanceSourceType;
  timestamp: number;
  confidenceLevel: number; // 0 - 100
  validUntil?: number;     // epoch ms (for temporal memory decay)
  supersededBy?: string;   // id of newer replacing assertion
  createdAt: number;
}

export type EntityType = 'person' | 'company' | 'project' | 'goal' | 'constraint';

export interface KnowledgeEntity {
  id: string;
  userId: string;
  name: string;
  type: EntityType;
  relationshipToUser?: string;
  relatedDecisions: string[];
  activeAssertions: string[];
  createdAt: number;
  updatedAt: number;
}

export interface FrozenDecisionSnapshot {
  id: string;
  caseId: string;
  userId: string;
  knownFactsAtTime: string[];
  assumptionsAtTime: string[];
  unknownsAtTime: string[];
  chosenStep: string;
  frozenAt: number;
}

export interface RetrievalBeforeAskResult {
  entities: KnowledgeEntity[];
  assertions: GraphAssertion[];
  hasKnownAnswer: boolean;
  knownAnswerFact?: string;
  shouldConvertToConfirmation: boolean;
  confirmationQuestion?: string;
  canSuppressIntervention: boolean;
}
