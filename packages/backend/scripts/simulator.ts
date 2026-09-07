import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES Module dirname workaround on Windows
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
const RESULTS_FILE = path.join(SIMULATIONS_DIR, 'user1_general_40cases.md');
const DILEMMAS_FILE = path.join(process.cwd(), 'scripts', 'dilemmas.json');

const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY, 'gemini-3.6-flash');
const decisionService = new DecisionService(geminiProvider);

async function generateDilemmas() {
  console.log('Generating 40 dilemmas using Gemini...');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const prompt = `
Generate a JSON array of exactly 40 realistic decision dilemmas in Hebrew.
Distribution: 32 should be business-related (business strategy, career, startups, team management, investments), and 8 should be personal (relationships, moving, lifestyle changes).
Variety: High variance in length (some very short and abrupt, some long and detailed) and detail.

Return ONLY a valid JSON array of strings. Do not wrap in markdown tags like \`\`\`json.
Example:
[
  "אני מתלבט אם לסגור את הסטארטאפ שלי, נגמר לנו הכסף ויש לי הצעת עבודה, אבל אני מרגיש שאם נחזיק עוד חודש נצליח.",
  "אשתי רוצה שנעבור לצפון אבל העסק שלי במרכז וזה יפגע לי בהכנסות."
]
  `;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, responseMimeType: 'application/json' }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate dilemmas: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text returned from Gemini');

  const dilemmas = JSON.parse(text);
  fs.writeFileSync(DILEMMAS_FILE, JSON.stringify(dilemmas, null, 2));
  console.log(`Generated ${dilemmas.length} dilemmas and saved to ${DILEMMAS_FILE}`);
  return dilemmas;
}

async function answerQuestion(dilemma: string, question: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const prompt = `
הנה דילמה מקורית של בן אדם:
"${dilemma}"

המערכת שאלה אותו שאלת המשך מדויקת כדי לחדד את המחשבה:
"${question}"

תענה לשאלה הזאת מנקודת המבט של האדם שהעלה את הדילמה. התשובה צריכה להיות כנה, ריאליסטית, ישירה וכתובה בגוף ראשון. אורך התשובה: משפט אחד או שניים בלבד.
החזר אך ורק את טקסט התשובה.
  `;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5 }
    })
  });

  if (!response.ok) {
    return 'אין לי תשובה ברורה כרגע, אני צריך לחשוב על זה.'; // fallback
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || 'אני חושב שזו באמת השאלה האמיתית.';
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimulator() {
  console.log('Starting Simulator...');
  
  if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(RESULTS_FILE, '# תוצאות הרצת סימולטור\n\n');
  }

  let dilemmas: string[] = [];
  if (fs.existsSync(DILEMMAS_FILE)) {
    dilemmas = JSON.parse(fs.readFileSync(DILEMMAS_FILE, 'utf-8'));
  } else {
    dilemmas = await generateDilemmas();
  }

  console.log(`Loaded ${dilemmas.length} dilemmas to process.`);

  // Load progress to resume if stopped
  const doneCount = (fs.readFileSync(RESULTS_FILE, 'utf-8').match(/## דילמה מס'/g) || []).length;
  console.log(`Already processed ${doneCount} dilemmas. Resuming from index ${doneCount}...`);

  for (let i = doneCount; i < dilemmas.length; i++) {
    const dilemma = dilemmas[i];
    console.log(`\n[${i + 1}/${dilemmas.length}] Processing dilemma...`);

    try {
      console.log('  -> createCase()');
      const session = await decisionService.createCase({
        userId: 'sim_user_001',
        rawText: dilemma,
        frictionLevel: 'deep'
      });

      const shouldIntervene = session.bespokeQuestion?.shouldIntervene !== false;
      let answer = '';
      let finalResult;

      if (shouldIntervene) {
        const question = session.illuminationQuestion;
        console.log('  -> Intervention Question:', question);
        console.log('  -> Generating answer to intervention question...');
        answer = await answerQuestion(dilemma, question);
        console.log('  -> Answer:', answer);
        console.log('  -> submitDeliberationAnswer()');
        finalResult = await decisionService.submitDeliberationAnswer(session.decisionCase.id, answer);
      } else {
        console.log('  -> Echo chose Smart Silence (no intervention needed). Persona stops.');
        answer = '[שקט חכם - לא נדרשה התערבות]';
        finalResult = await decisionService.submitDeliberationAnswer(session.decisionCase.id, '', true);
      }

      const markdownEntry = [
        `## דילמה מס' ${i + 1}`,
        `**הדילמה המקורית:** ${dilemma}`,
        ``,
        `### 5 הממדים שחולצו`,
        `- **ההחלטה:** ${session.humanDimensions?.consideration}`,
        `- **מטרות ומחירים:** ${session.humanDimensions?.goalsPrices}`,
        `- **עובדות קשיחות:** ${session.humanDimensions?.facts}`,
        `- **הנחות:** ${session.humanDimensions?.assumptions}`,
        `- **מידע חסר:** ${session.humanDimensions?.missingInfo}`,
        ``,
        `### התערבות המערכת`,
        `- **שאלת ההארה:** ${question}`,
        `- **תשובת המשתמש (ממודל):** ${answer}`,
        ``,
        `### חיווי התחדדות (Refined Insight)`,
        `- **קודם חשב:** ${finalResult.refinedInsight.before}`,
        `- **כעת התחדד:** ${finalResult.refinedInsight.now}`,
        `- **הצעד הבא שנבחר:** ${finalResult.refinedInsight.chosenStep}`,
        ``,
        `---`,
        ``
      ].join('\n');

      fs.appendFileSync(RESULTS_FILE, markdownEntry);
      console.log(`  -> Completed and saved. (${new Date().toLocaleTimeString()})`);

    } catch (err: any) {
      console.error(`  -> ERROR processing dilemma ${i + 1}:`, err.message);
      fs.appendFileSync(RESULTS_FILE, `\n## דילמה מס' ${i + 1}\n**ERROR:** ${err.message}\n\n---\n`);
    }

    if (i < dilemmas.length - 1) {
      console.log('  -> Sleeping for 30 seconds...');
      await sleep(30 * 1000); // 30 seconds
    }
  }

  console.log('Simulator finished successfully!');
}

runSimulator().catch(console.error);
