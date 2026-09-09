import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { LuxuryTheme } from './theme/colors.js';
import { QuickCaptureScreen } from './screens/QuickCaptureScreen.js';
import { DecisionRoomScreen } from './screens/DecisionRoomScreen.js';
import { OutcomeModal } from './screens/OutcomeModal.js';
import { DecisionProfileScreen } from './screens/DecisionProfileScreen.js';
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
  const [refinedInsight, setRefinedInsight] = useState<RefinedInsight | undefined>(undefined);
  const [chosenNextStep, setChosenNextStep] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('guy_founder');

  // 1. Handle Quick Capture
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
        dimGoalsPrices: 'השגת המטרה תוך שמירה על משאבים',
        dimReliance: 'הנחות המוצא שהוזנו',
        dimUnknowns: 'מידע חסר שטרם אומת',
        centralTension: 'הכנסה והתקדמות מקצועית מול נוכחות בבית וזמן עם הילדים',
        keyHinge: 'בירור שעות העבודה והזמינות בערבים מול המנהל',
        createdAt: now,
        updatedAt: now
      };

      const mockQuestion = 'אם אי אפשר לקבל את שניהם במלואם, על מה פחות תרצה לוותר?';

      const mockBespoke: IlluminationQuestion = {
        id: 'illum-mock',
        caseId: 'dc-001',
        strategy: frictionLevel === 'quick' ? ('no_intervention' as any) : ('clarification' as any),
        questionText: frictionLevel === 'quick' ? '' : mockQuestion,
        triggerReason: frictionLevel === 'quick' ? 'Quick flow selected' : 'Single high ERV intervention',
        shouldIntervene: frictionLevel !== 'quick',
        expectedReflectionValue: 0.85,
        smartSilenceMessage: frictionLevel === 'quick' ? 'נבחר מסלול מהיר. השיקולים והמתח המרכזי נוסחו במראה ללא התערבות נוספת.' : undefined,
        responseWidget: frictionLevel === 'deep' ? 'classification' : 'priority',
        responseOptions: frictionLevel === 'deep' 
          ? ['נתונים מוצקים בשטח', 'ניסיון עבר אישי', 'תחושת בטן']
          : ['פשטות ומהירות', 'עמידות לטווח ארוך'],
        isSecondary: false,
        origin: 'current_dilemma',
        createdAt: now
      };

      // Question 2: שאלת עבר מותנית - נוצרת רק אם יש הקשר עבר רלוונטי
      let mockHistorical: IlluminationQuestion | undefined;
      const lower = rawText.toLowerCase();
      if (lower.includes('תפקיד') || lower.includes('ילדים') || lower.includes('שכר') || lower.includes('job') || lower.includes('קבלן') || lower.includes('בטון')) {
        mockHistorical = {
          id: 'illum-hist-mock',
          caseId: 'dc-001',
          strategy: 'outcome_contract_anchor',
          origin: 'historical_precedent',
          questionText: 'במעבר התפקיד הקודם (2024) ציינת בדיעבד שזמן הבית היה קריטי בהרבה ממה שהערכת. האם הלקח הזה תקף להחלטה הנוכחית?',
          triggerReason: 'זוהה תקדים עבר ישיר בנושא דומה',
          shouldIntervene: true,
          isSecondary: true,
          canSkip: true,
          responseWidget: 'confirmation',
          responseOptions: ['כן, לקח רלוונטי', 'לא, הנסיבות שונות'],
          createdAt: now
        };
      }

      const mockInsight: RefinedInsight = {
        before: 'חשש שהתפקיד יפגע בזמן עם הילדים או פחד משינוי',
        now: 'החשש מתמקד בזמינות בערבים שעדיין לא בוררה',
        chosenStep: 'לשאול את המנהל על ציפיות הזמינות בערב לפני מתן תשובה'
      };

      const mockOptions: Option[] = [
        { id: 'opt-1', caseId: 'dc-001', userId: 'noam', title: 'קבלת התפקיד במתכונתו הנוכחית', origin: 'proposed_by_user', wasSelected: false, createdAt: now },
        { id: 'opt-2', caseId: 'dc-001', userId: 'noam', title: 'בירור ציפיות זמינות ותיאום יום קבוע ללא ערב', origin: 'proposed_by_user', wasSelected: false, createdAt: now }
      ];

      const mockSignature: DecisionSignature = {
        id: 'sig-001',
        caseId: 'dc-001',
        userId: 'noam',
        commitmentGradient: 0.75,
        informationCostRatio: 0.9,
        reversibilityDecayDays: 60,
        principalAgentTension: 'sole_actor',
        decisionTempo: 'tactical_weeks'
      };

      setActiveCase(mockCase);
      setOptions(mockOptions);
      setSignature(mockSignature);
      setIlluminationQuestion(mockQuestion);
      setBespokeQuestion(mockBespoke);
      setHistoricalQuestion(mockHistorical);
      setRefinedInsight(mockInsight);

      setIsLoading(false);
      setStep('decision_room');
    }, 1000);
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
    // Reset back to capture
    setStep('capture');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={LuxuryTheme.background.base} />
      <View style={styles.inner}>
        {step === 'capture' && (
          <QuickCaptureScreen
            onCaptureSubmit={handleCaptureSubmit}
            isLoading={isLoading}
          />
        )}

        {step === 'profile' && (
          <DecisionProfileScreen
            onBack={() => setStep('capture')}
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
            similarCaseAnalogy={{
              title: 'החלטה קודמת על תפקיד (2024)',
              reason: 'ציינת לאחר חודשיים שהעצמאות וזמן הבית היו חשובים לך יותר משציפית.',
              strength: 'strong'
            }}
            onAnswerSubmit={handleDecisionAnswer}
            onMirrorUpdate={handleMirrorUpdate}
          />
        )}

        {step === 'outcome' && activeCase && (
          <OutcomeModal
            caseTitle={activeCase.dimConsideration || activeCase.title}
            nextStepChosen={chosenNextStep}
            onSubmitOutcome={handleOutcomeSubmit}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.background.base
  },
  inner: {
    flex: 1
  }
});
