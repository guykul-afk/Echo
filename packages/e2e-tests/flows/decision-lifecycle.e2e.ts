import {
  createDecisionCaseHandler,
  submitDeliberationAnswerHandler,
  finalizeEvaluationContractHandler,
  recordOutcomeHandler,
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
      falsificationSignal: 'דרישת זמינות מוחלטת בכל יום'
    },
    { auth: { uid: userId } }
  );

  if (!contractResponse.success || contractResponse.status !== 'contract_locked') {
    throw new Error('Contract finalization failed');
  }
  userStore.contracts.set(caseId, contractResponse.contract);
  const currentCase = userStore.cases.get(caseId)!;
  currentCase.status = 'contract_locked';

  console.log(`✓ Contract recorded: Criterion = "${contractResponse.contract.targetCriteria}"`);

  // 4. RECORD 3-AXIS CONTINUOUS LEARNING OUTCOME
  console.log('\nStep 4: Recording 3-Axis Continuous Learning Outcome...');
  const outcomeResponse = await recordOutcomeHandler(
    {
      caseId,
      whatHappened: 'התפקיד תובעני, אך שיחת הבירור מראש אפשרה לקבוע ערב אחד קבוע בלי עבודה.',
      assumptionClarification: 'החשש המקורי נפתר חלקית בעקבות שיחה מוקדמת.',
      processReflection: 'היה נכון לברר זאת בשלב מוקדם עוד יותר.',
      quickStatus: 'clarified',
      wasCriteriaMet: true
    },
    { auth: { uid: userId } }
  );

  if (!outcomeResponse.success) {
    throw new Error('Outcome recording failed');
  }
  userStore.outcomes.set(caseId, outcomeResponse.outcome);
  console.log(`✓ 3-Axis Outcome recorded:`);
  console.log(`   - מה קרה בפועל: "${outcomeResponse.outcome.whatHappened}"`);
  console.log(`   - מה התברר על ההנחה: "${outcomeResponse.outcome.assumptionClarification}"`);
  console.log(`   - מה היית משנה: "${outcomeResponse.outcome.processReflection}"`);
  console.log(`   - סטטוס מהיר: "${outcomeResponse.outcome.quickStatus}"`);

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
