export type PrimaryScarcity =
  | 'runway_capital'
  | 'executive_attention'
  | 'engineering_capacity'
  | 'market_credibility';

export type RiskTolerance =
  | 'existential_risk_only'
  | 'calculated_risk'
  | 'highly_conservative';

export interface OperatingContext {
  id: string; // UUID v4
  userId: string;
  name: string; // e.g. "Early Stage / Survival", "Scale-Up / 50 Employees"
  startedAt: number; // epoch ms
  endedAt?: number | null; // null indicates currently active era
  primaryScarcity: PrimaryScarcity;
  riskTolerance: RiskTolerance;
}
