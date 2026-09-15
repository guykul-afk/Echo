import React, { useState } from 'react';
import { LuxuryTheme } from '../theme/colors.js';
import { signInWithGoogleSocial, signOutUser, handleAppleSignInNotice, getUserFriendlyName } from '../services/firebaseAuth.js';
import { syncUserDecisionsFromCloud } from '../services/firestoreSync.js';

interface UserAuthModalProps {
  isOpen: boolean;
  currentUser: string | null;
  onClose?: () => void;
  onSelectUser: (username: string) => void;
  canClose?: boolean;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSelectUser,
  canClose = true
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isAuthenticated = Boolean(currentUser);

  const handleGoogleClick = async () => {
    try {
      setIsSigningIn(true);
      const user = await signInWithGoogleSocial();
      if (user) {
        onSelectUser(user);
        await syncUserDecisionsFromCloud(user);
        if (onClose) onClose();
        const friendly = getUserFriendlyName(user);
        alert(`התחברת בהצלחה! שלום @${friendly}`);
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      alert('ההתחברות לא הושלמה: ' + (err?.message || 'אנא נסה שוב'));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOutClick = async () => {
    try {
      await signOutUser();
      onSelectUser('');
      if (onClose) onClose();
    } catch (err: any) {
      console.warn('Sign-out error:', err);
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
          {canClose && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-2.5 py-1 rounded-full border border-stone-700 opacity-70 hover:opacity-100 transition-opacity cursor-pointer text-[#E6E8EE]"
            >
              ✕ סגור
            </button>
          ) : <div />}
          <span className="text-[10px] font-mono tracking-wider opacity-50 text-[#E6E8EE]">USER AUTHENTICATION</span>
        </div>

        <div>
          <h3 className="font-editorial text-xl font-bold" style={{ color: LuxuryTheme.accent.gold }}>
            מרחב שיקול דעת אישי
          </h3>
          <p className="text-xs opacity-70 font-light mt-1.5 leading-relaxed text-[#E6E8EE]">
            {!isAuthenticated 
              ? 'התחבר באמצעות חשבון Google כדי להיכנס למרחב הזיכרון האישי שלך.' 
              : 'אתה מחובר כעת לחשבונך. כל ההחלטות והלקחים שלך נשמרים ומסונכרנים בענן.'}
          </p>
        </div>

        {/* Current Identity Box */}
        <div 
          className="p-3.5 rounded-2xl border bg-white/[0.02] flex items-center justify-between"
          style={{ borderColor: LuxuryTheme.background.border }}
        >
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-50 block text-[#E6E8EE]">מצב חיבור נוכחי</span>
            <span className="text-xs font-semibold mt-0.5 block" style={{ color: !isAuthenticated ? '#A8A29E' : LuxuryTheme.accent.gold }}>
              {!isAuthenticated ? '🔒 לא מחובר (נדרש אימות)' : `@${getUserFriendlyName(currentUser)}`}
            </span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
            !isAuthenticated 
              ? 'border-rose-700/50 bg-rose-950/30 text-rose-300' 
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          }`}>
            {!isAuthenticated ? 'נדרש אימות' : 'ענן מאומת ✓'}
          </span>
        </div>

        {/* Actions: Social Sign-In (Google / Apple) */}
        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            disabled={isSigningIn}
            onClick={handleGoogleClick}
            className="w-full py-3 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2.5 border transition-all active:scale-[0.98] bg-white/[0.06] hover:bg-white/[0.1] text-stone-100 border-amber-500/30 shadow-md cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span className="font-semibold text-amber-200">
              {isSigningIn 
                ? 'מתחבר ל-Google...' 
                : (!isAuthenticated ? 'התחבר עם Google' : 'החלף חשבון Google')}
            </span>
          </button>

          <button
            type="button"
            onClick={handleAppleSignInNotice}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border transition-all active:scale-[0.98] bg-white/[0.02] hover:bg-white/[0.05] text-stone-300 border-stone-800 cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current shrink-0 text-[#E6E8EE]" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.58.66-1.08 1.73-.95 2.76 1 .08 2.05-.51 2.67-1.26"/>
            </svg>
            <span>התחבר עם Apple</span>
          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={handleSignOutClick}
              className="w-full py-2 rounded-xl text-[11px] font-medium transition-all active:scale-[0.98] border border-red-900/30 bg-red-950/10 text-red-300 hover:bg-red-950/20 cursor-pointer mt-1"
            >
              התנתק מהחשבון
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
