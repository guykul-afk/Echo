export type PrincipalAgentTension =
  | 'sole_actor'
  | 'team_alignment'
  | 'external_dependency';

export type DecisionTempo =
  | 'emergency_hours'
  | 'tactical_weeks'
  | 'strategic_months';

export interface DecisionSignature {
  id: string; // UUID v4
  caseId: string;
  userId: string;
  commitmentGradient: number; // 0.0 (completely reversible) to 1.0 (binary high-commitment)
  informationCostRatio: number; // 0.0 (expensive/impossible probe) to 1.0 (cheap rapid probe available)
  reversibilityDecayDays: number; // estimated days until window of reversibility closes
  principalAgentTension: PrincipalAgentTension;
  decisionTempo: DecisionTempo;
  signatureEmbedding?: number[]; // Vector representation of the structural signature for RAG analogy search
}
