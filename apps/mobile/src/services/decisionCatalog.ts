// Decision Catalog & OKF Retrieval Service
// Merges documented historical precedents with live user decisions from localStorage / Firestore

export interface CatalogPrecedent {
  id: string;
  title: string;
  date?: string;
  family?: string;
  dilemma: string;
  keywords: string[];
  principles?: string[];
  tradeoffs?: { protectedValue: string; sacrificedValue: string };
  lesson?: string;
  conclusion?: string;
  outcome?: string;
  historicalQuestion?: string;
}

export interface PrecedentMatchResult {
  matchedPrecedent: CatalogPrecedent;
  score: number;
  matchReason: string;
  suggestedQuestion: string;
}

// 1. Documented Precedents Catalog from DECISION_CYCLES_ARCHIVED.md
export const CANONICAL_PRECEDENTS: CatalogPrecedent[] = [
  {
    id: 'dc-1788633902216',
    title: 'בחירה בין רכב חשמלי לרכב בנזין (ספטמבר 2026)',
    date: '5.9.2026',
    family: 'lifestyle_health',
    dilemma: 'בחירה בין רכב חשמלי לרכב בנזין או היברידי: חיסכון וקיימות מול חרדת טווח ותלות בטעינה',
    keywords: ['רכב', 'חשמלי', 'בנזין', 'היברידי', 'טעינה', 'סוללה', 'אוטו', 'דלק', 'עמדת טעינה', 'חיבור חשמל', 'קוט"ש'],
    principles: ['וודאות מוקדמת לגבי עמדת טעינה ביתית זמינה', 'בדיקת קילומטראז שבועי מול קיבולת סוללה'],
    tradeoffs: {
      protectedValue: 'חיסכון בעלויות שוטפות וקיימות',
      sacrificedValue: 'ספונטניות נסיעה ארוכה ללא תכנון טעינה'
    },
    lesson: 'תשתית טעינה ביתית זמינה היא תנאי סף מוחלט לפני מעבר לרכב חשמלי. בלעדיה עלויות הזמן עולות על החיסכון.',
    conclusion: 'להקפיד על טעינת הרכב בבית בלילה שלפני הנסיעה השבועית; תשתית ביתית קבועה היא תנאי הסף להכרעה.',
    historicalQuestion: 'בספטמבר 2026 למדת שתשתית טעינה ביתית קבועה היא תנאי סף מכריע לבחירה בחשמלי. האם לקח זה רלוונטי לדילמה הנוכחית?'
  },
  {
    id: 'dc-1788619026413',
    title: 'בחירה בין קבלן יחיד לבין פיצול עבודות השלד והגמר (ספטמבר 2026)',
    date: '5.9.2026',
    family: 'real_estate_construction',
    dilemma: 'בחירה בין קבלן יחיד לבין פיצול עבודות השלד והגמר בפרויקט בנייה',
    keywords: ['קבלן', 'שלד', 'גמרים', 'פיצול', 'בנייה', 'שיפוץ', 'קבלנים', 'ביצוע', 'קבלני משנה'],
    principles: ['הפרדה מבנית בין שלב שלד לשלב גמרים', 'מנגנון פיצוי מוסכם מראש על ליקויים'],
    tradeoffs: {
      protectedValue: 'איכות גמרים מקסימלית ובקרת איכות בלתי תלויה',
      sacrificedValue: 'נוחות ניהולית של כתובת אחת לכל העבודות'
    },
    lesson: 'קבלן שלד מצטיין אינו בהכרח פדנט בגמרים. פיצול בין השלבים מייצר בקרת איכות עדיפה בהרבה ומגן על המיצוב.',
    conclusion: 'הגדרת נוהל עבודה וגבולות גזרה קשיחים בשלד, תוך פיצול חוזי של עבודות הגמרים לקבלן ייעודי.',
    historicalQuestion: 'בפרויקט כנרת למדת שקבלן שלד מצטיין אינו בהכרח פדנט בגמרים, ושפיצול יוצר איכות עדיפה. האם נכון ליישם לקח זה גם כאן?'
  },
  {
    id: 'dc-1788597346752',
    title: 'אסטרטגיית אספקת בטון לפרויקט קטרוני (ספטמבר 2026)',
    date: '5.9.2026',
    family: 'real_estate_construction',
    dilemma: 'בחירת אסטרטגיית אספקת בטון לפרויקט קטרוני: ספק יחיד זול מול פיצול ספקים כגיבוי',
    keywords: ['בטון', 'ספק', 'אספקה', 'יציקה', 'ספקים', 'פיצול ספקים', 'מפעל בטון', 'משאבה'],
    principles: ['פיצול 70/30 כביטוח מפני השבתה', 'פרמיית גיבוי שווה מניעת נזק יומי'],
    tradeoffs: {
      protectedValue: 'רציפות תפעולית ומניעת ימי השבתה של 45,000 ש"ח',
      sacrificedValue: 'הנחת כמות מקסימלית אצל ספק יחיד'
    },
    lesson: 'העדפת ספק יחיד זול יצרה סיכון השבתה קריטי. פיצול 70/30 כביטוח שווה את תוספת הפרמיה.',
    conclusion: 'פיצול אספקה בין שני ספקים כהגנה תפעולית מפני תקלות בימי יציקה קריטיים.',
    historicalQuestion: 'בהחלטה על אספקת בטון למדת שפיצול ספקים 70/30 מונע סיכון השבתה יקר. האם עלות ביטוח הגיבוי נכונה גם כאן?'
  },
  {
    id: 'dc-1788942334803',
    title: 'תמחור דירות קיטרוני וסלומון (ספטמבר 2026)',
    date: '9.9.2026',
    family: 'real_estate_construction',
    dilemma: 'הורדת מחירי הדירות בפרויקט קיטרוני וסלומון ב-100,000 עד 150,000 ש״ח להבטחת תזרים מול פגיעה במיצוב',
    keywords: ['מחיר', 'דירות', 'תמחור', 'הורדת מחיר', 'סלומון', 'קיטרוני', 'מכירות', 'נדל"ן', 'דוח אפס', 'מבצע'],
    principles: ['מבצע מתוחם בזמן ובכמות (דרך שלישית)', 'שמירה על מחיר מחירון רשמי של שאר הנכסים'],
    tradeoffs: {
      protectedValue: 'תזרים מזומנים מובטח מול אי-ודאות השוק',
      sacrificedValue: 'שמירה על תמחור מלא בכל היחידות'
    },
    lesson: 'הורדה גורפת פוגעת במיצוב ומייצרת ציפייה לירידות נוספות. פיילוט מתוחם ל-2 דירות בלבד שמר על ערך שאר הפרויקט.',
    conclusion: 'הגדרת מבצע מתוחם בזמן ל-2 דירות בלבד (דרך שלישית) שהבטיח תזרים ושמר על מיצוב הפרויקט.',
    historicalQuestion: 'בפרויקט סלומון למדת שמבצע מתוחם ל-2 דירות בלבד עדיף בהרבה על הורדת מחיר גורפת שפוגעת במיצוב. האם פיילוט מתוחם הוא הדרך הנכונה גם כעת?'
  },
  {
    id: 'dc-1789034514046',
    title: 'שיחה עם ליווי בנקאי זיו בנק הפועלים (ספטמבר 2026)',
    date: '10.9.2026',
    family: 'career_venture',
    dilemma: 'שקיפות מלאה לגבי אתגרי השוק ומצב החברה מול הצגת תמונה אופטימית ורודה בשיחה ראשונה מול ליווי בנקאי',
    keywords: ['בנק', 'ליווי בנקאי', 'פועלים', 'זיו', 'בנקאי', 'מימון', 'שקיפות', 'אשראי', 'ריבית', 'בנק הפועלים'],
    principles: ['שקיפות יזומה עם תוכנית מגננה סדורה', 'בניית אמינות מקצועית מול גורמי מימון'],
    tradeoffs: {
      protectedValue: 'אמינות לטווח ארוך וגיוס שותף פיננסי אמיתי',
      sacrificedValue: 'תחושת רושם ראשוני מושלם ונטול אתגרים'
    },
    lesson: 'הצגת תוכנית מגננה ריאלית ומענה יזום לסיכונים בונה אמון גבוה בהרבה מניסיון לייפות את המציאות.',
    conclusion: 'לנסח נקודות מפתח של תוכנית המגננה והמענה לסיכוני השוק כדי לבנות אמינות מקצועית אמיתית.',
    historicalQuestion: 'בשיחות מול הליווי הבנקאי למדת ששקיפות יזומה עם תוכנית מענה לסיכונים בונה אמון חזק בהרבה מאופטימיות יתר. האם ליישם גישה זו גם כעת?'
  },
  {
    id: 'dc-1788667121136',
    title: 'אימון לחצי מרתון ופעילות מאומצת מול החלמה מגב (ספטמבר 2026)',
    date: '6.9.2026',
    family: 'lifestyle_health',
    dilemma: 'חזרה לפעילות מאומצת (ריצה, גלישה בכנרת) מול החלמה מפציעת גב ואיתותי עומס סומטיים',
    keywords: ['גב', 'מרתון', 'חצי מרתון', 'ריצה', 'פציעה', 'עומס', 'החלמה', 'כאב', 'כנרת', 'גלישה', 'גופני'],
    principles: ['הקשבה לסמנים סומטיים ואיתותי כאב', 'הדרגתיות מתונה על פני דחיפת יתר'],
    tradeoffs: {
      protectedValue: 'בריאות ארוכת טווח ומניעת השבתה כרונית',
      sacrificedValue: 'עמידה מיידית ביעד ספורטיבי שאפתני'
    },
    lesson: 'דחיפה מעבר לאיתותי הגוף הובילה להשבתה ממושכת פי 3. שגרה הדרגתית של כוח והליכות השיגה תוצאות בטוחות.',
    conclusion: 'ייצור שגרה מדורגת של אימוני כוח והליכות כציר התקדמות זהיר תוך הימנעות מעומס פתאומי.',
    historicalQuestion: 'בפציעת הגב למדת שהתעלמות מסמנים סומטיים עולה בהשבתה ארוכה פי שלושה. האם עומס היתר שוב מתעלם מאיתותי המציאות?'
  },
  {
    id: 'dc-1788939512983',
    title: 'המשך תהליך החלפת מנהלת תפעול / כנרת (ספטמבר 2026)',
    date: '9.9.2026',
    family: 'career_venture',
    dilemma: 'האם להמשיך בתהליך הפיטורין והחלפת כנרת בהתאם להודעתה המקורית, או לאפשר לה להישאר לאור היסוסיה האחרונים',
    keywords: ['כנרת', 'עובדת', 'החלפה', 'פיטורין', 'גיוס', 'תפקיד', 'עזיבה', 'מועמדת', 'ניהול עובדים', 'מנהלת תפעול'],
    principles: ['החלטיות מול אי-ודאות פרסונלית', 'אי-כבילת הארגון לדשדוש של עובד מהסס'],
    tradeoffs: {
      protectedValue: 'יציבות ובהירות תפעולית לארגון',
      sacrificedValue: 'נוחות אישית ורצון להימנע מחיכוך ישיר'
    },
    lesson: 'היסוסים חוזרים ונשנים פוגעים ביציבות הארגונית. שיחה חדה והחלטית חיונית למניעת דשדוש מתמשך.',
    conclusion: 'לקיים שיחה חדה וסופית להבהרת עמדה רשמית ולסיים את ההתקשרות באופן מכבד וברור.',
    historicalQuestion: 'בדילמת התפקיד של כנרת למדת שדחיית הכרעה בשל היסוסים מייצרת נזק מצטבר. האם חדות מיידית נדרשת גם כאן?'
  },
  {
    id: 'dc-1788601474607',
    title: 'עתידו הספורטיבי של איתן: טיפוס מול שחייה (ספטמבר 2026)',
    date: '5.9.2026',
    family: 'parenting_family',
    dilemma: 'הכרעה לגבי עתידו הספורטיבי של איתן: התמדה בנבחרת טיפוס למרות שחיקה מול מעבר לשחייה',
    keywords: ['איתן', 'טיפוס', 'שחייה', 'אימון', 'חוג', 'נבחרת', 'ספורט ילדים', 'הורות', 'ילדים'],
    principles: ['הסכם פיילוט מתוחם בזמן', 'דיאלוג משותף ללא כפייה הורית'],
    tradeoffs: {
      protectedValue: 'חוסן פנימי וחדוות עשייה של הילד',
      sacrificedValue: 'השקעה קודמת בנבחרת הטיפוס'
    },
    lesson: 'הגדרת פיילוט מתוחם בזמן מנעה משבר מוטיבציה ואיפשרה החלטה משותפת ומחייבת.',
    conclusion: 'קיום שיחת תיאום ציפיות להגדרת פיילוט מתוחם עד תחילת השנה כדי לבחון מחויבות.',
    historicalQuestion: 'בהחלטה לגבי איתן למדת שהסכם פיילוט מותנה בזמן עדיף על הכרעה חד-צדדית. האם פיילוט מתוחם מתאים גם בדילמה זו?'
  },
  {
    id: 'dc-1788608114045',
    title: 'פתיחת פרויקט פינס מול ביטול החוזה (ספטמבר 2026)',
    date: '5.9.2026',
    family: 'real_estate_construction',
    dilemma: 'האם לפתוח את חוזה הליווי הבנקאי והבנייה בפרויקט פינס או לבטל את החוזה נוכח תנאי השוק',
    keywords: ['פינס', 'התחדשות', 'הסכם', 'חוזה', 'דיירים', 'כס 52-54', 'תכנון', 'ביטול חוזה', 'ליווי'],
    principles: ['ניתוח רגישות תזרימית קיצוני לפני התחייבות', 'אי-כניסה לפרויקט עם חוסר ודאות משפטית'],
    tradeoffs: {
      protectedValue: 'הגנה על ההון ומניעת סיכון הישרדותי',
      sacrificedValue: 'רווח פוטנציאלי מהפרויקט'
    },
    lesson: 'ניתוח רגישות מעודכן ומכתב כוונות מותנה בזמנים הגנו על האינטרס העסקי ללא כבילה מוקדמת.',
    conclusion: 'ביצוע ניתוח רגישות מעודכן למחירי הדירות ומודל תזרימי קשיח לפני פתיחת חוזה מחייב.',
    historicalQuestion: 'בפרויקט פינס למדת שניתוח רגישות תזרימי ומנגנון מותנה בזמנים מגנים מפני כבילה מוקדמת. האם תנאי סף כאלה חיוניים גם כאן?'
  }
];

// 2. Fetch all user decisions from localStorage + canonical archive
export function getAllUserDecisions(userId: string = 'Guy_Kuleski'): CatalogPrecedent[] {
  const mergedMap = new Map<string, CatalogPrecedent>();

  // Add canonical catalog
  CANONICAL_PRECEDENTS.forEach(p => mergedMap.set(p.id, p));

  // Load from localStorage
  if (typeof window !== 'undefined') {
    const keysToCheck = ['echo_decisions_' + userId];
    if (userId.toLowerCase().includes('guy') || userId.toLowerCase().includes('kuleski')) {
      keysToCheck.push('echo_decisions_Guy_Kuleski', 'echo_decisions_guy_kuleski', 'echo_decisions_guy_founder');
    }

    for (const key of keysToCheck) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            list.forEach((item: any) => {
              if (item && item.id) {
                const title = item.title || item.dilemma?.slice(0, 50) || 'החלטה מהעבר';
                const textToWords = (title + ' ' + (item.dilemma || '') + ' ' + (item.consideration || '') + ' ' + (item.facts || '') + ' ' + (item.assumptions || '')).toLowerCase();
                const extractedKeywords = textToWords
                  .split(/[\s,.:;״"()!?\-\/]+/)
                  .filter(w => w.length >= 3);

                const existing = mergedMap.get(item.id);
                mergedMap.set(item.id, {
                  id: item.id,
                  title: existing?.title || title,
                  date: item.date || existing?.date || 'ספטמבר 2026',
                  family: item.family || existing?.family || 'general_deliberation',
                  dilemma: item.dilemma || item.consideration || existing?.dilemma || title,
                  keywords: Array.from(new Set([...(existing?.keywords || []), ...extractedKeywords])),
                  principles: existing?.principles,
                  tradeoffs: existing?.tradeoffs,
                  lesson: item.followUps?.[0]?.whatHappened || item.conclusion || existing?.lesson,
                  conclusion: item.conclusion || existing?.conclusion,
                  outcome: item.followUps?.[0]?.whatHappened,
                  historicalQuestion: existing?.historicalQuestion || ('בהחלטה קודמת לגבי "' + title + '" הגדרת צעד ומסקנה. האם תובנה זו רלוונטית גם כאן?')
                });
              }
            });
          }
        }
      } catch {}
    }
  }

  return Array.from(mergedMap.values());
}

const HEBREW_STOPWORDS = new Set([
  'את', 'על', 'עם', 'של', 'לא', 'כן', 'זה', 'זו', 'אלה', 'אלו', 'היה', 'היו', 'תהיה', 'יהיה',
  'אני', 'אתה', 'הוא', 'היא', 'אנחנו', 'אתם', 'הם', 'כל', 'רק', 'עוד', 'יותר', 'לפני', 'אחרי',
  'כדי', 'אם', 'כי', 'או', 'גם', 'אבל', 'אך', 'כבר', 'שוב', 'שם', 'פה', 'כאן', 'מאוד', 'מה', 'מי',
  'לגבי', 'בגלל', 'מתוך', 'אצל', 'כמו', 'בין', 'שאתה', 'שאני', 'אולי', 'שוקל', 'שוקלת', 'מתלבט', 'מתלבטת'
]);

export interface RelatedPrecedentItem {
  id: string;
  title: string;
  date?: string;
  score: number;
  matchReason: string;
  lesson: string;
  historicalQuestion?: string;
}

export interface RelatedPastEchoesResult {
  primaryEcho: RelatedPrecedentItem | null;
  allRelatedEchoes: RelatedPrecedentItem[];
  insightsSummary: string;
}

// 3. OKF Tri-Factor Semantic Precedent Matching Engine (Expanded)
export function findRelatedOKFPrecedents(
  rawCaptureText: string,
  consideration: string,
  deepMechanisms?: {
    operatingPrinciples?: string[];
    tradeoffs?: Array<{ protectedValue: string; sacrificedValue: string }>;
  },
  userId: string = 'Guy_Kuleski',
  excludeId?: string
): RelatedPastEchoesResult {
  const allDecisions = getAllUserDecisions(userId);
  if (!allDecisions || allDecisions.length === 0) {
    return { primaryEcho: null, allRelatedEchoes: [], insightsSummary: '' };
  }

  const combinedCurrent = (rawCaptureText + ' ' + consideration).toLowerCase();
  const currentTokens = new Set(
    combinedCurrent
      .split(/[\s,.:;״"()!?\-\/]+/)
      .map(w => w.trim())
      .filter(w => w.length >= 3 && !HEBREW_STOPWORDS.has(w))
  );

  const scoredMatches: RelatedPrecedentItem[] = [];

  for (const dec of allDecisions) {
    // Exclude current decision from matching itself
    if (excludeId) {
      const cleanEx = excludeId.replace(/^dc-/, '');
      const cleanDec = dec.id.replace(/^dc-/, '');
      if (cleanEx === cleanDec || dec.id === excludeId) continue;
    }

    let score = 0;
    const matchReasons: string[] = [];

    // Layer 1: Specific keyword matching
    const matchedKeywords = dec.keywords.filter(k => combinedCurrent.includes(k.toLowerCase()));
    if (matchedKeywords.length > 0) {
      const keywordRatio = Math.min(0.45, matchedKeywords.length * 0.15);
      score += keywordRatio;
      matchReasons.push('מילות מפתח משותפות (' + matchedKeywords.slice(0, 3).join(', ') + ')');
    }

    // Layer 2: Deep Mechanism Match (Trade-offs & Principles)
    if (deepMechanisms?.tradeoffs && dec.tradeoffs) {
      for (const t of deepMechanisms.tradeoffs) {
        const curProt = (t.protectedValue || '').toLowerCase();
        const curSacr = (t.sacrificedValue || '').toLowerCase();
        const pastProt = (dec.tradeoffs.protectedValue || '').toLowerCase();
        const pastSacr = (dec.tradeoffs.sacrificedValue || '').toLowerCase();

        if (curProt && (pastProt.includes(curProt) || curProt.includes(pastProt))) {
          score += 0.35;
          matchReasons.push('סחרור משותף: שימור ' + t.protectedValue);
        }
        if (curSacr && (pastSacr.includes(curSacr) || curSacr.includes(pastSacr))) {
          score += 0.35;
          matchReasons.push('ויתור משותף: ' + t.sacrificedValue);
        }
      }
    }

    if (deepMechanisms?.operatingPrinciples && dec.principles) {
      for (const p of deepMechanisms.operatingPrinciples) {
        const pLower = p.toLowerCase();
        const pastPrincipleHit = dec.principles.some(dp => dp.toLowerCase().includes(pLower) || pLower.includes(dp.toLowerCase()));
        if (pastPrincipleHit) {
          score += 0.4;
          matchReasons.push('עקרון פעולה חוזר: ' + p);
        }
      }
    }

    // Layer 3: Title and Dilemma Concept Overlap
    const decTokens = new Set(
      (dec.title + ' ' + dec.dilemma)
        .toLowerCase()
        .split(/[\s,.:;״"()!?\-\/]+/)
        .map(w => w.trim())
        .filter(w => w.length >= 3 && !HEBREW_STOPWORDS.has(w))
    );

    let overlapCount = 0;
    for (const token of currentTokens) {
      if (decTokens.has(token)) {
        overlapCount++;
      }
    }

    if (overlapCount >= 1) {
      score += Math.min(0.35, overlapCount * 0.12);
      matchReasons.push('חפיפה קונספטואלית (' + overlapCount + ' מונחים)');
    }

    const normalizedScore = Math.min(0.96, score);

    // Threshold for related precedent candidate: >= 0.3
    if (normalizedScore >= 0.3) {
      const lessonText = dec.lesson || dec.conclusion || dec.outcome || dec.dilemma;
      scoredMatches.push({
        id: dec.id,
        title: dec.title,
        date: dec.date,
        score: normalizedScore,
        matchReason: matchReasons.join(' · ') || 'התאמה קונספטואלית לתקדים העבר',
        lesson: lessonText,
        historicalQuestion: dec.historicalQuestion || ('בהחלטה לגבי "' + dec.title + '" למדת ש: "' + lessonText + '". האם לקח זה מנחה אותך גם כעת?')
      });
    }
  }

  scoredMatches.sort((a, b) => b.score - a.score);

  const topMatches = scoredMatches.slice(0, 4);
  const primaryEcho = topMatches.length > 0 && topMatches[0].score >= 0.35 ? topMatches[0] : null;

  let insightsSummary = '';
  if (topMatches.length > 0) {
    if (topMatches.length === 1) {
      insightsSummary = `תובנת מפתח מתוך "${topMatches[0].title}": ${topMatches[0].lesson}`;
    } else {
      const parts = topMatches.slice(0, 2).map((m, idx) => `(${idx + 1}) ${m.title}: ${m.lesson}`);
      insightsSummary = `סינתזת לקחים מ-${topMatches.length} תקדימי עבר קשורים: ${parts.join(' | ')}`;
    }
  }

  return {
    primaryEcho,
    allRelatedEchoes: topMatches,
    insightsSummary
  };
}

export function findBestOKFPrecedent(
  rawCaptureText: string,
  consideration: string,
  deepMechanisms?: {
    operatingPrinciples?: string[];
    tradeoffs?: Array<{ protectedValue: string; sacrificedValue: string }>;
  },
  userId: string = 'Guy_Kuleski'
): PrecedentMatchResult | null {
  const related = findRelatedOKFPrecedents(rawCaptureText, consideration, deepMechanisms, userId);
  if (related.primaryEcho && related.primaryEcho.score >= 0.35) {
    const allDecs = getAllUserDecisions(userId);
    const matched = allDecs.find(d => d.id === related.primaryEcho!.id);
    if (matched) {
      return {
        matchedPrecedent: matched,
        score: related.primaryEcho.score,
        matchReason: related.primaryEcho.matchReason,
        suggestedQuestion: related.primaryEcho.historicalQuestion || ''
      };
    }
  }
  return null;
}
