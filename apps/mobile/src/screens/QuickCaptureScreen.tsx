import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LuxuryTheme } from '../theme/colors.js';
import { EchoOrb } from '../graphics/EchoOrb.js';

interface QuickCaptureScreenProps {
  onCaptureSubmit: (text: string) => void;
  isLoading?: boolean;
}

export const QuickCaptureScreen: React.FC<QuickCaptureScreenProps> = ({
  onCaptureSubmit,
  isLoading = false
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const [recordHint, setRecordHint] = useState('לחץ להקלטה קולית חופשית');

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordHint('מקשיב לך... דבר באופן חופשי');
      setTimeout(() => {
        setIsRecording(false);
        if (!inputText.trim()) {
          setRecordHint('לא זוהה דיבור. אנא הקלד את ההחלטה בתיבה למטה');
        }
      }, 4000);
    } else {
      setIsRecording(false);
      setRecordHint('לחץ להקלטה קולית חופשית');
    }
  };

  const handleProceed = () => {
    if (inputText.trim()) {
      onCaptureSubmit(inputText);
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
  }
});
