import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';
import { EchoOrb } from '../graphics/EchoOrb.js';

interface QuickCaptureScreenProps {
  onCaptureSubmit: (text: string, frictionLevel?: 'quick' | 'focused' | 'deep') => void;
  isLoading?: boolean;
}

export const QuickCaptureScreen: React.FC<QuickCaptureScreenProps> = ({
  onCaptureSubmit,
  isLoading = false
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [frictionLevel, setFrictionLevel] = useState<'quick' | 'focused' | 'deep'>('deep');
  const [recordHint, setRecordHint] = useState('לחץ להקלטה קולית חופשית');
  const recognitionRef = useRef<any>(null);

  const handleToggleRecord = () => {
    if (!isRecording) {
      const SpeechRec = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.lang = 'he-IL';
          rec.continuous = true;
          rec.interimResults = true;
          rec.maxAlternatives = 1;

          rec.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; ++i) {
              fullText += event.results[i][0].transcript + ' ';
            }
            const trimmed = fullText.trim();
            if (trimmed) {
              setInputText(trimmed);
              setRecordHint(`מקשיב: « ${trimmed.length > 35 ? '...' + trimmed.slice(-35) : trimmed} »`);
            }
          };

          rec.onerror = (err: any) => {
            console.warn('SpeechRecognition error:', err);
            setRecordHint('לא זוהה דיבור ברור. ניתן להקליד ידנית בתיבה.');
          };

          rec.onend = () => {
            setIsRecording(false);
            setRecordHint('לחץ להקלטה קולית חופשית');
          };

          rec.start();
          recognitionRef.current = rec;
          setIsRecording(true);
          setRecordHint('מקשיב לך... דבר באופן חופשי (גע לעצירה)');
          return;
        } catch (e) {
          console.warn('Failed to start SpeechRecognition:', e);
        }
      }

      // Fallback
      setIsRecording(true);
      setRecordHint('מקשיב לך... דבר באופן חופשי');
      setTimeout(() => {
        setIsRecording(false);
        if (!inputText.trim()) {
          setRecordHint('לא זוהה דיבור. אנא הקלד את ההחלטה בתיבה למטה');
        }
      }, 4000);
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      setIsRecording(false);
      setRecordHint('לחץ להקלטה קולית חופשית');
    }
  };

  const handleProceed = () => {
    if (inputText.trim()) {
      onCaptureSubmit(inputText, frictionLevel);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>הד</Text>
        <Text style={styles.subtitle}>הזיכרון הלומד של שיקול הדעת</Text>
      </View>

      {/* Center Echo Orb */}
      <View style={styles.orbWrapper}>
        <TouchableOpacity activeOpacity={0.8} onPress={handleToggleRecord}>
          <EchoOrb isRecording={isRecording} isProcessing={isLoading} size={190} />
        </TouchableOpacity>
        <Text style={styles.recordHint}>
          {recordHint}
        </Text>
      </View>

      {/* Input Text Box */}
      <View style={styles.inputContainer}>

        <TextInput
          style={styles.textInput}
          multiline
          placeholder="או כתוב כאן: מה ההחלטה שעומדת בפניך כרגע?"
          placeholderTextColor={LuxuryTheme.text.tertiary}
          value={inputText}
          onChangeText={setInputText}
          textAlign="right"
        />

        <TouchableOpacity
          style={[styles.submitButton, !inputText.trim() && styles.submitButtonDisabled]}
          disabled={!inputText.trim() || isLoading}
          onPress={handleProceed}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'מקפיא ומחלץ סכמה...' : 'הקפא והאר את ההחלטה ←'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.background.base,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between'
  },
  header: {
    alignItems: 'center',
    marginTop: 20
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: LuxuryTheme.text.primary,
    letterSpacing: 4
  },
  subtitle: {
    fontSize: 14,
    color: LuxuryTheme.text.secondary,
    marginTop: 6,
    fontWeight: '300'
  },
  orbWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20
  },
  recordHint: {
    fontSize: 13,
    color: LuxuryTheme.text.tertiary,
    marginTop: 24
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16
  },
  textInput: {
    backgroundColor: LuxuryTheme.background.surface,
    borderColor: LuxuryTheme.background.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    color: LuxuryTheme.text.primary,
    fontSize: 15,
    minHeight: 110,
    textAlignVertical: 'top'
  },
  submitButton: {
    backgroundColor: LuxuryTheme.accent.auraGlow,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14
  },
  submitButtonDisabled: {
    opacity: 0.4
  },
  submitButtonText: {
    color: LuxuryTheme.text.primary,
    fontSize: 15,
    fontWeight: '600'
  },
  frictionSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10
  },
  frictionChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center'
  },
  frictionChipActive: {
    borderColor: LuxuryTheme.accent.auraGlow,
    backgroundColor: 'rgba(99, 102, 241, 0.2)'
  },
  frictionChipText: {
    color: LuxuryTheme.text.secondary,
    fontSize: 12,
    fontWeight: '500'
  },
  frictionChipTextActive: {
    color: LuxuryTheme.text.primary,
    fontWeight: '700'
  }
});
