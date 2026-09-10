import React, { useState } from 'react';
import { LuxuryTheme } from '../theme/colors.js';

interface DecisionProfileScreenProps {
  onBack: () => void;
  capturesCount?: number;
  closuresCount?: number;
  currentUserId?: string;
}

export const DecisionProfileScreen: React.FC<DecisionProfileScreenProps> = ({
  onBack,
  capturesCount = 39,
  closuresCount = 8
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(prev => (prev === id ? null : id));
  };

  const nextUpdateEventsRemaining = Math.max(1, 3 - Math.max(capturesCount % 3, closuresCount % 3));

  return (
    <div className="flex-1 w-full max-w-[420px] mx-auto p-4 sm:p-5 overflow-y-auto custom-scroll text-right space-y-5" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-center pt-2 pb-1 border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
        <button 
          onClick={onBack}
          className="text-xs px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] transition-all flex items-center gap-1 cursor-pointer"
          style={{ color: LuxuryTheme.text.primary }}
        >
          <span>→</span>
          <span>חזרה ללכידה</span>
        </button>

        <div className="text-right">
          <h2 className="font-editorial text-lg font-bold" style={{ color: LuxuryTheme.accent.gold }}>
            פרופיל כיול
          </h2>
          <p className="text-[11px] opacity-60">כיול אישי ואיכות שיקול דעת</p>
        </div>
      </div>

      {/* Hero Banner: חיווי עדכון מחזורי (טריגר כל 3 לכידות / סגירות) */}
      <div className="p-4 rounded-2xl border relative overflow-hidden" 
           style={{ backgroundColor: 'rgba(212, 175, 55, 0.04)', borderColor: 'rgba(212, 175, 55, 0.25)' }}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-bold tracking-wider" style={{ color: LuxuryTheme.accent.gold }}>
            סנכרון מחזור ההד הבא
          </span>
        </div>
        <p className="text-xs font-light opacity-80 mb-3 leading-relaxed">
          הפרופיל מתעדכן ומכייל את עצמו אוטומטית בכל 3 לכידות או 3 סגירות מעגל חדשות.
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-center my-2">
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="text-base font-bold" style={{ color: LuxuryTheme.accent.gold }}>{capturesCount % 3}/3</div>
            <div className="text-[10px] opacity-60">לכידות במחזור</div>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="text-base font-bold text-emerald-400">{closuresCount % 3}/3</div>
            <div className="text-[10px] opacity-60">סגירות מעגל</div>
          </div>
        </div>

        <div className="mt-2 text-[11px] font-medium p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200">
          💡 עוד {nextUpdateEventsRemaining} פעולות לחישוב מחדש של ההד שלך
        </div>
      </div>

      {/* 1. כרטיסיית "הדרך השלישית" (The Binary Trap & Synthesis) */}
      <div className="p-4 rounded-2xl border bg-white/[0.02] border-white/10 space-y-3">
        <div className="flex justify-between items-center">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
            דפוס קוגניטיבי מובהק
          </span>
          <h3 className="text-xs font-semibold" style={{ color: LuxuryTheme.text.primary }}>
            מלכודת הדיכוטומיה והדרך השלישית
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center py-1">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="text-lg font-bold text-amber-300">80%</div>
            <div className="text-[10px] opacity-70">ניסוח "או-או" בינארי ראשוני</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-lg font-bold text-emerald-400">75%</div>
            <div className="text-[10px] opacity-70">חילוץ "דרך שלישית" בהכרעה</div>
          </div>
        </div>

        <p className="text-xs font-light opacity-80 leading-relaxed">
          המוח שלך מציג דילמות כקונפליקט קוטבי ונוקשה. אולם לאחר שיקוף המראה, אתה מצטיין במציאת סינתזה יצירתית המפרקת את הקיטוב.
        </p>

        <button 
          type="button"
          onClick={() => toggleSection('binary_examples')}
          className="text-[11px] text-amber-400 hover:underline cursor-pointer pt-1 block"
        >
          {expandedSection === 'binary_examples' ? '▲ הסתר דוגמאות ממעגלי ההחלטה' : '▼ ראה דוגמאות מההיסטוריה שלך'}
        </button>

        {expandedSection === 'binary_examples' && (
          <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="font-semibold text-amber-200">דילמת בית הספר (נווה):</div>
              <div className="opacity-70">• דיכוטומיה ראשונית: רמה לימודית גבוהה בפרטי מול מענה חברתי באזורי.</div>
              <div className="text-emerald-400 font-medium">← הדרך השלישית: הישארות בבית הספר הפרטי + רישום לצופים ולחוגים.</div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="font-semibold text-amber-200">אימוני ספורט (איתן):</div>
              <div className="opacity-70">• דיכוטומיה ראשונית: כפיית טיפוס מול פרישה מיידית שמרגילה לוותר.</div>
              <div className="text-emerald-400 font-medium">← הדרך השלישית: פיילוט מותנה לשחייה עם התחייבות התמדה עד החגים.</div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="font-semibold text-amber-200">תמחור דירות (קטרוני וסלומון):</div>
              <div className="opacity-70">• דיכוטומיה ראשונית: הורדה גורפת של 150 אלף ₪ מול אי-ודאות תזרימית.</div>
              <div className="text-emerald-400 font-medium">← הדרך השלישית: מבצע מתוחם בזמן ל-2 דירות בלבד לשמירה על שאר הפרויקט.</div>
            </div>
          </div>
        )}
      </div>

      {/* 2. כרטיסיית "דיוק הנחות היסוד" (Assumption Calibration) */}
      <div className="p-4 rounded-2xl border bg-white/[0.02] border-white/10 space-y-3">
        <div className="flex justify-between items-center">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
            כיול הנחות עבודה
          </span>
          <h3 className="text-xs font-semibold" style={{ color: LuxuryTheme.text.primary }}>
            התממשות הנחות מול המציאות
          </h3>
        </div>

        <p className="text-xs font-light opacity-80 leading-relaxed">
          שיעור הדיוק של הנחות היסוד שהקפאת בזמן קבלת ההחלטה, בפילוח לפי תחומי פעילות:
        </p>

        {/* תחום 1: נדל"ן וביצוע */}
        <div className="space-y-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-400">88% דיוק</span>
            <span className="font-medium">הנדסה, עלויות ביצוע ולוחות זמנים</span>
          </div>
          <p className="text-[11px] opacity-60">הערכות מקצועיות יציבות ביותר; ספי הסיכון מדויקים.</p>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: '88%' }}></div>
          </div>
        </div>

        {/* תחום 2: דינמיקה אנושית ויחסי עבודה */}
        <div className="space-y-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-amber-400">58% דיוק</span>
            <span className="font-medium">גורם אנושי, יחסי עבודה ושותפים</span>
          </div>
          <p className="text-[11px] opacity-60">פער חוזר בהערכת תגובות רגשיות או נכונות דיירים לשתף פעולה.</p>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: '58%' }}></div>
          </div>
        </div>

        {/* תחום 3: תגובת שוק וביקושים */}
        <div className="space-y-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-sky-400">72% דיוק</span>
            <span className="font-medium">סנטימנט שוק וקצב התאוששות</span>
          </div>
          <p className="text-[11px] opacity-60">נטייה זהירה המגדרת תרחישי קיצון בצורה אפקטיבית.</p>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-sky-400 rounded-full" style={{ width: '72%' }}></div>
          </div>
        </div>
      </div>

      {/* 3. כרטיסיית "אסימטריית סיכון: ממון מול גוף" */}
      <div className="p-4 rounded-2xl border bg-white/[0.02] border-white/10 space-y-3">
        <div className="flex justify-between items-center">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
            פער סומטי מול פיננסי
          </span>
          <h3 className="text-xs font-semibold" style={{ color: LuxuryTheme.text.primary }}>
            מאזן תעוזה ושמרנות
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] space-y-1.5">
            <div className="font-bold flex items-center justify-between">
              <span>💼 החלטות ממון ועסקים</span>
              <span className="text-[10px] text-sky-300 font-normal">🛡️ שמרנות קיצונית</span>
            </div>
            <div className="text-[11px] opacity-80 leading-relaxed space-y-1">
              <div>• היצמדות קשיחה לדו"ח אפס</div>
              <div>• דאגה עמוקה לתזרים מזומנים</div>
              <div>• פיצול ספקים למניעת תלות יחידה</div>
              <div>• שנאת תרחישי קיצון</div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] space-y-1.5">
            <div className="font-bold flex items-center justify-between">
              <span>🏄‍♂️ גוף, ספורט ובריאות</span>
              <span className="text-[10px] text-amber-300 font-normal">⚡ תעוזה וסיכון</span>
            </div>
            <div className="text-[11px] opacity-80 leading-relaxed space-y-1">
              <div>• גלישה בכנרת תחת אזהרת זיהום</div>
              <div>• חזרה לריצה מול פציעת גב פעילה</div>
              <div>• בחירת גלשן רמה מעל הרמה שלך</div>
              <div>• דחיית סמנים סומטיים של שחיקה</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. בריאות סגירת המעגלים */}
      <div className="p-4 rounded-2xl border bg-white/[0.02] border-white/10 space-y-3">
        <div className="flex justify-between items-center">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
            לולאת למידה
          </span>
          <h3 className="text-xs font-semibold" style={{ color: LuxuryTheme.text.primary }}>
            בריאות סגירת המעגלים
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-center py-1">
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-sm font-bold text-purple-300">{capturesCount}</div>
            <div className="text-[9px] opacity-60">החלטות</div>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-sm font-bold text-amber-300">26</div>
            <div className="text-[9px] opacity-60">חוזים</div>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-sm font-bold text-emerald-400">{closuresCount}</div>
            <div className="text-[9px] opacity-60">נסגרו</div>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-sm font-bold text-rose-400">18</div>
            <div className="text-[9px] opacity-60">ממתינים</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] text-xs space-y-1">
          <div className="font-bold text-amber-200">⚠️ תובנה על חלונות הזמן שלך:</div>
          <p className="text-[11px] opacity-80 leading-relaxed">
            קבעת חלונות ביקורת קצרים של 3–7 ימים גם עבור תהליכים מורכבים. מומלץ להאריך את חלון הביקורת ל-30–60 יום לקבלת משוב מהימן.
          </p>
        </div>
      </div>

    </div>
  );
};
