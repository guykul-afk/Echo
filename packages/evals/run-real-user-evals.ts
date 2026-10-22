import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load root and local .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { DecisionService } from '@echo/backend/dist/services/decision.service.js';
import { GeminiAiProvider } from '@echo/backend/dist/ai/providers/gemini.provider.js';
import { MockAiProvider } from '@echo/backend/dist/ai/providers/mock.provider.js';
import { DeterministicEvaluator } from './evaluators/deterministic.eval.js';
import { LlmJudgeEvaluator } from './evaluators/llm-judge.eval.js';
import { MarkdownReporter, CaseEvalReportEntry } from './reporters/markdown-reporter.js';

interface RawDecisionCycle {
  id: string;
  title: string;
  rawVerbatim: string;
  userId: string;
  goal?: string;
  riskBadge?: string;
  locusBadge?: string;
}

async function runRealUserEvals() {
  const args = process.argv.slice(2);
  const isFast = args.includes('--fast');
  const isAll = args.includes('--all');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : (isAll ? 50 : 10);

  console.log('\n================================================================');
  console.log('    ECHO (הד) — Real User Evaluation Suite (גיא קולסקי)         ');
  console.log('================================================================');
  console.log(`Target User: Guy_Kuleski (משתמש האמת)`);
  console.log(`Source Data: DECISION_CYCLES.json`);
  console.log(`Mode: ${isFast ? 'FAST (Deterministic & Schema only)' : 'FULL (Including Gemini 3.6 Flash Judge)'}`);
  console.log(`Evaluation Philosophy: Zero-Trust Deep Verification (Raw Transcripts)`);
  console.log('----------------------------------------------------------------\n');

  const startTime = Date.now();

  // 1. Load Real User Decisions
  const decisionCyclesPath = path.resolve(__dirname, '../../DECISION_CYCLES.json');
  if (!fs.existsSync(decisionCyclesPath)) {
    console.error(`❌ DECISION_CYCLES.json not found at: ${decisionCyclesPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(decisionCyclesPath, 'utf-8'));
  const allDecisions: RawDecisionCycle[] = rawData.decisions || [];

  // Filter for authentic, meaningful decisions (excluding greetings like "מה נשמע")
  const meaningful = allDecisions.filter(d => 
    d.rawVerbatim && 
    d.rawVerbatim.trim().length > 25 &&
    !d.rawVerbatim.startsWith('מה נשמע')
  );

  console.log(`Total real decisions in store: ${allDecisions.length}`);
  console.log(`Authentic meaningful decisions: ${meaningful.length}`);
  console.log(`Evaluating batch of: ${Math.min(limit, meaningful.length)} cases\n`);

  const selectedDecisions = meaningful.slice(0, limit);

  // 2. Initialize Decision Service with real AI Provider
  const apiKey = process.env.GEMINI_API_KEY;
  const aiProvider = (process.env.AI_PROVIDER === 'gemini' && apiKey)
    ? new GeminiAiProvider(apiKey)
    : new MockAiProvider();

  console.log(`Provider in use: ${aiProvider instanceof GeminiAiProvider ? 'Gemini AI Provider (Active API)' : 'Mock AI Provider'}\n`);

  const decisionService = new DecisionService(aiProvider);
  const caseReportEntries: CaseEvalReportEntry[] = [];
  let index = 0;

  for (const d of selectedDecisions) {
    index++;
    const title = d.title || `דילמה אותנטית ${index}`;
    process.stdout.write(`  (${index}/${selectedDecisions.length}) "${title}" [${d.id}]... `);

    try {
      const session = await decisionService.createCase({
        userId: 'Guy_Kuleski',
        userName: 'גיא',
        userGender: 'male',
        rawText: d.rawVerbatim,
        frictionLevel: 'focused'
      });

      // 1. Deterministic evaluation (Schema, Facts purity, Male gender agreement, No grading)
      const deterministicRes = DeterministicEvaluator.evaluate(session, {
        gender: 'male'
      });

      // 2. LLM-as-a-Judge evaluation (Flash Judge)
      let judgeRes = undefined;
      if (!isFast) {
        judgeRes = await LlmJudgeEvaluator.evaluateCase(
          title,
          d.rawVerbatim,
          session
        );
      }

      const hasFailures = !deterministicRes.passed;
      const statusIcon = hasFailures ? '⚠️ ' : '✅';
      const judgeSummary = judgeRes ? ` | Judge Score: ${judgeRes.overallScore}/100` : '';
      console.log(`${statusIcon} Schema: ${deterministicRes.score}%${judgeSummary}`);

      if (hasFailures) {
        for (const fail of deterministicRes.failures) {
          console.log(`     └─ ❌ ${fail}`);
        }
      }
      if (judgeRes && judgeRes.warnings.length > 0) {
        for (const w of judgeRes.warnings) {
          console.log(`     └─ ⚠️ [Judge Warning] ${w}`);
        }
      }

      caseReportEntries.push({
        caseId: d.id,
        title,
        domain: 'authentic_real_user',
        frictionLevel: 'focused',
        userGender: 'male',
        rawInput: d.rawVerbatim,
        systemOutput: session,
        deterministicResult: deterministicRes,
        judgeResult: judgeRes
      });
    } catch (err: any) {
      console.log(`❌ CRITICAL CRASH: ${err.message}`);
      caseReportEntries.push({
        caseId: d.id,
        title,
        domain: 'authentic_real_user',
        frictionLevel: 'focused',
        userGender: 'male',
        rawInput: d.rawVerbatim,
        systemOutput: { error: err.message },
        deterministicResult: {
          passed: false,
          score: 0,
          failures: [`Execution crash: ${err.message}`]
        }
      });
    }
  }

  // 3. Generate Zero-Trust Report
  console.log('\n[Reporting] Generating Zero-Trust Deep Verification Report for Real User...');
  const durationSeconds = (Date.now() - startTime) / 1000;
  const reportContent = MarkdownReporter.generateReport(
    caseReportEntries,
    [],
    durationSeconds
  );

  const reportsDir = path.join(__dirname, 'reports');
  const savedReportPath = MarkdownReporter.saveReportToFile(reportContent, reportsDir);
  const realUserReportPath = path.join(reportsDir, 'real-user-eval-report.md');
  fs.writeFileSync(realUserReportPath, reportContent, 'utf-8');

  console.log(`  📄 Real User Report generated successfully:`);
  console.log(`     -> ${savedReportPath}`);
  console.log(`     -> ${realUserReportPath}`);

  // Summary Metrics
  const passedCases = caseReportEntries.filter(c => c.deterministicResult.passed).length;
  const avgJudge = caseReportEntries.filter(c => c.judgeResult).length > 0
    ? Math.round(caseReportEntries.reduce((acc, c) => acc + (c.judgeResult?.overallScore || 0), 0) / caseReportEntries.filter(c => c.judgeResult).length)
    : 'N/A';

  console.log('\n================================================================');
  console.log(`  REAL USER EVALS COMPLETED in ${durationSeconds.toFixed(2)}s`);
  console.log(`  User: Guy_Kuleski (גיא קולסקי)`);
  console.log(`  Deterministic Pass Rate: ${passedCases}/${caseReportEntries.length} (${Math.round((passedCases / caseReportEntries.length) * 100)}%)`);
  console.log(`  Average Flash Judge Score: ${avgJudge} / 100`);
  console.log('================================================================\n');

  process.exit(0);
}

runRealUserEvals().catch(err => {
  console.error('Fatal real user evaluation error:', err);
  process.exit(1);
});
