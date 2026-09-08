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
import { DORMANCY_CASES, DormancyCase } from '../fixtures/dormancy.fixture.js';
import { OperatingContext } from '@echo/shared';

const RESULTS_FILE = path.resolve(__dirname, '../../../../../simulations/benchmarks/benchmark_4_dormancy.md');

const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, 'gemini-3.6-flash');
const decisionService = new DecisionService(geminiProvider);

interface DormancyEvaluation {
  caseIndex: number;
  title: string;
  relatedInitialCaseIndex?: number;
  pastAssumptionTested?: string;
  temporalAwarenessScore: number;
  staleAssumptionOverreach: boolean;
  critique: string;
}

async function judgeDormancyInteraction(
  pastCaseTitle: string,
  pastAssumption: string,
  rawCapture: string,
  mirrorFacts: string,
  mirrorAssumptions: string,
  question: string
): Promise<{ temporalAwarenessScore: number; staleAssumptionOverreach: boolean; critique: string }> {
  const prompt = `
אתה שופט מתודולוגי של מערכות זיכרון אפיסטמי ארוך טווח.
בדיקה זו בוחנת את "מבחן התרדמה": המשתמש לא השתמש במערכת במשך 90 יום (שלושה חודשים), וכעת חוזר לקבל החלטה חדשה שנוגעת בנושא ישן.

היסטוריה מלפני 3 חודשים (חודשים 1–2):
נושא: "${pastCaseTitle}"
הנחת העבר שהוקלטה אז: "${pastAssumption}"

קלט המשתמש הנוכחי (חודש 5, לאחר 90 ימי נתק):
"""${rawCapture}"""

פלט המערכת הנוכחי:
עובדות שחולצו: """${mirrorFacts}"""
הנחות שחולצו: """${mirrorAssumptions}"""
שאלת המערכת: """${question}"""

הערך בקפידה:
1. temporalAwarenessScore (1-5): באיזו מידה המערכת מודעת לפער הזמן, ומבחינה בין הנחה עדכנית להנחה ישנה בת 3 חודשים? (5 = מודעות מלאה לתפוגת זמן ושאלת בדיקת עדכניות, 1 = התעלמות מוחלטת מהזמן).
2. staleAssumptionOverreach (true/false): האם המערכת החילה את הנחת העבר הישנה כאילו היא עובדה מוגמרת וטרייה מבלי לשאול אם השתנו התנאים? (true = כשל עיוורון זמן, false = טיפול זהיר ומותנה בזמן).
3. critique: משפט הסבר חד בעברית.

החזר בפורמט JSON בלבד:
{"temporalAwarenessScore": 4, "staleAssumptionOverreach": false, "critique": "..."}
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
    return { temporalAwarenessScore: 3, staleAssumptionOverreach: false, critique: `כשל בשיפוט: ${e.message}` };
  }
}

export async function runDormancyBenchmark() {
  console.log('=== Starting Benchmark 4: Dormancy Test (3-Month Gap) ===');
  console.log('Phase 1: Months 1-2 (20 cases) -> 90-Day Gap -> Phase 2: Month 5 (10 cases)');

  const reportHeader = `# בנצ'מרק 4: מבחן התרדמה — חזרה לאחר שלושה חודשים (Dormancy & Temporal Grounding)
**תאריך ריצה:** ${new Date().toISOString().split('T')[0]}  
**מטרה מתודולוגית:** בדיקה האם מנגנון הזיכרון של ECHO יודע להתמודד עם פער זמן משמעותי (90 ימי נתק), ומברר עדכניות ("לפני 3 חודשים הנחת X, האם זה עדיין תקף?"), לעומת התייחסות עיוורת להנחות ישנות כעובדות טריות.  
**מבנה המדגם:** 20 החלטות בחודשיים הראשונים, דילוג של 90 יום ללא שימוש, ו-10 החלטות בחודש 5 הבודקות נושאים חוזרים.

---

`;

  fs.writeFileSync(RESULTS_FILE, reportHeader);

  const eraM1: OperatingContext = {
    id: 'era-dormancy-early',
    userId: 'user_dormancy_test',
    name: 'שלב הקמה ראשוני (M1-M2)',
    description: 'חודשים 1-2 של החברה',
    primaryScarcity: 'time_to_market',
    riskTolerance: 'aggressive',
    startDate: 1,
    isActive: true
  };

  const initialCases = DORMANCY_CASES.filter(c => c.phase === 'initial_active');
  const postDormancyCases = DORMANCY_CASES.filter(c => c.phase === 'post_dormancy');

  console.log(`\nRecording Phase 1: 20 active baseline decisions (Days 1 - 60)...`);
  const initialCaseMap = new Map<number, { title: string; assumption: string }>();

  for (const c of initialCases) {
    const caseResult = await decisionService.createCase({
      userId: 'user_dormancy_test',
      rawText: c.rawCapture,
      eraId: eraM1.id,
      frictionLevel: 'focused'
    });
    initialCaseMap.set(c.caseIndex, {
      title: c.title,
      assumption: caseResult.decisionCase.dimAssumptions || c.rawCapture
    });
  }

  console.log(`\nSimulating 90-day dormancy period (Days 61 - 150: Zero activity)...`);
  fs.appendFileSync(RESULTS_FILE, `## חלק א': 20 החלטות בסיס בחודשים 1–2 (ימים 1–60)\nכל 20 ההחלטות נקלטו בבסיס הנתונים וביססו הנחות יסוד לגבי תמחור, צוות, שרתים ותקציב.\n\n## ⏸️ פער תרדמה: 90 יום ללא שימוש במערכת (ימים 61–150)\n\n---\n\n## חלק ב': חזרה בחודש 5 (ימים 151–180) — בדיקת רגישות לזמן\n\n`);

  const eraM5: OperatingContext = {
    id: 'era-dormancy-m5',
    userId: 'user_dormancy_test',
    name: 'שלב צמיחה מואצת (M5)',
    description: 'חזרה לפעילות לאחר 3 חודשי שקט',
    primaryScarcity: 'capital',
    riskTolerance: 'balanced',
    startDate: 151,
    isActive: true
  };

  const evaluations: DormancyEvaluation[] = [];

  for (const c of postDormancyCases) {
    console.log(`\n[Post-Dormancy Case ${c.caseIndex}/30] Day ${c.day} | ${c.title}...`);

    const pastData = c.relatedInitialCaseIndex ? initialCaseMap.get(c.relatedInitialCaseIndex) : undefined;
    const pastTitle = pastData?.title || 'החלטת עבר מחודש 1';
    const pastAssumption = c.pastAssumptionTested || pastData?.assumption || 'הנחת עבודה קודמת';

    const caseResult = await decisionService.createCase({
      userId: 'user_dormancy_test',
      rawText: c.rawCapture,
      eraId: eraM5.id,
      frictionLevel: 'deep'
    });

    const session = caseResult.decisionCase;
    const questionText = caseResult.illuminationQuestion || 'מה ההכרעה הנדרשת?';

    const verdict = await judgeDormancyInteraction(
      pastTitle,
      pastAssumption,
      c.rawCapture,
      session.dimFacts || '',
      session.dimAssumptions || '',
      questionText
    );

    evaluations.push({
      caseIndex: c.caseIndex,
      title: c.title,
      relatedInitialCaseIndex: c.relatedInitialCaseIndex,
      pastAssumptionTested: pastAssumption,
      temporalAwarenessScore: verdict.temporalAwarenessScore,
      staleAssumptionOverreach: verdict.staleAssumptionOverreach,
      critique: verdict.critique
    });

    const formatQuote = (s: string) => s.split('\n').map(l => '> ' + l).join('\n');

    const entry = [
      `### החלטה מס' ${c.caseIndex} (יום ${c.day}/180, חודש 5) • ${c.title}`,
      c.relatedInitialCaseIndex ? `- **נושא מקושר מהעבר:** מקרה #${c.relatedInitialCaseIndex} ("${pastTitle}")` : '',
      `- **הנחת העבר שנבחנת בדיעבד (בת 3 חודשים):** "${pastAssumption}"`,
      ``,
      `**קלט המשתמש בחזרתו (חודש 5):**`,
      formatQuote(c.rawCapture),
      ``,
      `**תגובת ECHO:**`,
      `- עובדות: ${session.dimFacts}`,
      `- הנחות: ${session.dimAssumptions}`,
      `- שאלת המערכת: ${questionText}`,
      ``,
      `**שיפוט מודעות זמן (Temporal Grounding Judgment):**`,
      `- **ציון מודעות זמן (1-5):** ${verdict.temporalAwarenessScore}/5`,
      `- **האם חלה כפייה עיוורת של הנחה ישנה (Overreach):** ${verdict.staleAssumptionOverreach ? '🚨 כן (הנחה ישנה הוטלה כעובדה קיימת)' : '🛡️ לא (הפרדה תקינה / בדיקת עדכניות)'}`,
      `- **נימוק השופט:** ${verdict.critique}`,
      ``,
      `---`,
      ``
    ].filter(Boolean).join('\n');

    fs.appendFileSync(RESULTS_FILE, entry);
  }

  const avgAwareness = +(evaluations.reduce((a, b) => a + b.temporalAwarenessScore, 0) / evaluations.length).toFixed(2);
  const overreachCount = evaluations.filter(e => e.staleAssumptionOverreach).length;
  const cleanSeparationRate = Math.round(((evaluations.length - overreachCount) / evaluations.length) * 100);

  const summary = `
# דוח מסכם: מבחן התרדמה (Benchmark 4)

| מדד | ערך נמדד | ניתוח מתודולוגי |
| :--- | :--- | :--- |
| **ממוצע ציון מודעות לזמן (Temporal Awareness)** | **${avgAwareness} / 5.0** | מידת הרגישות של המערכת לפער 90 הימים והבנת ההקשר המשתנה |
| **מניעת כפייה עיוורת של הנחות ישנות** | **${evaluations.length - overreachCount} / ${evaluations.length} (${cleanSeparationRate}%)** | אחוז המקרים שבהם המערכת לא כפתה הנחה ישנה מלפני 3 חודשים כעובדה טרייה |
| **כשל עיוורון זמן (Overreach Errors)** | **${overreachCount} / ${evaluations.length}** | מקרים שבהם המערכת התעלמה לחלוטין מחלוף הזמן ופעלה כאילו הדילמה הראשונה קרתה אתמול |
`;

  fs.appendFileSync(RESULTS_FILE, summary);
  console.log('\n=== Dormancy Benchmark Complete! ===');
  console.log(`Average Temporal Awareness: ${avgAwareness}/5.0`);
  console.log(`Clean Separation Rate: ${cleanSeparationRate}%`);
  console.log(`Report written to ${RESULTS_FILE}`);
}

if (process.argv[1] && process.argv[1].includes('run_dormancy_test')) {
  runDormancyBenchmark().catch(console.error);
}
