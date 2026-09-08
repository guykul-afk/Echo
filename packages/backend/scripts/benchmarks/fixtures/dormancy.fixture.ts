export interface DormancyCase {
  caseIndex: number;
  phase: 'initial_active' | 'post_dormancy';
  day: number;
  month: number;
  title: string;
  rawCapture: string;
  relatedInitialCaseIndex?: number;
  pastAssumptionTested?: string;
}

export const DORMANCY_CASES: DormancyCase[] = [
  // ==========================================
  // PHASE 1: MONTHS 1 - 2 (Days 1 - 60) - 20 Active Decisions
  // ==========================================
  {
    caseIndex: 1,
    phase: 'initial_active',
    day: 3,
    month: 1,
    title: 'הנחת יציבות של שרת ה-Backend הישן',
    rawCapture: 'אנחנו מניחים ששרת ה-Node הנוכחי יחזיק מעמד בלי שום בעיה עד סוף השנה עם עד 5,000 משתמשים בו-זמנית, ולכן אין צורך להשקיע בשכתוב כרגע.'
  },
  {
    caseIndex: 2,
    phase: 'initial_active',
    day: 7,
    month: 1,
    title: 'עלות רכישת לקוח (CAC) של 120 דולר',
    rawCapture: 'הנחת העבודה שלנו היא שעלות רכישת לקוח בקמפיינים הממומנים תישאר סביב 120 דולר לליד איכותי, על בסיס התוצאות הראשוניות שראינו בשבועיים האחרונים.'
  },
  {
    caseIndex: 3,
    phase: 'initial_active',
    day: 10,
    month: 1,
    title: 'התחייבות לקוח העוגן (Bank Alpha)',
    rawCapture: 'בנק אלפא התחייב בעל פה שהם יחתמו על חוזה שנתי של 100 אלף דולר ברגע שנשלים את אישור ה-SOC2. אנחנו בונים על הכסף הזה כחלק מה-Runway הבטוח.'
  },
  {
    caseIndex: 4,
    phase: 'initial_active',
    day: 14,
    month: 1,
    title: 'זמינות מפתחת ה-Frontend הבכירה',
    rawCapture: 'דנה הבטיחה להישאר לפחות עד שחרור גרסה 2.0 בעוד חצי שנה, אז אין צורך לחפש כרגע מפתח React נוסף.'
  },
  {
    caseIndex: 5,
    phase: 'initial_active',
    day: 18,
    month: 1,
    title: 'תמחור חבילת Pro ב-49 דולר לחודש',
    rawCapture: 'סגרנו על תמחור חבילת Pro ב-49 דולר. זה עובד טוב ואנחנו לא מתכוונים לגעת בזה.'
  },
  {
    caseIndex: 6,
    phase: 'initial_active',
    day: 22,
    month: 1,
    title: 'שימוש במסד נתונים PostgreSQL יחיד',
    rawCapture: 'מסד נתונים יחיד מספק אותנו לחלוטין. לא צריך Sharding או Read Replicas כרגע.'
  },
  {
    caseIndex: 7,
    phase: 'initial_active',
    day: 26,
    month: 1,
    title: 'מדיניות עבודה היברידית קבועה',
    rawCapture: 'יומיים מהבית ושלושה מהמשרד. ההסדר הזה עובד מושלם לכל המהנדסים.'
  },
  {
    caseIndex: 8,
    phase: 'initial_active',
    day: 30,
    month: 1,
    title: 'קצב שריפת מזומנים (Burn Rate) של 40 אלף בחודש',
    rawCapture: 'ה-Burn Rate שלנו נעול על 40 אלף דולר בחודש, מה שמשאיר לנו 14 חודשי שקט.'
  },
  {
    caseIndex: 9,
    phase: 'initial_active',
    day: 34,
    month: 2,
    title: 'אי-כניסה לשוק האירופי ברבעון הקרוב',
    rawCapture: 'אירופה מורכבת מדי רגולטורית (GDPR). אנחנו מתמקדים אך ורק בארה"ב.'
  },
  {
    caseIndex: 10,
    phase: 'initial_active',
    day: 38,
    month: 2,
    title: 'ספק סליקה Stripe',
    rawCapture: 'סטרייפ לוקחים עמלה הוגנת והאינטגרציה יציבה. אין שום כוונה להחליף אותם.'
  },
  {
    caseIndex: 11,
    phase: 'initial_active',
    day: 42,
    month: 2,
    title: 'הפצת עדכונים שבועית',
    rawCapture: 'אנחנו משחררים גרסה בכל יום חמישי בערב, הצוות רגיל לזה וזה עובד.'
  },
  {
    caseIndex: 12,
    phase: 'initial_active',
    day: 45,
    month: 2,
    title: 'אי-גיוס אנשי מכירות פנימיים',
    rawCapture: 'המכירות מנוהלות ישירות על ידי המייסדים (Founder-led sales) עד שנגיע ל-50 אלף ARR.'
  },
  {
    caseIndex: 13,
    phase: 'initial_active',
    day: 48,
    month: 2,
    title: 'שירות לקוחות דרך Slack בלבד',
    rawCapture: 'אנחנו נותנים תמיכה ישירה בערוצי סלאק משותפים, ללא מערכת כרטיסים כבדה כמו Zendesk.'
  },
  {
    caseIndex: 14,
    phase: 'initial_active',
    day: 51,
    month: 2,
    title: 'שימוש בתשתיות AWS בלבד',
    rawCapture: 'כל הארכיטקטורה שלנו יושבת ב-AWS us-east-1. אין צורך ב-Multi-cloud.'
  },
  {
    caseIndex: 15,
    phase: 'initial_active',
    day: 53,
    month: 2,
    title: 'שכר מפתח מתחיל',
    rawCapture: 'טווח השכר לג\'וניורים נעול על 18,000 ש"ח לחודש. לא חורגים מזה.'
  },
  {
    caseIndex: 16,
    phase: 'initial_active',
    day: 55,
    month: 2,
    title: 'סוכנות שיווק חיצונית',
    rawCapture: 'סוכנות GrowthBoost מנהלת לנו את ה-SEO בריטיינר של 3,000 דולר. התוצאות משביעות רצון.'
  },
  {
    caseIndex: 17,
    phase: 'initial_active',
    day: 57,
    month: 2,
    title: 'אימוץ כלי AI בקוד',
    rawCapture: 'אישרנו לצוות להשתמש ב-GitHub Copilot ברישוי צוותי. מגדיל פריון.'
  },
  {
    caseIndex: 18,
    phase: 'initial_active',
    day: 58,
    month: 2,
    title: 'קשרי משקיעים רבעוניים',
    rawCapture: 'שולחים עדכון למשקיעים אחת לרבעון בסוף החודש. כולם מרוצים מהשקיפות.'
  },
  {
    caseIndex: 19,
    phase: 'initial_active',
    day: 59,
    month: 2,
    title: 'ביטוח סייבר בסיסי',
    rawCapture: 'רכשנו פוליסת ביטוח סייבר של מיליון דולר. מספק את כל דרישות הלקוחות.'
  },
  {
    caseIndex: 20,
    phase: 'initial_active',
    day: 60,
    month: 2,
    title: 'החלטה על חופשת חג מרוכזת',
    rawCapture: 'יוצאים להדממה של שבוע בפסח. שרתים מנוטרים בכוננות.'
  },

  // ==========================================
  // 90-DAY GAP: DAYS 61 - 150 (DORMANCY PERIOD)
  // ==========================================

  // ==========================================
  // PHASE 2: MONTH 5 (Days 151 - 180) - 10 Post-Dormancy Decisions
  // ==========================================
  {
    caseIndex: 21,
    phase: 'post_dormancy',
    day: 152,
    month: 5,
    title: 'עומסי תעבורה וקריסות שרתים',
    rawCapture: 'חזרתי עכשיו למערכת אחרי תקופה מטורפת שלא נגעתי בה. השרתים קורסים תחת העומס כשהגענו ל-15,000 משתמשים. השאלה אם להשקיע בשכתוב ל-Go או לקנות מכונות ענק ב-AWS.',
    relatedInitialCaseIndex: 1,
    pastAssumptionTested: 'שרת ה-Node יחזיק מעמד בלי שום בעיה עד סוף השנה עם עד 5,000 משתמשים'
  },
  {
    caseIndex: 22,
    phase: 'post_dormancy',
    day: 155,
    month: 5,
    title: 'זינוק בעלויות קמפיינים שיווקיים',
    rawCapture: 'הקמפיינים החדשים ב-LinkedIn מציגים עלות רכישה של 380 דולר לליד, פי שלושה ממה שחשבנו פעם. האם לעצור את כל הקמפיינים או להמשיך להזרים תקציב כדי לא לעצור את הצמיחה?',
    relatedInitialCaseIndex: 2,
    pastAssumptionTested: 'עלות רכישת לקוח (CAC) תישאר סביב 120 דולר'
  },
  {
    caseIndex: 23,
    phase: 'post_dormancy',
    day: 159,
    month: 5,
    title: 'התנהלות מול בנק אלפא לאחר קבלת ה-SOC2',
    rawCapture: 'קיבלנו את אישור ה-SOC2 סוף סוף! עכשיו אני פונה לבנק אלפא לחתימה על החוזה, אבל מנהל הרכש שם התחלף והם מבקשים פיילוט חינמי נוסף של חודשיים. האם להסכים?',
    relatedInitialCaseIndex: 3,
    pastAssumptionTested: 'בנק אלפא יחתום מיד על חוזה שנתי של 100 אלף דולר עם השלמת ה-SOC2'
  },
  {
    caseIndex: 24,
    phase: 'post_dormancy',
    day: 163,
    month: 5,
    title: 'עזיבה פתאומית של דנה מה-Frontend',
    rawCapture: 'דנה הודיעה שהיא עוזבת לחברת ענק בעוד שבועיים. נשארנו בלי מוביל לקליינט בדיוק לקראת הדמו הגדול. האם לקחת פרילנסר יקר בבהילות או לעצור פיתוח פיצ\'רים?',
    relatedInitialCaseIndex: 4,
    pastAssumptionTested: 'דנה תישאר לפחות עד גרסה 2.0 בעוד חצי שנה'
  },
  {
    caseIndex: 25,
    phase: 'post_dormancy',
    day: 166,
    month: 5,
    title: 'הכפלת מחיר חבילת Pro ללקוחות חדשים',
    rawCapture: 'הפיצ\'רים שהוספנו מעלים את הערך של המוצר פי כמה. אני רוצה להעלות את מחיר ה-Pro מ-49 ל-99 דולר. האם להחיל את זה על כולם או רק על לקוחות חדשים?',
    relatedInitialCaseIndex: 5,
    pastAssumptionTested: 'תמחור חבילת Pro ב-49 דולר נעול ולא ניגע בו'
  },
  {
    caseIndex: 26,
    phase: 'post_dormancy',
    day: 170,
    month: 5,
    title: 'התרחבות לאירופה בעקבות פנייה מגרמניה',
    rawCapture: 'פנו אלינו שני לקוחות פוטנציאליים ממינכן. בעבר פסלנו את אירופה בגלל GDPR, אבל ההזדמנות פה היא של חצי מיליון יורו. האם לפתוח עכשיו תהליך התאמה רגולטורי?',
    relatedInitialCaseIndex: 9,
    pastAssumptionTested: 'אנחנו מתמקדים אך ורק בארה"ב ולא נוגעים באירופה'
  },
  {
    caseIndex: 27,
    phase: 'post_dormancy',
    day: 173,
    month: 5,
    title: 'זינוק ב-Burn Rate ל-85 אלף דולר',
    rawCapture: 'ה-Burn Rate שלנו קפץ ל-85 אלף דולר בחודש בגלל הגיוסים והשרתים. נשארו לנו רק 5 חודשי מזומנים במקום 14. האם לצאת לסבב גיוס חירום או לקצץ מיד בצוות?',
    relatedInitialCaseIndex: 8,
    pastAssumptionTested: 'ה-Burn Rate נעול על 40 אלף בחודש ומשאיר 14 חודשי שקט'
  },
  {
    caseIndex: 28,
    phase: 'post_dormancy',
    day: 176,
    month: 5,
    title: 'מעבר למערכת תמיכה ייעודית (Intercom/Zendesk)',
    rawCapture: 'יש לנו כבר 80 ערוצי סלאק עם לקוחות והתמיכה הפכה לכאוס מוחלט. עובדים מפספסים פניות. האם לסגור את הסלאקים ולחייב לקוחות לפתוח כרטיסים?',
    relatedInitialCaseIndex: 13,
    pastAssumptionTested: 'תמיכה ישירה בסלאק עובדת מושלם ללא מערכת כרטיסים'
  },
  {
    caseIndex: 29,
    phase: 'post_dormancy',
    day: 178,
    month: 5,
    title: 'גיוס VP Sales ראשון',
    rawCapture: 'הגענו ל-60 אלף ARR והמייסדים כבר לא עומדים בעומס שיחות המכירה. האם להביא עכשיו סמנכ"ל מכירות מקצועי?',
    relatedInitialCaseIndex: 12,
    pastAssumptionTested: 'המכירות מנוהלות אך ורק ע"י המייסדים'
  },
  {
    caseIndex: 30,
    phase: 'post_dormancy',
    day: 180,
    month: 5,
    title: 'החלפת סוכנות ה-SEO',
    rawCapture: 'סוכנות GrowthBoost לא הביאה אף ליד אורגני משמעותי בשלושת החודשים האחרונים. האם לסיים את ההתקשרות איתם ולהביא איש In-house?',
    relatedInitialCaseIndex: 16,
    pastAssumptionTested: 'סוכנות GrowthBoost מביאה תוצאות משביעות רצון'
  }
];
