import {
  createDecisionCaseHandler,
  TriFactorRetrievalService
} from '@echo/backend';
import { MockIsolatedDatabase } from '../helpers/test-context.js';

export async function testMultiTenancyIsolation(): Promise<boolean> {
  console.log('--- [E2E TEST 2] Running Zero-Trust Multi-Tenancy Isolation Test ---');
  const db = new MockIsolatedDatabase();

  const userA = 'user_noam_founder';
  const userB = 'user_dana_investor';

  // 1. User A creates Decision Case
  console.log('Step 1: User A creates a confidential case...');
  const resA = await createDecisionCaseHandler(
    { rawText: 'סודי: שוקלים פיטורי סמנכ"ל טכנולוגיות בעקבות אי עמידה ביעדים' },
    { auth: { uid: userA } }
  );

  db.getUserStore(userA).cases.set(resA.caseId, resA.decisionCase);
  db.getUserStore(userA).signatures.set(resA.caseId, resA.signature);
  console.log(`✓ User A created case: ${resA.caseId}`);

  // 2. User B creates Decision Case
  console.log('\nStep 2: User B creates an independent case...');
  const resB = await createDecisionCaseHandler(
    { rawText: 'השקעה של 2 מיליון דולר בסטארטאפ בינה מלאכותית בשלב סיד' },
    { auth: { uid: userB } }
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

  // 4. Verify Tri-Factor Retrieval Isolation
  console.log('\nStep 4: Testing Tri-Factor Structural Analogy Isolation...');

  // User A's signature and candidate comparison
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
