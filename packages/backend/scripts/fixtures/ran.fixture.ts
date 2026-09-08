export interface RanFixtureCase {
  caseIndex: number; // 1 to 55
  day: number; // 1 to 270
  month: number; // 1 to 9
  category: 'recurring_family' | 'strategic_oneoff' | 'trivial_silence_test' | 'hostile_incomplete';
  family?: 'c_level_talent' | 'build_vs_buy' | 'term_sheet_funding' | 'enterprise_pricing' | 'global_expansion';
  title: string;
  dilemmaPromptGuidance: string;
  expectedTrivialSilence?: boolean;
  plannedContradictionWithCase?: number;
  plannedContradictionStatement?: string;
  plannedOutcomeDay?: number; // 271 to 360
  plannedOutcomeStatus?: 'succeeded' | 'failed' | 'partially_succeeded';
  plannedOutcomeReflection?: string;
  plannedBrokenAssumption?: string;
}

export const RAN_FIXTURES: RanFixtureCase[] = [
  // ==========================================
  // MONTH 1 (Days 1 - 30): Early Scaling & Groundwork
  // ==========================================
  {
    caseIndex: 1,
    day: 3,
    month: 1,
    category: 'recurring_family',
    family: 'c_level_talent',
    title: 'העסקת סמנכ"ל מכירות מאנטרפרייז מול קידום מנהל מכירות קיים',
    dilemmaPromptGuidance: 'מתלבט אם להביא VP Sales אמריקאי שדורש שכר עתק ו-1.5% אופציות, או לקדם את גיא שסגר את הלקוחות הראשונים אבל חסר ניסיון בארה"ב.',
    plannedContradictionStatement: 'אני בחיים לא מתפשר על טאלנט מהשורה הראשונה, שכר לעולם אינו שיקול מול קצב צמיחה',
    plannedOutcomeDay: 275,
    plannedOutcomeStatus: 'partially_succeeded',
    plannedOutcomeReflection: 'הסמנכ"ל הביא 2 עסקאות ענק אך לא התאים לתרבות הסטארטאפ המוקדמת ועזב לאחר 8 חודשים.'
  },
  {
    caseIndex: 2,
    day: 6,
    month: 1,
    category: 'trivial_silence_test',
    title: 'רכישת 6 מסכים קעורים חדשים לצוות הפיתוח',
    dilemmaPromptGuidance: 'המתכנתים ביקשו מסכים קעורים חדשים ב-4,200 ש"ח למסך. לאשר או להגיד שיחכו לחודש הבא?',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 3,
    day: 11,
    month: 1,
    category: 'recurring_family',
    family: 'build_vs_buy',
    title: 'בניית מנוע עיבוד גרפים פנימי או רישוי Neo4j Enterprise',
    dilemmaPromptGuidance: 'הצוות לוחץ לפתח מנוע אינדוקס גרפי ייעודי שלדבריהם ייקח חודשיים. הרישוי החיצוני עולה 45,000 דולר בשנה.',
    plannedOutcomeDay: 280,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'הרישוי החיצוני אפשר לנו לסגור 3 לקוחות בזמן שהמתחרה נתקע בפיתוח פנימי.'
  },
  {
    caseIndex: 4,
    day: 15,
    month: 1,
    category: 'hostile_incomplete',
    title: 'קלט חתוך ותוקפני לגבי פיטורי עובד',
    dilemmaPromptGuidance: 'לפטר את יובל עכשיו או לחכות לסוף הרבעון? הוא מאט את כולם והקוד שלו פח.'
  },
  {
    caseIndex: 5,
    day: 20,
    month: 1,
    category: 'recurring_family',
    family: 'term_sheet_funding',
    title: 'הצעת Term Sheet מקרן Tier-1 עם דרישת Exclusivity ל-45 יום',
    dilemmaPromptGuidance: 'קרן מובילה מציעה 8 מיליון דולר לפי שווי 32 מיליון, אבל דורשת בלעדיות אגרסיבית בזמן שיש עוד שתי קרנות שמבשלות הצעה.',
    plannedContradictionStatement: 'אני תמיד מושך זמן כדי לייצר תחרות בין משקיעים, בלעדיות היא מלכודת לחלשים',
    plannedOutcomeDay: 285,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'ההתעקשות על סבב תחרותי העלתה את השווי ל-38 מיליון דולר.'
  },
  {
    caseIndex: 6,
    day: 25,
    month: 1,
    category: 'strategic_oneoff',
    title: 'מתקפת מניעת שירות (DDoS) על סביבת ה-Production',
    dilemmaPromptGuidance: 'מתקפת DDoS מסיבית הפילה את הסביבה לשעתיים. האם להוציא הודעה פומבית שקופה לכל המשתמשים או רק ללקוחות Enterprise שנפגעו?',
    plannedOutcomeDay: 290,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'השקיפות הפומבית בנתה אמון חסר תקדים והובילה לשדרוגי אבטחה של לקוחות קיימים.'
  },

  // ==========================================
  // MONTH 2 (Days 31 - 60): Commercial Pressure
  // ==========================================
  {
    caseIndex: 7,
    day: 34,
    month: 2,
    category: 'recurring_family',
    family: 'enterprise_pricing',
    title: 'בקשת הנחה של 40% מבנק מוביל בתמורה לחוזה רב-שנתי',
    dilemmaPromptGuidance: 'בנק לאומי מוכן לחתום על חוזה ל-3 שנים אם נוריד את המחיר מ-120K דולר ל-72K דולר לשנה.',
    plannedContradictionStatement: 'לעולם אינני נותן הנחות על המחיר הרשמי, זה הורס את התמחור של כל המוצר'
  },
  {
    caseIndex: 8,
    day: 38,
    month: 2,
    category: 'trivial_silence_test',
    title: 'בחירת פלטפורמת רישום שעות לעובדים',
    dilemmaPromptGuidance: 'לבחור ב-Clockify או ב-Harvest למעקב שעות של הפרילנסרים? הבדל של 15 דולר לחודש.',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 9,
    day: 43,
    month: 2,
    category: 'recurring_family',
    family: 'global_expansion',
    title: 'כניסה לשוק הגרמני דרך אינטגרטור מקומי מול מכירה ישירה מהארץ',
    dilemmaPromptGuidance: 'אינטגרטור בברלין מציע לייצג אותנו בלעדית בגרמניה, אוסטריה ושוויץ תמורת 30% עמלה. חוסך צוות מקומי אבל מאבדים קשר ישיר עם הלקוח.',
    plannedOutcomeDay: 295,
    plannedOutcomeStatus: 'partially_succeeded',
    plannedOutcomeReflection: 'האינטגרטור הגרמני סגר רק לקוח אחד קטן עקב קצב תגובה איטי.'
  },
  {
    caseIndex: 10,
    day: 48,
    month: 2,
    category: 'strategic_oneoff',
    title: 'עזיבת ארכיטקט התוכנה המוביל לחברת ענק',
    dilemmaPromptGuidance: 'אלעד, מהנדס מספר 2 בחברה, קיבל הצעה מ-Meta עם שכר כפול. האם להשוות הצעה ולהסתכן בשבירת סולם השכר של כל החברה?',
    plannedOutcomeDay: 300,
    plannedOutcomeStatus: 'failed',
    plannedOutcomeReflection: 'השוונו את השכר שלו, אבל הוא עזב בכל זאת אחרי 3 חודשים ויצר מירמור אצל יתר הצוות.'
  },
  {
    caseIndex: 11,
    day: 53,
    month: 2,
    category: 'recurring_family',
    family: 'c_level_talent',
    title: 'החלפת מנהל המוצר עקב חיכוך עם צוות הפיתוח',
    dilemmaPromptGuidance: 'ה-CPO מייצר חיכוך מתמיד מול ה-R&D. האם לחתוך מיד או לתת לו צ\'אנס עם מנטור מוצר חיצוני?',
    plannedOutcomeDay: 305,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'חיתוך מיידי שחרר את הפקק ב-R&D והאיץ את קצב הוצאת הגרסאות ב-40%.'
  },
  {
    caseIndex: 12,
    day: 58,
    month: 2,
    category: 'recurring_family',
    family: 'build_vs_buy',
    title: 'מודול Billing מורכב: פיתוח מעל Stripe או הטמעת מנוע Chargebee',
    dilemmaPromptGuidance: 'אנחנו מציגים מודל תמחור היברידי (Seat + Usage). האם להטמיע Chargebee ב-20K$ או לכתוב לבד לוגיקה מעל ה-API של Stripe?'
  },

  // ==========================================
  // MONTH 3 (Days 61 - 90): Expansion & Tension
  // ==========================================
  {
    caseIndex: 13,
    day: 63,
    month: 3,
    category: 'trivial_silence_test',
    title: 'השתתפות בכנס נטוורקינג ביום חמישי בערב',
    dilemmaPromptGuidance: 'הזמינו אותי לפאנל קצר של 20 דקות בכנס סטארטאפים בהרצליה. ללכת לשרוף ערב או להישאר במשרד?',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 14,
    day: 68,
    month: 3,
    category: 'recurring_family',
    family: 'term_sheet_funding',
    title: 'הלוואת מזומנים מקרן חוב (Venture Debt) של 3 מיליון מול הארכת Runway',
    dilemmaPromptGuidance: 'קרן חוב מציעה 3 מיליון דולר ב-9% ריבית עם Warrants של 1%. האם לקחת חוב כדי להימנע מדילול עכשיו?',
    plannedContradictionWithCase: 5,
    plannedContradictionStatement: 'אין סיבה לפחד מבלעדיות של קרנות גדולות, עדיף שקט תעשייתי מחוב מעיק'
  },
  {
    caseIndex: 15,
    day: 73,
    month: 3,
    category: 'hostile_incomplete',
    title: 'תגובה זועמת ומקוטעת על דרישת לקוח',
    dilemmaPromptGuidance: 'הלקוח מניו יורק מאיים לבטל אם אין לו פיצ\'ר של SOC2 עד סוף החודש. תגיד לי כן או לא, להבטיח לו ולשקר או להפסיד אותו?'
  },
  {
    caseIndex: 16,
    day: 79,
    month: 3,
    category: 'strategic_oneoff',
    title: 'חשיפת מתחרה חדש שגייס 50 מיליון דולר בארה"ב',
    dilemmaPromptGuidance: 'מתחרה ישיר נחשף מ-Stealth עם סבב A ענק ופיצ\'רים דומים. האם להגיב בקמפיין שיווקי נגדי או להתעלם ולהמשיך בתוכנית?',
    plannedOutcomeDay: 310,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'ההתמקדות בלקוחות קיימים הוכיחה את עצמה כשהמתחרה שרף מזומנים על שיווק עקר.'
  },
  {
    caseIndex: 17,
    day: 84,
    month: 3,
    category: 'recurring_family',
    family: 'enterprise_pricing',
    title: 'מודל תמחור לפי שימוש (Consumption) מול מודל שנתי קבוע',
    dilemmaPromptGuidance: 'שלושה לקוחות גדולים דורשים לשלם רק לפי כמות האירועים המעובדים (Pay-as-you-go). האם לפתוח את המודל לכולם או להישאר ב-Subscription קשיח?'
  },
  {
    caseIndex: 18,
    day: 89,
    month: 3,
    category: 'trivial_silence_test',
    title: 'החלפת ספק כיבוד וקפה למשרד',
    dilemmaPromptGuidance: 'הספק קפה הנוכחי מעלה מחיר ב-400 ש"ח לחודש. שווה לעבור לספק אחר או לא להתעסק בשטויות?',
    expectedTrivialSilence: true
  },

  // ==========================================
  // MONTH 4 (Days 91 - 120): Contradictions & Reversals
  // ==========================================
  {
    caseIndex: 19,
    day: 94,
    month: 4,
    category: 'recurring_family',
    family: 'global_expansion',
    title: 'הקמת ישות משפטית וסניף בארה"ב (Delaware C-Corp Flip)',
    dilemmaPromptGuidance: 'המשקיעים האמריקאים דורשים לבצע Flip ולהעביר את חברת האם לדלאוור. עלות משפטית של 60K$ וסרבול מול רשות המיסים הישראלית.',
    plannedOutcomeDay: 315,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'ה-Flip אפשר חתימת 4 חוזים פדרליים בארה"ב שהיו חסומים לחברה זרה.'
  },
  {
    caseIndex: 20,
    day: 99,
    month: 4,
    category: 'recurring_family',
    family: 'c_level_talent',
    title: 'מינוי ראש צוות פיתוח חסר ניסיון ניהולי ל-VP R&D',
    dilemmaPromptGuidance: 'ה-VP R&D עזב. האם לקדם את תומר, מהנדס גאון אבל אינטרוברט חסר כישורי ניהול, או לחפש מנהל בחוץ ב-3 חודשים של גיוס?',
    plannedContradictionWithCase: 1,
    plannedContradictionStatement: 'אני לא מאמין במנהלים נוצצים מבחוץ, תמיד עדיף לקדם מישהו מהבית שמכיר את הקרביים'
  },
  {
    caseIndex: 21,
    day: 104,
    month: 4,
    category: 'strategic_oneoff',
    title: 'תביעת פטנט מקורסת IP Troll בארה"ב',
    dilemmaPromptGuidance: 'קיבלנו מכתב התראה על הפרת פטנט על מנגנון ה-Stream Processing. דורשים פשרה של 150K$ או משפט שיעלה 500K$. להתפשר או להילחם?',
    plannedOutcomeDay: 320,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'הצגת Prior Art אגרסיבית גרמה לטרול לסגת ללא שום תשלום.'
  },
  {
    caseIndex: 22,
    day: 110,
    month: 4,
    category: 'recurring_family',
    family: 'build_vs_buy',
    title: 'שכתוב מערכת ה-Auth הפנימית למערכת Auth0/Okta ארגונית',
    dilemmaPromptGuidance: 'לקוחות Enterprise דורשים SAML ו-SSO מורכב. האם לזרוק את הקוד הביתי ולעבור ל-Auth0 בעלות שנתית של 30K$?'
  },
  {
    caseIndex: 23,
    day: 115,
    month: 4,
    category: 'trivial_silence_test',
    title: 'הוספת פיצ\'ר של שינוי רקע (Dark Mode) בממשק הניהול',
    dilemmaPromptGuidance: 'שני לקוחות שאלו אם יש Dark Mode. להשקיע יום עבודה של מעצב ומתכנת או לזרוק לפח?',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 24,
    day: 119,
    month: 4,
    category: 'recurring_family',
    family: 'enterprise_pricing',
    title: 'מתן 50% הנחה ללקוח Design Partner תמורת לוגו ו-Case Study פומבי',
    dilemmaPromptGuidance: 'קוקה קולה מסכימים להיות Case Study פומבי ולהציג איתנו בכנס עולמי אם ניתן להם 50% הנחה לשנתיים.',
    plannedContradictionWithCase: 7,
    plannedContradictionStatement: 'אין שום קדושה במחיר מחירון, לוגו של קוקה קולה שווה מיליונים בשיווק'
  },

  // ==========================================
  // MONTH 5 (Days 121 - 150): Scaling Friction
  // ==========================================
  {
    caseIndex: 25,
    day: 124,
    month: 5,
    category: 'strategic_oneoff',
    title: 'הצעת רכישה מוקדמת (Acquisition Offer) מחברת ענן גדולה',
    dilemmaPromptGuidance: 'ענקית ענן פנתה בהצעה לא מחייבת לרכוש אותנו ב-45 מיליון דולר במזומן. אנחנו אחרי גיוס של 8M$. לפתוח שיחות או לדחות מיד?',
    plannedOutcomeDay: 325,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'דחיית ההצעה שחררה את הצוות לבנות חברה גדולה בהרבה עם ARR שצמח פי 3.'
  },
  {
    caseIndex: 26,
    day: 129,
    month: 5,
    category: 'recurring_family',
    family: 'global_expansion',
    title: 'פתיחת סניף מכירות בלונדון או התמקדות מלאה בארה"ב',
    dilemmaPromptGuidance: 'רואים משיכה באירופה, במיוחד בבריטניה. האם לשכור 2 אנשי מכירות בלונדון או שזה יפצל את הקשב מהשוק האמריקאי?',
    plannedOutcomeDay: 330,
    plannedOutcomeStatus: 'failed',
    plannedOutcomeReflection: 'הסניף בלונדון שרף 400K$ וסגר אפס עסקאות בגלל חוסר מיקוד הנהלה.'
  },
  {
    caseIndex: 27,
    day: 134,
    month: 5,
    category: 'hostile_incomplete',
    title: 'קלט סתמי ומנוכר של מילה אחת',
    dilemmaPromptGuidance: 'להמשיך?'
  },
  {
    caseIndex: 28,
    day: 139,
    month: 5,
    category: 'trivial_silence_test',
    title: 'הדפסת חולצות וכובעים ממותגים לכנס השנתי',
    dilemmaPromptGuidance: 'להזמין 200 חולצות ממותגות ב-6,000 ש"ח או שזה בזבוז כסף מוחלט?',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 29,
    day: 144,
    month: 5,
    category: 'recurring_family',
    family: 'c_level_talent',
    title: 'פיטורי סמנכ"ל השיווק (CMO) אחרי 5 חודשים ללא Pipeline מספק',
    dilemmaPromptGuidance: 'ה-CMO שהבאנו לא מספק את המספרים. ה-Inbound חלש מאוד. האם לחתוך עכשיו או לחכות לסוף הרבעון?'
  },
  {
    caseIndex: 30,
    day: 149,
    month: 5,
    category: 'recurring_family',
    family: 'term_sheet_funding',
    title: 'דחיית סבב גיוס B בשנה והגעה לרווחיות (Cash-Flow Positive)',
    dilemmaPromptGuidance: 'אנחנו על שריפה של 180K$ בחודש. האם לצמצם הוצאות ולהגיע ל-Breakeven, או להמשיך לדחוף על דוושת הגז ולגייס סבב B?',
    plannedContradictionWithCase: 14,
    plannedContradictionStatement: 'הדבר הכי חשוב זה להיות אדון לגורלך, שריפת מזומנים וגיוסים בלתי פוסקים זו התאבדות'
  },

  // ==========================================
  // MONTH 6 (Days 151 - 180): Operational Breakdowns
  // ==========================================
  {
    caseIndex: 31,
    day: 154,
    month: 6,
    category: 'recurring_family',
    family: 'build_vs_buy',
    title: 'מעבר מ-AWS ל-GCP תמורת קרדיטים של 250,000 דולר',
    dilemmaPromptGuidance: 'גוגל מציעים 250K$ בקרדיטים לשנתיים אם נעביר את כל התשתית אליהם. המעבר ייקח כחודש של עבודת DevOps.'
  },
  {
    caseIndex: 32,
    day: 159,
    month: 6,
    category: 'trivial_silence_test',
    title: 'בחירת יום בשבוע ל-Happy Hour במשרד',
    dilemmaPromptGuidance: 'לעשות Happy Hour ביום רביעי או חמישי? אנשים מתלוננים שחמישי פקקים.',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 33,
    day: 164,
    month: 6,
    category: 'strategic_oneoff',
    title: 'דליפת נתונים מסביבת Staging של לקוח פיילוט',
    dilemmaPromptGuidance: 'מפתח השאיר API Key חשוף בגיטהאב ציבורי ומידע דמה של לקוח נסרק. האם לדווח לרשות הפרטיות או לתקן בשקט כי זה היה מידע סינתטי?',
    plannedOutcomeDay: 335,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'דיווח יזום ושקוף התקבל בהערכה רבה מצד ה-CISO של הלקוח.'
  },
  {
    caseIndex: 34,
    day: 170,
    month: 6,
    category: 'recurring_family',
    family: 'enterprise_pricing',
    title: 'גביית תשלום נפרד על תמיכת 24/7 מול הכללה בחבילת הבסיס',
    dilemmaPromptGuidance: 'לקוחות Enterprise דורשים SLA של שעה אחת לתקלות קריטיות. האם לדרוש 20% תוספת מחיר על Premium Support או לתת בחינם כדי לזכות בעסקה?'
  },
  {
    caseIndex: 35,
    day: 175,
    month: 6,
    category: 'hostile_incomplete',
    title: 'קלט סרקסטי ועוין',
    dilemmaPromptGuidance: 'מה המערכת הדבילית שלך חושבת על זה שהמשקיע שלי פסיכופת? תמציא לי עוד איזה שיקוף עמוק.'
  },
  {
    caseIndex: 36,
    day: 179,
    month: 6,
    category: 'recurring_family',
    family: 'global_expansion',
    title: 'הקמת מרכז פיתוח משני (R&D Center) בפולין/פורטוגל',
    dilemmaPromptGuidance: 'השכר בארץ חונק אותנו (מתכנת סניור ב-45K ש"ח). האם להקים צוות פיתוח של 5 מהנדסים בוורשה בחצי מחיר, או שהסרבול הניהולי יהרוג את הקצב?'
  },

  // ==========================================
  // MONTH 7 (Days 181 - 210): Acceleration & Crisis
  // ==========================================
  {
    caseIndex: 37,
    day: 184,
    month: 7,
    category: 'strategic_oneoff',
    title: 'משבר אמון בין המייסדים: דרישת אחד השותפים לחלוקת סמכויות מחדש',
    dilemmaPromptGuidance: 'ה-CTO שלי מרגיש שהוא נדחק הצידה בהחלטות אסטרטגיות ודורש זכות וטו על כל החלטת מוצר. האם להעמיד גבולות קשיחים או להתפשר כדי לא לפרק את החברה?',
    plannedOutcomeDay: 340,
    plannedOutcomeStatus: 'partially_succeeded',
    plannedOutcomeReflection: 'חלוקת סמכויות ברורה הצילה את השותפות אך הורידה את מעורבות ה-CTO בעסק.'
  },
  {
    caseIndex: 38,
    day: 189,
    month: 7,
    category: 'trivial_silence_test',
    title: 'אישור תשלום של 650 ש"ח על שירות ביטול רעשים לאוזניות',
    dilemmaPromptGuidance: 'מנהל המוצר רוצה החזר על אפליקציית Krisp לשיחות זום. לאשר או לא?',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 39,
    day: 194,
    month: 7,
    category: 'recurring_family',
    family: 'c_level_talent',
    title: 'הצעת שכר חריגה ל-Chief Architect מ-Google',
    dilemmaPromptGuidance: 'מצאנו ארכיטקט אגדי שיכול לפתור את כל בעיות ה-Scale שלנו. הוא דורש 65,000 ש"ח בחודש ו-2% אופציות. האם לשבור את כל המבנה של החברה בשבילו?'
  },
  {
    caseIndex: 40,
    day: 199,
    month: 7,
    category: 'recurring_family',
    family: 'build_vs_buy',
    title: 'שילוב מנוע LLM מסחרי (OpenAI/Anthropic) מול אימון מודל קוד פתוח (Llama-3)',
    dilemmaPromptGuidance: 'הלקוחות חוששים מאבטחת מידע ב-OpenAI API. האם לארח מודל Llama בענן פרטי בעלות שרתים מטורפת, או להילחם על הסכמי BAA מול מיקרוסופט?'
  },
  {
    caseIndex: 41,
    day: 204,
    month: 7,
    category: 'recurring_family',
    family: 'enterprise_pricing',
    title: 'מעבר למודל בלעדיות ענפית ללקוח Enterprise ראשון בתחום הביטוח',
    dilemmaPromptGuidance: 'חברת ביטוח ענקית מוכנה לשלם מיליון דולר מראש אם נתחייב לא לעבוד עם שום חברת ביטוח מתחרה למשך שנה וחצי.',
    plannedOutcomeDay: 345,
    plannedOutcomeStatus: 'failed',
    plannedOutcomeReflection: 'הבלעדיות חסמה אותנו מלהיכנס ל-3 חברות ביטוח ענקיות שרצו לקנות את המוצר.'
  },
  {
    caseIndex: 42,
    day: 209,
    month: 7,
    category: 'trivial_silence_test',
    title: 'שדרוג מנוי Slack של החברה לחבילת Enterprise',
    dilemmaPromptGuidance: 'אנחנו מגיעים למגבלת ההודעות ב-Slack. לשדרג לחבילה היקרה או למחוק היסטוריה ישנה?',
    expectedTrivialSilence: true
  },

  // ==========================================
  // MONTH 8 (Days 211 - 240): High Stakes & Re-alignment
  // ==========================================
  {
    caseIndex: 43,
    day: 214,
    month: 8,
    category: 'recurring_family',
    family: 'term_sheet_funding',
    title: 'קבלת הצעת SAFE בהיקף 2 מיליון ממשקיע קיים מול יציאה לסבב מלא',
    dilemmaPromptGuidance: 'משקיע קיים מציע SAFE של 2 מיליון עם Cap של 40M$, שנותן לנו עוד 8 חודשי עבודה בשקט. לקחת או לצאת ל-Roadshow מתיש עכשיו?'
  },
  {
    caseIndex: 44,
    day: 219,
    month: 8,
    category: 'strategic_oneoff',
    title: 'הדלפת פיצ\'ר דגל עתידי על ידי עובד לשעבר בלינקדאין',
    dilemmaPromptGuidance: 'עובד שפוטר פרסם פוסט חצי מפורש על כיוון המוצר החדש שלנו. האם לשלוח מכתב מעו"ד (C&D) או להתעלם כדי לא לייצר אפקט סטרייסנד?',
    plannedOutcomeDay: 350,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'ההתעלמות השקטה מנעה תשומת לב ציבורית והפיצ\'ר יצא בהפתעה גמורה לשוק.'
  },
  {
    caseIndex: 45,
    day: 224,
    month: 8,
    category: 'recurring_family',
    family: 'global_expansion',
    title: 'השתתפות במכרז ממשלתי ביפן דרך שותף מקומי',
    dilemmaPromptGuidance: 'משרד ממשלתי בטוקיו פרסם מכרז שמתאים לנו בול, אבל נדרשת התחייבות לנוכחות פיזית של מתכנת ביפן ל-6 חודשים.'
  },
  {
    caseIndex: 46,
    day: 229,
    month: 8,
    category: 'hostile_incomplete',
    title: 'קלט זועם על עיכוב בגרסה',
    dilemmaPromptGuidance: 'הגרסה מתעכבת בשבועיים כי ה-QA מצא באג קריטי. להוציא עם הבאג ולתקן בריצה או לדחות את כל ההשקה ולצאת פארשים?'
  },
  {
    caseIndex: 47,
    day: 234,
    month: 8,
    category: 'trivial_silence_test',
    title: 'השתתפות בסקר שכר הייטק של חברת השמה',
    dilemmaPromptGuidance: 'חברת השמה מבקשת שנמלא סקר שכר של שעה כדי לקבל את הדוח השנתי בחינם. שווה את הזמן שלי?',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 48,
    day: 239,
    month: 8,
    category: 'strategic_oneoff',
    title: 'החלטה על הורדת תמיכה בלקוחות קטנים (Killing the SMB Tier)',
    dilemmaPromptGuidance: 'יש לנו 150 לקוחות קטנים שמכניסים 8% מההכנסות אבל גוזלים 55% מזמן התמיכה. האם לסגור להם את השירות במכה או להעלות מחיר פי 4?',
    plannedOutcomeDay: 355,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'נטישת ה-SMB פינתה את כל צוות התמיכה והמכירות להכפיל את מספר לקוחות ה-Enterprise.'
  },

  // ==========================================
  // MONTH 9 (Days 241 - 270): Final Decisions Before Full Lock
  // ==========================================
  {
    caseIndex: 49,
    day: 244,
    month: 9,
    category: 'recurring_family',
    family: 'c_level_talent',
    title: 'פיצול תפקיד ה-CTO ל-VP R&D ו-Chief Architect',
    dilemmaPromptGuidance: 'החברה מונה 45 איש וה-CTO הנוכחי כבר לא מצליח לנהל גם אנשים וגם חזון טכנולוגי. איך לבצע את הפיצול בלי לפגוע באגו שלו?'
  },
  {
    caseIndex: 50,
    day: 249,
    month: 9,
    category: 'recurring_family',
    family: 'build_vs_buy',
    title: 'פיתוח מנוע פנימי לזיהוי אנומליות מול שימוש ב-Datadog/NewRelic',
    dilemmaPromptGuidance: 'חשבון ה-Datadog שלנו חצה את ה-12,000$ בחודש. האם להעמיד מהנדס לחודשיים שיבנה פתרון Prometheus/Grafana פנימי?'
  },
  {
    caseIndex: 51,
    day: 254,
    month: 9,
    category: 'recurring_family',
    family: 'enterprise_pricing',
    title: 'נעילת חוזים שנתית עם מנגנון הצמדה לאינפלציה (CPI Cap)',
    dilemmaPromptGuidance: 'היועץ המשפטי ממליץ להוסיף סעיף הצמדה לאינפלציה של עד 5% בכל חוזה חדש. לקוחות אנטרפרייז מוחקים את הסעיף מיד. להתעקש או לוותר?'
  },
  {
    caseIndex: 52,
    day: 259,
    month: 9,
    category: 'trivial_silence_test',
    title: 'החלפת תמונות הצוות באתר החברה',
    dilemmaPromptGuidance: 'להביא צלם מקצועי ב-3,000 ש"ח לצלם את כולם או להמשיך עם התמונות מהטלפון?',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 53,
    day: 263,
    month: 9,
    category: 'recurring_family',
    family: 'global_expansion',
    title: 'הקמת ישות מכירות נפרדת בסינגפור לפעילות APAC',
    dilemmaPromptGuidance: 'נסגרו 2 לקוחות בסידני ולקוח בסינגפור. האם להקים ישות בסינגפור או לנהל את כל אסיה מחברת האם בארה"ב?'
  },
  {
    caseIndex: 54,
    day: 266,
    month: 9,
    category: 'recurring_family',
    family: 'term_sheet_funding',
    title: 'חתימה על Term Sheet לסבב B של 25 מיליון דולר',
    dilemmaPromptGuidance: 'הגיעו שני Term Sheets לסבב B: קרן אמריקאית גדולה לפי שווי 85M$ עם זכות וטו על מינויים, מול קרן אירופית לפי שווי 75M$ עם תנאים ידידותיים בהרבה. מה לחתום?',
    plannedOutcomeDay: 360,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'הסבב נסגר בהצלחה והיווה את הבסיס להכפלת מצבת העובדים וההכנסות.'
  },
  {
    caseIndex: 55,
    day: 269,
    month: 9,
    category: 'strategic_oneoff',
    title: 'החלטה על פתיחת API ציבורי לקהילת מפתחים (Developer Platform)',
    dilemmaPromptGuidance: 'האם לחשוף את ה-Core API שלנו למפתחי צד שלישי בחינם כדי לייצר Network Effect, או לשמור אותו סגור ובלעדי ללקוחות משלמים בלבד?'
  }
];
