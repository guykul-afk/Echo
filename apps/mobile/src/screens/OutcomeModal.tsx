import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';
import { QuickLoopStatus } from '@echo/shared';

interface OutcomeModalProps {
  caseTitle: string;
  nextStepChosen?: string;
  onSubmitOutcome: (outcome: {
    whatHappened: string;
    assumptionClarification: string;
    processReflection: string;
    quickStatus: QuickLoopStatus;
  }) => void;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({
  caseTitle,
  nextStepChosen,
  onSubmitOutcome
}) => {
  const [quickStatus, setQuickStatus] = useState<QuickLoopStatus>('clarified');
  const [whatHappened, setWhatHappened] = useState('');
  const [assumptionClarification, setAssumptionClarification] = useState('');
  const [processReflection, setProcessReflection] = useState('');

  const handleSubmit = () => {
    onSubmitOutcome({
      whatHappened: whatHappened || 'עודכן סטטוס התקדמות',
      assumptionClarification,
      processReflection,
      quickStatus
    });
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>סגירת מעגל: התקדמות בהבנה ולמידה</Text>
      <Text style={styles.caseSub}>{caseTitle}</Text>

      {/* Reminder Box */}
      {nextStepChosen && (
        <View style={styles.reminderBox}>
          <Text style={styles.reminderLabel}>הצעד שהגדרת לעצמך לבירור:</Text>
          <Text style={styles.reminderText}>"{nextStepChosen}"</Text>
        </View>
      )}

      {/* Quick Status Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>הספקת לברר?</Text>
        <View style={styles.evalRow}>
          {(
            [
              ['clarified', 'ביררתי', LuxuryTheme.accent.emeraldSuccess],
              ['not_yet', 'עדיין לא', LuxuryTheme.accent.amberWarning],
              ['irrelevant', 'כבר לא רלוונטי', LuxuryTheme.text.tertiary]
            ] as const
          ).map(([val, label, color]) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.evalChip,
                quickStatus === val && { borderColor: color, backgroundColor: 'rgba(255,255,255,0.06)' }
              ]}
              onPress={() => setQuickStatus(val)}
            >
              <Text style={[styles.evalChipText, quickStatus === val && { color, fontWeight: '700' }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Axis 1: What happened in reality */}
      <View style={styles.section}>
        <Text style={styles.label}>1. מה קרה בפועל? (נתונים ועובדות):</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="למשל: ביררתי עם המנהל והוא הסכים ליום בית קבוע..."
          placeholderTextColor={LuxuryTheme.text.tertiary}
          value={whatHappened}
          onChangeText={setWhatHappened}
          textAlign="right"
        />
      </View>

      {/* Axis 2: What was clarified about assumptions */}
      <View style={styles.section}>
        <Text style={styles.label}>2. מה התברר לגבי ההנחה שעליה נשענת?</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="למשל: החשש מזמינות תובענית היה מוגזם ביחס למציאות..."
          placeholderTextColor={LuxuryTheme.text.tertiary}
          value={assumptionClarification}
          onChangeText={setAssumptionClarification}
          textAlign="right"
        />
      </View>

      {/* Axis 3: Process reflection */}
      <View style={styles.section}>
        <Text style={styles.label}>3. בהתחשב במה שיכולת לדעת אז, מה היית משנה באופן הבחינה?</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="למשל: היה נכון לשאול כבר בריאיון הראשון..."
          placeholderTextColor={LuxuryTheme.text.tertiary}
          value={processReflection}
          onChangeText={setProcessReflection}
          textAlign="right"
        />
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSubmit}
      >
        <Text style={styles.saveButtonText}>עדכן זיכרון אישי וסגור סבב למידה ←</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: LuxuryTheme.background.base
  },
  container: {
    padding: 20
  },
  heading: {
    color: LuxuryTheme.text.primary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right'
  },
  caseSub: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'right'
  },
  reminderBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRightWidth: 3,
    borderRightColor: LuxuryTheme.accent.auraGlow,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  reminderLabel: {
    color: LuxuryTheme.accent.auraGlow,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right'
  },
  reminderText: {
    color: LuxuryTheme.text.primary,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'right'
  },
  section: {
    marginBottom: 14
  },
  label: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 6
  },
  textInput: {
    backgroundColor: LuxuryTheme.background.surface,
    borderWidth: 1,
    borderColor: LuxuryTheme.background.border,
    borderRadius: 10,
    padding: 12,
    color: LuxuryTheme.text.primary,
    fontSize: 13,
    minHeight: 65,
    textAlignVertical: 'top'
  },
  evalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  evalChip: {
    flex: 1,
    backgroundColor: LuxuryTheme.background.surface,
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
    marginTop: 10,
    marginBottom: 30
  },
  saveButtonText: {
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    fontWeight: '600'
  }
});
