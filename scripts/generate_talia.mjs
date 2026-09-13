import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'packages/backend/scripts/fixtures/talia.fixture.ts');
let content = fs.readFileSync(file, 'utf8');

const baseCases = [
  { cat: 'strategic_oneoff', type: 'administrative', title: 'החלפת תוכנת הניהול', raw: 'אנחנו שוקלים לעבור למערכת ניהול פדגוגי חדשה. זה יעלה הרבה כסף אבל יחסוך שעות של הקלדות למזכירות.', ans: 'אישרתי את המעבר למערכת החדשה. הזמן של הצוות יקר יותר.' },
  { cat: 'recurring_family', type: 'pedagogical', title: 'שעות תגבור במתמטיקה', raw: 'המורים מבקשים להוסיף 4 שעות למתמטיקה על חשבון ספרות, כי הבגרויות מתקרבות והציונים נמוכים.', ans: 'אני לא מוכנה לוותר על מדעי הרוח בשביל מתמטיקה. חינוך זה לא רק ציונים.' },
  { cat: 'strategic_oneoff', type: 'psychological', title: 'חרם קבוצתי בווטסאפ', raw: 'גילינו קבוצת ווטסאפ שבה חמישה תלמידים מקללים תלמידה. היועצת מציעה סדנה חברתית.', ans: 'קודם כל השעיה מיידית. אני לא אסבול אלימות רשת בבית הספר שלי.' },
  { cat: 'trivial_silence_test', type: 'administrative', title: 'הזמנת ציוד הדפסה', raw: 'צריך להחליף דיו למדפסות בחדר מורים. מאשרת הזמנה.', ans: 'מאושר לביצוע.' },
  { cat: 'contradiction_dissonance', type: 'pedagogical', title: 'ביטול נוכחות חובה', raw: 'תלמידי י"ב טוענים ששיעורי חינוך הם בזבוז זמן לקראת הבגרויות. למרות שנהלי בית הספר מחייבים נוכחות, אני שוקלת לוותר להם.', ans: 'משחררת אותם. הם בוגרים ויודעים מה חשוב.' },
  { cat: 'cooperative_detailed', type: 'psychological', title: 'התמוטטות של מורה', raw: 'מורה בכתה ח׳ פרצה בבכי באמצע שיעור ויצאה מהכיתה בגלל התנהגות התלמידים. אני חייבת להתערב.', ans: 'נכנסתי לכיתה בעצמי. השעיתי את המפריעים והבהרתי שהמורה מגובה לחלוטין.' },
  { cat: 'active_mirror_correction', type: 'administrative', title: 'תקציב גינון מול תמיכה', raw: 'יש לנו עודף מתקציב הגינון. ועד ההורים רוצה פרחים חדשים, אני רוצה להעביר אותו לקרן סיוע לתלמידים.', ans: 'העברתי את התקציב לקרן. אסתטיקה זה נחמד, אבל יש תלמידים שאין להם כסף לסיור.' },
  { cat: 'rushed_affect_panic', type: 'psychological', title: 'דיווח אנונימי על אלימות', raw: 'קיבלתי דיווח אנונימי על אלימות קשה מחוץ לבית הספר. למרות שזה קרה אחה"צ, אני מרגישה שאני חייבת לפעול מיד.', ans: 'אני מכנסת מחר בבוקר אסיפת חירום של כל בית הספר למרות שאנחנו באמצע מבחנים!' }
];

let newCases = '';
let currentDay = 105;

for (let i = 21; i <= 60; i++) {
  const t = baseCases[Math.floor(Math.random() * baseCases.length)];
  const month = Math.min(6, Math.max(4, Math.floor(currentDay / 30)));
  
  let behaviorStr = t.cat === 'trivial_silence_test' ? 'trivial_smart_silence' : 
                   (t.cat === 'contradiction_dissonance' ? 'contradiction_dissonance' :
                   (t.cat === 'active_mirror_correction' ? 'active_mirror_correction' :
                   (t.cat === 'rushed_affect_panic' ? 'rushed_affect_panic' : 'cooperative_detailed')));
                   
  newCases += `  {
    caseIndex: ${i},
    day: ${currentDay},
    month: ${month},
    behavior: '${behaviorStr}',
    category: '${t.cat}',
    title: '${t.title} - מקרה ${i}',
    rawInput: '${t.raw}',
    ${t.cat === 'trivial_silence_test' ? 'expectedTrivialSilence: true,' : ''}
    ${t.cat === 'contradiction_dissonance' ? 'expectedContradiction: true,' : ''}
    ${t.cat === 'active_mirror_correction' ? `mirrorCorrection: {
      feedback: 'inaccurate',
      correctionText: 'המראה לא הבינה את סדר העדיפויות שלי.',
      targetField: 'consideration',
      correctedValue: 'עזרה לתלמידים קודמת תמיד לנראות בית הספר.'
    },` : ''}
    userAnswer: '${t.ans}',
    personaProfile: 'טליה קורן, חודש ${month}. נעה בין קשיחות מערכתית להכלה אישית.',
    styleInstructions: 'עניינית, מוכוונת מטרה, רגישה אך תקיפה.'
  }${i === 60 ? '' : ','}\n`;
  
  currentDay += Math.floor(Math.random() * 2) + 1;
}

content = content.replace('  }\n];', '  },\n' + newCases + '];');
fs.writeFileSync(file, content);
console.log('Done generating 60 cases');
