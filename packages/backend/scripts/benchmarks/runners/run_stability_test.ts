import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
process.env.COGNITIVE_MODEL = 'gemini-3.6-flash';

import { DecisionService } from '../../../src/services/decision.service.js';
import { GeminiAiProvider } from '../../../src/ai/providers/gemini.provider.js';
import { STABILITY_BENCHMARK, StabilityVariation } from '../fixtures/stability.fixture.js';

const RESULTS_FILE = path.resolve(__dirname, '../../../../../simulations/benchmarks/benchmark_1_stability.md');

const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, 'gemini-3.6-flash');
const decisionService = new DecisionService(geminiProvider);

interface ExtractedVariationResult {
  variation: StabilityVariation;
  consideration: string;
  centralTension: string;
  keyHinge: string;
  assumptions: string;
  question: string;
}

async function judgeHingeEquivalence(hingeA: string, hingeB: string, coreDecision: string): Promise<{ isEquivalent: boolean; similarityScore: number; reason: string }> {
  const prompt = `
אתה שופט סמנטי ומתודולוגי של מערכות קבלת החלטות.
מבחן זה בוחן האם המערכת יציבה ואמינה: שתי פסקאות שנכתבו בסגנונות שונים לאותה דילמה בדיוק ("${coreDecision}") הפיקו שתי הנחות נושאות (Key Hinges):

הנחה נושאת מניסוח א':
"""${hingeA}"""

הנחה נושאת מניסוח ב':
"""${hingeB}"""

הערך:
1. isEquivalent (true/false): האם שתי ההנחות תוקפות את אותו ציר הכרעה מהותי (Invariant Core Hinge), למרות הבדלי ניסוח קלים? (true = אותה נקודת שבר, false = צירים שונים לחלוטין).
2. similarityScore (0-100): ציון דמיון מהותי בין שני הצירים.
3. reason: הסבר תמציתי בעברית.

החזר בפורמט JSON בלבד:
{"isEquivalent": true, "similarityScore": 85, "reason": "..."}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
      })
    });
    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(raw);
  } catch (e: any) {
    return { isEquivalent: false, similarityScore: 50, reason: `כשל בשיפוט: ${e.message}` };
  }
}

export async function runStabilityBenchmark() {
  console.log('=== Starting Benchmark 1: Stability / Invariance Test (5 Variations) ===');
  console.log(`Core Dilemma: "${STABILITY_BENCHMARK.coreDecision}"`);

  const reportHeader = `# בנצ'מרק 1: מבחן היציבות — האם המראה אמינה? (Stability & Invariance Test)
**תאריך ריצה:** ${new Date().toISOString().split('T')[0]}  
**מטרה מתודולוגית:** בדיקה האם ניסוחים שונים של אותו תוכן החלטתי מובילים לאותה הנחה נושאת (\`keyHinge\`) ואותו מתח מרכזי, או שהמערכת מוסטת מניואנסים טקסטואליים רגעיים.  
**דילמת הליבה שנבדקה:** "${STABILITY_BENCHMARK.coreDecision}"  
**ציר האמת המצופה (True Invariant Hinge):** "${STABILITY_BENCHMARK.expectedTrueHinge}"  

---

`;

  fs.writeFileSync(RESULTS_FILE, reportHeader);

  const results: ExtractedVariationResult[] = [];

  for (const v of STABILITY_BENCHMARK.variations) {
    console.log(`\n[Variation ${v.variationIndex}/5] ${v.label}...`);
    const caseResult = await decisionService.createCase({
      userId: `stability_test_user_${v.variationIndex}`,
      rawText: v.rawCapture,
      frictionLevel: 'deep'
    });

    const session = caseResult.decisionCase;
    const keyHinge = session.dimAssumptions || session.centralTension || 'לא חולץ ציר';

    results.push({
      variation: v,
      consideration: session.dimConsideration || '',
      centralTension: session.centralTension || '',
      keyHinge,
      assumptions: session.dimAssumptions || '',
      question: caseResult.illuminationQuestion || ''
    });

    const formatQuote = (s: string) => s.split('\n').map(l => '> ' + l).join('\n');

    const entry = [
      `## ניסוח מס' ${v.variationIndex}: ${v.label}`,
      `- **סגנון ניסוח:** ${v.styleDescription}`,
      ``,
      `**טקסט הקלט שהוזן למערכת:**`,
      formatQuote(v.rawCapture),
      ``,
      `### ממדי המראה שחולצו על ידי ECHO`,
      `- **מה נשקל (Consideration):** ${session.dimConsideration}`,
      `- **מתח מרכזי (Central Tension):** ${session.centralTension || 'N/A'}`,
      `- **הנחות ציר / מפתח (Key Hinges):** ${session.dimAssumptions}`,
      `- **שאלת ההארה שנבחרה:** ${caseResult.illuminationQuestion}`,
      ``,
      `---`,
      ``
    ].join('\n');

    fs.appendFileSync(RESULTS_FILE, entry);
  }

  // Pairwise Equivalence Matrix across all 5 variations (10 pairs)
  console.log('\nEvaluating Pairwise Hinge Equivalence across all 10 variation pairs...');
  let pairwiseComparisonTable = `\n# ניתוח עקביות הדדי (Pairwise Invariance Matrix)\n\n` +
    `השוואה של כל זוג ניסוחים אפשרי (10 השוואות סה"כ) לבחינת יציבות ה-Key Hinge:\n\n` +
    `| זוג ניסוחים | האם אותו ציר הכרעה? | ציון דמיון סמנטי | נימוק השופט |\n` +
    `| :--- | :--- | :--- | :--- |\n`;

  let equivalentPairsCount = 0;
  let totalScore = 0;
  let totalPairs = 0;

  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      totalPairs++;
      const resA = results[i];
      const resB = results[j];
      const pairVerdict = await judgeHingeEquivalence(resA.keyHinge, resB.keyHinge, STABILITY_BENCHMARK.coreDecision);

      if (pairVerdict.isEquivalent) equivalentPairsCount++;
      totalScore += pairVerdict.similarityScore;

      pairwiseComparisonTable += `| ניסוח ${resA.variation.variationIndex} ↔ ניסוח ${resB.variation.variationIndex} | ${pairVerdict.isEquivalent ? '✅ עקבי (אותו ציר)' : '❌ לא עקבי (ציר שונה)'} | ${pairVerdict.similarityScore}% | ${pairVerdict.reason} |\n`;
    }
  }

  const stabilityIndex = Math.round((equivalentPairsCount / totalPairs) * 100);
  const avgSimilarity = Math.round(totalScore / totalPairs);

  const summarySection = `\n${pairwiseComparisonTable}\n
# דוח מסכם: מדד יציבות המראה (Stability Index)

| מדד יציבות | ערך נמדד | ניתוח מתודולוגי |
| :--- | :--- | :--- |
| **מדד עקביות הציר (Stability Index)** | **${equivalentPairsCount} / ${totalPairs} (${stabilityIndex}%)** | אחוז הזוגות שבהם המערכת זיהתה בדיוק את אותו ציר הכרעה למרות שינוי סגנון קיצוני |
| **ציון דמיון סמנטי ממוצע** | **${avgSimilarity}%** | ממוצע הדמיון המהותי בין צירי ההכרעה שחולצו על פני 5 הסגנונות |
| **מסקנה סופית** | ${stabilityIndex >= 80 ? '🟢 המראה יציבה ועמידה לשינויי ניסוח' : '🔴 המראה מוטה משינויי סגנון ואינה עקבית'} | ${stabilityIndex >= 80 ? 'המערכת הוכיחה חסינות מלאה לסגנון הדיבור (ישיר, רגשי, פיננסי, מוסרי או תזזיתי) וחלצה את אותו ציר נושא.' : 'קיימת תלות יתר ברמת הרגש או המילים הספציפיות, מה שדורש כיול של שלב ה-Extraction.'} |
`;

  fs.appendFileSync(RESULTS_FILE, summarySection);
  console.log('\n=== Benchmark 1 Summary ===');
  console.log(`Stability Index: ${equivalentPairsCount}/${totalPairs} (${stabilityIndex}%)`);
  console.log(`Average Semantic Similarity: ${avgSimilarity}%`);
  console.log(`Report written to ${RESULTS_FILE}`);
}

if (process.argv[1] && process.argv[1].includes('run_stability_test')) {
  runStabilityBenchmark().catch(console.error);
}
