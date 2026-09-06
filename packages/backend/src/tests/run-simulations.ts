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

  if (case1.decisionCase.refinedInsight !== undefined) {
    throw new Error('VIOLATION: Refined Insight was generated at capture time!');
  }
  if (case1.decisionCase.nextStep !== undefined) {
    throw new Error('VIOLATION: Next Step was generated at capture time!');
  }
  console.log('[אימות] וודא כי Refined Insight ו-nextStep אינם קיימים בשלב ה-Capture הראשוני.');

  console.log(`[הקפאה] מצב מקורי ננעל ב-timestamp: ${case1.decisionCase.frozenAt}`);
  
  // Phase 1: First 20 Seconds Focus validation
  if (!case1.decisionCase.centralTension || !case1.decisionCase.keyHinge) {
    throw new Error('VIOLATION: First 20 Seconds fields (centralTension, keyHinge) were not populated!');
  }
  console.log(`[20 שניות ראשונות לבהירות]:`);
  console.log(`  • החלטה: "${case1.decisionCase.dimConsideration}"`);
  console.log(`  • מתח מרכזי: "${case1.decisionCase.centralTension}"`);
  console.log(`  • ציר ההכרעה: "${case1.decisionCase.keyHinge}"`);

  // Record Mirror Feedback (מדויק / לא בדיוק)
  const feedbackCase = await decisionService.recordMirrorFeedback(case1.decisionCase.id, 'accurate');
  if (feedbackCase.mirrorFeedback !== 'accurate') {
    throw new Error('Expected mirrorFeedback to be accurate');
  }
  console.log(`  • משוב מראה נרשם בהצלחה: "${feedbackCase.mirrorFeedback}" (מדויק ✓)`);

  console.log(`[4 ממדי המראה האנושית]:`);
  console.log(`  1. אתה שוקל: "${case1.decisionCase.dimConsideration}"`);
  console.log(`  2. חשוב לך להשיג/לשמור: "${case1.decisionCase.dimGoalsPrices}"`);
  console.log(`  3. אתה נשען על: "${case1.decisionCase.dimReliance}"`);
  console.log(`  4. עדיין לא ברור: "${case1.decisionCase.dimUnknowns}"`);
  console.log(`[התערבות אדפטיבית אחת]: "${case1.illuminationQuestion}"`);
  
  // Phase 2: Verify Adaptive Friction & Response Widget
  if (!case1.bespokeQuestion || case1.bespokeQuestion.shouldIntervene !== true) {
    throw new Error('Case 1 should have shouldIntervene === true');
  }
  if (case1.bespokeQuestion.responseWidget !== 'priority') {
    throw new Error(`Expected responseWidget to be 'priority', got ${case1.bespokeQuestion.responseWidget}`);
  }
  console.log(`[Phase 2 Adaptive UI]: ווידג'ט מענה מזוהה: "${case1.bespokeQuestion.responseWidget}", ערך השהייה מחושב (ERV): ${case1.bespokeQuestion.expectedReflectionValue}`);
  
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
  if (case2.bespokeQuestion?.shouldIntervene !== false) {
    throw new Error('Case 2 with quick friction should activate Smart Silence (shouldIntervene === false)');
  }
  if (case2.decisionCase.aiInterventionUsed !== undefined) {
    throw new Error('Case 2 should have undefined aiInterventionUsed when smart silence is active');
  }
  console.log(`  • שקט חכם הופעל בהצלחה: "${case2.bespokeQuestion.smartSilenceMessage}"`);
  console.log(`[המשתמש לוחץ "מספיק לי לעכשיו"]...`);
  const quickExit = await decisionService.submitDeliberationAnswer(case2.decisionCase.id, '', true);
  if (quickExit.nextStep !== 'שמירה והמשך מעקב') {
    throw new Error(`Expected skip nextStep to be 'שמירה והמשך מעקב', got '${quickExit.nextStep}'`);
  }
  console.log(`  • סטטוס יציאה: ${quickExit.success}, צעד נשמר: "${quickExit.nextStep}" (אומת: אין ניחוש של צעד מראש!)\n`);

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

  // -------------------------------------------------------------
  // Phase 3 & 4: Personal Memory, Frozen Snapshot & Retrieval Before Ask
  // -------------------------------------------------------------
  console.log('\n--- [שלב 3 ו-4: זיכרון אישי, הקפאת מצב ומנגנון Retrieval Before Ask] ---');
  const kgService = decisionService.getKnowledgeGraphService();

  // 1. Verify Frozen Snapshot of Case 1
  const snapshot1 = await kgService.getFrozenSnapshot(case1.decisionCase.id);
  if (!snapshot1) {
    throw new Error(`Expected FrozenDecisionSnapshot to exist for case ${case1.decisionCase.id}`);
  }
  if (snapshot1.chosenStep !== 'לשאול את המנהל על ציפיות הזמינות בערבים לפני מתן תשובה') {
    throw new Error(`Unexpected chosenStep in snapshot: ${snapshot1.chosenStep}`);
  }
  console.log(`✓ Frozen Decision Snapshot ננעל ואומת ללא Hindsight Bias [צעד: "${snapshot1.chosenStep}"]`);

  // 2. Verify Retrieval Before Ask on new decision mentioning previous topic
  console.log('[הרצת מקרה החלטה חוזר עם נושא שנמצא בזיכרון האישי]...');
  const followUpCase = await decisionService.createCase({
    userId,
    rawText: 'המנהל מבקש שוב לברר לגבי זמינות בערבים בתפקיד, ואני צריך לתת תשובה סופית.',
    frictionLevel: 'focused'
  });

  if (followUpCase.bespokeQuestion?.responseWidget !== 'confirmation') {
    throw new Error(`Expected bespokeQuestion to be converted to 'confirmation' by RetrievalBeforeAsk, got '${followUpCase.bespokeQuestion?.responseWidget}'`);
  }
  console.log(`✓ Retrieval Before Ask המיר בהצלחה שאלת איסוף לשאלת אישור מהירה:`);
  console.log(`  • שאלה מוצעת: "${followUpCase.bespokeQuestion.questionText}"`);
  console.log(`  • ווידג'ט תגובה: "${followUpCase.bespokeQuestion.responseWidget}"`);
  console.log(`  • אופציות אישור מהיר: [${followUpCase.bespokeQuestion.responseOptions?.join(' | ')}]`);

  // 3. Verify Multi-Tenant Knowledge Isolation
  const strangerAssertions = await kgService.getActiveAssertionsByUser('stranger_user_999');
  if (strangerAssertions.length !== 0) {
    throw new Error('Multi-tenancy memory leak: stranger user could view assertions of another user!');
  }
  console.log('✓ בידוד זיכרון אישי (Zero-Trust Multi-Tenancy Memory) נבדק בהצלחה: 0 זליגות מידע.');

  // -------------------------------------------------------------
  // Decision 4: Anti-Hallucination & Unclear Audio Protection
  // -------------------------------------------------------------
  console.log('\n--- [בדיקה 4: מניעת הזיות ומניעת יצירת מלל מומצא מהקלטה לא ברורה] ---');
  let unclearAudioBlocked = false;
  try {
    const mockUnclearProvider = {
      transcribeAudio: async () => '',
      extractEpistemicSchema: async () => { throw new Error('Should not be called'); }
    };
    const unclearDecisionService = new DecisionService(mockUnclearProvider as any);
    await unclearDecisionService.createCase({
      userId,
      rawAudioBuffer: Buffer.from('unclear-or-silent-audio-bytes')
    });
  } catch (err: any) {
    if (err.message.includes('UNCLEAR_AUDIO')) {
      unclearAudioBlocked = true;
      console.log(`✓ נחסם בהצלחה כצפוי: "${err.message}"`);
      console.log('✓ וודא שלא נוצר מקרה החלטה ולא הומצא מלל גולמי.');
    } else {
      throw err;
    }
  }

  if (!unclearAudioBlocked) {
    throw new Error('FAILED: Unclear audio was not blocked!');
  }

  console.log('\n================================================================');
  console.log('   כל עקרונות המראה המתפתחת ומניעת ההזיות עברו בהצלחה!');
  console.log('================================================================\n');
}

runSimulation().catch(err => {
  console.error('Simulation error:', err);
  process.exit(1);
});
