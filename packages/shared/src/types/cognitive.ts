/**
 * Epistemic Engine & Cognitive Mirror for ECHO
 */

export type AffectState = 'calm' | 'anxious' | 'fomo' | 'overconfident' | 'rushed' | 'frustrated' | 'neutral';

export type RiskClass = 'mediocristan' | 'extremistan';

export type ReversibilityLevel = 'reversible' | 'partially_reversible' | 'irreversible';

export type LocusOfControl = 'internal' | 'external' | 'balanced';

export type ConvictionLevel = 'low' | 'moderate' | 'high' | 'absolute';

/**
 * 5 Human-Facing Mirror Dimensions
 */
export interface FiveHumanDimensions {
  consideration: string; // אתה שוקל: הדילמה המרכזית (One-line decision)
  goalsPrices: string;   // הבנתי שחשוב לך להשיג/לשמור: מטרות, ערכים ומחירים שלא תרצה לשלם
  facts: string;         // עובדות קשיחות: נתונים, אירועים שהתרחשו בפועל
  assumptions: string;   // ההנחות שלך: השערות, פרשנות וציפיות
  missingInfo: string;   // מידע חסר להחלטה: פערי מידע, שאלות פתוחות

  // The First 20 Seconds Focus
  centralTension?: string; // המתח המרכזי (למשל: פשטות ורציפות מול תלות גבוהה)
  keyHinge?: string;       // נראה שההכרעה תלויה בעיקר ב... (ציר ההכרעה)

  // Backward compatibility fields (optional)
  reliance?: string;
  unknowns?: string;
}

export interface First20SecondsSummary {
  oneLineDecision: string;
  centralTension: string;
  keyHinge: string;
}

// Backward compatibility alias
export type FourHumanDimensions = FiveHumanDimensions;

/**
 * 9 Background Epistemic Dimensions (Internal AI Processing)
 */
export interface EpistemicState {
  caseId: string;
  userId: string;
  facts: string[];              // F: Verifiable present data
  assumptions: string[];        // A: Beliefs about the future
  unknowns: string[];           // U: Critical missing data (WYSIATI)
  affect: AffectState;          // E: Somatic marker / emotion (Damasio)
  riskClass: RiskClass;         // R: Taleb's Mediocristan vs Extremistan
  reversibility: ReversibilityLevel; // Rev: One-way vs Two-way door
  contradictions: string[];     // C: Internal cognitive dissonance / conflicting claims
  locusOfControl: LocusOfControl;// Loc: Active agency vs victim of circumstance
  conviction: ConvictionLevel;  // Conv: Linguistic certainty level

  // Human dimensions for direct mirror UI
  humanDimensions?: FiveHumanDimensions;

  extractedAt: number;
}

/**
 * 7 Adaptive Intervention Strategies (+ No Intervention)
 */
export type AdaptiveInterventionStrategy =
  | 'competing_goals'          // שתי מטרות מתחרות ("אם אי אפשר לקבל את שתיהן, על מה פחות תרצה לוותר?")
  | 'ungrounded_assumption'     // הנחה משמעותית ללא בסיס ("מה גורם לך לחשוב שזה יקרה?")
  | 'missing_crucial_detail'    // פרט חסר שעשוי לשנות את הבחירה ("אם יתברר שהפרט שונה, האם תשקול אחרת?")
  | 'false_dichotomy'           // שתי אפשרויות בלבד ("האם יש דרך ביניים שתרצה לבחון?")
  | 'irreversible_commitment'   // התחייבות שקשה לבטל ("מה חשוב לך לברר לפני הצעד שקשה לחזור ממנו?")
  | 'endless_info_gathering'    // איסוף מידע אינסופי ("איזו תשובה נוספת באמת תשנה את הבחירה שלך?")
  | 'premature_closure'         // בחירה מגובשת ("מה יגרום לך לפתוח אותה מחדש?")
  | 'no_intervention';          // תיאור שלם ומספק ("תיארת את השיקולים... אפשר לשמור ולהמשיך")

export type IlluminationStrategy =
  | AdaptiveInterventionStrategy
  | 'ruin_prevention'
  | 'contradiction_dissonance'
  | 'affect_neutralization'
  | 'tacit_knowledge_gap'
  | 'pre_mortem'
  | 'cheap_information_action'
  | 'social_groupthink_check'
  | 'outcome_contract_anchor';

export type ResponseWidgetType = 'text' | 'confirmation' | 'priority' | 'classification';

export interface IlluminationQuestion {
  id: string;
  caseId: string;
  strategy: IlluminationStrategy;
  questionText: string;         // The bespoke tailored question referencing user's quotes
  triggerReason: string;        // Why this strategy was selected by priority
  isSecondary: boolean;
  origin?: 'current_dilemma' | 'historical_precedent';
  canSkip?: boolean;            // User can skip with "מספיק לי לעכשיו"
  
  // Phase 2: Adaptive Friction & Smart Silence
  shouldIntervene?: boolean;
  expectedReflectionValue?: number; // 0.0 to 1.0 (Expected Reflection Value)
  smartSilenceMessage?: string;     // e.g. "נראה שכבר הפרדת היטב בין מה שאתה יודע לבין מה שאתה מניח..."
  responseWidget?: ResponseWidgetType;
  responseOptions?: string[];       // Options for confirmation / priority / classification

  userResponseText?: string;
  respondedAt?: number;
  createdAt: number;
}

