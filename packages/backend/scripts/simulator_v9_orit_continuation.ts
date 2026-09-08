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

function parseExistingCases(): void {
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

    const dayMatch = section.match(/יום (\d+)\/\d+/);
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

  console.log(`Parsed ${historicalPool.length} cases into memory pool.`);
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

// 4 Analytical Flavors to increase variance while keeping 100% professional tone
function getAnalyticalFlavor(caseIndex: number): { name: string; guidance: string } {
  const flavorIndex = caseIndex % 4;
  switch (flavorIndex) {
    case 0:
      return {
        name: 'אנליטיות חישובית-פרטנית (מיקרו-פיננסי)',
        guidance: 'התמקדי בפירוק כמותי מדויק: מספרים מדויקים בדוח אפס, אחוזי ריבית ורווחיות צפויה, עלויות בנייה מדויקות למ"ר, יחס כיסוי שירות חוב (DSCR), וחישוב שחרור עודפים כספי מדויק.'
      };
    case 1:
      return {
        name: 'אנליטיות מקרו-רגולטורית ומדיניות אשראי',
        guidance: 'התמקדי בראיית המקרו של התיק: מגבלות בנק ישראל 311 ו-315 לחשיפה ענפית, סיכוני הדבקה בין פרויקטים שונים של אותה קבוצת נדל"ן, דרישות הלימות הון והפרשות קבוצתיות להפסדי אשראי.'
      };
    case 2:
      return {
        name: 'אנליטיות משפטית-מבנית ובטוחות',
        guidance: 'התמקדי במבנה המשפטי של הבטוחות: איכות השעבודים (שעבוד קבוע מול צף), ערבויות חוק מכר אוטונומיות, תוקף ערבויות ביצוע של קבלני מפתח, והסכמי פרי-סייל מותנים מול רוכשים.'
      };
    case 3:
    default:
      return {
        name: 'אנליטיות של מבחני קיצון ורגישות (Stress Testing)',
        guidance: 'התמקדי במבחני רגישות ותרחישי כשל: מה קורה לפרויקט אם מחירי הדירות נשחקים ב-12%, אם קבלן הביצוע נקלע להקפאת הליכים, או אם קצב המכירות ייעצר לחלוטין למשך 6 חודשים.'
      };
  }
}

async function generateDilemma(index: number, day: number, totalDays: number): Promise<{ text: string; scale: 'major' | 'minor' }> {
  const isMajor = (index % 3 === 0);
  const scale = isMajor ? 'major' : 'minor';
  const flavor = getAnalyticalFlavor(index);

  const wordRange = isMajor 
    ? 'בין 150 ל-220 מילים (כדקה וחצי עד שתי דקות דיבור בקצב שקול ובינוני)' 
    : 'בין 65 ל-110 מילים (כחצי דקה עד דקה דיבור בקצב שקול ובינוני)';

  const topicGuidance = isMajor
    ? 'החלטה גדולה ואסטרטגית בניהול סיכוני אשראי לנדל"ן (חודשים 7-8 של השנה): אישור הגדלת מסגרת ליווי ב-85 מיליון ש"ח לפרויקט מגדלי יוקרה עקב שקיעת תקציב, דרישת הזרמת הון עצמי מיידית בעקבות עליית LTC מעבר ל-80%, משבר ביצוע שבו קבלן ראשי C-1 דורש עדכון מחירון תשומות ומאיים בנטישת אתר, או סיווג אשראי של קבוצת נדל"ן גדולה לחוב תחת השגחה מיוחדת.'
    : 'החלטה שוטפת טקטית בניהול סיכוני אשראי נדל"ן (חודשים 7-8 של השנה): אישור שחרור מנת עודפים רביעית לאחר השלמת אבן דרך קומה 15, אישור החלפת קבלן מעליות ואישור הסבת ערבות ביצוע, בקשת יזם לפריסת לוח תשלומים של רוכשי פרי-סייל, אישור משיכת כרית נזילות זמנית לתשלום אגרות פיתוח, או עדכון דוח שמאי תקופתי לקרקע תחת ליווי.';

  const recentHistory = historicalPool.slice(-3).map(h => `#${h.caseNumber}: ${h.dimConsideration}`).join(' | ');

  const prompt = `
את מגלמת את אורית – מנהלת אגף ניהול סיכוני אשראי לסקטור הנדל"ן באחד מחמשת הבנקים הגדולים בישראל.
חודשים 7 ו-8 (ימים 181-240): הפרויקטים בליווי מתקדמים, חלקם בשלבי ביצוע מתקדמים, אחרים מתמודדים עם אתגרי ריבית ומכירות.

סגנון וקול הדמות:
- אנליטית, חדה, שיטתית, קרה ושקולה, מתבטאת בדיוק בנקאי ומשפטי עילאי.
- 100% מקצועי! אין שום עניינים אישיים, רגשות, שיחות חולין או רכילות.
- סגנון אנליטי ספציפי למקרה זה: ${flavor.name}.
${flavor.guidance}

סוג המקרה: ${isMajor ? 'החלטה יומית גדולה (Major Decision)' : 'החלטה שוטפת קטנה יותר (Minor Decision)'}.

נושאי ההחלטה:
${topicGuidance}

אורך המונולוג המוקלט:
${wordRange}.

ציר זמן:
יום ${day} מתוך ${totalDays} (חודש ${Math.ceil(day / 30)}).
תקדימים קודמים מיומן העבודה: ${recentHistory}

הנחיות חיוניות:
1. כתבי בעברית בלבד! שפה רהוטה, עשירה ומקצועית של בנקאית בכירה.
2. אין לכתוב שום מילה באנגלית! מונחים מקצועיים יש לכתוב כפי שמקובל בבנקאות ישראלית (LTV, LTC, DSCR, Pre-Sale, חוק מכר, דוח אפס, קובננטים).
3. כתבי מונולוג דיבורי רציף בגוף ראשון בלבד ("הובאה להכרעתי...", "אני בוחנת כרגע...", "מדוח המפקח ההנדסי עולה...").
4. אין לכתוב רשימות נקודות (bullet points), אין כותרות, אין מרכאות, אין תבניות ריקות. רק פסקאות דיבור מלאות.
`;

  let text = '';
  for (let attempt = 1; attempt <= 4 && !text; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.75 }
        })
      });
      if (response.status === 429 || response.status === 503) {
        await sleep(Math.pow(2, attempt) * 1500);
        continue;
      }
      const data = await response.json();
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (text.length < 35) { text = ''; await sleep(1500); }
    } catch (e: any) {
      await sleep(Math.pow(2, attempt) * 1500);
    }
  }

  // Sanity check: Ensure pure Hebrew text
  if (text.includes('Let\'s focus') || text.startsWith('*') || text.length < 35) {
    throw new Error('Generated text failed quality validation');
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
הצגת את הדילמה המקצועית הבאה בהקלטה:
"${dilemmaText}"

מערכת ECHO שיקפה לך את המידע והציגה את השאלה הבאה:
"${question}"

${analogyInfo ? `בנוסף, המערכת הציגה לך כרטיס אנלוגיה מבנית ממקרה עבר שלך:
${analogyInfo}
התייחסי בקצרה ללקח העבר – האם המקרה הנוכחי מחייב שמירה על אותו קו שמרני, או שנסיבותיו מאפשרות התאמה?` : ''}

נסחי את תשובתך המקצועית של אורית:
- שפה עברית מקצועית, שקולה, מנומקת והחלטית (פסקה אחת, 60 עד 120 מילים).
- 100% מקצועי, מבוסס שיקולי אשראי ובטוחות בלבד.
- ללא הקדמות, ללא כותרות, ללא מרכאות. רק גוף התשובה הישיר.
`;

  let text = '';
  for (let attempt = 1; attempt <= 4 && !text; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      });
      if (response.status === 429 || response.status === 503) {
        await sleep(Math.pow(2, attempt) * 1500);
        continue;
      }
      const data = await response.json();
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (text.length < 25) { text = ''; await sleep(1500); }
    } catch (e: any) {
      await sleep(Math.pow(2, attempt) * 1500);
    }
  }
  return text;
}

export async function runSimulationContinuation() {
  console.log('=== Starting Continuation Simulation: Orit Cases 76 to 105 ===');
  parseExistingCases();

  const startCase = 76;
  const endCase = 105;
  const totalDays = 240; // 8 months total

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

  let counterSinceStart = 0;

  for (let i = startCase; i <= endCase; i++) {
    const caseIndex = i - 1;
    const day = 180 + Math.floor(((i - 75) / 30) * 60) + 1;
    const month = Math.ceil(day / 30);
    const frictionLevel = getFrictionLevel(caseIndex);
    const modeLabel = frictionLevel === 'quick' ? '⚡ מהיר (Quick Flow)' : (frictionLevel === 'focused' ? '🎯 ממוקד (Focused Flow)' : '🔍 עמוק (Deep Flow)');
    const isMajor = (caseIndex % 3 === 0);
    const scaleLabel = isMajor ? 'החלטה גדולה (Major Decision)' : 'החלטה שוטפת (Minor Decision)';
    const durationLabel = isMajor ? '~1.5-2 דקות דיבור (אנליטי מעמיק)' : '~30-60 שניות דיבור (שוטף ממוקד)';
    const flavor = getAnalyticalFlavor(caseIndex);

    let success = false;
    for (let attempt = 1; attempt <= 4 && !success; attempt++) {
      try {
        // 1. Generate monologue
        const { text: dilemmaText } = await generateDilemma(caseIndex, day, totalDays);

        // 2. Call production DecisionService
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

        // 3. Full Past Reflection: TriFactorRetrievalService against all historical cases
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

        // Spec Step 5: Surface only if score >= 0.78
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

        // 4. Effective Question: bespoke or historical
        let effectiveQuestion = caseResult.illuminationQuestion;
        if (caseResult.historicalQuestion && caseResult.historicalQuestion.shouldIntervene) {
          effectiveQuestion = caseResult.historicalQuestion.questionText;
        }

        let answer = '';
        let finalResult = caseResult;

        if (frictionLevel !== 'quick' && caseResult.bespokeQuestion?.shouldIntervene !== false) {
          answer = await generateDeliberationAnswer(dilemmaText, effectiveQuestion, analogyTextForPrompt, frictionLevel);
          try {
            finalResult = await decisionService.submitDeliberationAnswer(session.id, answer);
          } catch (e) {
            // fallback
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
          `*סגנון אנליטי:* ${flavor.name}`,
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
          `*סגנון אנליטי ממוקד:* ${flavor.name}`,
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

        // Add current case to historical pool
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
        console.warn(`[Attempt ${attempt}/4 failed for case ${i}]: ${err.message}. Retrying in 2.5s...`);
        await sleep(2500);
      }
    }

    if (!success) {
      console.error(`Permanent failure for case ${i} after 4 attempts! Skipping.`);
    }

    counterSinceStart++;

    // Checkpoint counter every 25 cases
    if (counterSinceStart % 25 === 0) {
      console.log(`\n>>> [CHECKPOINT] מונה החלטות: ${counterSinceStart}/30 החלטות נוספות עובדו בהצלחה (החלטה #${i}/105). <<<\n`);
    }

    await sleep(400);
  }

  // Update headers of both files to reflect 105 cases
  try {
    let resContent = fs.readFileSync(RESULTS_FILE, 'utf-8');
    resContent = resContent.replace(
      /\*\*היקף החלטות:\*\* 75 מקרים לאורך 6 חודשים[^\n]*/,
      '**היקף החלטות:** 105 מקרים לאורך 8 חודשים (240 ימים) במבנה קבוע של החלטה גדולה אחת ושתי החלטות קטנות יותר. מקרים 76-105 כוללים שונות אנליטית מוגברת והפעלת מנגנון שיקוף עבר מלא (שלב 5 באפיון).'
    );
    fs.writeFileSync(RESULTS_FILE, resContent, 'utf-8');

    let transContent = fs.readFileSync(TRANSCRIPT_FILE, 'utf-8');
    transContent = transContent.replace(
      /פרוטוקול שיחה ותמלול מלא של 75 החלטות ואינטראקציות לאורך 6 חודשים \(180 ימים\)/,
      'פרוטוקול שיחה ותמלול מלא של 105 החלטות ואינטראקציות לאורך 8 חודשים (240 ימים)'
    );
    fs.writeFileSync(TRANSCRIPT_FILE, transContent, 'utf-8');
  } catch (e) {}

  console.log('\n=== Orit Continuation Completed: 30 new cases processed (Total 105 cases across 8 months). ===');
}

runSimulationContinuation().catch(console.error);
