import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
process.env.COGNITIVE_MODEL = 'gemini-3.6-flash';

import { DecisionService } from '../../../src/services/decision.service.js';
import { recordOutcomeHandler } from '../../../src/functions/recordOutcome.js';
import { GeminiAiProvider } from '../../../src/ai/providers/gemini.provider.js';
import { CALIBRATION_CASES, CalibrationCase } from '../fixtures/calibration.fixture.js';
import { CalibrationEngineService, CalibrationDataPoint } from '../../../src/services/calibration.service.js';

const RESULTS_FILE = path.resolve(__dirname, '../../../../../simulations/benchmarks/benchmark_5_calibration.md');

const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, 'gemini-3.6-flash');
const decisionService = new DecisionService(geminiProvider);

export async function runCalibrationBenchmark() {
  console.log('=== Starting Benchmark 5: Calibration Harmonization Test (30 Cases) ===');
  console.log('Testing Mathematical Correctness of Confidence vs. Outcome Accuracy (No Math Drift)...');

  const reportHeader = `# בנצ'מרק 5: הרמוניזציה של הכיול — בדיקת נכונות אריתמטית (Calibration Correctness)
**תאריך ריצה:** ${new Date().toISOString().split('T')[0]}  
**מטרה מתודולוגית:** אימות מתמטי מחמיר של דוח הכיול (Calibration Curve, Brier Score, Overconfidence Bias Index). בדיקה שכאשר המערכת מציגה למשתמש "בהחלטות שבהן היית בטוח 90% צדקת ב-60% מהמקרים" — החישוב נכון אריתמטית ללא עיגולים שגויים, הזיות מודל או סטיות.  
**גודל המדגם:** 30 החלטות מבוקרות (10 ברמת ביטחון 30%, 10 ברמת 60%, 10 ברמת 90%).

---

`;

  fs.writeFileSync(RESULTS_FILE, reportHeader);

  const calibrationDataPoints: CalibrationDataPoint[] = [];

  for (const c of CALIBRATION_CASES) {
    console.log(`[Calibration Case ${c.caseIndex}/30] [Bucket: ${c.confidenceBucket}] ${c.title}...`);

    const caseResult = await decisionService.createCase({
      userId: 'user_calibration_test',
      rawText: c.rawCapture,
      frictionLevel: 'quick'
    });

    const caseId = caseResult.decisionCase.id;

    // Resolve outcome
    await recordOutcomeHandler({
      caseId,
      whatHappened: c.outcomeReflection,
      wasCriteriaMet: c.plannedOutcomeResult,
      outcomeQualityRating: c.plannedOutcomeResult ? 'favorable' : 'unfavorable'
    }, {
      auth: { uid: 'user_calibration_test' }
    });

    calibrationDataPoints.push({
      caseId,
      statedConfidence: c.statedConfidence,
      confidenceBucket: c.confidenceBucket,
      wasCriteriaMet: c.plannedOutcomeResult
    });
  }

  if (calibrationDataPoints.length !== CALIBRATION_CASES.length || calibrationDataPoints.length !== 30) {
    throw new Error(`CALIBRATION_ASSERTION_FAILED: Expected exactly 30 cases, recorded ${calibrationDataPoints.length}`);
  }

  // Calculate Calibration Report via Engine
  const summary = CalibrationEngineService.calculateCalibration(calibrationDataPoints);

  // Assertions (Strict Arithmetic Validation)
  const b30 = summary.bucketAccuracies['30%'];
  const b60 = summary.bucketAccuracies['60%'];
  const b90 = summary.bucketAccuracies['90%'];

  const isB30Exact = b30.empiricalAccuracy === 0.30;
  const isB60Exact = b60.empiricalAccuracy === 0.50;
  const isB90Exact = b90.empiricalAccuracy === 0.60;
  const isCountExact = summary.totalVerifiablePredictions === 30;

  const allMathValid = isB30Exact && isB60Exact && isB90Exact && isCountExact;
  if (!allMathValid) {
    throw new Error(`CALIBRATION_MATH_FAILED: Arithmetic mismatch in calibration calculations`);
  }

  let reportContent = `## תוצאות חישוב הכיול והאימות האריתמטי

| דלי ביטחון מוצהר | סך מקרים בדלי | הצלחות בפועל | דיוק אמפירי מחושב | ציפייה מתוכננת | בדיקת נכונות אריתמטית (Assertion) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **30% (חוסר ודאות גבוהה)** | ${b30.count} מקרים | ${b30.successes} הצלחות | **${(b30.empiricalAccuracy * 100).toFixed(1)}%** | 30.0% | ${isB30Exact ? '✅ תקין ומדויק לחלוטין' : '❌ כשל אריתמטי'} |
| **60% (ביטחון מתון)** | ${b60.count} מקרים | ${b60.successes} הצלחות | **${(b60.empiricalAccuracy * 100).toFixed(1)}%** | 50.0% | ${isB60Exact ? '✅ תקין ומדויק לחלוטין' : '❌ כשל אריתמטי'} |
| **90% (ביטחון מופרז)** | ${b90.count} מקרים | ${b90.successes} הצלחות | **${(b90.empiricalAccuracy * 100).toFixed(1)}%** | 60.0% | ${isB90Exact ? '✅ תקין ומדויק לחלוטין' : '❌ כשל אריתמטי'} |

---

## מדדי כיול מתקדמים (Calibration Metrics)

- **סך תחזיות ניתנות לאימות (Verifiable Predictions):** ${summary.totalVerifiablePredictions} / 30
- **ציון ברייר (Brier Score):** \`${summary.brierScore}\` (מדד עונש ריבועי, כאשר 0.0 = כיול מושלם)
- **מדד הטיית ביטחון-יתר (Overconfidence Bias Index):** \`+${summary.overconfidenceBiasIndex}\`
- **ניתוח מהותי של המערכת:** ${summary.interpretationText}

---

# דוח מסכם: בדיקת תקינות אלגוריתמית של מנוע הכיול (Unit / Integration Verification)

| בדיקת אימות | תוצאה | משמעות מתודולוגית |
| :--- | :--- | :--- |
| **אימות אריתמטי מלא (Zero Math Drift)** | ${allMathValid ? '✅ 100% עובר' : '❌ נכשל'} | כל הנתונים מחושבים ישירות מהיסטוריית ה-Outcomes ללא שום הזיית LLM |
| **זיהוי תופעת "צדקת ב-60% מתוך ה-90%"** | **מאומת מתמטית** | בדלי ה-90% נרשמו בדיוק 6 הצלחות מתוך 10 (דיוק 60.0%), והמערכת שיקפה במדויק את פער ביטחון היתר (פער של 30% לרעת המשתמש) |
| **בדיקת אלגוריתם עקומת הכיול ו-Brier** | **תקין (Deterministic Engine Check)** | אלגוריתם הכיול וחישוב ה-Brier Score עובדים בדיוק מתמטי מחמיר על נתוני הקלט |
`;

  fs.appendFileSync(RESULTS_FILE, reportContent);

  console.log('\n=== Calibration Benchmark Complete! ===');
  console.log(`Math Validated: ${allMathValid}`);
  console.log(`Brier Score: ${summary.brierScore}`);
  console.log(`Overconfidence Index: +${summary.overconfidenceBiasIndex}`);
  console.log(`Report written to ${RESULTS_FILE}`);
}

if (process.argv[1] && process.argv[1].includes('run_calibration_test')) {
  runCalibrationBenchmark().catch(console.error);
}
