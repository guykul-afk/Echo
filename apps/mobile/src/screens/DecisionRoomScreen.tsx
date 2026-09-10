import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LuxuryTheme } from '../theme/colors';
import { DecisionCase, Option, DecisionSignature, RefinedInsight, FiveHumanDimensions, IlluminationQuestion } from '@echo/shared';
import { DecisionFlowPipeline } from '../graphics/DecisionFlowPipeline';
import { EchoPastCard } from '../components/EchoPastCard';

interface DecisionRoomScreenProps {
  decisionCase: DecisionCase;
  options?: Option[];
  signature?: DecisionSignature;
  illuminationQuestion?: string;
  bespokeQuestion?: IlluminationQuestion;
  historicalQuestion?: IlluminationQuestion;
  similarCaseAnalogy?: { title: string; reason: string; strength: string };
  initialRefinedInsight?: RefinedInsight;
  onAnswerSubmit: (answer: string, skip?: boolean) => void;
  onMirrorUpdate?: (updatedFields: FiveHumanDimensions) => void;
  onMirrorFeedback?: (feedback: 'accurate' | 'inaccurate') => void;
}

export const DecisionRoomScreen: React.FC<DecisionRoomScreenProps> = ({
  decisionCase,
  illuminationQuestion,
  bespokeQuestion,
  historicalQuestion,
  similarCaseAnalogy,
  initialRefinedInsight,
  onAnswerSubmit,
  onMirrorUpdate,
  onMirrorFeedback
}) => {
  const scrollRef = useRef<any>(null);

  // 5 Dimensions state
  const [consideration, setConsideration] = useState(decisionCase.dimConsideration || decisionCase.title);
  const [goalsPrices, setGoalsPrices] = useState(decisionCase.dimGoalsPrices || '');
  const [facts, setFacts] = useState(decisionCase.dimFacts || decisionCase.dimReliance || '');
  const [assumptions, setAssumptions] = useState(decisionCase.dimAssumptions || '');
  const [missingInfo, setMissingInfo] = useState(decisionCase.dimMissingInfo || decisionCase.dimUnknowns || '');

  const centralTension = decisionCase.centralTension || goalsPrices || 'השגת המטרה מול מחירים ואילוצים';
  const effectiveQuestion = bespokeQuestion?.questionText || illuminationQuestion || 'מהו הנתון היחיד שיכריע עבורך?';
  const isSmartSilence = bespokeQuestion ? bespokeQuestion.shouldIntervene === false : false;

  const [userAnswer, setUserAnswer] = useState('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [insight, setInsight] = useState<RefinedInsight | null>(initialRefinedInsight || null);
  
  const [isContextExpanded, setIsContextExpanded] = useState(false);

  const startVoiceInput = (setter: (val: string) => void) => {
    const SpeechRec = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SpeechRec) {
      alert('הקלטה קולית נתמכת בדפדפן כרום או ספארי.');
      return;
    }

    if (isVoiceRecording) {
      setIsVoiceRecording(false);
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = 'he-IL';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (e: any) => {
        let full = '';
        for (let i = 0; i < e.results.length; ++i) {
          full += e.results[i][0].transcript + ' ';
        }
        setter(full.trim());
      };

      rec.onerror = () => setIsVoiceRecording(false);
      rec.onend = () => setIsVoiceRecording(false);

      rec.start();
      setIsVoiceRecording(true);
    } catch (err) {
      console.warn('Voice error:', err);
    }
  };

  const handleFieldChange = (field: 'consideration' | 'goalsPrices' | 'facts' | 'assumptions' | 'missingInfo', val: string) => {
    let nextConsideration = consideration;
    let nextGoalsPrices = goalsPrices;
    let nextFacts = facts;
    let nextAssumptions = assumptions;
    let nextMissingInfo = missingInfo;

    if (field === 'consideration') { nextConsideration = val; setConsideration(val); }
    if (field === 'goalsPrices') { nextGoalsPrices = val; setGoalsPrices(val); }
    if (field === 'facts') { nextFacts = val; setFacts(val); }
    if (field === 'assumptions') { nextAssumptions = val; setAssumptions(val); }
    if (field === 'missingInfo') { nextMissingInfo = val; setMissingInfo(val); }

    if (onMirrorUpdate) {
      onMirrorUpdate({
        consideration: nextConsideration,
        goalsPrices: nextGoalsPrices,
        facts: nextFacts,
        assumptions: nextAssumptions,
        missingInfo: nextMissingInfo,
        centralTension,
        keyHinge: nextMissingInfo,
        reliance: `${nextFacts} | ${nextAssumptions}`,
        unknowns: nextMissingInfo
      });
    }
  };

  const handleProceedWithAnswer = (answerText?: string) => {
    const finalAnswer = answerText || userAnswer || 'המסקנה המרכזית הוגדרה';
    const refined: RefinedInsight = {
      before: consideration,
      now: finalAnswer,
      chosenStep: finalAnswer.slice(0, 80) || 'בירור מוקדם לפני הכרעה'
    };
    setInsight(refined);
    onAnswerSubmit(finalAnswer, false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const handleSkip = () => {
    const refined: RefinedInsight = {
      before: consideration,
      now: 'נשמר המצב המקורי ללא הרחבה נוספת',
      chosenStep: 'שמירה והמשך מעקב'
    };
    setInsight(refined);
    onAnswerSubmit('', true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const toggleContext = () => {
    setIsContextExpanded(!isContextExpanded);
  };

  return (
    <ScrollView 
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ================= SECTION 1: Core Essence ================= */}
      <View style={styles.coreSection}>
        <Text style={styles.heroHeadline}>
          {consideration}
        </Text>

        <View style={styles.editBox}>
          <View style={styles.editBoxHeader}>
            <Text style={styles.editLabel}>הניסוח שלך:</Text>
            <TouchableOpacity onPress={() => startVoiceInput(val => handleFieldChange('consideration', val))}>
              <Text style={styles.micBtn}>🎙️ עדכן</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.largeInput}
            multiline
            value={consideration}
            onChangeText={val => handleFieldChange('consideration', val)}
            textAlign="right"
          />
        </View>

        <Text style={styles.subPrompt}>מה עומד מול מה? ערכים, מטרות ומחירים:</Text>
        <Text style={styles.editorialQuote}>{centralTension}</Text>

        <View style={styles.editBox}>
          <View style={styles.editBoxHeader}>
            <Text style={styles.editLabel}>מטרות ומחירים שחשובים לך:</Text>
            <TouchableOpacity onPress={() => startVoiceInput(val => handleFieldChange('goalsPrices', val))}>
              <Text style={styles.micBtn}>🎙️ עדכן</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.largeInput}
            multiline
            value={goalsPrices}
            onChangeText={val => handleFieldChange('goalsPrices', val)}
            placeholder="מה חשוב לך להשיג..."
            placeholderTextColor={LuxuryTheme.text.tertiary}
            textAlign="right"
          />
        </View>
      </View>

      {/* ================= SECTION 2: Progressive Disclosure (Facts & Assumptions) ================= */}
      <View style={styles.accordionWrapper}>
        <TouchableOpacity style={styles.accordionHeader} onPress={toggleContext} activeOpacity={0.8}>
          <Text style={styles.accordionTitle}>נתוני רקע והנחות עבודה</Text>
          <Text style={styles.accordionIcon}>{isContextExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {isContextExpanded && (
          <View style={styles.accordionContent}>
            <View style={[styles.editBox, { borderColor: 'rgba(212, 175, 55, 0.35)', backgroundColor: 'rgba(212, 175, 55, 0.03)' }]}>
              <View style={styles.editBoxHeader}>
                <Text style={[styles.editLabel, { color: LuxuryTheme.accent.gold, fontWeight: '600' }]}>עובדות מוצקות:</Text>
                <TouchableOpacity onPress={() => startVoiceInput(val => handleFieldChange('facts', val))}>
                  <Text style={styles.micBtn}>🎙️ עדכן</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.largeInput, { minHeight: 70 }]}
                multiline
                value={facts}
                onChangeText={val => handleFieldChange('facts', val)}
                placeholder="נתונים ועובדות..."
                placeholderTextColor={LuxuryTheme.text.tertiary}
                textAlign="right"
              />
            </View>

            <View style={[styles.editBox, { borderColor: 'rgba(212, 175, 55, 0.35)', backgroundColor: 'rgba(212, 175, 55, 0.03)', marginTop: 12 }]}>
              <View style={styles.editBoxHeader}>
                <Text style={[styles.editLabel, { color: LuxuryTheme.accent.gold, fontWeight: '600' }]}>ההנחה שמובילה אותך:</Text>
                <TouchableOpacity onPress={() => startVoiceInput(val => handleFieldChange('assumptions', val))}>
                  <Text style={styles.micBtn}>🎙️ עדכן</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.largeInput, { minHeight: 70 }]}
                multiline
                value={assumptions}
                onChangeText={val => handleFieldChange('assumptions', val)}
                placeholder="השערות, ציפיות..."
                placeholderTextColor={LuxuryTheme.text.tertiary}
                textAlign="right"
              />
            </View>
          </View>
        )}
      </View>

      {/* ================= SECTION 3: Echo from the Past ================= */}
      {(historicalQuestion || similarCaseAnalogy) && (
        <EchoPastCard
          title={similarCaseAnalogy?.title || 'תקדים עבר רלוונטי'}
          reason={similarCaseAnalogy?.reason || historicalQuestion?.questionText || ''}
          score={0.85}
        />
      )}

      {/* ================= SECTION 4: Bespoke Question ================= */}
      <View style={styles.questionSection}>
        <Text style={styles.questionText}>
          "{effectiveQuestion}"
        </Text>

        <TouchableOpacity
          style={[styles.bigVoiceBtn, isVoiceRecording && styles.bigVoiceBtnRecording]}
          onPress={() => startVoiceInput(setUserAnswer)}
        >
          <Text style={styles.bigVoiceBtnText}>
            {isVoiceRecording ? '● מקשיב... לחץ לסיום' : '🎙️ הקלט תשובה בקול (דיבור חופשי)'}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.answerInput}
          multiline
          placeholder="או הקלד תשובה ידנית..."
          placeholderTextColor={LuxuryTheme.text.tertiary}
          value={userAnswer}
          onChangeText={setUserAnswer}
          textAlign="right"
        />

        <TouchableOpacity style={styles.continueBtn} onPress={() => handleProceedWithAnswer()}>
          <Text style={styles.continueBtnText}>המשך עם המענה ←</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>מספיק לי לעכשיו — המשך ללא מענה</Text>
        </TouchableOpacity>
      </View>

      {/* ================= SECTION 5: Summary ================= */}
      {insight && (
        <View style={styles.summarySection}>
          <Text style={styles.heroHeadline}>שרשרת שיקול הדעת המזוקקת</Text>
          <Text style={styles.subPrompt}>כל התהליך כפי שהתחדד מהדילמה ועד לצעד המעשי:</Text>

          <DecisionFlowPipeline
            dilemma={consideration}
            goalsPrices={goalsPrices}
            facts={facts}
            assumptions={assumptions}
            question={effectiveQuestion}
            pastEcho={
              similarCaseAnalogy
                ? {
                    title: similarCaseAnalogy.title,
                    reason: similarCaseAnalogy.reason
                  }
                : historicalQuestion
                ? {
                    title: 'תקדים עבר רלוונטי',
                    reason: historicalQuestion.questionText
                  }
                : null
            }
            answer={userAnswer || undefined}
            conclusion={insight.now || userAnswer || 'הבנת את גורם המפתח להכרעה'}
            nextStep={insight.chosenStep || 'בירור מוקדם לפני הכרעה'}
            scrollable={false}
          />

          <TouchableOpacity 
            style={styles.saveDecisionBtn}
            onPress={handleSkip}
          >
            <Text style={styles.saveDecisionBtnText}>שמור בזיכרון ההחלטות ←</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.background.base
  },
  content: {
    padding: 24,
    paddingTop: 40,
    gap: 24
  },
  coreSection: {
    gap: 16
  },
  heroHeadline: {
    color: LuxuryTheme.text.primary,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    textAlign: 'right',
    fontFamily: 'serif'
  },
  subPrompt: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 15,
    textAlign: 'right'
  },
  editorialQuote: {
    color: LuxuryTheme.accent.gold,
    fontSize: 20,
    fontStyle: 'italic',
    lineHeight: 28,
    textAlign: 'right',
    fontFamily: 'serif'
  },
  editBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    padding: 14
  },
  editBoxHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  editLabel: {
    color: LuxuryTheme.text.secondary,
    fontSize: 15
  },
  micBtn: {
    color: LuxuryTheme.accent.gold,
    fontSize: 14,
    fontWeight: '600'
  },
  largeInput: {
    color: LuxuryTheme.text.primary,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 50,
    textAlignVertical: 'top'
  },
  accordionWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden'
  },
  accordionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.03)'
  },
  accordionTitle: {
    color: LuxuryTheme.text.secondary,
    fontSize: 15,
    fontWeight: '600'
  },
  accordionIcon: {
    color: LuxuryTheme.accent.gold,
    fontSize: 14
  },
  accordionContent: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)'
  },
  questionSection: {
    marginTop: 12,
    gap: 16,
    padding: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)'
  },
  questionText: {
    color: LuxuryTheme.accent.gold,
    fontSize: 22,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 30,
    fontFamily: 'serif',
    marginBottom: 8
  },
  bigVoiceBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: LuxuryTheme.accent.gold,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bigVoiceBtnRecording: {
    borderColor: '#F43F5E',
    backgroundColor: 'rgba(244, 63, 94, 0.2)'
  },
  bigVoiceBtnText: {
    color: LuxuryTheme.accent.gold,
    fontSize: 14,
    fontWeight: '700'
  },
  answerInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    color: LuxuryTheme.text.primary,
    fontSize: 15,
    minHeight: 50,
    textAlignVertical: 'top'
  },
  continueBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: LuxuryTheme.accent.gold,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  continueBtnText: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 4
  },
  skipBtnText: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 14,
    textDecorationLine: 'underline'
  },
  summarySection: {
    marginTop: 24,
    gap: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)'
  },
  saveDecisionBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    borderWidth: 1,
    borderColor: LuxuryTheme.accent.gold,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12
  },
  saveDecisionBtnText: {
    color: LuxuryTheme.text.primary,
    fontSize: 15,
    fontWeight: '700'
  }
});
