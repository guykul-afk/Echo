import React, { useState, useEffect } from 'react';
import { LuxuryTheme } from './theme/colors.js';
import { QuickCaptureScreen } from './screens/QuickCaptureScreen.js';
import { DecisionRoomScreen, DecisionSaveData } from './screens/DecisionRoomScreen.js';
import { OutcomeModal } from './screens/OutcomeModal.js';
import { DecisionProfileScreen } from './screens/DecisionProfileScreen.js';
import { DecisionJournalScreen } from './screens/DecisionJournalScreen.js';
import { TopDrawer } from './components/TopDrawer.js';
import { checkRedirectAuth } from './services/firebaseAuth.js';
import { syncUserDecisionsFromCloud, saveDecisionToCloud } from './services/firestoreSync.js';
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
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lastRawCapture, setLastRawCapture] = useState<string>('');

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
    setLastRawCapture(rawText);
    setAnalysisError(null);
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
    } catch (err: any) {
      console.error('[Capture Analysis Error]:', err);
      setAnalysisError(err?.message || 'שגיאת תקשורת עם מנוע ה-AI של Gemini. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Decision Room Answer / Skip
  const handleDecisionAnswer = (answer: string, skip: boolean = false) => {
    if (skip) {
      setChosenNextStep(refinedInsight?.chosenStep || 'בירור מוקדם לפני הכרעה');
      setStep('outcome');
    } else if (answer) {
      setRefinedInsight(prev => ({
        before: prev?.before || activeCase?.dimConsideration || activeCase?.title || '',
        now: answer,
        chosenStep: answer.slice(0, 80) || prev?.chosenStep || 'בירור מוקדם לפני הכרעה'
      }));
    }
  };

  // 3. Handle Full Decision Save into Journal (Sealed Record)
  const handleSaveDecision = (saveData: DecisionSaveData) => {
    const decisionId = activeCase?.id || `dec-${Date.now()}`;
    const newDecision = {
      id: decisionId,
      title: saveData.consideration.slice(0, 60),
      family: activeCase?.family || 'general_deliberation',
      createdAt: activeCase?.createdAt || Date.now(),
      frozenAt: Date.now(),
      status: 'נחתם למעקב',
      sealed: true,
      dilemma: saveData.consideration,
      goalsPrices: saveData.goalsPrices,
      facts: saveData.facts,
      assumptions: saveData.assumptions,
      missingInfo: saveData.missingInfo,
      question: saveData.question,
      answer: saveData.answer,
      conclusion: saveData.conclusion,
      nextStep: saveData.nextStep,
      followUps: []
    };

    const storageKey = `echo_decisions_${currentUserId}`;
    let currentList: any[] = [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) currentList = JSON.parse(raw);
    } catch {}

    const updatedList = [newDecision, ...currentList.filter((d: any) => d.id !== decisionId)];
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
      if (currentUserId.toLowerCase().includes('guy') || currentUserId.toLowerCase().includes('kuleski')) {
        localStorage.setItem('echo_decisions_Guy_Kuleski', JSON.stringify(updatedList));
        localStorage.setItem('echo_decisions_guy_founder', JSON.stringify(updatedList));
      }
    } catch {}

    saveDecisionToCloud(newDecision, currentUserId);
    loadUserMetrics(currentUserId);
    setStep('journal');
  };

  // 4. Handle Mirror Live Update
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

  // 5. Handle 3-Axis Outcome Submit
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
          {analysisError && (
            <div className="mx-4 mt-3 p-3.5 rounded-2xl border border-rose-500/30 bg-rose-950/40 text-rose-200 text-xs text-right space-y-2 shrink-0 z-30" dir="rtl">
              <div className="flex justify-between items-center">
                <span className="font-bold flex items-center gap-1.5 text-rose-300">
                  <span>⚠️</span>
                  <span>תקלת תקשורת עם מנוע ה-AI</span>
                </span>
                <button 
                  onClick={() => setAnalysisError(null)} 
                  className="text-white/60 hover:text-white text-sm px-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">{analysisError}</p>
              {lastRawCapture && (
                <button
                  onClick={() => handleCaptureSubmit(lastRawCapture)}
                  className="px-3 py-1.5 rounded-xl border border-rose-400/40 bg-rose-500/20 text-rose-100 text-xs font-semibold cursor-pointer active:scale-95"
                >
                  נסה שוב עם אותה הלכידה ↺
                </button>
              )}
            </div>
          )}

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
              onSaveDecision={handleSaveDecision}
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

