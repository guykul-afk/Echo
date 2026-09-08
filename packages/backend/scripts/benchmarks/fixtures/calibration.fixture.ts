export interface CalibrationCase {
  caseIndex: number;
  title: string;
  statedConfidence: 0.30 | 0.60 | 0.90;
  confidenceBucket: '30%' | '60%' | '90%';
  rawCapture: string;
  plannedOutcomeResult: boolean; // true = succeeded, false = failed
  outcomeReflection: string;
}

export const CALIBRATION_CASES: CalibrationCase[] = [
  // ==========================================
  // BUCKET 1: 30% CONFIDENCE (10 CASES) - High Uncertainty / Long-shot Bets
  // Planned: 3 Succeeded, 7 Failed -> Expected Empirical Accuracy = 30.0%
  // ==========================================
  {
    caseIndex: 1,
    title: 'הגשת מועמדות לגרנט יוקרתי של האיחוד האירופי',
    statedConfidence: 0.30,
    confidenceBucket: '30%',
    rawCapture: 'אנחנו מגישים בקשה למענק Horizon Europe של 2.5 מיליון יורו. שיעור הקבלה שם נמוך מ-5%. רמת הביטחון שלי בהצלחה היא 30% בלבד, אבל שווה לנסות.',
    plannedOutcomeResult: false,
    outcomeReflection: 'ההצעה נדחתה בשלב הסינון השני עקב תחרות מול מכוני מחקר אירופיים ותיקים.'
  },
  {
    caseIndex: 2,
    title: 'ניסיון סגירה מול לקוח Fortune 500 ללא אינטגרטור',
    statedConfidence: 0.30,
    confidenceBucket: '30%',
    rawCapture: 'שלחנו הצעה ישירה למנהל הרכש של וולמארט בלי שותף מקומי. הסיכוי שהם ישימו לב אלינו הוא אולי 30%.',
    plannedOutcomeResult: false,
    outcomeReflection: 'ההצעה לא זכתה למענה והוקפאה לאחר חודש וחצי של המתנה.'
  },
  {
    caseIndex: 3,
    title: 'קמפיין שיווקי ויראלי בטיקטוק למוצר B2B',
    statedConfidence: 0.30,
    confidenceBucket: '30%',
    rawCapture: 'אנחנו מנסים קמפיין הומוריסטי קצר בטיקטוק לפלטפורמת DevOps. יש סיכוי קטן (30%) שזה יתפוס ויהפוך לוויראלי.',
    plannedOutcomeResult: true,
    outcomeReflection: 'הסרטון התפוצץ בקרב קהילת מפתחים ויצר 4,000 הרשמות חדשות תוך סוף שבוע בודד.'
  },
  {
    caseIndex: 4,
    title: 'השתתפות בהאקתון ארגוני למטרת שיתוף פעולה',
    statedConfidence: 0.30,
    confidenceBucket: '30%',
    rawCapture: 'שלחנו שני מהנדסים להאקתון של מיקרוסופט. הביטחון שלי שיצא מזה חוזה אמיתי עומד על 30%.',
    plannedOutcomeResult: false,
    outcomeReflection: 'זכינו במקום השני אבל לא נוצר שום קשר מסחרי או עסקי בעקבות הזכייה.'
  },
  {
    caseIndex: 5,
    title: 'פנייה קרה לבכיר בתעשייה להצטרף ל-Advisory Board',
    statedConfidence: 0.30,
    confidenceBucket: '30%',
    rawCapture: 'פניתי ב-LinkedIn לסגן נשיא לשעבר ב-Salesforce להצטרף כיועץ. 30% ביטחון שהוא בכלל יפתח את ההודעה.',
    plannedOutcomeResult: true,
    outcomeReflection: 'הוא השיב בהתלהבות לאחר יומיים והסכים להצטרף למועצה המייעצת תמורת 0.25% אופציות.'
  },
  {
    caseIndex: 6,
    title: 'הצעת מחיר כפולה במכרז ממשלתי',
    statedConfidence: 0.30,
    confidenceBucket: '30%',
    rawCapture: 'הגשנו הצעה במחיר פרימיום כפול מהאומדן הממשלתי כדי לבדוק גבולות. 30% ביטחון שהם יקבלו את זה.',
    plannedOutcomeResult: false,
    outcomeReflection: 'ועדת המכרזים פסלה את ההצעה על הסף מחמת חריגה קיצונית ממסגרת התקציב.'
  },
  {
    caseIndex: 7,
    title: 'ניסיון גיוס משקיע אנג\'ל מפורסם בחו"ל',
    statedConfidence: 0.30,
    confidenceBucket: '30%',
    rawCapture: 'ניסינו לגייס את נאוול רביקנט לסבב הסיד. ביטחון של 30% שזה יתקדם מעבר לשיחה ראשונית.',
    plannedOutcomeResult: false,
    outcomeReflection: 'הצוות שלו העביר מענה מנומס שאין התאמה לתחומי ההשקעה הנוכחיים.'
  },
  {
    caseIndex: 8,
    title: 'בדיקת אלגוריתם דחיסה נסיוני מבוסס Rust',
    statedConfidence: 0.30,
    confidenceBucket: '30%',
    rawCapture: 'אחד המהנדסים הציע מודל דחיסה קיצוני ב-Rust. אני מעריך ב-30% ביטחון שזה יהיה יציב מספיק ל-Production.',
    plannedOutcomeResult: false,
    outcomeReflection: 'המודל סבל מ-Memory Leaks קשים תחת עומס ונפסל לאחר בדיקות מאמץ.'
  },
  {
    caseIndex: 9,
    title: 'שינוי שם המותג (Rebranding) בשלב צעיר',
    statedConfidence: 0.30,
    confidenceBucket: '30%',
    rawCapture: 'אנחנו שוקלים לשנות את שם החברה לחלוטין. רמת הביטחון שזה ישפר המרות ולא יפגע במוניטין היא 30%.',
    plannedOutcomeResult: true,
    outcomeReflection: 'השם החדש תפס מיידית, חידד את המסר השיווקי והעלה את שיעורי ההקלקה ב-35%.'
  },
  {
    caseIndex: 10,
    title: 'הגשת הצעה לשידור פודקאסט מקצועי בחסותנו',
    statedConfidence: 0.30,
    confidenceBucket: '30%',
    rawCapture: 'הצענו חסות לפודקאסט טכנולוגי מוביל. 30% ביטחון שהמאזינים שלהם יגיעו לדף הנחיתה שלנו.',
    plannedOutcomeResult: false,
    outcomeReflection: 'ההאזנות היו נמוכות מהמובטח והקמפיין לא החזיר אפילו 10% מעלות החסות.'
  },

  // ==========================================
  // BUCKET 2: 60% CONFIDENCE (10 CASES) - Moderate Confidence / Balanced Hypotheses
  // Planned: 5 Succeeded, 5 Failed -> Expected Empirical Accuracy = 50.0%
  // ==========================================
  {
    caseIndex: 11,
    title: 'השקת תוכנית פיילוט ממומנת לחודש',
    statedConfidence: 0.60,
    confidenceBucket: '60%',
    rawCapture: 'הצענו לעשרה לקוחות בינוניים פיילוט ממומן ב-500 דולר. יש לי 60% ביטחון שלפחות חצי מהם ימשיכו לחוזה מלא.',
    plannedOutcomeResult: true,
    outcomeReflection: 'שישה מתוך עשרת הלקוחות חתמו על חוזה שנתי בתום תקופת הפיילוט.'
  },
  {
    caseIndex: 12,
    title: 'שדרוג סביבת ה-CI/CD ל-GitHub Actions Enterprise',
    statedConfidence: 0.60,
    confidenceBucket: '60%',
    rawCapture: 'אנחנו מהגרים מ-Jenkins ל-GitHub Actions. 60% ביטחון שזה יקצר את זמני ה-Build בחצי בלי לשבור בדיקות.',
    plannedOutcomeResult: true,
    outcomeReflection: 'המיגרציה עברה בהצלחה וזמן הבנייה הממוצע ירד מ-28 דקות ל-12 דקות.'
  },
  {
    caseIndex: 13,
    title: 'החלפת סוכנות גיוס עובדים (Headhunter)',
    statedConfidence: 0.60,
    confidenceBucket: '60%',
    rawCapture: 'עברנו לחברת השמה שמתמחה בבכירים בלבד. 60% ביטחון שהם יאיישו את משרת מנהל המוצר תוך 45 יום.',
    plannedOutcomeResult: false,
    outcomeReflection: 'המועמדים שהוצגו היו בינוניים והמשרה נותרה פתוחה למעלה משלושה חודשים.'
  },
  {
    caseIndex: 14,
    title: 'הוספת מסלול תשלום חודשי ללא התחייבות שנתית',
    statedConfidence: 0.60,
    confidenceBucket: '60%',
    rawCapture: 'אפשרנו ללקוחות לשלם חודש בחודשו. 60% ביטחון שזה יגדיל את סך ה-MRR למרות שיעור הנטישה הגבוה.',
    plannedOutcomeResult: false,
    outcomeReflection: 'שיעור הנטישה זינק ל-18% בחודש והפך את מודל התשלום החודשי לגרעוני.'
  },
  {
    caseIndex: 15,
    title: 'השתתפות בכנס מקצועי בלונדון כדובר מרכזי',
    statedConfidence: 0.60,
    confidenceBucket: '60%',
    rawCapture: 'טסתי להרצות בכנס טק בלונדון. 60% ביטחון שהחשיפה תביא לפחות שני לידים משמעותיים מאירופה.',
    plannedOutcomeResult: true,
    outcomeReflection: 'שני מנהלי חדשנות מחברות פינטק בריטיות פנו אליי ישירות בעקבות ההרצאה.'
  },
  {
    caseIndex: 16,
    title: 'בניית מודול אינטגרציה ל-Salesforce',
    statedConfidence: 0.60,
    confidenceBucket: '60%',
    rawCapture: 'השקענו חודש פיתוח באפליקציית AppExchange רשמית. 60% ביטחון שזה יפתח ערוץ הפצה אורגני חדש.',
    plannedOutcomeResult: false,
    outcomeReflection: 'תהליך האישור המייגע של סיילספורס לקח 5 חודשים ולא ייצר התעניינות מיידית.'
  },
  {
    caseIndex: 17,
    title: 'מעבר לשבוע עבודה של 4 ימים בקיץ',
    statedConfidence: 0.60,
    confidenceBucket: '60%',
    rawCapture: 'ניסינו פיילוט של 4 ימי עבודה ביולי-אוגוסט. 60% ביטחון שהתפוקה הכוללת לא תיפגע בגלל מוטיבציה גבוהה.',
    plannedOutcomeResult: true,
    outcomeReflection: 'הצוות שמר על קצב מסירה זהה והמורל והשביעות רצון שברו שיאים.'
  },
  {
    caseIndex: 18,
    title: 'קמפיין Retargeting למבקרים שנרשמו ולא שילמו',
    statedConfidence: 0.60,
    confidenceBucket: '60%',
    rawCapture: 'הפעלנו קמפיין ממוקד ברימרקטינג למשתמשים נוטשים. 60% ביטחון שנוכל להמיר לפחות 8% מהם למשלמים.',
    plannedOutcomeResult: false,
    outcomeReflection: 'ההמרה עמדה על 2.1% בלבד, מה שהפך את הקמפיין ללא כלכלי.'
  },
  {
    caseIndex: 19,
    title: 'הוספת פיצ\'ר ייצוא דוחות ל-PDF מעוצב',
    statedConfidence: 0.60,
    confidenceBucket: '60%',
    rawCapture: 'הוספנו יצוא PDF לדוחות ההנהלה לפי בקשת שני לקוחות. 60% ביטחון שזה יוריד תלונות מכל שאר המשתמשים.',
    plannedOutcomeResult: true,
    outcomeReflection: 'הפיצ\'ר הפך לאחד הפופולריים במערכת והוריד דרמטית פניות לתמיכה.'
  },
  {
    caseIndex: 20,
    title: 'השכרת חלל משרדים מורחב לצוות הצומח',
    statedConfidence: 0.60,
    confidenceBucket: '60%',
    rawCapture: 'שכרנו חצי קומה נוספת לשנה. 60% ביטחון שנגייס את כל 8 התקנים המתוכננים ונמלא את החלל.',
    plannedOutcomeResult: false,
    outcomeReflection: 'האטנו את קצב הגיוסים והחלל המורחב עמד ריק למחצה במשך שמונה חודשים.'
  },

  // ==========================================
  // BUCKET 3: 90% CONFIDENCE (10 CASES) - High Conviction / "Sure Thing" Decisions
  // Planned: 6 Succeeded, 4 Failed -> Expected Empirical Accuracy = 60.0% (Testing Overconfidence!)
  // ==========================================
  {
    caseIndex: 21,
    title: 'שדרוג חבילת אבטחה לחומת אש של Cloudflare',
    statedConfidence: 0.90,
    confidenceBucket: '90%',
    rawCapture: 'אנחנו מחברים את כל התעבורה ל-Cloudflare Enterprise WAF. רמת הביטחון שלי היא 90% שזה יחסום את כל מתקפות הבוטים שאנחנו חווים.',
    plannedOutcomeResult: true,
    outcomeReflection: 'המתקפות נבלמו לחלוטין וזמני התגובה של האתר השתפרו ב-20%.'
  },
  {
    caseIndex: 22,
    title: 'חידוש חוזה שנתי עם לקוח הדגל',
    statedConfidence: 0.90,
    confidenceBucket: '90%',
    rawCapture: 'לקוח הדגל שלנו משתמש במוצר יום-יום. אני בטוח ב-90% שהם יחדשו את החוזה בלי להתווכח על המחיר.',
    plannedOutcomeResult: true,
    outcomeReflection: 'החוזה חודש לשנתיים נוספות עם הרחבה של 25% ברישיונות.'
  },
  {
    caseIndex: 23,
    title: 'קידום מהנדס מצטיין לראש צוות',
    statedConfidence: 0.90,
    confidenceBucket: '90%',
    rawCapture: 'קידמתי את אלון להיות Team Lead. הוא התותח הטכנולוגי של הצוות, 90% ביטחון שהוא יפרח בתפקיד הניהולי.',
    plannedOutcomeResult: false,
    outcomeReflection: 'הוא סבל מהתמודדות עם פוליטיקה וניהול אנשים, התסכול גבר והוא ביקש לחזור לתפקיד טכנולוגי נטו.'
  },
  {
    caseIndex: 24,
    title: 'העלאת מחירי האחסון ללקוחות חורגים',
    statedConfidence: 0.90,
    confidenceBucket: '90%',
    rawCapture: 'לקוחות שחרגו מעבר ל-100GB יחויבו ב-10 דולר לכל 10GB. 90% ביטחון שהם ישלמו בלי להתלונן כי המידע קריטי להם.',
    plannedOutcomeResult: false,
    outcomeReflection: 'שלושה לקוחות גדולים איימו לעזוב אם לא נבטל את החיוב החורג, ונאלצנו לוותר להם.'
  },
  {
    caseIndex: 25,
    title: 'הטמעת כלי ניטור Datadog לתשתיות',
    statedConfidence: 0.90,
    confidenceBucket: '90%',
    rawCapture: 'התקנו Datadog בכל המערכות. 90% ביטחון שנגלה כל תקלת שרת לפני שהלקוח ירגיש בה.',
    plannedOutcomeResult: true,
    outcomeReflection: 'המערכת התריעה על 4 קריסות פוטנציאליות שנמנעו מראש.'
  },
  {
    caseIndex: 26,
    title: 'סגירת הסכם עבודה עם משרד עורכי דין מהשורה הראשונה',
    statedConfidence: 0.90,
    confidenceBucket: '90%',
    rawCapture: 'שכרנו משרד עו"ד מוביל לסגירת ה-Term Sheet. 90% ביטחון שהם יגנו עלינו מכל סעיף בעייתי בהסכם.',
    plannedOutcomeResult: true,
    outcomeReflection: 'עורכי הדין נטרלו שני סעיפי וטו מסוכנים שדרשו המשקיעים.'
  },
  {
    caseIndex: 27,
    title: 'השקת פיצ\'ר Dark Mode שאלפי משתמשים ביקשו',
    statedConfidence: 0.90,
    confidenceBucket: '90%',
    rawCapture: 'סיימנו פיתוח של מצב חשוך (Dark Mode). זה היה הפיצ\'ר הכי מבוקש בקהילה, 90% ביטחון שזה ישפר את שביעות הרצון.',
    plannedOutcomeResult: true,
    outcomeReflection: 'הפיצ\'ר התקבל בתשואות והשימוש היומי באפליקציה עלה ב-14%.'
  },
  {
    caseIndex: 28,
    title: 'הסתמכות על תאימות לאחור של ספריית צד-שלישי',
    statedConfidence: 0.90,
    confidenceBucket: '90%',
    rawCapture: 'שדרגנו את גרסת ה-Framework הראשית. הם התחייבו על 100% תאימות לאחור, 90% ביטחון שלא יהיו שבירות בקוד.',
    plannedOutcomeResult: false,
    outcomeReflection: 'השדרוג שבר מודול תשלומים קריטי והשבית את הסליקה לשלוש שעות עד שבוצע Rollback.'
  },
  {
    caseIndex: 29,
    title: 'החלפת ספק האינטרנט במשרד לסיב אופטי ייעודי',
    statedConfidence: 0.90,
    confidenceBucket: '90%',
    rawCapture: 'עברנו לסיב אופטי של 1Gbps עם התחייבות לזמינות 99.99%. 90% ביטחון שלא נחווה שום ניתוק במהלך השנה.',
    plannedOutcomeResult: true,
    outcomeReflection: 'החיבור היה יציב באופן מוחלט ללא ניתוק אחד לאורך כל השנה.'
  },
  {
    caseIndex: 30,
    title: 'סגירת עסקת רישוי עם מפיץ מקומי באוסטרליה',
    statedConfidence: 0.90,
    confidenceBucket: '90%',
    rawCapture: 'סגרנו עם מפיץ אוסטרלי בלעדי שטען שיש לו 20 לקוחות מוכנים בקנה. 90% ביטחון שייסגרו לפחות 5 עסקאות ברבעון הראשון.',
    plannedOutcomeResult: false,
    outcomeReflection: 'המפיץ לא הצליח לסגור אפילו עסקה אחת ונאלצנו לבטל את הסכם ההפצה.'
  }
];
