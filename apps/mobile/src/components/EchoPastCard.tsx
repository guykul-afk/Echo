import React, { useState } from 'react';
import { LuxuryTheme } from '../theme/colors';

export interface EchoPastCardProps {
  title: string;
  reason: string;
  score?: number;
}

export const EchoPastCard: React.FC<EchoPastCardProps> = ({ title, reason, score }) => {
  const [expanded, setExpanded] = useState(false);

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
          <span className="text-xs font-bold tracking-wider" style={{ color: LuxuryTheme.accent.gold }}>
            ✨ הד מהעבר
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

      {expanded && (
        <div className="p-3.5 pt-2 border-t text-right" style={{ borderTopColor: 'rgba(212, 175, 55, 0.1)' }}>
          <div className="text-[11px] font-semibold mb-1" style={{ color: LuxuryTheme.text.secondary }}>
            הקשר רלוונטי מהעבר:
          </div>
          <div className="text-xs font-light leading-relaxed whitespace-pre-wrap" style={{ color: LuxuryTheme.text.primary }}>
            {reason}
          </div>
        </div>
      )}
    </div>
  );
};

