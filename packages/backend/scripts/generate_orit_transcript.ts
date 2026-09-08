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
const SOURCE_FILE = path.join(SIMULATIONS_DIR, 'user9_orit_realestate_risk_lead_75cases.md');
const TRANSCRIPT_FILE = path.join(SIMULATIONS_DIR, 'user9_orit_transcript_full.md');

function runTranscriptGenerator() {
  console.log('Generating full transcript for Orit simulation...');
  const raw = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const blocks = raw.split(/(?=## דילמה מס' \d+)/g);
  console.log(`Found ${blocks.length - 1} dilemma blocks.`);

  let transcriptMd = [
    '# תמלול ופרוטוקול מלא של סימולציית ECHO - אורית: מנהלת ניהול סיכוני אשראי לנדל"ן בבנק',
    '',
    '> **מטרת המסמך:** פרוטוקול שיחה ותמלול מלא של 75 החלטות ואינטראקציות לאורך 6 חודשים (180 ימים).',
    '> לכל מקרה מובאים: המונולוג המוקלט המלא של אורית, מראת 5 הממדים של המערכת, שאלת/תגובת ECHO, מענה המשתמשת (כאשר נדרש), והתובנה שהתחדדה (Refined Insight).',
    '',
    '---',
    ''
  ].join('\n');

  let count = 0;

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];

    // Extract Title & Meta
    const titleMatch = block.match(/## דילמה מס' (\d+) \(([^)]+)\) • ([^•\n]+) • ([^\n]+)/);
    const caseNum = titleMatch ? titleMatch[1] : `${i}`;
    const timeContext = titleMatch ? titleMatch[2] : '';
    const decisionScale = titleMatch ? titleMatch[3].trim() : '';
    const flowMode = titleMatch ? titleMatch[4].trim() : '';

    // Extract Orit Speech
    const oritSpeechMatch = block.match(/\*\*טקסט ההקלטה של אורית[^*]+\*\*:?\s*([\s\S]*?)(?=### מראת 5 הממדים)/);
    let oritSpeech = oritSpeechMatch ? oritSpeechMatch[1].trim() : '';
    oritSpeech = oritSpeech.replace(/^>\s?/gm, '').trim();

    // Extract Mirror Dimensions
    const considerationMatch = block.match(/- \*\*מה נשקל[^:]*:\*\*\s*([^\n]+)/);
    const consideration = considerationMatch ? considerationMatch[1].trim() : '—';

    const tensionMatch = block.match(/- \*\*המתח המרכזי[^:]*:\*\*\s*([^\n]+)/);
    const tension = tensionMatch ? tensionMatch[1].trim() : '—';

    const goalsPricesMatch = block.match(/- \*\*להשיג ולשמור[^:]*:\*\*\s*([^\n]+)/);
    const goalsPrices = goalsPricesMatch ? goalsPricesMatch[1].trim() : '—';

    const factsMatch = block.match(/- \*\*עובדות קשיחות[^:]*:\*\*\s*([^\n]+)/);
    const facts = factsMatch ? factsMatch[1].trim() : '—';

    const assumptionsMatch = block.match(/- \*\*הנחות ציר[^:]*:\*\*\s*([^\n]+)/);
    const assumptions = assumptionsMatch ? assumptionsMatch[1].trim() : '—';

    const missingInfoMatch = block.match(/- \*\*מידע חסר להכרעה[^:]*:\*\*\s*([^\n]+)/);
    const missingInfo = missingInfoMatch ? missingInfoMatch[1].trim() : '—';

    // Extract System Action / Question
    const systemQuestionMatch = block.match(/- \*\*שאלת הארה של ECHO:\*\*\s*([\s\S]*?)(?=- \*\*מענה שקול של אורית:)/);
    const systemSilenceMatch = block.match(/- \*\*שתיקה חכמה \(Smart Silence\):\*\*\s*([^\n]+)/);

    let systemDialogue = '';
    if (systemQuestionMatch) {
      systemDialogue = systemQuestionMatch[1].trim();
    } else if (systemSilenceMatch) {
      systemDialogue = systemSilenceMatch[1].trim();
    } else {
      systemDialogue = 'המערכת תיעדה את רכיבי הסיכון במראה ללא התערבות נוספת.';
    }

    // Extract Orit Response / Answer
    const oritAnswerMatch = block.match(/- \*\*מענה שקול של אורית:\*\*\s*([\s\S]*?)(?=### חיווי התחדדות)/);
    let oritAnswer = oritAnswerMatch ? oritAnswerMatch[1].trim() : '';
    oritAnswer = oritAnswer.replace(/^>\s?/gm, '').trim();
    const hasValidAnswer = oritAnswer && oritAnswer !== '—';

    // Extract Refined Insight
    const beforeMatch = block.match(/- \*\*קודם חשבה[^:]*:\*\*\s*([^\n]+)/);
    const before = beforeMatch ? beforeMatch[1].trim() : '—';

    const nowMatch = block.match(/- \*\*כעת התחדד[^:]*:\*\*\s*([^\n]+)/);
    const now = nowMatch ? nowMatch[1].trim() : '—';

    const nextMatch = block.match(/- \*\*הצעד הנבחר[^:]*:\*\*\s*([^\n]+)/);
    const next = nextMatch ? nextMatch[1].trim() : '—';

    // Format Markdown Entry
    const entry = [
      `## החלטה מס' ${caseNum}: ${decisionScale} (${timeContext}) • ${flowMode}`,
      ``,
      `🎙️ **הקלטת המשתמשת (אורית - מנהלת סיכוני אשראי נדל"ן):**`,
      `> "${oritSpeech}"`,
      ``,
      `🪞 **שיקוף המערכת (מראת 5 הממדים של ECHO):**`,
      `- **מה נשקל (Consideration):** ${consideration}`,
      `- **המתח המרכזי (Central Tension):** ${tension}`,
      `- **להשיג ולשמור (Goals & Prices):** ${goalsPrices}`,
      `- **עובדות קשיחות (Hard Facts):** ${facts}`,
      `- **הנחות ציר (Core Assumptions):** ${assumptions}`,
      `- **מידע חסר להכרעה (Missing Information):** ${missingInfo}`,
      ``,
      `🤖 **תגובת / שאלת המערכת (ECHO Adaptive Intervention):**`,
      `> ${systemDialogue}`,
      ``,
      `💬 **מענה המשתמשת (אורית):**`,
      hasValidAnswer ? `> "${oritAnswer}"` : `*(לא נדרש מענה - המקרה סווג למסלול שתיקה חכמה / ללא התערבות מעכבת)*`,
      ``,
      `💡 **התובנה שהתחדדה (Refined Insight):**`,
      `- **קודם חשבה (Before):** ${before}`,
      `- **כעת התחדד (Now):** ${now}`,
      `- **הצעד הנבחר לביצוע (Next Action):** ${next}`,
      ``,
      `---`,
      ``
    ].join('\n');

    transcriptMd += entry;
    count++;
  }

  fs.writeFileSync(TRANSCRIPT_FILE, transcriptMd, 'utf-8');
  console.log(`Successfully generated full transcript for ${count} cases into: ${TRANSCRIPT_FILE}`);
}

runTranscriptGenerator();
