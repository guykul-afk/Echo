import React, { useState } from 'react';
import { LuxuryTheme } from '../theme/colors.js';
import { DecisionProfileData } from '@echo/shared';

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
  capturesCount = 44,
  profileData,
}) => {
  const [expandedDecisionId, setExpandedDecisionId] = useState<string | null>(null);

  const toggleDecision = (id: string) => {
    setExpandedDecisionId(prev => (prev === id ? null : id));
  };

  const displayCount = profileData?.capturesCount ?? capturesCount;
  const mainStyle = profileData?.mainStyle || {
    title: 'מחפש קרקע מוצקה לפני תנועה',
    description: 'אתה אדם שמעריך יציבות ושקט נפשי. לפני שאתה יוצא לדרך, חשוב לך להבין בדיוק איפה אתה עומד. אתה מעדיף לוותר על הבטחה לרווח מהיר או הימור מפתה, העיקר לדעת שלא תופתע בהמשך. קשה מאוד לגרור אותך לפעול מתוך לחץ רגעי, ותמיד תעדיף לקחת צעד אחורה ולחשוב עוד רגע לפני שאתה חותך.',
    prominentTendency: 'לקיחת אחריות אישית מלאה',
    consistencyMetric: 'עקביות לאורך זמן',
  };

  const evolution = profileData?.evolution;

  const flowSteps = (profileData?.flowSteps && profileData.flowSteps.length > 0)
    ? profileData.flowSteps
    : [
        {
          stepNumber: '01',
          title: 'צלילה למספרים ולשטח',
          description: 'אתה לא מסתפק בהשערות או שמועות. ישר בודק עלויות, משווה ספקים, ומוודא שהנתונים מסתדרים במציאות.'
        },
        {
          stepNumber: '02',
          title: "בדיקת 'מה התרחיש הכי גרוע'",
          description: 'הדבר הראשון שמעסיק אותך הוא איפה הנפילה עלולה לקרות ואיך מונעים ממנה להשבית את כל הפרויקט.'
        },
        {
          stepNumber: '03',
          title: 'בחינת המצפן הפנימי',
          description: 'אתה עוצר לבדוק האם זה יושב טוב עם הערכים שלך — למשל האם אתה גלוי והוגן מול השותפים והבנקים, או האם אתה קשוב למשפחה.'
        },
        {
          stepNumber: '04',
          title: 'חיתוך שקט והתקדמות',
          description: 'ברגע שקיבלת את ההחלטה, אתה הולך איתה עד הסוף. כמעט שלא רואים אצלך חרטות או זיגזוגים לאחור.'
        }
      ];

  const anchors = (profileData?.anchors && profileData.anchors.length > 0)
    ? profileData.anchors
    : [
        {
          id: 'dc-1788597346752',
          title: 'לא קופץ למים בלי לבדוק שיש חלופה',
          tag: 'זהירות מבורכת',
          description: 'אתה לא מסתמך על הבטחה של ספק בודד אם יש ספק באמינות שלו, ומעדיף לפצל סיכונים מראש כדי שלא תיתקע באמצע הפרויקט.',
          caseTitle: 'אספקת בטון לפרויקט קטרוני',
          caseId: 'dc-1788597346752',
          authenticDilemmaQuote: 'ההחלטה היא האם לפצל את פרויקט קטרוני בין כמה ספקי בטון שיתנו גיבוי אחד לשני או להישאר עם ספק אחד שהאמינות אספקה שלו בינונית...',
          systemReflection: 'הגדרת השוואת עלות העיכוב מול מחיר הפיצול, ובכך מנעת השבתה פוטנציאלית של היציקות.'
        },
        {
          id: 'dc-1789034514046',
          title: 'אומר את האמת על השולחן',
          tag: 'יושרה פנימית',
          description: 'גם בשיחות מורכבות מול גורמים שמחזיקים בכוח (כמו בנקאים או שותפים), אתה בוחר שקיפות מלאה על פני הצגת תמונה מייפה. זה יוצר אמון עמוק.',
          caseTitle: 'שיחה עם בנק הפועלים',
          caseId: 'dc-1789034514046',
          authenticDilemmaQuote: 'האם להיות גלוי לחלוטין לגבי מצב החברה, אתגריה והערכת השוק בשיחה הראשונה עם זיו מבנק הפועלים, או להציג תמונה אופטימית וורודה יותר...',
          systemReflection: 'הכרעת בעד גילוי מלא ואותנטי, מתוך הבנה שאמון מקצועי ארוך טווח גובר על רושם רגעי חולף.'
        },
        {
          id: 'dc-1788601474607',
          title: 'עוצר לחשוב על טובת הילד, לא על הרצון שלך',
          tag: 'רגישות הורית',
          description: 'כשזה מגיע לילדים, אתה יודע לנטרל את השאיפות האישיות והתחרותיות שלך, ולשאול באמת מה בונה אצלם ביטחון ומה נכון להם.',
          caseTitle: 'עתידו הספורטיבי של איתן',
          caseId: 'dc-1788601474607',
          authenticDilemmaQuote: 'הכרעה לגבי עתידו הספורטיבי של איתן: התמדה בנבחרת הטיפוס מול מעבר לשחייה...',
          systemReflection: "הפרדת בין הצורך שלך לראות 'חוסן והתמדה' לבין הרצון הפנימי של איתן, ובחרת במענה חינוכי שמכבד את אישיותו."
        }
      ];

  const traps = (profileData?.traps && profileData.traps.length > 0)
    ? profileData.traps
    : [
        {
          id: 'dc-1788596360147',
          title: 'הפיתוי להישאר עם המוכר כדי לחסוך כאב ראש',
          tag: 'הנחה מוקדמת',
          description: 'לפעמים הנוחות של לעבוד עם מי שכבר נמצא בשטח גורמת לך להניח שהוא יצליח באותה מידה גם במשימה שונה לחלוטין (כמו להניח שקבלן שלד חזק יבריק גם בעבודות גמר עדינות).',
          caseTitle: 'קבלן שלד לעבודות הגמרים',
          caseId: 'dc-1788596360147',
          authenticAssumptionQuote: 'קבלן המצטיין בעבודות שלד מחזיק במיומנות הנדרשת גם לביצוע עבודות גמר מדויקות, והמשכיות תחסוך חיכוכים...',
          systemReflection: 'המערכת חידדה עבורך שמיומנות גמרים היא דיסציפלינה נפרדת, ודרשה לבחון תיק עבודות גמר ייעודי.'
        },
        {
          id: 'dc-1788942334803',
          title: 'תשלום מחיר גבוה מדי על ודאות מהירה',
          tag: 'פגיעה ברווחיות',
          description: 'כשחוסר הוודאות מעיק, יש אצלך לפעמים דחף "לקנות שקט" מהר מדי — למשל לחתוך מחירים מוקדם מהדרוש כדי להבטיח תזרים בטוח, עוד לפני שמיצית את בדיקת השוק.',
          caseTitle: 'הורדת מחירי דירות בקיטרוני',
          caseId: 'dc-1788942334803',
          authenticAssumptionQuote: 'האם להוריד את מחירי הדירות בקיטרוני וסלומון ב-100 עד 150 אלף ₪ לדירה ולהתקרב לדו"ח אפס כדי להבטיח תזרים מזומנים...',
          systemReflection: 'החידוד עזר להבין שוויתור גורף על רווח הוא מחיר גבוה מדי, ושיש לבחון חלופות ממוקדות יותר בזמן ובכמות הדירות.'
        },
        {
          id: 'dc-trap-options',
          title: 'עצירה באיסוף מידע כשיש יותר מדי אפשרויות',
          tag: 'בדיקת יתר',
          description: 'כשיש יותר משתיים-שלוש חלופות סבירות, קצב ההכרעה שלך מאט משמעותית. הרצון למפות כל פינה ולגדר כל תרחיש עלול לעכב את היציאה לביצוע.'
        }
      ];



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
