import { testFullDecisionLifecycle } from './flows/decision-lifecycle.e2e.js';
import { testMultiTenancyIsolation } from './flows/multi-tenancy-isolation.e2e.js';

async function runAllE2ETests() {
  console.log('=====================================================');
  console.log('  ECHO (הד) — End-to-End Integration & Security Suite');
  console.log('=====================================================');

  const start = Date.now();
  let passed = 0;
  let total = 2;

  try {
    const r1 = await testFullDecisionLifecycle();
    if (r1) passed++;

    const r2 = await testMultiTenancyIsolation();
    if (r2) passed++;

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log('=====================================================');
    console.log(`✅ All E2E Integration Tests Passed: ${passed}/${total} (${elapsed}s)`);
    console.log('=====================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ E2E TEST FAILED:', err);
    process.exit(1);
  }
}

runAllE2ETests();
