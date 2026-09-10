import React, { useState } from 'react';
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
  onCancel?: () => void;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({
  caseTitle,
  nextStepChosen,
  onSubmitOutcome,
  onCancel
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
    <div className="flex-1 w-full max-w-[395px] mx-auto p-5 overflow-y-auto custom-scroll text-right flex flex-col justify-center min-h-[600px] space-y-4" dir="rtl">
      {/* Header */}
      <div className="space-y-1">
        <div className="text-xs font-bold tracking-wider" style={{ color: LuxuryTheme.accent.gold }}>
          סגירת מעגל
        </div>
        <h2 className="font-editorial text-2xl font-bold" style={{ color: LuxuryTheme.text.primary }}>
          איך זה נגמר?
        </h2>
        <p className="text-xs opacity-60 line-clamp-2">
          {caseTitle}
        </p>
      </div>

      {/* Reminder Card */}
      {nextStepChosen && (
        <div className="p-3.5 rounded-xl border-r-4 border bg-white/[0.02]"
             style={{ borderRightColor: LuxuryTheme.accent.gold, borderColor: 'rgba(212, 175, 55, 0.25)' }}>
          <div className="text-[11px] font-bold mb-1" style={{ color: LuxuryTheme.accent.gold }}>
            הצעד שהגדרת לעצמך:
          </div>
          <div className="text-xs italic opacity-85">
            "{nextStepChosen}"
          </div>
        </div>
      )}

      {/* Quick Status 4-Chips */}
      <div className="space-y-2">
        <label className="text-xs font-medium opacity-80 block">
          מה הסטטוס בפועל?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['clarified', 'הסתדר מעולה ✓', LuxuryTheme.accent.gold],
              ['succeeded_as_expected', 'התברר אחרת ⚡', LuxuryTheme.accent.gold],
              ['not_yet', 'עדיין פתוח ⏳', LuxuryTheme.accent.gold],
              ['irrelevant', 'ירד מהפרק ✕', LuxuryTheme.text.tertiary]
            ] as const
          ).map(([val, label, color]) => {
            const isSelected = quickStatus === val;
            return (
              <button
                type="button"
                key={val}
                onClick={() => setQuickStatus(val as QuickLoopStatus)}
                className={`py-3 px-2 rounded-xl text-xs font-medium border transition-all cursor-pointer text-center ${
                  isSelected 
                    ? 'border-amber-400 bg-amber-500/10 text-amber-200 font-bold shadow' 
                    : 'border-white/10 bg-white/[0.02] text-stone-300 hover:bg-white/[0.05]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio-First Voice Button & Textarea */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleToggleVoice}
          className={`w-full py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-all ${
            isRecording 
              ? 'border-rose-500 bg-rose-500/20 text-rose-200 animate-pulse' 
              : 'border-amber-500/35 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
          }`}
        >
          <span>{isRecording ? '● מקשיב... לחץ לסיום' : '🎙️ הקלט בקצרה מה קרה (5 שניות)'}</span>
        </button>

        <textarea
          rows={3}
          placeholder="או כתוב במשפט קצר: מה קרה בפועל?"
          value={whatHappened}
          onChange={e => setWhatHappened(e.target.value)}
          className="w-full p-3 rounded-xl border bg-white/[0.03] border-white/10 text-xs text-right focus:outline-none resize-none placeholder:opacity-40"
          style={{ color: LuxuryTheme.text.primary }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ביטול
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all active:scale-[0.98] cursor-pointer text-center"
          style={{ 
            borderColor: LuxuryTheme.accent.gold, 
            backgroundColor: 'rgba(212, 175, 55, 0.2)', 
            color: LuxuryTheme.text.primary 
          }}
        >
          שמור והמשך ←
        </button>
      </div>
    </div>
  );
};

