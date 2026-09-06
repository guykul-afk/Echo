export type TriggerType =
  | 'scheduled_date'
  | 'event_based'
  | 'threshold_reached';

export interface EvaluationContract {
  id: string; // UUID v4
  caseId: string;
  userId: string;
  targetCriteria: string; // pre-defined success/validation criterion
  failureSignals?: string; // pre-defined red flags or failure signals
  reviewDate: number; // epoch ms
  triggerType: TriggerType;
  isTriggered: boolean;

  // Phase 5: Prediction Capture
  subjectiveConfidence?: number; // 0-100% subjective probability of success
  predictedOutcome?: string;    // specific verifiable prediction at decision time

  createdAt: number;
}
