import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';
import { CriteriaEvaluation } from '@echo/shared';

interface OutcomeModalProps {
  caseTitle: string;
  originalCriteria: string;
  onSubmitOutcome: (outcome: {
    observedFacts: string;
    criteriaEvaluation: CriteriaEvaluation;
    reflectionNotes: string;
  }) => void;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({
  caseTitle,
  originalCriteria,
  onSubmitOutcome
}) => {
  const [observedFacts, setObservedFacts] = useState('');
  const [criteriaEval, setCriteriaEval] = useState<CriteriaEvaluation>('succeeded');
  const [reflectionNotes, setReflectionNotes] = useState('');

  const handleSubmit = () => {
    if (observedFacts.trim()) {
      onSubmitOutcome({
        observedFacts,
        criteriaEvaluation: criteriaEval,
        reflectionNotes
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>סגירת מעגל: תיעוד תוצאה וכיול</Text>
      <Text style={styles.caseSub}>{caseTitle}</Text>

      {/* Original Criterion Box */}
      <View style={styles.critBox}>
        <Text style={styles.critLabel}>מה שהגדרת מראש כקריטריון:</Text>
        <Text style={styles.critText}>"{originalCriteria}"</Text>
      </View>

      {/* Observed Facts */}
      <View style={styles.section}>
        <Text style={styles.label}>מה נצפה בפועל בעולם? (עובדות בלבד):</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="לדוגמה: לקוח אחד שילם אך כמות השימוש נמוכה..."
          placeholderTextColor={LuxuryTheme.text.tertiary}
          value={observedFacts}
          onChangeText={setObservedFacts}
          textAlign="right"
        />
      </View>

      {/* Evaluation Selector */}
      <View style={styles.section}>
        <Text style={styles.label}>האם הקריטריון הושג?</Text>
        <View style={styles.evalRow}>
          {(
            [
              ['succeeded', 'הצליח', LuxuryTheme.epistemicRoles.observation],
              ['partially_succeeded', 'חלקי', LuxuryTheme.epistemicRoles.assumption],
              ['failed', 'נכשל', LuxuryTheme.epistemicRoles.unknown]
            ] as const
          ).map(([val, label, color]) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.evalChip,
                criteriaEval === val && { borderColor: color, backgroundColor: 'rgba(255,255,255,0.06)' }
              ]}
              onPress={() => setCriteriaEval(val)}
            >
              <Text style={[styles.evalChipText, criteriaEval === val && { color, fontWeight: '700' }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reflection on the Criterion */}
      <View style={styles.section}>
        <Text style={styles.label}>בחינת הקריטריון (האם הוא היה מדד נכון?):</Text>
        <TextInput
          style={[styles.textInput, { minHeight: 60 }]}
          multiline
          placeholder="לדוגמה: תשלום לבדו לא מדד שימוש מתמשך..."
          placeholderTextColor={LuxuryTheme.text.tertiary}
          value={reflectionNotes}
          onChangeText={setReflectionNotes}
          textAlign="right"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, !observedFacts.trim() && styles.saveButtonDisabled]}
        disabled={!observedFacts.trim()}
        onPress={handleSubmit}
      >
        <Text style={styles.saveButtonText}>עדכן זיכרון וכייל השערות ←</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: LuxuryTheme.background.surface,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border
  },
  heading: {
    color: LuxuryTheme.text.primary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right'
  },
  caseSub: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
    textAlign: 'right'
  },
  critBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRightWidth: 3,
    borderRightColor: LuxuryTheme.accent.auraGlow,
    padding: 10,
    borderRadius: 6,
    marginBottom: 16
  },
  critLabel: {
    color: LuxuryTheme.accent.auraGlow,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right'
  },
  critText: {
    color: LuxuryTheme.text.primary,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'right'
  },
  section: {
    marginBottom: 14
  },
  label: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 6
  },
  textInput: {
    backgroundColor: LuxuryTheme.background.base,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border,
    borderRadius: 10,
    padding: 10,
    color: LuxuryTheme.text.primary,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top'
  },
  evalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  evalChip: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: LuxuryTheme.background.base,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  evalChipText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12
  },
  saveButton: {
    backgroundColor: LuxuryTheme.accent.auraGlow,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10
  },
  saveButtonDisabled: {
    opacity: 0.35
  },
  saveButtonText: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    fontWeight: '600'
  }
});
