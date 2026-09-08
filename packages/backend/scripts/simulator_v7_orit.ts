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
const RESULTS_FILE = path.join(SIMULATIONS_DIR, 'user9_orit_realestate_risk_lead_75cases.md');
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

async function generateDilemma(index: number, day: number, totalDays: number): Promise<{ text: string; scale: 'major' | 'minor' }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const isMajor = (index % 3 === 0);
  const scale = isMajor ? 'major' : 'minor';

  const wordRange = isMajor 
    ? 'בין 150 ל-220 מילים (כדקה וחצי עד שתי דקות דיבור בקצב שקול ובינוני)' 
    : 'בין 65 ל-110 מילים (כחצי דקה עד דקה דיבור בקצב שקול ובינוני)';

  const topicGuidance = isMajor
    ? 'החלטה גדולה ואסטרטגית בניהול סיכוני אשראי לנדל"ן: אישור ליווי פיננסי סגור לפרויקט מאות מיליונים, חריגה ממגבלת בנק ישראל 315/311, דרישת הזרמת הון עצמי עקב עליית ריבית ותשומות, משבר קבלן ביצוע ראשי C-1 שנקלע לחדלות פירעון, מתן ערבויות חוק מכר לפרויקט עם Pre-Sale חלש, או סיווג אשראי של קבוצת נדל"ן גדולה לחוב פגום.'
    : 'החלטה קטנה או טקטית שוטפת בניהול סיכוני אשראי נדל"ן: שחרור עודפים מחשבון סגור לאחר אבן דרך הנדסית, החלפת קבלן משנה בדיווח מפקח הנדסי, הקלה זמנית בקובננט LTV, עדכון דוח אפס שמאי ורווחיות צפויה, הלוואת גישור לקרקע עד היתר בנייה, או אישור חשיפה לפוליסת חוק מכר משותפת.';

  const historyContext = pastEventsSummary.length > 0 ? 
    `תקדימים והחלטות קודמות מיומן העבודה של אורית: ${pastEventsSummary.slice(-3).join(' | ')}` : '';

  const prompt = `
את מגלמת את אורית – מנהלת אגף ניהול סיכוני אשראי לסקטור הנדל"ן באחד מחמשת הבנקים הגדולים בישראל.
פרופיל אישיותי וסגנון:
- אדם אנליטי באופן מובהק, שקולה, שיטתית, חדה, מתבטאת בדיוק בנקאי ומשפטי עילאי.
- 100% מקצועי! אין שום עירוב של עניינים אישיים, רכילות או שיחות חולין. הכל עוסק אך ורק בסיכוני אשראי, פרויקטים, יזמים, רגולציה ומספרים.
- קוהרנטיות סגנונית גבוהה מאוד בין ההקלטות (עקביות בשימוש במונחים מקצועיים: LTV, LTC, חוק מכר, דוח אפס, חשבון ליווי סגור, Pre-Sale, עודפים, קובננטים, כושר החזר, שיעור פוליסות, הפרשות להפסדי אשראי).
- סוג המקרה הנוכחי: ${isMajor ? 'החלטה יומית גדולה (Major Decision)' : 'החלטה שוטפת קטנה יותר (Minor Decision)'}.

נושאי ההחלטה:
${topicGuidance}

אורך המונולוג המוקלט:
${wordRange}.

ציר זמן:
יום ${day} מתוך ${totalDays} (חצי שנה רצופה של מעקב סיכונים שוטף).
${historyContext}

הנחיות קריטיות:
1. כתבי אך ורק את המונולוג בגוף ראשון ("אני בוחנת כרגע...", "הובא בפניי תיק...", "המפקח ההנדסי הגיש דוח...").
2. אל תצייני את מספר היום במפורש.
3. אל תוסיפי שום כותרות, מרכאות או הקדמות. רק המלל הדיבורי האותנטי והאנליטי של אורית.
`;

  let text = '';
  for (let attempt = 1; attempt <= 4 && !text; attempt++) {
    try {
      const response = await fetch(url, {
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
      text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (text.length < 25) { text = ''; await sleep(1500); }
    } catch (e: any) {
      await sleep(Math.pow(2, attempt) * 1500);
    }
  }
  
  if (text.length > 0) {
    pastEventsSummary.push(text.split('.')[0] + '...');
  }
  return { text, scale };
}

async function generateAnswer(dilemma: string, question: string, frictionLevel: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const deepGuidance = frictionLevel === 'deep' 
    ? 'התייחסי לתרחיש קיצון (Stress Test בנקאי): אם שוק הנדל"ן סופג ירידת מחירים של 15% וריבית הבסיס עולה בעוד נקודת אחוז, היכן נקודת הכשל המבנית של הפרויקט/החשיפה ומה חובת הזהירות הבנקאית הנדרשת?'
    : 'עני בצורה תמציתית ומדויקת במונחי ניהול סיכונים ובקרת חשיפה.';

  const prompt = `
את אורית, מנהלת ניהול סיכוני אשראי נדל"ן בבנק.
הנה הדילמה המקצועית שהקלטת:
"""${dilemma}"""

מערכת ECHO שיקפה לך את מפת ההחלטה והציגה בפניך שאילתת הארה:
"${question}"
${deepGuidance}

עני בגוף ראשון בסגנון אנליטי, חד, מנומק ושקול (פסקה אחת עד שתיים, בין 60 ל-110 מילים). אל תוסיפי הקדמות.
`;

  let text = '';
  for (let attempt = 1; attempt <= 4 && !text; attempt++) {
    try {
      const response = await fetch(url, {
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
      text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (text.length < 20) { text = ''; await sleep(1500); }
    } catch (e: any) {
      await sleep(Math.pow(2, attempt) * 1500);
    }
  }
  return text;
}

async function runSimulator() {
  console.log('Starting Persona: Orit - Head of Real Estate Credit Risk at Bank (75 cases, 6 months)...');
  
  let startIndex = 0;
  if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(RESULTS_FILE, '# סימולציית ECHO - אורית: מנהלת ניהול סיכוני אשראי לנדל"ן בבנק\n\n' +
      '**משתמשת דמה:** אורית (מנהלת אגף סיכוני אשראי לסקטור הנדל"ן, בנק מוביל)\n' +
      '**מאפיינים:** סגנון אנליטי שקול, קוהרנטיות גבוהה, 100% מקצועי (אשראי, LTV, חשבונות ליווי, קבלני ביצוע, רגולציית בנק ישראל).\n' +
      '**היקף החלטות:** 75 מקרים לאורך 6 חודשים (180 ימים) במבנה קבוע של החלטה גדולה אחת (דקה וחצי עד שתי דקות) ושתי החלטות קטנות יותר (חצי דקה עד דקה).\n' +
      '**רמות חיכוך:** 20% מהיר (Quick Flow), 40% ממוקד (Focused Flow), 40% ניתוח עמוק (Deep Flow).\n\n---\n\n');
  } else {
    const content = fs.readFileSync(RESULTS_FILE, 'utf-8');
    const matches = content.match(/## דילמה מס' (\d+)/g);
    if (matches) {
      startIndex = matches.length;
    }
  }
  console.log(`Already processed ${startIndex}/75 cases. Resuming from index ${startIndex}...`);
  
  const totalDays = 180;
  const totalCases = 75;
  
  for (let i = startIndex; i < totalCases; i++) {
    const day = Math.floor((i / totalCases) * totalDays) + 1;
    const month = Math.ceil(day / 30);
    const frictionLevel = getFrictionLevel(i);
    const modeLabel = frictionLevel === 'quick' ? '⚡ מהיר (Quick Flow)' : (frictionLevel === 'focused' ? '🎯 ממוקד (Focused Flow)' : '🔍 עמוק (Deep Flow)');
    
    const isMajor = (i % 3 === 0);
    const scaleLabel = isMajor ? 'החלטה גדולה (Major Decision)' : 'החלטה שוטפת (Minor Decision)';
    const durationLabel = isMajor ? '~1.5-2 דקות דיבור (אנליטי מעמיק)' : '~30-60 שניות דיבור (שוטף ממוקד)';

    console.log(`\n[${i + 1}/${totalCases}] Day ${day}/180 (Month ${month}) | ${scaleLabel} | [${frictionLevel.toUpperCase()}]...`);
    
    let success = false;
    for (let attempt = 1; attempt <= 4 && !success; attempt++) {
      try {
        const { text: dilemmaText } = await generateDilemma(i, day, totalDays);
        if (!dilemmaText || dilemmaText.length < 25) throw new Error("Empty dilemma text");
        console.log(`  -> Dilemma generated (${dilemmaText.split(' ').length} words).`);
        
        const caseResult = await decisionService.createCase({
          userId: 'persona_orit_bank_risk_lead',
          rawText: dilemmaText,
          eraId: 'era-orit-realestate-risk-6months',
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
          console.log('  -> Smart Silence (Quick Flow) - Decision recorded in mirror without interruption.');
          try {
            finalResult = await decisionService.submitDeliberationAnswer(session.id, '', true);
          } catch (e) {}
        }

        const refinedBefore = finalResult.refinedInsight?.before || caseResult.refinedInsight?.before || 'הערכת סיכונים ראשונית מול לחץ של היזם או מנהל הסניף';
        const refinedNow = finalResult.refinedInsight?.now || caseResult.refinedInsight?.now || session.dimReliance || 'הפרדה בין ביטחונות קשיחים ודוחות שמאות לבין הבטחות היזם';
        const refinedNext = finalResult.refinedInsight?.chosenStep || caseResult.refinedInsight?.chosenStep || 'דרישת תנאי מתלה בוועדת אשראי או ביקורת שמאית עצמאית';

        const formatQuote = (str: string) => str ? str.split('\n').map(l => '> ' + l).join('\n') : '> —';

        const markdownEntry = [
          `## דילמה מס' ${i + 1} (ציר זמן: יום ${day}/180, חודש ${month}) • ${scaleLabel} • ${modeLabel}`,
          `**טקסט ההקלטה של אורית (מנהלת סיכוני אשראי נדל"ן - 100% מקצועי, ${durationLabel}):**`,
          formatQuote(dilemmaText),
          ``,
          `### מראת 5 הממדים של ECHO (Editable Mirror)`,
          `- **מה נשקל (Consideration):** ${session.dimConsideration}`,
          `- **המתח המרכזי (Central Tension):** ${session.centralTension || 'שמירה על כריות ביטחון ומגבלות בנק ישראל מול שימור פעילות עסקית של לקוח מרכזי'}`,
          `- **להשיג ולשמור (Goals & Prices):** ${session.dimGoalsPrices}`,
          `- **עובדות קשיחות (Hard Facts):** ${session.dimFacts}`,
          `- **הנחות ציר (Core Assumptions):** ${session.dimAssumptions}`,
          `- **מידע חסר להכרעה (Missing Information):** ${session.dimMissingInfo}`,
          ``,
          `### פעולת המערכת (Adaptive Friction)`,
          `- **רמת חיכוך שנבחרה:** \`${frictionLevel}\` (${modeLabel})`,
          frictionLevel === 'quick' 
            ? `- **שתיקה חכמה (Smart Silence):** המערכת תיעדה את רכיבי הסיכון במראה ללא עצירה, כדי לאפשר קבלת החלטה שוטפת מהירה ללא סרבול.`
            : `- **שאלת הארה של ECHO:** ${bespokeQuestion}\n- **מענה שקול של אורית:**\n${formatQuote(answer)}`,
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
        console.log(`  -> Saved dilemma ${i + 1}/75 successfully. (${new Date().toLocaleTimeString()})`);
        success = true;
        
        // Minimal delay to prevent API 429 while running as fast as possible
        await sleep(350);

      } catch (err: any) {
        console.warn(`  -> Attempt ${attempt}/4 failed for dilemma ${i + 1}: ${err.message}. Retrying...`);
        await sleep(2500);
      }
    }

    if (!success) {
      console.error(`  -> Permanent error for dilemma ${i + 1}!`);
      fs.appendFileSync(RESULTS_FILE, `\n## דילמה מס' ${i + 1} (יום ${day})\n**ERROR:** Failed after 4 attempts.\n\n---\n`);
    }
  }

  console.log('Orit Simulator finished successfully (75 cases)!');
}

runSimulator().catch(console.error);
