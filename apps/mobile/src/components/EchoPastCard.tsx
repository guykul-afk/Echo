import React, { useState } from 'react';
import { LuxuryTheme } from '../theme/colors';

export interface RelatedEchoSummaryItem {
  id: string;
  title: string;
  date?: string;
  score?: number;
  matchReason?: string;
  lesson?: string;
}

export interface EchoPastCardProps {
  title: string;
  reason: string;
  score?: number;
  allRelatedEchoes?: RelatedEchoSummaryItem[];
  insightsSummary?: string;
}

export const EchoPastCard: React.FC<EchoPastCardProps> = ({ 
  title, 
  reason, 
  score,
  allRelatedEchoes,
  insightsSummary
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showAllRelated, setShowAllRelated] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="my-3 rounded-2xl border overflow-hidden transition-all duration-300"
         style={{ 
           backgroundColor: 'rgba(212, 175, 55, 0.05)', 
           borderColor: 'rgba(212, 175, 55, 0.25)' 
         }}>
      <button 
        type="button"
        onClick={toggleExpand} 
        className="w-full p-3.5 text-right focus:outline-none cursor-pointer flex flex-col gap-1.5 transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex flex-row-reverse justify-between items-center w-full">
          <span className="text-xs font-bold tracking-wider flex items-center gap-1.5" style={{ color: LuxuryTheme.accent.gold }}>
            <span>✨</span>
            <span>הד מהעבר</span>
            {allRelatedEchoes && allRelatedEchoes.length > 1 && (
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
                {allRelatedEchoes.length} תקדימים
              </span>
            )}
          </span>
          {score !== undefined && (
            <span className="text-[11px] opacity-70" style={{ color: LuxuryTheme.text.tertiary }}>
              התאמה: {Math.round(score * 100)}%
            </span>
          )}
        </div>
        <div className="text-[14px] font-semibold text-right w-full" style={{ color: LuxuryTheme.text.primary }}>
          {title}
        </div>
        <div className="text-[11px] font-medium mt-0.5 text-right flex items-center justify-end gap-1" style={{ color: LuxuryTheme.accent.gold }}>
          <span>{expanded ? '▲ הקטן פרטים' : '▼ הרחב פרטים על התקדים'}</span>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-3.5 pt-2 border-t text-right space-y-3" style={{ borderTopColor: 'rgba(212, 175, 55, 0.1)' }}>
          {/* Primary Reason / Context */}
          <div>
            <div className="text-[11px] font-semibold mb-1" style={{ color: LuxuryTheme.text.secondary }}>
              הקשר רלוונטי מהעבר:
            </div>
            <div className="text-xs font-light leading-relaxed whitespace-pre-wrap" style={{ color: LuxuryTheme.text.primary }}>
              {reason}
            </div>
          </div>

          {/* Insights Summary Box */}
          {insightsSummary && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300 text-[11px]">
                <span>💡</span>
                <span>סיכום תובנות העבר הקשורות:</span>
              </div>
              <p className="text-amber-100/90 leading-relaxed font-light text-[11px]">
                {insightsSummary}
              </p>
            </div>
          )}

          {/* Expand All Related Echoes Button & Section */}
          {allRelatedEchoes && allRelatedEchoes.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllRelated(!showAllRelated);
                }}
                className="w-full py-2 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer"
                style={{ color: LuxuryTheme.accent.gold }}
              >
                <span>{showAllRelated ? '▲ הסתר פירוט תקדימי עבר' : `▼ הרחב את כל ${allRelatedEchoes.length} הדי העבר הקשורים`}</span>
                <span className="opacity-60 text-[10px]">{showAllRelated ? 'צמצם' : 'צפה בכולם'}</span>
              </button>

              {showAllRelated && (
                <div className="mt-2 space-y-2 pt-2">
                  {allRelatedEchoes.map((echo, idx) => (
                    <div key={echo.id || idx} className="p-3 rounded-xl bg-black/40 border border-white/10 text-right space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-amber-300 font-semibold">{echo.title}</span>
                        {echo.score !== undefined && (
                          <span className="text-amber-400/80 font-medium">{Math.round(echo.score * 100)}% התאמה</span>
                        )}
                      </div>
                      {echo.matchReason && (
                        <div className="text-[10px] text-stone-400">
                          {echo.matchReason}
                        </div>
                      )}
                      {echo.lesson && (
                        <div className="text-[11px] text-stone-200 pt-0.5 leading-snug">
                          <strong className="text-emerald-400 font-medium">הלקח מהעבר: </strong>
                          {echo.lesson}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

