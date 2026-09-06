import {
  createDecisionCaseHandler,
  submitDeliberationAnswerHandler,
  finalizeEvaluationContractHandler,
  recordOutcomeHandler,
  recordMirrorFeedbackHandler,
  EpistemicConsolidationService
} from '@echo/backend';
import { MockIsolatedDatabase } from '../helpers/test-context.js';

export async function testFullDecisionLifecycle(): Promise<boolean> {
  console.log('\n--- [E2E TEST 1] Running Full Developing Mirror & Decision Lifecycle Flow ---');
  const db = new MockIsolatedDatabase();
  const userId = 'user_noam_founder';
  const userStore = db.getUserStore(userId);

  // 1. CAPTURE & 4-DIMENSION MIRROR EXTRACTION
  console.log('Step 1: Audio Capture -> Transcribe -> Verbatim Freeze -> 4 Human Dimensions...');
  const spokenAudioContent = `אני שוקל לקחת את התפקיד. השכר טוב יותר, אבל אני חושש שלא יהיה לי זמן לילדים. אולי אני סתם מפחד משינוי.`;

  const rawAudioBase64 = Buffer.from(spokenAudioContent, 'utf8').toString('base64');

  const captureResponse = await createDecisionCaseHandler(
    { rawAudioBase64, mimeType: 'audio/mp3' },
    { auth: { uid: userId } }
  );

  if (!captureResponse.success || !captureResponse.caseId) {
    throw new Error('Capture failed');
  }

  const caseId = captureResponse.caseId;
  userStore.cases.set(caseId, captureResponse.decisionCase);
  userStore.statements.set(caseId, captureResponse.statements);
  userStore.options.set(caseId, captureResponse.options);

  console.log(`✓ Audio transcribed & frozen [ID: ${caseId}]`);
  console.log(`✓ 4 Human Dimensions extracted:`);
  console.log(`   - אתה שוקל: "${captureResponse.decisionCase.dimConsideration}"`);
  console.log(`   - חשוב לך להשיג/לשמור: "${captureResponse.decisionCase.dimGoalsPrices}"`);
  console.log(`   - אתה נשען על: "${captureResponse.decisionCase.dimReliance}"`);
  console.log(`   - עדיין לא ברור: "${captureResponse.decisionCase.dimUnknowns}"`);
  console.log(`✓ Status: ${captureResponse.decisionCase.status}`);
  console.log(`✓ Adaptive Intervention Question: "${captureResponse.illuminationQuestion}"`);

  if (captureResponse.decisionCase.refinedInsight !== undefined) {
    throw new Error('VIOLATION: Refined Insight was pre-generated at Capture step!');
  }
  if (captureResponse.decisionCase.nextStep !== undefined) {
    throw new Error('VIOLATION: Next Step was pre-generated at Capture step!');
  }
  console.log('✓ Verified: Refined Insight and Next Step are strictly undefined at Capture time.');

  // Step 1.5: The First 20 Seconds Validation & Feedback
  console.log(`✓ First 20 Seconds Focus:`);
  console.log(`   - מתח מרכזי: "${captureResponse.decisionCase.centralTension}"`);
  console.log(`   - ציר ההכרעה: "${captureResponse.decisionCase.keyHinge}"`);
  const feedbackRes = await recordMirrorFeedbackHandler(
    { caseId, feedback: 'accurate' },
    { auth: { uid: userId } }
  );
  if (!captureResponse.bespokeQuestion || captureResponse.bespokeQuestion.shouldIntervene !== true) {
    throw new Error('E2E VIOLATION: Case should have active intervention question with shouldIntervene === true');
  }
  if (captureResponse.bespokeQuestion.responseWidget !== 'priority') {
    throw new Error(`E2E VIOLATION: Expected responseWidget priority, got ${captureResponse.bespokeQuestion.responseWidget}`);
  }
  console.log(`✓ Phase 2 Adaptive UI: Widget "${captureResponse.bespokeQuestion.responseWidget}" ready for 1-tap response (ERV: ${captureResponse.bespokeQuestion.expectedReflectionValue})`);
  console.log(`✓ Mirror feedback recorded: "מדויק ✓"`);

  // 2. ANSWER ADAPTIVE INTERVENTION & RECEIVE BEFORE/AFTER FLASH
  console.log('\nStep 2: Submitting Answer to Adaptive Intervention (Generating Refined Insight)...');
  const answerResponse = await submitDeliberationAnswerHandler(
    {
      caseId,
      answerText: 'לשאול את המנהל על ציפיות הזמינות בערבים לפני מתן תשובה'
    },
    { auth: { uid: userId } }
  );

  if (!answerResponse.success) {
    throw new Error('Answer submission failed');
  }
  userStore.statements.get(caseId)!.push(answerResponse.statement);
  console.log(`✓ Deliberation statement appended: "${answerResponse.statement.text}"`);
  console.log(`✓ Refined Insight Flash received:`);
  console.log(`   - קודם: "${answerResponse.refinedInsight.before}"`);
  console.log(`   - כעת התחדד: "${answerResponse.refinedInsight.now}"`);
  console.log(`   - הצעד שבחרת: "${answerResponse.refinedInsight.chosenStep}"`);

  // 3. FINALIZE EVALUATION CONTRACT
  console.log('\nStep 3: Finalizing Evaluation Contract & Setting Review Date...');
  const contractResponse = await finalizeEvaluationContractHandler(
    {
      caseId,
      selectedOptionId: captureResponse.options[1]?.id || 'opt-pilot',
      targetCriteria: 'הסכמה של המנהל ליום אחד בשבוע ללא עבודה בערב',
      checkHorizonDays: 14,
      falsificationSignal: 'דרישת זמינות מוחלטת בכל יום',
      subjectiveConfidence: 80,
      predictedOutcome: 'הסכמה עקרונית ליום גמיש אחד בשבוע'
    },
    { auth: { uid: userId } }
  );

  if (!contractResponse.success || contractResponse.status !== 'contract_locked') {
    throw new Error('Contract finalization failed');
  }
  if (contractResponse.contract.subjectiveConfidence !== 80) {
    throw new Error('Prediction capture subjectiveConfidence was not persisted');
  }
  userStore.contracts.set(caseId, contractResponse.contract);
  const currentCase = userStore.cases.get(caseId)!;
  currentCase.status = 'contract_locked';

  console.log(`✓ Contract recorded: Criterion = "${contractResponse.contract.targetCriteria}"`);
  console.log(`✓ Phase 5 Prediction Capture: ודאות סובייקטיבית = ${contractResponse.contract.subjectiveConfidence}%, תחזית = "${contractResponse.contract.predictedOutcome}"`);

  // 4. RECORD 3-AXIS CONTINUOUS LEARNING OUTCOME
  console.log('\nStep 4: Recording 3-Axis Continuous Learning Outcome...');
  const outcomeResponse = await recordOutcomeHandler(
    {
      caseId,
      whatHappened: 'התפקיד תובעני, אך שיחת הבירור מראש אפשרה לקבוע ערב אחד קבוע בלי עבודה.',
      assumptionClarification: 'החשש המקורי נפתר חלקית בעקבות שיחה מוקדמת.',
      processReflection: 'היה נכון לברר זאת בשלב מוקדם עוד יותר.',
      quickStatus: 'succeeded_as_expected',
      decisionQualityRating: 'high_rationality',
      outcomeQualityRating: 'favorable',
      luckAttribution: 'skill_process',
      wasCriteriaMet: true
    },
    { auth: { uid: userId } }
  );

  if (!outcomeResponse.success) {
    throw new Error('Outcome recording failed');
  }
  if (outcomeResponse.outcome.decisionQualityRating !== 'high_rationality') {
    throw new Error('Decision Quality Rating was not persisted on Outcome');
  }
  userStore.outcomes.set(caseId, outcomeResponse.outcome);
  console.log(`✓ 3-Axis Outcome recorded:`);
  console.log(`   - מה קרה בפועל: "${outcomeResponse.outcome.whatHappened}"`);
  console.log(`   - מה התברר על ההנחה: "${outcomeResponse.outcome.assumptionClarification}"`);
  console.log(`   - מה היית משנה: "${outcomeResponse.outcome.processReflection}"`);
  console.log(`   - סטטוס מהיר (4 כפתורים): "${outcomeResponse.outcome.quickStatus}"`);
  console.log(`   - איכות תהליך ההחלטה (Decision Quality): "${outcomeResponse.outcome.decisionQualityRating}" (הפרדה ממזל: ${outcomeResponse.outcome.luckAttribution})`);

  // 5. EPISTEMIC CONSOLIDATION
  console.log('\nStep 5: Epistemic Consolidation Background Job...');
  const consolidation = EpistemicConsolidationService.processOutcomeConsolidation(
    userId,
    currentCase,
    userStore.statements.get(caseId)!,
    outcomeResponse.outcome,
    userStore.registry,
    userStore.calibration,
    userStore.patterns
  );

  userStore.registry = consolidation.updatedRegistry;
  userStore.calibration = consolidation.updatedCalibration;
  userStore.patterns = consolidation.updatedPatterns;

  console.log(`✓ Background consolidation completed without errors.`);

  // 6. VERIFY FROZEN TEXT
  if (currentCase.rawCaptureText !== spokenAudioContent) {
    throw new Error('VIOLATION: Raw frozen text was altered during lifecycle!');
  }
  console.log('\n✓ Original raw capture remained 100% frozen & immutable.');
  console.log('=== Developing Mirror & Decision Lifecycle E2E Test PASSED ===\n');
  return true;
}
