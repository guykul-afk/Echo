import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';
import { DecisionCase, Statement, Option, DecisionSignature } from '@echo/shared';

interface DecisionRoomScreenProps {
  decisionCase: DecisionCase;
  statements: Statement[];
  options: Option[];
  signature: DecisionSignature;
  illuminationQuestion: string;
  similarCaseAnalogy?: { title: string; reason: string; strength: string };
  onAnswerSubmit: (answer: string) => void;
}

export const DecisionRoomScreen: React.FC<DecisionRoomScreenProps> = ({
  decisionCase,
  statements,
  options,
  illuminationQuestion,
  similarCaseAnalogy,
  onAnswerSubmit
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showRawText, setShowRawText] = useState(false);

  const goal = statements.find(s => s.role === 'goal')?.text;
  const observations = statements.filter(s => s.role === 'observation');
  const assumptions = statements.filter(s => s.role === 'assumption');
  const unknowns = statements.filter(s => s.role === 'unknown');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Frozen State Badge */}
      <TouchableOpacity
        style={styles.frozenBadge}
        activeOpacity={0.7}
        onPress={() => setShowRawText(!showRawText)}
      >
        <Text style={styles.frozenText}>
          🔒 מצב חשיבה ראשוני הוקפא @ {new Date(decisionCase.frozenAt).toLocaleTimeString('he-IL')} (לחץ להצגה)
        </Text>
      </TouchableOpacity>

      {showRawText && (
        <View style={styles.rawCard}>
          <Text style={styles.rawTitle}>הניסוח המקורי המדויק (ללא שינוי):</Text>
          <Text style={styles.rawContent}>{decisionCase.rawCaptureText}</Text>
        </View>
      )}

      {/* Decision Title & Goal */}
      <View style={styles.headerSection}>
        <Text style={styles.caseTitle}>{decisionCase.title}</Text>
        {goal && (
          <View style={styles.goalBox}>
            <Text style={styles.goalLabel}>מטרה מזוקקת:</Text>
            <Text style={styles.goalText}>{goal}</Text>
          </View>
        )}
      </View>

      {/* Epistemic Schema Breakdown (Read-Only) */}
      <View style={styles.schemaSection}>
        <Text style={styles.sectionHeading}>פירוק סכמת חשיבה</Text>

        {/* Observations / Facts */}
        <View style={styles.blockCard}>
          <Text style={[styles.blockTag, { color: LuxuryTheme.epistemicRoles.observation }]}>
            ● עובדות מוצקות שנמדדו
          </Text>
          {observations.map((obs, idx) => (
            <Text key={idx} style={styles.itemText}>• {obs.text}</Text>
          ))}
        </View>

        {/* Assumptions */}
        <View style={[styles.blockCard, styles.assumptionCard]}>
          <Text style={[styles.blockTag, { color: LuxuryTheme.epistemicRoles.assumption }]}>
            ▲ הנחות עבודה סמויות (טעונות בדיקה)
          </Text>
          {assumptions.map((assump, idx) => (
            <Text key={idx} style={styles.itemText}>• {assump.text}</Text>
          ))}
        </View>

        {/* Unknowns */}
        {unknowns.length > 0 && (
          <View style={styles.blockCard}>
            <Text style={[styles.blockTag, { color: LuxuryTheme.epistemicRoles.unknown }]}>
              ? פערי מידע מרכזיים
            </Text>
            {unknowns.map((u, idx) => (
              <Text key={idx} style={styles.itemText}>• {u.text}</Text>
            ))}
          </View>
        )}
      </View>

      {/* HERO: The Single Illumination Question */}
      <View style={styles.illuminationHero}>
        <View style={styles.illuminationBadge}>
          <Text style={styles.illuminationBadgeText}>שאלת הארה אחת</Text>
        </View>
        <Text style={styles.illuminationQuestionText}>"{illuminationQuestion}"</Text>

        <TextInput
          style={styles.answerInput}
          multiline
          placeholder="תשובתך הממוקדת (למשל: פעולת בירור מהירה או תנאי סף)..."
          placeholderTextColor={LuxuryTheme.text.tertiary}
          value={userAnswer}
          onChangeText={setUserAnswer}
          textAlign="right"
        />

        <TouchableOpacity
          style={[styles.proceedButton, !userAnswer.trim() && styles.proceedButtonDisabled]}
          disabled={!userAnswer.trim()}
          onPress={() => onAnswerSubmit(userAnswer)}
        >
          <Text style={styles.proceedButtonText}>המשך לקביעת חוזה הערכה ומועד מעקב ←</Text>
        </TouchableOpacity>
      </View>

      {/* Analogous Past Cases (if retrieved) */}
      {similarCaseAnalogy && (
        <View style={styles.analogySection}>
          <Text style={styles.analogyHeading}>הד ממקרה עבר (אנלוגיה מבנית)</Text>
          <View style={styles.analogyCard}>
            <Text style={styles.analogyTitle}>{similarCaseAnalogy.title}</Text>
            <Text style={styles.analogyReason}>{similarCaseAnalogy.reason}</Text>
            <Text style={styles.analogyDisclaimer}>* אנלוגיה מבנית למחשבה בלבד — אינה מהווה המלצה לפעולה</Text>
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
    marginBottom: 20,
    alignItems: 'flex-end'
  },
  caseTitle: {
    color: LuxuryTheme.text.primary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 10
  },
  goalBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRightWidth: 3,
    borderRightColor: LuxuryTheme.epistemicRoles.goal,
    padding: 10,
    width: '100%',
    borderRadius: 6
  },
  goalLabel: {
    color: LuxuryTheme.epistemicRoles.goal,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right'
  },
  goalText: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    marginTop: 2,
    textAlign: 'right'
  },
  schemaSection: {
    marginBottom: 24
  },
  sectionHeading: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'right',
    marginBottom: 10
  },
  blockCard: {
    backgroundColor: LuxuryTheme.background.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border
  },
  assumptionCard: {
    borderColor: 'rgba(245, 158, 11, 0.25)',
    backgroundColor: 'rgba(245, 158, 11, 0.04)'
  },
  blockTag: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'right'
  },
  itemText: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 4
  },
  illuminationHero: {
    backgroundColor: LuxuryTheme.background.surfaceElevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    marginBottom: 24,
    shadowColor: LuxuryTheme.accent.auraGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12
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
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 14
  },
  proceedButton: {
    backgroundColor: LuxuryTheme.accent.auraGlow,
    paddingVertical: 14,
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
