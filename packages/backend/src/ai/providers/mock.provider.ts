import { IAiProvider, EpistemicExtractionResult, ExtractedSignatureDTO } from '../provider.interface.js';
import { CognitiveAnalysisResult } from '../../prompts/cognitive-engine.prompt.js';

export class MockAiProvider implements IAiProvider {
  async extractEpistemicSchema(rawText: string, activeEraContext?: string): Promise<EpistemicExtractionResult> {
    const lower = rawText.toLowerCase();

    // Case 1: Atlas Project (continue or stop)
    if (lower.includes('אטלס') || lower.includes('atlas')) {
      return {
        title: 'האם להמשיך להשקיע בפרויקט אטלס',
        family: 'continue_or_stop',
        goal: 'אימות היתכנות מסחרית מבלי לבזבז קיבולת צוות מוגבלת',
        statements: [
          { text: 'אין לקוח משלם עדיין', role: 'observation', confidenceScore: 0.98 },
          { text: 'שני לקוחות פוטנציאליים רוצים לבדוק את המוצר', role: 'observation', confidenceScore: 0.95 },
          { text: 'המוצר נראה הרבה יותר טוב', role: 'evaluation', confidenceScore: 0.92 },
          { text: 'הלקוחות המתעניינים יסכימו להמיר לשימוש בתשלום', role: 'assumption', confidenceScore: 0.89 },
          { text: 'האם נכונות לשלם מחייבת 3 חודשי פיתוח נוספים', role: 'unknown', confidenceScore: 0.85 }
        ],
        options: [
          'להמשיך השקעה למשך 3 חודשים נוספים',
          'לעצור פרויקט ולהקצות 2 מפתחים מחדש'
        ],
        contextStakes: 'high',
        contextReversibility: 'partially_reversible',
        contextTimePressure: 'medium',
        signature: {
          commitmentGradient: 0.8,
          informationCostRatio: 0.9, // Inexpensive test available (paid pilot)
          reversibilityDecayDays: 90,
          principalAgentTension: 'team_alignment',
          decisionTempo: 'tactical_weeks'
        },
        illuminationQuestion: 'האם צריך באמת שלושה חודשים כדי לבדוק נכונות לשלם, או שיש דרך זולה ומהירה יותר לקבל את המידע?'
      };
    }

    // Case 2: VP Sales Hiring
    if (lower.includes('סמנכ"ל מכירות') || lower.includes('vp sales') || lower.includes('מכירות')) {
      return {
        title: 'האם לגייס סמנכ"ל מכירות עכשיו',
        family: 'hire_or_wait',
        goal: 'הפחתת תלות המייסד במכירות תוך שמירה על ה-Runway',
        statements: [
          { text: 'המכירות כרגע תלויות לחלוטין במייסד', role: 'observation', confidenceScore: 0.97 },
          { text: 'המועמד המוביל יקר מאוד לארגון', role: 'observation', confidenceScore: 0.94 },
          { text: 'המועמד מצוין בתחומו', role: 'evaluation', confidenceScore: 0.91 },
          { text: 'מנהיגות מכירות בכירה תפצח תהליך מכירות משוכפל', role: 'assumption', confidenceScore: 0.88 },
          { text: 'מוכנות הארגון לשילוב סמנכ"ל מכירות במשרה מלאה', role: 'unknown', confidenceScore: 0.84 }
        ],
        options: [
          'גיוס סמנכ"ל מכירות מלא עכשיו',
          'המתנה ובניית מנוע יציב יותר קודם'
        ],
        contextStakes: 'high',
        contextReversibility: 'partially_reversible',
        contextTimePressure: 'high',
        signature: {
          commitmentGradient: 0.85,
          informationCostRatio: 0.85, // Fractional trial available
          reversibilityDecayDays: 60,
          principalAgentTension: 'external_dependency',
          decisionTempo: 'tactical_weeks'
        },
        illuminationQuestion: 'האם קיימת דרך לבדוק את הערך של הנהגת מכירות בכירה לפני גיוס מלא (כגון מודל חלקי או תקופת ניסיון)?'
      };
    }

    // Case 3: German Market Entry
    if (lower.includes('גרמניה') || lower.includes('גרמני') || lower.includes('germany')) {
      return {
        title: 'האם להיכנס לשוק הגרמני',
        family: 'market_entry',
        goal: 'בדיקת פוטנציאל השוק בגרמניה מבלי לפצל את המוצר והצוות',
        statements: [
          { text: 'שני לקוחות התעניינו בגרמניה', role: 'observation', confidenceScore: 0.96 },
          { text: 'המוצר והתמיכה מותאמים כיום רק לישראל', role: 'observation', confidenceScore: 0.98 },
          { text: 'חלון ההזדמנות בשוק הגרמני עלול להיסגר', role: 'evaluation', confidenceScore: 0.86 },
          { text: 'העניין הראשוני יתורגם לרכש חרף פערי רגולציה ושפה', role: 'assumption', confidenceScore: 0.9 },
          { text: 'עלות ההתאמה האמיתית של המוצר והרכש המקומי', role: 'unknown', confidenceScore: 0.87 }
        ],
        options: [
          'הקמת פעילות מלאה בגרמניה וגיוס נציג מקומי',
          'דחיית הכניסה עד להתבססות מלאה בישראל'
        ],
        contextStakes: 'high',
        contextReversibility: 'partially_reversible',
        contextTimePressure: 'medium',
        signature: {
          commitmentGradient: 0.75,
          informationCostRatio: 0.8, // Design partner trial available
          reversibilityDecayDays: 90,
          principalAgentTension: 'external_dependency',
          decisionTempo: 'tactical_weeks'
        },
        illuminationQuestion: 'איזה ניסוי קטן יבדוק ביקוש אמיתי וגם את עלות ההתאמה, בלי להקים עדיין פעילות מלאה?'
      };
    }

    // Default Fallback
    return {
      title: 'החלטה משמעותית תחת אי-ודאות',
      family: 'general_deliberation',
      goal: 'קבלת הכרעה מושכלת עם ניהול סיכונים',
      statements: [
        { text: rawText.slice(0, 100), role: 'observation', confidenceScore: 0.9 },
        { text: 'קיימת חלופה מרכזית שנבחנת מול סטטוס קוו', role: 'assumption', confidenceScore: 0.8 }
      ],
      options: ['אימוץ הכיוון המוביל', 'השהיה או בדיקה חלופית'],
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
      illuminationQuestion: 'מהי העובדה החזקה ביותר נגד הכיוון שאתה מעדיף כרגע?'
    };
  }

  async extractCognitiveEngine(rawText: string): Promise<CognitiveAnalysisResult> {
    const lower = rawText.toLowerCase();

    if (lower.includes('אטלס') || lower.includes('atlas')) {
      return {
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
          strategy: 'cheap_information_action',
          questionText: 'ציינת ששני לקוחות רוצים לבדוק את המוצר. האם צריך באמת שלושה חודשים כדי לבדוק נכונות לשלם, או שיש דרך זולה ומהירה יותר לקבל את המידע?',
          triggerReason: 'High unknowns with cheap verification probe available'
        }
      };
    }

    return {
      epistemicState: {
        facts: [rawText.slice(0, 80)],
        assumptions: ['קיימת חלופה מובילה שתוכיח את עצמה'],
        unknowns: ['סיכוני ביצוע מרכזיים שלא פורטו'],
        affect: 'neutral',
        riskClass: 'mediocristan',
        reversibility: 'reversible',
        contradictions: [],
        locusOfControl: 'balanced',
        conviction: 'moderate'
      },
      illuminationQuestion: {
        strategy: 'tacit_knowledge_gap',
        questionText: 'דילגת על ציון הסיכונים המרכזיים בלוח הזמנים שקבעת. מה אתה יודע על המשאבים שלנו שלא ציינת ומצדיק את זה?',
        triggerReason: 'Tacit knowledge gap detected'
      }
    };
  }

  async generateStructuralEmbedding(signature: ExtractedSignatureDTO, context: Record<string, any>): Promise<number[]> {
    // Generate a deterministic 16-dimensional vector for local similarity calculations
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
