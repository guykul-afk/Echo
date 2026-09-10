import React, { useState, useEffect } from 'react';
import { LuxuryTheme } from '../theme/colors.js';

interface DecisionJournalScreenProps {
  onBack: () => void;
  currentUserId: string;
}

interface StoredDecision {
  id: string;
  title: string;
  frozenAt?: number;
  date?: string;
  consideration?: string;
  rawCaptureText?: string;
  dimConsideration?: string;
  centralTension?: string;
  keyHinge?: string;
  insightBefore?: string;
  insightNow?: string;
  nextStep?: string;
  chosenNextStep?: string;
  status?: string;
  followUps?: Array<{
    timestamp: number;
    quickStatus?: string;
    realityText?: string;
    assumptionText?: string;
    processText?: string;
  }>;
}

const SEED_DECISIONS: StoredDecision[] = [
  {
    id: 'dc-seed-1',
    title: 'המשכיות עם קבלן השלד לעבודות הגמרים',
    date: 'אוגוסט 2026',
    frozenAt: 1787000000000,
    status: 'סגור ומיושם',
    dimConsideration: 'האם להמשיך עם קבלן השלד הנוכחי גם לעבודות הגמרים, או לפצל לקבלן ייעודי',
    centralTension: 'השלמת הפרויקט באיכות גבוהה תוך שמירה על יעילות תקציבית מול סכנת ליקויי גמר',
    keyHinge: 'בירור יכולת ופדנטיות בביצוע עבודות גמרים מורכבות',
    insightBefore: 'קבלן שלד טוב יבצע גם גמרים כראוי',
    insightNow: 'הפרדה מוחלטת בין שלד לגמרים בעקבות לקחי כנרת',
    chosenNextStep: 'קבלת 2 הצעות מחיר מקבלני גמר וביקור בדירות מאוכלסות',
    followUps: [
      {
        timestamp: 1787500000000,
        quickStatus: 'clarified',
        realityText: 'הפיצול לקבלן גמר ייעודי העלה מעט את התיאום, אך מנע ליקויים באריחים וחיפויים.',
        assumptionText: 'ההנחה שקבלן שלד יסתדר בגמרים הופרכה בסיור המקדים.',
        processText: 'היה נכון לפצל מראש ולא להמתין לשלב המתקדם של הפרויקט.'
      }
    ]
  },
  {
    id: 'dc-seed-2',
    title: 'בחירת אסטרטגיית אספקת בטון לפרויקט קטרוני',
    date: 'יולי 2026',
    frozenAt: 1785000000000,
    status: 'סגור ומיושם',
    dimConsideration: 'האם לפצל את אספקת הבטון בין כמה ספקים כגיבוי, או להישאר עם ספק בלעדי עם אמינות בינונית',
    centralTension: 'הבטחת רציפות יציקות מול עלויות פיצול',
    keyHinge: 'מחיר השבתת אתר ביום יציקה מול פרמיית גיבוי',
    insightBefore: 'ספק אחד זול יותר ומפשט חשבוניות',
    insightNow: 'פיצול 70/30 כביטוח שווה את הפרמיה',
    chosenNextStep: 'חתימת הסכם מסגרת עם ספק ראשי והסכם גיבוי'
  },
  {
    id: 'dc-seed-3',
    title: 'מעבר תפקיד ניהולי וזמינות בערבים',
    date: 'נובמבר 2024',
    frozenAt: 1732000000000,
    status: 'סגור ומיושם',
    dimConsideration: 'מעבר לתפקיד בכיר עם שכר משופר מול פגיעה בשעות הנוכחות בבית עם הילדים',
    centralTension: 'התקדמות מקצועית והכנסה מול נוכחות משפחתית',
    keyHinge: 'בירור ציפיות מוקדם של שעות העבודה בפועל לפני התחייבות',
    insightBefore: 'חשש כללי מפגיעה בזמן עם הילדים',
    insightNow: 'החשש מתמקד בזמינות שוטפת בערבים שטרם בוררה',
    chosenNextStep: 'שיחת בירור ישירה מול המנהל לפני מתן תשובה',
    followUps: [
      {
        timestamp: 1733000000000,
        quickStatus: 'clarified',
        realityText: 'התפקיד תובעני, אך שיחת הבירור מראש אפשרה לקבוע ערב אחד קבוע בלי עבודה.',
        assumptionText: 'ההנחה שהתפקיד בהכרח יפגע בכל הערבים נפתרה חלקית בזכות תיאום מוקדם.',
        processText: 'היה נכון לברר זאת בשלב מוקדם עוד יותר.'
      }
    ]
  }
];

export const DecisionJournalScreen: React.FC<DecisionJournalScreenProps> = ({
  onBack,
  currentUserId
}) => {
  const [decisions, setDecisions] = useState<StoredDecision[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const key = `echo_decisions_${currentUserId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDecisions(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load user decisions from localStorage', e);
    }
    setDecisions(SEED_DECISIONS);
  }, [currentUserId]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('האם למחוק החלטה זו מיומן ההחלטות?')) return;
    const updated = decisions.filter(d => d.id !== id);
    setDecisions(updated);
    try {
      localStorage.setItem(`echo_decisions_${currentUserId}`, JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="flex-1 w-full px-4 sm:px-6 py-4 overflow-y-auto custom-scroll flex flex-col select-none text-right" dir="rtl">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b pb-3 mb-4 shrink-0" style={{ borderColor: LuxuryTheme.background.border }}>
        <button
          type="button"
          onClick={onBack}
          className="text-xs px-3 py-1 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer flex items-center gap-1.5"
          style={{ color: LuxuryTheme.accent.gold }}
        >
          <span>→</span>
          <span>חזרה ללכידה</span>
        </button>

        <div className="text-center">
          <h2 className="font-editorial text-xl font-bold tracking-wider" style={{ color: LuxuryTheme.accent.gold }}>
            יומן החלטות
          </h2>
          <span className="text-[10px] opacity-60">
            {decisions.length} החלטות מתועדות בזיכרון
          </span>
        </div>

        <div className="w-16"></div>
      </div>

      {/* Decisions List */}
      {decisions.length === 0 ? (
        <div className="my-auto py-12 text-center rounded-2xl border bg-white/[0.02]" style={{ borderColor: LuxuryTheme.background.border }}>
          <p className="text-xs opacity-70">אין עדיין החלטות שמורות ביומן.</p>
          <p className="text-[10px] opacity-40 mt-1">הקלט או הקלד דילמה במסך הראשי כדי להתחיל.</p>
        </div>
      ) : (
        <div className="space-y-4 pb-6">
          {decisions.map((d) => {
            const isExpanded = expandedId === d.id;
            const dateStr = d.date || (d.frozenAt ? new Date(d.frozenAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' }) : '—');
            const considerationText = d.dimConsideration || d.consideration || d.rawCaptureText || '—';
            const nextStepText = d.chosenNextStep || d.nextStep || '—';
            const hasFollowUps = d.followUps && d.followUps.length > 0;

            return (
              <div
                key={d.id}
                onClick={() => setExpandedId(isExpanded ? null : d.id)}
                className="p-4 rounded-2xl border bg-white/[0.03] transition-all cursor-pointer hover:border-amber-400/40 shadow-lg space-y-3"
                style={{ borderColor: LuxuryTheme.background.border }}
              >
                {/* Card Header: Date, Status, Delete */}
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: LuxuryTheme.background.border }}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(d.id, e)}
                      className="text-[10px] px-2 py-0.5 rounded text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="מחק החלטה זו"
                    >
                      מחק
                    </button>
                    <span className="text-[10px] opacity-40 font-mono">{dateStr}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasFollowUps ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] border text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                        ביררתי (הושלם)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] border text-amber-300 border-amber-500/30 bg-amber-500/10">
                        {d.status || 'בבירור'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Consideration */}
                <div>
                  <h3 className="font-editorial text-sm font-bold text-[#E6E8EE]">
                    {d.title}
                  </h3>
                  <p className="text-[11px] font-light text-[#E6E8EE]/70 mt-1 line-clamp-2">
                    <span style={{ color: LuxuryTheme.accent.gold }}>אתה שוקל: </span>
                    {considerationText}
                  </p>
                </div>

                {/* Next Step / Conclusion Snippet */}
                <div className="p-2.5 rounded-xl bg-amber-400/[0.04] border border-amber-400/20 text-xs text-[#E6E8EE] space-y-1">
                  <div className="text-[10px] opacity-70">
                    <span>קודם: </span>
                    <span>{d.insightBefore || '—'}</span>
                  </div>
                  <div className="text-[11px] text-emerald-300 font-medium pt-0.5">
                    <span>המסקנה: </span>
                    <span>{d.insightNow || 'בדיקת הנחת הציר'}</span>
                  </div>
                  {nextStepText !== '—' && (
                    <div className="text-[10px] text-amber-200/90 pt-0.5">
                      <span>הצעד שנבחר: </span>
                      <span>{nextStepText}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-2 border-t space-y-2.5 text-xs font-light text-[#E6E8EE]/80" style={{ borderColor: LuxuryTheme.background.border }}>
                    {d.centralTension && (
                      <div>
                        <span className="text-[10px] block font-medium" style={{ color: LuxuryTheme.accent.gold }}>מתח מרכזי:</span>
                        <p className="text-[11px] opacity-90">{d.centralTension}</p>
                      </div>
                    )}
                    {d.keyHinge && (
                      <div>
                        <span className="text-[10px] block font-medium" style={{ color: LuxuryTheme.accent.gold }}>ציר ההכרעה:</span>
                        <p className="text-[11px] opacity-90">{d.keyHinge}</p>
                      </div>
                    )}

                    {/* Follow-ups */}
                    {hasFollowUps && (
                      <div className="mt-2 pt-2 border-t space-y-2" style={{ borderColor: LuxuryTheme.background.border }}>
                        <span className="text-[10px] block font-semibold text-emerald-300">סגירת מעגל ולמידה:</span>
                        {d.followUps!.map((fu, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-[11px] space-y-1">
                            {fu.realityText && <p><strong className="opacity-60">מה קרה בפועל: </strong>{fu.realityText}</p>}
                            {fu.assumptionText && <p><strong className="opacity-60">לגבי ההנחה: </strong>{fu.assumptionText}</p>}
                            {fu.processText && <p><strong className="opacity-60">שינוי בתהליך: </strong>{fu.processText}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end text-[10px] opacity-40 hover:opacity-80 transition-opacity">
                  <span>{isExpanded ? 'הסתר פירוט ↑' : 'לחץ להצגת פירוט מלא ↓'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
