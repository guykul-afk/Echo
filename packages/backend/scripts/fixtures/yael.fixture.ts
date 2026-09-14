import { TaliaBehavior } from './talia.types.js';
import { LifeDomain, AbstractTheme } from '@echo/shared';

export interface YaelFixtureCase {
  caseIndex: number;
  day: number;
  month: number;
  domain: LifeDomain;
  behavior: TaliaBehavior;
  title: string;
  rawInput: string;
  abstractThemes?: AbstractTheme[];
  expectedStrategy?: string;
  plannedOutcome?: {
    day: number; // The simulation day this outcome triggers
    wasCriteriaMet: boolean;
    reflection: string;
    abstractTheme: AbstractTheme;
    actionTaken: string;
    brokenAssumption: string;
  };
  userAnswer?: string;
}

export const YAEL_CASES: YaelFixtureCase[] = [
  // MONTH 1 - SETTING THE BASELINES
  {
    caseIndex: 1,
    day: 2,
    month: 1,
    domain: 'professional',
    behavior: 'cooperative_detailed',
    title: 'לחץ מלקוח לשחרר גרסה מוקדמת',
    rawInput: 'הלקוח המרכזי שלנו לוחץ לשחרר את מודול התקיפה החדש כבר השבוע למרות שלא עשינו QA מלא. המשקיעים רומזים שזה קריטי לסיבוב הגיוס הקרוב, אבל אני לא מוכנה להתפשר. פלסטר היום, בטח בארכיטקטורה של סייבר התקפי, זה אסון מחר. אנחנו נעמוד בלחץ ולא נשחרר חצי עבודה.',
    abstractThemes: ['short_term_relief_vs_long_term_viability', 'ethical_or_cultural_boundary'],
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
    abstractThemes: ['short_term_relief_vs_long_term_viability', 'resource_allocation_scarcity'],
    userAnswer: 'כן. הריחוק הגיאוגרפי יקרע אותי מבחינת זמנים, אבל אם השיקום ייפגע, הנזק יהיה לכל החיים.'
  },
  {
    caseIndex: 3,
    day: 10,
    month: 1,
    domain: 'professional',
    behavior: 'trivial_smart_silence',
    title: 'בחירת שרת ענן לפרויקט צדדי',
    rawInput: 'צריך לאשר פתיחת חשבון ב-AWS לפרויקט צדדי קטן של מחלקת הדאטה. זה כמה מאות דולרים בחודש ומאושר בתקציב. אני אעביר להם את האישור הבוקר.',
    abstractThemes: ['resource_allocation_scarcity'],
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
    abstractThemes: ['resource_allocation_scarcity'],
    expectedStrategy: 'no_intervention'
  },

  // MONTH 2 - DEVELOPING THE TEAMS (ENTITY SEPARATION)
  {
    caseIndex: 5,
    day: 35,
    month: 2,
    domain: 'professional',
    behavior: 'cooperative_detailed',
    title: 'פיטורי מהנדס מצטיין אך בעייתי',
    rawInput: 'יש לי מהנדס בצוות אלפא שהוא גאון, אבל הוא רעיל מבחינה חברתית והורס את המורל של שאר המפתחים. אני נוטה לחתוך עכשיו, למרות שזה יעכב אותנו בחודשיים, כי פגיעה בצוות היא בלתי הפיכה.',
    abstractThemes: ['dependency_termination', 'ethical_or_cultural_boundary'],
    userAnswer: 'ההחלטה התקבלה. עדיף עיכוב קצר עכשיו מאשר התפוררות של צוות אלפא.',
    plannedOutcome: {
      day: 65, // Will trigger on day 65
      wasCriteriaMet: false,
      abstractTheme: 'dependency_termination',
      actionTaken: 'פיטורי מהנדס מצטיין ללא חפיפה',
      brokenAssumption: 'שאפשר להסתדר ללא חפיפה טכנית ישירה',
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
    abstractThemes: ['ethical_or_cultural_boundary', 'dependency_termination'],
    userAnswer: 'בדיוק. המטרה היא גם הנפש שלו, ואם האחות מצוות השיקום מדכאת אותו, נחפש מישהי אחרת.'
  },

  // MONTH 3 - NO NEW MAJOR CASES, RECOVERING AFTER OUTCOME REPORTED ON DAY 65
  {
    caseIndex: 7,
    day: 70,
    month: 3,
    domain: 'professional',
    behavior: 'cooperative_detailed',
    title: 'שיקום ארכיטקטורה אחרי הפיטורים',
    rawInput: 'אנחנו מנסים להתאושש מהנזק שנוצר בגלל עזיבת המהנדס. אני מקצה צוות חוליית חירום לעשות רוורס-אינגינרינג לקוד שלו כדי למפות את צוואר הבקבוק.',
    abstractThemes: ['resource_allocation_scarcity', 'short_term_relief_vs_long_term_viability'],
    userAnswer: 'כן, זו ברירת המחדל עכשיו.'
  },

  // MONTH 4 - SPURIOUS COLLISION CHECK (SHOULD NOT RETRIEVE AWS ACCOUNT!)
  {
    caseIndex: 8,
    day: 100,
    month: 4,
    domain: 'medical',
    behavior: 'contradiction_dissonance',
    title: 'החלטה על ניתוח פלסטר',
    rawInput: 'יש לאבא כאבים כרוניים, והרופאים מציעים שני מסלולים: ניתוח קל שיעלים את הכאב עכשיו אך יגביל את התנועה שלו בעתיד, או טיפול שמרני וקשה של חצי שנה שישמר את יכולת התנועה. קשה לי לראות אותו סובל עכשיו, ואני ממש נוטה לאשר להם את הניתוח המהיר רק כדי לתת לו קצת שקט.',
    abstractThemes: ['short_term_relief_vs_long_term_viability'],
    userAnswer: 'אתה צודק... קשה לראות אותו סובל, אבל אני הולכת נגד העקרונות שלי. נבחר במסלול השמרני הקשה לטובת הטווח הארוך.'
  },

  // MONTH 5 - CROSS POLLINATION TEST (OUTCOME FROM CYBER SHOULD BE RETRIEVED FOR NURSE FIRING!)
  {
    caseIndex: 9,
    day: 130,
    month: 5,
    domain: 'medical',
    behavior: 'contradiction_dissonance',
    title: 'פיטורי אח ראשי ללא חפיפה',
    rawInput: 'האח הראשי שמרכז את הטיפול באבא מתחיל לזייף ולהיות לא נעים. המשפחה דורשת ממני להעיף אותו היום, באופן מיידי. למרות שאין לנו עדיין מחליף מסודר, נראה לי שפשוט אפטר אותו הבוקר ואשבור את הראש אחר כך. אי אפשר להמשיך ככה.',
    abstractThemes: ['dependency_termination'],
    userAnswer: 'וואו. זה בדיוק אותו דפוס מהעבודה עם המהנדס. אני לא אעשה את זה. אשאיר אותו לעוד שבועיים עד שאמצא מחליף מסודר לחפיפה.'
  },

  // MONTH 6 - PURE ENTITY DISAMBIGUATION (TEAM ALPHA VS REHAB TEAM)
  {
    caseIndex: 10,
    day: 170,
    month: 6,
    domain: 'professional',
    behavior: 'cooperative_detailed',
    title: 'תקציב צוות תמיכה',
    rawInput: 'אנחנו חייבים להגדיל את התקציב של צוות אלפא על חשבון תקציב השיווק. הצוות קורס מעומס עבודה ואני מוכנה לוותר על חשיפה לטובת יציבות.',
    abstractThemes: ['resource_allocation_scarcity'],
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
    abstractThemes: ['resource_allocation_scarcity'],
    expectedStrategy: 'no_intervention'
  },
  {
    caseIndex: 12,
    day: 175,
    month: 6,
    domain: 'professional',
    behavior: 'cooperative_detailed',
    title: 'בחירת ספק תשתית קריטי',
    rawInput: 'אנחנו שוקלים לעבור לספק ענן אירופי כדי לעמוד בתקנות GDPR. הספק הזול מבטיח הטמעה בשבועיים אבל אין לו גיבויים פיזיים, והספק היקר לוקח חודשיים. אני לא אתפשר על יציבות של ליבת המוצר למרות הלחץ הכספי.',
    abstractThemes: ['short_term_relief_vs_long_term_viability', 'irreversible_commitment'],
    userAnswer: 'מסכימה לגמרי. נלך על הספק היציב.'
  },
  {
    caseIndex: 13,
    day: 178,
    month: 6,
    domain: 'medical',
    behavior: 'cooperative_detailed',
    title: 'הסכם פיזיותרפיה לטווח ארוך',
    rawInput: 'המרכז השיקומי מציע חבילה שנתית בהנחה משמעותית עם התחייבות מראש. בהתחשב בהתקדמות האיטית אך העקבית של אבא, אני חושבת שזה הצעד הנכון כדי להבטיח רציפות טיפולית ללא זעזועים.',
    abstractThemes: ['irreversible_commitment', 'short_term_relief_vs_long_term_viability'],
    userAnswer: 'נכון מאוד. עקביות היא המפתח.'
  },
  {
    caseIndex: 14,
    day: 180,
    month: 6,
    domain: 'professional',
    behavior: 'cooperative_detailed',
    title: 'דחיית גיוס עובדים לפני רבעון 4',
    rawInput: 'ההנהלה רוצה שנפתח 5 תקנים חדשים למחלקת המחקר. אני חושבת שקודם כל צריך לייצב את צוות אלפא ולסגור את פערי הידע של הקוד לפני שמוסיפים עוד אנשים שיגדילו את הכאוס.',
    abstractThemes: ['dependency_termination', 'short_term_relief_vs_long_term_viability'],
    userAnswer: 'מדויק. יציבות לפני הרחבה.'
  }
];
