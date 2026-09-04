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
  createdAt: number;
}
