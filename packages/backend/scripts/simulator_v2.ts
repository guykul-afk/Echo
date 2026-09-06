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
const RESULTS_FILE = path.join(SIMULATIONS_DIR, 'user2_software_manager_60cases.md');
const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, 'gemini-3.6-flash');
const decisionService = new DecisionService(geminiProvider);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Track context over time to pass to the model so it remembers past events
const pastEventsSummary: string[] = [];

async function generateDilemmaForDay(dayIndex: number, totalDays: number): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const isPersonal = Math.random() < 0.3;
  const topicType = isPersonal ? 'אישי (זוגיות, ילדים, עייפות, משכנתא, בית, שחיקה)' : 'מקצועי (לקוחות, קוד, דדליינים, ה-5 עובדים שלך - מתחים ביניהם או ציפיות שכר, כסף בקופה)';
  
  const historyContext = pastEventsSummary.length > 0 ? 
    `היסטוריה קצרה מחודשים קודמים (אפשר להתייחס אליה במרומז): ${pastEventsSummary.slice(-5).join(', ')}` : '';

  const prompt = `
אתה משחק תפקיד של מנהל חברת תוכנה קטנה עם 5 עובדים. אתה אדם שמרחיב בדיבור, חושב בקול רם, נוטה לפטפט ולקפוץ קצת מנושא לנושא (לא לגמרי קוהרנטי), אבל בסוף חוזר לדילמה שמטרידה אותך. אתה מדבר בממוצע 3 פסקאות. הסגנון שלך הוא של הייטקיסט ישראלי עייף שעובד קשה.
אנו נמצאים ביום ה-${dayIndex} מתוך ${totalDays} של תקופה בת 4 חודשים.
${historyContext}
כתוב מונולוג (דילמה) אחת שמעסיקה אותך כעת, מסוג: ${topicType}.
אל תציין את מספר היום במפורש, אלא רק את הלך הרוח שלך. אל תעשה הקדמות, פשוט התחל לדבר בגוף ראשון.
חובה להחזיר טקסט של כ-3 פסקאות ארוכות.
`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9 }
    })
  });
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  
  if (text.length > 0) {
    // Add a short summary to history for continuity
    pastEventsSummary.push(text.split('.')[0] + '...');
  }
  
  return text;
}

async function generateAnswer(dilemma: string, question: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const prompt = `
אתה משחק תפקיד של מנהל חברת תוכנה קטנה עם 5 עובדים. אתה אדם שמרחיב בדיבור, חושב בקול רם ולא הכי קוהרנטי.
הנה מה שסיפרת קודם למערכת:
"""${dilemma}"""

המערכת שאלה אותך את השאלה הבאה כדי לעזור לך להתפקס:
"${question}"

ענה לשאלה בגוף ראשון, בצורה מתפלספת ומאריכה (כ-2 פסקאות), אבל שבסוף כן מספקת מענה כנה לליבה של השאלה. אין צורך בהקדמה, פשוט התחל לדבר.
  `;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9 }
    })
  });
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function runSimulator() {
  console.log('Starting Persona 2 Simulator...');
  
  let startIndex = 0;
  if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(RESULTS_FILE, '# תוצאות הרצת סימולטור - משתמש דמה: מנהל חברת תוכנה (60 מקרים על פני 4 חודשים)\n\n');
  } else {
    const content = fs.readFileSync(RESULTS_FILE, 'utf-8');
    const matches = content.match(/## דילמה מס' (\d+)/g);
    if (matches) {
      startIndex = matches.length;
    }
  }
  console.log(`Already processed ${startIndex} dilemmas. Resuming from index ${startIndex}...`);
  
  const totalDays = 120; // 4 months
  
  for (let i = startIndex; i < 60; i++) {
    const day = Math.floor((i / 60) * totalDays) + 1;
    console.log(`\n[${i + 1}/60] Processing dilemma for simulated day ${day}...`);
    
    try {
      const dilemmaText = await generateDilemmaForDay(day, totalDays);
      if (!dilemmaText) throw new Error("Empty dilemma generated");
      console.log('  -> Dilemma generated. Length:', dilemmaText.length);
      
      const caseResult = await decisionService.createCase({
        userId: 'persona_manager_01',
        rawText: dilemmaText,
        eraId: 'era-4months'
      });
      
      const session = caseResult.decisionCase;
      const question = caseResult.illuminationQuestion;
      
      console.log('  -> Intervention Question:', question);
      console.log('  -> Generating answer to intervention question...');
      
      const answer = await generateAnswer(dilemmaText, question);
      
      // Fallbacks in case undefined
      const refinedBefore = caseResult.refinedInsight?.before || 'לא חולץ';
      const refinedNow = caseResult.refinedInsight?.now || 'לא חולץ';
      const refinedNext = caseResult.refinedInsight?.chosenStep || 'לא חולץ';
      
      // Attempt to submit answer if possible (some mock logic might fail without it)
      let finalResult = caseResult;
      try {
        finalResult = await decisionService.submitDeliberationAnswer(session.id, answer);
      } catch (e) {
        console.log('  -> Note: submitDeliberationAnswer failed, proceeding with original result.');
      }

      const finalBefore = finalResult.refinedInsight?.before || refinedBefore;
      const finalNow = finalResult.refinedInsight?.now || refinedNow;
      const finalNext = finalResult.refinedInsight?.chosenStep || refinedNext;

      const formatQuote = (str: string) => str.split('\n').map(l => '> ' + l).join('\n');

      const markdownEntry = [
        `## דילמה מס' ${i + 1} (זמן משוער: יום ${day}/120)`,
        `**הטקסט המקורי של המשתמש (ג'ינרוט בזמן אמת, ארוך ואסוציאטיבי):**`,
        formatQuote(dilemmaText),
        ``,
        `### 5 הממדים שחולצו`,
        `- **ההחלטה:** ${session.dimConsideration}`,
        `- **מטרות ומחירים:** ${session.dimGoalsPrices}`,
        `- **עובדות קשיחות:** ${session.dimFacts}`,
        `- **הנחות:** ${session.dimAssumptions}`,
        `- **מידע חסר:** ${session.dimMissingInfo}`,
        ``,
        `### התערבות המערכת`,
        `- **שאלת ההארה:** ${question}`,
        `- **תשובת המשתמש (ממודל - חשיבה מתפלספת):**`,
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

    if (i < 59) {
      console.log('  -> Sleeping for 15 seconds...');
      await sleep(15 * 1000); // Wait 15 seconds to avoid rate limits
    }
  }

  console.log('Simulator finished successfully!');
}

runSimulator().catch(console.error);
