export type EpistemicStatus =
  | 'emerging'
  | 'supported'
  | 'challenged'
  | 'obsolete';

export interface PatternHypothesis {
  id: string; // UUID v4
  userId: string;
  claim: string; // e.g. "recorded high-commitment cases benefited from test-before-commit"
  sampleSizeN: number; // sample size
  supportingCaseIds: string[];
  contradictingCaseIds: string[];
  contextBoundaries: string; // conditions under which pattern holds
  epistemicStatus: EpistemicStatus;
  updatedAt: number;
}
