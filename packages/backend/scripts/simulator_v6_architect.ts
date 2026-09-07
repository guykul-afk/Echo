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
const RESULTS_FILE = path.join(SIMULATIONS_DIR, 'user8_architect_75cases.md');
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
  
  // 70% professional, 30% personal
  const isPersonal = Math.random() < 0.3;
  const topicType = isPersonal 
    ? 'אישי (שיפוץ הבית הפרטי מול חוסר זמן, עייפות ושחיקה, יחסים משפחתיים שנפגעים מהתמסרות טוטאלית לפרויקטים, שאלת האותנטיות מול יצירה מסחרית)' 
    : 'מקצועי (פשרה בין שפה אדריכלית לחסכנות קבלן, דרישות עיריות ורישוי תקוע, לקוחות עשירים וקפריזיים שמשנים תוכניות, בחירת חומרים - בטון גלוי מול טיח, מתח בין תכנון מוקפד לעמידה בתקציב קשיח)';

  const historyContext = pastEventsSummary.length > 0 ? 
    `אירועים מהפרויקטים האחרונים והסטודיו: ${pastEventsSummary.slice(-4).join(', ')}` : '';

  // Variable length: between 1 and 3 paragraphs (60 to 160 words)
  const paragraphCounts = [1, 2, 3];
  const targetParagraphs = paragraphCounts[Math.floor(Math.random() * paragraphCounts.length)];

  const prompt = `
אתה מגלם תפקיד של אדריכל ומתכנן עצמאי בעל סטודיו בוטיק.
נושא הדילמה: ${topicType}.
סגנון: ויזואלי, מרחבי, רגיש לחומר ולאור, רהוט, אך גם עסוק בבירוקרטיה, פרקטיקה, קונפליקטים מול קבלני שלד וועדות תכנון.
אורך המונולוג: אורך משתנה – בדיוק ${targetParagraphs} פסקאות (בין 70 ל-150 מילים).
אנו נמצאים ביום ה-${day} מתוך ${totalDays} (חצי שנה של תכנון וביצוע).
${historyContext}

הנחיות:
1. אל תציין את מספר היום במפורש.
2. החזר אך ורק את טקסט המונולוג שלך ללא כותרות, ללא הקדמות וללא מירכאות.
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
    ? 'בנוסף להתייחסות לשאלה, בצע Pre-Mortem מרחבי/תכנוני: אם המבנה הזה ייבנה ובעוד 6 חודשים תעמוד מולו ותתחרט – מה תהיה הסיבה העיקרית לחרטה (הפשרה האסתטית, התקציב שהתפוצץ, או הפונקציונליות שכשלה)?'
    : '';

  const prompt = `
אתה אדריכל. הנה הדילמה שתיארת:
"""${dilemma}"""

המערכת שיקפה לך את המצב ושאלה:
"${question}"
${deepGuidance}

ענה בגוף ראשון בצורה כנה, מנומקת ומרחבית (פסקה עד שתיים). אל תוסיף הקדמות.
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
  console.log('Starting Persona 4 Simulator (Architect - 75 cases)...');
  
  let startIndex = 0;
  if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(RESULTS_FILE, '# תוצאות הרצת סימולטור - דמות 4: אדריכל (75 מקרים לאורך חצי שנה)\n\n');
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
        userId: 'persona_architect_04',
        rawText: dilemmaText,
        eraId: 'era-architecture-6months',
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

      const refinedBefore = finalResult.refinedInsight?.before || caseResult.refinedInsight?.before || 'שיקוף מתח תכנוני';
      const refinedNow = finalResult.refinedInsight?.now || caseResult.refinedInsight?.now || session.dimReliance || 'הכרעה בין חזון אסתטי למגבלות חומר ועלות';
      const refinedNext = finalResult.refinedInsight?.chosenStep || caseResult.refinedInsight?.chosenStep || 'פגישת תיאום תכנון וביצוע';

      const formatQuote = (str: string) => str ? str.split('\n').map(l => '> ' + l).join('\n') : '> —';

      const markdownEntry = [
        `## דילמה מס' ${i + 1} (ציר זמן: יום ${day}/180, חודש ${Math.ceil(day / 30)}) • ${modeLabel}`,
        `**טקסט המקור (אדריכל - 70% מקצועי, 30% אישי, אורך משתנה):**`,
        formatQuote(dilemmaText),
        ``,
        `### מראת 5 הממדים של ECHO (Editable Mirror)`,
        `- **מה אתה שוקל:** ${session.dimConsideration}`,
        `- **מתח מרכזי:** ${session.centralTension || 'שאיפה לאיכות אדריכלית מול פשרות ביצוע ותקציב'}`,
        `- **להשיג ולשמור:** ${session.dimGoalsPrices}`,
        `- **עובדות קשיחות:** ${session.dimFacts}`,
        `- **הנחות ציר:** ${session.dimAssumptions}`,
        `- **מידע חסר להכרעה:** ${session.dimMissingInfo}`,
        ``,
        `### פעולת המערכת (Adaptive Friction)`,
        `- **רמת חיכוך שנבחרה:** \`${frictionLevel}\` (${modeLabel})`,
        frictionLevel === 'quick' 
          ? `- **שתיקה חכמה (Smart Silence):** המערכת בחרה שלא להתערב. השיקולים והמתח התכנוני תועדו במראה.`
          : `- **שאלת הארה:** ${bespokeQuestion}\n- **מענה האדריכל:**\n${formatQuote(answer)}`,
        ``,
        `### חיווי התחדדות (Refined Insight)`,
        `- **קודם חשב:** ${refinedBefore}`,
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

  console.log('Persona 4 Simulator finished successfully!');
}

runSimulator().catch(console.error);
