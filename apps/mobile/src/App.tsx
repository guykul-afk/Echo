import React, { useState, useEffect } from 'react';
import { LuxuryTheme } from './theme/colors.js';
import { QuickCaptureScreen } from './screens/QuickCaptureScreen.js';
import { DecisionRoomScreen } from './screens/DecisionRoomScreen.js';
import { OutcomeModal } from './screens/OutcomeModal.js';
import { DecisionProfileScreen } from './screens/DecisionProfileScreen.js';
import { TopDrawer } from './components/TopDrawer.js';
import { DecisionCase, Option, DecisionSignature, RefinedInsight, QuickLoopStatus, FiveHumanDimensions, IlluminationQuestion } from '@echo/shared';

type AppStep = 'capture' | 'decision_room' | 'outcome' | 'profile';

export const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('capture');
  const [isLoading, setIsLoading] = useState(false);

  // Active Case State
  const [activeCase, setActiveCase] = useState<DecisionCase | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [signature, setSignature] = useState<DecisionSignature | null>(null);
  const [illuminationQuestion, setIlluminationQuestion] = useState<string>('');
  const [bespokeQuestion, setBespokeQuestion] = useState<IlluminationQuestion | undefined>(undefined);
  const [historicalQuestion, setHistoricalQuestion] = useState<IlluminationQuestion | undefined>(undefined);
  const [similarCaseAnalogy, setSimilarCaseAnalogy] = useState<{ title: string; reason: string; strength: string; score?: number } | undefined>(undefined);
  const [refinedInsight, setRefinedInsight] = useState<RefinedInsight | undefined>(undefined);
  const [chosenNextStep, setChosenNextStep] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('ECHO_ACTIVE_USER')) || 'guy_founder';
  });

  const handleSwitchUser = (newUser: string) => {
    setCurrentUserId(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ECHO_ACTIVE_USER', newUser);
    }
  };

  // Precedents database for real-time Tri-Factor matching
  const PRECEDENTS_DATABASE = [
    {
      keywords: ['קבלן', 'שלד', 'גמרים', 'שיפוץ', 'בנייה', 'קבלנים'],
      title: 'המשכיות עם קבלן השלד לעבודות הגמרים (2026)',
      reason: 'שימוש באותו קבלן לשני השלבים בפרויקט קודם יצר פשרות אסתטיות שלא ניתן היה לתקן בדיעבד. הלקח: להפריד בין שלד לגמרים.',
      question: 'בפרויקט כנרת למדת שקבלן שלד מצטיין אינו בהכרח פדנט בגמרים. האם נכון גם כאן לפצל?',
      score: 0.88
    },
    {
      keywords: ['בטון', 'ספק', 'אספקה', 'יציקה', 'מחיר', 'עלות', 'פיצול'],
      title: 'אסטרטגיית אספקת בטון לפרויקט קטרוני (2026)',
      reason: 'העדפת ספק יחיד זול יצרה סיכון השבתה של 45,000 ש"ח ליום יציקה. הלקח: פיצול 70/30 כביטוח שווה את הפרמיה.',
      question: 'האם עלות פרמיית הגיבוי שווה את מניעת הסיכון להשבתה כפי שהוכח ביולי 2026?',
      score: 0.91
    },
    {
      keywords: ['תפקיד', 'שכר', 'עבודה', 'מנהל', 'ילדים', 'בית', 'קריירה', 'שעות', 'זמינות', 'job'],
      title: 'מעבר תפקיד ניהולי וזמינות בערבים (2024)',
      reason: 'במעבר הקודם ציינת בדיעבד שזמן הבית והנוכחות עם הילדים היו קריטיים בהרבה ממה שהערכת, וכי תיאום ציפיות מראש מנע שחיקה.',
      question: 'במעבר התפקיד הקודם (2024) למדת שציפיות זמינות בערב חובה לברר לפני חתימה. האם הלקח הזה תקף להחלטה הנוכחית?',
      score: 0.89
    },
    {
      keywords: ['ספורט', 'גלישה', 'כנרת', 'גב', 'ריצה', 'פציעה', 'בריאות'],
      title: 'חזרה לפעילות מאומצת מול סמנים סומטיים (2025)',
      reason: 'נטילת סיכון גופני יתר על המידה הובילה להשבתה ממושכת פי 3. הלקח: כבוד לאיתותי הגוף לפני דחיפה.',
      question: 'האם הרצון לחזור לפעילות גובר שוב על איתותי העומס כפי שקרה בפציעה הקודמת?',
      score: 0.84
    },
    {
      keywords: ['מחיר', 'דירות', 'תמחור', 'מכירה', 'מבצע', 'סלומון', 'נדל"ן'],
      title: 'תמחור דירות קיטרוני וסלומון (2026)',
      reason: 'הורדה גורפת פגעה במיצוב. הלקח: מבצע מתוחם בזמן ל-2 דירות בלבד שמר על ערך שאר הפרויקט (דרך שלישית).',
      question: 'האם במקום הורדה גורפת ניתן לייצר פיילוט מתוחם כפי שפעל בהצלחה בסלומון?',
      score: 0.87
    }
  ];

  // 1. Handle Quick Capture with Real-Time Tri-Factor Precedent Retrieval
  const handleCaptureSubmit = (rawText: string, frictionLevel: 'quick' | 'focused' | 'deep' = 'focused') => {
    if (!rawText || !rawText.trim()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    setTimeout(() => {
      const now = Date.now();
      const firstLine = rawText.split('\n')[0].trim();
      const title = firstLine.slice(0, 50) + (firstLine.length > 50 ? '...' : '');

      // Tri-Factor Keyword & Semantic Matcher
      const lower = rawText.toLowerCase();
      let matchedPrecedent: typeof PRECEDENTS_DATABASE[0] | null = null;
      for (const prec of PRECEDENTS_DATABASE) {
        if (prec.keywords.some(k => lower.includes(k))) {
          matchedPrecedent = prec;
          break;
        }
      }

      // Default fallback precedent if no exact keyword match
      if (!matchedPrecedent && rawText.length > 15) {
        matchedPrecedent = PRECEDENTS_DATABASE[0];
      }

      const mockCase: DecisionCase = {
        id: `dc-${now}`,
        userId: currentUserId,
        title: title || 'דילמת שיקול דעת',
        status: 'deliberating',
        family: 'general_deliberation',
        contextStakes: 'high',
        contextReversibility: 'partially_reversible',
        contextTimePressure: 'medium',
        rawCaptureText: rawText.trim(),
        frozenAt: now,
        frictionLevel,
        dimConsideration: rawText.trim(),
        dimGoalsPrices: 'השגת המטרה באיכות גבוהה תוך שמירה על המשאבים ואי-ודאות מינימלית',
        dimReliance: 'הנחות המוצא והעובדות שהוזנו במעמד הלכידה',
        dimUnknowns: 'מידע חסר שטרם אומת בשטח מול הגורמים הרלוונטיים',
        centralTension: 'השגת המטרה וההתקדמות מול מחירים נלווים וסיכונים',
        keyHinge: 'בירור מוקדם של ההנחה המרכזית לפני התחייבות בלתי הפיכה',
        createdAt: now,
        updatedAt: now
      };

      const mockQuestion = matchedPrecedent?.question || 'אם אי אפשר לקבל את שני הצדדים במלואם, על מה פחות תרצה לוותר?';

      const mockBespoke: IlluminationQuestion = {
        id: `illum-${now}`,
        caseId: mockCase.id,
        strategy: frictionLevel === 'quick' ? ('no_intervention' as any) : ('clarification' as any),
        questionText: frictionLevel === 'quick' ? '' : mockQuestion,
        triggerReason: frictionLevel === 'quick' ? 'Quick flow selected' : 'High Expected Reflection Value intervention',
        shouldIntervene: frictionLevel !== 'quick',
        expectedReflectionValue: 0.88,
        responseWidget: 'priority',
        responseOptions: ['פשטות ומהירות', 'עמידות ואיכות לטווח ארוך'],
        isSecondary: false,
        origin: 'current_dilemma',
        createdAt: now
      };

      let mockHistorical: IlluminationQuestion | undefined;
      let analogyData: typeof similarCaseAnalogy = undefined;

      if (matchedPrecedent) {
        mockHistorical = {
          id: `hist-${now}`,
          caseId: mockCase.id,
          strategy: 'outcome_contract_anchor',
          origin: 'historical_precedent',
          questionText: matchedPrecedent.question,
          triggerReason: 'זוהה תקדים עבר ישיר בנושא דומה (Tri-Factor Engine)',
          shouldIntervene: true,
          isSecondary: true,
          canSkip: true,
          responseWidget: 'confirmation',
          responseOptions: ['כן, לקח רלוונטי', 'לא, הנסיבות שונות'],
          createdAt: now
        };

        analogyData = {
          title: matchedPrecedent.title,
          reason: matchedPrecedent.reason,
          strength: 'strong',
          score: matchedPrecedent.score
        };
      }

      const mockInsight: RefinedInsight = {
        before: title,
        now: 'חדות סביב ציר ההכרעה וההנחות שעדיין לא אומתו',
        chosenStep: 'בירור מוקדם לפני התחייבות'
      };

      const mockOptions: Option[] = [
        { id: 'opt-1', caseId: mockCase.id, userId: currentUserId, title: 'המשך במתכונת המקורית', origin: 'proposed_by_user', wasSelected: false, createdAt: now },
        { id: 'opt-2', caseId: mockCase.id, userId: currentUserId, title: 'גידור מוקדם באמצעות בירור ממוקד', origin: 'proposed_by_user', wasSelected: false, createdAt: now }
      ];

      const mockSignature: DecisionSignature = {
        id: `sig-${now}`,
        caseId: mockCase.id,
        userId: currentUserId,
        commitmentGradient: 0.82,
        informationCostRatio: 0.88,
        reversibilityDecayDays: 45,
        principalAgentTension: 'sole_actor',
        decisionTempo: 'tactical_weeks'
      };

      setActiveCase(mockCase);
      setOptions(mockOptions);
      setSignature(mockSignature);
      setIlluminationQuestion(mockQuestion);
      setBespokeQuestion(mockBespoke);
      setHistoricalQuestion(mockHistorical);
      setSimilarCaseAnalogy(analogyData);
      setRefinedInsight(mockInsight);

      setIsLoading(false);
      setStep('decision_room');
    }, 800);
  };

  // 2. Handle Decision Room Answer / Skip
  const handleDecisionAnswer = (_answer: string, skip: boolean = false) => {
    if (skip) {
      setChosenNextStep(refinedInsight?.chosenStep || 'בירור מוקדם לפני הכרעה');
      setStep('outcome');
    }
  };

  // 3. Handle Mirror Live Update
  const handleMirrorUpdate = (updates: FiveHumanDimensions) => {
    if (activeCase) {
      setActiveCase({
        ...activeCase,
        dimConsideration: updates.consideration,
        dimGoalsPrices: updates.goalsPrices,
        dimFacts: updates.facts,
        dimAssumptions: updates.assumptions,
        dimMissingInfo: updates.missingInfo,
        dimReliance: updates.reliance || `${updates.facts} | ${updates.assumptions}`,
        dimUnknowns: updates.unknowns || updates.missingInfo,
        updatedAt: Date.now()
      });
    }
  };

  // 4. Handle 3-Axis Outcome Submit
  const handleOutcomeSubmit = (_outcome: {
    whatHappened: string;
    assumptionClarification: string;
    processReflection: string;
    quickStatus: QuickLoopStatus;
  }) => {
    setStep('capture');
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 select-none" style={{ backgroundColor: LuxuryTheme.background.base }}>
      
      {/* Container: 100% full screen on phones, elegant luxury mockup frame on desktop */}
      <div 
        className="relative w-full min-h-screen sm:min-h-[860px] sm:max-h-[95vh] sm:max-w-[430px] sm:rounded-[44px] sm:border-[5px] sm:border-[#1e212b] sm:shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
        style={{ backgroundColor: LuxuryTheme.background.base }}
      >
        {/* Top Collapsible Drawer */}
        <TopDrawer
          currentUser={currentUserId}
          onSwitchUser={handleSwitchUser}
          onOpenJournal={() => setStep('profile')}
        />
        
        {/* Navigation bar if not on capture */}
        {step !== 'capture' && (
          <div className="w-full px-5 py-2.5 flex justify-between items-center border-b shrink-0 z-20" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
            <button 
              onClick={() => setStep('capture')}
              className="text-xs px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
              style={{ color: LuxuryTheme.text.secondary }}
            >
              לכידה חדשה
            </button>
            <span className="text-xs font-editorial font-bold" style={{ color: LuxuryTheme.accent.gold }}>
              echo
            </span>
            <button 
              onClick={() => setStep('profile')}
              className="text-xs px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
              style={{ color: step === 'profile' ? LuxuryTheme.accent.gold : LuxuryTheme.text.secondary }}
            >
              פרופיל כיול
            </button>
          </div>
        )}

        {/* Dynamic Screens */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 'capture' && (
            <QuickCaptureScreen
              onCaptureSubmit={handleCaptureSubmit}
              onOpenProfile={() => setStep('profile')}
              isLoading={isLoading}
            />
          )}

          {step === 'profile' && (
            <DecisionProfileScreen
              onBack={() => setStep('capture')}
              currentUserId={currentUserId}
            />
          )}

          {step === 'decision_room' && activeCase && (
            <DecisionRoomScreen
              decisionCase={activeCase}
              options={options}
              signature={signature || undefined}
              illuminationQuestion={illuminationQuestion}
              bespokeQuestion={bespokeQuestion}
              historicalQuestion={historicalQuestion}
              initialRefinedInsight={refinedInsight}
              similarCaseAnalogy={similarCaseAnalogy}
              onAnswerSubmit={handleDecisionAnswer}
              onMirrorUpdate={handleMirrorUpdate}
            />
          )}

          {step === 'outcome' && activeCase && (
            <OutcomeModal
              caseTitle={activeCase.dimConsideration || activeCase.title}
              nextStepChosen={chosenNextStep}
              onSubmitOutcome={handleOutcomeSubmit}
              onCancel={() => setStep('capture')}
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default App;

