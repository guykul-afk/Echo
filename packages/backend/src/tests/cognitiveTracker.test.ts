import { handleDecisionCaptured, handleOutcomeLoopClosed, defaultTrackerStore } from '../functions/cognitiveTrackerTriggers.js';
import { getLatestCognitiveProfile } from '../services/insightsService.js';

async function runTest() {
  console.log('=== בדיקת טריגר מונה עדכון הד (3 לכידות / 3 סגירות) ===');
  const userId = 'test-user-guy';

  // Test 1: First capture -> tracker = 1, triggered = false
  const r1 = await handleDecisionCaptured(userId, 'dec-1');
  console.log(`לכידה 1: מונה לכידות = ${r1.updatedTracker.captures_since_last_update}, הופעל פרופיל? ${r1.triggeredNewProfile}`);
  if (r1.updatedTracker.captures_since_last_update !== 1 || r1.triggeredNewProfile) {
    throw new Error('Test 1 failed: Expected captures = 1, triggered = false');
  }

  // Test 2: Second capture -> tracker = 2, triggered = false
  const r2 = await handleDecisionCaptured(userId, 'dec-2');
  console.log(`לכידה 2: מונה לכידות = ${r2.updatedTracker.captures_since_last_update}, הופעל פרופיל? ${r2.triggeredNewProfile}`);
  if (r2.updatedTracker.captures_since_last_update !== 2 || r2.triggeredNewProfile) {
    throw new Error('Test 2 failed: Expected captures = 2, triggered = false');
  }

  // Test 3: Third capture -> tracker resets to 0, triggered = true
  const r3 = await handleDecisionCaptured(userId, 'dec-3');
  console.log(`לכידה 3: מונה לכידות = ${r3.updatedTracker.captures_since_last_update}, הופעל פרופיל? ${r3.triggeredNewProfile}`);
  if (r3.updatedTracker.captures_since_last_update !== 0 || !r3.triggeredNewProfile) {
    throw new Error('Test 3 failed: Expected reset to 0, triggered = true');
  }

  // Test 4: Verify profile is available
  const profile = await getLatestCognitiveProfile(userId);
  console.log(`פרופיל עודכן בהצלחה: מלכודת דיכוטומיה = ${profile?.binary_trap_percentage}%, הצלחת דרך שלישית = ${profile?.third_way_success_rate}%`);
  if (!profile || profile.binary_trap_percentage !== 80) {
    throw new Error('Test 4 failed: Profile not generated as expected');
  }

  // Test 5: Three loop closures trigger profile update
  console.log('\n--- בדיקת סגירת 3 מעגלים ---');
  await handleOutcomeLoopClosed(userId, 'dec-1');
  await handleOutcomeLoopClosed(userId, 'dec-2');
  const c3 = await handleOutcomeLoopClosed(userId, 'dec-3');
  console.log(`סגירה 3: מונה סגירות = ${c3.updatedTracker.closures_since_last_update}, הופעל פרופיל? ${c3.triggeredNewProfile}`);
  if (c3.updatedTracker.closures_since_last_update !== 0 || !c3.triggeredNewProfile) {
    throw new Error('Test 5 failed: Expected closures reset to 0, triggered = true');
  }

  console.log('\n✓ כל בדיקות הטריגר של 3 לכידות / סגירות עברו בהצלחה מלאה!');
}

runTest().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
