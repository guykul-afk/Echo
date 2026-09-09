import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';
import { DecisionCase, Option, DecisionSignature, RefinedInsight, FiveHumanDimensions, IlluminationQuestion } from '@echo/shared';

const SCREEN_HEIGHT = 700;

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

  const scrollToStage = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: index * (SCREEN_HEIGHT - 80), animated: true });
    }
  };

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
    scrollToStage(5); // Scroll to Summary card
  };

  const handleSkip = () => {
    const refined: RefinedInsight = {
      before: consideration,
      now: 'נשמר המצב המקורי ללא הרחבה נוספת',
      chosenStep: 'שמירה והמשך מעקב'
    };
    setInsight(refined);
    onAnswerSubmit('', true);
    scrollToStage(5);
  };

  return (
    <ScrollView 
      ref={scrollRef}
      style={styles.container}
      pagingEnabled
      showsVerticalScrollIndicator={false}
    >
      {/* ================= CARD 1: הדילמה ================= */}
      <View style={styles.cardSection}>
        <View style={styles.cardHeader}>
          <Text style={styles.stageTag}>1 · הדילמה שלך</Text>
          <Text style={styles.scrollTip}>גלול מטה או מעלה בכל עת</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.heroHeadline}>
            {consideration}
          </Text>

          <View style={styles.editBox}>
            <View style={styles.editBoxHeader}>
              <Text style={styles.editLabel}>הניסוח שלך:</Text>
              <TouchableOpacity onPress={() => startVoiceInput(val => handleFieldChange('consideration', val))}>
                <Text style={styles.micBtn}>🎙️ עדכן בקול</Text>
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
        </View>

        <TouchableOpacity style={styles.bottomArrow} onPress={() => scrollToStage(1)}>
          <Text style={styles.arrowText}>המתח המרכזי ↓</Text>
        </TouchableOpacity>
      </View>

      {/* ================= CARD 2: המתח המרכזי ================= */}
      <View style={styles.cardSection}>
        <View style={styles.cardHeader}>
          <Text style={styles.stageTag}>2 · המתח המרכזי</Text>
          <TouchableOpacity onPress={() => scrollToStage(0)}>
            <Text style={styles.backTip}>↑ חזרה לדילמה</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.subPrompt}>מה עומד מול מה? ערכים, מטרות ומחירים:</Text>
          <Text style={styles.editorialQuote}>{centralTension}</Text>

          <View style={styles.editBox}>
            <View style={styles.editBoxHeader}>
              <Text style={styles.editLabel}>מטרות ומחירים שחשובים לך:</Text>
              <TouchableOpacity onPress={() => startVoiceInput(val => handleFieldChange('goalsPrices', val))}>
                <Text style={styles.micBtn}>🎙️ עדכן בקול</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.largeInput}
              multiline
              value={goalsPrices}
              onChangeText={val => handleFieldChange('goalsPrices', val)}
              placeholder="מה חשוב לך להשיג, ועל מה אתה לא מוכן לוותר..."
              placeholderTextColor={LuxuryTheme.text.tertiary}
              textAlign="right"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.bottomArrow} onPress={() => scrollToStage(2)}>
          <Text style={styles.arrowText}>מה שידוע בבירור ↓</Text>
        </TouchableOpacity>
      </View>

      {/* ================= CARD 3: מה שידוע בבירור (עובדות) ================= */}
      <View style={styles.cardSection}>
        <View style={styles.cardHeader}>
          <Text style={[styles.stageTag, { color: '#38BDF8' }]}>3 · מה שידוע בבירור</Text>
          <TouchableOpacity onPress={() => scrollToStage(1)}>
            <Text style={styles.backTip}>↑ חזרה למתח</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.subPrompt}>נתונים, התרחשויות קונקרטיות ומידע מוצק:</Text>

          <View style={[styles.editBox, { borderColor: 'rgba(56, 189, 248, 0.35)', backgroundColor: 'rgba(56, 189, 248, 0.03)' }]}>
            <View style={styles.editBoxHeader}>
              <Text style={[styles.editLabel, { color: '#38BDF8', fontWeight: '600' }]}>עובדות מוצקות:</Text>
              <TouchableOpacity onPress={() => startVoiceInput(val => handleFieldChange('facts', val))}>
                <Text style={[styles.micBtn, { color: '#38BDF8' }]}>🎙️ עדכן בקול</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.largeInput, { minHeight: 90 }]}
              multiline
              value={facts}
              onChangeText={val => handleFieldChange('facts', val)}
              placeholder="נתונים ועובדות מוצקות שאינם מוטלים בספק..."
              placeholderTextColor={LuxuryTheme.text.tertiary}
              textAlign="right"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.bottomArrow} onPress={() => scrollToStage(3)}>
          <Text style={styles.arrowText}>ההנחה המובילה ↓</Text>
        </TouchableOpacity>
      </View>

      {/* ================= CARD 4: ההנחה המובילה ================= */}
      <View style={styles.cardSection}>
        <View style={styles.cardHeader}>
          <Text style={styles.stageTag}>4 · ההנחה המובילה</Text>
          <TouchableOpacity onPress={() => scrollToStage(2)}>
            <Text style={styles.backTip}>↑ חזרה לעובדות</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.subPrompt}>על מה אתה מסתמך? השערות וציפיות לעתיד:</Text>

          <View style={[styles.editBox, { borderColor: 'rgba(212, 175, 55, 0.35)', backgroundColor: 'rgba(212, 175, 55, 0.03)' }]}>
            <View style={styles.editBoxHeader}>
              <Text style={[styles.editLabel, { color: LuxuryTheme.accent.gold, fontWeight: '600' }]}>ההנחה שמובילה אותך:</Text>
              <TouchableOpacity onPress={() => startVoiceInput(val => handleFieldChange('assumptions', val))}>
                <Text style={styles.micBtn}>🎙️ עדכן בקול</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.largeInput, { minHeight: 90 }]}
              multiline
              value={assumptions}
              onChangeText={val => handleFieldChange('assumptions', val)}
              placeholder="השערות, ציפיות ותרחישים שאתה מניח שיתממשו..."
              placeholderTextColor={LuxuryTheme.text.tertiary}
              textAlign="right"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.bottomArrow} onPress={() => scrollToStage(4)}>
          <Text style={styles.arrowText}>שאלה שתעשה סדר ↓</Text>
        </TouchableOpacity>
      </View>

      {/* ================= CARD 5: שאלה שתעשה סדר ================= */}
      <View style={styles.cardSection}>
        <View style={styles.cardHeader}>
          <Text style={styles.stageTag}>5 · שאלה שתעשה סדר</Text>
          <TouchableOpacity onPress={() => scrollToStage(3)}>
            <Text style={styles.backTip}>↑ חזרה להנחות</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.questionText}>
            "{effectiveQuestion}"
          </Text>

          {/* Audio-First Voice Button */}
          <TouchableOpacity
            style={[styles.bigVoiceBtn, isVoiceRecording && styles.bigVoiceBtnRecording]}
            onPress={() => startVoiceInput(setUserAnswer)}
          >
            <Text style={styles.bigVoiceBtnText}>
              {isVoiceRecording ? '● מקשיב... לחץ לסיום' : '🎙️ הקלט תשובה בקול (דיבור חופשי)'}
            </Text>
          </TouchableOpacity>

          {/* 1-Tap Quick Chips */}
          <View style={styles.chipsRow}>
            {['נתונים מוצקים', 'ניסיון עבר', 'תחושת בטן', 'לא בטוח'].map(chip => (
              <TouchableOpacity 
                key={chip} 
                style={styles.chipBtn}
                onPress={() => handleProceedWithAnswer(chip)}
              >
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Manual Input Fallback */}
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

        <TouchableOpacity style={styles.bottomArrow} onPress={() => scrollToStage(5)}>
          <Text style={styles.arrowText}>לסיכום ↓</Text>
        </TouchableOpacity>
      </View>

      {/* ================= CARD 6: סיכום ================= */}
      <View style={styles.cardSection}>
        <View style={styles.cardHeader}>
          <Text style={styles.stageTag}>6 · סיכום</Text>
          <TouchableOpacity onPress={() => scrollToStage(4)}>
            <Text style={styles.backTip}>↑ חזרה לשאלה</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.heroHeadline}>סיכום ההחלטה</Text>
          <Text style={styles.subPrompt}>המסקנה המזוקקת והצעד המעשי שנקבע:</Text>

          <View style={styles.insightBox}>
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>נקודת המוצא:</Text>
              <Text style={styles.insightVal}>{insight?.before || consideration}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.insightRow}>
              <Text style={[styles.insightLabel, { color: LuxuryTheme.accent.emeraldSuccess }]}>המסקנה כעת:</Text>
              <Text style={[styles.insightVal, { color: LuxuryTheme.accent.emeraldSuccess, fontWeight: '600' }]}>
                {insight?.now || userAnswer || 'הבנת את גורם המפתח להכרעה'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.insightRow}>
              <Text style={[styles.insightLabel, { color: LuxuryTheme.accent.gold }]}>הצעד שנבחר:</Text>
              <Text style={[styles.insightVal, { color: LuxuryTheme.accent.gold, fontWeight: '700' }]}>
                {insight?.chosenStep || 'בירור מוקדם לפני הכרעה'}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveDecisionBtn}
            onPress={handleSkip}
          >
            <Text style={styles.saveDecisionBtnText}>שמור בזיכרון ההחלטות ←</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.background.base
  },
  cardSection: {
    height: SCREEN_HEIGHT - 80,
    padding: 24,
    justifyContent: 'space-between'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  stageTag: {
    color: LuxuryTheme.accent.gold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1
  },
  scrollTip: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 14
  },
  backTip: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 14
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
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
  questionText: {
    color: LuxuryTheme.accent.gold,
    fontSize: 22,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 30,
    fontFamily: 'serif',
    marginBottom: 12
  },
  editBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    padding: 14
  },
  editBoxHeader: {
    flexDirection: 'row',
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
    minHeight: 60,
    textAlignVertical: 'top'
  },
  compactBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12
  },
  compactInput: {
    color: LuxuryTheme.text.primary,
    fontSize: 15,
    minHeight: 40,
    textAlignVertical: 'top'
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center'
  },
  chipBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  chipText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 15
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
    fontSize: 15,
    textDecorationLine: 'underline'
  },
  insightBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  insightRow: {
    gap: 4
  },
  insightLabel: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 14
  },
  insightVal: {
    color: LuxuryTheme.text.secondary,
    fontSize: 16,
    textAlign: 'right'
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)'
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
  },
  bottomArrow: {
    alignItems: 'center',
    paddingVertical: 8
  },
  arrowText: {
    color: LuxuryTheme.accent.gold,
    fontSize: 12,
    fontWeight: '500'
  }
});
