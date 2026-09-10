import React from 'react';
import { LuxuryTheme } from '../theme/colors.js';
import { EchoPastCard } from '../components/EchoPastCard';

export interface PastEchoItem {
  title: string;
  reason: string;
  date?: string;
  score?: number;
}

export interface DecisionFlowPipelineProps {
  dilemma: string;
  goalsPrices?: string;
  facts?: string;
  assumptions?: string;
  question?: string;
  pastEcho?: PastEchoItem | null;
  answer?: string;
  proposedSteps?: string[];
  conclusion?: string;
  nextStep?: string;
  scrollable?: boolean;
  maxHeight?: number | string;
}

const splitIntoBullets = (text?: string): string[] => {
  if (!text) return [];
  if (text.includes('\n')) {
    return text.split('\n').map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
  }
  if (text.includes(' | ')) {
    return text.split(' | ').map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
  }
  if (text.includes('•')) {
    return text.split('•').map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
  }
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  if (sentences && sentences.length > 1) {
    return sentences.map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
  }
  return [text];
};

export const DecisionFlowPipeline: React.FC<DecisionFlowPipelineProps> = ({
  dilemma,
  goalsPrices,
  facts,
  assumptions,
  question,
  pastEcho,
  answer,
  proposedSteps,
  conclusion,
  nextStep,
  scrollable = true,
  maxHeight = 480
}) => {
  const factBullets = splitIntoBullets(facts);
  const assumptionBullets = splitIntoBullets(assumptions);

  const content = (
    <div className="flex flex-col gap-3 text-right" dir="rtl">
      
      {/* 01. הדילמה (אתה שוקל) */}
      <div className="flex flex-row items-start gap-2.5">
        <div className="flex flex-col items-center w-7 shrink-0">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border"
               style={{ borderColor: 'rgba(212, 175, 55, 0.4)', backgroundColor: 'rgba(212, 175, 55, 0.08)', color: LuxuryTheme.accent.gold }}>
            01
          </div>
          <div className="w-[1px] flex-1 min-h-[28px] mt-1 -mb-2" style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}></div>
        </div>

        <div className="flex-1 p-3 rounded-xl border"
             style={{ backgroundColor: 'rgba(212, 175, 55, 0.03)', borderColor: 'rgba(212, 175, 55, 0.25)' }}>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="font-bold" style={{ color: LuxuryTheme.accent.gold }}>הדילמה שזוקקה</span>
            <span className="opacity-50 text-[10px]">המראה משקפת</span>
          </div>
          <div className="text-[11px] font-medium opacity-70 mb-0.5">אתה שוקל:</div>
          <div className="text-sm font-semibold leading-snug" style={{ color: LuxuryTheme.text.primary }}>
            {dilemma || 'טרם הוגדרה דילמה'}
          </div>
        </div>
      </div>

      {/* 02. מטרות ומחירים */}
      {Boolean(goalsPrices) && (
        <div className="flex flex-row items-start gap-2.5">
          <div className="flex flex-col items-center w-7 shrink-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border bg-white/[0.04] border-white/10"
                 style={{ color: LuxuryTheme.text.tertiary }}>
              02
            </div>
            <div className="w-[1px] flex-1 min-h-[28px] mt-1 -mb-2" style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}></div>
          </div>

          <div className="flex-1 p-3 rounded-xl border bg-white/[0.02] border-white/10">
            <div className="flex justify-between items-center mb-1 text-[11px] opacity-80">
              <span className="font-medium">מטרות ומחירים (Trade-offs)</span>
            </div>
            <div className="text-xs leading-relaxed opacity-90">{goalsPrices}</div>
          </div>
        </div>
      )}

      {/* 03. עובדות קשיחות */}
      {Boolean(facts) && (
        <div className="flex flex-row items-start gap-2.5">
          <div className="flex flex-col items-center w-7 shrink-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border bg-white/[0.04] border-white/10"
                 style={{ color: LuxuryTheme.text.tertiary }}>
              03
            </div>
            <div className="w-[1px] flex-1 min-h-[28px] mt-1 -mb-2" style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}></div>
          </div>

          <div className="flex-1 p-3 rounded-xl border bg-white/[0.02] border-white/10">
            <div className="flex justify-between items-center mb-1 text-[11px]">
              <span className="font-medium">עובדות קשיחות</span>
              <span className="opacity-40 text-[10px]">ודאות</span>
            </div>
            {factBullets.length > 1 ? (
              <div className="space-y-1 mt-1">
                {factBullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-white/40"></span>
                    <span className="leading-relaxed opacity-90">{b}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs leading-relaxed opacity-90">{facts}</div>
            )}
          </div>
        </div>
      )}

      {/* 04. הנחות ופרשנויות */}
      {Boolean(assumptions) && (
        <div className="flex flex-row items-start gap-2.5">
          <div className="flex flex-col items-center w-7 shrink-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border bg-white/[0.04] border-white/10"
                 style={{ color: LuxuryTheme.text.tertiary }}>
              04
            </div>
            <div className="w-[1px] flex-1 min-h-[28px] mt-1 -mb-2" style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}></div>
          </div>

          <div className="flex-1 p-3 rounded-xl border bg-white/[0.02] border-white/10">
            <div className="flex justify-between items-center mb-1 text-[11px]">
              <span className="font-medium">הנחות ופרשנויות</span>
              <span className="opacity-40 text-[10px]">סובייקטיבי</span>
            </div>
            {assumptionBullets.length > 1 ? (
              <div className="space-y-1 mt-1">
                {assumptionBullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs italic">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: LuxuryTheme.accent.gold }}></span>
                    <span className="leading-relaxed opacity-90">"{b}"</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs italic leading-relaxed opacity-90">"{assumptions}"</div>
            )}
          </div>
        </div>
      )}

      {/* 05. שאלת חידוד (Intervention) */}
      {Boolean(question) && (
        <div className="flex flex-row items-start gap-2.5">
          <div className="flex flex-col items-center w-7 shrink-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] border"
                 style={{ borderColor: LuxuryTheme.accent.gold, backgroundColor: '#151c28', color: LuxuryTheme.accent.gold }}>
              ✦
            </div>
            <div className="w-[1px] flex-1 min-h-[28px] mt-1 -mb-2" style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}></div>
          </div>

          <div className="flex-1 p-3 rounded-xl border"
               style={{ backgroundColor: 'rgba(21, 28, 40, 0.85)', borderColor: 'rgba(212, 175, 55, 0.35)' }}>
            <div className="flex justify-between items-center mb-1 text-[11px]">
              <span className="font-bold" style={{ color: LuxuryTheme.accent.gold }}>שאלת חידוד (נקודת מפנה)</span>
              <span className="opacity-50 text-[10px]">התערבות מכיילת</span>
            </div>
            <div className="text-xs font-medium italic leading-relaxed" style={{ color: LuxuryTheme.accent.gold }}>
              "{question}"
            </div>
          </div>
        </div>
      )}

      {/* 06. הפניה מהעבר (הד מהעבר - כרטיס EchoPastCard מלא) */}
      {pastEcho ? (
        <div className="flex flex-row items-start gap-2.5">
          <div className="flex flex-col items-center w-7 shrink-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] border border-dashed"
                 style={{ borderColor: 'rgba(212, 175, 55, 0.5)', backgroundColor: 'rgba(212, 175, 55, 0.05)', color: LuxuryTheme.accent.gold }}>
              ↺
            </div>
            <div className="w-[1px] flex-1 min-h-[28px] mt-1 -mb-2" style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}></div>
          </div>

          <div className="flex-1">
            <EchoPastCard 
              title={pastEcho.title} 
              reason={pastEcho.reason} 
              score={pastEcho.score ?? 0.85} 
            />
          </div>
        </div>
      ) : null}

      {/* 07. תשובת הבהירות */}
      {Boolean(answer) && (
        <div className="flex flex-row items-start gap-2.5">
          <div className="flex flex-col items-center w-7 shrink-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border bg-white/[0.04] border-white/10"
                 style={{ color: LuxuryTheme.text.tertiary }}>
              07
            </div>
            <div className="w-[1px] flex-1 min-h-[28px] mt-1 -mb-2" style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}></div>
          </div>

          <div className="flex-1 p-3 rounded-xl border bg-white/[0.02] border-white/10">
            <div className="flex justify-between items-center mb-1 text-[11px] opacity-80">
              <span className="font-medium">התשובה שהובילה לבהירות</span>
            </div>
            <div className="text-xs leading-relaxed opacity-90">{answer}</div>
          </div>
        </div>
      )}

      {/* 07b. פעולות מומלצות (הצעת המערכת) */}
      {Boolean(proposedSteps && proposedSteps.length > 0) && (
        <div className="flex flex-row items-start gap-2.5">
          <div className="flex flex-col items-center w-7 shrink-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border bg-white/[0.04] border-white/10"
                 style={{ color: LuxuryTheme.accent.gold }}>
              ★
            </div>
            <div className="w-[1px] flex-1 min-h-[28px] mt-1 -mb-2" style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}></div>
          </div>

          <div className="flex-1 p-3 rounded-xl border bg-white/[0.02]" style={{ borderColor: 'rgba(212, 175, 55, 0.25)' }}>
            <div className="flex justify-between items-center mb-1.5 text-[11px]">
              <span className="font-bold" style={{ color: LuxuryTheme.accent.gold }}>פעולות מומלצות</span>
              <span className="opacity-50 text-[10px]">הצעת המערכת</span>
            </div>
            <div className="space-y-1.5">
              {proposedSteps!.map((stepText, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs text-[#E6E8EE] leading-relaxed">
                  <span className="text-amber-400 font-bold shrink-0">•</span>
                  <span>{stepText}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 08. מסקנה והצעד הבא */}
      <div className="flex flex-row items-start gap-2.5">
        <div className="flex flex-col items-center w-7 shrink-0">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black"
               style={{ backgroundColor: LuxuryTheme.accent.gold, color: '#07080B' }}>
            ✓
          </div>
        </div>

        <div className="flex-1 p-3 rounded-xl border"
             style={{ backgroundColor: 'rgba(21, 28, 40, 0.95)', borderColor: LuxuryTheme.accent.gold }}>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="font-bold" style={{ color: LuxuryTheme.accent.gold }}>מסקנה והצעד הנבחר</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">סגור לביצוע</span>
          </div>
          <div className="text-xs font-semibold mb-2" style={{ color: LuxuryTheme.text.primary }}>
            {conclusion || 'החלטה מיושרת שיקול דעת'}
          </div>
          {Boolean(nextStep) && (
            <div className="p-2 rounded-lg border text-xs" style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)', borderColor: 'rgba(212, 175, 55, 0.25)' }}>
              <span className="font-bold ml-1" style={{ color: LuxuryTheme.accent.gold }}>הצעד הבא:</span>
              <span>{nextStep}</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );

  if (scrollable) {
    return (
      <div 
        className="overflow-y-auto custom-scroll p-3 rounded-2xl border"
        style={{ 
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          borderColor: 'rgba(212, 175, 55, 0.15)',
          backgroundColor: 'rgba(7, 8, 11, 0.65)'
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};