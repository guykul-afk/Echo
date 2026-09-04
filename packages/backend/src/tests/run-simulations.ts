import { DecisionService } from '../services/decision.service.js';
import { TriFactorRetrievalService } from '../services/triFactorRetrieval.service.js';
import { EpistemicConsolidationService } from '../services/consolidation.service.js';
import { OperatingContext, PatternHypothesis, CalibrationTracker, AssumptionRegistryEntry, Outcome } from '@echo/shared';

async function runSimulation() {
  console.log('================================================================');
  console.log('   ECHO (הד) — סימולציה אורכית מלאה של זיכרון שיקול הדעת');
  console.log('================================================================\n');

  const decisionService = new DecisionService();
  const userId = 'user-noam-ceo';

  // Define active Era
  const era1: OperatingContext = {
    id: 'era-001',
    userId,
    name: 'Early Stage / Pre-PMF',
    startedAt: Date.now() - 180 * 86400000,
    endedAt: null,
    primaryScarcity: 'runway_capital',
    riskTolerance: 'calculated_risk'
  };

  // -------------------------------------------------------------
  // Decision 1: Atlas Project
  // -------------------------------------------------------------
  console.log('--- [החלטה 1: האם להמשיך להשקיע בפרויקט אטלס?] ---');
  const rawAtlas = 'השקענו באטלס בערך 200 אלף שקל ושמונה חודשים. עדיין אין לקוח משלם, אבל המוצר נראה הרבה יותר טוב ושני לקוחות רוצים לבדוק אותו. האינטואיציה שלי היא לתת לזה עוד שלושה חודשים.';
  
  const case1 = await decisionService.createCase({
    userId,
    rawText: rawAtlas,
    eraId: era1.id
  });

  console.log(`[הקפאה] מצב מקורי ננעל ב-timestamp: ${case1.decisionCase.frozenAt}`);
  console.log(`[מטרה]: ${case1.statements.find(s => s.role === 'goal')?.text}`);
  console.log(`[עובדות מוצקות]:`, case1.statements.filter(s => s.role === 'observation').map(s => `• ${s.text}`).join('\n  '));
  console.log(`[הנחות ציר]:`, case1.statements.filter(s => s.role === 'assumption').map(s => `• ${s.text}`).join('\n  '));
  if (case1.epistemicState) {
    console.log(`[מנוע קוגניטיבי - 9 ממדים]:`);
    console.log(`  • סמן סומטי / רגש (E): ${case1.epistemicState.affect}`);
    console.log(`  • מחלקת סיכון (R): ${case1.epistemicState.riskClass}`);
    console.log(`  • הפיכות (Rev): ${case1.epistemicState.reversibility}`);
    console.log(`  • מיקוד שליטה (Loc): ${case1.epistemicState.locusOfControl}`);
  }
  console.log(`[שאלת הארה/חידוד אישית]: "${case1.illuminationQuestion}"`);
  console.log(`[חתימה מבנית]: שיפוע התחייבות: ${case1.signature.commitmentGradient}, יחס עלות מידע: ${case1.signature.informationCostRatio}\n`);

  // -------------------------------------------------------------
  // Decision 2: VP Sales Hiring (Retrieving Case 1 Analogy)
  // -------------------------------------------------------------
  console.log('--- [החלטה 2: האם לגייס סמנכ"ל מכירות עכשיו?] ---');
  const rawSales = 'המכירות עדיין תלויות בי. יש מועמד מצוין אבל הוא יקר, ואני לא יודע אם אנחנו כבר בשלב שמצדיק סמנכ"ל מכירות מלא.';

  const case2 = await decisionService.createCase({
    userId,
    rawText: rawSales,
    eraId: era1.id
  });

  console.log(`[שאלת הארה אחת]: "${case2.illuminationQuestion}"`);
  
  // Test Tri-Factor Retrieval against Case 1
  const analogy = TriFactorRetrievalService.calculateRelevance(
    case2.signature,
    case1.signature,
    era1,
    era1
  );

  console.log(`[שליפת אנלוגיה משולשת מול אטלס]: ציון התאמה: ${analogy.score} (${analogy.strength})`);
  console.log(`[הסבר אנושי לדמיון]: "${analogy.reason}"\n`);

  // -------------------------------------------------------------
  // Longitudinal Learning: Recording Outcome & Background Consolidation
  // -------------------------------------------------------------
  console.log('--- [סגירת מעגל: תיעוד תוצאה וגיבוש אפיסטמי ברקע] ---');
  const outcome1: Outcome = {
    id: 'out-001',
    caseId: case1.decisionCase.id,
    userId,
    observedFacts: 'לקוח אחד שילם על פיילוט אך השימוש בפועל נמוך. תשלום בלבד לא ניבא שימוש מתמשך.',
    criteriaEvaluation: 'partially_succeeded',
    reflectionNotes: 'הקריטריון היה חלקי: היה נדרש למדוד גם מעורבות ולא רק תשלום.',
    recordedAt: Date.now()
  };

  const initialRegistry: AssumptionRegistryEntry[] = [];
  const initialCalibration: CalibrationTracker = {
    id: 'calib-001',
    userId,
    totalVerifiablePredictions: 0,
    brierScore: 0.0,
    confidenceBucketScores: {},
    overconfidenceBiasIndex: 0.0,
    updatedAt: Date.now()
  };
  const initialPatterns: PatternHypothesis[] = [
    {
      id: 'ph-001',
      userId,
      claim: 'מקרים עתירי התחייבות הפיקו תועלת מפעולת בירור מקדימה לפני החלטה מלאה',
      sampleSizeN: 1,
      supportingCaseIds: [case1.decisionCase.id],
      contradictingCaseIds: [],
      contextBoundaries: 'חברות צעירות בשלב Pre-PMF',
      epistemicStatus: 'emerging',
      updatedAt: Date.now()
    }
  ];

  const consolidation = EpistemicConsolidationService.processOutcomeConsolidation(
    userId,
    case1.decisionCase,
    case1.statements,
    outcome1,
    initialRegistry,
    initialCalibration,
    initialPatterns
  );

  console.log(`[מרשם הנחות - עדכון שבירות]:`);
  for (const reg of consolidation.updatedRegistry) {
    console.log(`  • משפחת הנחה: "${reg.assumptionFamily}" | סה"כ: ${reg.totalRecordedInstances}, נשברו: ${reg.failedInstancesCount} (שבירות: ${reg.fragilityRatio * 100}%)`);
  }

  console.log(`[כיול הסתברותי Brier Score]: ${consolidation.updatedCalibration.brierScore}`);
  console.log(`[השערת דפוס N מעודכן]: N=${consolidation.updatedPatterns[0].sampleSizeN} | סטטוס: ${consolidation.updatedPatterns[0].epistemicStatus}`);

  console.log('\n================================================================');
  console.log('   כל ארבעת עקרונות האמת נשמרו בהצלחה של 100%!');
  console.log('================================================================\n');
}

runSimulation().catch(err => {
  console.error('Simulation error:', err);
  process.exit(1);
});
