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
const RESULTS_FILE = path.join(SIMULATIONS_DIR, 'user4_cyber_founder_60cases.md');
const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, 'gemini-3.6-flash');
const decisionService = new DecisionService(geminiProvider);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const pastEventsSummary: string[] = [];

async function generateDilemmaForDay(dayIndex: number, totalDays: number): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  // 90% professional, 10% personal
  const isPersonal = Math.random() < 0.1;
  const topicType = isPersonal 
    ? 'אישי (זלזול בזמן שינה, זוגיות שסובלת מהעבודה סביב השעון, התנשאות על חברים שלא מבינים את המשחק, קניית גאדג\'ט יקר להוכחת הצלחה)' 
    : 'מקצועי (טכנולוגיית סייבר הגנתית/התקפית, מרוץ מול מתחרים שאתה מזלזל בהם, משא ומתן אגרסיבי מול קרנות הון סיכון ומשקיעים, סגירת POC מול CISO בארה"ב, דרישות טכניות של צוות הפיתוח, הגנה על IP, גיוס מפתחי קרנל מובילים)';

  const historyContext = pastEventsSummary.length > 0 ? 
    `אירועים מהשבועות האחרונים בסטארטאפ: ${pastEventsSummary.slice(-5).join(', ')}` : '';

  const prompt = `
אתה מגלם דמות: מייסד צעיר, מבריק, חד ומלא ביטחון עצמי מופרז (Overconfident) של סטארטאפ סייבר צעיר (Early Stage / Seed).
אתה אנליטי, חותך, מדבר בישירות נטולת סנטימנטים, בטוח שאתה והאלגוריתם שלך פי 10 יותר חכמים מכל המתחרים ומרוב המשקיעים, אבל מתחת לפני השטח ניצבת דילמה אמיתית עם סיכון גבוה.
אנו נמצאים ביום ה-${dayIndex} מתוך ${totalDays} של תקופת סימולציה בת 3 חודשים (רבעון סוער).
${historyContext}

פרטי ההקלטה/דילמה הנוכחית:
- סוג: ${topicType}.
- סגנון דיבור: חד, ממוקד דאטה וביצועים, יהיר במידה, אנליטי, טרמינולוגיית סייבר/הייטק עדכנית (Zero-Day, CISO, Vector, POC, ARR, Valuation, Seed).
- אורך: 1 עד 3 פסקאות מהודקות, חדות וישירות.

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

async function generateAnswer(dilemma: string, question: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const prompt = `
אתה מייסד סטארטאפ סייבר צעיר - חד, אנליטי, ישיר ובעל ביטחון עצמי גבוה מאוד.
הנה הדילמה ששיתפת:
"""${dilemma}"""

המערכת שאלה אותך שאלה רפלקטיבית של 'מראה' (Adaptive Intervention):
"${question}"

ענה לשאלה בגוף ראשון. התשובה שלך צריכה לשקף את הסגנון שלך: מצד אחד אתה הודף ניסיונות לערער לך את הביטחון, אבל כשאתה בוחן את השאלה מנקודת מבט אנליטית וקרה, אתה מזהה את הנקודה העיוורת או הסיכון ומגדיר את הצעד האופרטיבי שלך (1-2 פסקאות קצרות וחדות). אל תוסיף הקדמות.
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
  console.log('Starting Persona 4 Simulator (Cyber Startup Founder)...');
  
  let startIndex = 0;
  if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(RESULTS_FILE, '# תוצאות הרצת סימולטור - משתמש דמה: מייסד סטארטאפ סייבר (60 מקרים על פני 3 חודשים)\n\n');
  } else {
    const content = fs.readFileSync(RESULTS_FILE, 'utf-8');
    const matches = content.match(/## דילמה מס' (\d+)/g);
    if (matches) {
      startIndex = matches.length;
    }
  }
  console.log(`Already processed ${startIndex} dilemmas. Resuming from index ${startIndex}...`);
  
  const totalDays = 90; // 3 months
  const totalCases = 60;
  
  for (let i = startIndex; i < totalCases; i++) {
    const day = Math.floor((i / totalCases) * totalDays) + 1;
    console.log(`\n[${i + 1}/${totalCases}] Processing dilemma for simulated day ${day}...`);
    
    try {
      const dilemmaText = await generateDilemmaForDay(day, totalDays);
      if (!dilemmaText) throw new Error("Empty dilemma generated");
      console.log('  -> Dilemma generated. Length:', dilemmaText.length);
      
      const caseResult = await decisionService.createCase({
        userId: 'persona_cyber_founder_01',
        rawText: dilemmaText,
        eraId: 'era-cyber-3months'
      });
      
      const session = caseResult.decisionCase;
      const question = caseResult.illuminationQuestion;
      
      console.log('  -> Intervention Question:', question);
      console.log('  -> Generating answer to intervention question...');
      
      const answer = await generateAnswer(dilemmaText, question);
      
      const refinedBefore = caseResult.refinedInsight?.before || 'לא חולץ';
      const refinedNow = caseResult.refinedInsight?.now || 'לא חולץ';
      const refinedNext = caseResult.refinedInsight?.chosenStep || 'לא חולץ';
      
      let finalResult = caseResult;
      try {
        finalResult = await decisionService.submitDeliberationAnswer(session.id, answer);
      } catch (e) {
        console.log('  -> Note: submitDeliberationAnswer fallback used.');
      }

      const finalBefore = finalResult.refinedInsight?.before || refinedBefore;
      const finalNow = finalResult.refinedInsight?.now || refinedNow;
      const finalNext = finalResult.refinedInsight?.chosenStep || refinedNext;

      const formatQuote = (str: string) => str.split('\n').map(l => '> ' + l).join('\n');

      const markdownEntry = [
        `## דילמה מס' ${i + 1} (ציר זמן: יום ${day}/90, חודש ${Math.ceil(day / 30)})`,
        `**טקסט המקור (מייסד הסייבר):**`,
        formatQuote(dilemmaText),
        ``,
        `### 5 הממדים שחולצו (Editable Mirror)`,
        `- **ההחלטה:** ${session.dimConsideration}`,
        `- **מטרות ומחירים:** ${session.dimGoalsPrices}`,
        `- **עובדות קשיחות:** ${session.dimFacts}`,
        `- **הנחות:** ${session.dimAssumptions}`,
        `- **מידע חסר להכרעה:** ${session.dimMissingInfo}`,
        ``,
        `### התערבות המערכת (Adaptive Friction)`,
        `- **שאלת ההארה:** ${question}`,
        `- **תשובת המשתמש (אנליטית עם הכרה בנקודה העיוורת):**`,
        formatQuote(answer),
        ``,
        `### חיווי התחדדות (Refined Insight)`,
        `- **קודם חשב:** ${finalBefore}`,
        `- **כעת התחדד:** ${finalNow}`,
        `- **הצעד הבא שנבחר:** ${finalNext}`,
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
      console.log('  -> Sleeping for 15 seconds...');
      await sleep(15 * 1000); 
    }
  }

  console.log('Persona 4 Simulator (Cyber Founder) finished successfully!');
}

runSimulator().catch(console.error);
