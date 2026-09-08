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
import { DecisionSignature, OperatingContext } from '@echo/shared';

const SIMULATIONS_DIR = path.resolve(__dirname, '../../../simulations');
const RESULTS_FILE = path.join(SIMULATIONS_DIR, 'user9_orit_realestate_risk_lead_75cases.md');
const TRANSCRIPT_FILE = path.join(SIMULATIONS_DIR, 'user9_orit_transcript_full.md');

const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, 'gemini-3.6-flash');
const decisionService = new DecisionService(geminiProvider);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export interface HistoricalCaseRecord {
  caseNumber: number;
  day: number;
  month: number;
  scale: 'major' | 'minor';
  rawText: string;
  dimConsideration: string;
  dimFacts: string;
  dimAssumptions: string;
  chosenStep: string;
  signature: DecisionSignature;
  era: OperatingContext;
}

const historicalPool: HistoricalCaseRecord[] = [];

function parseExisting75Cases(): void {
  if (!fs.existsSync(RESULTS_FILE)) {
    console.warn('Results file not found!');
    return;
  }
  const content = fs.readFileSync(RESULTS_FILE, 'utf-8');
  const sections = content.split(/## דילמה מס' /g).slice(1);

  for (const section of sections) {
    const numMatch = section.match(/^(\d+)/);
    if (!numMatch) continue;
    const caseNumber = parseInt(numMatch[1], 10);
    
    const dayMatch = section.match(/יום (\d+)\/180/);
    const day = dayMatch ? parseInt(dayMatch[1], 10) : caseNumber * 2;
    const month = Math.ceil(day / 30);
    const scale = section.includes('החלטה גדולה') ? 'major' : 'minor';

    const rawTextMatch = section.match(/\*\*טקסט ההקלטה של אורית[^\*]*\*\*:\s*\n>\s*([^\n]+(?:\n>[^\n]+)*)/);
    const rawText = rawTextMatch ? rawTextMatch[1].replace(/\n>\s*/g, ' ').trim() : '';

    const considerationMatch = section.match(/- \*\*מה נשקל \(Consideration\):\*\*\s*([^\n]+)/);
    const consideration = considerationMatch ? considerationMatch[1].trim() : '';

    const factsMatch = section.match(/- \*\*עובדות קשיחות \(Hard Facts\):\*\*\s*([^\n]+)/);
    const facts = factsMatch ? factsMatch[1].trim() : '';

    const assumptionsMatch = section.match(/- \*\*הנחות ציר \(Core Assumptions\):\*\*\s*([^\n]+)/);
    const assumptions = assumptionsMatch ? assumptionsMatch[1].trim() : '';

    const stepMatch = section.match(/- \*\*הצעד הנבחר \(Next Action\):\*\*\s*([^\n]+)/);
    const step = stepMatch ? stepMatch[1].trim() : 'המשך מעקב ופיקוח שוטף';

    const commitmentGradient = scale === 'major' ? 0.75 : 0.45;
    const informationCostRatio = scale === 'major' ? 0.65 : 0.40;

    const signature: DecisionSignature = {
      id: `sig-hist-${caseNumber}`,
      caseId: `case-orit-${caseNumber}`,
      userId: 'persona_orit_bank_risk_lead',
      commitmentGradient,
      informationCostRatio,
      reversibilityDecayDays: scale === 'major' ? 60 : 20,
      principalAgentTension: 'sole_actor',
      decisionTempo: 'tactical_weeks'
    };

    const era: OperatingContext = {
      id: 'era-orit-6months',
      userId: 'persona_orit_bank_risk_lead',
      name: 'חצי שנה ראשונה: הידוק כריות ביטחון תחת סביבת ריבית עולה',
      description: 'ניהול סיכוני אשראי לנדל"ן תחת ריבית בנק ישראל גבוהה והאטה במכירות',
      primaryScarcity: 'attention_and_energy',
      riskTolerance: 'conservative',
      startDate: 1,
      isActive: true
    };

    historicalPool.push({
      caseNumber,
      day,
      month,
      scale,
      rawText,
      dimConsideration: consideration,
      dimFacts: facts,
      dimAssumptions: assumptions,
      chosenStep: step,
      signature,
      era
    });
  }

  console.log(`Successfully parsed ${historicalPool.length} historical cases into memory pool.`);
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

function getFrictionLevel(index: number): 'quick' | 'focused' | 'deep' {
  const mod = index % 5;
  if (mod === 0) return 'quick';      // 20%
  if (mod === 1 || mod === 2) return 'focused'; // 40%
  return 'deep';                      // 40%
}

async function generateDilemma(index: number, day: number, totalDays: number): Promise<{ text: string; scale: 'major' | 'minor' }> {
  const isMajor = (index % 3 === 0);
  const scale = isMajor ? 'major' : 'minor';

  const wordRange = isMajor 
    ? 'בין 150 ל-220 מילים (כדקה וחצי עד שתי דקות דיבור בקצב שקול ובינוני)' 
    : 'בין 65 ל-110 מילים (כחצי דקה עד דקה דיבור בקצב שקול ובינוני)';

  const topicGuidance = isMajor
    ? 'החלטה גדולה ואסטרטגית בניהול סיכוני אשראי לנדל"ן (חודשים 7-8, ציר מתקדם): בחינת מיזוג או החלפת יזם בפרויקט הדגל "מגדלי נווה צדק", דרישת פירעון מוקדם או העמדת ביטחונות נזילים של 50 מיליון ש"ח עקב חריגת LTC ל-88%, חשיפה של 600 מיליון לקבוצת אלפא נדל"ן המבקשת פריסת חוב, דוח שמאות תקופתי חריג שהוריד שווי בטוחות ב-18% במתחם מסחרי, או סיווג אשראי קבוצתי לחוב בהשגחה מיוחדת מול המפקח על הבנקים.'
    : 'החלטה קטנה או טקטית שוטפת (חודשים 7-8): שחרור מנת עודפים רביעית לאחר טופס 4 חלקי, בחינת שחרור ערבות ביצוע של קבלן גמרים שהוחלף, בקשה להחרגת 4 דירות יוקרה ממכסת ה-Pre-Sale המינימלית, הלוואת בלון קצרת מועד לגישור על עיכוב בטאבו, אישור חלוקת דיבידנד ביזם פרויקט מחיר למשתכן, או אישור תנאי שחרור פוליסות חוק מכר בגין רוכשים ששילמו 95%.';

  const recentHistory = historicalPool.slice(-3).map(h => `#${h.caseNumber}: ${h.dimConsideration}`).join(' | ');

  const prompt = `
את מגלמת את אורית – מנהלת אגף ניהול סיכוני אשראי לסקטור הנדל"ן בבנק מוביל.
חודשים 7 ו-8 של השנה (ימים 181-240): הפרויקטים מתקדמים, חלקם במשבר ביצוע וחלקם לקראת מסירות, סביבת המקרו ממשיכה לאתגר את ה-LTV וה-DSCR.

פרופיל אישיותי וסגנון:
- אנליטית, שקולה, שיטתית, חדה, מתבטאת בדיוק בנקאי ומשפטי עילאי.
- 100% מקצועי! אין שום עירוב אישי. הכל עוסק אך ורק בסיכוני אשראי, ביטחונות, דוחות אפס, קובננטים, קבלני ביצוע ורגולציית בנק ישראל.
- קוהרנטיות מלאה לטרמינולוגיה: LTV, LTC, DSCR, דוח אפס, חשבון ליווי סגור, Pre-Sale, עודפים, קובננטים, הוראות 311/315.
- סוג המקרה: ${isMajor ? 'החלטה יומית גדולה (Major Decision)' : 'החלטה שוטפת קטנה יותר (Minor Decision)'}.

נושאי ההחלטה:
${topicGuidance}

אורך המונולוג המוקלט:
${wordRange}.

ציר זמן:
יום ${day} מתוך ${totalDays} (חודש ${Math.ceil(day / 30)}).
תקדימים קודמים: ${recentHistory}

הנחיות קריטיות:
1. כתבי אך ורק את המונולוג בגוף ראשון ("אני בוחנת כרגע...", "הובא בפניי תיק...", "המפקח ההנדסי הגיש דוח...").
2. אל תצייני את מספר היום במפורש.
3. אל תוסיפי שום כותרות, מרכאות או הקדמות. רק המלל הדיבורי האותנטי והאנליטי של אורית.
`;

  let text = '';
  for (let attempt = 1; attempt <= 4 && !text; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
        })
      });
      const data = await response.json();
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } catch (e: any) {
      await sleep(Math.pow(2, attempt) * 1500);
    }
  }
  return { text, scale };
}

async function generateDeliberationAnswer(
  dilemmaText: string,
  question: string,
  analogyInfo: string | null,
  frictionLevel: 'focused' | 'deep'
): Promise<string> {
  const prompt = `
את אורית, מנהלת ניהול סיכוני אשראי לנדל"ן בבנק.
הצגת את הדילמה המקצועית הבאה:
"${dilemmaText}"

מערכת ECHO שיקפה לך את המידע והציגה את השאלה הבאה:
"${question}"

${analogyInfo ? `בנוסף, המערכת הציפה כרטיס אנלוגיה מבנית מהעבר:
${analogyInfo}
התייחסי ללקח מהעבר בתשובתך – האם הנסיבות הפעם זהות, או שיש שוני שמצדיק גישה אחרת?` : ''}

נסחי את תשובתך המקצועית, האנליטית והקונקרטית של אורית:
- סגנון שקול, החלטי ומנומק בנקאית (עד 80-130 מילים).
- התמקדי בהגדרה מדויקת של הקריטריון, מנגנון הגידור או תנאי הסף שיוצגו לוועדת האשראי.
- ללא הקדמות, ללא מרכאות. רק גוף התשובה הישיר.
`;

  let answer = '';
  for (let attempt = 1; attempt <= 4 && !answer; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 400 }
        })
      });
      const data = await response.json();
      answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } catch (e) {
      await sleep(Math.pow(2, attempt) * 1500);
    }
  }
  return answer;
}

export async function runContinuation() {
  console.log('=== Starting Continuation: Orit Real Estate Risk Lead (Cases 76 to 105) ===');
  parseExisting75Cases();

  const lastCaseInFile = historicalPool.length > 0 ? historicalPool[historicalPool.length - 1].caseNumber : 75;
  const startCase = Math.max(76, lastCaseInFile + 1);
  const endCase = 105;
  const totalDays = 240; // 8 months

  console.log(`Resuming from case ${startCase} up to ${endCase} (Already in file: ${lastCaseInFile})...`);

  // Era for months 7-8
  const currentEra: OperatingContext = {
    id: 'era-orit-months-7-8',
    userId: 'persona_orit_bank_risk_lead',
    name: 'חודשים 7-8: שלבי גמר, מסירות וניהול חשיפות מורכבות',
    description: 'התמודדות עם קבלני ביצוע בשלבי גמר, תביעות דיירים ומיחזור הלוואות גישור',
    primaryScarcity: 'attention_and_energy',
    riskTolerance: 'conservative',
    startDate: 181,
    isActive: true
  };

  let counterSinceStart = lastCaseInFile - 75;

  for (let i = startCase; i <= endCase; i++) {
    const caseIndex = i - 1;
    const day = 180 + Math.floor(((i - 75) / 30) * 60) + 1;
    const month = Math.ceil(day / 30);
    const frictionLevel = getFrictionLevel(caseIndex);
    const modeLabel = frictionLevel === 'quick' ? '⚡ מהיר (Quick Flow)' : (frictionLevel === 'focused' ? '🎯 ממוקד (Focused Flow)' : '🔍 עמוק (Deep Flow)');
    const isMajor = (caseIndex % 3 === 0);
    const scaleLabel = isMajor ? 'החלטה גדולה (Major Decision)' : 'החלטה שוטפת (Minor Decision)';
    const durationLabel = isMajor ? '~1.5-2 דקות דיבור (אנליטי מעמיק)' : '~30-60 שניות דיבור (שוטף ממוקד)';

    let success = false;
    for (let attempt = 1; attempt <= 4 && !success; attempt++) {
      try {
        // 1. Generate authentic dilemma text
        const { text: dilemmaText } = await generateDilemma(caseIndex, day, totalDays);
        if (!dilemmaText || dilemmaText.length < 25) throw new Error("Empty dilemma text");

        // 2. Call production DecisionService to create case & extract epistemic schema
        const caseResult = await decisionService.createCase({
          userId: 'persona_orit_bank_risk_lead',
          rawText: dilemmaText,
          eraId: currentEra.id,
          frictionLevel
        });

    const session = caseResult.decisionCase;
    const currentSignature = caseResult.signature || {
      id: `sig-${session.id}`,
      caseId: session.id,
      userId: 'persona_orit_bank_risk_lead',
      commitmentGradient: isMajor ? 0.75 : 0.45,
      informationCostRatio: isMajor ? 0.65 : 0.40,
      reversibilityDecayDays: isMajor ? 60 : 20,
      principalAgentTension: 'sole_actor',
      decisionTempo: 'tactical_weeks'
    };

    // 3. FULL PRODUCTION PAST REFLECTION: Run TriFactorRetrievalService against ALL historical cases!
    let bestAnalogy: {
      pastCase: HistoricalCaseRecord;
      score: number;
      reason: string;
      strength: 'weak' | 'partial' | 'strong';
    } | null = null;

    for (const pastCase of historicalPool) {
      const semanticSim = calculateCosineSimilarity(dilemmaText, pastCase.rawText);
      const rel = TriFactorRetrievalService.calculateRelevance(
        currentSignature,
        pastCase.signature,
        currentEra,
        pastCase.era,
        semanticSim
      );

      if (!bestAnalogy || rel.score > bestAnalogy.score) {
        bestAnalogy = {
          pastCase,
          score: rel.score,
          reason: rel.reason,
          strength: rel.strength
        };
      }
    }

    // Exact Workflow Spec Step 5: Surface only if score >= 0.78
    const analogySurfaced = bestAnalogy && bestAnalogy.score >= 0.78;
    let analogyTextForPrompt: string | null = null;
    let analogyMarkdownCard = '';

    if (analogySurfaced && bestAnalogy) {
      analogyTextForPrompt = `התאמה מבנית של ${Math.round(bestAnalogy.score * 100)}% למקרה מס' ${bestAnalogy.pastCase.caseNumber} (יום ${bestAnalogy.pastCase.day}/180):
- סיבת הדמיון: ${bestAnalogy.reason}
- הדילמה אז: ${bestAnalogy.pastCase.dimConsideration}
- הצעד שנבחר אז: ${bestAnalogy.pastCase.chosenStep}`;

      analogyMarkdownCard = `### 🏛️ כרטיס אנלוגיה מבנית מהעבר (Structural Analogy Card - שלב 5 באפיון)
- **התאמה מבנית משוקללת:** \`${Math.round(bestAnalogy.score * 100)}%\` למקרה מס' ${bestAnalogy.pastCase.caseNumber} (יום ${bestAnalogy.pastCase.day}/240, חודש ${bestAnalogy.pastCase.month})
- **עוצמת האנלוגיה:** \`${bestAnalogy.strength}\` (${bestAnalogy.reason})
- **הדילמה במקרה הקודם:** ${bestAnalogy.pastCase.dimConsideration}
- **הצעד שנבחר אז:** ${bestAnalogy.pastCase.chosenStep}`;
    } else {
      analogyMarkdownCard = `### 🏛️ שיקוף העבר (שלב 5 באפיון)
*(לא נמצא מקרה עבר בעל דמיון מבני מובהק $\\ge 0.78$. לפי אפיון המערכת, כרטיס האנלוגיה מוסתר לחלוטין כדי למנוע עומס קוגניטיבי).*`;
    }

    // 4. Determine Question: Bespoke Question or Historical Question if triggered
    let effectiveQuestion = caseResult.illuminationQuestion;
    if (caseResult.historicalQuestion && caseResult.historicalQuestion.shouldIntervene) {
      effectiveQuestion = `${caseResult.historicalQuestion.questionText}`;
    }

    let answer = '';
    let finalResult = caseResult;

    if (frictionLevel !== 'quick' && caseResult.bespokeQuestion?.shouldIntervene !== false) {
      answer = await generateDeliberationAnswer(dilemmaText, effectiveQuestion, analogyTextForPrompt, frictionLevel);
      try {
        finalResult = await decisionService.submitDeliberationAnswer(session.id, answer);
      } catch (e) {
        console.log(`[Case ${i}] submitDeliberationAnswer fallback`);
      }
    } else {
      try {
        finalResult = await decisionService.submitDeliberationAnswer(session.id, '', true);
      } catch (e) {}
    }

    const refinedBefore = finalResult.refinedInsight?.before || caseResult.refinedInsight?.before || session.dimConsideration;
    const refinedNow = finalResult.refinedInsight?.now || caseResult.refinedInsight?.now || session.dimReliance || 'דיוק תנאי הסף הבנקאיים לאור הערכת הסיכון והתקדימים';
    const refinedNext = finalResult.refinedInsight?.chosenStep || caseResult.refinedInsight?.chosenStep || 'דרישת הבהרה שמאית ובדיקת כריות ביטחון בוועדת האשראי';

    const formatQuote = (str: string) => str ? str.split('\n').map(l => '> ' + l).join('\n') : '> —';

    // 5. Append to Results File
    const markdownEntry = [
      `## דילמה מס' ${i} (ציר זמן: יום ${day}/${totalDays}, חודש ${month}) • ${scaleLabel} • ${modeLabel}`,
      `**טקסט ההקלטה של אורית (מנהלת סיכוני אשראי נדל"ן - 100% מקצועי, ${durationLabel}):**`,
      formatQuote(dilemmaText),
      ``,
      `### מראת 5 הממדים של ECHO (Editable Mirror)`,
      `- **מה נשקל (Consideration):** ${session.dimConsideration}`,
      `- **המתח המרכזי (Central Tension):** ${session.centralTension || 'שמירה על כריות ביטחון ומגבלות בנק ישראל מול התקדמות הפרויקט והיזם'}`,
      `- **להשיג ולשמור (Goals & Prices):** ${session.dimGoalsPrices}`,
      `- **עובדות קשיחות (Hard Facts):** ${session.dimFacts}`,
      `- **הנחות ציר (Core Assumptions):** ${session.dimAssumptions}`,
      `- **מידע חסר להכרעה (Missing Information):** ${session.dimMissingInfo}`,
      ``,
      analogyMarkdownCard,
      ``,
      `### פעולת המערכת (Adaptive Friction)`,
      `- **רמת חיכוך שנבחרה:** \`${frictionLevel}\` (${modeLabel})`,
      frictionLevel === 'quick'
        ? `- **שתיקה חכמה (Smart Silence):** המערכת תיעדה את רכיבי הסיכון במראה ללא עצירה, כדי לאפשר קבלת החלטה שוטפת מהירה ללא סרבול.`
        : `- **שאלת הארה של ECHO:** ${effectiveQuestion}\n- **מענה שקול של אורית:**\n${formatQuote(answer)}`,
      ``,
      `### חיווי התחדדות (Refined Insight)`,
      `- **קודם חשבה (Before):** ${refinedBefore}`,
      `- **כעת התחדד (Now):** ${refinedNow}`,
      `- **הצעד הנבחר (Next Action):** ${refinedNext}`,
      ``,
      `---`,
      ``
    ].join('\n');

    fs.appendFileSync(RESULTS_FILE, markdownEntry);

    // 6. Append to Transcript File
    const transcriptEntry = [
      `## החלטה מס' ${i}: ${scaleLabel} (ציר זמן: יום ${day}/${totalDays}, חודש ${month}) • ${modeLabel}`,
      ``,
      `🎙️ **הקלטת המשתמשת (אורית - מנהלת סיכוני אשראי נדל"ן):**`,
      formatQuote(dilemmaText),
      ``,
      `🪞 **שיקוף המערכת (מראת 5 הממדים של ECHO):**`,
      `- **מה נשקל (Consideration):** ${session.dimConsideration}`,
      `- **המתח המרכזי (Central Tension):** ${session.centralTension || 'שמירה על כריות ביטחון ומגבלות בנק ישראל מול התקדמות הפרויקט והיזם'}`,
      `- **להשיג ולשמור (Goals & Prices):** ${session.dimGoalsPrices}`,
      `- **עובדות קשיחות (Hard Facts):** ${session.dimFacts}`,
      `- **הנחות ציר (Core Assumptions):** ${session.dimAssumptions}`,
      `- **מידע חסר להכרעה (Missing Information):** ${session.dimMissingInfo}`,
      ``,
      analogyMarkdownCard,
      ``,
      `🤖 **תגובת / שאלת המערכת (ECHO Adaptive Intervention):**`,
      frictionLevel === 'quick'
        ? `> המערכת תיעדה את רכיבי הסיכון במראה ללא עצירה, כדי לאפשר קבלת החלטה שוטפת מהירה ללא סרבול.`
        : `> ${effectiveQuestion}`,
      ``,
      `💬 **מענה המשתמשת (אורית):**`,
      frictionLevel === 'quick'
        ? `*(לא נדרש מענה - המקרה סווג למסלול שתיקה חכמה / ללא התערבות מעכבת)*`
        : formatQuote(answer),
      ``,
      `💡 **התובנה שהתחדדה (Refined Insight):**`,
      `- **קודם חשבה (Before):** ${refinedBefore}`,
      `- **כעת התחדד (Now):** ${refinedNow}`,
      `- **הצעד הנבחר לביצוע (Next Action):** ${refinedNext}`,
      ``,
      `---`,
      ``
    ].join('\n');

    fs.appendFileSync(TRANSCRIPT_FILE, transcriptEntry);

    // Add current case to historical pool so future cases can match against it too!
    historicalPool.push({
      caseNumber: i,
      day,
      month,
      scale: isMajor ? 'major' : 'minor',
      rawText: dilemmaText,
      dimConsideration: session.dimConsideration || '',
      dimFacts: session.dimFacts || '',
      dimAssumptions: session.dimAssumptions || '',
      chosenStep: refinedNext,
      signature: currentSignature,
      era: currentEra
    });

        success = true;
      } catch (err: any) {
        console.warn(`[Attempt ${attempt}/4 failed for case ${i}]: ${err.message}. Retrying in 2s...`);
        await sleep(2000);
      }
    }

    if (!success) {
      console.error(`Permanent failure for case ${i} after 4 attempts! Skipping.`);
    }

    counterSinceStart++;

    // User preference: "אין צורך לעדכן תוך כדי על הדילמות עצמן, רק מונה כל 25 החלטות."
    if (counterSinceStart % 25 === 0) {
      console.log(`\n>>> [CHECKPOINT] מונה החלטות: ${counterSinceStart}/30 החלטות נוספות עובדו בהצלחה (החלטה #${i}/105). <<<\n`);
    }

    // Small delay to protect API limits while maintaining high performance
    await sleep(400);
  }

  console.log('\n=== Orit Continuation Completed: 30 new cases processed (Total 105 cases across 8 months). ===');
}

runContinuation().catch(console.error);
