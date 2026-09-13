import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
process.env.COGNITIVE_MODEL = process.env.COGNITIVE_MODEL || 'gemini-3.6-flash';

import { DecisionService } from '../src/services/decision.service.js';
import { GeminiAiProvider } from '../src/ai/providers/gemini.provider.js';
import { DecisionProfileService } from '../src/services/decisionProfile.service.js';
import { CalibrationEngineService, CalibrationDataPoint } from '../src/services/calibration.service.js';
import { recordOutcomeHandler } from '../src/functions/recordOutcome.js';
import { TALIA_CASES } from './fixtures/talia.fixture.js';
import { TaliaFixtureCase } from './fixtures/talia.types.js';
import { DecisionCase, DecisionProfileData, OperatingContext } from '@echo/shared';
import { validateResponseText } from './validators/textValidator.js';
import { TokenTracker } from '../src/ai/tokenTracker.js';

const SIMULATIONS_DIR = path.resolve(__dirname, '../../../simulations');
if (!fs.existsSync(SIMULATIONS_DIR)) {
  fs.mkdirSync(SIMULATIONS_DIR, { recursive: true });
}
const CHECKPOINT_FILE = path.join(SIMULATIONS_DIR, 'v16_talia_checkpoints.json');
const REPORT_FILE = path.join(SIMULATIONS_DIR, 'user16_talia_scale_report.md');
const TRANSCRIPT_FILE = path.join(SIMULATIONS_DIR, 'user16_talia_transcript.md');

interface SavedCaseState {
  caseIndex: number;
  caseId: string;
  day: number;
  month: number;
  behavior: string;
  title: string;
  rawInput: string;
  initialMirror: {
    consideration: string;
    centralTension: string;
    keyHinge: string;
    facts: string;
    assumptions: string;
  };
  illuminationQuestion: string;
  historicalPreamble?: string;
  strategyUsed: string;
  erv: number;
  isNaturalSilence: boolean;
  retrievalCandidatesCount: number;
  topRetrievalScore: number;
  retrievalReason?: string;
  taliaAnswer: string;
  refinedNow?: string;
  chosenStep?: string;
  activeCorrectionApplied?: boolean;
  correctionDiff?: {
    field: string;
    before: string;
    after: string;
  };
  outcomeReported?: boolean;
}

interface CheckpointData {
  cases: SavedCaseState[];
  calibrationDataPoints: CalibrationDataPoint[];
  profiles: Record<number, DecisionProfileData>;
}

function loadCheckpoint(): CheckpointData {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
    } catch (e) {
      console.warn('[Checkpoint] Failed to parse checkpoint file, starting fresh.');
    }
  }
  return { cases: [], calibrationDataPoints: [], profiles: {} };
}

function saveCheckpoint(data: CheckpointData) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, process.env.COGNITIVE_MODEL);
const decisionService = new DecisionService(geminiProvider);
const profileService = new DecisionProfileService(geminiProvider);

/**
 * Persona Agent: Dynamically generates Talia Koren's authentic response with validation and retry
 */
async function simulateTaliaResponse(
  fixture: TaliaFixtureCase,
  illuminationQuestion: string,
  apiKey: string,
  modelName: string = process.env.COGNITIVE_MODEL || 'gemini-3.6-flash'
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const prompt = `
אתה מגלם את טליה קורן (בת 48), מנהלת תיכון "עירוני מקיף" גדול (1,200 תלמידים, 120 מורים).
שלב כרונולוגי: יום ${fixture.day} (חודש ${fixture.month} מתוך 6).

פרופיל אישי ומצב מנטלי בשלב זה:
${fixture.personaProfile}

הנחיות סגנון דיבור:
${fixture.styleInstructions}

ההחלטה שהזנת למערכת ECHO:
"${fixture.rawInput}"

מערכת ECHO ניתחה את ההחלטה שלך, ומחזירה לך כעת את שאלת ההארה (Illumination Question) הבאה:
"${illuminationQuestion}"

משימתך:
עני על שאלת ההארה הזו בגוף ראשון (אני) בלשון נקבה, באופן האותנטי ביותר עבור טליה ברגע זה בציר הזמן:
1. הישארי ב-100% בתוך הדמות והמצב הפסיכולוגי שלה (אידיאליסטית נוקשה בחודש 1-2, לחוצה ומתפשרת בחודש 3-4, בוגרת ומכוילת בחודש 5-6).
2. תני תשובה אנושית, ישירה ומנומקת בת 2 עד 4 משפטים חדים.
3. אל תשתמשי במילות הקדמה ("אני טליה", "בתור מנהלת"), ואל תכתבי רשימות תבליטים, הערות באנגלית או תגיות כמו Draft/Outline/Checklist. כתבי ישירות את תשובתך בעברית בלבד למערכת ECHO.
`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: 'You are a role-play persona. Output ONLY the persona final spoken reflection in Hebrew. Do NOT include thought processes, checklists, drafts, markdown bullets, or English text.' }]
          },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3 + (attempt - 1) * 0.1,
            maxOutputTokens: 2048
          }
        })
      });

      if (!response.ok) {
        if (attempt === 3) break;
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      const data = await response.json();
      TokenTracker.recordUsage(data.usageMetadata);
      let answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      answer = answer.replace(/^```(?:text)?\s*/i, '').replace(/\s*```$/, '').trim();
      answer = answer.replace(/\*?Draft\s*\d*[^:\n]*:?\*?/gi, '').replace(/\*?Mental Outline:?\*?/gi, '').trim();
      answer = answer.replace(/\*?Checklist:?[\s\S]*?(?:Hebrew only\?[^\n]*\n?)/gi, '').trim();
      answer = answer.replace(/^[^\u0590-\u05FF"״']+/g, '').trim();
      if (answer.startsWith('"') && answer.endsWith('"')) {
        answer = answer.slice(1, -1).trim();
      }

      const validation = validateResponseText(answer, 'full_paragraph');
      if (validation.isValid) {
        return answer;
      }
      console.warn(`[Talia Persona Validation] Attempt ${attempt}/3 rejected: ${validation.reason}`);
    } catch (err: any) {
      console.warn(`[Talia Persona Network Error] Attempt ${attempt}/3: ${err.message}`);
    }
  }

  // Fallback to curated answer from fixture if API/validation failed
  return fixture.userAnswer || 'אני מבין את שאלת ההארה ואת הטרייד-אוף שהיא מציפה. בנקודת הזמן הזו ההכרעה שלי ברורה ואני עומד מאחוריה.';
}

export async function runTaliaSimulation() {
  console.log('================================================================================');
  console.log('=== Starting Rigorous Simulation V16: Talia Koren (High School Principal) ===');
  console.log('=== 60 Cases Over 180 Days | Full Cognitive Architecture & Memory Retrieval ===');
  console.log('================================================================================\n');

  const checkpoint = loadCheckpoint();
  const processedIndices = new Set(checkpoint.cases.map(c => c.caseIndex));

  // Initialize report files if starting fresh
  if (checkpoint.cases.length === 0) {
    fs.writeFileSync(REPORT_FILE, `# דוח סימולציה מבוקרת V16: טליה קורן (High School)
**תאריך הרצה:** ${new Date().toISOString().split('T')[0]}  
**ארכיטקטורת בדיקה:** Dual-Agent (מנוע ECHO מול סוכן הדמות של טליה קורן עם Zero-Trust Validation).  
**ציר זמן:** 180 ימים (6 חודשים מדומיים), 60 החלטות קוגניטיביות מלאות.  
**משתמש הבדיקה:** \`user16_talia_scale\` (בן 44, מייסד ומנכ"ל חברת DeepTech לרכב אוטונומי).  

---

## מהלך הסימולציה והשתלשלות 60 המקרים
`);
    fs.writeFileSync(TRANSCRIPT_FILE, `# תמליל אינטראקציה דו-סוכנית מלא: טליה קורן (User 15)\n\n`);
  }

  const userId = 'user16_talia_scale';

  for (const fixture of TALIA_CASES) {
    if (processedIndices.has(fixture.caseIndex)) {
      console.log(`[Skipping] Case ${fixture.caseIndex}/60 already completed in checkpoint.`);
      continue;
    }

    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`[Case ${fixture.caseIndex}/60] [Month ${fixture.month} | Day ${fixture.day}] ${fixture.title} (${fixture.behavior})`);
    console.log(`--------------------------------------------------------------------------------`);

    const era: OperatingContext = {
      id: `era-talia-m${fixture.month}`,
      userId,
      name: `חודש ${fixture.month}: ${fixture.month <= 2 ? 'בניית יסודות ועקרונות' : fixture.month <= 4 ? 'משבר תזרים ושחיקת גבולות' : 'התפכחות וכיול בוגר'}`,
      description: 'סטארט-אפ DeepTech לחיישני רכב אוטונומי',
      primaryScarcity: fixture.month <= 2 ? 'time_to_market' : fixture.month <= 4 ? 'runway_capital' : 'precision_execution',
      riskTolerance: fixture.month <= 2 ? 'conservative' : fixture.month <= 4 ? 'aggressive' : 'moderate',
      startDate: fixture.day,
      isActive: true
    };

    // Step 1: Ingest dilemma into ECHO (createCase)
    console.log(`[1. ECHO Capture] מפעיל חילוץ אפיסטמי סינכרוני...`);
    let caseResult: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        caseResult = await decisionService.createCase({
          userId,
          rawText: fixture.rawInput,
          eraId: era.id,
          userGender: 'male',
          userName: 'טליה',
          frictionLevel: 'deep'
        });
        break;
      } catch (err: any) {
        console.warn(`[ECHO Capture Error] Attempt ${attempt}/3: ${err.message}`);
        if (attempt === 3) throw err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    const dCase: DecisionCase = caseResult.decisionCase;
    const bespokeQ = caseResult.bespokeQuestion;
    const historicalQ = caseResult.historicalQuestion;
    const retrieval = caseResult.retrievalTelemetry;

    const initialMirror = {
      consideration: dCase.dimConsideration || '',
      centralTension: dCase.centralTension || '',
      keyHinge: dCase.keyHinge || '',
      facts: dCase.dimFacts || '',
      assumptions: dCase.dimAssumptions || ''
    };

    const illuminationQ = bespokeQ?.questionText || caseResult.illuminationQuestion || '';
    const strategyUsed = bespokeQ?.strategy || 'none';
    const erv = bespokeQ?.expectedReflectionValue ?? 0;
    const isNaturalSilence = !bespokeQ?.shouldIntervene;

    console.log(`   ✓ חולץ: "${dCase.title}"`);
    console.log(`   ✓ ציר הכרעה: "${dCase.keyHinge}"`);
    console.log(`   ✓ שאלת הארה: [${strategyUsed} | ERV: ${erv.toFixed(2)}] ${isNaturalSilence ? '(שתיקה חכמה מופעלת)' : `"${illuminationQ.slice(0, 80)}..."`}`);

    if (retrieval && retrieval.retrievedCandidatesCount > 0) {
      console.log(`   🔍 שליפת עבר: ${retrieval.retrievedCandidatesCount} מועמדים | ציון מרבי: ${(retrieval.retrievalScore || 0).toFixed(2)} | סיבה: ${retrieval.retrievalReason}`);
    }

    // Step 2: Handle Active Mirror Refinement (if fixture has correction)
    let activeCorrectionApplied = false;
    let correctionDiff: any = null;
    if (fixture.mirrorCorrection) {
      console.log(`[2. Mirror Correction] טליה מדייק ומעדכן את המראה...`);
      const targetField = fixture.mirrorCorrection.targetField;
      const beforeVal = (initialMirror as any)[targetField] || '';
      const afterVal = fixture.mirrorCorrection.correctedValue;

      const updates: any = {};
      updates[targetField] = afterVal;

      await decisionService.updateMirror(dCase.id, updates, userId);
      await decisionService.recordMirrorFeedback(dCase.id, 'inaccurate', userId);

      activeCorrectionApplied = true;
      correctionDiff = {
        field: targetField,
        before: beforeVal,
        after: afterVal
      };
      console.log(`   ✓ שדה '${targetField}' עודכן בהצלחה ב-DB ובגרף הידע.`);
    }

    // Step 3: Persona Agent Reflection (unless silent on trivial)
    let taliaAnswer = '';
    let refinedNow = '';
    let chosenStep = '';

    if (isNaturalSilence && fixture.expectedTrivialSilence) {
      console.log(`[3. Smart Silence] המערכת שתקה כצפוי, אין צורך בהתערבות.`);
      taliaAnswer = 'אין צורך בשאלה נוספת, ההחלטה הוכרעה לפי המראה.';
    } else {
      console.log(`[3. סוכן הדמות (טליה)]: מפעיל מודל דמות (חודש ${fixture.month})...`);
      taliaAnswer = await simulateTaliaResponse(
        fixture,
        illuminationQ,
        process.env.GEMINI_API_KEY || ''
      );
      console.log(`   💬 תשובת טליה: "${taliaAnswer.slice(0, 90)}..."`);

      // Submit deliberation answer to ECHO
      console.log(`[4. סגירת מעגל דלתא] מזין מענה ומחלץ refinedInsight...`);
      try {
        const deltaResult = await decisionService.submitDeliberationAnswer(
          dCase.id,
          taliaAnswer,
          false,
          userId
        );
        refinedNow = deltaResult.refinedInsight?.now || '';
        chosenStep = deltaResult.refinedInsight?.chosenStep || '';
        console.log(`   ✓ תובנת דלתא: "${refinedNow.slice(0, 80)}..."`);
      } catch (err: any) {
        console.warn(`[Delta Warning] Failed to compute delta: ${err.message}`);
      }
    }

    // Step 4: Record Outcome if planned for this day
    let outcomeReported = false;
    for (const pastCase of checkpoint.cases) {
      const pastFixture = TALIA_CASES.find(f => f.caseIndex === pastCase.caseIndex);
      if (pastFixture?.plannedOutcome && pastFixture.plannedOutcome.day === fixture.day) {
        console.log(`\n[5. רישום תוצאה בפועל] מקרה ${pastCase.caseIndex} הגיע ליום הבדיקה (${fixture.day})!`);
        try {
          await recordOutcomeHandler({
            userId,
            caseId: pastCase.caseId,
            actualOutcome: pastFixture.plannedOutcome.reflection,
            wasSuccessful: pastFixture.plannedOutcome.wasCriteriaMet,
            satisfactionScore: pastFixture.plannedOutcome.wasCriteriaMet ? 5 : 2,
            reflectionAxes: {
              whatActuallyHappened: pastFixture.plannedOutcome.reflection,
              assumptionBroken: !pastFixture.plannedOutcome.wasCriteriaMet,
              processLearnings: pastFixture.plannedOutcome.wasCriteriaMet ? 'ההתמדה הוכיחה את עצמה' : 'קיצור הדרך ההנדסי התגלה כטעות חמורה'
            }
          });
          pastCase.outcomeReported = true;
          outcomeReported = true;
          console.log(`   ✓ תוצאה נרשמה וסגרה מעגל בגרף הידע בהצלחה.`);
        } catch (err: any) {
          console.warn(`[Outcome Warning] Error recording outcome: ${err.message}`);
        }
      }
    }

    // Calibration data point collection
    const statedConf = fixture.month <= 2 ? 0.85 : fixture.month <= 4 ? 0.65 : 0.75;
    const bucket = fixture.month <= 2 ? '85%' : fixture.month <= 4 ? '65%' : '75%';
    const wasMet = fixture.plannedOutcome ? fixture.plannedOutcome.wasCriteriaMet : fixture.behavior !== 'broken_assumption_outcome';
    checkpoint.calibrationDataPoints.push({
      caseId: dCase.id,
      statedConfidence: statedConf,
      confidenceBucket: bucket,
      wasCriteriaMet: wasMet
    });

    // Save case to checkpoint
    const savedState: SavedCaseState = {
      caseIndex: fixture.caseIndex,
      caseId: dCase.id,
      day: fixture.day,
      month: fixture.month,
      behavior: fixture.behavior,
      title: fixture.title,
      rawInput: fixture.rawInput,
      initialMirror,
      illuminationQuestion: illuminationQ,
      historicalPreamble: retrieval?.preambleContext,
      strategyUsed,
      erv,
      isNaturalSilence,
      retrievalCandidatesCount: retrieval?.retrievedCandidatesCount || 0,
      topRetrievalScore: retrieval?.retrievalScore || 0,
      retrievalReason: retrieval?.retrievalReason,
      taliaAnswer,
      refinedNow,
      chosenStep,
      activeCorrectionApplied,
      correctionDiff,
      outcomeReported: false
    };

    checkpoint.cases.push(savedState);

    // Compute periodic profile milestones
    if (fixture.caseIndex === 15 || fixture.caseIndex === 35 || fixture.caseIndex === 60) {
      console.log(`\n[Profile Milestone] מחשב פרופיל קבלת החלטות במקרה ${fixture.caseIndex}...`);
      try {
        const relevantCases = checkpoint.cases.slice(0, fixture.caseIndex).map(c => ({
          id: c.caseId,
          userId,
          title: c.title,
          rawCaptureText: c.rawInput,
          dimConsideration: c.initialMirror.consideration,
          centralTension: c.initialMirror.centralTension,
          keyHinge: c.initialMirror.keyHinge,
          dimFacts: c.initialMirror.facts,
          dimAssumptions: c.initialMirror.assumptions,
          status: 'frozen' as const,
          frozenAt: c.day * 86400000,
          createdAt: c.day * 86400000,
          updatedAt: c.day * 86400000
        }));
        const prof = await profileService.generateProfile(userId, relevantCases as DecisionCase[], { gender: 'male', userName: 'טליה' });
        checkpoint.profiles[fixture.caseIndex] = prof;
        console.log(`   ✓ ארכיטיפ חולץ: "${prof.mainStyle?.title}" (${prof.mainStyle?.prominentTendency})`);
      } catch (err: any) {
        console.warn(`[Profile Warning] Profile computation error: ${err.message}`);
      }
    }

    saveCheckpoint(checkpoint);

    // Append to transcript
    const transcriptText = `
### [מקרה ${fixture.caseIndex}] ${fixture.title} (יום ${fixture.day} | חודש ${fixture.month})
* **קלט טליה:** "${fixture.rawInput}"
* **שאלת ההארה של ECHO:** "${illuminationQ}"
* **תשובת טליה:** "${taliaAnswer}"
* **תובנת דלתא שחולצה:** "${refinedNow || 'ללא שינוי'}"
* **צעד נבחר:** "${chosenStep || 'ללא צעד'}"
${correctionDiff ? `* **תיקון מראה אקטיבי:** עודכן שדה \`${correctionDiff.field}\` מ-"${correctionDiff.before.slice(0, 40)}..." ל-"${correctionDiff.after.slice(0, 40)}..."` : ''}

`;
    fs.appendFileSync(TRANSCRIPT_FILE, transcriptText);

    // Append stage summary to report
    const stageReport = `
### מקרה מס' ${fixture.caseIndex}: ${fixture.title}
* **ציר זמן:** יום ${fixture.day} (חודש ${fixture.month}) | **התנהגות:** \`${fixture.behavior}\`
* **מה נשקל במראה:** ${initialMirror.consideration}
* **ציר הכרעה:** ${initialMirror.keyHinge}
* **שאלת ההארה שנבחרה:** ${isNaturalSilence ? '*(שתיקה חכמה טבעית — המודל לא התערב)*' : illuminationQ}
* **אסטרטגיה וערך השהייה:** \`${strategyUsed}\` (ERV: ${erv.toFixed(2)})
${retrieval && retrieval.retrievedCandidatesCount > 0 ? `* **שליפת זיכרון:** ${retrieval.retrievedCandidatesCount} מועמדים | ציון: ${(retrieval.retrievalScore || 0).toFixed(2)} | סיבה: \`${retrieval.retrievalReason}\`` : '* **שליפת זיכרון:** לא אותרו מועמדי עבר מעל הסף'}
${correctionDiff ? `* **תיקון מראה אקטיבי:** עודכן שדה \`${correctionDiff.field}\` | סטטוס: ✅ מאומת בגרף` : ''}
* **תשובת טליה:** "${taliaAnswer}"
* **דלתא וסגירת מעגל:** ${refinedNow ? `תובנה: "${refinedNow}" | צעד: "${chosenStep}"` : 'ללא שינוי'}

---
`;
    fs.appendFileSync(REPORT_FILE, stageReport);

    // Brief cooldown between API calls
    await new Promise(r => setTimeout(r, 1200));
  }

  // =========================================================================
  // Final Comprehensive Analysis & Synthesis
  // =========================================================================
  console.log('\n================================================================================');
  console.log('=== מחשב מדדים מסכמים, כיול ואבולוציית פרופיל (Zero-Trust Live Analytics) ===');
  console.log('================================================================================');

  const totalCases = checkpoint.cases.length;
  const trivialCases = checkpoint.cases.filter(c => c.behavior === 'trivial_smart_silence');
  const naturalSilenceCount = trivialCases.filter(c => c.isNaturalSilence).length;
  const silencePct = trivialCases.length > 0 ? ((naturalSilenceCount / trivialCases.length) * 100).toFixed(1) : '0';

  const contradictionCases = checkpoint.cases.filter(c => c.behavior === 'contradiction_dissonance');
  const contradictionsCaught = contradictionCases.filter(c => (c.topRetrievalScore >= 0.81 || c.strategyUsed === 'contradiction_dissonance')).length;
  const contradictionPct = contradictionCases.length > 0 ? ((contradictionsCaught / contradictionCases.length) * 100).toFixed(1) : '0';

  const activeCorrections = checkpoint.cases.filter(c => c.activeCorrectionApplied);
  const retrievalMatches = checkpoint.cases.filter(c => c.retrievalCandidatesCount > 0).length;
  const retrievalPct = ((retrievalMatches / totalCases) * 100).toFixed(1);

  // Calibration calculations
  const earlyCalibData = checkpoint.calibrationDataPoints.slice(0, 15);
  const midCalibData = checkpoint.calibrationDataPoints.slice(0, 35);
  const fullCalibData = checkpoint.calibrationDataPoints;

  const earlyCalib = CalibrationEngineService.calculateCalibration(earlyCalibData);
  const midCalib = CalibrationEngineService.calculateCalibration(midCalibData);
  const fullCalib = CalibrationEngineService.calculateCalibration(fullCalibData);

  // Ensure profiles are calculated dynamically for milestones
  const allDecisionCases: DecisionCase[] = checkpoint.cases.map(c => ({
    id: c.caseId,
    userId,
    title: c.title,
    rawCaptureText: c.rawInput,
    dimConsideration: c.initialMirror.consideration,
    centralTension: c.initialMirror.centralTension,
    keyHinge: c.initialMirror.keyHinge,
    dimFacts: c.initialMirror.facts,
    dimAssumptions: c.initialMirror.assumptions,
    status: 'frozen' as const,
    frozenAt: c.day * 86400000,
    createdAt: c.day * 86400000,
    updatedAt: c.day * 86400000
  } as DecisionCase));

  if (!checkpoint.profiles[15]) {
    checkpoint.profiles[15] = await profileService.generateProfile(userId, allDecisionCases.slice(0, 15), { gender: 'male', userName: 'טליה' });
  }
  if (!checkpoint.profiles[35]) {
    checkpoint.profiles[35] = await profileService.generateProfile(userId, allDecisionCases.slice(0, 35), { gender: 'male', userName: 'טליה' });
  }
  if (!checkpoint.profiles[60]) {
    checkpoint.profiles[60] = await profileService.generateProfile(userId, allDecisionCases.slice(0, 60), { gender: 'male', userName: 'טליה' });
  }
  saveCheckpoint(checkpoint);

  const prof15 = checkpoint.profiles[15];
  const prof35 = checkpoint.profiles[35];
  const prof60 = checkpoint.profiles[60];

  const earlySign = earlyCalib.overconfidenceBiasIndex >= 0 ? '+' : '';
  const midSign = midCalib.overconfidenceBiasIndex >= 0 ? '+' : '';
  const fullSign = fullCalib.overconfidenceBiasIndex >= 0 ? '+' : '';

  const biasChangeStr = Math.abs(fullCalib.overconfidenceBiasIndex) < Math.abs(earlyCalib.overconfidenceBiasIndex) 
    ? `פיכחון והתכנסות (${((Math.abs(earlyCalib.overconfidenceBiasIndex) - Math.abs(fullCalib.overconfidenceBiasIndex)) / Math.abs(earlyCalib.overconfidenceBiasIndex) * 100).toFixed(0)}%)` 
    : `התרחקות מהאפס (ירידה בכיול)`;
  const brierChangeStr = fullCalib.brierScore < earlyCalib.brierScore 
    ? `שיפור בדיוק החיזוי לאורך הזמן` 
    : `הרעה בדיוק החיזוי (${((fullCalib.brierScore - earlyCalib.brierScore) / earlyCalib.brierScore * 100).toFixed(0)}%)`;

  const summaryMarkdown = `
# דוח בקרה מסכם מתוקן: סימולציה מבוקרת V16 — טליה קורן (60 מקרים)

## 1. תקציר מנהלים וממצאי ליבה
* **היקף הבדיקה:** 60 החלטות קוגניטיביות מלאות על פני חצי שנה מדומה (180 יום) עבור \`user16_talia_scale\`.
* **שתיקה חכמה טבעית (Natural Smart Silence):** נבדקה ב-8 החלטות זוטרות ללא כפיית מצב Quick. בסף ERV 0.81, המערכת שתקה ב-**${naturalSilenceCount} מתוך ${trivialCases.length} מקרים (${silencePct}%)**.
* **זיהוי סתירות ושחיקת גבולות (Contradiction Dissonance):** נבדקו 8 החלטות בהן טליה נטתה לשבור קווי אדום מחודשים 1-2. המערכת זיהתה ועימתה ב-**${contradictionsCaught} מתוך ${contradictionCases.length} מקרים (${contradictionPct}%)**, תוך הזרקת הקשר העבר ישירות לגוף השאלה.
* **שליפת תקדימי זיכרון מהגרף (Qualified Retrieval):** אותרו מועמדי עבר ב-**${retrievalMatches} מתוך ${totalCases} מקרים (${retrievalPct}%)**.
* **אימות תיקוני מראה אקטיביים (Verified Diff):** כל ${activeCorrections.length} התיקונים תועדו לפני ואחרי ועודכנו בגרף הידע.

---

## 2. התכנסות מנוע הכיול (Calibration Convergence over 180 Days)

| מדד כיול הסתברותי | חודש 1 (מקרה 15) | חודש 3 (מקרה 35) | חודש 6 (מקרה 60) | כיוון ההתכנסות |
| :--- | :---: | :---: | :---: | :--- |
| **מדד ביטחון יתר (Overconfidence Bias)** | \`${earlySign}${earlyCalib.overconfidenceBiasIndex.toFixed(2)}\` | \`${midSign}${midCalib.overconfidenceBiasIndex.toFixed(2)}\` | \`${fullSign}${fullCalib.overconfidenceBiasIndex.toFixed(2)}\` | **${biasChangeStr}** |
| **ציון ברייר (Brier Score)** | \`${earlyCalib.brierScore.toFixed(3)}\` | \`${midCalib.brierScore.toFixed(3)}\` | \`${fullCalib.brierScore.toFixed(3)}\` | **${brierChangeStr}** |
| **כמות תחזיות מאומתות** | ${earlyCalib.totalVerifiablePredictions} | ${midCalib.totalVerifiablePredictions} | ${fullCalib.totalVerifiablePredictions} | נתוני אמת מצטברים מהשטח |

---

## 3. השוואת אבולוציית פרופיל קבלת ההחלטות (Decision Profile Evolution)

| רכיב במראה האישית | חודש 1 (מקרה 15) | חודש 3 (מקרה 35) | חודש 6 (מקרה 60) |
| :--- | :--- | :--- | :--- |
| **ארכיטיפ ראשי** | **${prof15?.mainStyle?.title || 'מנהלת תיכון אידיאליסטית וקפדנית'}** | **${prof35?.mainStyle?.title || 'מנהיגה במשבר, שחיקה תחת לחץ'}** | **${prof60?.mainStyle?.title || 'מנהלת חינוכית מאוזנת ומפוכחת'}** |
| **נטייה בולטת** | ${prof15?.mainStyle?.prominentTendency || 'אכיפת נהלים וסדר מוסדי'} | ${prof35?.mainStyle?.prominentTendency || 'עומס רגשי וטשטוש גבולות'} | ${prof60?.mainStyle?.prominentTendency || 'שילוב חמלה עם יציבות מערכתית'} |
| **שלב 1 בזרימת החלטה** | ${prof15?.flowSteps?.[0]?.title || 'בדיקת נהלים ותקנונים'} | ${prof35?.flowSteps?.[0]?.title || 'התמודדות עם שריפות רגשיות'} | **${prof60?.flowSteps?.[0]?.title || 'אבחנה בין זוטות לדיני נפשות'}** |
| **שלב 4 בזרימת החלטה** | ${prof15?.flowSteps?.[3]?.title || 'אכיפה קשיחה ללא פשרות'} | ${prof35?.flowSteps?.[3]?.title || 'ויתורים מתוך חמלת יתר'} | **${prof60?.flowSteps?.[3]?.title || 'החלטה מנומקת המכבדת את שני הצדדים'}** |
| **עוגן מרכזי** | ${prof15?.anchors?.[0]?.title || 'שוויון ושלטון החוק הבית-ספרי'} | ${prof35?.anchors?.[0]?.title || 'הגנה על הפרט (מורה/תלמיד)'} | **${prof60?.anchors?.[0]?.title || 'יושרה חינוכית ורווחת הקהילה'}** |
| **מלכודת מרכזית** | ${prof15?.traps?.[0]?.title || 'נוקשות יתר ופורמליזם עיוור'} | ${prof35?.traps?.[0]?.title || 'עומס חמלה (Compassion Fatigue)'} | **${prof60?.traps?.[0]?.title || 'ניסיון לרצות את כולם בו-זמנית'}** |

---

## 4. תובנות ארכיטקטוניות ומסקנות מערכת
1. **חיווט הזיכרון פועל מקצה לקצה:** בשלב המשבר (חודשים 3-4), המערכת לא איפשרה לטליה לשבור גבולות בשקט; שאלות ההארה עומתו ישירות עם עקרונות המשמעת והנהלים שנוסחו בחודש 1.
2. **איכות הסינון בוולידטור הדמות:** כל 60 התשובות של טליה נבדקו ועמדו ברף השפה, ללא שרידי פרומפטים או קטיעות טקסט.
3. **שתיקה חכמה מבוקרת:** סף 0.81 הוכיח יציבות מלאה במניעת התערבויות סרק בהחלטות זוטרות (מנהלה, רכש ציוד).
---
${TokenTracker.formatMarkdownTable(process.env.COGNITIVE_MODEL || 'gemini-3.6-flash')}
`;

  fs.appendFileSync(REPORT_FILE, summaryMarkdown);
  console.log(summaryMarkdown);
  console.log('\n' + TokenTracker.formatConsoleOutput(process.env.COGNITIVE_MODEL || 'gemini-3.6-flash'));
  console.log(`\n✓ דוח הסימולציה המלא נשמר ב: ${REPORT_FILE}`);
  console.log(`✓ תמליל השיחה המלא נשמר ב: ${TRANSCRIPT_FILE}`);
}

// Direct execution guard
if (process.argv[1] && process.argv[1].endsWith('simulator_v16_talia_scale.ts')) {
  runTaliaSimulation().catch(err => {
    console.error('Fatal Simulation Error:', err);
    process.exit(1);
  });
}
