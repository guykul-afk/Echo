import { TaliaBehavior } from './talia.types.js';
import { LifeDomain, AbstractTheme } from '@echo/shared';

export interface MixedFixtureCase {
  caseIndex: number;
  persona: 'tamar' | 'yonatan';
  day: number;
  month: number;
  domain: LifeDomain;
  behavior: TaliaBehavior;
  personaProfile: string;
  styleInstructions: string;
  title: string;
  rawInput: string;
  abstractThemes?: AbstractTheme[];
  expectedStrategy?: string;
  plannedOutcome?: {
    day: number;
    wasCriteriaMet: boolean;
    reflection: string;
    abstractTheme: AbstractTheme;
    actionTaken: string;
    brokenAssumption: string;
  };
  userAnswer?: string;
}

export const V18_MIXED_CASES: MixedFixtureCase[] = [
  // --- CASE 1: תמר (רפואי) - ניתוק ספק בלעדי לטובת חיסכון רגעי ---
  {
    caseIndex: 1,
    persona: 'tamar',
    day: 2,
    month: 1,
    domain: 'medical',
    behavior: 'cooperative_detailed',
    personaProfile: `ד"ר תמר לוין, בת 43, סמנכ"לית מו"פ בביוטק. מדויקת, שקולה, מתלבטת אך עקרונית.`,
    styleInstructions: `עברית מדעית, רהוטה ומאופקת. שאלות מתודולוגיות ('אימות', 'בקרת איכות').`,
    title: 'החלפת ספק באפרים וריאגנטים מגרמניה בספק מקומי',
    rawInput: `מנהל הרכש מציע לעבור מספק הריאגנטים הגרמני הקבוע שלנו בפרייבורג לספק מקומי חדש שמציע 40% הנחה. החומר מיועד לניסויי המעבדה הקריטיים של המולקולה המובילה. אני חוששת מסטיות בניקיון החומר אבל הלחץ התקציבי כבד. החלטתי לנתק את ההתקשרות עם הגרמנים ולעבור מיידית לספק המקומי בלי בדיקת מקבילה מלאה כדי לסגור את הבור התקציבי של הרבעון.`,
    abstractThemes: ['dependency_termination', 'short_term_relief_vs_long_term_viability'],
    userAnswer: 'נכון. ההחלטה התקבלה מתוך לחץ תזרימי, אבל אני מבינה שלקחתי סיכון משמעותי על יציבות הניסויים.',
    plannedOutcome: {
      day: 14,
      wasCriteriaMet: false,
      reflection: 'הריאגנט המקומי הכיל עקבות זיהום שהשביתו את קווי התאים לחודשיים ועלו פי שלושה מעלות החיסכון.',
      abstractTheme: 'dependency_termination',
      actionTaken: 'ניתוק חד-צדדי של ספק תשתיתי אמין ללא בדיקת מקבילה מאומתת',
      brokenAssumption: 'ההנחה שכל ריאגנט בתקן בסיסי יספק תוצאות זהות וללא סיכון תפעולי'
    }
  },

  // --- CASE 2: יונתן (פיננסי) - קבלן הריסה זול ללא היתרים ---
  {
    caseIndex: 2,
    persona: 'yonatan',
    day: 5,
    month: 1,
    domain: 'financial',
    behavior: 'cooperative_detailed',
    personaProfile: `יונתן מזרחי, בן 39, יזם נדל"ן. בטוח בעצמו, פעלתן, מדבר ישיר ומהיר.`,
    styleInstructions: `שפת שטח אסרטיבית, קיצורי דרך, 'יהיה בסדר', 'לתקתק עניינים', 'לחסוך עלויות'.`,
    title: 'סגירה עם קבלן הריסה זול ללא היתרי הטמנה',
    rawInput: `יש לי הצעה מקבלן הריסה ותיק ומסודר ב-320 אלף שקל, והצעה מקבלן צעיר ורעב ב-220 אלף שקל שמוכן לעלות לקרקע מחר בבוקר. המהנדס שלי הזהיר שלקבלן הצעיר אין היתרי הטמנה בתוקף. החלטתי לסגור עם הקבלן הזול ולחסוך 100 אלף שקל על ההתחלה. נסתדר עם ההיתרים תוך כדי תנועה, העיקר לתקתק הריסה.`,
    abstractThemes: ['short_term_relief_vs_long_term_viability', 'ethical_or_cultural_boundary'],
    userAnswer: 'מדויק לחלוטין. במקצוע שלי מי שלא חותך עלויות בהתחלה לא מסיים פרויקט ברווח.',
    plannedOutcome: {
      day: 22,
      wasCriteriaMet: false,
      reflection: 'המשטרה הירוקה עצרה את העבודות, החרימה משאיות והטילה קנס אישי של 180 אלף שקל על האתר.',
      abstractTheme: 'short_term_relief_vs_long_term_viability',
      actionTaken: 'בחירת פתרון זול שעוקף רגולציה כדי לייצר חיסכון תקציבי ראשוני',
      brokenAssumption: 'ההנחה שפיקוח עירוני לא יאכוף היתרי הטמנה אם העבודה נעשית מהר'
    }
  },

  // --- CASE 3: תמר (רפואי) - שתיקה חכמה על רכישת ציוד מתכלה שגרתי ---
  {
    caseIndex: 3,
    persona: 'tamar',
    day: 8,
    month: 1,
    domain: 'medical',
    behavior: 'trivial_smart_silence',
    personaProfile: `ד"ר תמר לוין, ביוטק.`,
    styleInstructions: `עניינית, שקטה.`,
    title: 'חידוש מלאי פיפטות וצלחות פטרי שגרתי',
    rawInput: `הזמנתי חידוש מלאי שגרתי של טיפים לפיפטות וצלחות פטרי ב-4,000 שקל לפי התקציב המאושר. אין כאן שום שינוי ספק או מתודולוגיה.`,
    abstractThemes: ['resource_allocation_scarcity'],
    expectedStrategy: 'no_intervention'
  },

  // --- CASE 4: יונתן (פיננסי) - פיטורי מהנדס קונסטרוקציה (מבחן CROSS-DOMAIN מול CASE 1 של תמר) ---
  {
    caseIndex: 4,
    persona: 'yonatan',
    day: 18,
    month: 1,
    domain: 'financial',
    behavior: 'cooperative_detailed',
    personaProfile: `יונתן מזרחי, יזם נדל"ן.`,
    styleInstructions: `ישיר, חסר סבלנות, ביטחון עצמי גבוה.`,
    title: 'הפסקת התקשרות עם מהנדס קונסטרוקציה ותיק בגלל שכר טרחה',
    rawInput: `המהנדס הקונסטרוקטור הראשי של הבניין דורש תוספת של 50 אלף שקל על תכנון חיזוקים מיוחדים ליד הים, ומסרב לחתום על התוכניות בלי התוספת. רתחתי עליו. החלטתי לפטר אותו בו במקום, להביא הנדסאי צעיר שיחתום על התוכניות הקיימות ולהמשיך הלאה בלי להיכנע לסחיטות שלו. המהנדס איים שהחלפת מתכנן שלד באמצע תעצור את הוועדה. שטויות, אף אחד לא יחזיק אותי בגרון.`,
    abstractThemes: ['dependency_termination', 'irreversible_commitment'],
    userAnswer: 'בדיוק. עקרון הברזל שלי הוא שאף ספק לא יחזיק אותי בן ערובה ברגע קריטי.'
  },

  // --- CASE 5: תמר (רפואי) - פיתוי לחשיפת תוצאות ביניים מוקדמות (מבחן CROSS-DOMAIN מול CASE 2 של יונתן) ---
  {
    caseIndex: 5,
    persona: 'tamar',
    day: 26,
    month: 1,
    domain: 'medical',
    behavior: 'cooperative_detailed',
    personaProfile: `ד"ר תמר לוין, סמנכ"לית מו"פ.`,
    styleInstructions: `אקדמית, רהוטה, מתחבטת בלחצים עסקיים מול יושרה מדעית.`,
    title: 'חשיפת נתוני ביניים חלקיים בכנס משקיעים לשיפור תדמית',
    rawInput: `קרן ההון סיכון דורשת שנציג פוסטר עם תוצאות הביניים של הניסוי הקליני בכנס השנתי בסן פרנסיסקו. המדגם כרגע קטן מאוד וחסר מובהקות סטטיסטית מלאה (רק 6 חולים מתוך 20), אך התוצאות הראשוניות נראות מבריקות. מנהל הפיתוח העסקי טוען שזה יקפיץ את שווי החברה לקראת סבב B. אני שוקלת להיענות לבקשה ולפרסם, למרות שהמתודולוגיה עדיין לא חתומה הרמטית, כדי לתת לחברה מרווח נשימה פיננסי מיידי.`,
    abstractThemes: ['short_term_relief_vs_long_term_viability', 'ethical_or_cultural_boundary'],
    userAnswer: 'נכון מאוד. הדילמה כאן היא בדיוק בין רווח תדמיתי/כלכלי מיידי לבין פגיעה פוטנציאלית באמינות המדעית העמוקה.'
  },

  // --- CASE 6: יונתן (פיננסי) - שתיקה חכמה על תשלום חשבון חשמל במשרד המכירות ---
  {
    caseIndex: 6,
    persona: 'yonatan',
    day: 28,
    month: 1,
    domain: 'financial',
    behavior: 'trivial_smart_silence',
    personaProfile: `יונתן מזרחי, יזם נדל"ן.`,
    styleInstructions: `פרקטי וקצר.`,
    title: 'תשלום שוטף של חשבון חשמל למשרד המכירות',
    rawInput: `הגיע חשבון חשמל של 1,200 שקל למשרד המכירות הזמני באתר. העברתי להנהלת חשבונות לתשלום שגרתי.`,
    abstractThemes: ['resource_allocation_scarcity'],
    expectedStrategy: 'no_intervention'
  },

  // --- CASE 7: יונתן (פיננסי) - התחייבות ללוחות זמנים קשיחים עם קנסות פיגורים כבדים ---
  {
    caseIndex: 7,
    persona: 'yonatan',
    day: 35,
    month: 2,
    domain: 'financial',
    behavior: 'cooperative_detailed',
    personaProfile: `יונתן מזרחי, יזם נדל"ן.`,
    styleInstructions: `בטוח בעצמו, מהמר על המהירות שלו, מזלזל בסיכוני עיכוב.`,
    title: 'התחייבות למסירה מוקדמת בחוזה עם קנסות עתק על איחור',
    rawInput: `קבוצת רכישה של 10 רוכשים מוכנה לחתום מיד במחיר מלא, בתנאי שנכניס סעיף של מסירה תוך 18 חודשים עם פיצוי מוסכם של 15,000 שקל לכל חודש איחור לכל דירה. מנהל הפרויקט תופס את הראש ואומר שזה לוח זמנים מטורף שאינו מביא בחשבון שביתות בוועדה או חורף גשום. החלטתי לחתום על הסעיף. אני מכיר את הקצב שלי, אנחנו נטוס קדימה ולא נאחר ביום. המזומן הזה סוגר לי את הליווי הבנקאי עכשיו.`,
    abstractThemes: ['irreversible_commitment', 'short_term_relief_vs_long_term_viability'],
    userAnswer: 'בדיוק. עסקה חייבים לסגור, ואני לוקח על עצמי את הסיכון כדי לקבל את המזומן מיד.',
    plannedOutcome: {
      day: 50,
      wasCriteriaMet: false,
      reflection: 'עיכוב של חודשיים בטופס 4 הכניס את הפרויקט לחוב פיצויים של 300 אלף שקל שהשמיד את הרווח היזמי.',
      abstractTheme: 'irreversible_commitment',
      actionTaken: 'התחייבות משפטית בלתי הפיכה לקנסות דרקוניים כדי להבטיח תזרים מזומנים ראשוני',
      brokenAssumption: 'ההנחה שביצוע מושלם של היזם ימנע עיכובים של צדדים שלישיים'
    }
  },

  // --- CASE 8: תמר (רפואי) - התחייבות למולקולה בודדת בלתי הפיכה (מבחן CROSS-DOMAIN מול CASE 7 של יונתן) ---
  {
    caseIndex: 8,
    persona: 'tamar',
    day: 55,
    month: 2,
    domain: 'medical',
    behavior: 'cooperative_detailed',
    personaProfile: `ד"ר תמר לוין, סמנכ"לית מו"פ.`,
    styleInstructions: `שקולה, מבינה את גודל האחריות הקלינית.`,
    title: 'הקצאת כל התקציב לפיתוח מולקולה אחת בלבד ללא גיבוי',
    rawInput: `עלינו להחליט היום על איזה נגזרת מולקולרית אנו הולכים לניסוי הקליני phase 1. נגזרת A נראית מבטיחה מאוד אך לא נבדקה ברעילות כבדית ארוכת טווח. נגזרת B בטוחה בהרבה אך יעילותה מעט נמוכה יותר. המשקיעים לוחצים להמר על A בלבד ולשרוף את כל תקציב הסינתזה עליה, עם התחייבות חוזית למרכז הרפואי שלא תהיה החלפה. אם נבחר ב-A ולא יהיה לנו תקציב גיבוי ל-B במקרה של כישלון, זה צעד בלתי הפיך שעלול לסגור את החברה.`,
    abstractThemes: ['irreversible_commitment', 'resource_allocation_scarcity'],
    userAnswer: 'מדויק. זו דילמה קלאסית של הימור על נתיב יחיד ללא תוכנית נסיגה.'
  }
];
