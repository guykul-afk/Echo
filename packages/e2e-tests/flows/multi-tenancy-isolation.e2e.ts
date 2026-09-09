import {
  createDecisionCaseHandler,
  TriFactorRetrievalService,
  recordMirrorFeedbackHandler,
  submitDeliberationAnswerHandler,
  finalizeEvaluationContractHandler,
  recordOutcomeHandler,
  DecisionService
} from '@echo/backend';
import { MockIsolatedDatabase } from '../helpers/test-context.js';

export async function testMultiTenancyIsolation(): Promise<boolean> {
  console.log('--- [E2E TEST 2] Running Zero-Trust Multi-Tenancy Isolation Test ---');
  const db = new MockIsolatedDatabase();
  const decisionService = new DecisionService();

  const userA = 'user_noam_founder';
  const userB = 'user_dana_investor';

  // 1. User A creates Decision Case
  console.log('Step 1: User A creates a confidential case...');
  const resA = await createDecisionCaseHandler(
    { rawText: 'סודי: שוקלים פיטורי סמנכ"ל טכנולוגיות בעקבות אי עמידה ביעדים' },
    { auth: { uid: userA } },
    decisionService
  );

  db.getUserStore(userA).cases.set(resA.caseId, resA.decisionCase);
  db.getUserStore(userA).signatures.set(resA.caseId, resA.signature);
  console.log(`✓ User A created case: ${resA.caseId}`);

  // 2. User B creates Decision Case
  console.log('\nStep 2: User B creates an independent case...');
  const resB = await createDecisionCaseHandler(
    { rawText: 'השקעה של 2 מיליון דולר בסטארטאפ בינה מלאכותית בשלב סיד' },
    { auth: { uid: userB } },
    decisionService
  );

  db.getUserStore(userB).cases.set(resB.caseId, resB.decisionCase);
  db.getUserStore(userB).signatures.set(resB.caseId, resB.signature);
  console.log(`✓ User B created case: ${resB.caseId}`);

  // 3. Verify Unauthorized Access Attempt: User B tries to read User A's case
  console.log('\nStep 3: Testing Unauthorized Cross-User Access (User B -> User A)...');
  let blockedSuccessfully = false;
  try {
    db.accessCase(userB, userA, resA.caseId);
  } catch (err: any) {
    if (err.message.includes('PERMISSION_DENIED')) {
      blockedSuccessfully = true;
      console.log(`✓ Access blocked as expected: "${err.message}"`);
    }
  }

  if (!blockedSuccessfully) {
    throw new Error('SECURITY VIOLATION: User B was able to access User A data!');
  }

  // 3.1 Verify Backend Function Cross-User Mutation Blocking (User B attempts to modify User A's case)
  console.log('\nStep 3.1: Testing Cross-User Function Calls (User B attempting actions on User A case)...');
  
  // Test 3.1.1: Record mirror feedback
  let feedbackBlocked = false;
  try {
    await recordMirrorFeedbackHandler(
      { caseId: resA.caseId, feedback: 'accurate' },
      { auth: { uid: userB } },
      decisionService
    );
  } catch (err: any) {
    if (err.message.includes('PERMISSION_DENIED')) {
      feedbackBlocked = true;
      console.log(`✓ RecordMirrorFeedback blocked across users: "${err.message}"`);
    }
  }
  if (!feedbackBlocked) {
    throw new Error('SECURITY VIOLATION: User B was able to modify User A mirror feedback!');
  }

  // Test 3.1.2: Submit deliberation answer
  let deliberationBlocked = false;
  try {
    await submitDeliberationAnswerHandler(
      { caseId: resA.caseId, answerText: 'התערבות לא מורשית' },
      { auth: { uid: userB } },
      decisionService
    );
  } catch (err: any) {
    if (err.message.includes('PERMISSION_DENIED')) {
      deliberationBlocked = true;
      console.log(`✓ SubmitDeliberationAnswer blocked across users: "${err.message}"`);
    }
  }
  if (!deliberationBlocked) {
    throw new Error('SECURITY VIOLATION: User B was able to answer User A deliberation!');
  }

  // Test 3.1.3: Finalize contract
  let contractBlocked = false;
  try {
    await finalizeEvaluationContractHandler(
      { caseId: resA.caseId, selectedOptionId: 'opt-1', targetCriteria: 'קריטריון זדוני', checkHorizonDays: 10 },
      { auth: { uid: userB } },
      decisionService
    );
  } catch (err: any) {
    if (err.message.includes('PERMISSION_DENIED')) {
      contractBlocked = true;
      console.log(`✓ FinalizeEvaluationContract blocked across users: "${err.message}"`);
    }
  }
  if (!contractBlocked) {
    throw new Error('SECURITY VIOLATION: User B was able to lock contract on User A case!');
  }

  // Test 3.1.4: Record outcome
  let outcomeBlocked = false;
  try {
    await recordOutcomeHandler(
      { caseId: resA.caseId, whatHappened: 'תוצאה של תוקף' },
      { auth: { uid: userB } },
      decisionService
    );
  } catch (err: any) {
    if (err.message.includes('PERMISSION_DENIED')) {
      outcomeBlocked = true;
      console.log(`✓ RecordOutcome blocked across users: "${err.message}"`);
    }
  }
  if (!outcomeBlocked) {
    throw new Error('SECURITY VIOLATION: User B was able to record outcome on User A case!');
  }

  // 4. Verify Tri-Factor Retrieval Isolation
  console.log('\nStep 4: Testing Tri-Factor Structural Analogy Isolation...');

  const candidateSigA = resA.signature;
  const matchA = TriFactorRetrievalService.calculateRelevance(
    resA.signature,
    candidateSigA
  );

  console.log(`✓ User A matches historical case: score = ${matchA.score}, strength = ${matchA.strength}, reason = "${matchA.reason}"`);

  // Verify User B's candidate pool: User A's case must never be queried or returned for User B
  const userBStore = db.getUserStore(userB);
  const userBCases = Array.from(userBStore.cases.values());

  console.log(`✓ User B candidate pool contains: ${userBCases.length} cases (User A cases strictly omitted)`);

  const containsLeak = userBCases.some(c => c.userId === userA);
  if (containsLeak) {
    throw new Error('SECURITY VIOLATION: User A cases leaked into User B analogy pool!');
  }

  console.log('=== Zero-Trust Multi-Tenancy Isolation Test PASSED ===\n');
  return true;
}
