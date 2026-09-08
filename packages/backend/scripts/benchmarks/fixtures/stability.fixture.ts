export interface StabilityVariation {
  variationIndex: number;
  label: string;
  styleDescription: string;
  rawCapture: string;
}

export interface StabilityBenchmarkDefinition {
  dilemmaId: string;
  coreDecision: string;
  expectedTrueHinge: string; // The invariant underlying assumption
  variations: StabilityVariation[];
}

export const STABILITY_BENCHMARK: StabilityBenchmarkDefinition = {
  dilemmaId: 'stability_firing_founding_engineer',
  coreDecision: 'האם להחליף/לפטר את יובל, מהנדס המייסד שמעכב את הצוות',
  expectedTrueHinge: 'האם יובל מסוגל לבצע את ההתאמה לסדרי הגודל החדשים, או שחוסר התאמתו לפיתוח ארגוני מובנה הוא חסם בלתי פתיר',
  variations: [
    {
      variationIndex: 1,
      label: 'ניסוח ישיר ותכליתי (Direct & Factual)',
      styleDescription: 'דיבור מנכ"לי מאוזן, עובדתי, שקול וללא דרמה',
      rawCapture: 'אני מתלבט כרגע אם לפטר את יובל, מהנדס התוכנה המוביל שלנו. הוא איתנו מהיום הראשון וכתב את כל הקוד הראשוני, אבל בששת החודשים האחרונים כשהצוות גדל לעשרה מתכנתים, הוא הפך לצוואר בקבוק. הוא מתעקש לאשר כל שורת קוד, מסרב לכתוב תיעוד ומעכב את כל הגרסאות.'
    },
    {
      variationIndex: 2,
      label: 'ניסוח רגשי ולחוץ (Emotional & Team Distress)',
      styleDescription: 'מיקוד במצוקת הצוות, תסכול אישי, תחושת חוסר אונים',
      rawCapture: 'אני מרגיש שאני עומד להתפוצץ בגלל יובל. הצוות מתוסכל ברמות שאי אפשר לתאר, שני מהנדסים מעולים כבר איימו להתפטר אם המצב יימשך ככה. יובל פשוט תוקע כל דבר, ואני לא יודע מה לעשות. מצד אחד הוא כמו משפחה, מצד שני האווירה במשרד הפכה לרעילה בגלל השליטה שלו.'
    },
    {
      variationIndex: 3,
      label: 'ניסוח עסקי-פיננסי (Financial & Business Impact)',
      styleDescription: 'מיקוד ב-Runway, יעדי סבב גיוס, עלות עיכוב ולוחות זמנים',
      rawCapture: 'העיכובים של יובל בשחרור הגרסה הארגונית מעמידים בסכנה ישירה את עמידה ב-Milestones לקראת סבב הגיוס הבא. נשארו לנו 7 חודשי Runway, וכל שבוע של דחייה באספקה לשני לקוחות הדגל עולה לנו ב-ARR. אני שוקל לחתוך אותו עכשיו ולהביא Tech Lead שמורגל ב-Scale ארגוני כדי לעמוד ביעדים.'
    },
    {
      variationIndex: 4,
      label: 'ניסוח דילמת נאמנות (Loyalty vs. Professionalism)',
      styleDescription: 'קונפליקט מוסרי בין הכרת תודה על העבר לבין צורכי העתיד',
      rawCapture: 'אני מוצא את עצמי בקונפליקט מוסרי עמוק סביב יובל. הבחור הקריב לילות כימים כשהיינו במוסך ללא שכר, ואני חייב לו את קיומה של החברה. אבל החברה השתנתה והצרכים היום הם ניהול תהליכים ובגרות הנדסית, תחומים שבהם הוא פשוט נכשל. האם נכון להיפרד ממנו עכשיו או להמשיך להכיל אותו מתוך נאמנות?'
    },
    {
      variationIndex: 5,
      label: 'ניסוח קצר ותזזיתי (Terse & Fragmented Executive)',
      styleDescription: 'קלט מקוטע, תזזיתי, נטול גינונים מתוך לחץ זמן',
      rawCapture: 'יובל או עמידה ביעדי גרסה. הבחור תוקע את כולם ולא משחרר קוד. צוות שלם עומד. לחתוך אותו עכשיו או לנסות למשוך עוד חודש? חייב הכרעה מהירה.'
    }
  ]
};
