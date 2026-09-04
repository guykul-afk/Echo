import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';
import { EpistemicState, IlluminationQuestion } from '@echo/shared';

interface EpistemicMirrorScreenProps {
  epistemicState: EpistemicState;
  illuminationQuestion: IlluminationQuestion;
  onProceedToContract: (userAnswer: string) => void;
}

export const EpistemicMirrorScreen: React.FC<EpistemicMirrorScreenProps> = ({
  epistemicState,
  illuminationQuestion,
  onProceedToContract
}) => {
  const [step, setStep] = useState<'mirror' | 'illumination'>('mirror');
  const [userAnswer, setUserAnswer] = useState('');

  return (
    <View style={styles.container}>
      {step === 'mirror' ? (
        <View style={styles.content}>
          <Text style={styles.screenTitle}>שיקוף מראת החשיבה</Text>
          <Text style={styles.screenSubtitle}>הפרדה קרה בין נתונים עובדתיים להנחות לעתיד</Text>

          {/* Emotional Tag if present */}
          {epistemicState.affect !== 'neutral' && epistemicState.affect !== 'calm' && (
            <View style={styles.affectBadge}>
              <Text style={styles.affectBadgeText}>
                ⚠️ סמן סומטי זוהה: מצב רגשי מונע מ-{epistemicState.affect.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Contradiction Tag if present */}
          {epistemicState.contradictions.length > 0 && (
            <View style={styles.contradictionBadge}>
              <Text style={styles.contradictionBadgeText}>
                ⚡ סתירה פנימית במלל: "{epistemicState.contradictions[0]}"
              </Text>
            </View>
          )}

          <View style={styles.splitGrid}>
            {/* Facts Column */}
            <View style={styles.cardHalf}>
              <Text style={[styles.columnHeader, { color: LuxuryTheme.epistemicRoles.observation }]}>
                ● מה שידוע (עובדות)
              </Text>
              {epistemicState.facts.map((f, i) => (
                <Text key={i} style={styles.bulletItem}>• {f}</Text>
              ))}
            </View>

            {/* Assumptions Column */}
            <View style={[styles.cardHalf, styles.assumptionHalf]}>
              <Text style={[styles.columnHeader, { color: LuxuryTheme.epistemicRoles.assumption }]}>
                ▲ מה שמניחים (הנחות)
              </Text>
              {epistemicState.assumptions.map((a, i) => (
                <Text key={i} style={styles.bulletItem}>• {a}</Text>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setStep('illumination')}>
            <Text style={styles.actionBtnText}>המשך לשאלת החידוד ←</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.illuminationContent}>
          <View style={styles.strategyTag}>
            <Text style={styles.strategyTagText}>
              חידוד סוקרטי • {illuminationQuestion.strategy.replace('_', ' ')}
            </Text>
          </View>

          <Text style={styles.illuminationPrompt}>
            "{illuminationQuestion.questionText}"
          </Text>

          <TextInput
            style={styles.answerInput}
            multiline
            placeholder="מענה שמוסיף את המידע שהיה חסר במלל..."
            placeholderTextColor={LuxuryTheme.text.tertiary}
            value={userAnswer}
            onChangeText={setUserAnswer}
            textAlign="right"
          />

          <TouchableOpacity
            style={[styles.actionBtn, !userAnswer.trim() && styles.btnDisabled]}
            disabled={!userAnswer.trim()}
            onPress={() => onProceedToContract(userAnswer)}
          >
            <Text style={styles.actionBtnText}>נעילת חוזה הערכה ומועד מעקב ←</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.background.base,
    paddingHorizontal: 20,
    justifyContent: 'center'
  },
  content: {
    flex: 1,
    paddingVertical: 24,
    justifyContent: 'center'
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
    textAlign: 'right',
    marginBottom: 20
  },
  affectBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10
  },
  affectBadgeText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right'
  },
  contradictionBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14
  },
  contradictionBadgeText: {
    color: '#facc15',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right'
  },
  splitGrid: {
    gap: 12,
    marginBottom: 24
  },
  cardHalf: {
    backgroundColor: LuxuryTheme.background.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border
  },
  assumptionHalf: {
    borderColor: 'rgba(245, 158, 11, 0.25)',
    backgroundColor: 'rgba(245, 158, 11, 0.04)'
  },
  columnHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'right'
  },
  bulletItem: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 4
  },
  illuminationContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24
  },
  strategyTag: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16
  },
  strategyTagText: {
    color: LuxuryTheme.accent.auraGlow,
    fontSize: 12,
    fontWeight: '600'
  },
  illuminationPrompt: {
    color: LuxuryTheme.text.primary,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 32,
    textAlign: 'right',
    marginBottom: 24
  },
  answerInput: {
    backgroundColor: LuxuryTheme.background.surface,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border,
    borderRadius: 12,
    padding: 14,
    color: LuxuryTheme.text.primary,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20
  },
  actionBtn: {
    backgroundColor: LuxuryTheme.accent.auraGlow,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  actionBtnText: {
    color: LuxuryTheme.text.primary,
    fontSize: 15,
    fontWeight: '600'
  },
  btnDisabled: {
    opacity: 0.4
  }
});
