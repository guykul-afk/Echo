import { KnowledgeGraphService } from '../services/knowledgeGraph.service.js';
import { RetrievalBeforeAskService } from '../services/retrievalBeforeAsk.service.js';

async function runPhase1Tests() {
  console.log('=== Running Phase 1 (Memory & Epistemic Safety) Tests ===\n');
  const userId = 'test_user_phase1';
  KnowledgeGraphService.clearUserStore(userId);

  const kg = new KnowledgeGraphService();
  const retrieval = new RetrievalBeforeAskService(kg);

  // 1. Test Atomic Assertion: Max 120 Characters
  console.log('Test 1: Atomic Assertion Statement Max 120 Characters');
  const longStatement = 'זהו משפט ארוך במיוחד שנועד לבדוק האם המערכת מקצצת כראוי הצהרות עודפות מעבר למאה ועשרים תווים כדי למנוע שמירת פסקאות שלמות כעובדות קשיחות בגרף הידע האפיסטמי';
  const savedLong = await kg.saveAssertion({
    id: 'asrt-long',
    userId,
    statement: longStatement,
    sourceType: 'user_stated',
    timestamp: Date.now(),
    confidenceLevel: 90,
    createdAt: Date.now()
  });

  if (savedLong.statement.length > 120) {
    throw new Error(`Expected statement <= 120 chars, got ${savedLong.statement.length}`);
  }
  if (!savedLong.statement.endsWith('...')) {
    throw new Error('Expected truncated statement to end with ellipsis');
  }
  console.log(`✓ Assertion correctly capped at ${savedLong.statement.length} characters (<= 120)`);

  // 2. Test Contradiction Retrieval
  console.log('\nTest 2: Contradiction Retrieval (Opposing Memories)');
  KnowledgeGraphService.clearUserStore(userId);

  // User previously prioritized stability
  await kg.saveAssertion({
    id: 'asrt-stab',
    userId,
    statement: 'מעדיף יציבות ושמירה על הקיים בפרויקטים הבאים',
    sourceType: 'user_stated',
    sentimentOrPolarity: 'risk_averse',
    timestamp: Date.now() - 30 * 86400000,
    confidenceLevel: 90,
    createdAt: Date.now() - 30 * 86400000
  });

  // User now shows risk seeking
  const riskAssertion = await kg.saveAssertion({
    id: 'asrt-risk',
    userId,
    statement: 'רוצה לקחת סיכון משמעותי ולהיכנס לשוק חדש',
    sourceType: 'user_stated',
    sentimentOrPolarity: 'risk_seeking',
    timestamp: Date.now(),
    confidenceLevel: 90,
    createdAt: Date.now()
  });

  const contradictions = await kg.findContradictingAssertions(userId, riskAssertion);
  if (contradictions.length === 0) {
    throw new Error('Expected to find opposing stability assertion for risk seeking statement');
  }
  console.log(`✓ Opposing memory found: "${contradictions[0].statement}"`);

  // 3. Test Novelty Gate (Suppression after confirmation)
  console.log('\nTest 3: Novelty Gate (Never badger user repeatedly)');
  KnowledgeGraphService.clearUserStore(userId);

  const confirmedAssertion = await kg.saveAssertion({
    id: 'asrt-pattern',
    userId,
    statement: 'בפרויקט נדל"ן אני עובד רק עם מפקח צמוד',
    sourceType: 'user_stated',
    timestamp: Date.now() - 5 * 86400000,
    confidenceLevel: 95,
    createdAt: Date.now() - 5 * 86400000
  });

  // Check 1: First time inquiry allows confirmation
  const check1 = await retrieval.checkBeforeAsk(
    userId,
    'האם תיקח מפקח צמוד לפרויקט?',
    'אנחנו מתחילים פרויקט נדל"ן חדש'
  );
  if (!check1.shouldConvertToConfirmation) {
    throw new Error('First time check should convert to confirmation');
  }
  console.log('✓ First inquiry allows confirmation');

  // User confirms assertion twice
  await kg.recordAssertionConfirmation(userId, confirmedAssertion.id, true);
  await kg.recordAssertionConfirmation(userId, confirmedAssertion.id, true);

  // Check 2: After confirmation, Novelty Gate blocks repeated questions
  const check2 = await retrieval.checkBeforeAsk(
    userId,
    'האם תיקח מפקח צמוד לפרויקט?',
    'אנחנו מתחילים פרויקט נדל"ן חדש'
  );
  if (check2.shouldConvertToConfirmation) {
    throw new Error('Novelty Gate failed: confirmed pattern was asked again!');
  }
  console.log('✓ Novelty Gate successfully suppressed re-asking confirmed pattern');

  // 4. Test Memory Budget: Max 1-2 Memories
  console.log('\nTest 4: Memory Budget');
  if (check2.assertions.length > 2) {
    throw new Error(`Expected assertions <= 2, got ${check2.assertions.length}`);
  }
  console.log(`✓ Memory budget enforced: returned ${check2.assertions.length} assertions (<= 2)`);

  console.log('\n=== All Phase 1 Tests Passed Successfully! ===');
}

runPhase1Tests().catch(err => {
  console.error('Phase 1 Test Failed:', err);
  process.exit(1);
});
