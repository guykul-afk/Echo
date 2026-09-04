export interface CalibrationTracker {
  id: string; // UUID v4
  userId: string;
  totalVerifiablePredictions: number;
  brierScore: number; // 0.0 (perfect calibration) to 1.0 (completely miscalibrated)
  confidenceBucketScores: Record<string, number>; // e.g. {"80%": 0.65}
  overconfidenceBiasIndex: number;
  updatedAt: number;
}
