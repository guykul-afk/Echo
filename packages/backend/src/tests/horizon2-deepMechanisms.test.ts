import { KnowledgeGraphService } from '../services/knowledgeGraph.service.js';
import { RetrievalBeforeAskService } from '../services/retrievalBeforeAsk.service.js';
import { DecisionService } from '../services/decision.service.js';
import { MockAiProvider } from '../ai/providers/mock.provider.js';
import { DeepDecisionMechanisms } from '@echo/shared';

async function runHorizon2Tests() {
  console.log('=== Running Horizon 2 (Deep Decision Mechanisms & Qualified Retrieval) Tests ===\n');
  const userId = 'user_horizon2_eval';
  KnowledgeGraphService.clearUserStore(userId);

  const kg = new KnowledgeGraphService();
  const retrieval = new RetrievalBeforeAskService(kg);

  // 1. Indexing Principles and Qualified Boundaries
  console.log('Test 1: Indexing Operating Principles, Tradeoffs & Qualified Conditions');
  await kg.saveAssertion({
    id: 'asrt-principle-1',
    userId,
    statement: 'לא מוציאים פיתוח ליבה לספקים חיצוניים',
    category: 'principle',
    sourceType: 'user_stated',
    timestamp: Date.now() - 40 * 86400000,
    confidenceLevel: 90,
    createdAt: Date.now() - 40 * 86400000
  });

  await kg.saveAssertion({
    id: 'asrt-tradeoff-1',
    userId,
    statement: 'שימור: שליטה מלאה בליבה | ויתור: מהירות פיתוח ראשונית',
    category: 'tradeoff',
    sourceType: 'ai_inferred',
    timestamp: Date.now() - 40 * 86400000,
    confidenceLevel: 90,
    createdAt: Date.now() - 40 * 86400000
  });

  await kg.saveAssertion({
    id: 'asrt-cond-1',
    userId,
    statement: 'הצוות יכול לעמוד בעומס הפיתוח העצמאי',
    condition: 'כל עוד לא נוסף פרויקט דחוף ברבעון הקרוב',
    category: 'assumption',
    sourceType: 'ai_inferred',
    timestamp: Date.now() - 40 * 86400000,
    confidenceLevel: 85,
    createdAt: Date.now() - 40 * 86400000
  });

  const assertions = await kg.getActiveAssertionsByUser(userId);
  if (assertions.length !== 3) {
    throw new Error(`Expected 3 assertions, got ${assertions.length}`);
  }
  console.log('✓ Successfully indexed Principle, Tradeoff and Qualified Condition in Knowledge Graph.');

  // 2. Retrieval with Deep Decision Mechanisms Matching
  console.log('\nTest 2: Deep Mechanism Matching (Tradeoff & Principle Overlap)');
  const currentMechanisms: DeepDecisionMechanisms = {
    operatingPrinciples: ['לא מוציאים פיתוח ליבה לספקים חיצוניים'],
    tradeoffs: [{
      protectedValue: 'שליטה מלאה בליבה',
      sacrificedValue: 'מהירות פיתוח ראשונית'
    }],
    dominantEvidenceType: 'past_experience',
    dilemmaTopology: 'binary_dichotomy',
    agencyCenter: 'internal'
  };

  // Draft dilemma with different wording (e.g. asking about outsourcing a module)
  const retrievalResult = await retrieval.checkBeforeAsk(
    userId,
    'האם כדאי לשכור צוות קבלני עבור מנוע החיפוש?',
    'אני מתלבט אם לקחת קבלנים לחודשיים כדי לא לעכב את ההשקה',
    currentMechanisms
  );

  if (retrievalResult.assertions.length === 0) {
    throw new Error('Expected deep mechanism retrieval match, but found 0 assertions.');
  }

  console.log(`✓ Deep Retrieval successful: Score = ${retrievalResult.retrievalScore}, Reason = "${retrievalResult.retrievalReason}"`);
  console.log(`✓ Matched Assertion: "${retrievalResult.assertions[0].statement}"`);

  // 3. Qualified Condition Retrieval & Preamble Formatting
  console.log('\nTest 3: Qualified Condition Preamble & Confirmation Question');
  const conditionRetrieval = await retrieval.checkBeforeAsk(
    userId,
    'האם הצוות יכול לעמוד בעומס?',
    'הצוות יכול לעמוד בעומס הפיתוח',
    currentMechanisms
  );

  console.log(`✓ Qualified Memory Preamble: "${conditionRetrieval.memoryPreamble}"`);
  if (conditionRetrieval.confirmationQuestion) {
    console.log(`✓ Qualified Confirmation Question: "${conditionRetrieval.confirmationQuestion}"`);
    if (!conditionRetrieval.confirmationQuestion.includes('סייג')) {
      throw new Error('Expected confirmation question to include qualification (סייג).');
    }
  }

  // 4. DecisionService End-to-End Integration
  console.log('\nTest 4: DecisionService Synchronous Extraction & Deep Storage');
  const mockAi = new MockAiProvider();
  const decisionService = new DecisionService(mockAi, kg, retrieval);

  const session = await decisionService.createCase({
    userId,
    rawText: 'אני שוקל האם להמשיך להשקיע בפרויקט אטלס לעוד 3 חודשים או לעצור'
  });

  if (!session.decisionCase) {
    throw new Error('Failed to create decision case');
  }

  console.log(`✓ Decision Case Created [ID: ${session.decisionCase.id}]`);
  console.log(`✓ Decision Status: "${session.decisionCase.status}"`);
  console.log(`✓ Primary Intervention: "${session.bespokeQuestion?.questionText}"`);

  console.log('\n=============================================================');
  console.log('✅ All Horizon 2 Deep Mechanism Tests Passed Successfully!');
  console.log('=============================================================');
}

runHorizon2Tests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
