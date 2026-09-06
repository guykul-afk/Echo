import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';
import { DecisionCase, Option, DecisionSignature, RefinedInsight, FiveHumanDimensions, IlluminationQuestion } from '@echo/shared';

interface DecisionRoomScreenProps {
  decisionCase: DecisionCase;
  options?: Option[];
  signature?: DecisionSignature;
  illuminationQuestion?: string;
  bespokeQuestion?: IlluminationQuestion;
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
  similarCaseAnalogy,
  initialRefinedInsight,
  onAnswerSubmit,
  onMirrorUpdate,
  onMirrorFeedback
}) => {
  // 5 Human Dimensions local state for direct live editing in the expanded map
  const [consideration, setConsideration] = useState(decisionCase.dimConsideration || decisionCase.title);
  const [goalsPrices, setGoalsPrices] = useState(decisionCase.dimGoalsPrices || '');
  const [facts, setFacts] = useState(decisionCase.dimFacts || decisionCase.dimReliance || '');
  const [assumptions, setAssumptions] = useState(decisionCase.dimAssumptions || '');
  const [missingInfo, setMissingInfo] = useState(decisionCase.dimMissingInfo || decisionCase.dimUnknowns || '');

  // First 20 Seconds state
  const centralTension = decisionCase.centralTension || 'פשטות ורציפות מול תלות גבוהה או אילוצים מתחרים';
  const keyHinge = decisionCase.keyHinge || decisionCase.dimMissingInfo || 'בדיקת ההנחה המרכזית שמובילה את ההכרעה';
  const [mirrorFeedback, setMirrorFeedback] = useState<'accurate' | 'inaccurate' | null>(decisionCase.mirrorFeedback || null);
  const [showThinkingMap, setShowThinkingMap] = useState(false);
  const [showPastDetails, setShowPastDetails] = useState(false);

  const effectiveQuestion = bespokeQuestion?.questionText || illuminationQuestion;
  const isSmartSilence = bespokeQuestion ? bespokeQuestion.shouldIntervene === false : false;
  const shouldIntervene = bespokeQuestion ? bespokeQuestion.shouldIntervene !== false : Boolean(effectiveQuestion);

  const [userAnswer, setUserAnswer] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [activeTab, setActiveTab] = useState<'mirror' | 'insight'>('mirror');
  const [insight, setInsight] = useState<RefinedInsight | null>(initialRefinedInsight || null);

  const handleWidgetSelect = (optionText: string) => {
    setUserAnswer(optionText);
    const refined: RefinedInsight = {
      before: consideration,
      now: optionText,
      chosenStep: optionText.slice(0, 80)
    };
    setInsight(refined);
    setActiveTab('insight');
    onAnswerSubmit(optionText, false);
  };

  const handleFeedbackClick = (feedback: 'accurate' | 'inaccurate') => {
    setMirrorFeedback(feedback);
    if (onMirrorFeedback) {
      onMirrorFeedback(feedback);
    }
    if (feedback === 'inaccurate') {
      setShowThinkingMap(true);
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
        keyHinge,
        reliance: `${nextFacts} | ${nextAssumptions}`,
        unknowns: nextMissingInfo
      });
    }
  };

  const handleProceedWithAnswer = () => {
    const refined: RefinedInsight = {
      before: consideration,
      now: userAnswer || 'התחדדו השיקולים המרכזיים',
      chosenStep: userAnswer.slice(0, 80) || 'בירור מוקדם לפני הכרעה'
    };
    setInsight(refined);
    setActiveTab('insight');
    onAnswerSubmit(userAnswer, false);
  };

  const handleSkip = () => {
    const refined: RefinedInsight = {
      before: consideration,
      now: 'נשמר המצב המקורי ללא הרחבה נוספת',
      chosenStep: 'שמירה והמשך מעקב'
    };
    setInsight(refined);
    setActiveTab('insight');
    onAnswerSubmit('', true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Frozen Timestamp Badge */}
      <TouchableOpacity
        style={styles.frozenBadge}
        activeOpacity={0.7}
        onPress={() => setShowRawText(!showRawText)}
      >
        <Text style={styles.frozenText}>
          🔒 מצב חשיבה ראשוני הוקפא @ {new Date(decisionCase.frozenAt).toLocaleTimeString('he-IL')} (הקש לצפייה במקור)
        </Text>
      </TouchableOpacity>

      {showRawText && (
        <View style={styles.rawCard}>
          <Text style={styles.rawTitle}>הניסוח המקורי המדויק (ללא שינוי):</Text>
          <Text style={styles.rawContent}>{decisionCase.rawCaptureText}</Text>
        </View>
      )}

      {/* --- THE FIRST 20 SECONDS CARD (סעיף 27 בביקורת) --- */}
      <View style={styles.first20Card}>
        <View style={styles.first20HeaderRow}>
          <Text style={styles.first20Tag}>20 שניות לבהירות</Text>
          <Text style={styles.first20Title}>כך אני מבין את ההחלטה</Text>
        </View>

        {/* אתה מנסה להחליט אם... */}
        <Text style={styles.decisionOneLiner}>
          {consideration}
        </Text>

        {/* המתח המרכזי */}
        <View style={styles.tensionBox}>
          <Text style={styles.subHeadingLabel}>המתח המרכזי</Text>
          <Text style={styles.tensionText}>{centralTension}</Text>
        </View>

        {/* נראה שההכרעה תלויה בעיקר ב... */}
        <View style={styles.hingeBox}>
          <Text style={styles.subHeadingLabel}>נראה שההכרעה תלויה בעיקר ב...</Text>
          <Text style={styles.hingeText}>{keyHinge}</Text>
        </View>

        {/* כפתורי משוב מיידיים: מדויק / לא בדיוק */}
        <View style={styles.feedbackRow}>
          <TouchableOpacity
            style={[
              styles.feedbackBtn,
              mirrorFeedback === 'accurate' && styles.feedbackBtnActiveAccurate
            ]}
            onPress={() => handleFeedbackClick('accurate')}
          >
            <Text style={[
              styles.feedbackBtnText,
              mirrorFeedback === 'accurate' && styles.feedbackBtnTextActive
            ]}>
              מדויק ✓
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.feedbackBtn,
              mirrorFeedback === 'inaccurate' && styles.feedbackBtnActiveInaccurate
            ]}
            onPress={() => handleFeedbackClick('inaccurate')}
          >
            <Text style={[
              styles.feedbackBtnText,
              mirrorFeedback === 'inaccurate' && styles.feedbackBtnTextActive
            ]}>
              לא בדיוק ✎
            </Text>
          </TouchableOpacity>
        </View>

        {/* כפתור מעבר למפת החשיבה המורחבת */}
        <TouchableOpacity
          style={styles.toggleMapBtn}
          onPress={() => setShowThinkingMap(!showThinkingMap)}
        >
          <Text style={styles.toggleMapBtnText}>
            {showThinkingMap ? 'הסתר את מפת החשיבה ▲' : 'ראה את מפת החשיבה המלאה (3 קבוצות) ▼'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- שילוב הזיכרון במסך הראשון (סעיף 28 בביקורת - רק אם קיים ערך גבוה) --- */}
      {similarCaseAnalogy && (
        <View style={styles.memoryPillCard}>
          <View style={styles.memoryPillHeader}>
            <Text style={styles.memoryPillTag}>רלוונטי מהעבר</Text>
            <Text style={styles.memoryPillTitle}>החלטה קודמת שלך בנושא דומה</Text>
          </View>
          <Text style={styles.memoryPillBody}>{similarCaseAnalogy.reason}</Text>

          <TouchableOpacity
            style={styles.memoryPillAction}
            onPress={() => setShowPastDetails(!showPastDetails)}
          >
            <Text style={styles.memoryPillActionText}>
              {showPastDetails ? 'הסתר פרטים ▲' : 'ראה מה קרה שם ←'}
            </Text>
          </TouchableOpacity>

          {showPastDetails && (
            <View style={styles.pastDetailsContent}>
              <Text style={styles.pastDetailsTitle}>{similarCaseAnalogy.title}</Text>
              <Text style={styles.pastDetailsStrength}>עוצמת התאמה מבנית: {similarCaseAnalogy.strength}</Text>
            </View>
          )}
        </View>
      )}

      {/* --- המסך המורחב: 3 קבוצות, לא 5 תיבות (סעיף 29 בביקורת) --- */}
      {showThinkingMap && (
        <View style={styles.expandedMapContainer}>
          <Text style={styles.expandedMapHeader}>מפת החשיבה המפורטת (ניתנת לעריכה)</Text>

          {/* קבוצה 1: מה חשוב לך */}
          <View style={styles.groupCard}>
            <Text style={[styles.groupTitle, { color: LuxuryTheme.epistemicRoles.goal }]}>
              1. מה חשוב לך להשיג או לשמור
            </Text>
            <Text style={styles.groupDesc}>ערכים, עקרונות ומחירים שאתה חושש לשלם</Text>
            <TextInput
              style={styles.editableInput}
              multiline
              value={goalsPrices}
              onChangeText={val => handleFieldChange('goalsPrices', val)}
              textAlign="right"
            />
          </View>

          {/* קבוצה 2: על מה אתה נשען כרגע */}
          <View style={[styles.groupCard, styles.relianceGroupCard]}>
            <Text style={[styles.groupTitle, { color: '#38BDF8' }]}>
              2. על מה אתה נשען כרגע
            </Text>
            <Text style={styles.groupDesc}>הפרדה קרה בין דברים שאמרת כעובדות לבין השערות</Text>

            {/* תת-סעיף: אמרת (עובדות קשיחות) */}
            <View style={styles.subGroupBlock}>
              <Text style={styles.subGroupTag}>● אמרת (עובדות קשיחות)</Text>
              <TextInput
                style={styles.editableInput}
                multiline
                value={facts}
                onChangeText={val => handleFieldChange('facts', val)}
                textAlign="right"
              />
            </View>

            {/* תת-סעיף: נראה שאתה מניח (הנחות לעתיד) */}
            <View style={[styles.subGroupBlock, styles.assumptionSubBlock]}>
              <Text style={[styles.subGroupTag, { color: LuxuryTheme.epistemicRoles.assumption }]}>
                ▲ נראה שאתה מניח (השערות וציפיות)
              </Text>
              <TextInput
                style={styles.editableInput}
                multiline
                value={assumptions}
                onChangeText={val => handleFieldChange('assumptions', val)}
                textAlign="right"
              />
            </View>
          </View>

          {/* קבוצה 3: מה עדיין יכול לשנות את הבחירה */}
          <View style={styles.groupCard}>
            <Text style={[styles.groupTitle, { color: LuxuryTheme.epistemicRoles.unknown }]}>
              3. מה עדיין יכול לשנות את הבחירה
            </Text>
            <Text style={styles.groupDesc}>פערי מידע מרכזיים ושאלות שטרם בוררו</Text>
            <TextInput
              style={styles.editableInput}
              multiline
              value={missingInfo}
              onChangeText={val => handleFieldChange('missingInfo', val)}
              textAlign="right"
            />
          </View>
        </View>
      )}

      {/* --- שקט חכם (Smart Silence) כאשר ערך ההתערבות נמוך או במצב מהיר --- */}
      {isSmartSilence && activeTab === 'mirror' && (
        <View style={styles.smartSilenceCard}>
          <View style={styles.smartSilenceBadge}>
            <Text style={styles.smartSilenceBadgeText}>שקט חכם • Smart Silence</Text>
          </View>
          <Text style={styles.smartSilenceBody}>
            {bespokeQuestion?.smartSilenceMessage || 'נראה שכבר הפרדת היטב בין מה שאתה יודע לבין מה שאתה מניח. אין לי כרגע שאלה ששווה לעכב אותך בגללה.'}
          </Text>
          <TouchableOpacity
            style={styles.smartSilenceBtn}
            onPress={handleSkip}
          >
            <Text style={styles.smartSilenceBtnText}>שמור והמשך ללא התערבות ←</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- התערבות אדפטיבית ממוקדת --- */}
      {shouldIntervene && effectiveQuestion && activeTab === 'mirror' && (
        <View style={styles.illuminationHero}>
          <View style={styles.illuminationHeaderRow}>
            <View style={styles.illuminationBadge}>
              <Text style={styles.illuminationBadgeText}>התערבות ממוקדת אחת</Text>
            </View>
            {typeof bespokeQuestion?.expectedReflectionValue === 'number' && (
              <View style={styles.ervBadge}>
                <Text style={styles.ervBadgeText}>
                  ערך השהייה משוער: {Math.round(bespokeQuestion.expectedReflectionValue * 100)}%
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.illuminationQuestionText}>"{effectiveQuestion}"</Text>

          {/* ווידג'ט מענה מותאם בלחיצה אחת (Adaptive Response Widget) */}
          {bespokeQuestion?.responseWidget && bespokeQuestion.responseWidget !== 'text' && (
            <View style={styles.widgetSection}>
              <Text style={styles.widgetHeader}>
                {bespokeQuestion.responseWidget === 'priority' && 'בחר את העדיפות המובילה בלחיצה אחת:'}
                {bespokeQuestion.responseWidget === 'confirmation' && 'אישור מהיר בלחיצה אחת:'}
                {bespokeQuestion.responseWidget === 'classification' && 'סווג את מקור הביטחון שלך:'}
              </Text>
              <View style={styles.widgetOptionsContainer}>
                {(bespokeQuestion.responseOptions && bespokeQuestion.responseOptions.length > 0
                  ? bespokeQuestion.responseOptions
                  : (bespokeQuestion.responseWidget === 'confirmation'
                      ? ['כן, זה מדויק', 'לא, הכיוון שונה']
                      : bespokeQuestion.responseWidget === 'classification'
                        ? ['נתונים מוצקים בשטח', 'ניסיון עבר אישי', 'תחושת בטן']
                        : ['פשטות ומהירות', 'עמידות לטווח ארוך'])
                ).map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.widgetOptionBtn}
                    onPress={() => handleWidgetSelect(option)}
                  >
                    <Text style={styles.widgetOptionBtnText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.widgetOrText}>— או נסח מענה מפורט משלך —</Text>
            </View>
          )}

          <TextInput
            style={styles.answerInput}
            multiline
            placeholder="מענה קצר או כיוון בירור (או דלג למטה)..."
            placeholderTextColor={LuxuryTheme.text.tertiary}
            value={userAnswer}
            onChangeText={setUserAnswer}
            textAlign="right"
          />

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.proceedButton, !userAnswer.trim() && styles.proceedButtonDisabled]}
              disabled={!userAnswer.trim()}
              onPress={handleProceedWithAnswer}
            >
              <Text style={styles.proceedButtonText}>המשך עם התשובה ←</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>מספיק לי לעכשיו — שמור והמשך</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* --- חיווי התחדדות Before / After (מחושב ע"י ה-Delta Engine) --- */}
      {activeTab === 'insight' && insight && (
        <View style={styles.insightCard}>
          <View style={styles.insightBadge}>
            <Text style={styles.insightBadgeText}>✨ מה התחדד בחשיבה</Text>
          </View>

          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>קודם:</Text>
            <Text style={styles.insightContent}>{insight.before}</Text>
          </View>

          <View style={styles.insightRow}>
            <Text style={[styles.insightLabel, { color: LuxuryTheme.accent.emeraldSuccess }]}>כעת התחדד:</Text>
            <Text style={[styles.insightContent, { fontWeight: '600' }]}>{insight.now}</Text>
          </View>

          <View style={styles.insightRow}>
            <Text style={[styles.insightLabel, { color: LuxuryTheme.accent.auraGlow }]}>הצעד שבחרת:</Text>
            <Text style={[styles.insightContent, { color: LuxuryTheme.text.primary, fontWeight: '700' }]}>
              {insight.chosenStep}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => onAnswerSubmit(userAnswer, true)}
          >
            <Text style={styles.finishButtonText}>שמור לזיכרון שיקול הדעת ←</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.background.base
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  frozenBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: LuxuryTheme.background.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16
  },
  frozenText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12,
    fontWeight: '500'
  },
  rawCard: {
    backgroundColor: LuxuryTheme.background.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border
  },
  rawTitle: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    marginBottom: 4,
    textAlign: 'right'
  },
  rawContent: {
    color: LuxuryTheme.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right'
  },
  first20Card: {
    backgroundColor: LuxuryTheme.background.surfaceElevated,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 18
  },
  first20HeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  first20Tag: {
    color: LuxuryTheme.accent.auraGlow,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  first20Title: {
    color: LuxuryTheme.text.secondary,
    fontSize: 13,
    fontWeight: '600'
  },
  decisionOneLiner: {
    color: LuxuryTheme.text.primary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25,
    textAlign: 'right',
    marginBottom: 16
  },
  tensionBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  hingeBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  subHeadingLabel: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4
  },
  tensionText: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'right'
  },
  hingeText: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'right'
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14
  },
  feedbackBtn: {
    flex: 1,
    backgroundColor: LuxuryTheme.background.surface,
    borderColor: LuxuryTheme.background.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center'
  },
  feedbackBtnActiveAccurate: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: LuxuryTheme.accent.emeraldSuccess
  },
  feedbackBtnActiveInaccurate: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.6)'
  },
  feedbackBtnText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 13,
    fontWeight: '600'
  },
  feedbackBtnTextActive: {
    color: LuxuryTheme.text.primary,
    fontWeight: '700'
  },
  toggleMapBtn: {
    alignItems: 'center',
    paddingVertical: 8
  },
  toggleMapBtnText: {
    color: LuxuryTheme.accent.auraGlow,
    fontSize: 12,
    fontWeight: '600'
  },
  memoryPillCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18
  },
  memoryPillHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  memoryPillTag: {
    color: '#A78BFA',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  memoryPillTitle: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12,
    fontWeight: '600'
  },
  memoryPillBody: {
    color: LuxuryTheme.text.primary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 8
  },
  memoryPillAction: {
    alignSelf: 'flex-start'
  },
  memoryPillActionText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '600'
  },
  pastDetailsContent: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)'
  },
  pastDetailsTitle: {
    color: LuxuryTheme.text.primary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right'
  },
  pastDetailsStrength: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2
  },
  expandedMapContainer: {
    marginBottom: 20
  },
  expandedMapHeader: {
    color: LuxuryTheme.text.secondary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 12
  },
  groupCard: {
    backgroundColor: LuxuryTheme.background.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border
  },
  relianceGroupCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)'
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 2
  },
  groupDesc: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    textAlign: 'right',
    marginBottom: 8
  },
  subGroupBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
    marginTop: 8
  },
  assumptionSubBlock: {
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1
  },
  subGroupTag: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4
  },
  editableInput: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
    padding: 0
  },
  illuminationHero: {
    backgroundColor: LuxuryTheme.background.surfaceElevated,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    marginBottom: 20
  },
  illuminationBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10
  },
  illuminationBadgeText: {
    color: LuxuryTheme.accent.auraGlow,
    fontSize: 11,
    fontWeight: '700'
  },
  illuminationQuestionText: {
    color: LuxuryTheme.text.primary,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 25,
    textAlign: 'right',
    marginBottom: 14
  },
  answerInput: {
    backgroundColor: LuxuryTheme.background.base,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border,
    borderRadius: 12,
    padding: 12,
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 14
  },
  actionRow: {
    gap: 10
  },
  proceedButton: {
    backgroundColor: LuxuryTheme.accent.auraGlow,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center'
  },
  proceedButtonDisabled: {
    opacity: 0.4
  },
  proceedButtonText: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center'
  },
  skipButtonText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 13
  },
  insightCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24
  },
  insightBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 14
  },
  insightBadgeText: {
    color: LuxuryTheme.accent.emeraldSuccess,
    fontSize: 12,
    fontWeight: '700'
  },
  insightRow: {
    marginBottom: 12
  },
  insightLabel: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 2
  },
  insightContent: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right'
  },
  finishButton: {
    backgroundColor: LuxuryTheme.accent.emeraldSuccess,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  finishButtonText: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  smartSilenceCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20
  },
  smartSilenceBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10
  },
  smartSilenceBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700'
  },
  smartSilenceBody: {
    color: LuxuryTheme.text.secondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 16
  },
  smartSilenceBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  smartSilenceBtnText: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  illuminationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  ervBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  ervBadgeText: {
    color: LuxuryTheme.accent.emeraldSuccess,
    fontSize: 11,
    fontWeight: '600'
  },
  widgetSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14
  },
  widgetHeader: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 10
  },
  widgetOptionsContainer: {
    gap: 8
  },
  widgetOptionBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center'
  },
  widgetOptionBtnText: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  widgetOrText: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10
  }
});
