import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';
import { DecisionCase, Option, DecisionSignature, RefinedInsight, FiveHumanDimensions } from '@echo/shared';

interface DecisionRoomScreenProps {
  decisionCase: DecisionCase;
  options?: Option[];
  signature?: DecisionSignature;
  illuminationQuestion?: string;
  similarCaseAnalogy?: { title: string; reason: string; strength: string };
  initialRefinedInsight?: RefinedInsight;
  onAnswerSubmit: (answer: string, skip?: boolean) => void;
  onMirrorUpdate?: (updatedFields: FiveHumanDimensions) => void;
}

export const DecisionRoomScreen: React.FC<DecisionRoomScreenProps> = ({
  decisionCase,
  illuminationQuestion,
  similarCaseAnalogy,
  initialRefinedInsight,
  onAnswerSubmit,
  onMirrorUpdate
}) => {
  // 5 Human Dimensions local state for direct live editing
  const [consideration, setConsideration] = useState(decisionCase.dimConsideration || decisionCase.title);
  const [goalsPrices, setGoalsPrices] = useState(decisionCase.dimGoalsPrices || '');
  const [facts, setFacts] = useState(decisionCase.dimFacts || decisionCase.dimReliance || '');
  const [assumptions, setAssumptions] = useState(decisionCase.dimAssumptions || '');
  const [missingInfo, setMissingInfo] = useState(decisionCase.dimMissingInfo || decisionCase.dimUnknowns || '');

  const [userAnswer, setUserAnswer] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [activeTab, setActiveTab] = useState<'mirror' | 'insight'>('mirror');
  const [insight, setInsight] = useState<RefinedInsight | null>(initialRefinedInsight || null);

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
      now: 'נשמר המצב הקיים והשיקולים שנוסחו (מסלול מהיר)',
      chosenStep: 'שמירה להמשך מעקב'
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

      {/* Screen Header */}
      <View style={styles.headerSection}>
        <Text style={styles.screenTitle}>מראת החשיבה המתפתחת</Text>
        <Text style={styles.screenSubtitle}>זה משקף אותך? כל שדה ניתן לעריכה ישירה וקלה</Text>
      </View>

      {/* The 5 Human Dimensions (Editable) */}
      <View style={styles.mirrorSection}>
        {/* 1. אתה שוקל */}
        <View style={styles.blockCard}>
          <Text style={[styles.blockTag, { color: LuxuryTheme.epistemicRoles.goal }]}>
            ● אתה שוקל
          </Text>
          <TextInput
            style={styles.editableInput}
            multiline
            value={consideration}
            onChangeText={val => handleFieldChange('consideration', val)}
            textAlign="right"
          />
        </View>

        {/* 2. חשוב לך להשיג ולשמור */}
        <View style={styles.blockCard}>
          <Text style={[styles.blockTag, { color: LuxuryTheme.epistemicRoles.observation }]}>
            ● הבנתי שחשוב לך להשיג ולשמור
          </Text>
          <TextInput
            style={styles.editableInput}
            multiline
            value={goalsPrices}
            onChangeText={val => handleFieldChange('goalsPrices', val)}
            textAlign="right"
          />
        </View>

        {/* 3. עובדות קשיחות */}
        <View style={styles.blockCard}>
          <Text style={[styles.blockTag, { color: '#38BDF8' }]}>
            🧱 עובדות קשיחות (מה כבר קרה בפועל)
          </Text>
          <TextInput
            style={styles.editableInput}
            multiline
            value={facts}
            onChangeText={val => handleFieldChange('facts', val)}
            textAlign="right"
          />
        </View>

        {/* 4. ההנחות שלך */}
        <View style={[styles.blockCard, styles.assumptionCard]}>
          <Text style={[styles.blockTag, { color: LuxuryTheme.epistemicRoles.assumption }]}>
            ▲ ההנחות שלך (מה שאתה משער/צופה)
          </Text>
          <TextInput
            style={styles.editableInput}
            multiline
            value={assumptions}
            onChangeText={val => handleFieldChange('assumptions', val)}
            textAlign="right"
          />
        </View>

        {/* 5. מידע חסר להחלטה */}
        <View style={styles.blockCard}>
          <Text style={[styles.blockTag, { color: LuxuryTheme.epistemicRoles.unknown }]}>
            ? המידע החסר להחלטה (פערי מידע ושאלות)
          </Text>
          <TextInput
            style={styles.editableInput}
            multiline
            value={missingInfo}
            onChangeText={val => handleFieldChange('missingInfo', val)}
            textAlign="right"
          />
        </View>
      </View>

      {/* Adaptive Intervention Hero Card */}
      {illuminationQuestion && activeTab === 'mirror' && (
        <View style={styles.illuminationHero}>
          <View style={styles.illuminationBadge}>
            <Text style={styles.illuminationBadgeText}>התערבות ממוקדת אחת</Text>
          </View>
          <Text style={styles.illuminationQuestionText}>"{illuminationQuestion}"</Text>

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

      {/* Before & After Flash (חיווי ההתחדדות) */}
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

      {/* Analogous Past Cases (Gentle Memory) */}
      {similarCaseAnalogy && (
        <View style={styles.analogySection}>
          <Text style={styles.analogyHeading}>הד מניסיון קודם (אנלוגיה למחשבה)</Text>
          <View style={styles.analogyCard}>
            <Text style={styles.analogyTitle}>{similarCaseAnalogy.title}</Text>
            <Text style={styles.analogyReason}>{similarCaseAnalogy.reason}</Text>
            <Text style={styles.analogyDisclaimer}>
              האם זה רלוונטי גם כאן? באפשרותך להתחשב בכך או לקבוע שההקשר שונה.
            </Text>
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 24
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
  headerSection: {
    marginBottom: 16,
    alignItems: 'flex-end'
  },
  screenTitle: {
    color: LuxuryTheme.text.primary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4
  },
  screenSubtitle: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 13,
    textAlign: 'right'
  },
  mirrorSection: {
    marginBottom: 20
  },
  blockCard: {
    backgroundColor: LuxuryTheme.background.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border
  },
  assumptionCard: {
    borderColor: 'rgba(245, 158, 11, 0.25)',
    backgroundColor: 'rgba(245, 158, 11, 0.04)'
  },
  blockTag: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'right'
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
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    marginBottom: 24
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
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'right',
    marginBottom: 16
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
  analogySection: {
    marginTop: 8
  },
  analogyHeading: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8
  },
  analogyCard: {
    backgroundColor: LuxuryTheme.background.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  analogyTitle: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right'
  },
  analogyReason: {
    color: LuxuryTheme.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
    marginTop: 4
  },
  analogyDisclaimer: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 8,
    fontStyle: 'italic'
  }
});
