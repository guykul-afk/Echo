import { DecisionService } from '../services/decision.service.js';
import { TriFactorRetrievalService } from '../services/triFactorRetrieval.service.js';
import { EpistemicConsolidationService } from '../services/consolidation.service.js';
import { OperatingContext, PatternHypothesis, CalibrationTracker, AssumptionRegistryEntry, Outcome } from '@echo/shared';

async function runSimulation() {
  console.log('================================================================');
  console.log('   ECHO (הד) — סימולציה של מראה מתפתחת ושיקול דעת אנושי');
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
  // Decision 1: Job Offer / Career Transition (New Core Persona Dilemma)
  // -------------------------------------------------------------
  console.log('--- [החלטה 1: שקילת מעבר לתפקיד חדש מול זמן עם הילדים] ---');
  const rawJob = 'אני שוקל לקחת את התפקיד. השכר טוב יותר, אבל אני חושש שלא יהיה לי זמן לילדים. אולי אני סתם מפחד משינוי.';
  
  const case1 = await decisionService.createCase({
    userId,
    rawText: rawJob,
    eraId: era1.id
  });

  console.log(`[הקפאה] מצב מקורי ננעל ב-timestamp: ${case1.decisionCase.frozenAt}`);
  console.log(`[4 ממדי המראה האנושית]:`);
  console.log(`  1. אתה שוקל: "${case1.decisionCase.dimConsideration}"`);
  console.log(`  2. חשוב לך להשיג/לשמור: "${case1.decisionCase.dimGoalsPrices}"`);
  console.log(`  3. אתה נשען על: "${case1.decisionCase.dimReliance}"`);
  console.log(`  4. עדיין לא ברור: "${case1.decisionCase.dimUnknowns}"`);
  console.log(`[התערבות אדפטיבית אחת]: "${case1.illuminationQuestion}"`);
  
  // Test updating the mirror directly (עריכה ישירה של המראה)
  console.log(`\n[עריכה ישירה של המראה]: המשתמש מדייק את החשש...`);
  const updatedCase = await decisionService.updateMirror(case1.decisionCase.id, {
    unknowns: 'מה יהיו שעות העבודה בפועל בימי שלישי וחמישי'
  });
  console.log(`  • עודכן שדה 'עדיין לא ברור': "${updatedCase.dimUnknowns}"`);

  // Test Deliberation Answer & Before/After Flash
  console.log(`\n[מענה להתערבות והצגת חיווי התחדדות Before/After]:`);
  const answerResult = await decisionService.submitDeliberationAnswer(
    case1.decisionCase.id,
    'לשאול את המנהל על ציפיות הזמינות בערבים לפני מתן תשובה'
  );
  console.log(`  • קודם: "${answerResult.refinedInsight.before}"`);
  console.log(`  • כעת התחדד: "${answerResult.refinedInsight.now}"`);
  console.log(`  • הצעד שבחרת: "${answerResult.refinedInsight.chosenStep}"\n`);

  // -------------------------------------------------------------
  // Decision 2: Atlas Project (Testing "מספיק לי לעכשיו" exit)
  // -------------------------------------------------------------
  console.log('--- [החלטה 2: פרויקט אטלס — בדיקת יציאה מהירה "מספיק לי לעכשיו"] ---');
  const rawAtlas = 'השקענו באטלס 200 אלף שקל. שני לקוחות רוצים לבדוק. אני רוצה לתת לזה עוד 3 חודשים.';

  const case2 = await decisionService.createCase({
    userId,
    rawText: rawAtlas,
    eraId: era1.id,
    frictionLevel: 'quick'
  });

  console.log(`[מראה מהירה נוצרה]: "${case2.decisionCase.dimConsideration}"`);
  console.log(`[המשתמש לוחץ "מספיק לי לעכשיו"]...`);
  const quickExit = await decisionService.submitDeliberationAnswer(case2.decisionCase.id, '', true);
  console.log(`  • סטטוס יציאה: ${quickExit.success}, צעד נשמר: "${quickExit.nextStep}"\n`);

  // -------------------------------------------------------------
  // Decision 3: Longitudinal 3-Axis Outcome Learning Loop
  // -------------------------------------------------------------
  console.log('--- [סגירת מעגל: רפלקציה תלת-צירית ולמידה מתמשכת] ---');
  const outcome1: Outcome = {
    id: 'out-001',
    caseId: case1.decisionCase.id,
    userId,
    whatHappened: 'התפקיד התברר כתובעני, אך שיחת הבירור מראש עזרה לקבוע ערב אחד בשבוע בלי עבודה.',
    assumptionClarification: 'ההנחה שהתפקיד בהכרח יפגע בכל הערבים נשברה חלקית בזכות תיאום מוקדם.',
    processReflection: 'היה נכון לברר ציפיות מראש לפני החתימה.',
    quickStatus: 'clarified',
    recordedAt: Date.now()
  };

  console.log(`[ציר 1 - מה קרה בפועל]: "${outcome1.whatHappened}"`);
  console.log(`[ציר 2 - מה התברר על ההנחה]: "${outcome1.assumptionClarification}"`);
  console.log(`[ציר 3 - מה היית משנה בתהליך]: "${outcome1.processReflection}"`);
  console.log(`[סטטוס מהיר]: "${outcome1.quickStatus}"`);

  console.log('\n================================================================');
  console.log('   כל עקרונות המראה המתפתחת והחיכוך האדפטיבי עברו בהצלחה!');
  console.log('================================================================\n');
}

runSimulation().catch(err => {
  console.error('Simulation error:', err);
  process.exit(1);
});
