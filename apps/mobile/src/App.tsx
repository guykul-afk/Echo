import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { LuxuryTheme } from './theme/colors.js';
import { QuickCaptureScreen } from './screens/QuickCaptureScreen.js';
import { DecisionRoomScreen } from './screens/DecisionRoomScreen.js';
import { OutcomeModal } from './screens/OutcomeModal.js';
import { DecisionCase, Option, DecisionSignature, RefinedInsight, QuickLoopStatus, FiveHumanDimensions } from '@echo/shared';

type AppStep = 'capture' | 'decision_room' | 'outcome';

export const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('capture');
  const [isLoading, setIsLoading] = useState(false);

  // Active Case State
  const [activeCase, setActiveCase] = useState<DecisionCase | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [signature, setSignature] = useState<DecisionSignature | null>(null);
  const [illuminationQuestion, setIlluminationQuestion] = useState<string>('');
  const [refinedInsight, setRefinedInsight] = useState<RefinedInsight | undefined>(undefined);
  const [chosenNextStep, setChosenNextStep] = useState<string>('');

  // 1. Handle Quick Capture
  const handleCaptureSubmit = (rawText: string) => {
    setIsLoading(true);
    setTimeout(() => {
      const now = Date.now();
      const mockCase: DecisionCase = {
        id: 'dc-001',
        userId: 'user-noam',
        title: 'שקילת מעבר לתפקיד חדש מול זמן עם הילדים',
        status: 'deliberating',
        family: 'career_transition',
        contextStakes: 'high',
        contextReversibility: 'partially_reversible',
        contextTimePressure: 'medium',
        rawCaptureText: rawText || 'אני שוקל לקחת את התפקיד. השכר טוב יותר, אבל אני חושש שלא יהיה לי זמן לילדים. אולי אני סתם מפחד משינוי.',
        frozenAt: now,
        frictionLevel: 'focused',
        dimConsideration: 'מעבר לתפקיד חדש',
        dimGoalsPrices: 'התקדמות והכנסה גבוהה יותר, תוך שמירה על זמן ונוכחות בבית',
        dimReliance: 'הצעת שכר טובה יותר, תחושת חשש כללית',
        dimUnknowns: 'מה יהיו שעות העבודה והזמינות בערבים בפועל',
        createdAt: now,
        updatedAt: now
      };

      const mockQuestion = 'אם אי אפשר לקבל את שניהם במלואם, על מה פחות תרצה לוותר?';

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

        {step === 'decision_room' && activeCase && (
          <DecisionRoomScreen
            decisionCase={activeCase}
            options={options}
            signature={signature || undefined}
            illuminationQuestion={illuminationQuestion}
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
