import { Outcome } from './outcome.js';
import { DeepDecisionMechanisms } from './cognitive.js';

export type DecisionStatus =
  | 'deliberating'
  | 'decided'
  | 'monitoring'
  | 'resolved'
  | 'archived'
  | 'abandoned'
  | 'skipped';

export type ContextStakes = 'low' | 'medium' | 'high' | 'very_high';
export type ContextReversibility = 'reversible' | 'partially_reversible' | 'irreversible';
export type ContextTimePressure = 'low' | 'medium' | 'high';
export type FrictionLevel = 'quick' | 'focused' | 'deep';

export interface RefinedInsight {
  before: string; // What was initially felt/thought
  now: string;    // What became clarified
  chosenStep: string; // The step chosen by the user
}

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
  frozenAt: number; // epoch ms

  // Adaptive Friction & Developing Mirror
  frictionLevel?: FrictionLevel;
  dimConsideration?: string; // אתה שוקל
  dimGoalsPrices?: string;   // אתה רוצה להשיג / לשמור
  dimFacts?: string;         // עובדות קשיחות
  dimAssumptions?: string;   // ההנחות שלך
  dimMissingInfo?: string;   // מידע חסר להחלטה
  dimReliance?: string;      // deprecated: על מה אתה נשען
  dimUnknowns?: string;      // deprecated: עדיין לא ברור
  centralTension?: string;   // המתח המרכזי (First 20 Seconds)
  keyHinge?: string;         // נראה שההכרעה תלויה בעיקר ב... (First 20 Seconds)
  mirrorFeedback?: 'accurate' | 'inaccurate'; // משוב המשתמש למראה: מדויק / לא בדיוק
  aiInterventionUsed?: string; // שאלת הארה ראשית: ממוקדת בדילמה הנוכחית
  historicalInterventionUsed?: string; // שאלת עבר מותנית: מופעלת רק אם מזוהה צורך
  nextStep?: string;
  refinedInsight?: RefinedInsight | null;
  deepMechanisms?: DeepDecisionMechanisms;

  outcome?: Outcome;
  resolvedAt?: number;
  vectorEmbedding?: number[];
  createdAt: number;
  updatedAt: number;
}
