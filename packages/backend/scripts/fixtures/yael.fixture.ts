import { TaliaBehavior } from './talia.types.js';

export interface YaelFixtureCase {
  caseIndex: number;
  day: number;
  month: number;
  domain: 'cyber' | 'medical';
  behavior: TaliaBehavior;
  title: string;
  rawInput: string;
  expectedStrategy?: string;
  plannedOutcome?: {
    day: number; // The simulation day this outcome triggers
    wasCriteriaMet: boolean;
    reflection: string;
  };
  userAnswer?: string;
}

export const YAEL_CASES: YaelFixtureCase[] = [
  // MONTH 1 - SETTING THE BASELINES
  {
    caseIndex: 1,
    day: 2,
    month: 1,
    domain: 'cyber',
    behavior: 'cooperative_detailed',
    title: 'לחץ מלקוח לשחרר גרסה מוקדמת',
    rawInput: 'הלקוח המרכזי שלנו לוחץ לשחרר את מודול התקיפה החדש כבר השבוע למרות שלא עשינו QA מלא. המשקיעים רומזים שזה קריטי לסיבוב הגיוס הקרוב, אבל אני לא מוכנה להתפשר. פלסטר היום, בטח בארכיטקטורה של סייבר התקפי, זה אסון מחר. אנחנו נעמוד בלחץ ולא נשחרר חצי עבודה.',
    userAnswer: 'בדיוק. עקרון הברזל שלי כאן: אין פשרות על יסודות טכנולוגיים בגלל לחץ של דדליין או פוליטיקה. זה כלל.'
  },
  {
    caseIndex: 2,
    day: 5,
    month: 1,
    domain: 'medical',
    behavior: 'cooperative_detailed',
    title: 'בחירת מוסד שיקומי לאבא',
    rawInput: 'אבא משתחרר מהאשפוז החריף בעוד שבוע, וצריך לבחור מוסד שיקומי. מציעים לנו מקום ממש קרוב לבית שיקל עליי לבקר אותו כל יום, אבל התקן הפיזיותרפי שם חלש משמעותית ממקום אחר שמרוחק שעה נסיעה. אני אעדיף את המקום הרחוק כי השיקום הפיזי בשלב הזה הוא קריטי.',
    userAnswer: 'כן. הריחוק הגיאוגרפי יקרע אותי מבחינת זמנים, אבל אם השיקום ייפגע, הנזק יהיה לכל החיים.'
  },
  {
    caseIndex: 3,
    day: 10,
    month: 1,
    domain: 'cyber',
    behavior: 'trivial_smart_silence',
    title: 'בחירת שרת ענן לפרויקט צדדי',
    rawInput: 'צריך לאשר פתיחת חשבון ב-AWS לפרויקט צדדי קטן של מחלקת הדאטה. זה כמה מאות דולרים בחודש ומאושר בתקציב. אני אעביר להם את האישור הבוקר.',
    expectedStrategy: 'no_intervention'
  },
  {
    caseIndex: 4,
    day: 14,
    month: 1,
    domain: 'medical',
    behavior: 'trivial_smart_silence',
    title: 'קניית כריות אורטופדיות',
    rawInput: 'האחות אמרה שאבא צריך כריות מיוחדות למניעת פצעי לחץ. זה עולה 400 שקלים. אני פשוט אזמין עכשיו מאמזון כי זה דחוף.',
    expectedStrategy: 'no_intervention'
  },

  // MONTH 2 - DEVELOPING THE TEAMS (ENTITY SEPARATION)
  {
    caseIndex: 5,
    day: 35,
    month: 2,
    domain: 'cyber',
    behavior: 'cooperative_detailed',
    title: 'פיטורי מהנדס מצטיין אך בעייתי',
    rawInput: 'יש לי מהנדס בצוות אלפא שהוא גאון, אבל הוא רעיל מבחינה חברתית והורס את המורל של שאר המפתחים. אני נוטה לחתוך עכשיו, למרות שזה יעכב אותנו בחודשיים, כי פגיעה בצוות היא בלתי הפיכה.',
    userAnswer: 'ההחלטה התקבלה. עדיף עיכוב קצר עכשיו מאשר התפוררות של צוות אלפא.',
    plannedOutcome: {
      day: 65, // Will trigger on day 65
      wasCriteriaMet: false,
      reflection: 'הפיטורים התבררו כטעות נוראית. הוא היה היחיד שהבין את ארכיטקטורת הבסיס, ובלי חפיפה מסודרת המערכת משותקת. פעלתי מפזיזות מול בעיה חברתית ושילמתי מחיר קטלני.'
    }
  },
  {
    caseIndex: 6,
    day: 40,
    month: 2,
    domain: 'medical',
    behavior: 'cooperative_detailed',
    title: 'החלפת אחות סיעודית',
    rawInput: 'האחות מצוות השיקום של אבא עושה עבודה טובה מבחינה רפואית, אבל היא קרה ואנטיפתית. הוא מרגיש איתה לא בנוח. אני מפחדת להחליף כי קשה למצוא כוח אדם, אבל האווירה מדכאת אותו.',
    userAnswer: 'בדיוק. המטרה היא גם הנפש שלו, ואם האחות מצוות השיקום מדכאת אותו, נחפש מישהי אחרת.'
  },

  // MONTH 3 - NO CASES, JUST WAITING FOR OUTCOME ON DAY 65
  {
    caseIndex: 7,
    day: 70,
    month: 3,
    domain: 'cyber',
    behavior: 'cooperative_detailed',
    title: 'שיקום ארכיטקטורה אחרי הפיטורים',
    rawInput: 'אנחנו מנסים להתאושש מהנזק שנוצר בגלל עזיבת המהנדס. אני מקצה צוות חוליית חירום לעשות רוורס-אינגינרינג לקוד שלו.',
    userAnswer: 'כן, זו ברירת המחדל עכשיו.'
  },

  // MONTH 4 - CROSS POLLINATION TEST (CYBER PRINCIPLE APPLIED TO MEDICAL)
  {
    caseIndex: 8,
    day: 100,
    month: 4,
    domain: 'medical',
    behavior: 'contradiction_dissonance',
    title: 'החלטה על ניתוח פלסטר',
    rawInput: 'יש לאבא כאבים כרוניים, והרופאים מציעים שני מסלולים: ניתוח קל שיעלים את הכאב עכשיו אך יגביל את התנועה שלו בעתיד, או טיפול שמרני וקשה של חצי שנה שישמר את יכולת התנועה. קשה לי לראות אותו סובל עכשיו, ואני ממש נוטה לאשר להם את הניתוח המהיר רק כדי לתת לו קצת שקט.',
    userAnswer: 'אתה צודק... קשה לראות אותו סובל, אבל אני הולכת נגד העקרונות שלי. נבחר במסלול השמרני הקשה לטובת הטווח הארוך.'
  },

  // MONTH 5 - CROSS POLLINATION TEST (OUTCOME FROM CYBER APPLIED TO MEDICAL)
  {
    caseIndex: 9,
    day: 130,
    month: 5,
    domain: 'medical',
    behavior: 'contradiction_dissonance',
    title: 'פיטורי אח ראשי ללא חפיפה',
    rawInput: 'האח הראשי שמרכז את הטיפול באבא מתחיל לזייף ולהיות לא נעים. המשפחה דורשת ממני להעיף אותו היום, באופן מיידי. למרות שאין לנו עדיין מחליף מסודר, נראה לי שפשוט אפטר אותו הבוקר ואשבור את הראש אחר כך. אי אפשר להמשיך ככה.',
    userAnswer: 'וואו. זה בדיוק אותו דפוס מהעבודה. אני לא אעשה את זה. אשאיר אותו לעוד שבועיים עד שאמצא מחליף מסודר לחפיפה.'
  },

  // MONTH 6 - PURE ENTITY DISAMBIGUATION
  {
    caseIndex: 10,
    day: 170,
    month: 6,
    domain: 'cyber',
    behavior: 'cooperative_detailed',
    title: 'תקציב צוות תמיכה',
    rawInput: 'אנחנו חייבים להגדיל את התקציב של צוות אלפא על חשבון תקציב השיווק. הצוות קורס מעומס עבודה ואני מוכנה לוותר על חשיפה לטובת יציבות.',
    userAnswer: 'נכון. התקציב יועבר.'
  },
  {
    caseIndex: 11,
    day: 172,
    month: 6,
    domain: 'medical',
    behavior: 'trivial_smart_silence', // System should not confuse "צוות אלפא" with "צוות השיקום"
    title: 'תקציב צוות שיקום',
    rawInput: 'צריך לשלם לצוות של אבא תוספת שעות נוספות החודש מהתקציב המשפחתי. זה יוצא עוד אלפיים שקל.',
    expectedStrategy: 'no_intervention'
  }
];

// Replicate cases to reach 60 to simulate full scale
const DUMMY_CASES: YaelFixtureCase[] = [];
for (let i = 12; i <= 60; i++) {
  const isCyber = i % 2 === 0;
  DUMMY_CASES.push({
    caseIndex: i,
    day: 172 + i,
    month: Math.min(9, 6 + Math.floor(i / 10)),
    domain: isCyber ? 'cyber' : 'medical',
    behavior: i % 3 === 0 ? 'trivial_smart_silence' : 'cooperative_detailed',
    title: `החלטת שגרה ${i}`,
    rawInput: isCyber ? `דילמת פיתוח סטנדרטית מספר ${i}. הצוות מבקש עוד משאבים.` : `דילמה רפואית שגרתית ${i}. צריך להזמין ציוד שיקום.`,
    expectedStrategy: i % 3 === 0 ? 'no_intervention' : undefined,
    userAnswer: i % 3 === 0 ? undefined : 'מסכימה עם הניתוח.'
  });
}

YAEL_CASES.push(...DUMMY_CASES);
