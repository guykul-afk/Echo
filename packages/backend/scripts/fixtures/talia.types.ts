export type TaliaBehavior =
  | 'cooperative_detailed'
  | 'endless_info_gathering'
  | 'active_mirror_correction'
  | 'rushed_affect_panic'
  | 'trivial_smart_silence'
  | 'contradiction_dissonance'
  | 'broken_assumption_outcome';

export interface TaliaFixtureCase {
  caseIndex: number;
  day: number;
  month: number;
  behavior: TaliaBehavior;
  title: string;
  rawInput: string;
  category: 'recurring_family' | 'strategic_oneoff' | 'trivial_silence_test' | 'hostile_incomplete';
  expectedStrategy?: string;
  expectedTrivialSilence?: boolean;
  expectedContradiction?: boolean;
  recurringPrinciple?: 'pedagogical_first' | 'rule_of_law' | 'compassion_above_all';
  mirrorCorrection?: {
    feedback: 'inaccurate';
    correctionText: string;
    targetField: 'facts' | 'assumptions' | 'consideration' | 'keyHinge' | 'centralTension';
    correctedValue: string;
  };
  userAnswer?: string;
  personaProfile: string;
  styleInstructions: string;
}
