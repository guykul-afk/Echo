import React, { useState, useEffect } from 'react';
import { LuxuryTheme } from '../theme/colors.js';
import { signInWithGoogleSocial, handleAppleSignInNotice } from '../services/firebaseAuth.js';
import { syncUserDecisionsFromCloud } from '../services/firestoreSync.js';

interface UserAuthModalProps {
  isOpen: boolean;
  currentUser: string;
  onClose: () => void;
  onSelectUser: (username: string) => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSelectUser
}) => {
  const [inputName, setInputName] = useState(currentUser);
  const [knownUsers, setKnownUsers] = useState<string[]>([]);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    setInputName(currentUser);
    try {
      const stored = localStorage.getItem('echo_known_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setKnownUsers(parsed);
          return;
        }
      }
    } catch {}
    setKnownUsers(['Guy_Kuleski', 'guy_founder', 'dana_investor', 'noam_founder']);
  }, [currentUser, isOpen]);

  const saveKnownUser = (name: string) => {
    const updated = Array.from(new Set([name, ...knownUsers]));
    setKnownUsers(updated);
    try {
      localStorage.setItem('echo_known_users', JSON.stringify(updated));
    } catch {}
  };

  const handleUpdateCurrentName = () => {
    if (inputName.trim()) {
      const name = inputName.trim();
      saveKnownUser(name);
      onSelectUser(name);
      syncUserDecisionsFromCloud(name);
      onClose();
    }
  };

  const handleSwitchToNew = () => {
    if (inputName.trim()) {
      const name = inputName.trim();
      saveKnownUser(name);
      onSelectUser(name);
      syncUserDecisionsFromCloud(name);
      onClose();
      alert(`נפתח מרחב שיקול דעת עבור @${name}! כל החלטה שתקליט תישמר בנפרד.`);
    }
  };

  const handleGoogleClick = async () => {
    try {
      setIsSigningIn(true);
      const user = await signInWithGoogleSocial();
      if (user) {
        saveKnownUser(user);
        onSelectUser(user);
        await syncUserDecisionsFromCloud(user);
        onClose();
        alert(`התחברת בהצלחה למרחב של @${user}!`);
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      alert('ההתחברות לא הושלמה. ניתן להזין שם ישירות בתיבה.');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none" dir="rtl">
      <div
        className="w-full max-w-[360px] rounded-3xl border p-5 space-y-4 text-right shadow-2xl custom-scroll"
        style={{ backgroundColor: LuxuryTheme.background.base, borderColor: LuxuryTheme.background.border }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded-full border border-stone-700 opacity-70 hover:opacity-100 transition-opacity cursor-pointer text-[#E6E8EE]"
          >
            ✕ סגור
          </button>
          <span className="text-[10px] font-mono tracking-wider opacity-50 text-[#E6E8EE]">USER IDENTITY</span>
        </div>

        <div>
          <h3 className="font-editorial text-xl font-bold" style={{ color: LuxuryTheme.accent.gold }}>
            כניסה למרחב אישי
          </h3>
          <p className="text-xs opacity-60 font-light mt-1 leading-relaxed text-[#E6E8EE]">
            לכל משתמש מרחב שיקול דעת פרטי ומבודד לחלוטין. התחבר עם חשבונך או הזן שם משתמש:
          </p>
        </div>

        {/* Input for Username */}
        <div className="space-y-1.5">
          <label className="text-[11px] block font-light opacity-80 text-[#E6E8EE]">שם משתמש (עברית או אנגלית):</label>
          <div
            className="flex items-center gap-2 bg-black/40 border rounded-xl px-3 py-2"
            style={{ borderColor: LuxuryTheme.background.border }}
          >
            <span className="font-mono text-sm" style={{ color: LuxuryTheme.accent.gold }}>@</span>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="לדוגמה: guy_kuleski, גיא..."
              className="w-full bg-transparent text-xs text-stone-100 placeholder-stone-600 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateCurrentName();
              }}
            />
          </div>
        </div>

        {/* Known Users Chips */}
        {knownUsers.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] block opacity-50 font-light text-[#E6E8EE]">מרחבים קיימים במכשיר:</span>
            <div className="flex flex-wrap gap-1.5">
              {knownUsers.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => {
                    setInputName(u);
                    onSelectUser(u);
                    syncUserDecisionsFromCloud(u);
                    onClose();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] border transition-all cursor-pointer ${
                    u === currentUser
                      ? 'border-amber-400/60 bg-amber-400/10 text-amber-200 font-semibold'
                      : 'border-white/10 bg-white/[0.03] text-stone-300 hover:bg-white/[0.08]'
                  }`}
                >
                  @{u}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleUpdateCurrentName}
            className="w-full py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all shadow-lg active:scale-[0.98] border text-amber-200 cursor-pointer"
            style={{ backgroundColor: 'rgba(212,175,55,0.22)', borderColor: LuxuryTheme.accent.gold }}
          >
            ✓ עדכן את שמי (העבר מידע לשם זה)
          </button>

          <button
            type="button"
            onClick={handleSwitchToNew}
            className="w-full py-2 rounded-xl text-[11px] font-medium transition-all active:scale-[0.98] border border-stone-700 bg-white/[0.03] text-stone-300 hover:border-stone-500 cursor-pointer"
          >
            החלף מרחב / פתח משתמש חדש
          </button>

          {/* Quick Entry */}
          <button
            type="button"
            onClick={() => {
              saveKnownUser('Guy_Kuleski');
              syncUserDecisionsFromCloud('Guy_Kuleski');
              onSelectUser('Guy_Kuleski');
              onClose();
            }}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all active:scale-[0.98] text-amber-300 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 shadow-md cursor-pointer"
          >
            <span>⚡ כניסה מיידית למרחב של גיא (39 לכידות)</span>
          </button>

          {/* Social Sign-In (Google / Apple) */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <button
              type="button"
              disabled={isSigningIn}
              onClick={handleGoogleClick}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border transition-all active:scale-[0.98] bg-white/[0.04] hover:bg-white/[0.08] text-stone-100 border-stone-700 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>{isSigningIn ? 'מתחבר ל-Google...' : 'התחבר עם Google'}</span>
            </button>

            <button
              type="button"
              onClick={handleAppleSignInNotice}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border transition-all active:scale-[0.98] bg-white/[0.04] hover:bg-white/[0.08] text-stone-100 border-stone-700 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current shrink-0 text-[#E6E8EE]" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.58.66-1.08 1.73-.95 2.76 1 .08 2.05-.51 2.67-1.26"/>
              </svg>
              <span>התחבר עם Apple</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
