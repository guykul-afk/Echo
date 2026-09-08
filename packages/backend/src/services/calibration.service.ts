import { CalibrationTracker } from '@echo/shared';

export interface CalibrationDataPoint {
  caseId: string;
  statedConfidence: number; // e.g. 0.30, 0.60, 0.90
  confidenceBucket: string; // e.g. '30%', '60%', '90%'
  wasCriteriaMet: boolean; // 1 for true, 0 for false
}

export interface CalibrationSummaryReport {
  totalVerifiablePredictions: number;
  brierScore: number;
  overconfidenceBiasIndex: number;
  bucketAccuracies: Record<string, { count: number; successes: number; empiricalAccuracy: number }>;
  interpretationText: string;
}

export class CalibrationEngineService {
  /**
   * Calculates mathematically exact calibration metrics.
   * Zero hallucination, zero math drift.
   */
  static calculateCalibration(dataPoints: CalibrationDataPoint[]): CalibrationSummaryReport {
    const N = dataPoints.length;
    if (N === 0) {
      return {
        totalVerifiablePredictions: 0,
        brierScore: 0,
        overconfidenceBiasIndex: 0,
        bucketAccuracies: {},
        interpretationText: 'אין מספיק נתונים לחישוב כיול.'
      };
    }

    const bucketAccuracies: Record<string, { count: number; successes: number; empiricalAccuracy: number }> = {};
    let sumSquaredError = 0;
    let sumConfidenceMinusOutcome = 0;

    for (const dp of dataPoints) {
      const outcomeVal = dp.wasCriteriaMet ? 1 : 0;
      const bucket = dp.confidenceBucket;

      if (!bucketAccuracies[bucket]) {
        bucketAccuracies[bucket] = { count: 0, successes: 0, empiricalAccuracy: 0 };
      }

      bucketAccuracies[bucket].count += 1;
      if (dp.wasCriteriaMet) {
        bucketAccuracies[bucket].successes += 1;
      }

      // Brier component: (forecast - outcome)^2
      const diff = dp.statedConfidence - outcomeVal;
      sumSquaredError += diff * diff;

      // Overconfidence component: (forecast - outcome)
      sumConfidenceMinusOutcome += (dp.statedConfidence - outcomeVal);
    }

    // Compute empirical accuracy for each bucket
    for (const b of Object.keys(bucketAccuracies)) {
      const bData = bucketAccuracies[b];
      bData.empiricalAccuracy = +(bData.successes / bData.count).toFixed(4);
    }

    const brierScore = +(sumSquaredError / N).toFixed(4);
    const overconfidenceBiasIndex = +(sumConfidenceMinusOutcome / N).toFixed(4);

    let interpretationText = '';
    if (overconfidenceBiasIndex > 0.05) {
      interpretationText = `נטיית ביטחון-יתר מובהקת (מדד ${overconfidenceBiasIndex}+). בממוצע, רמת הביטחון שלך גבוהה ב-${Math.round(overconfidenceBiasIndex * 100)}% משיעור ההצלחה בפועל.`;
    } else if (overconfidenceBiasIndex < -0.05) {
      interpretationText = `נטיית זהירות-יתר / חוסר ביטחון (מדד ${overconfidenceBiasIndex}). אתה צודק יותר ממה שאתה מעריך.`;
    } else {
      interpretationText = `כיול אופטימלי ומאוזן (מדד ${overconfidenceBiasIndex}). הערכות הביטחון שלך תואמות היטב את שיעור ההצלחה האמיתי.`;
    }

    return {
      totalVerifiablePredictions: N,
      brierScore,
      overconfidenceBiasIndex,
      bucketAccuracies,
      interpretationText
    };
  }
}
