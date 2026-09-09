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
  const [isRecording, setIsRecording] = useState(false);

  const handleToggleVoice = () => {
    const SpeechRec = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SpeechRec) {
      alert('הקלטה קולית נתמכת בדפדפן כרום או ספארי במכשיר.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
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
        setWhatHappened(full.trim());
      };

      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);

      rec.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Voice error:', err);
    }
  };

  const handleSubmit = () => {
    onSubmitOutcome({
      whatHappened: whatHappened || 'עודכן סטטוס',
      assumptionClarification: '',
      processReflection: '',
      quickStatus
    });
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.tag}>סגירת מעגל</Text>
        <Text style={styles.heading}>איך זה נגמר?</Text>
        <Text style={styles.caseSub}>{caseTitle}</Text>
      </View>

      {/* Reminder Card */}
      {nextStepChosen && (
        <View style={styles.reminderBox}>
          <Text style={styles.reminderLabel}>הצעד שהגדרת לעצמך:</Text>
          <Text style={styles.reminderText}>"{nextStepChosen}"</Text>
        </View>
      )}

      {/* Quick Status 4-Chips */}
      <View style={styles.section}>
        <Text style={styles.label}>מה הסטטוס בפועל?</Text>
        <View style={styles.evalGrid}>
          {(
            [
              ['clarified', 'הסתדר מעולה ✓', LuxuryTheme.accent.emeraldSuccess],
              ['succeeded_as_expected', 'התברר אחרת ⚡', LuxuryTheme.accent.amberWarning],
              ['not_yet', 'עדיין פתוח ⏳', '#38BDF8'],
              ['irrelevant', 'ירד מהפרק ✕', LuxuryTheme.text.tertiary]
            ] as const
          ).map(([val, label, color]) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.evalChip,
                quickStatus === val && { borderColor: color, backgroundColor: 'rgba(212,175,55,0.08)' }
              ]}
              onPress={() => setQuickStatus(val as QuickLoopStatus)}
            >
              <Text style={[styles.evalChipText, quickStatus === val && { color, fontWeight: '700' }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Audio-First Voice Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.voiceBtn, isRecording && styles.voiceBtnRecording]}
          onPress={handleToggleVoice}
        >
          <Text style={styles.voiceBtnText}>
            {isRecording ? '● מקשיב... לחץ לסיום' : '🎙️ הקלט בקצרה מה קרה (5 שניות)'}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          multiline
          placeholder="או כתוב במשפט קצר: מה קרה בפועל?"
          placeholderTextColor={LuxuryTheme.text.tertiary}
          value={whatHappened}
          onChangeText={setWhatHappened}
          textAlign="right"
        />
      </View>

      {/* 1-Tap Save */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSubmit}
      >
        <Text style={styles.saveButtonText}>שמור והמשך ←</Text>
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
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%'
  },
  headerRow: {
    marginBottom: 20
  },
  tag: {
    color: LuxuryTheme.accent.gold,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'right',
    marginBottom: 6
  },
  heading: {
    color: LuxuryTheme.text.primary,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'right',
    fontFamily: 'serif'
  },
  caseSub: {
    color: LuxuryTheme.text.tertiary,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'right'
  },
  reminderBox: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRightWidth: 3,
    borderRightColor: LuxuryTheme.accent.gold,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20
  },
  reminderLabel: {
    color: LuxuryTheme.accent.gold,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 4
  },
  reminderText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'right'
  },
  section: {
    marginBottom: 20
  },
  label: {
    color: LuxuryTheme.text.secondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'right'
  },
  evalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  evalChip: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  evalChipText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 13
  },
  voiceBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  voiceBtnRecording: {
    borderColor: '#F43F5E',
    backgroundColor: 'rgba(244, 63, 94, 0.15)'
  },
  voiceBtnText: {
    color: LuxuryTheme.accent.gold,
    fontSize: 13,
    fontWeight: '600'
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    color: LuxuryTheme.text.primary,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top'
  },
  saveButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    borderColor: LuxuryTheme.accent.gold,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10
  },
  saveButtonText: {
    color: LuxuryTheme.text.primary,
    fontSize: 15,
    fontWeight: '700'
  }
});
