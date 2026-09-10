import React, { useState } from 'react';
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
    <div className="flex-1 w-full max-w-[395px] mx-auto p-5 overflow-y-auto custom-scroll text-right flex flex-col justify-center space-y-4" dir="rtl">
      {step === 'mirror' ? (
        <div className="space-y-4">
          <div>
            <h2 className="font-editorial text-xl font-bold" style={{ color: LuxuryTheme.text.primary }}>
              שיקוף מראת החשיבה
            </h2>
            <p className="text-xs opacity-60">הפרדה קרה בין נתונים עובדתיים להנחות לעתיד</p>
          </div>

          {/* Emotional Tag if present */}
          {epistemicState.affect !== 'neutral' && epistemicState.affect !== 'calm' && (
            <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-semibold">
              ⚠️ סמן סומטי זוהה: מצב רגשי מונע מ-{epistemicState.affect.toUpperCase()}
            </div>
          )}

          {/* Contradiction Tag if present */}
          {epistemicState.contradictions.length > 0 && (
            <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold">
              ⚡ סתירה פנימית במלל: "{epistemicState.contradictions[0]}"
            </div>
          )}

          <div className="space-y-3">
            {/* Facts Column */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="text-xs font-bold mb-2" style={{ color: LuxuryTheme.accent.gold }}>
                ● מה שידוע (עובדות)
              </div>
              <div className="space-y-1 text-xs opacity-90">
                {epistemicState.facts.map((f, i) => (
                  <div key={i}>• {f}</div>
                ))}
              </div>
            </div>

            {/* Assumptions Column */}
            <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.04]">
              <div className="text-xs font-bold mb-2" style={{ color: LuxuryTheme.accent.gold }}>
                ▲ מה שמניחים (הנחות)
              </div>
              <div className="space-y-1 text-xs italic opacity-90">
                {epistemicState.assumptions.map((a, i) => (
                  <div key={i}>• "{a}"</div>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setStep('illumination')}
            className="w-full py-3 px-4 rounded-xl border text-xs font-bold cursor-pointer transition-all active:scale-[0.98]"
            style={{ 
              borderColor: LuxuryTheme.accent.gold, 
              backgroundColor: 'rgba(212, 175, 55, 0.2)', 
              color: LuxuryTheme.text.primary 
            }}
          >
            המשך לשאלת החידוד ←
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-200">
            חידוד סוקרטי • {illuminationQuestion.strategy.replace('_', ' ')}
          </div>

          <div className="font-editorial text-lg font-semibold italic leading-relaxed" style={{ color: LuxuryTheme.accent.gold }}>
            "{illuminationQuestion.questionText}"
          </div>

          <textarea
            rows={3}
            placeholder="מענה שמוסיף את המידע שהיה חסר במלל..."
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            className="w-full p-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-right focus:outline-none resize-none placeholder:opacity-40"
            style={{ color: LuxuryTheme.text.primary }}
          />

          <button
            type="button"
            disabled={!userAnswer.trim()}
            onClick={() => onProceedToContract(userAnswer)}
            className={`w-full py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              !userAnswer.trim()
                ? 'opacity-30 border-white/10 cursor-not-allowed'
                : 'border-amber-400 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30'
            }`}
          >
            נעילת חוזה הערכה ומועד מעקב ←
          </button>
        </div>
      )}
    </div>
  );
};

