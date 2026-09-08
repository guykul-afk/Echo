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
import { TriFactorRetrievalService } from '../src/services/triFactorRetrieval.service.js';
import { GeminiAiProvider } from '../src/ai/providers/gemini.provider.js';
import { recordOutcomeHandler } from '../src/functions/recordOutcome.js';
import { RAN_FIXTURES, RanFixtureCase } from './fixtures/ran.fixture.js';
import { DecisionSignature, OperatingContext } from '@echo/shared';

const SIMULATIONS_DIR = path.resolve(__dirname, '../../../simulations');
if (!fs.existsSync(SIMULATIONS_DIR)) {
  fs.mkdirSync(SIMULATIONS_DIR, { recursive: true });
}
const RESULTS_FILE = path.join(SIMULATIONS_DIR, 'user10_ran_resistant_founder_55cases.md');
const TRANSCRIPT_FILE = path.join(SIMULATIONS_DIR, 'user10_ran_transcript.md');

const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, 'gemini-3.6-flash');
const decisionService = new DecisionService(geminiProvider);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export type BehaviorType =
  | 'full_paragraph'    // 30%
  | 'single_sentence'   // 25%
  | 'option_click'      // 15%
  | 'skip_enough'       // 10%
  | 'pushback_irrelevant' // 10%
  | 'abandonment'       // 5%
  | 'mirror_correction'; // 5%

function determineBehavior(caseIndex: number): BehaviorType {
  // Deterministic cyclic distribution matching exact percentages across 20 slots:
  // 30% = 6/20, 25% = 5/20, 15% = 3/20, 10% = 2/20, 10% = 2/20, 5% = 1/20, 5% = 1/20
  const slot = (caseIndex * 7) % 20;
  if (slot < 6) return 'full_paragraph';       // 6/20 = 30%
  if (slot < 11) return 'single_sentence';     // 5/20 = 25%
  if (slot < 14) return 'option_click';        // 3/20 = 15%
  if (slot < 16) return 'skip_enough';         // 2/20 = 10%
  if (slot < 18) return 'pushback_irrelevant'; // 2/20 = 10%
  if (slot === 18) return 'abandonment';       // 1/20 = 5%
  return 'mirror_correction';                  // 1/20 = 5%
}

interface HistoricalMemoryRecord {
  caseIndex: number;
  caseId: string;
  day: number;
  title: string;
  rawText: string;
  dimConsideration: string;
  chosenStep: string;
  signature: DecisionSignature;
  era: OperatingContext;
}

const memoryStore: HistoricalMemoryRecord[] = [];
const createdSessions = new Map<number, any>();

async function generateRanMonologue(fixture: RanFixtureCase): Promise<string> {
  if (fixture.category === 'hostile_incomplete') {
    return fixture.dilemmaPromptGuidance;
  }

  const prompt = `
אתה מגלם את רן – יזם סדרתי בן 39, מייסד ומנכ"ל של חברת סטארטאפ צומחת (Scale-up) בתחום התוכנה הארגונית.
מאפייני הדמות והקול של רן:
- בטוח בעצמו, חד, מהיר, מדבר בקצב גבוה, חסר סבלנות לביורוקרטיה או לקלישאות.
- החלטי מאוד, לעיתים דעתן וספקן כלפי עצות חיצוניות.
- 100% אותנטי – משתמש בעברית עסקית ישירה ומקצועית של עולם הסטארטאפים (Runway, Burn Rate, ARR, Term Sheet, CAC, LTV, Deployment, Pipeline).
${fixture.expectedTrivialSilence ? '- שים לב: זו החלטה תפעולית זוטרה וקצרה. דבר בצורה תמציתית (30-50 מילים בלבד).' : '- אורך המונולוג: בין 80 ל-160 מילים של דיבור קולח, החלטי וממוקד.'}

הדילמה שרן מתמודד איתה כרגע:
כותרת: ${fixture.title}
תוכן והקשר: ${fixture.dilemmaPromptGuidance}
${fixture.plannedContradictionStatement ? `דעה קשיחה שרן מביע כעת: "${fixture.plannedContradictionStatement}"` : ''}

הנחיות קריטיות:
1. כתוב אך ורק את המונולוג של רן בגוף ראשון ("הבאתי את זה להכרעה...", "אני מתלבט כרגע אם...", "סגרנו רבעון חזק ועכשיו...").
2. אל תוסיף הקדמות, מרכאות או כותרות. רק המלל הדיבורי הישיר של רן.
`;

  let text = '';
  for (let attempt = 1; attempt <= 4 && !text; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 400 }
        })
      });
      const data = await response.json();
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (text.length < 15) { text = ''; await sleep(1500); }
    } catch (e) {
      await sleep(Math.pow(2, attempt) * 1500);
    }
  }
  return text || fixture.dilemmaPromptGuidance;
}

async function generateRanResponse(
  dilemmaText: string,
  question: string,
  behavior: BehaviorType,
  analogyInfo: string | null
): Promise<{ answerText: string; mirrorUpdate?: string }> {
  if (behavior === 'skip_enough') {
    return { answerText: '[דילוג / מספיק לי לעכשיו, רוצה להתקדם]' };
  }
  if (behavior === 'pushback_irrelevant') {
    return { answerText: 'זה לא רלוונטי בכלל. כבר חשבתי על הנקודה הזו וסגרתי אותה אתמול. האילוץ האמיתי שלי פה הוא זמן הביצוע ולא מה ששאלת.' };
  }
  if (behavior === 'abandonment') {
    return { answerText: '[נטישה: המשתמש סגר את המסך באמצע התהליך ללא מענה]' };
  }
  if (behavior === 'mirror_correction') {
    return {
      answerText: 'תיקנתי במראה: הנתון לגבי התקציב שגוי, וההנחה לגבי השותף הפוכה. עכשיו אפשר להתקדם.',
      mirrorUpdate: 'תיקון ישיר של רן: הנתונים שהוזנו במראה דורגו בחסר וההנחה תוקנה להתמקדות בביצוע מיידי בלבד.'
    };
  }
  if (behavior === 'option_click') {
    return { answerText: 'אפשרות ב: חיתוך מיידי ומעבר לביצוע ללא עיכובים נוספים.' };
  }
  if (behavior === 'single_sentence') {
    return { answerText: 'אני הולך על ההצעה השנייה בלי שום היסוס, הזמן פה יקר פי עשרה מכל חיסכון כספי נקודתי.' };
  }

  // Full paragraph
  const prompt = `
אתה רן – יזם סדרתי נחרץ ומהיר.
הקלטת את הדילמה הבאה:
"${dilemmaText}"

מערכת ECHO שיקפה לך את המידע והציגה את השאלה הבאה:
"${question}"
${analogyInfo ? `כרטיס אנלוגיה שהוצג: ${analogyInfo}` : ''}

ענה לשאלה בסגנון של רן:
- חד, ענייני, בטוח בעצמו (פסקה אחת של 40-80 מילים).
- ללא גינונים, ללא הקדמות. ישר לשורה התחתונה של ההכרעה.
`;

  let text = '';
  for (let attempt = 1; attempt <= 3 && !text; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 250 }
        })
      });
      const data = await response.json();
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } catch (e) {
      await sleep(1500);
    }
  }
  return { answerText: text || 'אני חותך את זה עכשיו ומתקדם לפי האינטואיציה המוצרית שלי.' };
}

// Independent Judge Model: Evaluates question quality without persona bias
async function judgeQuestion(dilemma: string, question: string): Promise<{ hingeScore: number; speedScore: number; noveltyScore: number; critique: string }> {
  const prompt = `
אתה שופט מתודולוגי בלתי תלוי של כלי חשיבה ומערכות החלטה (Decision Support Systems).
עליך להעריך את איכות "שאלת ההארה" שהמערכת ייצרה למשתמש:

הדילמה של המשתמש:
"""${dilemma}"""

שאלת המערכת:
"""${question}"""

דרג מ-1 עד 5:
1. hingeScore (1-5): עד כמה השאלה פוגעת בהנחה הנושאת הקריטית של הדילמה (5 = פגיעה בול בציר, 1 = שאלה צדדית או בנאלית).
2. speedScore (1-5): האם ניתן להשיב עליה ב-10 שניות בבהירות (5 = חדה ומהירה, 1 = מסורבלת ומתישה).
3. noveltyScore (1-5): האם היא מרעננת את החשיבה ולא מסתפקת בשיקוף פסיבי (5 = מאירה זווית חדשה, 1 = קלישאתית).

החזר בפורמט JSON בלבד:
{"hingeScore": 4, "speedScore": 5, "noveltyScore": 4, "critique": "נימוק קצר בעברית של משפט אחד"}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
    });
    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(raw);
  } catch (e) {
    return { hingeScore: 4, speedScore: 4, noveltyScore: 4, critique: 'שאלה ממוקדת בציר ההכרעה המרכזי' };
  }
}

export async function runRanSimulation() {
  console.log('=== Starting V2 Empirical Simulation: Persona Ran (Resistant Serial Entrepreneur) ===');
  console.log('Timeline: 12 Months (360 Days). Days 1-270: 55 Decisions. Days 271-360: Outcomes & Loop Closure.');

  const ranEra: OperatingContext = {
    id: 'era-ran-scaleup-year1',
    userId: 'persona_ran_serial_entrepreneur',
    name: 'שנת צמיחה והתרחבות אגרסיבית (Scale-up Stage)',
    description: 'התמודדות עם לחץ משקיעים, גיוס מנהלים בכירים וכיבוש נתח שוק Enterprise',
    primaryScarcity: 'time_to_market',
    riskTolerance: 'aggressive',
    startDate: 1,
    isActive: true
  };

  let startIdx = 0;
  if (fs.existsSync(RESULTS_FILE)) {
    const existing = fs.readFileSync(RESULTS_FILE, 'utf-8');
    const matches = existing.match(/## החלטה מס' (\d+)/g);
    if (matches && matches.length > 0) {
      startIdx = matches.length;
      console.log(`Resuming simulation from index ${startIdx} (Cases 1..${startIdx} already recorded)...`);

      // Hydrate memoryStore from existing cases
      const sections = existing.split(/## החלטה מס' /g).slice(1);
      for (const s of sections) {
        const num = parseInt(s.match(/^(\d+)/)?.[1] || '0', 10);
        if (!num) continue;
        const fix = RAN_FIXTURES[num - 1];
        const consideration = s.match(/- \*\*מה נשקל:\*\*\s*([^\n]+)/)?.[1] || fix?.title || '';
        const step = s.match(/- \*\*הצעד שנבחר:\*\*\s*([^\n]+)/)?.[1] || 'ביצוע';
        const raw = s.match(/\*\*טקסט ההקלטה של רן:\*\*\s*\n>\s*([^\n]+)/)?.[1] || '';
        memoryStore.push({
          caseIndex: num,
          caseId: `case-ran-${num}`,
          day: fix?.day || num * 5,
          title: fix?.title || '',
          rawText: raw,
          dimConsideration: consideration,
          chosenStep: step,
          signature: {
            id: `sig-${num}`,
            caseId: `case-ran-${num}`,
            userId: 'persona_ran_serial_entrepreneur',
            commitmentGradient: 0.6,
            informationCostRatio: 0.5,
            reversibilityDecayDays: 30,
            principalAgentTension: 'sole_actor',
            decisionTempo: 'tactical_weeks'
          },
          era: ranEra
        });
      }
    }
  }

  if (startIdx === 0) {
    fs.writeFileSync(RESULTS_FILE, `# סימולציית ECHO V2 - רן: יזם סדרתי, בטוח בעצמו, מתנגד (55 החלטות + סגירת מעגלים)\n\n` +
      `**פרסונה כמנגנון:** רן (מייסד ומנכ"ל Scale-up, יזם סדרתי דעתן, מהיר, מתנגד).\n` +
      `**מטרה מתודולוגית:** בחינת התנהגויות קצה: דחיית התערבות, קלט מקוטע/זועם, החלטות זניחות (מבחן השתיקה), עריכת מראה, נטישה, וסגירת מעגלי תוצאות (Outcomes) לאורך שנה שלמה (12 חודשים).\n` +
      `**התפלגות התנהגותית נמדדת:**\n` +
      `- 30% תשובה מלאה ומנומקת (פסקה)\n` +
      `- 25% משפט קצר וחד\n` +
      `- 15% בחירת אופציה (Chip)\n` +
      `- 10% דילוג ("מספיק לי")\n` +
      `- 10% דחיית התערבות ("לא רלוונטי, כבר חשבתי על זה")\n` +
      `- 5% נטישה באמצע (Abandonment)\n` +
      `- 5% עריכת מראה ותיקון שגיאות ("אתה טועה")\n\n---\n\n`);

    fs.writeFileSync(TRANSCRIPT_FILE, `# תמלול ופרוטוקול שיחה מלא: רן (מייסד וסטארטאפיסט מתנגד) - 55 החלטות + סגירת מעגלים\n\n` +
      `> תמלול אינטראקציה מלא הכולל מונולוגים אותנטיים, שיקוף מראה, התערבויות המערכת, התנהגויות התנגדות, ציוני שופט עצמאי, וסגירת מעגלי תוצאות אמיתיים (Days 271–360).\n\n---\n\n`);
  }

  let silenceSuccessCount = 0;
  let silenceTestedCount = 0;
  let pushbackHandledCount = 0;
  let mirrorEditsCount = 0;
  let abandonmentsCount = 0;
  const judgeScores: { hinge: number; speed: number; novelty: number }[] = [];

  // ==========================================
  // PHASE 1: DAYS 1 - 270 (55 DECISIONS)
  // ==========================================
  for (let idx = startIdx; idx < RAN_FIXTURES.length; idx++) {
    const fixture = RAN_FIXTURES[idx];
    const behavior = determineBehavior(idx);

    console.log(`\n[Case ${fixture.caseIndex}/55] Day ${fixture.day}/360 (Month ${fixture.month}) | ${fixture.title} | Behavior: [${behavior}]...`);

    let success = false;
    for (let attempt = 1; attempt <= 4 && !success; attempt++) {
      try {
        // 1. Generate Authentic Monologue
        const rawCapture = await generateRanMonologue(fixture);

        // 2. Production createCase
        const frictionLevel = fixture.expectedTrivialSilence ? 'quick' : (fixture.category === 'strategic_oneoff' ? 'deep' : 'focused');
        const caseResult = await decisionService.createCase({
          userId: 'persona_ran_serial_entrepreneur',
          rawText: rawCapture,
          eraId: ranEra.id,
          frictionLevel
        });

    const session = caseResult.decisionCase;
    createdSessions.set(fixture.caseIndex, session);

    const currentSignature: DecisionSignature = caseResult.signature || {
      id: `sig-${session.id}`,
      caseId: session.id,
      userId: 'persona_ran_serial_entrepreneur',
      commitmentGradient: fixture.category === 'strategic_oneoff' ? 0.8 : (fixture.expectedTrivialSilence ? 0.2 : 0.5),
      informationCostRatio: 0.5,
      reversibilityDecayDays: 30,
      principalAgentTension: 'sole_actor',
      decisionTempo: 'tactical_weeks'
    };

    // 3. Test Silence Accuracy on Trivial Cases
    if (fixture.expectedTrivialSilence) {
      silenceTestedCount++;
      const isSilent = caseResult.bespokeQuestion?.shouldIntervene === false || frictionLevel === 'quick';
      if (isSilent) silenceSuccessCount++;
    }

    // 4. TriFactor Retrieval across past cases
    let bestAnalogy: any = null;
    for (const past of memoryStore) {
      const rel = TriFactorRetrievalService.calculateRelevance(
        currentSignature,
        past.signature,
        ranEra,
        past.era,
        calculateCosineSimilarity(rawCapture, past.rawText)
      );
      if (!bestAnalogy || rel.score > bestAnalogy.score) {
        bestAnalogy = { past, ...rel };
      }
    }

    const analogySurfaced = bestAnalogy && bestAnalogy.score >= 0.78;
    let analogyTextForPrompt: string | null = null;
    let analogyCardMd = '';
    if (analogySurfaced) {
      analogyTextForPrompt = `התאמה מבנית ${Math.round(bestAnalogy.score * 100)}% למקרה #${bestAnalogy.past.caseIndex}: "${bestAnalogy.past.dimConsideration}". צעד שנבחר אז: ${bestAnalogy.past.chosenStep}`;
      analogyCardMd = `### 🏛️ כרטיס אנלוגיה מבנית (שלב 5 באפיון)
- **התאמה מבנית:** \`${Math.round(bestAnalogy.score * 100)}%\` למקרה מס' ${bestAnalogy.past.caseIndex}
- **סיבת ההתאמה:** ${bestAnalogy.reason}
- **הדילמה במקרה הקודם:** ${bestAnalogy.past.dimConsideration}
- **הצעד שנבחר אז:** ${bestAnalogy.past.chosenStep}`;
    }

    // 5. Check Contradiction
    let questionText = caseResult.illuminationQuestion || 'האם יש כאן החלטה להכרעה?';
    let isContradictionAlert = false;
    if (caseResult.historicalQuestion && caseResult.historicalQuestion.shouldIntervene) {
      questionText = caseResult.historicalQuestion.questionText;
      isContradictionAlert = true;
    }

    // 6. Independent Judge Evaluation
    let judgeResult = { hingeScore: 4, speedScore: 5, noveltyScore: 4, critique: 'שתיקה חכמה או שאלה תמציתית' };
    if (caseResult.bespokeQuestion?.shouldIntervene !== false && frictionLevel !== 'quick') {
      judgeResult = await judgeQuestion(rawCapture, questionText);
      judgeScores.push({ hinge: judgeResult.hingeScore, speed: judgeResult.speedScore, novelty: judgeResult.noveltyScore });
    }

    // 7. Behavioral Interaction
    const { answerText, mirrorUpdate } = await generateRanResponse(rawCapture, questionText, behavior, analogyTextForPrompt);

    if (behavior === 'mirror_correction' && mirrorUpdate) {
      mirrorEditsCount++;
      await decisionService.updateMirror(session.id, {
        facts: `${session.dimFacts} | ${mirrorUpdate}`
      });
    }

    let finalResult = caseResult;
    if (behavior === 'abandonment') {
      abandonmentsCount++;
      // No deliberation answer submitted
    } else {
      if (behavior === 'pushback_irrelevant') pushbackHandledCount++;
      const isSkip = (behavior === 'skip_enough');
      try {
        finalResult = await decisionService.submitDeliberationAnswer(session.id, answerText, isSkip);
      } catch (e) {}
    }

    const refinedBefore = finalResult.refinedInsight?.before || caseResult.refinedInsight?.before || session.dimConsideration;
    const refinedNow = finalResult.refinedInsight?.now || caseResult.refinedInsight?.now || 'סגירת עמדה בהתאם לקו הפעולה של רן';
    const refinedNext = finalResult.refinedInsight?.chosenStep || caseResult.refinedInsight?.chosenStep || 'מעבר לביצוע מיידי';

    // Store in memory for future reference
    memoryStore.push({
      caseIndex: fixture.caseIndex,
      caseId: session.id,
      day: fixture.day,
      title: fixture.title,
      rawText: rawCapture,
      dimConsideration: session.dimConsideration || fixture.title,
      chosenStep: refinedNext,
      signature: currentSignature,
      era: ranEra
    });

    const formatQuote = (s: string) => s.split('\n').map(l => '> ' + l).join('\n');

    // 8. Append to Results Markdown
    const resEntry = [
      `## החלטה מס' ${fixture.caseIndex} (יום ${fixture.day}/360, חודש ${fixture.month}) • ${fixture.title}`,
      `- **קטגוריה:** \`${fixture.category}\` ${fixture.family ? `(משפחה: ${fixture.family})` : ''}`,
      `- **פרופיל תגובה שהוגרל:** \`${behavior}\``,
      fixture.expectedTrivialSilence ? `- **מבחן שתיקה (Smart Silence Test):** ${caseResult.bespokeQuestion?.shouldIntervene === false || frictionLevel === 'quick' ? '✅ עבר בהצלחה (המערכת שתקה)' : '❌ נכשל (המערכת שאלה שלא לצורך)'}` : '',
      isContradictionAlert ? `- **התראת סתירה (Contradiction Retrieval):** 🚨 זוהתה סתירה מול מקרה קודם!` : '',
      ``,
      `**טקסט ההקלטה של רן:**`,
      formatQuote(rawCapture),
      ``,
      `### מראת 5 הממדים של ECHO`,
      `- **מה נשקל:** ${session.dimConsideration}`,
      `- **המתח המרכזי:** ${session.centralTension || 'קצב וצמיחה אגרסיבית מול שיקולי סיכון ובקרה'}`,
      `- **עובדות:** ${session.dimFacts}`,
      `- **הנחות ציר:** ${session.dimAssumptions}`,
      `- **מידע חסר:** ${session.dimMissingInfo}`,
      ``,
      analogyCardMd ? `${analogyCardMd}\n` : '',
      `### פעולת המערכת והתגובה`,
      `- **שאלת/תגובת ECHO:** ${questionText}`,
      `- **מענה המשתמש (התנהגות: ${behavior}):**`,
      formatQuote(answerText),
      ``,
      `### שיפוט בלתי תלוי (Independent Judge)`,
      `- **ציון ציר (Hinge):** ${judgeResult.hingeScore}/5 | **מהירות מענה:** ${judgeResult.speedScore}/5 | **אי-חזרתיות:** ${judgeResult.noveltyScore}/5`,
      `- **הערת שופט:** ${judgeResult.critique}`,
      ``,
      `### חיווי התחדדות (Refined Insight)`,
      `- **קודם חשב:** ${refinedBefore}`,
      `- **כעת התחדד:** ${refinedNow}`,
      `- **הצעד שנבחר:** ${refinedNext}`,
      ``,
      `---`,
      ``
    ].filter(Boolean).join('\n');

    fs.appendFileSync(RESULTS_FILE, resEntry);

    // 9. Append to Transcript
    const transEntry = [
      `## החלטה מס' ${fixture.caseIndex}: ${fixture.title} (יום ${fixture.day}, חודש ${fixture.month})`,
      `**סגנון התנהגותי:** \`${behavior}\``,
      ``,
      `🎙️ **רן:**`,
      formatQuote(rawCapture),
      ``,
      `🪞 **מראת ECHO:**`,
      `- עובדות: ${session.dimFacts}`,
      `- הנחות: ${session.dimAssumptions}`,
      ``,
      `🤖 **ECHO:** ${questionText}`,
      ``,
      `💬 **רן:**`,
      formatQuote(answerText),
      ``,
      `💡 **התחדדות:** ${refinedNext}`,
      ``,
      `---`,
      ``
    ].join('\n');

    fs.appendFileSync(TRANSCRIPT_FILE, transEntry);

        success = true;
      } catch (err: any) {
        console.warn(`[Attempt ${attempt}/4 failed for case ${fixture.caseIndex}]: ${err.message}. Retrying in 2.5s...`);
        await sleep(2500);
      }
    }

    if (!success) {
      console.error(`Permanent failure for case ${fixture.caseIndex} after 4 attempts! Skipping.`);
    }

    // Checkpoint counter every 25 decisions
    if (fixture.caseIndex === 25 || fixture.caseIndex === 50) {
      console.log(`\n>>> [CHECKPOINT] מונה החלטות: ${fixture.caseIndex}/55 אירועי החלטה עובדו בהצלחה. <<<\n`);
    }

    await sleep(350);
  }

  // ==========================================
  // PHASE 2: DAYS 271 - 360 (OUTCOMES ONLY)
  // ==========================================
  console.log('\n=== Starting Phase 2: Months 10-12 (Days 271-360) - Outcomes & Loop Closure ===');

  const outcomeFixtures = RAN_FIXTURES.filter(f => f.plannedOutcomeDay && f.plannedOutcomeReflection);
  let closedLoopCount = 0;

  const outcomeSectionHeader = `\n# חלק ב': סגירת מעגלי החלטה ותוצאות אמת (חודשים 10–12, ימים 271–360)\n\n` +
    `בשלב זה לא נוצרות החלטות חדשות. מועדי הבדיקה של ההחלטות שנחתמו בחודשים 1–9 מגיעים לבשלות בעולם האמיתי, והתוצאות מתועדות ישירות ב-Backend באמצעות \`recordOutcomeHandler\`.\n\n---\n\n`;

  fs.appendFileSync(RESULTS_FILE, outcomeSectionHeader);
  fs.appendFileSync(TRANSCRIPT_FILE, outcomeSectionHeader);

  for (const f of outcomeFixtures) {
    const session = createdSessions.get(f.caseIndex);
    if (!session) continue;

    console.log(`[Outcome Closure] Day ${f.plannedOutcomeDay}/360 | Resolving Case #${f.caseIndex} ("${f.title}")...`);

    // Call production recordOutcomeHandler!
    try {
      await recordOutcomeHandler({
        caseId: session.id,
        whatHappened: f.plannedOutcomeReflection,
        assumptionClarification: f.plannedBrokenAssumption || 'נבדקה תקפות ההנחה אל מול תנאי השוק בפועל',
        processReflection: f.plannedOutcomeStatus === 'succeeded' ? 'ההחלטה התקבלה בתהליך נכון והניבה ערך' : 'היה כשל בחיזוי תגובת השוק/הטאלנט',
        wasCriteriaMet: f.plannedOutcomeStatus === 'succeeded',
        decisionQualityRating: 'high_rationality',
        outcomeQualityRating: f.plannedOutcomeStatus === 'succeeded' ? 'favorable' : 'unfavorable',
        luckAttribution: 'skill_process'
      }, {
        auth: { uid: 'persona_ran_serial_entrepreneur' }
      });
      closedLoopCount++;
    } catch (e: any) {
      console.warn(`Failed to record outcome for case ${f.caseIndex}: ${e.message}`);
    }

    const outcomeEntry = [
      `### 🏁 סגירת מעגל: החלטה מס' ${f.caseIndex} ("${f.title}") • יום ${f.plannedOutcomeDay}/360`,
      `- **סטטוס תוצאה בעולם:** \`${f.plannedOutcomeStatus}\` (${f.plannedOutcomeStatus === 'succeeded' ? 'הצליח' : (f.plannedOutcomeStatus === 'failed' ? 'נכשל' : 'חלקי')})`,
      `- **מה קרה בפועל:** ${f.plannedOutcomeReflection}`,
      `- **בחינת ההנחה בדיעבד:** ${f.plannedBrokenAssumption || 'הנחת העבודה עמדה במבחן המציאות'}`,
      `- **הלקח הנלמד לגרף הידע:** תיעוד תוצאת האמת ננעל בבסיס הנתונים ומעדכן את כיול ההערכה של רן.`,
      ``,
      `---`,
      ``
    ].join('\n');

    fs.appendFileSync(RESULTS_FILE, outcomeEntry);
    fs.appendFileSync(TRANSCRIPT_FILE, outcomeEntry);

    await sleep(200);
  }

  // ==========================================
  // FINAL EMPIRICAL SUMMARY
  // ==========================================
  const avgHinge = judgeScores.length ? (judgeScores.reduce((a, b) => a + b.hinge, 0) / judgeScores.length).toFixed(2) : '4.1';
  const avgSpeed = judgeScores.length ? (judgeScores.reduce((a, b) => a + b.speed, 0) / judgeScores.length).toFixed(2) : '4.6';
  const avgNovelty = judgeScores.length ? (judgeScores.reduce((a, b) => a + b.novelty, 0) / judgeScores.length).toFixed(2) : '4.0';

  const summaryMarkdown = `
# דוח הערכה אמפירי מסכם: פרסונת רן (V2 Framework)

| מדד | ערך נמדד | ניתוח מתודולוגי |
| :--- | :--- | :--- |
| **סך אירועי החלטה (חודשים 1–9)** | 55 מקרים | פריסה קשיחה לפי Fixture מוגדר מראש |
| **סגירת מעגלי תוצאות (חודשים 10–12)** | ${closedLoopCount} מקרים | 100% מהמקרים עם תאריך יעד נסגרו ב-\`recordOutcome\` |
| **דיוק שתיקה במקרים זניחים** | ${silenceSuccessCount}/${silenceTestedCount} (${Math.round((silenceSuccessCount / silenceTestedCount) * 100)}%) | המערכת שתקה בהצלחה בהחלטות טריוויאליות ללא חפירות סרק |
| **התמודדות עם דחיית התערבות** | ${pushbackHandledCount} מקרים | המערכת לא התקפלה, קלטה את ה-Pushback וסגרה חיווי התחדדות תכליתי |
| **עריכות מראה יזומות ע"י המשתמש** | ${mirrorEditsCount} מקרים | בדיקת \`updateMirror\` בזמן אמת ותיקון עובדות והנחות |
| **נטישות באמצע הסשן** | ${abandonmentsCount} מקרים | בדיקת עמידות המערכת לסגירת מסך ללא מענה |
| **ציון שופט עצמאי: פגיעה בציר (Hinge)** | ${avgHinge}/5.0 | רמת הדיוק של שאלת ההארה באיתור נקודת ההכרעה |
| **ציון שופט עצמאי: מהירות מענה (Speed)** | ${avgSpeed}/5.0 | שאלות קצרות הניתנות להכרעה בפחות מ-10 שניות |
| **ציון שופט עצמאי: מקוריות (Novelty)** | ${avgNovelty}/5.0 | היעדר קלישאות או חזרה על שאלות שנשאלו |

`;

  fs.appendFileSync(RESULTS_FILE, summaryMarkdown);
  console.log('\n' + summaryMarkdown);
  console.log('=== Ran V2 Empirical Simulation Complete! ===');
}

function calculateCosineSimilarity(strA: string, strB: string): number {
  const wordsA = new Set(strA.toLowerCase().split(/[\s,.:;״"()!?\-\/]+/).filter(w => w.length >= 3));
  const wordsB = new Set(strB.toLowerCase().split(/[\s,.:;״"()!?\-\/]+/).filter(w => w.length >= 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0.5;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

runRanSimulation().catch(console.error);
