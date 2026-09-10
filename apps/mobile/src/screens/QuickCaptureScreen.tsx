import React, { useState, useRef } from 'react';
import { LuxuryTheme } from '../theme/colors.js';
import { EchoOrb } from '../graphics/EchoOrb.js';

interface QuickCaptureScreenProps {
  onCaptureSubmit: (text: string, frictionLevel?: 'quick' | 'focused' | 'deep') => void;
  onOpenProfile?: () => void;
  isLoading?: boolean;
}

export const QuickCaptureScreen: React.FC<QuickCaptureScreenProps> = ({
  onCaptureSubmit,
  onOpenProfile,
  isLoading = false
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [frictionLevel, setFrictionLevel] = useState<'quick' | 'focused' | 'deep'>('deep');
  const [recordHint, setRecordHint] = useState('גע בכדור להאזנה ולכידת מחשבה');
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
            setRecordHint('גע בכדור להאזנה ולכידת מחשבה');
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
      setRecordHint('גע בכדור להאזנה ולכידת מחשבה');
    }
  };

  const handleProceed = () => {
    if (inputText.trim()) {
      onCaptureSubmit(inputText, frictionLevel);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[395px] mx-auto p-5 overflow-y-auto custom-scroll flex flex-col justify-between items-center text-center select-none" dir="rtl">
      {/* Header with Profile button */}
      <div className="w-full flex justify-between items-center pt-2 relative">
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="text-[11px] px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all cursor-pointer flex items-center gap-1"
            style={{ color: LuxuryTheme.accent.gold }}
            title="מעבר לפרופיל שיקול דעת וכיול אישי"
          >
            <span>פרופיל כיול</span>
            <span>←</span>
          </button>
        )}
        <div className="flex-1 text-center">
          <h1 className="font-editorial text-4xl font-bold tracking-[0.25em] pl-1" style={{ color: LuxuryTheme.accent.gold }}>
            echo
          </h1>
          <p className="text-[11px] opacity-60 tracking-wider">הזיכרון הלומד של שיקול הדעת</p>
        </div>
      </div>

      {/* Center Echo Orb */}
      <div className="my-auto flex flex-col items-center justify-center py-4">
        <EchoOrb 
          isRecording={isRecording} 
          isProcessing={isLoading} 
          size={240}
          onClick={handleToggleRecord}
        />
        <p className="text-xs mt-3 tracking-wide opacity-70 transition-all font-light" style={{ color: LuxuryTheme.text.secondary }}>
          {recordHint}
        </p>
      </div>

      {/* Input Text Box */}
      <div className="w-full space-y-3 pb-2 text-right">
        <div className="relative">
          <textarea
            rows={3}
            placeholder="או הקלד כאן: מה הדילמה והשיקולים שעומדים בפניך כרגע?"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="w-full p-3.5 rounded-2xl border bg-white/[0.03] text-xs text-right focus:outline-none resize-none placeholder:opacity-30 leading-relaxed"
            style={{ borderColor: LuxuryTheme.background.border, color: LuxuryTheme.text.primary }}
          />
        </div>

        <button
          type="button"
          disabled={!inputText.trim() || isLoading}
          onClick={handleProceed}
          className={`w-full py-3.5 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
            !inputText.trim() || isLoading
              ? 'opacity-30 border-white/10 bg-white/[0.02] cursor-not-allowed'
              : 'border-amber-400 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 active:scale-[0.98] shadow-lg'
          }`}
        >
          {isLoading ? 'מקפיא ומחלץ סכמה אפיסטמית...' : 'הקפא והאר את ההחלטה ←'}
        </button>
      </div>
    </div>
  );
};

