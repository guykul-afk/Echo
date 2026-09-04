/**
 * Epistemic Engine & 9 Cognitive Dimensions for ECHO
 */

export type AffectState = 'calm' | 'anxious' | 'fomo' | 'overconfident' | 'rushed' | 'frustrated' | 'neutral';

export type RiskClass = 'mediocristan' | 'extremistan';

export type ReversibilityLevel = 'reversible' | 'partially_reversible' | 'irreversible';

export type LocusOfControl = 'internal' | 'external' | 'balanced';

export type ConvictionLevel = 'low' | 'moderate' | 'high' | 'absolute';

export interface EpistemicState {
  caseId: string;
  userId: string;
  // 9 Cognitive Dimensions
  facts: string[];              // F: Verifiable present data
  assumptions: string[];        // A: Beliefs about the future
  unknowns: string[];           // U: Critical missing data (WYSIATI)
  affect: AffectState;          // E: Somatic marker / emotion (Damasio)
  riskClass: RiskClass;         // R: Taleb's Mediocristan vs Extremistan
  reversibility: ReversibilityLevel; // Rev: One-way vs Two-way door
  contradictions: string[];     // C: Internal cognitive dissonance / conflicting claims
  locusOfControl: LocusOfControl;// Loc: Active agency vs victim of circumstance
  conviction: ConvictionLevel;  // Conv: Linguistic certainty level

  extractedAt: number;
}

export type IlluminationStrategy =
  | 'ruin_prevention'           // Taleb (Extremistan / Ruin)
  | 'contradiction_dissonance'  // Festinger (Internal contradictions)
  | 'affect_neutralization'     // Damasio / Slovic (High emotion / FOMO)
  | 'tacit_knowledge_gap'       // Kahneman (Elicitation of missing unstated facts)
  | 'pre_mortem'                // Klein (Irreversible decisions)
  | 'cheap_information_action'  // Howard (VOI / low-cost test)
  | 'social_groupthink_check'   // Janis (Team conformity)
  | 'outcome_contract_anchor';  // Duke / Tetlock (Hard verification criteria)

export interface IlluminationQuestion {
  id: string;
  caseId: string;
  strategy: IlluminationStrategy;
  questionText: string;         // The bespoke tailored question referencing user's quotes
  triggerReason: string;        // Why this strategy was selected by priority
  isSecondary: boolean;         // True if this is the rare follow-up question
  userResponseText?: string;
  respondedAt?: number;
  createdAt: number;
}
