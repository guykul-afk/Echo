import React, { useState } from 'react';
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
    <div className="flex-1 w-full max-w-[395px] mx-auto p-5 overflow-y-auto custom-scroll text-right space-y-5" dir="rtl">
      <div>
        <h2 className="font-editorial text-xl font-bold" style={{ color: LuxuryTheme.text.primary }}>
          חוזה הערכה ונעילת החלטה
        </h2>
        <p className="text-xs opacity-60 leading-relaxed mt-1">
          הגדר מראש מה ייחשב כאימות מוצלח ומתי נחזור לבחון את המצב, לפני שידועה התוצאה.
        </p>
      </div>

      {/* Select Option */}
      <div className="space-y-2">
        <label className="text-xs font-semibold opacity-70 block">
          הבחירה שנבחרה לפעולה:
        </label>
        <div className="space-y-1.5">
          {options.map((opt) => {
            const isSelected = selectedOptId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedOptId(opt.id)}
                className={`w-full p-3 rounded-xl border text-xs text-right cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-amber-400 bg-amber-500/10 font-bold text-amber-200' 
                    : 'border-white/10 bg-white/[0.02] text-stone-300 hover:bg-white/[0.05]'
                }`}
              >
                {opt.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Define Target Criteria */}
      <div className="space-y-2">
        <label className="text-xs font-semibold opacity-70 block">
          קריטריון הצלחה מדויק לבדיקה עתידית:
        </label>
        <textarea
          rows={3}
          placeholder="לדוגמה: לפחות לקוח אחד ששילם בפועל וממשיך להשתמש בשבוע השמיני..."
          value={targetCriteria}
          onChange={e => setTargetCriteria(e.target.value)}
          className="w-full p-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-right focus:outline-none resize-none placeholder:opacity-40"
          style={{ color: LuxuryTheme.text.primary }}
        />
      </div>

      {/* Select Review Horizon */}
      <div className="space-y-2">
        <label className="text-xs font-semibold opacity-70 block">
          מועד בדיקה חוזרת (אות מעקב):
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[14, 30, 60, 90].map((days) => {
            const isSelected = reviewDays === days;
            return (
              <button
                key={days}
                type="button"
                onClick={() => setReviewDays(days)}
                className={`py-2 px-1 rounded-xl text-xs font-medium border text-center cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300 font-bold' 
                    : 'border-white/10 bg-white/[0.02] text-stone-400 hover:bg-white/[0.05]'
                }`}
              >
                {days} ימים
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={!targetCriteria.trim()}
        onClick={handleComplete}
        className={`w-full py-3.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
          !targetCriteria.trim()
            ? 'opacity-30 border-white/10 cursor-not-allowed'
            : 'border-emerald-500 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
        }`}
      >
        נעל ושמור לזיכרון שיקול הדעת ✓
      </button>
    </div>
  );
};

