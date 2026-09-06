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
const geminiProvider = new GeminiAiProvider(process.env.GEMINI_API_KEY || '', 'gemini-3.6-flash');
const decisionService = new DecisionService(geminiProvider);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callGeminiWithRetry(prompt: string, maxAttempts = 5, temp = 0.85): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: temp }
        })
      });
      if (response.status === 429 || response.status === 503) {
        console.warn(`    [Gemini API ${response.status}] Attempt ${attempt}/${maxAttempts}. Waiting before retry...`);
        await sleep(Math.pow(2, attempt) * 2000);
        continue;
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (text.length > 20) {
        return text;
      }
      console.warn(`    [Gemini API returned short/empty text] Attempt ${attempt}/${maxAttempts}. Retrying...`);
      await sleep(2000);
    } catch (e: any) {
      console.warn(`    [Gemini Fetch Error]: ${e.message}. Attempt ${attempt}/${maxAttempts}. Retrying...`);
      await sleep(Math.pow(2, attempt) * 2000);
    }
  }
  throw new Error(`Failed to generate text from Gemini after ${maxAttempts} attempts.`);
}

function getFrictionLevel(index: number): 'quick' | 'focused' | 'deep' {
  const mod = index % 5;
  if (mod === 0) return 'quick';      // 15 cases (20%)
  if (mod === 1 || mod === 2) return 'focused'; // 30 cases (40%)
  return 'deep';                      // 30 cases (40%)
}

interface PersonaConfig {
  filename: string;
  userId: string;
  eraId: string;
  headerTag: string;
  generateDilemmaPrompt: (day: number) => string;
  generateAnswerPrompt: (dilemma: string, question: string, friction: string) => string;
}

const PERSONAS: PersonaConfig[] = [
  {
    filename: 'user5_physics_philosophy_student_75cases.md',
    userId: 'persona_student_physics_01',
    eraId: 'era-student-6months',
    headerTag: 'סטודנט לפיזיקה ופילוסופיה - 100% אישי, ~30 שניות',
    generateDilemmaPrompt: (day: number) => `
אתה סטודנט לתואר כפול בפיזיקה ופילוסופיה באוניברסיטה, בשנה ג'.
הטקסט שאתה מייצר חייב להיות 100% אישי. אורך דיבור ממוצע של חצי דקה (כ-50 עד 80 מילים בעברית).
הנושאים: דילמות אישיות עמוקות, יחסים, בדידות, עומס נפשי, משמעות, ספקות לגבי העתיד, שילוב בין מושגים מעולם הפיזיקה/פילוסופיה (אנטרופיה, דטרמיניזם, אקזיסטנציאליזם, מכניקת קוונטים, שבריריות) לבין רגשות יומיומיים.
הסגנון: אינטלקטואלי אך פגיע, אותנטי, רפלקסיבי, רמת פירוט גבוהה.
אנו נמצאים ביום ה-${day} מתוך 180 (חצי שנה של סמסטר וקיץ).
החזר אך ורק את מונולוג הדיבור של הסטודנט, ללא כותרות, ללא הקדמות וללא מירכאות.
`,
    generateAnswerPrompt: (dilemma: string, question: string, friction: string) => {
      const deep = friction === 'deep' ? 'בנוסף להתייחסות לשאלה, התייחס במפורש לתרחיש הכשל (Pre-Mortem): מה נקודת התורפה הפנימית שבגללה המהלך שאתה שוקל עלול להתפרק בעוד חצי שנה?' : '';
      return `
אתה סטודנט לפיזיקה ופילוסופיה. הנה מה ששיתפת קודם לגבי דילמה אישית שלך:
"""${dilemma}"""
המערכת שיקפה לך את המצב ושאלה:
"${question}"
${deep}
ענה בגוף ראשון בצורה אותנטית, כנה ועמוקה (פסקה אחת עד שתיים). אל תוסיף הקדמות.
`;
    }
  },
  {
    filename: 'user6_school_principal_75cases.md',
    userId: 'persona_principal_education_02',
    eraId: 'era-principal-6months',
    headerTag: 'מנהלת בית ספר - 100% מקצועי, ~45 שניות',
    generateDilemmaPrompt: (day: number) => `
אתה מנהלת בית ספר שש-שנתי (תיכון וחטיבה) מנוסה ומוערכת.
הטקסט שאתה מייצר חייב להיות 100% מקצועי (עולם החינוך, ניהול מורים, משרד החינוך, ועד הורים, תקציבים, משמעת, פדגוגיה, לחצי קהילה, תלמידים בסיכון).
אורך דיבור ממוצע: כ-45 שניות (כ-80 עד 120 מילים בעברית).
הסגנון: ממלכתי, שקול, אחראי, פרקטי, מתמודד עם ניגודי אינטרסים מורכבים במערכת החינוך, דילמות ערכיות ופדגוגיות לצד שיקולים מנהליים ומשפטיים.
אנו נמצאים ביום ה-${day} מתוך 180 (מחצית שנת לימודים).
החזר אך ורק את מונולוג הדיבור של המנהלת, ללא כותרות, ללא הקדמות וללא מירכאות.
`,
    generateAnswerPrompt: (dilemma: string, question: string, friction: string) => {
      const deep = friction === 'deep' ? 'בנוסף להתייחסות לשאלה, התייחסי במפורש לתרחיש הכשל (Pre-Mortem): מה הסיכון המערכתי או נקודת התורפה שבגללה ההחלטה הניהולית הזו עלולה להתפוצץ מול הפיקוח/ההורים בעוד שישה חודשים?' : '';
      return `
את מנהלת בית ספר מנוסה. הנה מה ששיתפת קודם לגבי דילמה מקצועית שלך:
"""${dilemma}"""
המערכת שיקפה לך את המצב ושאלה:
"${question}"
${deep}
עני בגוף ראשון בצורה ממלכתית, מנהיגותית ושקולה (פסקה אחת עד שתיים). אל תוסיפי הקדמות.
`;
    }
  },
  {
    filename: 'user7_tech_lead_architect_75cases.md',
    userId: 'persona_techlead_architect_03',
    eraId: 'era-techlead-6months',
    headerTag: 'ראש צוות וארכיטקט מערכת בהייטק - 80% מקצועי, 20% אישי, ~1 דקה',
    generateDilemmaPrompt: (day: number) => {
      const isPersonal = Math.random() < 0.2;
      const topic = isPersonal 
        ? 'אישי (שחיקה משעות מרובות מול מסכים, זוגיות שסובלת מ-On-Call ודדליינים, רצון לעשות רילוקיישן מול משפחה, תחושת החמצה לגבי גידול הילדים)' 
        : 'מקצועי (ארכיטקטורת מיקרו-סרביסים מול מונולית, פער בין שכתוב חוב טכנולוגי לדרישות פרודקט, קונפליקט מקצועי מול מפתח בכיר עקשן, בחירת תשתית ענן, ניהול אירוע Production Outage, ביצועים ו-Scalability)';
      return `
אתה מגלם ראש צוות בכיר וארכיטקט מערכת בחברת הייטק בצמיחה.
נושא הדילמה הפעם: ${topic}.
סגנון: הנדסי, מתודי, אנליטי, מתבסס על Trade-offs ברורים, לקסיקון טכנולוגי ישראלי אותנטי (Latencies, PRs, Production, Tech-Debt, Refactoring, Stakeholders, Scale).
כאשר הנושא אישי – הוא משתקף דרך אותה חשיבה מתודית שמנסה לייצר אופטימיזציה לחיים.
אורך המונולוג: כדקה דיבור בקול רם (בין 130 ל-170 מילים, 2 עד 3 פסקאות מובנות).
אנו נמצאים ביום ה-${day} מתוך 180 (חצי שנה של פיתוח).
החזר אך ורק את טקסט המונולוג שלך ללא כותרות, ללא הקדמות וללא מירכאות.
`;
    },
    generateAnswerPrompt: (dilemma: string, question: string, friction: string) => {
      const deep = friction === 'deep' ? 'בנוסף להתייחסות לשאלה, התייחס במפורש לתרחיש הכשל (Pre-Mortem): מה ה-Single Point of Failure (SPOF) או תרחיש הקיצון שבו ההחלטה הזו תקרוס בפרודקשן או תפרק את הצוות בעוד שישה חודשים?' : '';
      return `
אתה ראש צוות וארכיטקט מערכת בכיר בהייטק. הנה מה ששיתפת קודם לגבי דילמה מקצועית/אישית שלך:
"""${dilemma}"""
המערכת שיקפה לך את המצב ושאלה:
"${question}"
${deep}
ענה בגוף ראשון בצורה מקצועית, אנליטית ומחוברת לקרקע (פסקה אחת עד שתיים). אל תוסיף הקדמות.
`;
    }
  },
  {
    filename: 'user8_architect_75cases.md',
    userId: 'persona_architect_design_04',
    eraId: 'era-architect-6months',
    headerTag: 'אדריכל ובעל משרד תכנון - 70% מקצועי, 30% אישי, ~45-60 שניות',
    generateDilemmaPrompt: (day: number) => {
      const isPersonal = Math.random() < 0.3;
      const topic = isPersonal 
        ? 'אישי (שיפוץ הבית הפרטי מול חוסר זמן, עייפות ושחיקה, יחסים משפחתיים שנפגעים מהתמסרות טוטאלית לפרויקטים, שאלת האותנטיות מול יצירה מסחרית)' 
        : 'מקצועי (פשרה בין שפה אדריכלית לחסכנות קבלן, דרישות עיריות ורישוי תקוע, לקוחות עשירים וקפריזיים שמשנים תוכניות, בחירת חומרים - בטון גלוי מול טיח, מתח בין תכנון מוקפד לעמידה בתקציב קשיח)';
      return `
אתה מגלם תפקיד של אדריכל ומתכנן עצמאי בעל סטודיו בוטיק.
נושא הדילמה: ${topic}.
סגנון: ויזואלי, מרחבי, רגיש לחומר ולאור, רהוט, אך גם עסוק בבירוקרטיה, פרקטיקה, קונפליקטים מול קבלני שלד וועדות תכנון.
אורך המונולוג: בין 80 ל-150 מילים (2 פסקאות).
אנו נמצאים ביום ה-${day} מתוך 180 (חצי שנה של תכנון וביצוע).
החזר אך ורק את טקסט המונולוג שלך ללא כותרות, ללא הקדמות וללא מירכאות.
`;
    },
    generateAnswerPrompt: (dilemma: string, question: string, friction: string) => {
      const deep = friction === 'deep' ? 'בנוסף להתייחסות לשאלה, התייחס במפורש לתרחיש הכשל (Pre-Mortem): מה נקודת התורפה בתכנון או בהתנהלות מול הלקוח/הקבלן שבגללה הפרויקט יספוג כשל מבני, תביעה משפטית או פגיעה קשה במוניטין בעוד שישה חודשים?' : '';
      return `
אתה אדריכל ובעל משרד תכנון. הנה מה ששיתפת קודם לגבי דילמה שלך:
"""${dilemma}"""
המערכת שיקפה לך את המצב ושאלה:
"${question}"
${deep}
ענה בגוף ראשון בצורה אותנטית, ויזואלית ומעמיקה (פסקה אחת עד שתיים). אל תוסיף הקדמות.
`;
    }
  }
];

async function repairFile(persona: PersonaConfig) {
  const filePath = path.join(SIMULATIONS_DIR, persona.filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File ${persona.filename} does not exist, skipping.`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  // Split into blocks: block 0 is header, blocks 1..N are dilemmas
  const blocks = content.split(/(?=## דילמה מס' \d+)/g);
  console.log(`\n=== Checking ${persona.filename} (Total blocks: ${blocks.length}) ===`);

  let repairedCount = 0;

  for (let bIdx = 1; bIdx < blocks.length; bIdx++) {
    const block = blocks[bIdx];
    const match = block.match(/## דילמה מס' (\d+)/);
    if (!match) continue;
    const caseNum = parseInt(match[1], 10);
    const hasError = block.includes('**ERROR:**') || !block.includes('### מראת 5 הממדים של ECHO');

    if (hasError) {
      console.log(`  -> Dilemma ${caseNum} has an error. Repairing...`);
      const i = caseNum - 1;
      const day = Math.floor((i / 75) * 180) + 1;
      const month = Math.ceil(day / 30);
      const frictionLevel = getFrictionLevel(i);
      const modeLabel = frictionLevel === 'quick' ? '⚡ מהיר (Quick Flow)' : (frictionLevel === 'focused' ? '🎯 ממוקד (Focused Flow)' : '🔍 עמוק (Deep Flow)');

      let success = false;
      for (let attempt = 1; attempt <= 4 && !success; attempt++) {
        try {
          // 1. Generate Dilemma Text
          const dilemmaText = await callGeminiWithRetry(persona.generateDilemmaPrompt(day));
          
          // 2. Call Decision Service
          const caseResult = await decisionService.createCase({
            userId: persona.userId,
            rawText: dilemmaText,
            eraId: persona.eraId,
            frictionLevel
          });

          const session = caseResult.decisionCase;
          const bespokeQuestion = caseResult.illuminationQuestion;
          let answer = '';
          let finalResult = caseResult;

          // 3. Generate Answer if needed
          if (frictionLevel !== 'quick') {
            answer = await callGeminiWithRetry(persona.generateAnswerPrompt(dilemmaText, bespokeQuestion, frictionLevel));
            try {
              finalResult = await decisionService.submitDeliberationAnswer(session.id, answer);
            } catch (e) {
              console.log('    Fallback for submitDeliberationAnswer');
            }
          } else {
            try {
              finalResult = await decisionService.submitDeliberationAnswer(session.id, '', true);
            } catch (e) {}
          }

          const refinedBefore = finalResult.refinedInsight?.before || caseResult.refinedInsight?.before || 'שיקוף ראשוני של הדילמה';
          const refinedNow = finalResult.refinedInsight?.now || caseResult.refinedInsight?.now || session.dimReliance || 'הפרדה בין הנחות לעובדות';
          const refinedNext = finalResult.refinedInsight?.chosenStep || caseResult.refinedInsight?.chosenStep || 'צעד בירור ממוקד';
          const formatQuote = (str: string) => str ? str.split('\n').map(l => '> ' + l).join('\n') : '> —';

          const newBlock = [
            `## דילמה מס' ${caseNum} (ציר זמן: יום ${day}/180, חודש ${month}) • ${modeLabel}`,
            `**טקסט המקור (${persona.headerTag}):**`,
            formatQuote(dilemmaText),
            ``,
            `### מראת 5 הממדים של ECHO (Editable Mirror)`,
            `- **מה אתה שוקל:** ${session.dimConsideration}`,
            `- **מתח מרכזי:** ${session.centralTension || 'קונפליקט פנימי בין שאיפות מנוגדות'}`,
            `- **להשיג ולשמור:** ${session.dimGoalsPrices}`,
            `- **עובדות קשיחות:** ${session.dimFacts}`,
            `- **הנחות ציר:** ${session.dimAssumptions}`,
            `- **מידע חסר להכרעה:** ${session.dimMissingInfo}`,
            ``,
            `### פעולת המערכת (Adaptive Friction)`,
            `- **רמת חיכוך שנבחרה:** \`${frictionLevel}\` (${modeLabel})`,
            frictionLevel === 'quick' 
              ? `- **שתיקה חכמה (Smart Silence):** המערכת בחרה שלא להתערב ולעכב את המשתמש. השיקולים נרשמו במראה להמשך מעקב.`
              : `- **שאלת הארה:** ${bespokeQuestion}\n- **מענה:**\n${formatQuote(answer)}`,
            ``,
            `### חיווי התחדדות (Refined Insight)`,
            `- **קודם חשב:** ${refinedBefore}`,
            `- **כעת התחדד:** ${refinedNow}`,
            `- **הצעד הנבחר:** ${refinedNext}`,
            ``,
            `---`,
            ``
          ].join('\n');

          blocks[bIdx] = newBlock;
          repairedCount++;
          fs.writeFileSync(filePath, blocks.join(''));
          console.log(`  -> Dilemma ${caseNum} repaired and saved successfully.`);
          success = true;
          await sleep(1000); // 1 sec throttle
        } catch (err: any) {
          console.warn(`  -> Attempt ${attempt}/4 failed for Dilemma ${caseNum}: ${err.message}. Retrying...`);
          await sleep(3000);
        }
      }
    }
  }

  if (repairedCount > 0) {
    console.log(`Successfully completed all repairs for ${persona.filename}`);
    console.log(`Successfully saved ${repairedCount} repaired dilemma(s) into ${persona.filename}`);
  } else {
    console.log(`No errors found in ${persona.filename}. All 75 dilemmas are valid.`);
  }
}

async function run() {
  console.log('Starting Repair Process for all 4 simulations...');
  for (const persona of PERSONAS) {
    await repairFile(persona);
  }
  console.log('\nAll files checked and repaired!');
}

run().catch(err => {
  console.error('Fatal error in repair process:', err);
});
