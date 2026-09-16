import React, { useState, useEffect } from 'react';
import { LuxuryTheme } from '../theme/colors.js';
import { DecisionProfileData } from '@echo/shared';
import { fetchUserProfileFromBackend } from '../services/firestoreSync.js';

interface DecisionProfileScreenProps {
  onBack: () => void;
  onOpenJournal?: (decisionId?: string) => void;
  capturesCount?: number;
  closuresCount?: number;
  currentUserId?: string;
  profileData?: DecisionProfileData;
}

export const DecisionProfileScreen: React.FC<DecisionProfileScreenProps> = ({
  onBack,
  capturesCount = 0,
  closuresCount = 0,
  currentUserId,
  profileData,
}) => {
  const [expandedDecisionId, setExpandedDecisionId] = useState<string | null>(null);
  const [resolvedProfile, setResolvedProfile] = useState<DecisionProfileData | undefined>(profileData);
  const [isLoading, setIsLoading] = useState<boolean>(!profileData && Boolean(currentUserId));

  useEffect(() => {
    if (profileData) {
      setResolvedProfile(profileData);
      setIsLoading(false);
      return;
    }
    if (currentUserId) {
      setIsLoading(true);
      fetchUserProfileFromBackend(currentUserId)
        .then(p => {
          if (p) setResolvedProfile(p);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [profileData, currentUserId]);

  const toggleDecision = (id: string) => {
    setExpandedDecisionId(prev => (prev === id ? null : id));
  };

  const activeProfile = resolvedProfile || profileData;
  const displayCount = activeProfile?.capturesCount ?? capturesCount;

  // Loading state with Design System compliance
  if (isLoading && !activeProfile) {
    return (
      <div
        className="flex-1 w-full max-w-[440px] mx-auto p-4 sm:p-5 overflow-y-auto custom-scroll text-right space-y-6 select-none"
        dir="rtl"
        style={{ backgroundColor: LuxuryTheme.background.base, color: LuxuryTheme.text.primary }}
      >
        <header className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-[#E6E8EE]/70"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div>
              <span className="text-[11px] font-semibold tracking-widest text-[#D4AF37] uppercase block">
                מראה אישית
              </span>
              <h1 className="text-xl font-editorial font-bold text-[#E6E8EE]">
                הפרופיל האפיסטמי שלך
              </h1>
            </div>
          </div>
        </header>

        <section
          className="p-6 rounded-2xl border space-y-4 animate-pulse"
          style={{
            backgroundColor: LuxuryTheme.background.surface,
            borderColor: 'rgba(212, 175, 55, 0.25)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
            <span className="text-xs font-semibold text-[#D4AF37]">טוען פרופיל אפיסטמי מהשרת...</span>
          </div>
          <div className="h-6 w-2/3 bg-white/[0.05] rounded-lg" />
          <div className="h-16 w-full bg-white/[0.03] rounded-xl" />
        </section>
      </div>
    );
  }

  // Zero-Trust: If user has fewer than 3 decisions and no calculated profile data, show authentic Zero-State
  if (!activeProfile && displayCount < 3) {
    return (
      <div
        className="flex-1 w-full max-w-[440px] mx-auto p-4 sm:p-5 overflow-y-auto custom-scroll text-right space-y-6 select-none"
        dir="rtl"
        style={{ backgroundColor: LuxuryTheme.background.base, color: LuxuryTheme.text.primary }}
      >
        <header className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-[#E6E8EE]/70 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors cursor-pointer"
              title="חזרה"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div>
              <span className="text-[11px] font-semibold tracking-widest text-[#D4AF37] uppercase block">
                מראה אישית
              </span>
              <h1 className="text-xl font-editorial font-bold text-[#E6E8EE]">
                הפרופיל האפיסטמי שלך
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            <span>{displayCount} החלטות מתועדות</span>
          </div>
        </header>

        {/* Authentic Zero-State Card */}
        <section
          className="p-6 rounded-2xl border space-y-4 text-center sm:text-right"
          style={{
            backgroundColor: LuxuryTheme.background.surface,
            borderColor: LuxuryTheme.background.border,
            boxShadow: '0 0 24px -4px rgba(212, 175, 55, 0.08)',
          }}
        >
          <div className="w-12 h-12 mx-auto sm:mx-0 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-xl text-[#D4AF37]">
            ✦
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-editorial font-bold text-[#E6E8EE]">
              פרופיל אישי בהתהוות
            </h2>
            <p className="text-xs text-[#E6E8EE]/70 leading-relaxed font-light">
              המנוע מנתח את עוגני שיקול הדעת, מנגנוני ההכרעה והמתחים החוזרים שלך לאורך זמן.
              לאחר רישום החלטות ראשונות וסגירת מעגלי תוצאה (לפחות 3 החלטות), תתגבש כאן תמונת מראה אפיסטמית מלאה ומדויקת ללא נתוני דמה.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-right">
            <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <span className="text-[10px] text-[#E6E8EE]/50 block">החלטות שנלכדו</span>
              <span className="text-base font-bold text-[#E6E8EE]">{displayCount}</span>
            </div>
            <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <span className="text-[10px] text-[#E6E8EE]/50 block">מעגלים שנסגרו</span>
              <span className="text-base font-bold text-[#D4AF37]">{closuresCount}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold tracking-wide border border-[#D4AF37]/40 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] transition-all cursor-pointer shadow-lg active:scale-[0.98]"
            >
              לכד דילמה חדשה ←
            </button>
          </div>
        </section>
      </div>
    );
  }

  const mainStyle = activeProfile?.mainStyle || {
    title: 'דפוסי שיקול דעת אישיים',
    description: 'מנוע הניתוח האפיסטמי מגבש את המאפיינים הייחודיים של קבלת ההחלטות שלך.',
    prominentTendency: 'בחינה שקולה של עובדות והנחות',
    consistencyMetric: 'עקביות בהתפתחות',
  };

  const evolution = activeProfile?.evolution;
  const flowSteps = activeProfile?.flowSteps || [];
  const anchors = activeProfile?.anchors || [];
  const traps = activeProfile?.traps || [];



  return (
    <div
      className="flex-1 w-full max-w-[440px] mx-auto p-4 sm:p-5 overflow-y-auto custom-scroll text-right space-y-6 select-none"
      dir="rtl"
      style={{ backgroundColor: LuxuryTheme.background.base, color: LuxuryTheme.text.primary }}
    >
      {/* Top Navigation Header */}
      <header className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-[#E6E8EE]/70 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors cursor-pointer"
            title="חזרה"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div>
            <span className="text-[11px] font-semibold tracking-widest text-[#D4AF37] uppercase block">
              מראה אישית
            </span>
            <h1 className="text-xl font-editorial font-bold text-[#E6E8EE]">
              איך אתה מקבל החלטות
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
          <span>על בסיס {displayCount} החלטות מתועדות</span>
        </div>
      </header>

      {/* 1. Main Portrait / Archetype (תמונת מצב נינוחה) */}
      <section
        className="p-5 sm:p-6 rounded-2xl border relative overflow-hidden space-y-3"
        style={{
          backgroundColor: LuxuryTheme.background.surface,
          borderColor: 'rgba(212, 175, 55, 0.25)',
          boxShadow: '0 0 24px -4px rgba(212, 175, 55, 0.16)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold">
            הסגנון הראשי שלך
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-editorial font-bold text-[#E6E8EE] leading-snug">
          {mainStyle.title}
        </h2>

        <p className="text-xs sm:text-sm text-[#E6E8EE]/85 leading-relaxed font-light">
          {mainStyle.description}
        </p>

        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#E6E8EE]/60">
          <span>
            הנטייה הבולטת: <strong className="text-[#E6E8EE]/90 font-medium">{mainStyle.prominentTendency}</strong>
          </span>
          <span className="text-[#D4AF37] font-medium">{mainStyle.consistencyMetric}</span>
        </div>
      </section>

      {/* 1.5 Evolution Journey / Trajectory Shift (אם זוהתה מגמת שינוי לאורך ציר הזמן) */}
      {evolution && (
        <section
          className="p-5 sm:p-6 rounded-2xl border relative overflow-hidden space-y-3 bg-[#D4AF37]/[0.04] border-[#D4AF37]/30"
          style={{
            boxShadow: '0 0 20px -4px rgba(212, 175, 55, 0.15)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
              <span className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold">
                המסע שלך • שינוי סגנון זוהה
              </span>
            </div>
            <span className="text-[11px] font-medium bg-[#D4AF37]/15 text-[#D4AF37] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
              {evolution.trajectoryShiftBadge}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#E6E8EE]/70 font-light pt-0.5">
            <span className="line-through opacity-50">{evolution.fromStyle}</span>
            <span className="text-[#D4AF37] font-bold">←</span>
            <span className="text-[#E6E8EE] font-medium">{evolution.toStyle}</span>
          </div>

          <p className="text-xs sm:text-sm text-[#E6E8EE]/85 leading-relaxed font-light">
            {evolution.narrative}
          </p>

          {evolution.inflectionPointCaseTitle && (
            <div className="pt-2.5 border-t border-white/[0.06] text-xs text-[#E6E8EE]/60 flex items-center justify-between">
              <span>נקודת המפנה זוהתה ב:</span>
              <span className="text-[#D4AF37] font-medium">«{evolution.inflectionPointCaseTitle}»</span>
            </div>
          )}
        </section>
      )}


      {/* 2. Natural Decision Flow (איך הראש שלך עובד כשעולה דילמה) */}
      <section
        className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] space-y-4"
        style={{ backgroundColor: LuxuryTheme.background.surface }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-[#D4AF37] uppercase block">
              הדפוס האישי שלך
            </span>
            <h3 className="text-base sm:text-lg font-editorial font-bold text-[#E6E8EE]">
              איך מתגלגלת אצלך החלטה
            </h3>
          </div>
          <span className="text-xs text-[#E6E8EE]/40 font-light">מהדילמה לביצוע</span>
        </div>

        <p className="text-xs text-[#E6E8EE]/70 font-light leading-normal">
          בלי קשר למערכת כזו או אחרת, כשאתה ניצב מול צומת משמעותי, הראש שלך עובד בדרך כלל בסדר הבא:
        </p>

        <div className="space-y-3 pt-2 relative before:absolute before:top-4 before:bottom-4 before:right-[15px] before:w-[2px] before:bg-gradient-to-b before:from-[#D4AF37]/40 before:via-white/10 before:to-[#D4AF37]/40">
          {flowSteps.map((step, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === flowSteps.length - 1;
            return (
              <div key={step.stepNumber || idx} className="flex items-start gap-3.5 relative">
                <div
                  className={`w-8 h-8 rounded-full bg-[#07080B] border text-xs flex items-center justify-center flex-shrink-0 z-10 font-semibold ${
                    isLast
                      ? 'border-[#D4AF37] text-[#D4AF37] font-bold'
                      : isFirst
                      ? 'border-[#D4AF37]/50 text-[#D4AF37]'
                      : 'border-white/20 text-[#E6E8EE]/70'
                  }`}
                  style={isLast ? { boxShadow: '0 0 12px rgba(212, 175, 55, 0.3)' } : undefined}
                >
                  {step.stepNumber}
                </div>
                <div
                  className={`border rounded-xl p-3 flex-1 ${
                    isLast
                      ? 'bg-[#D4AF37]/[0.04] border-[#D4AF37]/20'
                      : 'bg-white/[0.02] border-white/[0.06]'
                  }`}
                >
                  <h4 className={`text-xs sm:text-sm font-semibold mb-1 ${isLast ? 'text-[#D4AF37]' : 'text-[#E6E8EE]'}`}>
                    {step.title}
                  </h4>
                  <p className={`text-xs font-light leading-relaxed ${isLast ? 'text-[#E6E8EE]/80' : 'text-[#E6E8EE]/70'}`}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>


      {/* 3. Anchors to Preserve (דברים שעובדים מעולה ושווה לשמר) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
          <h3 className="text-base font-editorial font-bold text-[#E6E8EE]">
            דברים שעובדים מעולה ושווה לשמר
          </h3>
          <span className="text-xs text-[#E6E8EE]/40 font-light">(החוזקות הטבעיות שלך)</span>
        </div>

        {anchors.map(anchor => (
          <article
            key={anchor.id || anchor.caseId}
            className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#D4AF37]/30 transition-all space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] text-xs font-bold">
                  ✓
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-[#E6E8EE]">
                  {anchor.title}
                </h4>
              </div>
              <span className="text-[11px] text-[#D4AF37] font-medium bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/20">
                {anchor.tag}
              </span>
            </div>
            <p className="text-xs text-[#E6E8EE]/70 font-light leading-relaxed">
              {anchor.description}
            </p>

            {anchor.caseTitle && (
              <div className="pt-2 border-t border-white/[0.05]">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#E6E8EE]/50 flex items-center gap-1.5 truncate max-w-[240px]">
                    <span>ראינו את זה ב:</span>
                    <span className="text-[#E6E8EE]/80 font-medium">{anchor.caseTitle}</span>
                  </div>
                  {anchor.authenticDilemmaQuote && (
                    <button
                      type="button"
                      onClick={() => toggleDecision(anchor.caseId || anchor.id)}
                      className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{expandedDecisionId === (anchor.caseId || anchor.id) ? 'סגור פרטים' : 'מה קרה שם'}</span>
                      <span>{expandedDecisionId === (anchor.caseId || anchor.id) ? '▲' : '←'}</span>
                    </button>
                  )}
                </div>

                {expandedDecisionId === (anchor.caseId || anchor.id) && anchor.authenticDilemmaQuote && (
                  <div className="mt-2.5 p-3 rounded-xl bg-white/[0.02] border border-[#D4AF37]/20 text-xs space-y-1.5">
                    <div className="font-medium text-[#D4AF37]">ההתלבטות האותנטית שלך:</div>
                    <blockquote className="text-[#E6E8EE]/80 italic bg-[#07080B]/60 p-2 rounded-lg border-r-2 border-[#D4AF37]">
                      "{anchor.authenticDilemmaQuote}"
                    </blockquote>
                    {anchor.systemReflection && (
                      <div className="text-[11px] text-[#E6E8EE]/60 pt-1">
                        {anchor.systemReflection}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </section>

      {/* 4. Traps to Watch Out For (מקומות ששווה לשים אליהם לב) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <span className="w-2 h-2 rounded-full bg-white/40"></span>
          <h3 className="text-base font-editorial font-bold text-[#E6E8EE]">
            מקומות ששווה לשים אליהם לב
          </h3>
          <span className="text-xs text-[#E6E8EE]/40 font-light">(מלכודות קטנות בדרך)</span>
        </div>

        {traps.map(trap => (
          <article
            key={trap.id || trap.caseId}
            className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center text-[#E6E8EE]/80 text-xs font-bold">
                  !
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-[#E6E8EE]">
                  {trap.title}
                </h4>
              </div>
              <span className="text-[11px] text-[#E6E8EE]/60 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                {trap.tag}
              </span>
            </div>
            <p className="text-xs text-[#E6E8EE]/70 font-light leading-relaxed">
              {trap.description}
            </p>

            {trap.caseTitle && (
              <div className="pt-2 border-t border-white/[0.05]">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#E6E8EE]/50 flex items-center gap-1.5 truncate max-w-[240px]">
                    <span>התבטא ב:</span>
                    <span className="text-[#E6E8EE]/80 font-medium">{trap.caseTitle}</span>
                  </div>
                  {trap.authenticAssumptionQuote && (
                    <button
                      type="button"
                      onClick={() => toggleDecision(trap.caseId || trap.id)}
                      className="text-xs text-[#E6E8EE]/60 hover:text-[#D4AF37] flex items-center gap-1 cursor-pointer"
                    >
                      <span>{expandedDecisionId === (trap.caseId || trap.id) ? 'סגור פרטים' : 'בחינת ההנחה'}</span>
                      <span>{expandedDecisionId === (trap.caseId || trap.id) ? '▲' : '←'}</span>
                    </button>
                  )}
                </div>

                {expandedDecisionId === (trap.caseId || trap.id) && trap.authenticAssumptionQuote && (
                  <div className="mt-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/15 text-xs space-y-1.5">
                    <div className="font-medium text-[#E6E8EE]/90">ההנחה שעלתה בבדיקה:</div>
                    <blockquote className="text-[#E6E8EE]/70 italic bg-[#07080B]/60 p-2 rounded-lg border-r-2 border-white/30">
                      "{trap.authenticAssumptionQuote}"
                    </blockquote>
                    {trap.systemReflection && (
                      <div className="text-[11px] text-[#E6E8EE]/60 pt-1">
                        {trap.systemReflection}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </section>


      {/* Discreet Footer */}
      <footer className="pt-4 pb-2 border-t border-white/[0.06] text-center space-y-2">
        <p className="text-[11px] text-[#E6E8EE]/40 font-light">
          התובנות מתעדכנות מעצמן ככל שאתה מקבל עוד החלטות במערכת.
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37]/80">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>מרחב אישי ופרטי לחלוטין • מוצפן בהד שלך</span>
        </div>
      </footer>
    </div>
  );
};

export default DecisionProfileScreen;
