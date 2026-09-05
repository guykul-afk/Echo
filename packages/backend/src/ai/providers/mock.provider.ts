import { IAiProvider, EpistemicExtractionResult, ExtractedSignatureDTO } from '../provider.interface.js';
import { CognitiveAnalysisResult } from '../../prompts/cognitive-engine.prompt.js';

export class MockAiProvider implements IAiProvider {
  /**
   * Tier 1: Dedicated Transcribe Simulation
   */
  async transcribeAudio(audioBuffer: Buffer, _mimeType?: string): Promise<string> {
    const raw = audioBuffer.toString('utf8');
    if (raw && raw.length > 5 && !raw.includes('\u0000')) {
      return raw.trim();
    }
    return `אני שוקל לקחת את התפקיד. השכר טוב יותר, אבל אני חושש שלא יהיה לי זמן לילדים. אולי אני סתם מפחד משינוי.`;
  }

  async extractEpistemicSchema(rawText: string, _activeEraContext?: string): Promise<EpistemicExtractionResult> {
    const lower = rawText.toLowerCase();

    // Case 1: Job Offer & Family Balance
    if (lower.includes('תפקיד') || lower.includes('ילדים') || lower.includes('שכר') || lower.includes('job')) {
      return {
        title: 'שקילת מעבר לתפקיד חדש מול זמן עם הילדים',
        family: 'career_transition',
        goal: 'התקדמות מקצועית והכנסה גבוהה יותר לצד שימור נוכחות בבית',
        fourDimensions: {
          consideration: 'מעבר לתפקיד חדש',
          goalsPrices: 'התקדמות והכנסה גבוהה יותר, תוך שמירה על זמן ונוכחות בבית',
          reliance: 'הצעת שכר משופרת, חשש כללי מפגיעה בזמינות',
          unknowns: 'מה יהיו שעות העבודה והזמינות בערבים בפועל'
        },
        statements: [
          { text: 'הוצעה הצעה לשכר טוב יותר', role: 'observation', confidenceScore: 0.98 },
          { text: 'קיים חשש מחוסר זמן לילדים', role: 'evaluation', confidenceScore: 0.95 },
          { text: 'התפקיד ידרוש שעות מרובות ללא גמישות', role: 'assumption', confidenceScore: 0.88 },
          { text: 'שעות העבודה וציפיות הזמינות בפועל', role: 'unknown', confidenceScore: 0.92 }
        ],
        options: [
          'קבלת התפקיד במתכונתו הנוכחית',
          'בירור ציפיות זמינות ובקשת יום קבוע ללא עבודה בערב',
          'דחיית ההצעה והישארות בתפקיד הנוכחי'
        ],
        contextStakes: 'high',
        contextReversibility: 'partially_reversible',
        contextTimePressure: 'medium',
        signature: {
          commitmentGradient: 0.75,
          informationCostRatio: 0.9,
          reversibilityDecayDays: 60,
          principalAgentTension: 'sole_actor',
          decisionTempo: 'tactical_weeks'
        },
        illuminationQuestion: 'אם אי אפשר לקבל גם שכר מלא וגם גמישות מלאה, איזה בירור קטן לפני מתן תשובה יוכל לעזור לך להחליט?',
        refinedInsight: {
          before: 'חשש כללי שהתפקיד יפגע בזמן עם הילדים או שזה סתם פחד משינוי',
          now: 'החשש ממוקד בזמינות בשעות הערב שעדיין לא בוררה ישירות',
          chosenStep: 'לשאול את המנהל על ציפיות הזמינות בערבים לפני מתן תשובה'
        }
      };
    }

    // Case 2: Atlas Project
    if (lower.includes('אטלס') || lower.includes('atlas')) {
      return {
        title: 'האם להמשיך להשקיע בפרויקט אטלס',
        family: 'continue_or_stop',
        goal: 'אימות היתכנות מסחרית מבלי לבזבז קיבולת צוות מוגבלת',
        fourDimensions: {
          consideration: 'המשך השקעה בפרויקט אטלס לעוד 3 חודשים',
          goalsPrices: 'אימות נכונות לשלם מבלי להקריב את כל משאבי הפיתוח',
          reliance: 'שני לקוחות פוטנציאליים רוצים לבדוק את המוצר, השקענו כבר 200K',
          unknowns: 'האם נכונות לשלם מחייבת 3 חודשים או ניתנת לבדיקה מהירה'
        },
        statements: [
          { text: 'אין לקוח משלם עדיין', role: 'observation', confidenceScore: 0.98 },
          { text: 'שני לקוחות פוטנציאליים רוצים לבדוק את המוצר', role: 'observation', confidenceScore: 0.95 },
          { text: 'המוצר נראה הרבה יותר טוב', role: 'evaluation', confidenceScore: 0.92 },
          { text: 'הלקוחות המתעניינים יסכימו להמיר לשימוש בתשלום', role: 'assumption', confidenceScore: 0.89 },
          { text: 'האם נכונות לשלם מחייבת 3 חודשי פיתוח נוספים', role: 'unknown', confidenceScore: 0.85 }
        ],
        options: [
          'להמשיך השקעה למשך 3 חודשים נוספים',
          'להציע פיילוט בתשלום בתוך שבועיים'
        ],
        contextStakes: 'high',
        contextReversibility: 'partially_reversible',
        contextTimePressure: 'medium',
        signature: {
          commitmentGradient: 0.8,
          informationCostRatio: 0.9,
          reversibilityDecayDays: 90,
          principalAgentTension: 'team_alignment',
          decisionTempo: 'tactical_weeks'
        },
        illuminationQuestion: 'האם קיימת בדיקה קטנה או פיילוט קצר שיכולים לאמת נכונות לשלם לפני התחייבות ל-3 חודשים?',
        refinedInsight: {
          before: 'התלבטות בין השקעת 3 חודשים לבין נטישת הפרויקט',
          now: 'התחדד שניתן לבצע בדיקת נכונות לשלם זולה תוך שבועיים',
          chosenStep: 'להציע לשני הלקוחות פיילוט ממוקד בתשלום'
        }
      };
    }

    // Default Fallback
    return {
      title: 'החלטה תחת אי-ודאות',
      family: 'general_deliberation',
      goal: 'קבלת החלטה מושכלת ומדויקת',
      fourDimensions: {
        consideration: rawText.slice(0, 100),
        goalsPrices: 'השגת המטרה במינימום מחיר וסיכון',
        reliance: 'הנחות עבודה ונתונים ראשוניים',
        unknowns: 'מידע חסר לבחינה מחודשת'
      },
      statements: [
        { text: rawText.slice(0, 80), role: 'observation', confidenceScore: 0.9 },
        { text: 'קיימת חלופה מרכזית שנבחנת', role: 'assumption', confidenceScore: 0.8 }
      ],
      options: ['אימוץ הכיוון המוביל', 'בחינת דרך ביניים'],
      contextStakes: 'medium',
      contextReversibility: 'partially_reversible',
      contextTimePressure: 'medium',
      signature: {
        commitmentGradient: 0.5,
        informationCostRatio: 0.5,
        reversibilityDecayDays: 30,
        principalAgentTension: 'sole_actor',
        decisionTempo: 'tactical_weeks'
      },
      illuminationQuestion: 'אם יתברר שהפרט המרכזי שונה, האם תשקול אחרת?',
      refinedInsight: {
        before: rawText.slice(0, 80),
        now: 'הדילמה נוסחה והוגדרו כיווני פעולה',
        chosenStep: 'אימות ההנחה המרכזית'
      }
    };
  }

  async extractCognitiveEngine(rawText: string): Promise<CognitiveAnalysisResult> {
    const lower = rawText.toLowerCase();

    if (lower.includes('תפקיד') || lower.includes('ילדים') || lower.includes('שכר') || lower.includes('job')) {
      return {
        humanDimensions: {
          consideration: 'מעבר לתפקיד חדש',
          goalsPrices: 'התקדמות והכנסה גבוהה יותר, תוך שמירה על זמן ונוכחות בבית',
          reliance: 'הצעת שכר טובה יותר, חשש כללי מפגיעה בזמינות',
          unknowns: 'מה יהיו שעות העבודה והזמינות בערבים בפועל'
        },
        epistemicState: {
          facts: ['השכר טוב יותר'],
          assumptions: ['אולי אני סתם מפחד משינוי', 'התפקיד יפגע בזמן עם הילדים'],
          unknowns: ['מה יהיו שעות העבודה בפועל'],
          affect: 'anxious',
          riskClass: 'mediocristan',
          reversibility: 'partially_reversible',
          contradictions: ['רצון בהתקדמות ושכר מול חשש מפגיעה בזמן בית'],
          locusOfControl: 'internal',
          conviction: 'moderate'
        },
        illuminationQuestion: {
          strategy: 'competing_goals',
          questionText: 'אם אי אפשר לקבל את שניהם במלואם, על מה פחות תרצה לוותר?',
          triggerReason: 'שתי מטרות מתחרות: הכנסה מול נוכחות בבית',
          canSkip: true
        },
        refinedInsight: {
          before: 'חשש שהתפקיד יפגע בזמן עם הילדים',
          now: 'החשש מתמקד בזמינות בערבים שעדיין לא בוררה',
          chosenStep: 'לשאול את המנהל על ציפיות הזמינות בערב לפני מתן תשובה'
        }
      };
    }

    if (lower.includes('אטלס') || lower.includes('atlas')) {
      return {
        humanDimensions: {
          consideration: 'המשך השקעה בפרויקט אטלס',
          goalsPrices: 'אימות היתכנות מסחרית מבלי לשרוף משאבים',
          reliance: 'שני לקוחות רוצים לבדוק, השקעה של 200K',
          unknowns: 'האם נכונות לשלם מחייבת 3 חודשים נוספים'
        },
        epistemicState: {
          facts: ['אין לקוח משלם עדיין', 'שני לקוחות פוטנציאליים רוצים לבדוק את המוצר'],
          assumptions: ['הלקוחות המתעניינים יסכימו להמיר לשימוש בתשלום', 'המוצר החדש נראה הרבה יותר טוב'],
          unknowns: ['האם נכונות לשלם מחייבת 3 חודשי פיתוח נוספים'],
          affect: 'anxious',
          riskClass: 'mediocristan',
          reversibility: 'partially_reversible',
          contradictions: [],
          locusOfControl: 'internal',
          conviction: 'moderate'
        },
        illuminationQuestion: {
          strategy: 'missing_crucial_detail',
          questionText: 'אם יתברר שניסוי של שבועיים מספיק לבדיקת נכונות לשלם, האם תשקול אחרת?',
          triggerReason: 'הנחה שחייבים 3 חודשים לבדיקת ביקוש',
          canSkip: true
        },
        refinedInsight: {
          before: 'התלבטות בין 3 חודשי פיתוח נוספים לעצירה מלאה',
          now: 'התחדד שניתן לבצע בדיקה קצרה בשבועיים',
          chosenStep: 'הצעת פיילוט ממוקד לשני הלקוחות'
        }
      };
    }

    return {
      humanDimensions: {
        consideration: rawText.slice(0, 80),
        goalsPrices: 'השגת היעד בביטחון',
        reliance: 'מידע ראשוני שהוזן',
        unknowns: 'מידע חסר לבחינה מחודשת'
      },
      epistemicState: {
        facts: [rawText.slice(0, 80)],
        assumptions: ['קיימת חלופה מובילה'],
        unknowns: ['תנאי אימות'],
        affect: 'neutral',
        riskClass: 'mediocristan',
        reversibility: 'reversible',
        contradictions: [],
        locusOfControl: 'balanced',
        conviction: 'moderate'
      },
      illuminationQuestion: {
        strategy: 'no_intervention',
        questionText: 'תיארת את השיקולים ואת אי-הוודאות המרכזית. אפשר לשמור כך ולהמשיך.',
        triggerReason: 'Balanced description',
        canSkip: true
      },
      refinedInsight: {
        before: rawText.slice(0, 80),
        now: 'הדילמה נוסחה והוצגה במראה נקייה',
        chosenStep: 'שמירה להמשך מעקב'
      }
    };
  }

  async generateStructuralEmbedding(signature: ExtractedSignatureDTO, _context: Record<string, any>): Promise<number[]> {
    return [
      signature.commitmentGradient,
      signature.informationCostRatio,
      signature.reversibilityDecayDays / 100,
      signature.principalAgentTension === 'sole_actor' ? 1.0 : 0.5,
      signature.decisionTempo === 'tactical_weeks' ? 1.0 : 0.2,
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.0
    ];
  }
}
