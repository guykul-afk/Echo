import {
  DecisionCase,
  DecisionProfileData,
  DecisionProfileFlowStep,
  DecisionProfileAnchor,
  DecisionProfileTrap,
  DecisionProfileEvolution
} from '@echo/shared';
import { IAiProvider } from '../ai/provider.interface.js';
import { AiProviderFactory } from '../ai/factory.js';

export interface ProfileGenerationOptions {
  gender?: 'male' | 'female';
  userName?: string;
}

export class DecisionProfileService {
  private aiProvider: IAiProvider;
  private static profileCache: Map<string, DecisionProfileData> = new Map();

  constructor(aiProvider?: IAiProvider) {
    this.aiProvider = aiProvider || AiProviderFactory.getProvider();
  }

  /**
   * Clears the cache for testing and simulations
   */
  static clearCache(userId?: string) {
    if (userId) {
      DecisionProfileService.profileCache.delete(userId);
    } else {
      DecisionProfileService.profileCache.clear();
    }
  }

  /**
   * Analyzes the chronological decisions of a user and produces a dynamic DecisionProfileData.
   * Compares early decisions vs. recent decisions to detect evolution and trajectory shifts.
   */
  async generateProfile(
    userId: string,
    decisions: DecisionCase[],
    options: ProfileGenerationOptions = {}
  ): Promise<DecisionProfileData> {
    const isFemale = options.gender === 'female' || userId.toLowerCase().includes('maya') || userId.toLowerCase().includes('מיכל');
    const sortedCases = [...decisions].sort((a, b) => (a.frozenAt || 0) - (b.frozenAt || 0));
    const totalCount = sortedCases.length;

    // If 0 decisions, return base emerging state
    if (totalCount === 0) {
      return this.createEmptyProfile(userId, isFemale);
    }

    // 1. Chronological Slicing: Early vs. Late
    const midpoint = Math.max(1, Math.floor(totalCount / 2));
    const earlyCases = sortedCases.slice(0, midpoint);
    const lateCases = sortedCases.slice(midpoint);

    // 2. Metrics calculation
    const earlyMetrics = this.analyzeCasesMetrics(earlyCases);
    const lateMetrics = this.analyzeCasesMetrics(lateCases.length > 0 ? lateCases : earlyCases);
    const overallMetrics = this.analyzeCasesMetrics(sortedCases);

    // 3. Detect Evolution / Shift
    const evolution = this.detectEvolution(earlyCases, lateCases, earlyMetrics, lateMetrics, isFemale);

    // 4. Try LLM synthesis for rich nuanced text if available, otherwise deterministic
    try {
      const llmProfile = await this.synthesizeWithLLM(userId, sortedCases, evolution, isFemale, options.userName);
      if (llmProfile) {
        DecisionProfileService.profileCache.set(userId, llmProfile);
        return llmProfile;
      }
    } catch (err) {
      console.warn('[DecisionProfileService] LLM synthesis fallback to deterministic engine:', err);
    }

    // 5. Grounded Deterministic Profile Synthesis
    const deterministicProfile = this.createDeterministicProfile(
      userId,
      sortedCases,
      overallMetrics,
      evolution,
      isFemale
    );

    DecisionProfileService.profileCache.set(userId, deterministicProfile);
    return deterministicProfile;
  }

  getProfile(userId: string): DecisionProfileData | undefined {
    return DecisionProfileService.profileCache.get(userId);
  }

  private analyzeCasesMetrics(cases: DecisionCase[]) {
    let extremistanCount = 0;
    let mediocristanCount = 0;
    let internalLocusCount = 0;
    let consensusMentions = 0;
    let resultsOrientationMentions = 0;
    let downsideProtectionCount = 0;
    let upsideCaptureCount = 0;

    for (const c of cases) {
      const anyC = c as any;
      const rawText = c.rawCaptureText || anyC.rawVerbatim || '';
      const goalText = c.dimGoalsPrices || anyC.goal || anyC.dimGoal || '';
      const riskBadge = anyC.riskBadge || (c.deepMechanisms?.decisionDriver === 'downside_protection' ? 'Mediocristan' : 'Extremistan');
      const locusBadge = anyC.locusBadge || (c.deepMechanisms?.agencyCenter === 'internal' ? 'פנימי' : 'מעורב');
      const text = `${c.title || ''} ${c.dimConsideration || ''} ${goalText} ${rawText}`.toLowerCase();
      
      if (riskBadge?.includes('Extremistan') || text.includes('סיכון גבוה') || text.includes('אגרסיבי') || text.includes('מהפכה') || text.includes('הנפקה')) {
        extremistanCount++;
      } else {
        mediocristanCount++;
      }

      if (locusBadge?.includes('פנימי')) {
        internalLocusCount++;
      }

      if (
        text.includes('קונצנזוס') ||
        text.includes('שלום בית') ||
        text.includes('הרמוניה') ||
        text.includes('שיתוף') ||
        text.includes('לא לפגוע') ||
        text.includes('זהיר') ||
        c.deepMechanisms?.decisionDriver === 'downside_protection'
      ) {
        consensusMentions++;
        downsideProtectionCount++;
      }

      if (
        text.includes('שורה תחתונה') ||
        text.includes('רווחיות') ||
        text.includes('פיטורין') ||
        text.includes('פיבוט') ||
        text.includes('יעדים') ||
        text.includes('חותכת') ||
        text.includes('לחתוך') ||
        text.includes('תוצאות') ||
        c.deepMechanisms?.decisionDriver === 'upside_capture'
      ) {
        resultsOrientationMentions++;
        upsideCaptureCount++;
      }
    }


    const n = Math.max(1, cases.length);
    return {
      n,
      riskRatio: extremistanCount / n,
      consensusRatio: consensusMentions / n,
      resultsRatio: resultsOrientationMentions / n,
      internalLocusRatio: internalLocusCount / n,
      downsideProtectionCount,
      upsideCaptureCount
    };
  }

  private detectEvolution(
    earlyCases: DecisionCase[],
    lateCases: DecisionCase[],
    early: ReturnType<typeof this.analyzeCasesMetrics>,
    late: ReturnType<typeof this.analyzeCasesMetrics>,
    isFemale: boolean
  ): DecisionProfileEvolution | undefined {
    // Only detect evolution if we have enough decisions (at least 3-4 across time)
    if (earlyCases.length < 1 || lateCases.length < 1 || earlyCases.length + lateCases.length < 3) {
      return undefined;
    }

    const riskShift = late.riskRatio - early.riskRatio;
    const consensusDrop = early.consensusRatio - late.consensusRatio;
    const resultsSpike = late.resultsRatio - early.resultsRatio;

    // Check for transition from consensus/caution to strategic/risk/results
    if ((riskShift > 0.2 || resultsSpike > 0.2) && (early.consensusRatio > 0.3 || consensusDrop > 0.1)) {
      // Find inflection point: first case in lateCases with high risk or results orientation
      const inflectionCase = lateCases.find(c => {
        const text = `${c.title} ${c.dimConsideration}`.toLowerCase();
        return text.includes('פיטורין') || text.includes('להציל') || text.includes('חיתוך') || text.includes('פיבוט') || text.includes('סיכון');
      }) || lateCases[0];

      return {
        fromStyle: isFemale ? 'מנהלת מחפשת-קונצנזוס ושומרת הרמוניה' : 'מנהל מחפש-קונצנזוס ושומר הרמוניה',
        toStyle: isFemale ? 'מנהיגה אסטרטגית מונחית-תוצאות ונטילת סיכונים' : 'מנהיג אסטרטגי מונחה-תוצאות ונטילת סיכונים',
        trajectoryShiftBadge: 'מעבר מובהק: זהירות והרמוניה ← הכרעה אסטרטגית וסיכון',
        narrative: isFemale
          ? 'ניכר תהליך הבשלה מובהק: בתחילת הדרך החלטותייך התמקדו בהגנה על שקט תעשייתי, שמירה על קונצנזוס צוותי ושנאת סיכון. עם צבירת האחריות, ניכר מעבר להכרעות חדות מבוססות שורה תחתונה, נכונות לשלם מחירים חברתיים למען הצלחת המערכת, ונכונות גבוהה ליטול סיכונים אסטרטגיים.'
          : 'ניכר תהליך הבשלה מובהק: בתחילת הדרך החלטותיך התמקדו בהגנה על שקט תעשייתי, שמירה על קונצנזוס צוותי ושנאת סיכון. עם צבירת האחריות, ניכר מעבר להכרעות חדות מבוססות שורה תחתונה, נכונות לשלם מחירים חברתיים למען הצלחת המערכת, ונכונות גבוהה ליטול סיכונים אסטרטגיים.',
        inflectionPointCaseTitle: inflectionCase?.title,
        inflectionPointCaseId: inflectionCase?.id
      };
    }

    return undefined;
  }

  private createEmptyProfile(userId: string, isFemale: boolean): DecisionProfileData {
    return {
      userId,
      capturesCount: 0,
      mainStyle: {
        title: isFemale ? 'פרופיל בתהליך התגבשות' : 'פרופיל בתהליך התגבשות',
        description: isFemale
          ? 'ככל שתתעדי יותר החלטות והתלבטויות במערכת, המראה האישית תזהה את דפוסי החשיבה והעוגנים הייחודיים שלך.'
          : 'ככל שתתעד יותר החלטות והתלבטויות במערכת, המראה האישית תזהה את דפוסי החשיבה והעוגנים הייחודיים שלך.',
        prominentTendency: 'למידה ראשונית',
        consistencyMetric: 'נדרשות לפחות 3 החלטות'
      },
      flowSteps: [
        { stepNumber: '01', title: 'העלאת הדילמה', description: 'מיפוי השיקולים הראשוניים וההנחות המרכזיות.' },
        { stepNumber: '02', title: 'בחינת העובדות', description: 'הפרדה בין רעש לבין עובדות מוצקות.' },
        { stepNumber: '03', title: 'שאלת הארה', description: 'אתגור נקודות עיוורות ומחירי ויתור.' },
        { stepNumber: '04', title: 'הכרעה', description: 'בחירת צעד בר-ביצוע והתקדמות.' }
      ],
      anchors: [],
      traps: [],
      updatedAt: Date.now()
    };
  }

  private createDeterministicProfile(
    userId: string,
    cases: DecisionCase[],
    metrics: ReturnType<typeof this.analyzeCasesMetrics>,
    evolution: DecisionProfileEvolution | undefined,
    isFemale: boolean
  ): DecisionProfileData {
    const totalCount = cases.length;

    // Archetype determination
    let mainTitle = '';
    let mainDesc = '';
    let prominentTendency = '';

    if (evolution) {
      mainTitle = isFemale ? 'מנהיגה אסטרטגית מונחית-תוצאות' : 'מנהיג אסטרטגי מונחה-תוצאות';
      mainDesc = isFemale
        ? 'את פועלת מתוך ראייה מערכתית ארוכת טווח. למדת להעדיף הצלחה אסטרטגית ושורה תחתונה על פני נוחות רגעית או קונצנזוס חברתי. אינך נרתעת מחיכוך או מנטילת סיכונים כשהיעדים מחייבים זאת.'
        : 'אתה פועל מתוך ראייה מערכתית ארוכת טווח. למדת להעדיף הצלחה אסטרטגית ושורה תחתונה על פני נוחות רגעית או קונצנזוס חברתי. אינך נרתע מחיכוך או מנטילת סיכונים כשהיעדים מחייבים זאת.';
      prominentTendency = isFemale ? 'הכרעה עניינית ונטילת אחריות ארגונית' : 'הכרעה עניינית ונטילת אחריות ארגונית';
    } else if (metrics.consensusRatio > 0.4 || metrics.riskRatio === 0) {
      mainTitle = isFemale ? 'מחפשת קונצנזוס וקרקע בטוחה' : 'מחפש קרקע מוצקה לפני תנועה';
      mainDesc = isFemale
        ? 'את מעריכה יציבות ושקט בצוות. לפני שאת יוצאת לדרך, חשוב לך להבטיח גיבוי, הסכמה רחבה והגנה מפני הפתעות בלתי צפויות. את מעדיפה לוותר על הימור מהיר לטובת ודאות והרמוניה.'
        : 'אתה אדם שמעריך יציבות ושקט נפשי. לפני שאתה יוצא לדרך, חשוב לך להבין בדיוק איפה אתה עומד. אתה מעדיף לוותר על הבטחה לרווח מהיר או הימור מפתה, העיקר לדעת שלא תופתע בהמשך.';
      prominentTendency = isFemale ? 'שמירה על הרמוניה וזהירות מבורכת' : 'לקיחת אחריות אישית מלאה';
    } else {
      mainTitle = isFemale ? 'שוקלת ומאזנת סיכונים' : 'שוקל ומאזן סיכונים';
      mainDesc = isFemale
        ? 'את בוחנת כל דילמה בשילוב של נתונים ואינטואיציה מעשית, ומשתדלת לגדר נזקים תוך שמירה על קצב התקדמות.'
        : 'אתה בוחן כל דילמה בשילוב של נתונים ואינטואיציה מעשית, ומשתדל לגדר נזקים תוך שמירה על קצב התקדמות.';
      prominentTendency = 'איזון בין נתונים להשלכות';
    }

    // Dynamic Flow Steps
    const flowSteps: DecisionProfileFlowStep[] = evolution
      ? [
          {
            stepNumber: '01',
            title: isFemale ? 'הגדרת היעד העליון' : 'הגדרת היעד העליון',
            description: isFemale ? 'את מתחילה מהשורה התחתונה: מה התוצאה האסטרטגית שחייבת לקרות.' : 'אתה מתחיל מהשורה התחתונה: מה התוצאה האסטרטגית שחייבת לקרות.'
          },
          {
            stepNumber: '02',
            title: isFemale ? 'מיפוי מחירים וויתורים' : 'מיפוי מחירים וויתורים',
            description: isFemale ? 'את מבודדת רגשות ושואלת ביושר: על מה נידרש לוותר כדי להשיג את היעד.' : 'אתה מבודד רגשות ושואל ביושר: על מה נידרש לוותר כדי להשיג את היעד.'
          },
          {
            stepNumber: '03',
            title: isFemale ? 'בדיקת היתכנות וסיכון' : 'בדיקת היתכנות וסיכון',
            description: isFemale ? 'בחינה קרה של המספרים והמשאבים מול תרחישי קיצון.' : 'בחינה קרה של המספרים והמשאבים מול תרחישי קיצון.'
          },
          {
            stepNumber: '04',
            title: isFemale ? 'חיתוך מהיר ויישור קו' : 'חיתוך מהיר ויישור קו',
            description: isFemale ? 'ברגע שההכרעה התקבלה, את רצה לביצוע ללא היסוסים או חרטות.' : 'ברגע שההכרעה התקבלה, אתה רץ לביצוע ללא היסוסים או חרטות.'
          }
        ]
      : [
          {
            stepNumber: '01',
            title: 'צלילה למספרים ולשטח',
            description: isFemale ? 'את לא מסתפקת בהשערות. ישר בודקת עלויות ומוודאת שהנתונים מסתדרים.' : 'אתה לא מסתפק בהשערות. ישר בודק עלויות ומוודא שהנתונים מסתדרים.'
          },
          {
            stepNumber: '02',
            title: "בדיקת 'מה התרחיש הכי גרוע'",
            description: isFemale ? 'הדבר הראשון שמעסיק אותך הוא איפה הנפילה עלולה לקרות ואיך מונעים אותה.' : 'הדבר הראשון שמעסיק אותך הוא איפה הנפילה עלולה לקרות ואיך מונעים אותה.'
          },
          {
            stepNumber: '03',
            title: 'בחינת המצפן הפנימי והצוות',
            description: isFemale ? 'את עוצרת לבדוק האם זה פוגע באנשים והאם יש הסכמה בקרב השותפים.' : 'אתה עוצר לבדוק האם זה יושב טוב עם הערכים שלך והאם השותפים מיושרים.'
          },
          {
            stepNumber: '04',
            title: 'חיתוך שקט והתקדמות',
            description: isFemale ? 'ברגע שהושגה בהירות, את מתקדמת בזהירות ומגדרת סיכונים.' : 'ברגע שקיבלת את ההחלטה, אתה הולך איתה עד הסוף.'
          }
        ];

    // Anchors from actual cases
    const anchors: DecisionProfileAnchor[] = cases.slice(-3).map((c, idx) => {
      const anyC = c as any;
      const rawText = c.rawCaptureText || anyC.rawVerbatim || '';
      const goalText = c.dimGoalsPrices || anyC.goal || anyC.dimGoal || 'השגת יעדים';
      return {
        id: `anchor-${c.id || idx}`,
        title: c.title || 'הכרעה עניינית בשטח',
        tag: evolution ? 'מיקוד אסטרטגי' : 'זהירות מבורכת',
        description: isFemale
          ? `הפגנת נחישות לחדד את המטרה (${goalText}) מבלי להתפזר על שיקולי סרק.`
          : `הפגנת נחישות לחדד את המטרה (${goalText}) מבלי להתפזר על שיקולי סרק.`,
        caseTitle: c.title || 'מקרה מתועד',
        caseId: c.id,
        authenticDilemmaQuote: rawText.slice(0, 120),
        systemReflection: c.dimConsideration?.slice(0, 120)
      };
    });

    // Traps from actual cases
    const traps: DecisionProfileTrap[] = cases.slice(0, 2).map((c, idx) => {
      const anyC = c as any;
      const rawText = c.rawCaptureText || anyC.rawVerbatim || '';
      const firstAssumption = Array.isArray(c.dimAssumptions) ? c.dimAssumptions[0] : (c.dimAssumptions || rawText.slice(0, 100));
      return {
        id: `trap-${c.id || idx}`,
        title: idx === 0 ? 'הפיתוי לרצות את כולם' : 'תשלום מחיר על דחיית עימות',
        tag: idx === 0 ? 'מלכודת קונצנזוס' : 'חיכוך נמנע',
        description: isFemale
          ? 'נטייה להשהות פעולה חדה בתקווה שפתרון ביניים ישמור על שביעות רצון של כלל הצדדים.'
          : 'נטייה להשהות פעולה חדה בתקווה שפתרון ביניים ישמור על שביעות רצון של כלל הצדדים.',
        caseTitle: c.title || 'מקרה מוקדם',
        caseId: c.id,
        authenticAssumptionQuote: firstAssumption,
        systemReflection: 'המערכת חידדה שפשרה מוקדמת גובה מחיר מצטבר גבוה יותר בטווח הארוך.'
      };
    });

    return {
      userId,
      capturesCount: totalCount,
      mainStyle: {
        title: mainTitle,
        description: mainDesc,
        prominentTendency,
        consistencyMetric: evolution ? 'טרנספורמציה מזוהה' : 'עקביות לאורך זמן'
      },
      flowSteps,
      anchors,
      traps,
      evolution,
      updatedAt: Date.now()
    };
  }

  private async synthesizeWithLLM(
    userId: string,
    cases: DecisionCase[],
    evolution: DecisionProfileEvolution | undefined,
    isFemale: boolean,
    userName?: string
  ): Promise<DecisionProfileData | null> {
    if (!this.aiProvider.callModel) return null;

    const prompt = `
You are the Decision Profile Engine for ECHO.
Analyze this user's decision history to construct their exact Decision Profile view.

USER CONTEXT:
- Name/ID: ${userName || userId}
- Gender: ${isFemale ? 'FEMALE (Use feminine Hebrew grammar: את שוקלת, החלטותייך, למדת, אינך נרתעת)' : 'MALE (Use masculine Hebrew grammar: אתה שוקל, החלטותיך, למדת, אינך נרתע)'}
- Total Decisions: ${cases.length}
- Detected Evolution: ${evolution ? JSON.stringify(evolution) : 'None / Consistent'}

DECISION CASES SUMMARY (Chronological):
${cases.map((c, i) => {
  const anyC = c as any;
  return `Case #${i + 1} [ID: ${c.id}]:
Title: ${c.title}
Verbatim: ${c.rawCaptureText || anyC.rawVerbatim || ''}
Consideration: ${c.dimConsideration || ''}
Goal: ${c.dimGoalsPrices || anyC.goal || anyC.dimGoal || ''}
Risk: ${anyC.riskBadge || (c.deepMechanisms?.decisionDriver === 'downside_protection' ? 'Mediocristan' : 'Extremistan')}
Locus: ${anyC.locusBadge || (c.deepMechanisms?.agencyCenter === 'internal' ? 'Internal' : 'External')}
`;
}).join('\n---\n')}

TASK:
Return a JSON object conforming to DecisionProfileData schema:
{
  "mainStyle": {
    "title": "Short powerful archetype title (e.g. 'מחפשת קונצנזוס וקרקע בטוחה' or 'מנהיגה אסטרטגית מונחית-תוצאות')",
    "description": "Rich 2-3 sentences explaining their core decision-making personality",
    "prominentTendency": "One highlighted key trait",
    "consistencyMetric": "e.g. 'טרנספורמציה מזוהה' if changed, or 'עקביות לאורך זמן'"
  },
  "flowSteps": [
    { "stepNumber": "01", "title": "Step 1 name", "description": "Short explanation" },
    { "stepNumber": "02", "title": "Step 2 name", "description": "Short explanation" },
    { "stepNumber": "03", "title": "Step 3 name", "description": "Short explanation" },
    { "stepNumber": "04", "title": "Step 4 name", "description": "Short explanation" }
  ],
  "anchors": [
    {
      "id": "anchor-1",
      "title": "Strength title",
      "tag": "Short badge (e.g. 'מיקוד אסטרטגי' or 'אומץ ניהולי')",
      "description": "Description of why this strength works well",
      "caseTitle": "Title of the case from the list above",
      "caseId": "Actual case ID from list above",
      "authenticDilemmaQuote": "Brief quote from that case",
      "systemReflection": "System insight about that case"
    }
  ],
  "traps": [
    {
      "id": "trap-1",
      "title": "Pitfall title",
      "tag": "Short warning badge",
      "description": "Description of the blindspot",
      "caseTitle": "Title of case where it appeared",
      "caseId": "Actual case ID",
      "authenticAssumptionQuote": "Quote from assumption or raw verbatim",
      "systemReflection": "Lesson learned"
    }
  ]
}

STRICT JSON ONLY. No markdown wrappers.
`;

    const rawResponse = await this.aiProvider.callModel(prompt);
    if (!rawResponse) return null;


    const cleaned = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      userId,
      capturesCount: cases.length,
      mainStyle: parsed.mainStyle,
      flowSteps: parsed.flowSteps,
      anchors: parsed.anchors || [],
      traps: parsed.traps || [],
      evolution,
      updatedAt: Date.now()
    };
  }
}
