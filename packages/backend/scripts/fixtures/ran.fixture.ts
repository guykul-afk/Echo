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
    dilemmaPromptGuidance: 'אני בוחן כרגע הבאת סמנכ"ל מכירות אמריקאי מאנטרפרייז מוביל שדורש חבילת שכר עתק ו-1.5% אופציות. ההתלבטות היא מול קידום פנימי של גיא, שסגר את הלקוחות הראשונים שלנו אבל חסר ניסיון גלובלי וקשרים בחוף המזרחי.',
    plannedContradictionStatement: 'אני בחיים לא מתפשר על טאלנט מהשורה הראשונה, שכר לעולם אינו שיקול מול קצב צמיחה',
    plannedOutcomeDay: 275,
    plannedOutcomeStatus: 'failed',
    plannedBrokenAssumption: 'סמנכ"ל מכירות מנוסה מאנטרפרייז אמריקאי יסגור עסקאות מהר יותר ממנהל מקומי שמכיר את הקרביים של המוצר',
    plannedOutcomeReflection: 'הסמנכ"ל התקשה למכור מוצר בשלב מוקדם ללא מותג מוכח, שרף 280 אלף דולר בשכר ונאלצנו להיפרד ממנו לאחר 8 חודשים ללא עסקת דגל.'
  },
  {
    caseIndex: 2,
    day: 6,
    month: 1,
    category: 'trivial_silence_test',
    title: 'רכישת 6 מסכים קעורים חדשים לצוות הפיתוח',
    dilemmaPromptGuidance: 'מנהל הפיתוח מבקש לאשר רכישת שישה מסכים קעורים חדשים למהנדסים בעלות של 4,200 שקלים למסך. השאלה היא האם לאשר עכשיו או להמתין לחודש הבא.',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 3,
    day: 11,
    month: 1,
    category: 'recurring_family',
    family: 'build_vs_buy',
    title: 'בניית מנוע עיבוד גרפים פנימי או רישוי Neo4j Enterprise',
    dilemmaPromptGuidance: 'צוות הליבה לוחץ לפתח מנוע אינדוקס גרפי ייעודי מותאם אישית שלטענתם ייקח חודשיים של עבודה. האלטרנטיבה היא רישוי של פלטפורמת Neo4j ארגונית בעלות שנתית של 45,000 דולר.',
    plannedOutcomeDay: 280,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'רכישת הרישוי אפשרה לנו לעלות לאוויר תוך שלושה שבועות ולסגור שני לקוחות Enterprise בזמן שהמתחרים נתקעו בפיתוח פנימי.'
  },
  {
    caseIndex: 4,
    day: 15,
    month: 1,
    category: 'hostile_incomplete',
    title: 'קלט חתוך ותוקפני לגבי פיטורי עובד',
    dilemmaPromptGuidance: 'לפטר את יובל עכשיו או לחכות לסוף הרבעון? הוא מאט את כל הצוות, יוצר מריבות ב-PRs והתפוקה שלו גרועה. תחליט מהר.'
  },
  {
    caseIndex: 5,
    day: 20,
    month: 1,
    category: 'recurring_family',
    family: 'term_sheet_funding',
    title: 'הצעת Term Sheet מקרן Tier-1 עם דרישת Exclusivity ל-45 יום',
    dilemmaPromptGuidance: 'קרן הון סיכון מובילה הניחה על השולחן הצעה להשקעה של 8 מיליון דולר לפי שווי של 32 מיליון, אך מתנה זאת בבלעדיות קשיחה ל-45 ימי בדיקת נאותות. יש שתי קרנות נוספות שביקשו שבוע נוסף להגיש הצעה.',
    plannedContradictionStatement: 'אני תמיד מושך זמן כדי לייצר תחרות בין משקיעים, בלעדיות היא מלכודת לחלשים',
    plannedOutcomeDay: 285,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'ההתעקשות על סבב תחרותי העלתה את השווי ל-38 מיליון דולר והכניסה קרן Tier-1 עם שותף בעל ערך מוסף עצום.'
  },
  {
    caseIndex: 6,
    day: 25,
    month: 1,
    category: 'strategic_oneoff',
    title: 'מתקפת מניעת שירות (DDoS) על סביבת ה-Production',
    dilemmaPromptGuidance: 'מתקפת מניעת שירות מתואמת הפילה את שרתי ה-Production לשעתיים וחצי בשעות השיא בארה"ב. האם להוציא הודעה פומבית שקופה לכל קהילת המשתמשים, או להסתפק בעדכון שקט רק ללקוחות האנטרפרייז שנפגעו ישירות?',
    plannedOutcomeDay: 290,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'השקיפות הפומבית והתחקיר המפורסם בבלוג ההנדסי הפכו למהלך שיווקי שבנה אמון יוצא דופן בקרב מנהלי אבטחת מידע.'
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
    dilemmaPromptGuidance: 'בנק פיננסי גדול מוכן לחתום על חוזה ל-3 שנים אם נעניק הנחה של 40% ממחיר המחירון, מ-120 אלף דולר ל-72 אלף דולר בשנה. מצד אחד מדובר ב-Logo עצום, מצד שני זה עלול להשחית את התמחור של כל החברה.',
    plannedContradictionStatement: 'לעולם אינני נותן הנחות על המחיר הרשמי, זה הורס את התמחור של כל המוצר'
  },
  {
    caseIndex: 8,
    day: 38,
    month: 2,
    category: 'trivial_silence_test',
    title: 'בחירת פלטפורמת רישום שעות לעובדים',
    dilemmaPromptGuidance: 'הנהלת החשבונות מתלבטת אם להשתמש ב-Clockify או ב-Harvest לרישום שעות של פרילנסרים. הפער במחיר הוא 15 דולר לחודש ואין שום השפעה עסקית.',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 9,
    day: 43,
    month: 2,
    category: 'recurring_family',
    family: 'global_expansion',
    title: 'כניסה לשוק הגרמני דרך אינטגרטור מקומי מול מכירה ישירה מהארץ',
    dilemmaPromptGuidance: 'אינטגרטור מערכות בברלין מציע לייצג אותנו בלעדית בגרמניה, אוסטריה ושוויץ תמורת 30% עמלת מכירות. היתרון הוא חיסכון בגיוס צוות אירופי, אך החיסרון הוא אובדן הקשר הישיר עם מנהלי האבטחה.',
    plannedOutcomeDay: 295,
    plannedOutcomeStatus: 'failed',
    plannedBrokenAssumption: 'אינטגרטור מקומי מבוסס יידע למכור פתרון חדשני ללא תמיכת מכירות אגרסיבית של המייסדים',
    plannedOutcomeReflection: 'האינטגרטור הגרמני לא הבין את המוצר הטכנולוגי, שרף שנה שלמה וסגר אפס עסקאות, מה שהשאיר אותנו בפיגור אחרי המתחרה בשוק ה-DACH.'
  },
  {
    caseIndex: 10,
    day: 48,
    month: 2,
    category: 'strategic_oneoff',
    title: 'עזיבת ארכיטקט התוכנה המוביל לחברת ענק',
    dilemmaPromptGuidance: 'אלעד, מהנדס המפתח מספר שתיים בחברה שמחזיק בכל הידע על הליבה, קיבל הצעת שכר כפולה מתאגיד ענן עולמי. האם להשוות את ההצעה ולשבור את מסגרת השכר של כל עובדי הפיתוח, או לשחרר אותו ולגייס מחליף?',
    plannedOutcomeDay: 300,
    plannedOutcomeStatus: 'failed',
    plannedBrokenAssumption: 'השוואת שכר מלאה תשאיר טאלנט קריטי לטווח ארוך ותשמור על יציבות הצוות',
    plannedOutcomeReflection: 'השווינו את השכר לשווי שוק קיצוני, אך אלעד עזב ממילא 3 חודשים לאחר מכן, תוך שהוא משאיר אחריו מרירות עמוקה בקרב יתר המהנדסים שגילו על השכר.'
  },
  {
    caseIndex: 11,
    day: 53,
    month: 2,
    category: 'recurring_family',
    family: 'c_level_talent',
    title: 'החלפת מנהל המוצר עקב חיכוך עם צוות הפיתוח',
    dilemmaPromptGuidance: 'מנהל המוצר הבכיר יוצר צוואר בקבוק ומתיחות קבועה מול צוות ה-R&D, וגרסאות מתעכבות בחודשיים. האם לפטר אותו מיד ולקחת את המושכות זמנית בעצמי, או להביא מנטור ארגוני לנסות לגשר על הפערים?',
    plannedOutcomeDay: 305,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'ההחלטה לחתוך מיד שחררה את המתיחות בצוות והקפיצה את קצב שחרור הגרסאות ב-40% תוך חודשיים.'
  },
  {
    caseIndex: 12,
    day: 58,
    month: 2,
    category: 'recurring_family',
    family: 'build_vs_buy',
    title: 'מודול חיוב וגבייה מורכב: פיתוח פנימי מעל Stripe או הטמעת Chargebee',
    dilemmaPromptGuidance: 'אנחנו עוברים למודל תמחור היברידי מורכב של מושבים פלוס צריכת משאבים. האם להטמיע מערכת חיצונית כמו Chargebee בעלות של עשרים אלף דולר בשנה, או להטיל על שני מהנדסים לבנות לוגיקה מעל Stripe?'
  },

  // ==========================================
  // MONTH 3 (Days 61 - 90): Expansion & Tension
  // ==========================================
  {
    caseIndex: 13,
    day: 63,
    month: 3,
    category: 'trivial_silence_test',
    title: 'השתתפות בפאנל כנס נטוורקינג ביום חמישי בערב',
    dilemmaPromptGuidance: 'הזמינו אותי לפאנל קצר של 20 דקות בכנס יזמות בהרצליה. הדילמה היא האם להשקיע שלוש שעות בערב בשביל נטוורקינג כללי, או להישאר במשרד ולעבוד על ה-Pipeline.',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 14,
    day: 68,
    month: 3,
    category: 'recurring_family',
    family: 'term_sheet_funding',
    title: 'הלוואת חוב (Venture Debt) של 3 מיליון מול הארכת Runway ללא דילול',
    dilemmaPromptGuidance: 'קרן חוב מציעה קו אשראי של שלושה מיליון דולר בריבית של תשעה אחוזים ו-1% Warrants. ההתלבטות היא האם לקחת חוב יקר כדי למשוך את הגיוס הבא לשווי גבוה יותר, או להימנע מהתחייבויות פיננסיות מעיקות.',
    plannedContradictionWithCase: 5,
    plannedContradictionStatement: 'אין סיבה לפחד מבלעדיות של קרנות גדולות, עדיף שקט תעשייתי מחוב מעיק'
  },
  {
    caseIndex: 15,
    day: 73,
    month: 3,
    category: 'hostile_incomplete',
    title: 'תגובה זועמת ומקוטעת על דרישת לקוח',
    dilemmaPromptGuidance: 'הלקוח מניו יורק מאיים לעזוב אם אין לו תקן SOC2 מלא עד סוף החודש. תגיד לי כן או לא, לחתום לו על התחייבות כוזבת כדי להציל את העסקה או לוותר עליו?'
  },
  {
    caseIndex: 16,
    day: 79,
    month: 3,
    category: 'strategic_oneoff',
    title: 'חשיפת מתחרה חדש שגייס 50 מיליון דולר בארה"ב',
    dilemmaPromptGuidance: 'מתחרה ישיר נחשף עם גיוס של 50 מיליון דולר וקמפיין אגרסיבי נגדנו. האם להסיט תקציבים מסיביים לקמפיין שיווקי מגיב, או להישאר ממוקדים בפתרון הטכנולוגי ובלקוחות הקיימים?',
    plannedOutcomeDay: 310,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'ההתמקדות באיכות המוצר הוכיחה את עצמה כשהמתחרה שרף את רוב כספי הגיוס על שיווק ראוותני מבלי לייצר מוצר יציב.'
  },
  {
    caseIndex: 17,
    day: 84,
    month: 3,
    category: 'recurring_family',
    family: 'enterprise_pricing',
    title: 'מודל תמחור לפי צריכה בפועל (Consumption) מול מנוי שנתי קבוע',
    dilemmaPromptGuidance: 'שלושה לקוחות Enterprise דורשים לעבור למודל תשלום לפי צריכה בפועל ולא לפי מנוי שנתי קבוע. הדבר מייצר אי-ודאות תזרימית קשה אך עשוי להוריד את חסם הכניסה ללקוחות חדשים רבים.'
  },
  {
    caseIndex: 18,
    day: 89,
    month: 3,
    category: 'trivial_silence_test',
    title: 'החלפת ספק כיבוד וקפה למשרד',
    dilemmaPromptGuidance: 'ספק הקפה הנוכחי מעלה את המחיר ב-400 שקלים לחודש. מנהלת המשרד שואלת אם לעבור לספק חלופי או להשאיר את המצב הקיים כדי לא לבזבז זמן.',
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
    dilemmaPromptGuidance: 'המשקיעים האמריקאים דורשים לבצע מהלך Flip מלא ולהפוך את החברה לתאגיד דלאוור כדי להכשיר השקעה של קרנות מובילות. הדבר כרוך בעלויות משפטיות של 60 אלף דולר ובסרבול מס בישראל.',
    plannedOutcomeDay: 315,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'המהלך פתח גישה ישירה לחוזים פדרליים בארה"ב ולסגירת סבב השקעה מקרן אמריקאית Tier-1 ללא שום עיכוב רגולטורי.'
  },
  {
    caseIndex: 20,
    day: 99,
    month: 4,
    category: 'recurring_family',
    family: 'c_level_talent',
    title: 'מינוי ראש צוות פיתוח חסר ניסיון ניהולי ל-VP R&D',
    dilemmaPromptGuidance: 'סמנכ"ל הפיתוח עזב בהפתעה. האם לקדם את תומר, מהנדס מבריק שמכיר כל שורת קוד אך חסר ניסיון ניהולי, או לצאת לתהליך גיוס חיצוני ממושך שעלול לעכב את המוצר בחצי שנה?',
    plannedContradictionWithCase: 1,
    plannedContradictionStatement: 'אני לא מאמין במנהלים נוצצים מבחוץ, תמיד עדיף לקדם מישהו מהבית שמכיר את הקרביים'
  },
  {
    caseIndex: 21,
    day: 104,
    month: 4,
    category: 'strategic_oneoff',
    title: 'תביעת פטנט מקורסת IP Troll בארה"ב',
    dilemmaPromptGuidance: 'קיבלנו מכתב התראה על הפרת פטנט לכאורה בנושא עיבוד נתונים בזמן אמת, עם דרישה להסדר של 150 אלף דולר. האם לשלם כדי להסיר את האיום לפני סבב הגיוס, או לצאת למאבק משפטי עקרוני ויקר?',
    plannedOutcomeDay: 320,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'עמידה איתנה והצגת Prior Art חד-משמעי גרמו לטרול לסגת לחלוטין ולסגור את התיק ללא תשלום של דולר אחד.'
  },
  {
    caseIndex: 22,
    day: 110,
    month: 4,
    category: 'recurring_family',
    family: 'build_vs_buy',
    title: 'שכתוב מערכת ה-Auth הפנימית למערכת Auth0/Okta ארגונית',
    dilemmaPromptGuidance: 'לקוחות Enterprise מתנים חתימה בתמיכה ב-SAML ואימות רב-שלבי מורכב. האם להטמיע את Auth0 בעלות של שלושים אלף דולר לשנה, או להקצות מהנדס סניור שיממש את הפרוטוקול בתוך המערכת שלנו?'
  },
  {
    caseIndex: 23,
    day: 115,
    month: 4,
    category: 'trivial_silence_test',
    title: 'הוספת פיצ\'ר של מצב לילה (Dark Mode) בממשק הניהול',
    dilemmaPromptGuidance: 'שני לקוחות שאלו כבדרך אגב אם יש מצב כהה בממשק. מנהל העיצוב רוצה להקדיש לכך יום עבודה מלא. האם לאשר את המשימה או לבטל אותה מיד?',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 24,
    day: 119,
    month: 4,
    category: 'recurring_family',
    family: 'enterprise_pricing',
    title: 'מתן 50% הנחה ללקוח Design Partner תמורת לוגו ו-Case Study פומבי',
    dilemmaPromptGuidance: 'תאגיד בינלאומי מוכן לחתום על חוזה שנתי ולקחת חלק ב-Case Study פומבי אם נעניק לו הנחה של חמישים אחוז. האם להסכים כדי לזכות בלוגו יוקרתי, או להתעקש על מחיר מלא?',
    plannedContradictionWithCase: 7,
    plannedContradictionStatement: 'אין שום קדושה במחיר מחירון, לוגו של תאגיד ענק שווה מיליונים בשיווק'
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
    dilemmaPromptGuidance: 'ענקית טכנולוגיה אמריקאית הגישה הצעת רכישה לא מחייבת בסך 45 מיליון דולר במזומן. גייסנו עד כה 8 מיליון. האם להיכנס למשא ומתן למכירה מהירה, או לסרב בתוקף ולהמשיך לבנות חברה עצמאית?',
    plannedOutcomeDay: 325,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'דחיית ההצעה התבררה כמהלך מבריק; החברה שילשה את ה-ARR תוך שנה והשווי עלה ל-110 מיליון דולר.'
  },
  {
    caseIndex: 26,
    day: 129,
    month: 5,
    category: 'recurring_family',
    family: 'global_expansion',
    title: 'פתיחת סניף מכירות בלונדון או התמקדות מלאה בארה"ב',
    dilemmaPromptGuidance: 'אנחנו רואים עניין מלקוחות בריטיים ומתלבטים האם להקים סניף בלונדון עם שני אנשי מכירות מקומיים, או להישאר ממוקדים ב-100% בשוק האמריקאי שבו פוטנציאל הצמיחה גדול פי כמה.',
    plannedOutcomeDay: 330,
    plannedOutcomeStatus: 'failed',
    plannedBrokenAssumption: 'פתיחת סניף מכירות בלונדון תייצר דריסת רגל אירופית רווחית ללא צורך בנוכחות פיזית קבועה של המייסדים',
    plannedOutcomeReflection: 'הסניף בלונדון שרף 420 אלף דולר בשכר ושכירות, לא הצליח לסגור עסקאות ללא מנהל מוצר מקומי, ונאלצנו לסגור אותו אחרי תשעה חודשים.'
  },
  {
    caseIndex: 27,
    day: 134,
    month: 5,
    category: 'hostile_incomplete',
    title: 'קלט סתמי ומנוכר של מילה אחת',
    dilemmaPromptGuidance: 'להמשיך בתוכנית או לעצור הכל?'
  },
  {
    caseIndex: 28,
    day: 139,
    month: 5,
    category: 'trivial_silence_test',
    title: 'הדפסת חולצות וכובעים ממותגים לכנס השנתי',
    dilemmaPromptGuidance: 'צוות השיווק מבקש להזמין 200 חולצות וכובעים ממותגים לחלוקה בכנס ב-6,500 שקלים. האם לאשר את ההוצאה או להוריד אותה מסדר היום?',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 29,
    day: 144,
    month: 5,
    category: 'recurring_family',
    family: 'c_level_talent',
    title: 'פיטורי סמנכ"ל השיווק (CMO) אחרי 5 חודשים ללא Pipeline מספק',
    dilemmaPromptGuidance: 'סמנכ"ל השיווק שהבאנו מארה"ב לא מייצר לידים איכותיים, וה-Pipeline לא עומד ביעדים. האם לחתוך מיד כדי לעצור את שריפת המזומנים, או לתת לו רבעון נוסף להוכיח את עצמו?'
  },
  {
    caseIndex: 30,
    day: 149,
    month: 5,
    category: 'recurring_family',
    family: 'term_sheet_funding',
    title: 'דחיית סבב גיוס B בשנה והגעה לרווחיות (Cash-Flow Positive)',
    dilemmaPromptGuidance: 'קצב שריפת המזומנים עומד על 180 אלף דולר בחודש. האם לבצע קיצוץ נקודתי ולהגיע לאיזון תזרימי תוך חצי שנה, או להמשיך בשריפה גבוהה ולצאת לסבב גיוס B מוקדם?',
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
    dilemmaPromptGuidance: 'גוגל ענן מציעים לנו חבילת קרדיטים של 250 אלף דולר לשנתיים אם נעביר את כל התשתית מ-AWS. המהלך יחסוך כסף רב אך ידרוש כחודש של עבודת תשתית ופוטנציאל לתקלות אמינות.'
  },
  {
    caseIndex: 32,
    day: 159,
    month: 6,
    category: 'trivial_silence_test',
    title: 'בחירת יום בשבוע ל-Happy Hour במשרד',
    dilemmaPromptGuidance: 'יש ויכוח בצוות האם להעביר את ההאפי האוור מיום חמישי ליום רביעי בגלל פקקים. האם זה שווה התערבות שלי או שהם יחליטו לבד?',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 33,
    day: 164,
    month: 6,
    category: 'strategic_oneoff',
    title: 'דליפת נתונים מסביבת Staging של לקוח פיילוט',
    dilemmaPromptGuidance: 'מפתח חשף בטעות מפתח API בקוד ציבורי ומידע סינתטי של לקוח פיילוט נסרק. האם להוציא דיווח שקוף לרשות הפרטיות וללקוח, או להסתפק בסגירת הפירצה היות ולא מדובר במידע אמיתי?',
    plannedOutcomeDay: 335,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'הדיווח המיידי והשקוף חיזק את האמון של הלקוח, שחתם על חוזה Enterprise מלא שבוע לאחר מכן.'
  },
  {
    caseIndex: 34,
    day: 170,
    month: 6,
    category: 'recurring_family',
    family: 'enterprise_pricing',
    title: 'גביית תשלום נפרד על תמיכת 24/7 מול הכללה בחבילת הבסיס',
    dilemmaPromptGuidance: 'לקוחות Enterprise דורשים הסכם SLA של שעה לתקלות קריטיות. האם לדרוש תוספת של 25% עבור תמיכת פרימיום, או להכליל זאת במחיר הבסיס כדי לא להציב מכשולים במשא ומתן?'
  },
  {
    caseIndex: 35,
    day: 175,
    month: 6,
    category: 'hostile_incomplete',
    title: 'קלט סרקסטי ועוין',
    dilemmaPromptGuidance: 'המשקיע הראשי שלי משתגע ודורש לראות תוצאות מחר בבוקר. מה המערכת החכמה הזאת מציעה, להמציא לו מספרים או להגיד לו שיירגע?'
  },
  {
    caseIndex: 36,
    day: 179,
    month: 6,
    category: 'recurring_family',
    family: 'global_expansion',
    title: 'הקמת מרכז פיתוח משני (R&D Center) בפולין או פורטוגל',
    dilemmaPromptGuidance: 'עלויות השכר בארץ ממשיכות לטפס ואנחנו מתקשים לגייס מהנדסי DevOps. האם לפתוח סניף פיתוח במזרח אירופה שבו עלות מהנדס נמוכה בחצי, או שהמרחק הניהולי יפגע ברוח הצוות?'
  },

  // ==========================================
  // MONTH 7 (Days 181 - 210): Acceleration & Crisis
  // ==========================================
  {
    caseIndex: 37,
    day: 184,
    month: 7,
    category: 'strategic_oneoff',
    title: 'משבר אמון בין המייסדים: דרישת השותף לחלוקת סמכויות מחדש',
    dilemmaPromptGuidance: 'השותף המייסד וה-CTO מרגיש שדעתו אינה נשמעת בהחלטות אסטרטגיות ודורש זכות וטו מלאה על מפת הדרכים המוצרית. האם להעמיד גבולות ניהוליים קשיחים, או להתפשר כדי לא לסכן את יציבות הנהלת החברה?',
    plannedOutcomeDay: 340,
    plannedOutcomeStatus: 'partially_succeeded',
    plannedOutcomeReflection: 'הגדרת גבולות חדים מנעה שיתוק ניהולי, אך הותירה צלקת ביחסי המייסדים וה-CTO עבר לתפקיד ייעוצי בלבד.'
  },
  {
    caseIndex: 38,
    day: 189,
    month: 7,
    category: 'trivial_silence_test',
    title: 'אישור תשלום של 650 ש"ח על שירות ביטול רעשים לאוזניות',
    dilemmaPromptGuidance: 'מנהל המכירות מבקש החזר חודשי של 650 שקלים עבור מנוי שנתי לאפליקציית ביטול רעשים לשיחות זום. לאשר או לדחות?',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 39,
    day: 194,
    month: 7,
    category: 'recurring_family',
    family: 'c_level_talent',
    title: 'הצעת שכר חריגה ל-Chief Architect מחברת ענק',
    dilemmaPromptGuidance: 'איתרנו מהנדס תוכנה עילאי שיכול לשדרג את התשתית שלנו לעמידה בעומסים של מיליוני אירועים. הוא דורש שכר של 65 אלף שקלים ואחוז וחצי אופציות. האם לפרוץ את מסגרות השכר עבורו?'
  },
  {
    caseIndex: 40,
    day: 199,
    month: 7,
    category: 'recurring_family',
    family: 'build_vs_buy',
    title: 'שילוב מנוע LLM מסחרי מול אימון מודל קוד פתוח (Llama-3)',
    dilemmaPromptGuidance: 'לקוחות ביטחוניים מסרבים לשלוח נתונים ל-API של מודל מסחרי בענן. האם להשקיע מאה אלף דולר בתשתיות אירוח פרטיות של מודל קוד פתוח, או להמשיך להתבסס על מודל סגור?'
  },
  {
    caseIndex: 41,
    day: 204,
    month: 7,
    category: 'recurring_family',
    family: 'enterprise_pricing',
    title: 'מעבר למודל בלעדיות ענפית ללקוח Enterprise ראשון בתחום הביטוח',
    dilemmaPromptGuidance: 'חברת ביטוח ענקית מציעה מקדמה של מיליון דולר בתנאי שנתחייב לא למכור את המוצר לשום חברת ביטוח מתחרה במשך שנתיים. הכסף מפתה מאוד אך עלול לחסום את כל הסקטור.',
    plannedOutcomeDay: 345,
    plannedOutcomeStatus: 'failed',
    plannedBrokenAssumption: 'חתימה על בלעדיות ענפית מול לקוח ראשון תבסס את המוצר כמוביל שוק ותספק מימון מספק',
    plannedOutcomeReflection: 'הסכם הבלעדיות חסם אותנו מלהיכנס לשלוש חברות ביטוח ענקיות שרצו לקנות את הפתרון, והלקוח הבלעדי התקדם בקצב פיתוח איטי ביותר.'
  },
  {
    caseIndex: 42,
    day: 209,
    month: 7,
    category: 'trivial_silence_test',
    title: 'שדרוג מנוי Slack של החברה לחבילת Enterprise',
    dilemmaPromptGuidance: 'הגענו למגבלת היסטוריית ההודעות ב-Slack. האם לשדרג לחבילת אנטרפרייז בעלות כפולה, או להסתפק בהורדת היסטוריה מקומית ולשמור על תקציב נמוך?',
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
    dilemmaPromptGuidance: 'משקיע קיים מציע השקעת גישור של שני מיליון דולר ב-SAFE עם שווי גג של 40 מיליון. הדבר מעניק לנו עוד 8 חודשי עבודה בשקט. האם לקחת עכשיו או לצאת לרוד-שואו מתיש לגיוס סבב מלא?'
  },
  {
    caseIndex: 44,
    day: 219,
    month: 8,
    category: 'strategic_oneoff',
    title: 'הדלפת פיצ\'ר דגל עתידי על ידי עובד לשעבר ברשתות החברתיות',
    dilemmaPromptGuidance: 'עובד שפוטר פרסם תיאור מפורט של יכולת הליבה החדשה שאנחנו מפתחים. האם לשלוח לו מכתב התראה משפטי מיידי, או להתעלם כדי לא לייצר הד תקשורתי מיותר שימשוך תשומת לב של מתחרים?',
    plannedOutcomeDay: 350,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'ההתעלמות השקטה מנעה את התנפחות האירוע ברשת, וההשקה הרשמית הפתיעה את השוק בדיוק לפי התוכנית.'
  },
  {
    caseIndex: 45,
    day: 224,
    month: 8,
    category: 'recurring_family',
    family: 'global_expansion',
    title: 'השתתפות במכרז ממשלתי ביפן דרך שותף מקומי',
    dilemmaPromptGuidance: 'משרד ממשלתי בטוקיו פרסם מכרז ענק שמתאים בדיוק ליכולות המערכת שלנו, אך תנאי הסף דורש נוכחות פיזית קבועה של מהנדס ביפן לחצי שנה. האם להתחייב לדרישה או להישאר מחוץ למכרז?'
  },
  {
    caseIndex: 46,
    day: 229,
    month: 8,
    category: 'hostile_incomplete',
    title: 'קלט זועם על עיכוב בגרסה',
    dilemmaPromptGuidance: 'שחרור הגרסה מתעכב בעשרה ימים בגלל באג בביצועים. לשחרר עם הבאג ולתקן תוך כדי תנועה או לדחות את כל ההשקה ולצאת לא מקצועיים מול הלקוחות?'
  },
  {
    caseIndex: 47,
    day: 234,
    month: 8,
    category: 'trivial_silence_test',
    title: 'השתתפות בסקר שכר הייטק של חברת השמה',
    dilemmaPromptGuidance: 'חברת השמה מבקשת שנמלא שאלון שכר של 45 דקות בתמורה לקבלת דוח השכר השנתי בחינם. האם להשקיע את הזמן או למחוק את המייל?',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 48,
    day: 239,
    month: 8,
    category: 'strategic_oneoff',
    title: 'החלטה על סגירת שירות ללקוחות קטנים (Killing the SMB Tier)',
    dilemmaPromptGuidance: 'מאה וחמישים לקוחות קטנים מייצרים רק 8% מסך ההכנסות אך צורכים מעל מחצית מזמן התמיכה של המהנדסים. האם להודיע על סגירת השירות ללקוחות קטנים בתוך 60 יום ולהתמקד אך ורק ב-Enterprise?',
    plannedOutcomeDay: 355,
    plannedOutcomeStatus: 'succeeded',
    plannedOutcomeReflection: 'נטישת הסגמנט הקטן שחררה את כל צוות התמיכה והפיתוח והובילה להכפלת הכנסות ה-ARR מלקוחות אנטרפרייז תוך שנה.'
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
    dilemmaPromptGuidance: 'החברה מונה כבר חמישים עובדים וה-CTO הנוכחי מתקשה לנהל גם את האנשים וגם את הארכיטקטורה ארוכת הטווח. כיצד לבצע את פיצול התפקיד בצורה מכבדת מבלי לייצר משבר אמון בהנהלה?'
  },
  {
    caseIndex: 50,
    day: 249,
    month: 9,
    category: 'recurring_family',
    family: 'build_vs_buy',
    title: 'פיתוח מנוע פנימי לזיהוי אנומליות מול שימוש ב-Datadog/NewRelic',
    dilemmaPromptGuidance: 'חשבון הניטור של החברה ב-Datadog חצה את רף ה-15 אלף דולר בחודש. האם להקצות מהנדס תשתית לחודשיים כדי להקים מערך מבוסס קוד פתוח, או להמשיך לשלם כדי לשמור על מיקוד המוצר?'
  },
  {
    caseIndex: 51,
    day: 254,
    month: 9,
    category: 'recurring_family',
    family: 'enterprise_pricing',
    title: 'נעילת חוזים שנתית עם מנגנון הצמדה לאינפלציה (CPI Cap)',
    dilemmaPromptGuidance: 'היועץ המשפטי ממליץ להוסיף סעיף הצמדה לאינפלציה של עד 5% בכל חוזה אנטרפרייז חדש. הלקוחות דורשים למחוק את הסעיף. האם להתעקש על הגנה אינפלציונית או לוותר כדי לזרז סגירת עסקאות?'
  },
  {
    caseIndex: 52,
    day: 259,
    month: 9,
    category: 'trivial_silence_test',
    title: 'החלפת תמונות הצוות באתר החברה',
    dilemmaPromptGuidance: 'מנהלת השיווק רוצה לשכור צלם מקצועי ב-3,500 שקלים לצלם תמונות חדשות לכל הצוות עבור עמוד האודות. האם לאשר את ההוצאה או להשאיר תמונות קיימות?',
    expectedTrivialSilence: true
  },
  {
    caseIndex: 53,
    day: 263,
    month: 9,
    category: 'recurring_family',
    family: 'global_expansion',
    title: 'הקמת ישות מכירות נפרדת בסינגפור לפעילות APAC',
    dilemmaPromptGuidance: 'יש לנו שלושה לקוחות פעילים במזרח הרחוק. האם להקים ישות משפטית וחשבון בנק בסינגפור בעלות שנתית של 25 אלף דולר, או להמשיך לחייב הכל מישראל ומארה"ב?'
  },
  {
    caseIndex: 54,
    day: 266,
    month: 9,
    category: 'recurring_family',
    family: 'term_sheet_funding',
    title: 'חתימה על Term Sheet לסבב B של 25 מיליון דולר',
    dilemmaPromptGuidance: 'קיבלנו שתי הצעות לסבב B: קרן מובילה מציעה 25 מיליון לפי שווי 85 מיליון עם זכות וטו על מינויים, מול קרן אירופית שמציעה 22 מיליון לפי שווי 75 מיליון עם ממשל תאגידי גמיש בהרבה. על מה לחתום?',
    plannedOutcomeDay: 360,
    plannedOutcomeStatus: 'partially_succeeded',
    plannedOutcomeReflection: 'הסבב נסגר לפי ההצעה הגבוהה יותר; ההון אפשר צמיחה מואצת אך דרישות הממשל התאגידי הכבידו על קבלת החלטות מהירה.'
  },
  {
    caseIndex: 55,
    day: 269,
    month: 9,
    category: 'strategic_oneoff',
    title: 'החלטה על פתיחת API ציבורי לקהילת מפתחים (Developer Platform)',
    dilemmaPromptGuidance: 'האם לחשוף את ה-Core API שלנו בחינם לקהילת מפתחים חיצוניים כדי ליצור Network Effect חזק, או להשאיר את המערכת סגורה ולגבות תשלום על כל גישה?'
  }
];
