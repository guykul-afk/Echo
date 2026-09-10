import { DecisionCase, Option, DecisionSignature, RefinedInsight, FiveHumanDimensions, IlluminationQuestion } from '@echo/shared';
import { RelatedPrecedentItem } from './decisionCatalog.js';

export function getActiveGeminiKey(): string {
  if (typeof window !== 'undefined') {
    const envKey = (window as any).ENV_CONFIG?.GEMINI_API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim().length > 10) {
      return envKey.trim();
    }
    const localKey = localStorage.getItem('GEMINI_API_KEY');
    if (localKey && localKey.trim().length > 10) {
      return localKey.trim();
    }
  }
  try {
    return atob('QVEuQWI4Uk42SWRoT3YyQmt3d2VPM0hOaW96SGdPRm8yNU9XS2Vlb1JOQjRkQ1pvaEdIeWc=');
  } catch {
    return '';
  }
}

export interface EpistemicAnalysisOutput {
  title: string;
  consideration: string;
  centralTension: string;
  goalsPrices: string;
  facts: string;
  assumptions: string;
  assumptionsList: string[];
  missingInfo: string;
  question: string;
  proposedSteps: string[];
  proposedCriteria: string[];
  // OKF Deep Decision Mechanisms (Horizon 2)
  operatingPrinciples?: string[];
  tradeoffs?: Array<{ protectedValue: string; sacrificedValue: string }>;
  boundaryConditions?: string[];
  keyEntities?: Array<{ name: string; type: string }>;
}

export interface AnalysisSessionResult {
  decisionCase: DecisionCase;
  options: Option[];
  signature: DecisionSignature;
  illuminationQuestion: string;
  bespokeQuestion: IlluminationQuestion;
  historicalQuestion?: IlluminationQuestion;
  similarCaseAnalogy?: {
    title: string;
    reason: string;
    strength: string;
    score?: number;
    allRelatedEchoes?: RelatedPrecedentItem[];
    insightsSummary?: string;
  };
  refinedInsight: RefinedInsight;
  proposedSteps?: string[];
}

export async function analyzeCapturedDilemma(
  rawText: string,
  frictionLevel: 'quick' | 'focused' | 'deep' = 'focused',
  currentUserId: string = 'Guy_Kuleski'
): Promise<AnalysisSessionResult> {
  const apiKey = getActiveGeminiKey();
  if (!apiKey) {
    throw new Error('לא נמצא מפתח API פעיל עבור Gemini. אנא בדוק את ההגדרות.');
  }
  const now = Date.now();

  let parsed: EpistemicAnalysisOutput | null = null;
  try {
    const prompt = `אתה מנוע הניתוח האפיסטמי של Echo (הד) - עוזר המאפשר לאדם לראות את החשיבה שלו בצורה נקייה ומדויקת, בלי שיפוטיות ובלי קלישאות גנריות.
הטקסט שנלכד מהמשתמש:
"""${rawText}"""

כללי ברזל לאי-הזיה, חילוץ אונטולוגי (OKF) ודיוק עובדתי (Strict Grounding & Anti-Hallucination):
1. היצמד אך ורק למלל שנלכד ולמשמעות הישירה שלו. אל תמציא פרטים חיצוניים, שמות פרויקטים שלא הוזכרו או נושאים עסקיים שלא קשורים.
2. 'consideration' (אתה שוקל): ניסוח בגוף שני ("אתה שוקל אם...") המגדיר בדיוק מה עומד על הפרק.
3. 'centralTension' (מתח מרכזי): מה עומד מול מה ברמת הערכים, הצרכים והמחירים הספציפיים לדילמה זו.
4. 'goalsPrices' (מטרות ומחירים): "הבנתי שחשוב לך להשיג ולשמור: ..." הממוקד בדיוק בנושא של המשתמש.
5. 'facts' (עובדות קשיחות): מה שידוע בוודאות מתוך דברי המשתמש כרשימת עובדות נפרדות (מערך מיתרים).
6. 'assumptions' (הנחות ופרשנויות): בין 1 ל-3 הנחות מרכזיות שהמשתמש מניח לגבי העתיד או המצב (מערך מיתרים).
7. 'missingInfo' (פער המידע / ציר ההכרעה): מהו הנתון היחיד או השאלה שבירורה יכריע את הכף.
8. 'question' (שאלת חידוד והארה מרכזית): שאלה אחת בלבד, חדה, עמוקה ומאירה, המנוסחת בגוף שני וממוקדת ב-100% בחומר הגלם של הדילמה שנלכדה כעת (ללא ערבוב עם תקדימי עבר או נושאים חיצוניים)!
9. 'proposedSteps': מערך של 1 עד 2 צעדים מעשיים וקונקרטיים המתאימים ישירות לדילמה.
10. 'operatingPrinciples': בין 1 ל-2 עקרונות פעולה או כללי אצבע של שיקול דעת המופעלים בדילמה זו (מערך מיתרים).
11. 'tradeoffs': ויתורים מודעים בין ערך מוגן (protectedValue - מה שומרים בכל מחיר) לבין ערך מוקרב (sacrificedValue - על מה מוותרים או מסתכנים).
12. 'boundaryConditions': סייגים ותנאי סף לקיום ההנחות ("ההנחה תקפה רק אם...").
13. 'keyEntities': מערך של ישויות מרכזיות שהוזכרו במפורש (אנשים, חברות, בנקים, פרויקטים) בפורמט: [{"name": "שם הישות", "type": "person"|"company"|"project"|"concept"}]. אם אין ישות ספציפית, החזר [].

חלץ פלט JSON מדויק בעברית לפי המבנה הבא:
{
  "title": "כותרת קצרה (עד 8 מילים)",
  "consideration": "אתה שוקל...",
  "centralTension": "...",
  "goalsPrices": "הבנתי שחשוב לך...",
  "facts": ["עובדה קשיחה 1", "עובדה קשיחה 2"],
  "assumptions": ["הנחה 1", "הנחה 2"],
  "missingInfo": "...",
  "question": "שאלת חידוד חדה הממוקדת ב-100% בחומר הגלם הנוכחי...",
  "proposedSteps": ["צעד 1", "צעד 2"],
  "proposedCriteria": ["קריטריון מעקב"],
  "operatingPrinciples": ["עקרון פעולה..."],
  "tradeoffs": [{"protectedValue": "ערך מוגן", "sacrificedValue": "ערך מוקרב"}],
  "boundaryConditions": ["סייג..."],
  "keyEntities": [{"name": "שם הישות", "type": "person"}]
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJson) {
        const clean = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
        const obj = JSON.parse(clean);
        
        const formatToBulletLines = (val: any): string => {
          if (!val) return '';
          if (Array.isArray(val)) {
            return val
              .map((s: any) => `• ${String(s).replace(/^[•\-\*\s]+/, '').trim()}`)
              .filter(s => s.length > 2)
              .join('\n');
          }
          if (typeof val === 'string') {
            const items = val
              .split(/\n| • | \u2022 /)
              .map(s => s.replace(/^[•\-\*\s]+/, '').trim())
              .filter(Boolean);
            return items.map(s => `• ${s}`).join('\n');
          }
          return '';
        };

        let assumptionsText = formatToBulletLines(obj.assumptions);
        let assumptionsList = Array.isArray(obj.assumptions) ? obj.assumptions : [assumptionsText];
        let factsText = formatToBulletLines(obj.facts);

        parsed = {
          title: obj.title || rawText.slice(0, 50),
          consideration: obj.consideration || `אתה שוקל: ${rawText}`,
          centralTension: obj.centralTension || 'בחינת החלופות והמחירים הנלווים',
          goalsPrices: obj.goalsPrices || 'איזון בין הרצון להשיג את המטרה לבין המחירים הכרוכים בה',
          facts: factsText || 'פרטי הדילמה כפי שנמסרו בלכידה',
          assumptions: assumptionsText || 'הנחות העבודה המנחות את שיקול הדעת הנוכחי',
          assumptionsList,
          missingInfo: obj.missingInfo || 'הנתון שיאפשר הכרעה מדויקת',
          question: obj.question || 'מהו הגורם האחד שאם יתברר, יכריע את הכף עבורך?',
          proposedSteps: Array.isArray(obj.proposedSteps) && obj.proposedSteps.length > 0 ? obj.proposedSteps : ['בירור ממוקד לפני הכרעה'],
          proposedCriteria: Array.isArray(obj.proposedCriteria) ? obj.proposedCriteria : ['בדיקת תוצאות ההכרעה'],
          operatingPrinciples: Array.isArray(obj.operatingPrinciples) ? obj.operatingPrinciples : [],
          tradeoffs: Array.isArray(obj.tradeoffs) ? obj.tradeoffs : [],
          boundaryConditions: Array.isArray(obj.boundaryConditions) ? obj.boundaryConditions : [],
          keyEntities: Array.isArray(obj.keyEntities) ? obj.keyEntities : []
        };
      }
    } else {
      const errBody = await response.text().catch(() => '');
      throw new Error(`שגיאת תקשורת עם מנוע ה-AI (${response.status}): ${errBody.slice(0, 120)}`);
    }
  } catch (err: any) {
    console.error('[Echo AI Service] Gemini analysis error:', err);
    throw new Error(err?.message || 'שגיאת רשת בעת חיבור למנוע הניתוח של Gemini. אנא בדוק את החיבור לרשת ונסה שנית.');
  }

  if (!parsed) {
    throw new Error('מנוע ה-AI לא הפיק ניתוח עבור הדילמה שנלכדה. אנא נסה שוב.');
  }

  // Authentic OKF Precedent Matching against Backend
  let mockHistorical: IlluminationQuestion | undefined = undefined;
  let analogyData: { 
    title: string; 
    reason: string; 
    strength: string; 
    score?: number;
    allRelatedEchoes?: RelatedPrecedentItem[];
    insightsSummary?: string;
  } | undefined = undefined;

  try {
    const fb = (window as any).firebase;
    if (fb && fb.functions) {
      const retrievePrecedents = fb.functions().httpsCallable('retrievePrecedents');
      const backendRes = await retrievePrecedents({
        rawText,
        consideration: parsed.consideration,
        deepMechanisms: {
          operatingPrinciples: parsed.operatingPrinciples,
          tradeoffs: parsed.tradeoffs
        }
      });
      
      const memoryCheck = backendRes.data?.result;
      if (memoryCheck && memoryCheck.assertions && memoryCheck.assertions.length > 0) {
        const primaryAssertion = memoryCheck.assertions[0];
        
        mockHistorical = {
          id: `hist-${now}`,
          caseId: `dc-${now}`,
          strategy: 'outcome_contract_anchor',
          origin: 'historical_precedent',
          questionText: memoryCheck.confirmationQuestion || memoryCheck.memoryPreamble || `בעבר ציינת ש"${primaryAssertion.statement}". האם זה עדיין תקף?`,
          triggerReason: memoryCheck.retrievalReason || 'התאמה קונספטואלית לתקדים העבר',
          shouldIntervene: true,
          isSecondary: true,
          canSkip: true,
          responseWidget: memoryCheck.shouldConvertToConfirmation ? 'confirmation' : 'text',
          responseOptions: memoryCheck.shouldConvertToConfirmation ? ['כן, לקח רלוונטי', 'לא, הנסיבות שונות'] : undefined,
          createdAt: now
        };

        analogyData = {
          title: "תקדים מהעבר",
          reason: primaryAssertion.statement,
          strength: 'strong',
          score: memoryCheck.retrievalScore || 0.8,
          allRelatedEchoes: memoryCheck.assertions.map((a: any) => ({
            id: a.id,
            title: "תקדים מהעבר",
            score: memoryCheck.retrievalScore || 0.8,
            matchReason: memoryCheck.retrievalReason || '',
            lesson: a.statement
          })),
          insightsSummary: memoryCheck.memoryPreamble
        };
      }
    } else {
      console.warn('Firebase functions not initialized. Skipping backend retrieval.');
    }
  } catch (err) {
    console.warn('Failed to retrieve precedents from backend', err);
  }


  const decisionCase: DecisionCase = {
    id: `dc-${now}`,
    userId: currentUserId,
    title: parsed.title,
    status: 'deliberating',
    family: 'general_deliberation',
    contextStakes: frictionLevel === 'deep' ? 'high' : 'medium',
    contextReversibility: 'partially_reversible',
    contextTimePressure: frictionLevel === 'quick' ? 'high' : 'medium',
    rawCaptureText: rawText.trim(),
    frozenAt: now,
    frictionLevel,
    dimConsideration: parsed.consideration,
    dimGoalsPrices: parsed.goalsPrices,
    dimFacts: parsed.facts,
    dimAssumptions: parsed.assumptions,
    dimMissingInfo: parsed.missingInfo,
    dimReliance: `${parsed.facts} | ${parsed.assumptions}`,
    dimUnknowns: parsed.missingInfo,
    centralTension: parsed.centralTension,
    keyHinge: parsed.missingInfo,
    keyEntities: parsed.keyEntities,
    createdAt: now,
    updatedAt: now
  } as any;

  const bespokeQuestion: IlluminationQuestion = {
    id: `illum-${now}`,
    caseId: decisionCase.id,
    strategy: frictionLevel === 'quick' ? ('no_intervention' as any) : ('clarification' as any),
    questionText: frictionLevel === 'quick' ? '' : parsed.question,
    triggerReason: 'Epistemic Hinge Clarification',
    shouldIntervene: frictionLevel !== 'quick',
    expectedReflectionValue: 0.9,
    responseWidget: 'priority',
    responseOptions: ['החלופה הראשונה', 'החלופה השנייה'],
    isSecondary: false,
    origin: 'current_dilemma',
    createdAt: now
  };

  const refinedInsight: RefinedInsight = {
    before: parsed.title,
    now: parsed.centralTension,
    chosenStep: parsed.proposedSteps[0] || 'בירור מוקדם לפני הכרעה'
  };

  const options: Option[] = [
    {
      id: 'opt-1',
      caseId: decisionCase.id,
      userId: currentUserId,
      title: parsed.proposedSteps[0] || 'צעד ראשון לבחינה',
      origin: 'proposed_by_user',
      wasSelected: false,
      createdAt: now
    },
    {
      id: 'opt-2',
      caseId: decisionCase.id,
      userId: currentUserId,
      title: parsed.proposedSteps[1] || 'צעד חלופי',
      origin: 'proposed_by_user',
      wasSelected: false,
      createdAt: now
    }
  ];

  const signature: DecisionSignature = {
    id: `sig-${now}`,
    caseId: decisionCase.id,
    userId: currentUserId,
    commitmentGradient: 0.75,
    informationCostRatio: 0.85,
    reversibilityDecayDays: 30,
    principalAgentTension: 'sole_actor',
    decisionTempo: 'tactical_weeks'
  };

  return {
    decisionCase,
    options,
    signature,
    illuminationQuestion: parsed.question,
    bespokeQuestion,
    historicalQuestion: mockHistorical,
    similarCaseAnalogy: analogyData,
    refinedInsight,
    proposedSteps: parsed.proposedSteps
  };
}

export interface AnswerRefinementResult {
  conclusion: string;
  proposedSteps: string[];
  chosenStep: string;
}

export async function refineAnswerWithGemini(params: {
  dilemma: string;
  centralTension?: string;
  goalsPrices?: string;
  facts?: string;
  assumptions?: string;
  missingInfo?: string;
  question: string;
  answerText: string;
}): Promise<AnswerRefinementResult> {
  const apiKey = getActiveGeminiKey();
  if (!apiKey) {
    throw new Error('לא נמצא מפתח API פעיל עבור Gemini.');
  }

  const prompt = `אתה מנוע הניתוח האפיסטמי של Echo (הד) - עוזר המאפשר לאדם להבין את שיקול הדעת שלו ולזקק פעולה קונקרטית.
נתוני הדילמה שנלכדו:
- הדילמה (אתה שוקל): """${params.dilemma}"""
- המתח המרכזי: """${params.centralTension || ''}"""
- מטרות ומחירים: """${params.goalsPrices || ''}"""
- עובדות קשיחות: """${params.facts || ''}"""
- הנחות המוצא: """${params.assumptions || ''}"""
- פער המידע / ציר ההכרעה: """${params.missingInfo || ''}"""
- שאלת החידוד שנשאלה: """${params.question}"""
- מענה המשתמש לשאלה: """${params.answerText}"""

כללי ברזל קריטיים (Strict Grounding, Anti-Hallucination & Anti-Parroting):
1. איסור מוחלט על חזרה שטחית (תוכי) על מילות המשתמש! אל תעתיק פשוט את המענה שלו לשדה המסקנה או לשדה הצעד הנבחר.
2. ב-"conclusion" (מסקנה מזוקקת): בצע עיבוד מעמיק של התשובה מול הדילמה המקורית והעובדות. נסח במשפט אחד או שניים חדים ובהירים מה התחדד, הוכרע או השתנה בהבנת המצב לאור תשובתו של המשתמש.
3. ב-"proposedSteps" (פעולות מומלצות): הצע בין 1 ל-3 חלופות קונקרטיות, מעשיות ויישומיות לפעולה מיידית או לבירור ממוקד שהמערכת מציעה (הצעת המערכת). הצעדים חייבים להיגזר ישירות מהדילמה וממענה המשתמש (למשל: תיאום ציפיות, בדיקת תשתית, התקנת עמדה, פיילוט מתוחם).
4. ב-"chosenStep" (הצעד הנבחר): בחר את הצעד המומלץ והמידי ביותר מבין הפעולות המומלצות, או נסח צעד פעולה קונקרטי יחיד ומדויק לביצוע.

חלץ פלט JSON מדויק בעברית לפי המבנה הבא:
{
  "conclusion": "משפט חד ומזוקק המסביר מה הוכרע והתחדד בשיקול הדעת...",
  "proposedSteps": [
    "חלופה 1 לפעולה קונקרטית...",
    "חלופה 2 לפעולה קונקרטית..."
  ],
  "chosenStep": "הצעד הקונקרטי והמידי שנבחר לביצוע"
}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`שגיאת שרת בניתוח מענה (${response.status}): ${errText.slice(0, 100)}`);
    }

    const data = await response.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawJson) {
      const clean = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);

      const steps: string[] = Array.isArray(parsed.proposedSteps) && parsed.proposedSteps.length > 0
        ? parsed.proposedSteps.slice(0, 3)
        : [parsed.chosenStep || 'בירור ממוקד לפני הכרעה'];

      return {
        conclusion: parsed.conclusion || `התחדד כי: ${params.answerText}`,
        proposedSteps: steps,
        chosenStep: parsed.chosenStep || steps[0] || 'בירור ממוקד לפני הכרעה'
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('[Echo AI Service] Refine answer error:', err);
    throw new Error(err?.message || 'שגיאה בניתוח המענה מול Gemini.');
  }

  throw new Error('לא התקבל ניתוח מענה תקין ממנוע ה-AI.');
}
