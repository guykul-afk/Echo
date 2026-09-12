export interface CognitiveTracker {
  captures_since_last_update: number;
  closures_since_last_update: number;
  last_updated_at: number; // epoch ms
}

export interface CognitiveProfile {
  binary_trap_percentage: number;
  third_way_success_rate: number;
  risk_asymmetry_summary: string;
  unclosed_loops_count: number;
  updated_at: number;
}

export interface DecisionProfileFlowStep {
  stepNumber: string; // e.g. '01', '02'
  title: string;
  description: string;
}

export interface DecisionProfileAnchor {
  id: string;
  title: string;
  tag: string;
  description: string;
  caseTitle: string;
  caseId: string;
  authenticDilemmaQuote?: string;
  systemReflection?: string;
}

export interface DecisionProfileTrap {
  id: string;
  title: string;
  tag: string;
  description: string;
  caseTitle?: string;
  caseId?: string;
  authenticAssumptionQuote?: string;
  systemReflection?: string;
}

export interface DecisionProfileEvolution {
  fromStyle: string;
  toStyle: string;
  narrative: string;
  trajectoryShiftBadge: string; // e.g. "מעבר חד: זהירות ← נטילת סיכון אסטרטגי"
  inflectionPointCaseTitle?: string;
  inflectionPointCaseId?: string;
}

export interface DecisionProfileData {
  userId: string;
  capturesCount: number;
  mainStyle: {
    title: string;
    description: string;
    prominentTendency: string;
    consistencyMetric: string;
  };
  flowSteps: DecisionProfileFlowStep[];
  anchors: DecisionProfileAnchor[];
  traps: DecisionProfileTrap[];
  evolution?: DecisionProfileEvolution;
  updatedAt: number;
}

export interface User {
  id: string; // Firebase Auth UID
  email: string;
  createdAt: number; // epoch ms
  lastLoginAt?: number;
  cognitive_tracker?: CognitiveTracker;
}

