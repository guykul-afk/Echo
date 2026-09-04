import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';
import { Option } from '@echo/shared';

interface EvaluationContractScreenProps {
  options: Option[];
  onFinalize: (contract: { selectedOptionId: string; targetCriteria: string; reviewDays: number }) => void;
}

export const EvaluationContractScreen: React.FC<EvaluationContractScreenProps> = ({
  options,
  onFinalize
}) => {
  const [selectedOptId, setSelectedOptId] = useState<string>(options[0]?.id || '');
  const [targetCriteria, setTargetCriteria] = useState('');
  const [reviewDays, setReviewDays] = useState(30);

  const handleComplete = () => {
    if (targetCriteria.trim()) {
      onFinalize({
        selectedOptionId: selectedOptId,
        targetCriteria,
        reviewDays
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>חוזה הערכה ונעילת החלטה</Text>
      <Text style={styles.screenDesc}>
        הגדר מראש מה ייחשב כאימות מוצלח ומתי נחזור לבחון את המצב, לפני שידועה התוצאה.
      </Text>

      {/* Select Option */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>הבחירה שנבחרה לפעולה:</Text>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.optionCard,
              selectedOptId === opt.id && styles.optionCardSelected
            ]}
            onPress={() => setSelectedOptId(opt.id)}
          >
            <Text
              style={[
                styles.optionText,
                selectedOptId === opt.id && styles.optionTextSelected
              ]}
            >
              {opt.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Define Target Criteria */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>קריטריון הצלחה מדויק לבדיקה עתידית:</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="לדוגמה: לפחות לקוח אחד ששילם בפועל וממשיך להשתמש בשבוע השמיני..."
          placeholderTextColor={LuxuryTheme.text.tertiary}
          value={targetCriteria}
          onChangeText={setTargetCriteria}
          textAlign="right"
        />
      </View>

      {/* Select Review Horizon */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>מועד בדיקה חוזרת (אות מעקב):</Text>
        <View style={styles.daysRow}>
          {[14, 30, 60, 90].map((days) => (
            <TouchableOpacity
              key={days}
              style={[styles.dayChip, reviewDays === days && styles.dayChipSelected]}
              onPress={() => setReviewDays(days)}
            >
              <Text
                style={[styles.dayChipText, reviewDays === days && styles.dayChipTextSelected]}
              >
                {days} ימים
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.lockButton, !targetCriteria.trim() && styles.lockButtonDisabled]}
        disabled={!targetCriteria.trim()}
        onPress={handleComplete}
      >
        <Text style={styles.lockButtonText}>נעל ושמור לזיכרון שיקול הדעת ✓</Text>
      </TouchableOpacity>
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
    paddingVertical: 28
  },
  screenTitle: {
    color: LuxuryTheme.text.primary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 6
  },
  screenDesc: {
    color: LuxuryTheme.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 24
  },
  section: {
    marginBottom: 20
  },
  sectionLabel: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8
  },
  optionCard: {
    backgroundColor: LuxuryTheme.background.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border,
    marginBottom: 8
  },
  optionCardSelected: {
    borderColor: LuxuryTheme.accent.auraGlow,
    backgroundColor: 'rgba(99, 102, 241, 0.08)'
  },
  optionText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 14,
    textAlign: 'right'
  },
  optionTextSelected: {
    color: LuxuryTheme.text.primary,
    fontWeight: '600'
  },
  textInput: {
    backgroundColor: LuxuryTheme.background.surface,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border,
    borderRadius: 12,
    padding: 12,
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6
  },
  dayChip: {
    backgroundColor: LuxuryTheme.background.surface,
    borderColor: LuxuryTheme.background.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  dayChipSelected: {
    borderColor: LuxuryTheme.accent.emeraldSuccess,
    backgroundColor: 'rgba(16, 185, 129, 0.1)'
  },
  dayChipText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 13,
    fontWeight: '500'
  },
  dayChipTextSelected: {
    color: LuxuryTheme.accent.emeraldSuccess,
    fontWeight: '700'
  },
  lockButton: {
    backgroundColor: LuxuryTheme.accent.emeraldSuccess,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20
  },
  lockButtonDisabled: {
    opacity: 0.35
  },
  lockButtonText: {
    color: LuxuryTheme.text.inverse,
    fontSize: 15,
    fontWeight: '700'
  }
});
