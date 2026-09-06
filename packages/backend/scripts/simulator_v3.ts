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
const RESULTS_FILE = path.join(SIMULATIONS_DIR, 'user3_yoga_studio_40cases.md');
const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, 'gemini-3.6-flash');
const decisionService = new DecisionService(geminiProvider);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Keep track of chronological context across the 6 months
const pastEventsSummary: string[] = [];

async function generateDilemmaForDay(dayIndex: number, totalDays: number): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  // 60% personal, 40% professional
  const isPersonal = Math.random() < 0.6;
  const topicType = isPersonal 
    ? 'אישי (עומס פיזי על הגוף, פציעה קלה, שחיקה נפשית, זמן עם בן/בת הזוג, משפחה, צורך בחופש, תחושת ריקנות או הצפה רגשית)' 
    : 'מקצועי (3 המדריכות בסטודיו - ביטולים, יחסי צוות או דרישות שכר; לקוחות ומתרגלים - נטישה או תלונות; שכר דירה של הסטודיו, פתיחת סדנת סופ"ש, שיווק, מחיר מנוי)';
  
  // Vary length: 1 to 4 paragraphs
  const paragraphCounts = [1, 2, 3, 4];
  const targetParagraphs = paragraphCounts[Math.floor(Math.random() * paragraphCounts.length)];
  
  // Vary coherence
  const coherenceTypes = [
    'קוהרנטית, שקולה, מחוברת לנשימה ולערכים שלה, אבל עדיין בדילמה',
    'מוצפת רגשית, מעט מפוזרת, קופצת מתחושת בטן לדאגה פרקטית וחזרה',
    'עמוסה, מתוסכלת, חושבת בקול רם, מעט אסוציאטיבית ולא לגמרי ממוקדת'
  ];
  const targetCoherence = coherenceTypes[Math.floor(Math.random() * coherenceTypes.length)];

  const historyContext = pastEventsSummary.length > 0 ? 
    `אירועים קודמים שהתרחשו בחודשים האחרונים (אפשר להתייחס אליהם ברקע): ${pastEventsSummary.slice(-5).join(', ')}` : '';

  const prompt = `
את מגלמת משתמשת דמה: בעלת ומנהלת סטודיו בוטיק קטן ליוגה עם 3 מדריכות.
אנו נמצאים ביום ה-${dayIndex} מתוך ${totalDays} של תקופה בת 6 חודשים (חצי שנה של ליווי).
${historyContext}

פרטי ההקלטה/דילמה הנוכחית:
- נושא: ${topicType}.
- אורך מבוקש: בדיוק כ-${targetParagraphs} פסקאות.
- רמת קוהרנטיות וסגנון: ${targetCoherence}.
- שפה: עברית טבעית, חיה, מונולוג אותנטי מנקודת מבטה של מורה ומנהלת סטודיו ליוגה.

הנחיות קריטיות:
1. אל תצייני את מספר היום במפורש.
2. החזירי אך ורק את טקסט המונולוג עצמו ללא כותרות, ללא הקדמות וללא מרכאות מסביב.
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
את מנהלת סטודיו יוגה קטן עם 3 מדריכות. 
הנה מה ששיתפת קודם לגבי הדילמה שלך:
"""${dilemma}"""

המערכת שאלה אותך שאלה רפלקטיבית כדי לעזור לך להתבונן:
"${question}"

עני לשאלה בגוף ראשון (נקבה), מתוך החוויה והתחושה האמיתית שלך (1-2 פסקאות). תהיי כנה עם עצמך לגבי המחירים, הפחדים או מה שמתבהר לך. אל תוסיפי הקדמות.
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
  console.log('Starting Persona 3 Simulator (Yoga Studio Manager)...');
  
  let startIndex = 0;
  if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(RESULTS_FILE, '# תוצאות הרצת סימולטור - משתמשת דמה: מנהלת סטודיו יוגה (40 מקרים על פני 6 חודשים)\n\n');
  } else {
    const content = fs.readFileSync(RESULTS_FILE, 'utf-8');
    const matches = content.match(/## דילמה מס' (\d+)/g);
    if (matches) {
      startIndex = matches.length;
    }
  }
  console.log(`Already processed ${startIndex} dilemmas. Resuming from index ${startIndex}...`);
  
  const totalDays = 180; // 6 months
  const totalCases = 40;
  
  for (let i = startIndex; i < totalCases; i++) {
    const day = Math.floor((i / totalCases) * totalDays) + 1;
    console.log(`\n[${i + 1}/${totalCases}] Processing dilemma for simulated day ${day}...`);
    
    try {
      const dilemmaText = await generateDilemmaForDay(day, totalDays);
      if (!dilemmaText) throw new Error("Empty dilemma generated");
      console.log('  -> Dilemma generated. Length:', dilemmaText.length);
      
      const caseResult = await decisionService.createCase({
        userId: 'persona_yoga_manager_01',
        rawText: dilemmaText,
        eraId: 'era-yoga-6months'
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
        `## דילמה מס' ${i + 1} (ציר זמן: חודש ${Math.ceil(day / 30)}, יום ${day}/180)`,
        `**טקסט המקור (מנהלת הסטודיו):**`,
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
        `- **תשובת המשתמשת:**`,
        formatQuote(answer),
        ``,
        `### חיווי התחדדות (Refined Insight)`,
        `- **קודם חשבה:** ${finalBefore}`,
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
      fs.appendFileSync(RESULTS_FILE, `\n## דילמה מס' ${i + 1} (יום ${day})\n**ERROR:** ${err.message}\n\n---\\n`);
    }

    if (i < totalCases - 1) {
      console.log('  -> Sleeping for 15 seconds...');
      await sleep(15 * 1000); 
    }
  }

  console.log('Persona 3 Simulator finished successfully!');
}

runSimulator().catch(console.error);
