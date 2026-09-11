import React, { useState } from 'react';
import { LuxuryTheme } from '../theme/colors.js';

interface DecisionProfileScreenProps {
  onBack: () => void;
  onOpenJournal?: (decisionId?: string) => void;
  capturesCount?: number;
  closuresCount?: number;
  currentUserId?: string;
}

export const DecisionProfileScreen: React.FC<DecisionProfileScreenProps> = ({
  onBack,
  capturesCount = 44,
}) => {
  const [expandedDecisionId, setExpandedDecisionId] = useState<string | null>(null);

  const toggleDecision = (id: string) => {
    setExpandedDecisionId(prev => (prev === id ? null : id));
  };

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
          <span>על בסיס {capturesCount} החלטות מתועדות</span>
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
          מחפש קרקע מוצקה לפני תנועה
        </h2>

        <p className="text-xs sm:text-sm text-[#E6E8EE]/85 leading-relaxed font-light">
          אתה אדם שמעריך יציבות ושקט נפשי. לפני שאתה יוצא לדרך, חשוב לך להבין בדיוק איפה אתה עומד. אתה מעדיף לוותר על הבטחה לרווח מהיר או הימור מפתה, העיקר לדעת שלא תופתע בהמשך. קשה מאוד לגרור אותך לפעול מתוך לחץ רגעי, ותמיד תעדיף לקחת צעד אחורה ולחשוב עוד רגע לפני שאתה חותך.
        </p>

        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#E6E8EE]/60">
          <span>
            הנטייה הבולטת: <strong className="text-[#E6E8EE]/90 font-medium">לקיחת אחריות אישית מלאה</strong>
          </span>
          <span className="text-[#D4AF37] font-medium">עקביות לאורך זמן</span>
        </div>
      </section>

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
          {/* Step 1 */}
          <div className="flex items-start gap-3.5 relative">
            <div className="w-8 h-8 rounded-full bg-[#07080B] border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-semibold flex items-center justify-center flex-shrink-0 z-10">
              01
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex-1">
              <h4 className="text-xs sm:text-sm font-semibold text-[#E6E8EE] mb-1">
                צלילה למספרים ולשטח
              </h4>
              <p className="text-xs text-[#E6E8EE]/70 font-light leading-relaxed">
                אתה לא מסתפק בהשערות או שמועות. ישר בודק עלויות, משווה ספקים, ומוודא שהנתונים מסתדרים במציאות.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3.5 relative">
            <div className="w-8 h-8 rounded-full bg-[#07080B] border border-white/20 text-[#E6E8EE]/70 text-xs font-semibold flex items-center justify-center flex-shrink-0 z-10">
              02
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex-1">
              <h4 className="text-xs sm:text-sm font-semibold text-[#E6E8EE] mb-1">
                בדיקת 'מה התרחיש הכי גרוע'
              </h4>
              <p className="text-xs text-[#E6E8EE]/70 font-light leading-relaxed">
                הדבר הראשון שמעסיק אותך הוא איפה הנפילה עלולה לקרות ואיך מונעים ממנה להשבית את כל הפרויקט.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3.5 relative">
            <div className="w-8 h-8 rounded-full bg-[#07080B] border border-white/20 text-[#E6E8EE]/70 text-xs font-semibold flex items-center justify-center flex-shrink-0 z-10">
              03
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex-1">
              <h4 className="text-xs sm:text-sm font-semibold text-[#E6E8EE] mb-1">
                בחינת המצפן הפנימי
              </h4>
              <p className="text-xs text-[#E6E8EE]/70 font-light leading-relaxed">
                אתה עוצר לבדוק האם זה יושב טוב עם הערכים שלך — למשל האם אתה גלוי והוגן מול השותפים והבנקים, או האם אתה קשוב למשפחה.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3.5 relative">
            <div
              className="w-8 h-8 rounded-full bg-[#07080B] border border-[#D4AF37] text-[#D4AF37] text-xs font-bold flex items-center justify-center flex-shrink-0 z-10"
              style={{ boxShadow: '0 0 12px rgba(212, 175, 55, 0.3)' }}
            >
              04
            </div>
            <div className="bg-[#D4AF37]/[0.04] border border-[#D4AF37]/20 rounded-xl p-3 flex-1">
              <h4 className="text-xs sm:text-sm font-semibold text-[#D4AF37] mb-1">
                חיתוך שקט והתקדמות
              </h4>
              <p className="text-xs text-[#E6E8EE]/80 font-light leading-relaxed">
                ברגע שקיבלת את ההחלטה, אתה הולך איתה עד הסוף. כמעט שלא רואים אצלך חרטות או זיגזוגים לאחור.
              </p>
            </div>
          </div>
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

        {/* Anchor 1: אספקת בטון */}
        <article className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#D4AF37]/30 transition-all space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] text-xs font-bold">
                ✓
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-[#E6E8EE]">
                לא קופץ למים בלי לבדוק שיש חלופה
              </h4>
            </div>
            <span className="text-[11px] text-[#D4AF37] font-medium bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/20">
              זהירות מבורכת
            </span>
          </div>
          <p className="text-xs text-[#E6E8EE]/70 font-light leading-relaxed">
            אתה לא מסתמך על הבטחה של ספק בודד אם יש ספק באמינות שלו, ומעדיף לפצל סיכונים מראש כדי שלא תיתקע באמצע הפרויקט.
          </p>

          <div className="pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[#E6E8EE]/50 flex items-center gap-1.5 truncate max-w-[240px]">
                <span>ראינו את זה ב:</span>
                <span className="text-[#E6E8EE]/80 font-medium">אספקת בטון לפרויקט קטרוני</span>
              </div>
              <button
                type="button"
                onClick={() => toggleDecision('dc-1788597346752')}
                className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{expandedDecisionId === 'dc-1788597346752' ? 'סגור פרטים' : 'מה קרה שם'}</span>
                <span>{expandedDecisionId === 'dc-1788597346752' ? '▲' : '←'}</span>
              </button>
            </div>

            {expandedDecisionId === 'dc-1788597346752' && (
              <div className="mt-2.5 p-3 rounded-xl bg-white/[0.02] border border-[#D4AF37]/20 text-xs space-y-1.5">
                <div className="font-medium text-[#D4AF37]">ההתלבטות האותנטית שלך:</div>
                <blockquote className="text-[#E6E8EE]/80 italic bg-[#07080B]/60 p-2 rounded-lg border-r-2 border-[#D4AF37]">
                  "ההחלטה היא האם לפצל את פרויקט קטרוני בין כמה ספקי בטון שיתנו גיבוי אחד לשני או להישאר עם ספק אחד שהאמינות אספקה שלו בינונית..."
                </blockquote>
                <div className="text-[11px] text-[#E6E8EE]/60 pt-1">
                  הגדרת השוואת עלות העיכוב מול מחיר הפיצול, ובכך מנעת השבתה פוטנציאלית של היציקות.
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Anchor 2: בנק הפועלים */}
        <article className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#D4AF37]/30 transition-all space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] text-xs font-bold">
                ✓
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-[#E6E8EE]">
                אומר את האמת על השולחן
              </h4>
            </div>
            <span className="text-[11px] text-[#D4AF37] font-medium bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/20">
              יושרה פנימית
            </span>
          </div>
          <p className="text-xs text-[#E6E8EE]/70 font-light leading-relaxed">
            גם בשיחות מורכבות מול גורמים שמחזיקים בכוח (כמו בנקאים או שותפים), אתה בוחר שקיפות מלאה על פני הצגת תמונה מייפה. זה יוצר אמון עמוק.
          </p>

          <div className="pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[#E6E8EE]/50 flex items-center gap-1.5 truncate max-w-[240px]">
                <span>ראינו את זה ב:</span>
                <span className="text-[#E6E8EE]/80 font-medium">שיחה עם בנק הפועלים</span>
              </div>
              <button
                type="button"
                onClick={() => toggleDecision('dc-1789034514046')}
                className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{expandedDecisionId === 'dc-1789034514046' ? 'סגור פרטים' : 'מה קרה שם'}</span>
                <span>{expandedDecisionId === 'dc-1789034514046' ? '▲' : '←'}</span>
              </button>
            </div>

            {expandedDecisionId === 'dc-1789034514046' && (
              <div className="mt-2.5 p-3 rounded-xl bg-white/[0.02] border border-[#D4AF37]/20 text-xs space-y-1.5">
                <div className="font-medium text-[#D4AF37]">ההתלבטות האותנטית שלך:</div>
                <blockquote className="text-[#E6E8EE]/80 italic bg-[#07080B]/60 p-2 rounded-lg border-r-2 border-[#D4AF37]">
                  "האם להיות גלוי לחלוטין לגבי מצב החברה, אתגריה והערכת השוק בשיחה הראשונה עם זיו מבנק הפועלים, או להציג תמונה אופטימית וורודה יותר..."
                </blockquote>
                <div className="text-[11px] text-[#E6E8EE]/60 pt-1">
                  הכרעת בעד גילוי מלא ואותנטי, מתוך הבנה שאמון מקצועי ארוך טווח גובר על רושם רגעי חולף.
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Anchor 3: איתן וספורט */}
        <article className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#D4AF37]/30 transition-all space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] text-xs font-bold">
                ✓
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-[#E6E8EE]">
                עוצר לחשוב על טובת הילד, לא על הרצון שלך
              </h4>
            </div>
            <span className="text-[11px] text-[#D4AF37] font-medium bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/20">
              רגישות הורית
            </span>
          </div>
          <p className="text-xs text-[#E6E8EE]/70 font-light leading-relaxed">
            כשזה מגיע לילדים, אתה יודע לנטרל את השאיפות האישיות והתחרותיות שלך, ולשאול באמת מה בונה אצלם ביטחון ומה נכון להם.
          </p>

          <div className="pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[#E6E8EE]/50 flex items-center gap-1.5 truncate max-w-[240px]">
                <span>ראינו את זה ב:</span>
                <span className="text-[#E6E8EE]/80 font-medium">עתידו הספורטיבי של איתן</span>
              </div>
              <button
                type="button"
                onClick={() => toggleDecision('dc-1788601474607')}
                className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{expandedDecisionId === 'dc-1788601474607' ? 'סגור פרטים' : 'מה קרה שם'}</span>
                <span>{expandedDecisionId === 'dc-1788601474607' ? '▲' : '←'}</span>
              </button>
            </div>

            {expandedDecisionId === 'dc-1788601474607' && (
              <div className="mt-2.5 p-3 rounded-xl bg-white/[0.02] border border-[#D4AF37]/20 text-xs space-y-1.5">
                <div className="font-medium text-[#D4AF37]">ההתלבטות האותנטית שלך:</div>
                <blockquote className="text-[#E6E8EE]/80 italic bg-[#07080B]/60 p-2 rounded-lg border-r-2 border-[#D4AF37]">
                  "הכרעה לגבי עתידו הספורטיבי של איתן: התמדה בנבחרת הטיפוס מול מעבר לשחייה..."
                </blockquote>
                <div className="text-[11px] text-[#E6E8EE]/60 pt-1">
                  הפרדת בין הצורך שלך לראות 'חוסן והתמדה' לבין הרצון הפנימי של איתן, ובחרת במענה חינוכי שמכבד את אישיותו.
                </div>
              </div>
            )}
          </div>
        </article>
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

        {/* Trap 1: קבלן שלד וגמר */}
        <article className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center text-[#E6E8EE]/80 text-xs font-bold">
                !
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-[#E6E8EE]">
                הפיתוי להישאר עם המוכר כדי לחסוך כאב ראש
              </h4>
            </div>
            <span className="text-[11px] text-[#E6E8EE]/60 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              הנחה מוקדמת
            </span>
          </div>
          <p className="text-xs text-[#E6E8EE]/70 font-light leading-relaxed">
            לפעמים הנוחות של לעבוד עם מי שכבר נמצא בשטח גורמת לך להניח שהוא יצליח באותה מידה גם במשימה שונה לחלוטין (כמו להניח שקבלן שלד חזק יבריק גם בעבודות גמר עדינות).
          </p>

          <div className="pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[#E6E8EE]/50 flex items-center gap-1.5 truncate max-w-[240px]">
                <span>התבטא ב:</span>
                <span className="text-[#E6E8EE]/80 font-medium">קבלן שלד לעבודות הגמרים</span>
              </div>
              <button
                type="button"
                onClick={() => toggleDecision('dc-1788596360147')}
                className="text-xs text-[#E6E8EE]/60 hover:text-[#D4AF37] flex items-center gap-1 cursor-pointer"
              >
                <span>{expandedDecisionId === 'dc-1788596360147' ? 'סגור פרטים' : 'בחינת ההנחה'}</span>
                <span>{expandedDecisionId === 'dc-1788596360147' ? '▲' : '←'}</span>
              </button>
            </div>

            {expandedDecisionId === 'dc-1788596360147' && (
              <div className="mt-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/15 text-xs space-y-1.5">
                <div className="font-medium text-[#E6E8EE]/90">ההנחה שעלתה בבדיקה:</div>
                <blockquote className="text-[#E6E8EE]/70 italic bg-[#07080B]/60 p-2 rounded-lg border-r-2 border-white/30">
                  "קבלן המצטיין בעבודות שלד מחזיק במיומנות הנדרשת גם לביצוע עבודות גמר מדויקות, והמשכיות תחסוך חיכוכים..."
                </blockquote>
                <div className="text-[11px] text-[#E6E8EE]/60 pt-1">
                  המערכת חידדה עבורך שמיומנות גמרים היא דיסציפלינה נפרדת, ודרשה לבחון תיק עבודות גמר ייעודי.
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Trap 2: מחירי דירות */}
        <article className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center text-[#E6E8EE]/80 text-xs font-bold">
                !
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-[#E6E8EE]">
                תשלום מחיר גבוה מדי על ודאות מהירה
              </h4>
            </div>
            <span className="text-[11px] text-[#E6E8EE]/60 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              פגיעה ברווחיות
            </span>
          </div>
          <p className="text-xs text-[#E6E8EE]/70 font-light leading-relaxed">
            כשחוסר הוודאות מעיק, יש אצלך לפעמים דחף "לקנות שקט" מהר מדי — למשל לחתוך מחירים מוקדם מהדרוש כדי להבטיח תזרים בטוח, עוד לפני שמיצית את בדיקת השוק.
          </p>

          <div className="pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[#E6E8EE]/50 flex items-center gap-1.5 truncate max-w-[240px]">
                <span>התבטא ב:</span>
                <span className="text-[#E6E8EE]/80 font-medium">הורדת מחירי דירות בקיטרוני</span>
              </div>
              <button
                type="button"
                onClick={() => toggleDecision('dc-1788942334803')}
                className="text-xs text-[#E6E8EE]/60 hover:text-[#D4AF37] flex items-center gap-1 cursor-pointer"
              >
                <span>{expandedDecisionId === 'dc-1788942334803' ? 'סגור פרטים' : 'בחינת ההנחה'}</span>
                <span>{expandedDecisionId === 'dc-1788942334803' ? '▲' : '←'}</span>
              </button>
            </div>

            {expandedDecisionId === 'dc-1788942334803' && (
              <div className="mt-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/15 text-xs space-y-1.5">
                <div className="font-medium text-[#E6E8EE]/90">ההתלבטות שנבדקה:</div>
                <blockquote className="text-[#E6E8EE]/70 italic bg-[#07080B]/60 p-2 rounded-lg border-r-2 border-white/30">
                  "האם להוריד את מחירי הדירות בקיטרוני וסלומון ב-100 עד 150 אלף ₪ לדירה ולהתקרב לדו"ח אפס כדי להבטיח תזרים מזומנים..."
                </blockquote>
                <div className="text-[11px] text-[#E6E8EE]/60 pt-1">
                  החידוד עזר להבין שוויתור גורף על רווח הוא מחיר גבוה מדי, ושיש לבחון חלופות ממוקדות יותר בזמן ובכמות הדירות.
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Trap 3: עודף אפשרויות */}
        <article className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center text-[#E6E8EE]/80 text-xs font-bold">
                !
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-[#E6E8EE]">
                עצירה באיסוף מידע כשיש יותר מדי אפשרויות
              </h4>
            </div>
            <span className="text-[11px] text-[#E6E8EE]/60 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              בדיקת יתר
            </span>
          </div>
          <p className="text-xs text-[#E6E8EE]/70 font-light leading-relaxed">
            כשיש יותר משתיים-שלוש חלופות סבירות, קצב ההכרעה שלך מאט משמעותית. הרצון למפות כל פינה ולגדר כל תרחיש עלול לעכב את היציאה לביצוע.
          </p>
        </article>
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
