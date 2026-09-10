import React, { useState, useEffect } from 'react';
import { LuxuryTheme } from './theme/colors.js';
import { QuickCaptureScreen } from './screens/QuickCaptureScreen.js';
import { DecisionRoomScreen } from './screens/DecisionRoomScreen.js';
import { OutcomeModal } from './screens/OutcomeModal.js';
import { DecisionProfileScreen } from './screens/DecisionProfileScreen.js';
import { DecisionJournalScreen } from './screens/DecisionJournalScreen.js';
import { TopDrawer } from './components/TopDrawer.js';
import { checkRedirectAuth } from './services/firebaseAuth.js';
import { syncUserDecisionsFromCloud } from './services/firestoreSync.js';
import { analyzeCapturedDilemma } from './services/aiService.js';
import { DecisionCase, Option, DecisionSignature, RefinedInsight, QuickLoopStatus, FiveHumanDimensions, IlluminationQuestion } from '@echo/shared';

type AppStep = 'capture' | 'decision_room' | 'outcome' | 'profile' | 'journal';

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
    return (typeof window !== 'undefined' && localStorage.getItem('ECHO_ACTIVE_USER')) || 'Guy_Kuleski';
  });
  const [capturesCount, setCapturesCount] = useState<number>(39);
  const [closuresCount, setClosuresCount] = useState<number>(8);

  const loadUserMetrics = (user: string) => {
    try {
      const key = `echo_decisions_${user}`;
      let raw = localStorage.getItem(key);
      if (!raw && (user.toLowerCase().includes('guy') || user.toLowerCase().includes('kuleski'))) {
        raw = localStorage.getItem('echo_decisions_Guy_Kuleski') || localStorage.getItem('echo_decisions_guy_founder');
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCapturesCount(parsed.length);
          const closed = parsed.filter((d: any) => d.sealed || (d.followUps && d.followUps.length > 0)).length;
          if (closed > 0) setClosuresCount(closed);
        }
      }
    } catch {}

    syncUserDecisionsFromCloud(user).then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        setCapturesCount(list.length);
        const closed = list.filter((d: any) => d.sealed || (d.followUps && d.followUps.length > 0)).length;
        if (closed > 0) setClosuresCount(closed);
      }
    });
  };

  const handleSwitchUser = (newUser: string) => {
    setCurrentUserId(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ECHO_ACTIVE_USER', newUser);
    }
    loadUserMetrics(newUser);
  };

  useEffect(() => {
    loadUserMetrics(currentUserId);
  }, [currentUserId]);

  // Check if user just redirected back from Google Social Auth
  useEffect(() => {
    checkRedirectAuth().then((authenticatedUser) => {
      if (authenticatedUser) {
        handleSwitchUser(authenticatedUser);
      }
    });
  }, []);

  // 1. Handle Quick Capture with Real-Time Gemini Epistemic Analysis
  const handleCaptureSubmit = async (rawText: string, frictionLevel: 'quick' | 'focused' | 'deep' = 'focused') => {
    if (!rawText || !rawText.trim()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const result = await analyzeCapturedDilemma(rawText, frictionLevel, currentUserId);

      setActiveCase(result.decisionCase);
      setOptions(result.options);
      setSignature(result.signature);
      setIlluminationQuestion(result.illuminationQuestion);
      setBespokeQuestion(result.bespokeQuestion);
      setHistoricalQuestion(result.historicalQuestion);
      setSimilarCaseAnalogy(result.similarCaseAnalogy);
      setRefinedInsight(result.refinedInsight);

      setStep('decision_room');
    } catch (err) {
      console.error('[Capture Analysis Error]:', err);
    } finally {
      setIsLoading(false);
    }
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
          onOpenJournal={() => setStep('journal')}
          onOpenCalibration={() => setStep('profile')}
        />
        
        {/* Navigation bar if not on capture */}
        {step !== 'capture' && (
          <div className="w-full px-4 py-2.5 flex justify-between items-center border-b shrink-0 z-20" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
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
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setStep('journal')}
                className="text-xs px-2 py-1 rounded-lg border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
                style={{ color: step === 'journal' ? LuxuryTheme.accent.gold : LuxuryTheme.text.secondary }}
              >
                יומן
              </button>
              <button 
                onClick={() => setStep('profile')}
                className="text-xs px-2 py-1 rounded-lg border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
                style={{ color: step === 'profile' ? LuxuryTheme.accent.gold : LuxuryTheme.text.secondary }}
              >
                כיול
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Screens */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 'capture' && (
            <QuickCaptureScreen
              onCaptureSubmit={handleCaptureSubmit}
              isLoading={isLoading}
            />
          )}

          {step === 'journal' && (
            <DecisionJournalScreen
              onBack={() => setStep('capture')}
              currentUserId={currentUserId}
              onDecisionUpdated={() => loadUserMetrics(currentUserId)}
            />
          )}

          {step === 'profile' && (
            <DecisionProfileScreen
              onBack={() => setStep('capture')}
              currentUserId={currentUserId}
              capturesCount={capturesCount}
              closuresCount={closuresCount}
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

