import {
  createDecisionCaseHandler,
  submitDeliberationAnswerHandler,
  finalizeEvaluationContractHandler,
  recordOutcomeHandler,
  EpistemicConsolidationService
} from '@echo/backend';
import { MockIsolatedDatabase } from '../helpers/test-context.js';

export async function testFullDecisionLifecycle(): Promise<boolean> {
  console.log('\n--- [E2E TEST 1] Running Full Decision Lifecycle Flow ---');
  const db = new MockIsolatedDatabase();
  const userId = 'user_noam_founder';
  const userStore = db.getUserStore(userId);

  // 1. CAPTURE & FREEZE (Tier 1 Model 3.5 Transcribe -> Raw Freeze -> Tier 2 Model 3.6 Cognitive Engine)
  console.log('Step 1: Audio Capture -> Model 3.5 Transcribe -> Verbatim Freeze -> Model 3.6 Cognitive Reasoning...');
  const spokenAudioContent = `אנחנו מתלבטים האם להמשיך להשקיע בפרויקט אטלס לעוד 3 חודשים.
השקענו כבר 200 אלף ש"ח ו-8 חודשי עבודה.
אין לנו לקוח משלם עדיין, אבל שני לקוחות אמרו שהם רוצים לבדוק את זה לעומק.
אני חושש שאם נפסיק עכשיו כל ההשקעה תרד לטמיון.`;

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

  console.log(`✓ Tier 1 (Model 3.5 Transcribe): High-fidelity Hebrew audio transcribed & frozen [ID: ${caseId}]`);
  console.log(`✓ Tier 2 (Model 3.6 Cognitive Engine): Extracted ${captureResponse.statements.length} epistemic statements`);
  console.log(`✓ Status: ${captureResponse.decisionCase.status} (deliberating)`);
  console.log(`✓ Illumination Question: "${captureResponse.illuminationQuestion}"`);

  // 2. ANSWER ILLUMINATION QUESTION
  console.log('\nStep 2: Submitting Answer to Illumination Question...');
  const answerResponse = await submitDeliberationAnswerHandler(
    {
      caseId,
      answerText: 'נציע פיילוט בתשלום סמלי של 5,000 ש"ח בתוך שבועיים במקום להמתין 3 חודשים.'
    },
    { auth: { uid: userId } }
  );

  if (!answerResponse.success) {
    throw new Error('Answer submission failed');
  }
  userStore.statements.get(caseId)!.push(answerResponse.statement);
  console.log(`✓ Deliberation statement appended: "${answerResponse.statement.text}"`);

  // 3. FINALIZE EVALUATION CONTRACT (LOCK BEFORE OUTCOME)
  console.log('\nStep 3: Finalizing Evaluation Contract & Locking Case...');
  const contractResponse = await finalizeEvaluationContractHandler(
    {
      caseId,
      selectedOptionId: captureResponse.options[1]?.id || 'opt-pilot',
      targetCriteria: 'לפחות לקוח אחד ישלם 5,000 ש"ח עבור פיילוט עד תום השבועיים',
      checkHorizonDays: 14,
      falsificationSignal: 'אף לקוח אינו מוכן לשלם עבור פיילוט'
    },
    { auth: { uid: userId } }
  );

  if (!contractResponse.success || contractResponse.status !== 'contract_locked') {
    throw new Error('Contract finalization failed');
  }
  userStore.contracts.set(caseId, contractResponse.contract);
  const currentCase = userStore.cases.get(caseId)!;
  currentCase.status = 'contract_locked';

  console.log(`✓ Evaluation Contract locked: Criterion = "${contractResponse.contract.targetCriteria}"`);
  console.log(`✓ Review Date set to: ${new Date(contractResponse.contract.reviewDate).toISOString()}`);

  // 4. RECORD OUTCOME (REAL-WORLD RESULT)
  console.log('\nStep 4: Recording Real-World Outcome...');
  const outcomeResponse = await recordOutcomeHandler(
    {
      caseId,
      actualResultSummary: 'שני הלקוחות סירבו לשלם 5,000 ש"ח על הפיילוט וטענו שהמוצר לא בראש סדר העדיפויות שלהם.',
      wasCriteriaMet: false,
      unexpectedLearnings: 'נכונות לבדוק בחינם לא העידה כלל על נכונות לשלם. גילינו זאת בשבועיים במקום בעוד 3 חודשים.',
      satisfactionScore: 0.85
    },
    { auth: { uid: userId } }
  );

  if (!outcomeResponse.success) {
    throw new Error('Outcome recording failed');
  }
  userStore.outcomes.set(caseId, outcomeResponse.outcome);

  // 5. EPISTEMIC CONSOLIDATION (LONGITUDINAL ASSETS UPDATE)
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

  console.log(`✓ Assumption Registry updated: ${userStore.registry.length} families tracked`);
  userStore.registry.forEach(r => {
    console.log(`  • Family: ${r.assumptionFamily} | Fragility: ${r.fragilityRatio} (${r.failedInstancesCount}/${r.totalRecordedInstances})`);
  });
  console.log(`✓ Calibration Brier Score updated: ${userStore.calibration.brierScore}`);
  console.log(`✓ Pattern Hypotheses: ${userStore.patterns.length} tracked`);

  // 6. VERIFY RULE #1 OF TRUTH: FROZEN RAW TEXT UNTOUCHED
  if (currentCase.rawCaptureText !== spokenAudioContent) {
    throw new Error('VIOLATION: Raw frozen text was altered during lifecycle!');
  }
  console.log('\n✓ Rule #1 of Truth Verified: Original raw capture remained 100% frozen & immutable.');
  console.log('=== Decision Lifecycle E2E Test PASSED ===\n');
  return true;
}
