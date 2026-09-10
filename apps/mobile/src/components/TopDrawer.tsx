import React, { useState, useEffect } from 'react';
import { LuxuryTheme } from '../theme/colors.js';
import { UserAuthModal } from './UserAuthModal.js';

interface TopDrawerProps {
  currentUser: string;
  onSwitchUser: (newUser: string) => void;
  onOpenJournal: () => void;
  onOpenCalibration: () => void;
}

export const TopDrawer: React.FC<TopDrawerProps> = ({
  currentUser,
  onSwitchUser,
  onOpenJournal,
  onOpenCalibration
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY') || '';
    setApiKey(storedKey);
  }, []);

  const handlePromptUser = () => {
    setIsAuthModalOpen(true);
  };

  const handlePromptApiKey = () => {
    const current = localStorage.getItem('GEMINI_API_KEY') || '';
    const key = window.prompt('הגדר מפתח Gemini API (השאר ריק לברירת מחדל):', current);
    if (key !== null) {
      if (key.trim()) {
        localStorage.setItem('GEMINI_API_KEY', key.trim());
        setApiKey(key.trim());
        alert('מפתח API עודכן בהצלחה');
      } else {
        localStorage.removeItem('GEMINI_API_KEY');
        setApiKey('');
        alert('מפתח הוסר (שימוש בהגדרות ברירת מחדל)');
      }
    }
  };

  return (
    <div className="w-full shrink-0 z-30 flex flex-col items-center select-none pt-1" dir="rtl">
      {/* Minimalist Small Arrow Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="py-1 px-4 flex items-center justify-center opacity-60 hover:opacity-100 transition-all focus:outline-none cursor-pointer group active:scale-90"
        style={{ color: LuxuryTheme.accent.gold }}
        title="פתיחת/סגירת תפריט טכני והגדרות"
        aria-label="תפריט טכני"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expandable Technical Drawer Panel */}
      <div
        className={`w-full px-3 sm:px-4 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-40 opacity-100 mb-2 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="py-2 px-3 rounded-2xl bg-white/[0.03] border backdrop-blur-md flex flex-col gap-2 shadow-xl"
          style={{ borderColor: LuxuryTheme.background.border }}
        >
          {/* Row 1: Active User, Switch, Key, Cloud */}
          <div className="flex items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                onClick={handlePromptUser}
                className="text-xs font-semibold tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: LuxuryTheme.accent.gold }}
                title="לחץ לשינוי שם או החלפת משתמש"
              >
                @{currentUser}
              </span>
              <button
                type="button"
                onClick={handlePromptUser}
                className="px-2 py-0.5 rounded-full text-[10px] border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all font-light cursor-pointer text-[#E6E8EE]"
              >
                שנה שם / החלף
              </button>
              <button
                type="button"
                onClick={handlePromptApiKey}
                title="הגדר מפתח Gemini API (אופציונלי)"
                className="px-2 py-0.5 rounded-full text-[10px] border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all font-light cursor-pointer text-[#E6E8EE]"
              >
                {apiKey ? 'מפתח מוגדר ✓' : 'מפתח'}
              </button>
            </div>
            <span
              className="text-[10px] font-light opacity-70 shrink-0 text-[#E6E8EE] flex items-center gap-1"
              title="Firebase Cloud Firestore"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              ענן מחובר
            </span>
          </div>

          {/* Row 2: Separate Buttons for Journal & Calibration */}
          <div className="pt-1.5 border-t grid grid-cols-2 gap-2" style={{ borderColor: LuxuryTheme.background.border }}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenJournal();
              }}
              className="py-1.5 px-3 rounded-xl text-[11px] border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-all font-medium flex items-center justify-center gap-1 cursor-pointer text-[#E6E8EE]"
            >
              <span>יומן החלטות</span>
              <span style={{ color: LuxuryTheme.accent.gold }}>←</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenCalibration();
              }}
              className="py-1.5 px-3 rounded-xl text-[11px] border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-all font-medium flex items-center justify-center gap-1 cursor-pointer text-[#E6E8EE]"
            >
              <span>פרופיל כיול</span>
              <span style={{ color: LuxuryTheme.accent.gold }}>←</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Identity & Social Sign-In Modal */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        currentUser={currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        onSelectUser={(u) => {
          onSwitchUser(u);
        }}
      />
    </div>
  );
};
