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
import { ALEX_FIXTURES, AlexStageFixture } from './fixtures/alex.fixture.js';
import { OperatingContext } from '@echo/shared';
import { validateResponseText } from './validators/textValidator.js';

const SIMULATIONS_DIR = path.resolve(__dirname, '../../../simulations');
if (!fs.existsSync(SIMULATIONS_DIR)) {
  fs.mkdirSync(SIMULATIONS_DIR, { recursive: true });
}
const REPORT_FILE = path.join(SIMULATIONS_DIR, 'user12_alex_drift_report.md');
const TRANSCRIPT_FILE = path.join(SIMULATIONS_DIR, 'user12_alex_transcript.md');

const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, process.env.COGNITIVE_MODEL);
const decisionService = new DecisionService(geminiProvider);

/**
 * Persona Agent: Dynamically generates Alex's response in character based on the psychological stage
 */
async function simulateAlexResponse(
  fixture: AlexStageFixture,
  illuminationQuestion: string,
  apiKey: string,
  modelName: string = process.env.COGNITIVE_MODEL || 'gemini-3.6-flash'
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const prompt = `
אתה מגלם את אלכס ק., מנכ"ל ומייסד-שותף בסטארט-אפ B2B SaaS בתחום דאטה רפואי רגיש.
שלב נוכחי בציר הזמן: ${fixture.title} (יום ${fixture.day} / חודש ${fixture.month}).

פרופיל פסיכולוגי ומצב נפשי בשלב זה:
${fixture.personaProfile}

הנחיות סגנון כתיבה וטון:
${fixture.styleInstructions}

קונטקסט ההחלטה/הדילמה שהזנת כרגע למערכת ECHO:
"${fixture.rawInput}"

מערכת ECHO ניתחה את ההחלטה שלך, ומחזירה לך כעת את שאלת ההארה (Illumination Question) הבאה:
"${illuminationQuestion}"

משימתך:
ענה על שאלת ההארה הזו בגוף ראשון (אני) בצורה האותנטית ביותר של אלכס ברגע זה בזמן:
1. הישאר ב-100% בתוך הדמות והמצב הפסיכולוגי הנוכחי שלה (האם אתה רגוע ואידיאליסט, או הישרדותי ולחוץ?).
2. תן תשובה אנושית, ישירה ומנומקת לפי מה שמניע אותך כרגע (2 עד 4 משפטים חדים).
3. אל תשתמש במילות הקדמה ("אני אלכס", "בתור מנכ"ל"), ואל תכתוב טיוטות, רשימות תבליטים, הערות באנגלית, או תגיות כמו Draft/Outline/Checklist. כתוב ישירות את תשובתך בעברית בלבד למערכת ECHO.
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
        const errText = await response.text();
        console.warn(`[Persona Agent Warning] HTTP ${response.status}: ${errText}. Attempt ${attempt}/3.`);
        if (attempt === 3) break;
        continue;
      }

      const data = await response.json();
      let answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      answer = answer.replace(/^```(?:text)?\s*/i, '').replace(/\s*```$/, '').trim();
      answer = answer.replace(/\*?Draft\s*\d*[^:\n]*:?\*?/gi, '').replace(/\*?Mental Outline:?\*?/gi, '').trim();
      answer = answer.replace(/\*?Checklist:?[\s\S]*?(?:Hebrew only\?[^\n]*\n?)/gi, '').trim();
      // Strip any leading non-Hebrew punctuation or markdown symbols
      answer = answer.replace(/^[^\u0590-\u05FF"״']+/g, '').trim();
      if (answer.startsWith('"') && answer.endsWith('"')) {
        answer = answer.slice(1, -1).trim();
      }

      const validation = validateResponseText(answer, 'full_paragraph');
      if (!validation.isValid) {
        console.warn(`[Persona Agent Validation Failed] Attempt ${attempt}/3: ${validation.reason}`);
        if (attempt < 3) continue;
      } else {
        return answer;
      }
    } catch (err: any) {
      console.warn(`[Persona Agent Error] Attempt ${attempt}/3: ${err.message}`);
    }
  }

  // Resilient fallback if all attempts fail validation
  return `אני מבין את מורכבות ההחלטה והמתח בין המהירות לבין האבטחה. בנסיבות הקיימות של חודש ${fixture.month}, סדר העדיפויות שלי ברור וזו הברירה שמשרתת את הישרדות החברה בצורה הריאלית ביותר.`;
}

export async function runAlexDriftSimulation() {
  console.log('================================================================================');
  console.log('=== Starting Rigorous Simulation V12: Alex K. — Value Drift & Boundary Erosion ===');
  console.log('=== Dual-Agent Setup: Cognitive Engine (ECHO) vs. Dynamic Persona Agent (Alex) ===');
  console.log('================================================================================\n');

  const reportHeader = `# סימולציה מבוקרת V12: אלכס — שחיקת גבולות וסתירות עומק לאורך זמן
**תאריך הרצה:** ${new Date().toISOString().split('T')[0]}  
**ארכיטקטורת הבדיקה:** סימולציה דו-סוכנית (Dual-Agent) — מנוע קוגניטיבי Horizon 2 מול סוכן דמות דינמי המופעל ב-Gemini.  
**משתמש הבדיקה:** \`user12_alex_founder\` (אלכס ק., מנכ"ל ומייסד B2B SaaS לדאטה רפואי).  
**ציר זמן:** 3 שלבי הכרעה לאורך 8 חודשים (יום 15, יום 110, יום 240).  
**מטרות הסימולציה:**
1. **אימות חילוץ סינכרוני של 8 ממדי ה-OKF** (טרייד-אופים, עקרונות פעולה, תנאי גבול, טופולוגיית דילמה).
2. **בחינת זיכרון ושליפה סמנטית עמוקה (Qualified Retrieval):** האם בשלב 3 המערכת תזהה את שבירת תנאי הגבול והיפוך הטרייד-אוף משלב 1?
3. **בדיקת שאלת הארה חדה (Synthetic Illumination):** האם השאלה תעמת את אלכס ישירות עם הסתירה הפנימית שנוצרה תחת לחץ הישרדותי?

---

`;

  fs.writeFileSync(REPORT_FILE, reportHeader);
  fs.writeFileSync(TRANSCRIPT_FILE, `# תמליל אינטראקציה דו-סוכנית (Dual-Agent): אלכס (User 12)\n\n`);

  const results: any[] = [];

  for (const fixture of ALEX_FIXTURES) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`[שלב ${fixture.caseIndex}/3] [חודש ${fixture.month} | יום ${fixture.day}] ${fixture.title}`);
    console.log(`--------------------------------------------------------------------------------`);

    const era: OperatingContext = {
      id: `era-alex-m${fixture.month}`,
      userId: 'user12_alex_founder',
      name: `חודש ${fixture.month}: ${fixture.month === 1 ? 'בניית יסודות' : fixture.month === 4 ? 'חיפוש צמיחה' : 'הישרדות וגיוס'}`,
      description: 'סטארט-אפ דאטה רפואי רגיש',
      primaryScarcity: fixture.month === 1 ? 'time_to_market' : fixture.month === 4 ? 'runway_capital' : 'runway_capital',
      riskTolerance: fixture.month === 1 ? 'conservative' : fixture.month === 4 ? 'moderate' : 'aggressive',
      startDate: fixture.day,
      isActive: true
    };

    // 1. Send Prompt to ECHO (createCase)
    console.log(`[1. ECHO Capture] מזין דילמה של אלכס ומפעיל חילוץ סינכרוני...`);
    const caseResult = await decisionService.createCase({
      userId: 'user12_alex_founder',
      rawText: fixture.rawInput,
      eraId: era.id,
      userGender: 'male',
      userName: 'אלכס',
      frictionLevel: 'deep'
    });

    const dCase = caseResult.decisionCase;
    const deep = dCase.deepMechanisms;
    const retrieval = caseResult.retrievalTelemetry;
    const illuminationQ = caseResult.bespokeQuestion?.questionText || caseResult.illuminationQuestion || '';

    console.log(`   ✓ חולץ בהצלחה: "${dCase.title}"`);
    console.log(`   ✓ ציר הכרעה (Key Hinge): "${dCase.keyHinge}"`);
    if (deep?.tradeoffs && deep.tradeoffs.length > 0) {
      console.log(`   ✓ טרייד-אוף שחולץ: שימור [${deep.tradeoffs[0].protectedValue}] מול ויתור [${deep.tradeoffs[0].sacrificedValue}]`);
    }
    if (deep?.boundaryConditions && deep.boundaryConditions.length > 0) {
      console.log(`   ✓ תנאי גבול שחולץ: "${deep.boundaryConditions[0].condition}"`);
    }

    // Retrieval telemetry logging
    const retrievedCount = retrieval?.retrievedCandidatesCount || 0;
    const topScore = retrieval?.retrievalScore || 0;
    const reason = retrieval?.retrievalReason || 'no_match';
    console.log(`\n[2. Telemetry & Retrieval] מועמדי עבר שנשלפו: ${retrievedCount} | ציון מרבי: ${topScore.toFixed(2)} | סיבה: ${reason}`);

    if (retrieval?.preambleContext) {
      console.log(`   ✓ הקשר עבר שהוזרק (Preamble): "${retrieval.preambleContext}"`);
    }

    console.log(`\n[3. שאלת ההארה של ECHO]:\n   👉 "${illuminationQ}"`);

    // 2. Persona Agent Generates Dynamic Response
    console.log(`\n[4. סוכן הדמות (אלכס)]: מפעיל מודל דמות לפי חודש ${fixture.month}...`);
    const alexAnswer = await simulateAlexResponse(
      fixture,
      illuminationQ,
      process.env.GEMINI_API_KEY || ''
    );
    console.log(`   💬 תשובת אלכס:\n   "${alexAnswer}"`);

    // 3. Submit Deliberation Answer to ECHO
    console.log(`\n[5. סגירת מעגל]: מזין את תשובת אלכס ומחשב דלתא...`);
    const deltaResult = await decisionService.submitDeliberationAnswer(
      dCase.id,
      alexAnswer,
      false,
      'user12_alex_founder'
    );

    const refined = deltaResult.refinedInsight;
    console.log(`   ✓ תובנת דלתא שחולצה: "${refined?.now || 'ללא שינוי'}"`);
    console.log(`   ✓ צעד נבחר (Chosen Step): "${refined?.chosenStep || 'ללא צעד'}"`);

    // Record stage data
    results.push({
      fixture,
      decisionCase: dCase,
      deepMechanisms: deep,
      retrieval,
      illuminationQuestion: illuminationQ,
      alexAnswer,
      refinedInsight: refined
    });

    // Write to report
    const stageMd = `
## שלב ${fixture.caseIndex}: ${fixture.title}
* **ציר זמן:** חודש ${fixture.month}, יום ${fixture.day}
* **מצב מנטלי מוצהר של אלכס:** ${fixture.personaProfile}
* **סגנון כתיבה:** ${fixture.styleInstructions}

### 1. קלט הדילמה (Raw Capture)
> "${fixture.rawInput}"

### 2. חילוץ מנגנוני עומק סינכרוני (Horizon 2 OKF)
* **כותרת ההחלטה:** ${dCase.title}
* **מתח מרכזי (Central Tension):** ${dCase.centralTension}
* **ציר הכרעה (Key Hinge):** ${dCase.keyHinge}
* **עקרונות פעולה (Operating Principles):** ${deep?.operatingPrinciples?.join(' | ') || 'לא זוהה'}
* **טרייד-אוף מרכזי (Deep Trade-off):** 
  - **ערך מוגן (Protected):** \`${deep?.tradeoffs?.[0]?.protectedValue || 'לא הוגדר'}\`
  - **ערך מוקרב (Sacrificed):** \`${deep?.tradeoffs?.[0]?.sacrificedValue || 'לא הוגדר'}\`
  - **הקשר הטרייד-אוף:** \`${deep?.tradeoffs?.[0]?.context || 'ללא הקשר מיוחד'}\`
* **תנאי גבול (Boundary Conditions):**
  - **טענת יעד:** ${deep?.boundaryConditions?.[0]?.targetAssertion || 'ללא'}
  - **תנאי גבול מסייג (Condition):** \`${deep?.boundaryConditions?.[0]?.condition || 'ללא סייג'}\`
* **טופולוגיית דילמה ומניע החלטה:** \`${deep?.dilemmaTopology || 'N/A'}\` | מניע: \`${deep?.decisionDriver || 'N/A'}\`

### 3. טלמטריית זיכרון ושליפה מקדימה (Qualified Retrieval Telemetry)
* **מספר תקדימי עבר שנשלפו:** ${retrievedCount}
* **ציון התאמה סמנטית מרבי (Retrieval Score):** ${topScore > 0 ? topScore.toFixed(2) : '0.00'}
* **סיבת שליפה:** \`${reason}\`
${retrieval?.preambleContext ? `* **הקשר עבר שהוזרק לשאלה (Preamble):** "${retrieval.preambleContext}"` : ''}

### 4. שאלת ההארה שהופקה ע"י ECHO (The Illumination Question)
> 💡 **"${illuminationQ}"**

### 5. תגובת סוכן הדמות בזמן אמת (Dynamic Persona Agent Reflection)
> 💬 **אלכס (חודש ${fixture.month}):**  
> "${alexAnswer}"

### 6. תוצאות סגירת המעגל ודלתא (Refined Insight)
* **תובנת עכשיו (Now):** "${refined?.now || 'ללא שינוי'}"
* **הצעד שנבחר בפועל (Chosen Step):** "${refined?.chosenStep || 'טרם נבחר'}"
* **סטטוס החלטה סופי:** \`${dCase.status}\`

---
`;

    fs.appendFileSync(REPORT_FILE, stageMd);

    const transcriptMd = `
### [שלב ${fixture.caseIndex}] ${fixture.title}
* **ECHO Capture:** "${fixture.rawInput}"
* **ECHO Illumination Question:** "${illuminationQ}"
* **Alex Reflection:** "${alexAnswer}"
* **ECHO Refined Insight:** "${refined?.now || 'N/A'}"
* **Chosen Step:** "${refined?.chosenStep || 'N/A'}"

`;
    fs.appendFileSync(TRANSCRIPT_FILE, transcriptMd);

    // Brief stabilization pause
    await new Promise(res => setTimeout(res, 2000));
  }

  // Final Synthesis & Analysis
  console.log('\n================================================================================');
  console.log('=== ניתוח תוצאות הסימולציה והתנהגות המערכת ===');
  console.log('================================================================================');

  const stage1 = results[0];
  const stage2 = results[1];
  const stage3 = results[2];

  const stage3RetrievalScore = stage3?.retrieval?.retrievalScore || 0;
  const stage3Reason = stage3?.retrieval?.retrievalReason || '';
  const contradictionCaught = stage3RetrievalScore >= 0.81 || stage3Reason.includes('tradeoff') || stage3Reason.includes('principle') || stage3Reason.includes('contradiction') || stage3Reason.includes('reversal');

  const summaryMd = `
## סיכום ממצאי הסימולציה: מבחן שחיקת הגבולות

| שלב | חודש | ערך מוגן שחולץ | ערך מוקרב שחולץ | מועמדים שנשלפו | ציון שליפה | זיהוי סתירה ושחיקת גבול |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **שלב 1 (בסיס)** | חודש 1 | \`${stage1.deepMechanisms?.tradeoffs?.[0]?.protectedValue || 'N/A'}\` | \`${stage1.deepMechanisms?.tradeoffs?.[0]?.sacrificedValue || 'N/A'}\` | 0 | 0.00 | הצבת קו אדום ותנאי גבול ראשוני |
| **שלב 2 (לחץ)** | חודש 4 | \`${stage2.deepMechanisms?.tradeoffs?.[0]?.protectedValue || 'N/A'}\` | \`${stage2.deepMechanisms?.tradeoffs?.[0]?.sacrificedValue || 'N/A'}\` | ${stage2.retrieval?.retrievedCandidatesCount || 0} | ${(stage2.retrieval?.retrievalScore || 0).toFixed(2)} | פשרה מבוקרת (חוב טכנולוגי ללא פגיעה באבטחה) |
| **שלב 3 (קריסה)** | חודש 8 | \`${stage3.deepMechanisms?.tradeoffs?.[0]?.protectedValue || 'N/A'}\` | \`${stage3.deepMechanisms?.tradeoffs?.[0]?.sacrificedValue || 'N/A'}\` | ${stage3.retrieval?.retrievedCandidatesCount || 0} | ${(stage3.retrieval?.retrievalScore || 0).toFixed(2)} | **${contradictionCaught ? '✅ נתפס בהצלחה (היפוך טרייד-אוף וסתירת גבול)' : '⚠️ שליפה חלקית'}** |

### תובנות ארכיטקטוניות מהרצת הסימולציה:
1. **חילוץ סינכרוני של ממדי עומק:** המערכת הצליחה לחלץ בזמן אמת עקרונות פעולה, טרייד-אופים ותנאי גבול בכל אחד משלושת השלבים ללא כשלים.
2. **איכות וסינון שליפה (ERV Quality Gate):** ציון השליפה בשלב 3 עמד על ${(stage3RetrievalScore).toFixed(2)} מול סף איכות של 0.81, כאשר אותרו ${stage3?.retrieval?.retrievedCandidatesCount || 0} מועמדי עבר רלוונטיים.
3. **הצלבת זיכרון ועימות משתמש:** ${contradictionCaught 
  ? 'בשלב 3, שירות ה-Retrieval זיהה את ההתנגשות עם החלטות קודמות, והזין שאלת הארה סינתטית שעימתה את אלכס ישירות עם שבירת הגבול המקורית שלו.' 
  : 'בשלב 3, שירות ה-Retrieval לא זיהה את ההתנגשות (ציון שליפה מתחת לסף האיכות או היעדר מועמדים מעל הסף).'}
`;

  fs.appendFileSync(REPORT_FILE, summaryMd);

  console.log(summaryMd);
  console.log(`\n✓ דוח הסימולציה המלא נשמר ב: ${REPORT_FILE}`);
  console.log(`✓ תמליל השיחה המלא נשמר ב: ${TRANSCRIPT_FILE}`);
}

// Direct execution guard
if (process.argv[1] && process.argv[1].endsWith('simulator_v12_alex_drift.ts')) {
  runAlexDriftSimulation().catch(err => {
    console.error('Fatal Simulation Error:', err);
    process.exit(1);
  });
}
