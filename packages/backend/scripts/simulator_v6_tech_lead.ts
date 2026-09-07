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
const RESULTS_FILE = path.join(SIMULATIONS_DIR, 'user7_tech_lead_architect_75cases.md');
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
  
  // 80% professional, 20% personal
  const isPersonal = Math.random() < 0.2;
  const topicType = isPersonal 
    ? 'אישי (שחיקה משעות מרובות מול מסכים, זוגיות שסובלת מ-On-Call ודדליינים, רצון לעשות רילוקיישן מול משפחה, תחושת החמצה לגבי גידול הילדים)' 
    : 'מקצועי (ארכיטקטורת מיקרו-סרביסים מול מונולית, פער בין שכתוב חוב טכנולוגי לדרישות פרודקט, קונפליקט מקצועי מול מפתח בכיר עקשן, בחירת תשתית ענן, ניהול אירוע Production Outage, ביצועים ו-Scalability)';

  const historyContext = pastEventsSummary.length > 0 ? 
    `אירועים מהשבועות האחרונים בקבוצת הפיתוח ובבית: ${pastEventsSummary.slice(-4).join(', ')}` : '';

  const prompt = `
אתה מגלם ראש צוות בכיר וארכיטקט מערכת בחברת הייטק בצמיחה.
נושא הדילמה הפעם: ${topicType}.
סגנון: הנדסי, מתודי, אנליטי, מתבסס על Trade-offs ברורים, לקסיקון טכנולוגי ישראלי אותנטי (Latencies, PRs, Production, Tech-Debt, Refactoring, Stakeholders, Scale).
כאשר הנושא אישי – הוא משתקף דרך אותה חשיבה מתודית שמנסה לייצר אופטימיזציה לחיים.
אורך המונולוג: כדקה דיבור בקול רם (בין 130 ל-170 מילים, 2 עד 3 פסקאות מובנות).
אנו נמצאים ביום ה-${day} מתוך ${totalDays} (חצי שנה של פיתוח).
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
    ? 'בנוסף להתייחסות לשאלה, בצע Pre-Mortem הנדסי/אישי מפורש: אם בעוד 6 חודשים המערכת קורסת תחת העומס או שהצוות מתפרק – מה נקודת השבר (Single Point of Failure) הברורה ביותר?'
    : '';

  const prompt = `
אתה ראש צוות וארכיטקט תוכנה. הנה הדילמה שתיארת:
"""${dilemma}"""

המערכת שיקפה לך את המצב ושאלה:
"${question}"
${deepGuidance}

ענה בגוף ראשון בצורה אנליטית אך כנה לגבי ה-Trade-off האמיתי (2 פסקאות). אל תוסיף הקדמות.
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
  console.log('Starting Persona 3 Simulator (Tech Lead & System Architect - 75 cases)...');
  
  let startIndex = 0;
  if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(RESULTS_FILE, '# תוצאות הרצת סימולטור - דמות 3: ראש צוות וארכיטקט מערכת (75 מקרים לאורך חצי שנה)\n\n');
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
        userId: 'persona_tech_lead_03',
        rawText: dilemmaText,
        eraId: 'era-tech-roadmap-6months',
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

      const refinedBefore = finalResult.refinedInsight?.before || caseResult.refinedInsight?.before || 'שיקוף ארכיטקטוני של ה-Trade-offs';
      const refinedNow = finalResult.refinedInsight?.now || caseResult.refinedInsight?.now || session.dimReliance || 'הכרעה בין יציבות טכנולוגית ללחץ מסירה';
      const refinedNext = finalResult.refinedInsight?.chosenStep || caseResult.refinedInsight?.chosenStep || 'POC הנדסי / שיחת תיאום סקופ';

      const formatQuote = (str: string) => str ? str.split('\n').map(l => '> ' + l).join('\n') : '> —';

      const markdownEntry = [
        `## דילמה מס' ${i + 1} (ציר זמן: יום ${day}/180, חודש ${Math.ceil(day / 30)}) • ${modeLabel}`,
        `**טקסט המקור (ראש צוות וארכיטקט - 80% מקצועי, 20% אישי, ~דקה דיבור):**`,
        formatQuote(dilemmaText),
        ``,
        `### מראת 5 הממדים של ECHO (Editable Mirror)`,
        `- **מה אתה שוקל:** ${session.dimConsideration}`,
        `- **מתח מרכזי:** ${session.centralTension || 'קצב שחרור פיצ\'רים מול חוב טכנולוגי ויציבות מערכתית'}`,
        `- **להשיג ולשמור:** ${session.dimGoalsPrices}`,
        `- **עובדות קשיחות:** ${session.dimFacts}`,
        `- **הנחות ציר:** ${session.dimAssumptions}`,
        `- **מידע חסר להכרעה:** ${session.dimMissingInfo}`,
        ``,
        `### פעולת המערכת (Adaptive Friction)`,
        `- **רמת חיכוך שנבחרה:** \`${frictionLevel}\` (${modeLabel})`,
        frictionLevel === 'quick' 
          ? `- **שתיקה חכמה (Smart Silence):** המערכת בחרה שלא להתערב. השיקולים והמתח ההנדסי תועדו במראה.`
          : `- **שאלת הארה:** ${bespokeQuestion}\n- **מענה הארכיטקט:**\n${formatQuote(answer)}`,
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

  console.log('Persona 3 Simulator finished successfully!');
}

runSimulator().catch(console.error);
