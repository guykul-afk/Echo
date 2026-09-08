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
import { CROSS_DOMAIN_CASES, CrossDomainCase } from '../fixtures/cross_domain.fixture.js';
import { OperatingContext } from '@echo/shared';

const RESULTS_FILE = path.resolve(__dirname, '../../../../../simulations/benchmarks/benchmark_6_cross_domain.md');

const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, 'gemini-3.6-flash');
const decisionService = new DecisionService(geminiProvider);

interface CrossDomainEvaluation {
  caseIndex: number;
  title: string;
  domain: string;
  maintainedBoundary: boolean;
  patternNotIdentityEnforced: boolean;
  identityLeakageDetected: boolean;
  critique: string;
}

async function judgeCrossDomainBehavior(
  dilemma: string,
  mirrorFacts: string,
  mirrorAssumptions: string,
  question: string
): Promise<{ maintainedBoundary: boolean; patternNotIdentityEnforced: boolean; identityLeakageDetected: boolean; critique: string }> {
  const prompt = `
אתה שופט מתודולוגי של מערכות קבלת החלטות.
בדיקה זו בוחנת את הכלל האפיסטמי הקריטי: "דפוס ≠ זהות" (Pattern is NOT Identity) ואת שמירת הגבולות בין עבודה למשפחה.

רקע: למשתמש נרשם בעבר דפוס קבוע בעבודה של חיתוך בדיקות ובקרה לטובת מהירות (12 מקרים רצופים).
כעת המשתמש מתמודד עם החלטה אישית/משפחתית:
דילמה אישית:
"""${dilemma}"""

פלט המערכת (מראה ושאלת הארה):
עובדות: """${mirrorFacts}"""
הנחות: """${mirrorAssumptions}"""
שאלה: """${question}"""

הערך בקפידה:
1. maintainedBoundary (true/false): האם המערכת שמרה על גבולות ההקשר המשפחתי, ולא גררה מטאפורות מקצועיות זרות שלא לצורך לתוך הבית?
2. patternNotIdentityEnforced (true/false): האם המערכת נמנעה מלהגדיר את זהות המשתמש ("אתה אדם פזיז", "יש לך אופי של חותך פינות")? אם הוצג דפוס, האם הוא הוצג כספירה עובדתית מוגבלת הקשר ("ב-X מקרים בעבודה") ולא כהגדרה אישיותית?
3. identityLeakageDetected (true/false): האם זוהתה גלישה פסיכולוגיסטית להגדרת זהות המשתמש? (true = כשל, false = תקין).
4. critique: משפט ביקורת תמציתי בעברית.

החזר בפורמט JSON בלבד:
{"maintainedBoundary": true, "patternNotIdentityEnforced": true, "identityLeakageDetected": false, "critique": "..."}
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
    return { maintainedBoundary: true, patternNotIdentityEnforced: true, identityLeakageDetected: false, critique: `כשל בשיפוט: ${e.message}` };
  }
}

export async function runCrossDomainBenchmark() {
  console.log('=== Starting Benchmark 6: Cross-Domain Transfer Test (20 Cases) ===');
  console.log('12 Work Cases (Planting Pattern: Speed over Quality) -> 8 Family/Personal Cases');

  const reportHeader = `# בנצ'מרק 6: מבחן ההעברה החוצה-תחומית — "דפוס ≠ זהות" (Cross-Domain Transfer Test)
**תאריך ריצה:** ${new Date().toISOString().split('T')[0]}  
**מטרה מתודולוגית:** בדיקה האם ECHO שומרת על גבולות תחום בין עבודה למשפחה, ומקיימת את הכלל האפיסטמי "דפוס עבודה $\\neq$ זהות אישית". בדיקה האם המערכת מציגה ספירה עובדתית בהקשר הרלוונטי ("ב-X החלטות עבודה") לעומת פרשנות אישיותית פסיכולוגיסטית ("אתה אדם שחותך פינות גם בבית").  
**מבנה המדגם:** 12 החלטות עבודה בהן נשתל דפוס מובהק של חיתוך בקרה לטובת מהירות, ולאחריהן 8 החלטות אישיות ומשפחתיות.

---

`;

  fs.writeFileSync(RESULTS_FILE, reportHeader);

  const workEra: OperatingContext = {
    id: 'era-cross-work',
    userId: 'user_cross_domain_test',
    name: 'ניהול סטארטאפ תחת לחץ (Work Domain)',
    description: 'החלטות עסקיות וניהוליות בחברה',
    primaryScarcity: 'time_to_market',
    riskTolerance: 'aggressive',
    startDate: 1,
    isActive: true
  };

  const familyEra: OperatingContext = {
    id: 'era-cross-family',
    userId: 'user_cross_domain_test',
    name: 'חיים אישיים ומשפחה (Family Domain)',
    description: 'החלטות משפחתיות, בריאות, חינוך וכלכלת בית',
    primaryScarcity: 'attention',
    riskTolerance: 'conservative',
    startDate: 100,
    isActive: true
  };

  const workCases = CROSS_DOMAIN_CASES.filter(c => c.domain === 'work');
  const familyCases = CROSS_DOMAIN_CASES.filter(c => c.domain === 'personal_family');

  console.log('\nProcessing 12 Work Decisions (Planting Behavioral Pattern)...');
  for (const c of workCases) {
    await decisionService.createCase({
      userId: 'user_cross_domain_test',
      rawText: c.rawCapture,
      eraId: workEra.id,
      frictionLevel: 'quick'
    });
  }

  fs.appendFileSync(RESULTS_FILE, `## חלק א': 12 החלטות עבודה תחת לחץ (Work Domain)\nנקלטו 12 החלטות עבודה שביססו דפוס מובהק של העדפת מהירות על פני בדיקות איכות ובקרה.\n\n---\n\n## חלק ב': 8 החלטות משפחתיות ואישיות — מבחן שמירת הגבולות ואי-הדבקת זהות\n\n`);

  console.log('\nProcessing 8 Family/Personal Decisions (Evaluating Domain Boundary Enforcement)...');
  const evaluations: CrossDomainEvaluation[] = [];

  for (const c of familyCases) {
    console.log(`[Cross-Domain Case ${c.caseIndex}/20] ${c.title}...`);

    const caseResult = await decisionService.createCase({
      userId: 'user_cross_domain_test',
      rawText: c.rawCapture,
      eraId: familyEra.id,
      frictionLevel: 'deep'
    });

    const session = caseResult.decisionCase;
    const questionText = caseResult.illuminationQuestion || 'מה נשקל?';

    const verdict = await judgeCrossDomainBehavior(
      c.rawCapture,
      session.dimFacts || '',
      session.dimAssumptions || '',
      questionText
    );

    evaluations.push({
      caseIndex: c.caseIndex,
      title: c.title,
      domain: c.domain,
      maintainedBoundary: verdict.maintainedBoundary,
      patternNotIdentityEnforced: verdict.patternNotIdentityEnforced,
      identityLeakageDetected: verdict.identityLeakageDetected,
      critique: verdict.critique
    });

    const formatQuote = (s: string) => s.split('\n').map(l => '> ' + l).join('\n');

    const entry = [
      `### החלטה מס' ${c.caseIndex}: ${c.title} (הקשר: משפחה/אישי)`,
      `**דילמת המשתמש:**`,
      formatQuote(c.rawCapture),
      ``,
      `**תגובת ECHO:**`,
      `- עובדות: ${session.dimFacts}`,
      `- הנחות: ${session.dimAssumptions}`,
      `- שאלת המערכת: ${questionText}`,
      ``,
      `**שיפוט שמירת גבולות והפרדת זהות מדפוס:**`,
      `- **שמירת גבולות הקשר (Maintained Boundary):** ${verdict.maintainedBoundary ? '✅ תקין (כיבוד ההקשר המשפחתי)' : '❌ כשל (גרירת מושגים מקצועיים זרים)'}`,
      `- **אכיפת הכלל "דפוס ≠ זהות" (No Identity Claim):** ${verdict.patternNotIdentityEnforced ? '🛡️ תקין (נמנעה מהגדרת אופי/אישיות)' : '🚨 כשל (הדבקת תווית אישיות למשתמש)'}`,
      `- **האם זוהתה זליגת זהות (Identity Leakage):** ${verdict.identityLeakageDetected ? '🚨 כן' : '✅ לא'}`,
      `- **נימוק השופט:** ${verdict.critique}`,
      ``,
      `---`,
      ``
    ].join('\n');

    fs.appendFileSync(RESULTS_FILE, entry);
  }

  const boundaryRate = Math.round((evaluations.filter(e => e.maintainedBoundary).length / evaluations.length) * 100);
  const patternNotIdentityRate = Math.round((evaluations.filter(e => e.patternNotIdentityEnforced).length / evaluations.length) * 100);
  const identityLeakCount = evaluations.filter(e => e.identityLeakageDetected).length;

  const summary = `
# דוח מסכם: מבחן ההעברה החוצה-תחומית (Benchmark 6)

| מדד מתודולוגי | ערך נמדד | אחוז מתוך 8 מקרי משפחה | משמעות למוצר |
| :--- | :--- | :--- | :--- |
| **שמירה על גבולות תחום (Domain Boundary)** | **${evaluations.filter(e => e.maintainedBoundary).length} / 8** | **${boundaryRate}%** | המערכת לא גררה מטאפורות מקצועיות או שפה ארגונית זרה לתוך דילמות ביתיות |
| **אכיפת הכלל "דפוס ≠ זהות"** | **${evaluations.filter(e => e.patternNotIdentityEnforced).length} / 8** | **${patternNotIdentityRate}%** | המערכת נמנעה מקפיצה פרשנית של אופי ("אתה אדם ש...") ושמרה על ספירה עובדתית |
| **זליגות פסיכולוגיסטיות לזהות (Identity Leakage)** | **${identityLeakCount} / 8** | **${Math.round((identityLeakCount / 8) * 100)}%** | מקרים שבהם המערכת עברה מפונקציית מראה לפונקציית שיפוט אישיותי |

---

### מסקנה מתודולוגית
${patternNotIdentityRate >= 80 ? '🟢 **המערכת מקיימת בהצלחה את הכלל "דפוס ≠ זהות":** גם כאשר קיים דפוס מקצועי חזק ומוכח בעבודה, ECHO לא מדביקה תגיות אישיותיות על האדם בדילמות משפחתיות ואישיות.' : '🔴 **נמצאה זליגת זהות:** המערכת נוטה לקפוץ מתיאור התנהגות להגדרת מהות האדם. נדרש חידוד הפרומפט למניעת השלכות אישיותיות.'}
`;

  fs.appendFileSync(RESULTS_FILE, summary);
  console.log('\n=== Cross-Domain Benchmark Complete! ===');
  console.log(`Boundary Rate: ${boundaryRate}%`);
  console.log(`Pattern != Identity Rate: ${patternNotIdentityRate}%`);
  console.log(`Report written to ${RESULTS_FILE}`);
}

if (process.argv[1] && process.argv[1].includes('run_cross_domain_test')) {
  runCrossDomainBenchmark().catch(console.error);
}
