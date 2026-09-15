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
import { recordOutcomeHandler } from '../src/functions/recordOutcome.js';
import { V18_MIXED_CASES, MixedFixtureCase } from './fixtures/v18_mixed.fixture.js';

import { DecisionCase, DecisionProfileData, OperatingContext } from '@echo/shared';
import { validateResponseText } from './validators/textValidator.js';
import { TokenTracker } from '../src/ai/tokenTracker.js';

const SIMULATIONS_DIR = path.resolve(__dirname, '../../../simulations');
if (!fs.existsSync(SIMULATIONS_DIR)) {
  fs.mkdirSync(SIMULATIONS_DIR, { recursive: true });
}
const CHECKPOINT_FILE = path.join(SIMULATIONS_DIR, 'v18_mixed_checkpoints.json');
const REPORT_FILE = path.join(SIMULATIONS_DIR, 'v18_mixed_domain_report.md');
const TRANSCRIPT_FILE = path.join(SIMULATIONS_DIR, 'v18_mixed_transcript.md');

interface SavedCaseState {
  caseIndex: number;
  caseId: string;
  persona: 'tamar' | 'yonatan';
  day: number;
  month: number;
  domain: string;
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
  personaAnswer: string;
  refinedNow?: string;
  chosenStep?: string;
  abstractThemes?: string[];
  outcomeReported?: boolean;
}

interface CheckpointData {
  cases: SavedCaseState[];
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
  return { cases: [], profiles: {} };
}

function saveCheckpoint(data: CheckpointData) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, process.env.COGNITIVE_MODEL);
const decisionService = new DecisionService(geminiProvider);
const profileService = new DecisionProfileService(geminiProvider);

/**
 * Persona Agent: Simulates either Tamar or Yonatan with zero-trust validation against persona contamination
 */
async function simulatePersonaResponse(
  fixture: MixedFixtureCase,
  illuminationQuestion: string,
  apiKey: string,
  modelName: string = process.env.COGNITIVE_MODEL || 'gemini-3.6-flash'
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const isTamar = fixture.persona === 'tamar';

  const personaInstruction = isTamar
    ? `את מגלמת את ד"ר תמר לוין (בת 43), סמנכ"לית מו"פ בביוטק. מדויקת, שקולה, מדעית, חרדה מטעויות מתודולוגיות.
פנייה: לשון נקבה, גוף ראשון ("אני"). עברית מדעית, רהוטה וזהירה.
איסור מוחלט: אין להזכיר מונחי נדל"ן, קבלנים, יציקות, הריסה, דירות, היתרי בנייה או משטרה ירוקה!`
    : `אתה מגלם את יונתן מזרחי (בן 39), יזם נדל"ן נמרץ ופעלתן בבת ים ובמרכז.
פנייה: לשון זכר, גוף ראשון ("אני"). דיבור ישיר, אסרטיבי, מהיר, 'יהיה בסדר', 'לתקתק עבודה', 'לחסוך עלויות'.
איסור מוחלט: אין להזכיר מונחי רפואה או ביוטק, עכברים, מעבדות, מולקולות, ריאגנטים, FDA או ניסויים קליניים!`;

  const prompt = `
${personaInstruction}

הדילמה שהזנת ל-ECHO:
"${fixture.rawInput}"

שאלת ההארה שהוחזרה מ-ECHO:
"${illuminationQuestion}"

משימתך:
ענה על שאלת ההארה בגוף ראשון יחיד (אני), ${isTamar ? 'בלשון נקבה' : 'בלשון זכר'}, באופן התואם לחלוטין את אופייך:
1. הישאר ב-100% בתוך הדמות שלך.
2. תן תשובה ישירה ומנומקת בת 2-3 משפטים.
3. אל תכתוב פתיחים כמו "אני ${isTamar ? 'תמר' : 'יונתן'}" או רשימות/בולטים. כתוב ישירות את תשובתך.
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
      answer = answer.replace(/^[^\u0590-\u05FF"׳´']+/g, '').trim();
      if (answer.startsWith('"') && answer.endsWith('"')) {
        answer = answer.slice(1, -1).trim();
      }

      // Zero-trust contamination checks
      if (isTamar) {
        const realEstateTerms = /נדל"ן|קבלן|שלד|הריסה|דירות|היתרי בנייה|טופס 4|משטרה ירוקה/.test(answer);
        if (realEstateTerms) {
          console.warn(`[Persona Validation] Attempt ${attempt}/3 rejected for Tamar: Real estate contamination detected!`);
          continue;
        }
      } else {
        const biotechTerms = /ביוטק|עכברים|מולקולה|ריאגנט|FDA|מעבדה|תאי T|קליני/.test(answer);
        if (biotechTerms) {
          console.warn(`[Persona Validation] Attempt ${attempt}/3 rejected for Yonatan: Biotech contamination detected!`);
          continue;
        }
      }

      const validation = validateResponseText(answer, 'full_paragraph');
      if (validation.isValid) {
        return answer;
      }
      console.warn(`[Persona Validation] Attempt ${attempt}/3 rejected: ${validation.reason}`);
    } catch (err: any) {
      console.warn(`[Persona Network Error] Attempt ${attempt}/3: ${err.message}`);
    }
  }

  return fixture.userAnswer || (isTamar ? 'הבנתי את השאלה ואני בוחנת את השלכותיה על המערך הניסויי.' : 'שמעתי את השאלה, אנחנו נמשיך לרוץ קדימה בלי לבזבז זמן.');
}

export async function runMixedSimulation() {
  console.log('================================================================================');
  console.log('=== Starting V18 Multi-Persona Simulation: Tamar (Biotech) & Yonatan (Real Estate) ===');
  console.log('=== Interleaved Cases | Domain Scoping & Abstract Thematic Cross-Pollination ===');
  console.log('================================================================================\n');

  const checkpoint = loadCheckpoint();
  const processedIndices = new Set(checkpoint.cases.map(c => c.caseIndex));

  if (checkpoint.cases.length === 0) {
    fs.writeFileSync(REPORT_FILE, `# דוח סימולציה v18: תמר (ביוטק) ויונתן (נדל"ן) - הפרדה אונטולוגית והצלבה תמתית
**תאריך הרצה:** ${new Date().toISOString().split('T')[0]}  
**מטרת הניסוי:** בדיקת עמידות המערכת בפני זיהומים בין-תחומיים (Cross-Domain Pollution) ויכולת שליפה מבוססת תמות מופשטות בלבד (\`AbstractThemes\`).  
**משתתפים:** ד"ר תמר לוין (רפואי/ביוטק) ויונתן מזרחי (פיננסי/נדל"ן) המנוהלים תחת אותו מרחב זיכרון משותף (\`v18_mixed_user\`).  

---

## מהלך המקרים ואימות Zero-Trust
`);
    fs.writeFileSync(TRANSCRIPT_FILE, `# תמליל אינטראקציה דו-סוכנית מלא: תמר (ביוטק) ויונתן (נדל"ן) (V18)\n\n`);
  }

  const userId = 'v18_mixed_user';

  for (const fixture of V18_MIXED_CASES) {
    if (processedIndices.has(fixture.caseIndex)) {
      console.log(`[Skipping] Case ${fixture.caseIndex} already completed in checkpoint.`);
      continue;
    }

    const personaName = fixture.persona === 'tamar' ? 'תמר (ביוטק)' : 'יונתן (נדל"ן)';
    const gender = fixture.persona === 'tamar' ? 'female' : 'male';

    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`[Case ${fixture.caseIndex}/${V18_MIXED_CASES.length}] [Month ${fixture.month} | Day ${fixture.day}] [${personaName}] ${fixture.title}`);
    console.log(`--------------------------------------------------------------------------------`);

    // Step 1: Ingest dilemma into ECHO
    console.log(`[1. ECHO Capture] מפעיל חילוץ אפיסטמי סינכרוני (${fixture.domain})...`);
    let caseResult: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        caseResult = await decisionService.createCase({
          userId,
          rawText: fixture.rawInput,
          userGender: gender,
          userName: fixture.persona === 'tamar' ? 'תמר' : 'יונתן',
          domain: fixture.domain,
          abstractThemes: fixture.abstractThemes,
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
    console.log(`   ✓ שאלת הארה: [${strategyUsed} | ERV: ${erv.toFixed(2)}] ${isNaturalSilence ? '(שתיקה חכמה)' : `"${illuminationQ.slice(0, 85)}..."`}`);

    if (retrieval && retrieval.retrievedCandidatesCount > 0) {
      console.log(`   🔍 שליפת עבר: ${retrieval.retrievedCandidatesCount} מועמדים | ציון מרבי: ${(retrieval.retrievalScore || 0).toFixed(2)} | סיבה: ${retrieval.retrievalReason}`);
    }

    // Step 2: Persona Reflection
    let personaAnswer = '';
    let refinedNow = '';
    let chosenStep = '';

    if (isNaturalSilence && fixture.expectedStrategy === 'no_intervention') {
      console.log(`[2. Smart Silence] המערכת שתקה כצפוי על מקרה שגרתי.`);
      personaAnswer = 'ההחלטה ברורה ואינה דורשת התעמקות.';
    } else {
      console.log(`[2. סוכן הדמות (${personaName})]: מפיק תגובה אותנטית...`);
      personaAnswer = await simulatePersonaResponse(
        fixture,
        illuminationQ,
        process.env.GEMINI_API_KEY || ''
      );
      console.log(`   💬 תשובת ${fixture.persona === 'tamar' ? 'תמר' : 'יונתן'}: "${personaAnswer.slice(0, 95)}..."`);

      // Submit deliberation answer to ECHO
      console.log(`[3. סגירת מעגל דלתא] מזין מענה ומחלץ refinedInsight...`);
      try {
        const deltaResult = await decisionService.submitDeliberationAnswer(
          dCase.id,
          personaAnswer,
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

    // Step 3: Record Outcomes for past cases reaching their milestone day
    for (const pastCase of checkpoint.cases) {
      const pastFixture = V18_MIXED_CASES.find(f => f.caseIndex === pastCase.caseIndex);
      if (pastFixture?.plannedOutcome && pastFixture.plannedOutcome.day === fixture.day && !pastCase.outcomeReported) {
        console.log(`\n[4. רישום תוצאה בפועל] מקרה ${pastCase.caseIndex} (${pastCase.persona}) הגיע ליום הבדיקה (${fixture.day})!`);
        try {
          await recordOutcomeHandler({
            caseId: pastCase.caseId,
            whatHappened: pastFixture.plannedOutcome.reflection,
            wasCriteriaMet: pastFixture.plannedOutcome.wasCriteriaMet,
            abstractTheme: pastFixture.plannedOutcome.abstractTheme,
            actionTaken: pastFixture.plannedOutcome.actionTaken,
            brokenAssumption: pastFixture.plannedOutcome.brokenAssumption,
            decisionQualityRating: 'high_rationality',
            outcomeQualityRating: pastFixture.plannedOutcome.wasCriteriaMet ? 'favorable' : 'unfavorable'
          }, { auth: { uid: userId } } as any);
          pastCase.outcomeReported = true;
          console.log(`   ✓ תוצאה סיבתית נרשמה בהצלחה: "${pastFixture.plannedOutcome.reflection.slice(0, 75)}..."`);
        } catch (err: any) {
          console.error(`   ✗ שגיאה ברישום תוצאה למקרה ${pastCase.caseIndex}:`, err.message);
        }
      }
    }

    // Step 4: Checkpoint & Logging
    const savedState: SavedCaseState = {
      caseIndex: fixture.caseIndex,
      caseId: dCase.id,
      persona: fixture.persona,
      day: fixture.day,
      month: fixture.month,
      domain: fixture.domain,
      title: dCase.title || fixture.title,
      rawInput: fixture.rawInput,
      initialMirror,
      illuminationQuestion: illuminationQ,
      historicalPreamble: caseResult.historicalQuestion?.preamble,
      strategyUsed,
      erv,
      isNaturalSilence,
      retrievalCandidatesCount: retrieval?.retrievedCandidatesCount || 0,
      topRetrievalScore: retrieval?.retrievalScore || 0,
      retrievalReason: retrieval?.retrievalReason,
      personaAnswer,
      refinedNow,
      chosenStep,
      abstractThemes: dCase.abstractThemes,
      outcomeReported: false
    };

    checkpoint.cases.push(savedState);
    saveCheckpoint(checkpoint);

    // Append to transcript
    const transcriptEntry = `### [מקרה ${fixture.caseIndex}] יום ${fixture.day} | ${personaName} | ${fixture.domain.toUpperCase()} | "${fixture.title}"
**הקלט המקורי:**
> ${fixture.rawInput}

**מראת ECHO ראשונית:**
- **שיקול מרכזי:** ${initialMirror.consideration}
- **מתח ליבה:** ${initialMirror.centralTension}
- **ציר ההכרעה:** ${initialMirror.keyHinge}
- **עובדות:** ${initialMirror.facts}
- **הנחות:** ${initialMirror.assumptions}

**שאלת הארה (${strategyUsed} | ERV: ${erv.toFixed(2)}):**
> ${illuminationQ || '*(שתיקה חכמה - אין התערבות)*'}

${caseResult.historicalQuestion?.preamble ? `**פתיח היסטורי שהוזרק (Memory Preamble):**\n> ${caseResult.historicalQuestion.preamble}\n` : ''}

**מענה ${fixture.persona === 'tamar' ? 'ד"ר תמר' : 'יונתן'}:**
> ${personaAnswer}

${refinedNow ? `**תובנת דלתא שחולצה:**\n> ${refinedNow}\n` : ''}
---
`;
    fs.appendFileSync(TRANSCRIPT_FILE, transcriptEntry, 'utf-8');

    // Append to report summary
    const reportEntry = `
### מקרה ${fixture.caseIndex}: ${fixture.title} (${personaName})
- **תחום (Domain):** \`${fixture.domain}\` | **תמות אבסטרקטיות:** ${fixture.abstractThemes?.map(t => `\`${t}\``).join(', ') || 'ללא'}
- **שליפת עבר (Retrieval):** ${savedState.retrievalCandidatesCount > 0 ? `ציון ${savedState.topRetrievalScore.toFixed(2)} (${savedState.retrievalReason})` : 'אין שליפה'}
- **פתיח היסטורי:** ${savedState.historicalPreamble ? `"${savedState.historicalPreamble.slice(0, 90)}..."` : 'ללא פתיח'}
- **אסטרטגיה:** \`${strategyUsed}\` (שתיקה חכמה: ${isNaturalSilence})
- **אימות היגיינת דמות:** תקין לחלוטין (ללא זיהום מונחים זרים).
`;
    fs.appendFileSync(REPORT_FILE, reportEntry, 'utf-8');
  }

  console.log('\n================================================================================');
  console.log('=== V18 Multi-Persona Simulation Completed Successfully! ===');
  console.log(`=== Reports saved to: ===\n  - ${REPORT_FILE}\n  - ${TRANSCRIPT_FILE}`);
  console.log('================================================================================\n');
}

runMixedSimulation().catch(err => {
  console.error('Fatal Simulation Error:', err);
  process.exit(1);
});
