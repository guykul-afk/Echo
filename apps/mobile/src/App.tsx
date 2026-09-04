import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { LuxuryTheme } from './theme/colors.js';
import { QuickCaptureScreen } from './screens/QuickCaptureScreen.js';
import { DecisionRoomScreen } from './screens/DecisionRoomScreen.js';
import { EvaluationContractScreen } from './screens/EvaluationContractScreen.js';
import { OutcomeModal } from './screens/OutcomeModal.js';
import { EpistemicMirrorScreen } from './screens/EpistemicMirrorScreen.js';
import { DecisionCase, Statement, Option, DecisionSignature, EpistemicState, IlluminationQuestion } from '@echo/shared';

type AppStep = 'capture' | 'mirror' | 'decision_room' | 'contract' | 'outcome';

export const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('capture');
  const [isLoading, setIsLoading] = useState(false);

  // Active Case State
  const [activeCase, setActiveCase] = useState<DecisionCase | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [signature, setSignature] = useState<DecisionSignature | null>(null);
  const [illuminationQuestion, setIlluminationQuestion] = useState<string>('');
  const [targetCriteria, setTargetCriteria] = useState<string>('');
  const [epistemicState, setEpistemicState] = useState<EpistemicState | null>(null);
  const [bespokeQuestion, setBespokeQuestion] = useState<IlluminationQuestion | null>(null);

  // 1. Handle Quick Capture
  const handleCaptureSubmit = (rawText: string) => {
    setIsLoading(true);
    setTimeout(() => {
      const now = Date.now();
      const mockCase: DecisionCase = {
        id: 'dc-001',
        userId: 'noam-user',
        title: 'האם להמשיך להשקיע בפרויקט אטלס',
        status: 'deliberating',
        family: 'continue_or_stop',
        contextStakes: 'high',
        contextReversibility: 'partially_reversible',
        contextTimePressure: 'medium',
        rawCaptureText: rawText,
        frozenAt: now,
        createdAt: now,
        updatedAt: now
      };

      const mockEpistemic: EpistemicState = {
        caseId: 'dc-001',
        userId: 'noam-user',
        facts: ['אין לקוח משלם עדיין', 'שני לקוחות רוצים לבדוק את המוצר'],
        assumptions: ['הלקוחות יסכימו להמיר לתשלום', 'המוצר נראה הרבה יותר טוב'],
        unknowns: ['האם נכונות לשלם מחייבת שלושה חודשים נוספים'],
        affect: 'anxious',
        riskClass: 'mediocristan',
        reversibility: 'partially_reversible',
        contradictions: [],
        locusOfControl: 'internal',
        conviction: 'moderate',
        extractedAt: now
      };

      const mockBespoke: IlluminationQuestion = {
        id: 'illum-001',
        caseId: 'dc-001',
        strategy: 'cheap_information_action',
        questionText: 'ציינת ששני לקוחות רוצים לבדוק את המוצר. האם צריך באמת שלושה חודשים כדי לבדוק נכונות לשלם, או שיש דרך זולה ומהירה יותר לקבל את המידע?',
        triggerReason: 'High unknowns with cheap test available',
        isSecondary: false,
        createdAt: now
      };

      const mockStatements: Statement[] = [
        { id: '1', caseId: 'dc-001', userId: 'noam', text: 'אימות היתכנות מסחרית מבלי לבזבז קיבולת צוות מוגבלת', role: 'goal', provenanceSource: 'inferred_by_ai', confidenceScore: 0.95, createdAt: now },
        { id: '2', caseId: 'dc-001', userId: 'noam', text: 'אין לקוח משלם עדיין', role: 'observation', provenanceSource: 'inferred_by_ai', confidenceScore: 0.98, createdAt: now },
        { id: '3', caseId: 'dc-001', userId: 'noam', text: 'שני לקוחות רוצים לבדוק את המוצר', role: 'observation', provenanceSource: 'inferred_by_ai', confidenceScore: 0.96, createdAt: now },
        { id: '4', caseId: 'dc-001', userId: 'noam', text: 'המוצר נראה הרבה יותר טוב', role: 'evaluation', provenanceSource: 'inferred_by_ai', confidenceScore: 0.9, createdAt: now },
        { id: '5', caseId: 'dc-001', userId: 'noam', text: 'הלקוחות המתעניינים יסכימו להמיר לשימוש בתשלום', role: 'assumption', provenanceSource: 'inferred_by_ai', confidenceScore: 0.88, createdAt: now },
        { id: '6', caseId: 'dc-001', userId: 'noam', text: 'האם נכונות לשלם מחייבת שלושה חודשים נוספים', role: 'unknown', provenanceSource: 'inferred_by_ai', confidenceScore: 0.84, createdAt: now }
      ];

      const mockOptions: Option[] = [
        { id: 'opt-1', caseId: 'dc-001', userId: 'noam', title: 'להמשיך השקעה למשך 3 חודשים נוספים', origin: 'proposed_by_user', wasSelected: false, createdAt: now },
        { id: 'opt-2', caseId: 'dc-001', userId: 'noam', title: 'להציע פיילוט בתשלום בתוך שבועיים', origin: 'proposed_by_user', wasSelected: false, createdAt: now }
      ];

      const mockSignature: DecisionSignature = {
        id: 'sig-001',
        caseId: 'dc-001',
        userId: 'noam',
        commitmentGradient: 0.8,
        informationCostRatio: 0.9,
        reversibilityDecayDays: 90,
        principalAgentTension: 'team_alignment',
        decisionTempo: 'tactical_weeks'
      };

      setActiveCase(mockCase);
      setEpistemicState(mockEpistemic);
      setBespokeQuestion(mockBespoke);
      setStatements(mockStatements);
      setOptions(mockOptions);
      setSignature(mockSignature);
      setIlluminationQuestion(mockBespoke.questionText);

      setIsLoading(false);
      setStep('mirror');
    }, 1200);
  };

  // 2. Handle Epistemic Mirror / Illumination Answer
  const handleMirrorProceed = (_answer: string) => {
    setStep('contract');
  };

  // 3. Handle Finalizing Evaluation Contract
  const handleFinalizeContract = (contractData: { targetCriteria: string }) => {
    setTargetCriteria(contractData.targetCriteria);
    setStep('outcome');
  };

  // 4. Handle Outcome Submit
  const handleOutcomeSubmit = (_outcome: any) => {
    // Reset to capture for next decision
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

        {step === 'mirror' && epistemicState && bespokeQuestion && (
          <EpistemicMirrorScreen
            epistemicState={epistemicState}
            illuminationQuestion={bespokeQuestion}
            onProceedToContract={handleMirrorProceed}
          />
        )}

        {step === 'decision_room' && activeCase && signature && (
          <DecisionRoomScreen
            decisionCase={activeCase}
            statements={statements}
            options={options}
            signature={signature}
            illuminationQuestion={illuminationQuestion}
            similarCaseAnalogy={{
              title: 'החלטה קודמת: המשך השקעה במוצר מול אימות ראשוני',
              reason: 'התאמה מבנית גבוהה: התחייבות גדולה + אותות ראשוניים חיוביים + אפשרות לבדיקה זולה יותר.',
              strength: 'strong'
            }}
            onAnswerSubmit={handleMirrorProceed}
          />
        )}

        {step === 'contract' && (
          <EvaluationContractScreen
            options={options}
            onFinalize={handleFinalizeContract}
          />
        )}

        {step === 'outcome' && activeCase && (
          <OutcomeModal
            caseTitle={activeCase.title}
            originalCriteria={targetCriteria || 'לקוח אחד משלם תוך 6 שבועות'}
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
