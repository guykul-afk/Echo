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

const SIMULATIONS_DIR = path.resolve(__dirname, '../../../simulations');
if (!fs.existsSync(SIMULATIONS_DIR)) {
  fs.mkdirSync(SIMULATIONS_DIR, { recursive: true });
}
const RESULTS_FILE = path.join(SIMULATIONS_DIR, 'user6_school_principal_75cases.md');
const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, 'gemini-3.6-flash');
const decisionService = new DecisionService(geminiProvider);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const pastEventsSummary: string[] = [];

function getFrictionLevel(index: number): 'quick' | 'focused' | 'deep' {
  const mod = index % 5;
  if (mod === 0) return 'quick';      // 15 cases (20%)
  if (mod === 1 || mod === 2) return 'focused'; // 30 cases (40%)
  return 'deep';                      // 30 cases (40%)
}

async function generateDilemma(day: number, totalDays: number): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const historyContext = pastEventsSummary.length > 0 ? 
    `אירועים קודמים בבית הספר (הורים, מורים, פיקוח): ${pastEventsSummary.slice(-4).join(', ')}` : '';

  const prompt = `
את מגלמת תפקיד של מנהלת בית ספר מנוסה ואחראית בחינוך העל-יסודי.
כל הדילמות שלך (100%) הן מקצועיות ומערכתיות: שחיקת מורים וסכסוכי צוות, הורים תובעניים וערעורים על ציונים, הנחיות סותרות מהפיקוח ומשרד החינוך, אירועי משמעת וחרמות בין תלמידים, שיבוצי כיתות, חריגות תקציב, קיצוץ שעות רוחב.
את מתנסחת באופן ממלכתי, מקצועי, שקול, בעלת תחושת שליחות עמוקה לצד עומס ניהולי כבד.
אורך המונולוג: כ-45 שניות דיבור בקול רם (בין 95 ל-130 מילים, כשתי פסקאות ברורות ומנומקות).
אנו נמצאים ביום ה-${day} מתוך ${totalDays} (ציר זמן של מחצית שנת לימודים - 6 חודשים).
${historyContext}

הנחיות קריטיות:
1. אל תצייני את מספר היום במפורש.
2. החזירי אך ורק את טקסט המונולוג הניהולי שלך ללא כותרות, ללא הקדמות וללא מירכאות.
`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85 }
    })
  });
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  if (text.length > 0) {
    pastEventsSummary.push(text.split('.')[0] + '...');
  }
  return text;
}

async function generateAnswer(dilemma: string, question: string, frictionLevel: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const deepGuidance = frictionLevel === 'deep' 
    ? 'בנוסף להתייחסות לשאלה, התייחסי במפורש לתרחיש הכשל המערכתי (Pre-Mortem): אם ההחלטה הניהולית הזו תתפוצץ בעוד 6 חודשים מול ההורים, הפיקוח או הצוות – איפה נקודת הכשל הסבירה ביותר?'
    : '';

  const prompt = `
את מנהלת בית ספר. הנה הדילמה המקצועית שתיארת:
"""${dilemma}"""

המערכת שיקפה לך את המצב ושאלה:
"${question}"
${deepGuidance}

עני בגוף ראשון (נקבה) בצורה ניהולית, פרקטית ושקולה (פסקה או שתיים). אל תוסיפי הקדמות.
  `;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85 }
    })
  });
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function runSimulator() {
  console.log('Starting Persona 2 Simulator (School Principal - 75 cases)...');
  
  let startIndex = 0;
  if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(RESULTS_FILE, '# תוצאות הרצת סימולטור - דמות 2: מנהלת בית ספר (75 מקרים לאורך חצי שנה)\n\n');
  } else {
    const content = fs.readFileSync(RESULTS_FILE, 'utf-8');
    const matches = content.match(/## דילמה מס' (\d+)/g);
    if (matches) {
      startIndex = matches.length;
    }
  }
  console.log(`Already processed ${startIndex} dilemmas. Resuming from index ${startIndex}...`);
  
  const totalDays = 180;
  const totalCases = 75;
  
  for (let i = startIndex; i < totalCases; i++) {
    const day = Math.floor((i / totalCases) * totalDays) + 1;
    const frictionLevel = getFrictionLevel(i);
    const modeLabel = frictionLevel === 'quick' ? '⚡ מהיר (Quick Flow)' : (frictionLevel === 'focused' ? '🎯 ממוקד (Focused Flow)' : '🔍 עמוק (Deep Flow)');
    
    console.log(`\n[${i + 1}/${totalCases}] Day ${day}/180 [${frictionLevel.toUpperCase()}]...`);
    
    try {
      const dilemmaText = await generateDilemma(day, totalDays);
      if (!dilemmaText) throw new Error("Empty dilemma text");
      console.log('  -> Dilemma generated. Length:', dilemmaText.length);
      
      const caseResult = await decisionService.createCase({
        userId: 'persona_principal_02',
        rawText: dilemmaText,
        eraId: 'era-school-year-6months',
        frictionLevel
      });
      
      const session = caseResult.decisionCase;
      const bespokeQuestion = caseResult.illuminationQuestion;
      
      let answer = '';
      let finalResult = caseResult;
      
      if (frictionLevel !== 'quick' && caseResult.bespokeQuestion?.shouldIntervene !== false) {
        console.log('  -> Intervention Question:', bespokeQuestion);
        answer = await generateAnswer(dilemmaText, bespokeQuestion, frictionLevel);
        try {
          finalResult = await decisionService.submitDeliberationAnswer(session.id, answer);
        } catch (e) {
          console.log('  -> submitDeliberationAnswer fallback used');
        }
      } else {
        console.log('  -> Smart Silence (Quick Flow or Echo choice) - No intervention question posed.');
        try {
          finalResult = await decisionService.submitDeliberationAnswer(session.id, '', true);
        } catch (e) {}
      }

      const refinedBefore = finalResult.refinedInsight?.before || caseResult.refinedInsight?.before || 'שיקוף מורכבות ניהולית';
      const refinedNow = finalResult.refinedInsight?.now || caseResult.refinedInsight?.now || session.dimReliance || 'הבחנה בין צורך מערכתי למחיר אנושי';
      const refinedNext = finalResult.refinedInsight?.chosenStep || caseResult.refinedInsight?.chosenStep || 'שיחת תיאום ציפיות והכרעה';

      const formatQuote = (str: string) => str ? str.split('\n').map(l => '> ' + l).join('\n') : '> —';

      const markdownEntry = [
        `## דילמה מס' ${i + 1} (ציר זמן: יום ${day}/180, חודש ${Math.ceil(day / 30)}) • ${modeLabel}`,
        `**טקסט המקור (מנהלת בית ספר - 100% מקצועי, ~45 שניות):**`,
        formatQuote(dilemmaText),
        ``,
        `### מראת 5 הממדים של ECHO (Editable Mirror)`,
        `- **מה את שוקלת:** ${session.dimConsideration}`,
        `- **מתח מרכזי:** ${session.centralTension || 'אחריות פדגוגית ומערכתית מול אילוצי שטח ומשאבים'}`,
        `- **להשיג ולשמור:** ${session.dimGoalsPrices}`,
        `- **עובדות קשיחות:** ${session.dimFacts}`,
        `- **הנחות ציר:** ${session.dimAssumptions}`,
        `- **מידע חסר להכרעה:** ${session.dimMissingInfo}`,
        ``,
        `### פעולת המערכת (Adaptive Friction)`,
        `- **רמת חיכוך שנבחרה:** \`${frictionLevel}\` (${modeLabel})`,
        frictionLevel === 'quick' 
          ? `- **שתיקה חכמה (Smart Silence):** המערכת בחרה שלא להתערב. השיקולים והמתח הניהולי תועדו במראה.`
          : `- **שאלת הארה:** ${bespokeQuestion}\n- **מענה המנהלת:**\n${formatQuote(answer)}`,
        ``,
        `### חיווי התחדדות (Refined Insight)`,
        `- **קודם חשבה:** ${refinedBefore}`,
        `- **כעת התחדד:** ${refinedNow}`,
        `- **הצעד הנבחר:** ${refinedNext}`,
        ``,
        `---`,
        ``
      ].join('\n');

      fs.appendFileSync(RESULTS_FILE, markdownEntry);
      console.log(`  -> Completed and saved. (${new Date().toLocaleTimeString()})`);
      
    } catch (err: any) {
      console.error(`  -> ERROR processing dilemma ${i + 1}:`, err.message);
      fs.appendFileSync(RESULTS_FILE, `\n## דילמה מס' ${i + 1} (יום ${day})\n**ERROR:** ${err.message}\n\n---\n`);
    }

    if (i < totalCases - 1) {
      console.log('  -> Sleeping for 30 seconds...');
      await sleep(30 * 1000);
    }
  }

  console.log('Persona 2 Simulator finished successfully!');
}

runSimulator().catch(console.error);
