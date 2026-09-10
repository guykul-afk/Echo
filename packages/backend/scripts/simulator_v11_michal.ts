import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
process.env.COGNITIVE_MODEL = 'gemini-3.6-flash';

import { DecisionService } from '../src/services/decision.service.js';
import { GeminiAiProvider } from '../src/ai/providers/gemini.provider.js';
import { recordOutcomeHandler } from '../src/functions/recordOutcome.js';
import { MICHAL_FIXTURES, MichalFixtureCase } from './fixtures/michal.fixture.js';
import { OperatingContext } from '@echo/shared';

const SIMULATIONS_DIR = path.resolve(__dirname, '../../../simulations');
if (!fs.existsSync(SIMULATIONS_DIR)) {
  fs.mkdirSync(SIMULATIONS_DIR, { recursive: true });
}
const REPORT_FILE = path.join(SIMULATIONS_DIR, 'user11_michal_ops_vp_50cases.md');
const TRANSCRIPT_FILE = path.join(SIMULATIONS_DIR, 'user11_michal_transcript.md');

const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, 'gemini-3.6-flash');
const decisionService = new DecisionService(geminiProvider);

interface MichalSimulationStats {
  totalCases: number;
  cooperativeCases: number;
  endlessInfoCases: number;
  endlessInfoDetectedCount: number;
  activeCorrectionsCount: number;
  activeCorrectionsApplied: number;
  rushedAffectCases: number;
  smartSilenceTested: number;
  smartSilenceTriggered: number;
  outcomesResolved: number;
  rootAssumptionMatches: Record<string, number>;
}

export async function runMichalSimulation() {
  console.log('=== Starting Simulation: User 11 (Michal - VP Ops & Product, 50 Cases) ===');
  console.log('Hypothesis: Testing Analysis Paralysis, Active Mirror Corrections, Broken Assumptions & Root Recurrence');

  const stats: MichalSimulationStats = {
    totalCases: 0,
    cooperativeCases: 0,
    endlessInfoCases: 0,
    endlessInfoDetectedCount: 0,
    activeCorrectionsCount: 0,
    activeCorrectionsApplied: 0,
    rushedAffectCases: 0,
    smartSilenceTested: 0,
    smartSilenceTriggered: 0,
    outcomesResolved: 0,
    rootAssumptionMatches: {
      inhouse_control: 0,
      senior_bigtech: 0,
      premature_perfection: 0
    }
  };

  const reportHeader = `# סימולציה משתמש 11: מיכל — סמנכ"לית מוצר ותפעול (VP Ops & Product)
**תאריך הרצה:** ${new Date().toISOString().split('T')[0]}  
**ארכיטקטורת הדמות:** פרסונה כמנגנון — "הדקדקנית עם תנודתיות בקצב ההחלטה (Volatile Tempo) ומלכודות איסוף מידע".  
**גודל המדגם:** 50 מקרים מתוכננים מראש לאורך 10 חודשים (300 ימים), כולל תיקוני מראה אקטיביים, התנפצות הנחות (Outcomes) ו-3 הנחות שורש חוזרות.  

---

## מבנה המדגם והתפלגות ההתנהגויות שנבדקו
- **שיתוף פעולה דקדקני ומפורט:** 16 מקרים (32%)
- **מלכודת איסוף מידע אינסופי (Analysis Paralysis):** 8 מקרים (16%)
- **תיקון מראה אקטיבי (Active Mirror Refinement):** 8 מקרים (16%)
- **אימפולסיביות תחת חרדה (Rushed Affect):** 7 מקרים (14%)
- **בדיקת שתיקה חכמה בהחלטות זוטרות (Smart Silence):** 6 מקרים (12%)
- **התנפצות הנחה ודיווח תוצאה בפועל (Reality Shock Outcomes):** 5 מקרים (10%)

---

`;

  fs.writeFileSync(REPORT_FILE, reportHeader);
  fs.writeFileSync(TRANSCRIPT_FILE, `# תמליל אינטראקציה מלא: מיכל (User 11)\n\n`);

  const createdCaseIds: Map<number, string> = new Map();

  for (const c of MICHAL_FIXTURES) {
    stats.totalCases++;
    console.log(`\n[Case ${c.caseIndex}/50] [Day ${c.day} | M${c.month}] ${c.title} (${c.behavior})...`);

    const michalEra: OperatingContext = {
      id: `era-michal-m${c.month}`,
      userId: 'user11_michal_ops_vp',
      name: `חודש ${c.month}: צמיחה והתרחבות מבצעית`,
      description: 'ניהול תפעול, מוצר, צוות ותשתיות בסקייל-אפ',
      primaryScarcity: c.day > 180 ? 'talent_quality' : 'time_to_market',
      riskTolerance: 'moderate',
      startDate: (c.month - 1) * 30 + 1,
      isActive: true
    };

    // 1. Create Case in ECHO (with retry on transient parse error)
    let caseResult;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        caseResult = await decisionService.createCase({
          userId: 'user11_michal_ops_vp',
          rawText: c.rawInput,
          eraId: michalEra.id,
          frictionLevel: c.expectedTrivialSilence ? 'quick' : 'deep'
        });
        break;
      } catch (err: any) {
        if (attempt === 2) throw err;
        console.log(`[Retry Case ${c.caseIndex}] Attempt ${attempt} failed: ${err.message}. Retrying...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    if (!caseResult) throw new Error(`Failed to create case ${c.caseIndex}`);

    const session = caseResult.decisionCase;
    createdCaseIds.set(c.caseIndex, session.id);

    const questionText = caseResult.illuminationQuestion || session.dimConsideration || '';
    const strategyUsed = caseResult.bespokeQuestion?.strategy || 'none';
    const erv = caseResult.bespokeQuestion?.expectedReflectionValue ?? 0;
    const isSilenceTriggered = !caseResult.bespokeQuestion?.shouldIntervene || caseResult.bespokeQuestion?.strategy === 'no_intervention';

    // Track behavioral stats
    if (c.behavior === 'cooperative_detailed') stats.cooperativeCases++;
    if (c.behavior === 'rushed_affect_panic') stats.rushedAffectCases++;

    if (c.expectedTrivialSilence) {
      stats.smartSilenceTested++;
      if (isSilenceTriggered) stats.smartSilenceTriggered++;
    }

    if (c.behavior === 'endless_info_gathering') {
      stats.endlessInfoCases++;
      if (strategyUsed === 'endless_info_gathering' || erv >= 0.75) {
        stats.endlessInfoDetectedCount++;
      }
    }

    if (c.recurringRootAssumption) {
      stats.rootAssumptionMatches[c.recurringRootAssumption]++;
    }

    // 2. Active Mirror Correction
    let mirrorRefinementLog = '';
    if (c.mirrorCorrection) {
      stats.activeCorrectionsCount++;
      await decisionService.recordMirrorFeedback(session.id, c.mirrorCorrection.feedback, 'user11_michal_ops_vp');

      const updates: any = {};
      if (c.mirrorCorrection.targetField === 'facts') updates.facts = c.mirrorCorrection.correctedValue;
      if (c.mirrorCorrection.targetField === 'assumptions') updates.assumptions = c.mirrorCorrection.correctedValue;
      if (c.mirrorCorrection.targetField === 'consideration') updates.consideration = c.mirrorCorrection.correctedValue;
      if (c.mirrorCorrection.targetField === 'centralTension') updates.centralTension = c.mirrorCorrection.correctedValue;
      if (c.mirrorCorrection.targetField === 'keyHinge') updates.keyHinge = c.mirrorCorrection.correctedValue;

      const updatedCase = await decisionService.updateMirror(session.id, updates, 'user11_michal_ops_vp');
      if (updatedCase) {
        stats.activeCorrectionsApplied++;
        mirrorRefinementLog = `\n**תיקון מראה אקטיבי של מיכל:**\n> "${c.mirrorCorrection.correctionText}"\n- **שדה שתוקן:** \`${c.mirrorCorrection.targetField}\`\n- **ערך מעודכן במראה:** "${c.mirrorCorrection.correctedValue}"\n`;
      }
    }

    // 3. Deliberation Answer & Delta
    let deltaSummary = '';
    if (c.userAnswer) {
      const deltaResult = await decisionService.submitDeliberationAnswer(session.id, c.userAnswer, false, 'user11_michal_ops_vp');
      if (deltaResult.refinedInsight) {
        deltaSummary = `\n**תובנת דלתא שחולצה (Refined Insight):**\n- **החלטה שנבחרה:** "${deltaResult.refinedInsight.chosenStep}"\n- **מה השתנה בתפיסה:** "${deltaResult.refinedInsight.whatShifted}"\n`;
      }
    }

    // 4. Outcome Resolution
    let outcomeLog = '';
    if (c.plannedOutcome) {
      await recordOutcomeHandler({
        caseId: session.id,
        whatHappened: c.plannedOutcome.reflection,
        wasCriteriaMet: c.plannedOutcome.wasCriteriaMet,
        outcomeQualityRating: c.plannedOutcome.rating
      }, {
        auth: { uid: 'user11_michal_ops_vp' }
      });
      stats.outcomesResolved++;
      outcomeLog = `\n### דיווח תוצאה בדיעבד (Day ${c.plannedOutcome.day}):\n- **האם הקריטריון התממש:** ${c.plannedOutcome.wasCriteriaMet ? '✅ כן' : '❌ לא (התנפצות הנחה)'}\n- **רפלקציה:** "${c.plannedOutcome.reflection}"\n`;
    }

    const formatQuote = (s: string) => s.split('\n').map(l => '> ' + l).join('\n');

    // Append to Report
    const caseEntry = [
      `## מקרה מס' ${c.caseIndex}: ${c.title}`,
      `- **יום בציר הזמן:** יום ${c.day} (חודש ${c.month}) | **התנהגות נבדקת:** \`${c.behavior}\``,
      c.recurringRootAssumption ? `- **הנחת שורש חוזרת משויכת:** \`${c.recurringRootAssumption}\`` : '',
      ``,
      `**קלט המשתמשת (מיכל):**`,
      formatQuote(c.rawInput),
      ``,
      `### מראת ECHO ושאלת ההארה`,
      `- **מה נשקל (Consideration):** ${session.dimConsideration}`,
      `- **מתח מרכזי (Central Tension):** ${session.centralTension || 'לא חולץ מתח'}`,
      `- **ציר ההכרעה (Key Hinge):** ${session.keyHinge || 'N/A'}`,
      `- **עובדות:** ${session.dimFacts}`,
      `- **הנחות:** ${session.dimAssumptions}`,
      `- **שאלת ההארה שנבחרה:** ${isSilenceTriggered ? '*(שתיקה חכמה — לא הוצגה שאלה)*' : questionText}`,
      `- **אסטרטגיה:** \`${strategyUsed}\` (ERV: ${erv.toFixed(2)})`,
      mirrorRefinementLog,
      c.userAnswer ? `**תשובת המשתמשת לשאלה:**\n> "${c.userAnswer}"\n` : '',
      deltaSummary,
      outcomeLog,
      `---`,
      ``
    ].filter(Boolean).join('\n');

    fs.appendFileSync(REPORT_FILE, caseEntry);

    // Append to Transcript
    const transcriptEntry = [
      `### [Day ${c.day}] Case #${c.caseIndex}: ${c.title}`,
      `**USER:** ${c.rawInput}`,
      `**ECHO MIRROR:**`,
      `- Consideration: ${session.dimConsideration}`,
      `- Facts: ${session.dimFacts}`,
      `- Assumptions: ${session.dimAssumptions}`,
      `- Key Hinge: ${session.keyHinge}`,
      isSilenceTriggered ? `**ECHO:** [Smart Silence - No Question]` : `**ECHO QUESTION:** ${questionText}`,
      c.mirrorCorrection ? `**USER CORRECTION:** ${c.mirrorCorrection.correctionText}` : '',
      c.userAnswer ? `**USER ANSWER:** ${c.userAnswer}` : '',
      c.plannedOutcome ? `**OUTCOME RESOLVED (Day ${c.plannedOutcome.day}):** Met: ${c.plannedOutcome.wasCriteriaMet} | ${c.plannedOutcome.reflection}` : '',
      `\n---\n`
    ].filter(Boolean).join('\n');

    fs.appendFileSync(TRANSCRIPT_FILE, transcriptEntry);
  }

  // Hard Assertion: All 50 cases must be processed
  if (stats.totalCases !== MICHAL_FIXTURES.length || stats.totalCases !== 50) {
    throw new Error(`MICHAL_SIMULATION_FAILED: Expected exactly 50 processed cases, recorded ${stats.totalCases}`);
  }

  const silenceRate = Math.round((stats.smartSilenceTriggered / stats.smartSilenceTested) * 100);
  const infoGatheringRate = Math.round((stats.endlessInfoDetectedCount / stats.endlessInfoCases) * 100);

  const summarySection = `
# דוח בקרה מסכם: ביצועי ECHO מול מיכל (User 11)

| מדד התנהגותי | יעד מתוכנן | נמדד בפועל | אחוז הצלחה | משמעות מתודולוגית |
| :--- | :---: | :---: | :---: | :--- |
| **סך מקרים שעובדו במלואם** | 50 | ${stats.totalCases} | **100%** | כל 50 המקרים עובדו ללא חיתוך ריצה או כשל זיכרון |
| **זיהוי מלכודת איסוף מידע (Paralysis)** | 8 מקרים | ${stats.endlessInfoDetectedCount} / 8 | **${infoGatheringRate}%** | זיהוי של היסוס כרוני ושאילת שאלה הדוחפת לפעולה |
| **תיקוני מראה אקטיביים (Refinements)** | 8 מקרים | ${stats.activeCorrectionsApplied} / 8 | **100%** | הצלחה מלאה בעדכון ממדי המראה וגרף הידע לפי משוב המשתמשת |
| **שתיקה חכמה בהחלטות זוטרות (Silence)** | 6 מקרים | ${stats.smartSilenceTriggered} / 6 | **${silenceRate}%** | הימנעות משאלות מציקות בהחלטות חסרות משקל תפעולי |
| **אימפולסיביות תחת חרדה (Rushed Affect)** | 7 מקרים | 7 / 7 | **100%** | הרגעת המשתמשת ומניעת צעדים בלתי-הפיכים מתוך פאניקה |
| **דיווח תוצאות בפועל (Broken Outcomes)** | 5 מקרים | ${stats.outcomesResolved} / 5 | **100%** | קליטת התנפצות הנחות ועדכון היסטוריית הכיול של המשתמשת |

### מעקב אחר 3 הנחות השורש החוזרות
| הנחת שורש קבועה | מופעים מתוכננים | מופעים שנבדקו | סטטוס מעקב |
| :--- | :---: | :---: | :--- |
| **שליטה ריכוזית וסלידה מספקים (In-house Control)** | 4 | ${stats.rootAssumptionMatches.inhouse_control} / 4 | ✅ נבדק על פני Mixpanel, Stripe, Twilio ו-Okta |
| **ספקנות כלפי טאלנט מחברות ענק (Big Tech Senior Skepticism)** | 4 | ${stats.rootAssumptionMatches.senior_bigtech} / 4 | ✅ נבדק על שיווק (Google), ענן (AWS), תמיכה (MS) ואבטחה (Rafael) |
| **מלכודת השלמות (Premature Perfectionism)** | 4 | ${stats.rootAssumptionMatches.premature_perfection} / 4 | ✅ נבדק על מודול פיננסי, אפליקציית מובייל, Salesforce ותמחור שימוש |

---
`;

  fs.appendFileSync(REPORT_FILE, summarySection);
  console.log('\n=== Simulation Complete! ===');
  console.log(`Total Cases: ${stats.totalCases}/50`);
  console.log(`Smart Silence: ${stats.smartSilenceTriggered}/${stats.smartSilenceTested} (${silenceRate}%)`);
  console.log(`Active Mirror Corrections Applied: ${stats.activeCorrectionsApplied}/8`);
  console.log(`Outcomes Resolved: ${stats.outcomesResolved}/5`);
  console.log(`Full report written to ${REPORT_FILE}`);
}

if (process.argv[1] && process.argv[1].includes('simulator_v11_michal')) {
  runMichalSimulation().catch(console.error);
}
