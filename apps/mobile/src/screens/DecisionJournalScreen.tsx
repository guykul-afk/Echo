import React, { useState, useEffect } from 'react';
import { LuxuryTheme } from '../theme/colors.js';
import { syncUserDecisionsFromCloud, saveDecisionToCloud } from '../services/firestoreSync.js';
import { DecisionFlowPipeline } from '../graphics/DecisionFlowPipeline.js';
import { OutcomeModal } from './OutcomeModal.js';
import { QuickLoopStatus } from '@echo/shared';

interface DecisionJournalScreenProps {
  onBack: () => void;
  currentUserId: string;
  onDecisionUpdated?: () => void;
}

interface StoredDecision {
  id: string;
  title: string;
  frozenAt?: number;
  date?: string;
  consideration?: string;
  rawCaptureText?: string;
  rawVerbatim?: string;
  dimConsideration?: string;
  centralTension?: string;
  keyHinge?: string;
  insightBefore?: string;
  insightNow?: string;
  nextStep?: string;
  chosenNextStep?: string;
  insightChosenStep?: string;
  refinedAction?: string;
  actionAnswer?: string;
  userAnswer?: string;
  answer?: string;
  selectedCriterion?: string;
  assumptions?: string;
  dimAssumptions?: string;
  question?: string;
  goal?: string;
  dimGoalsPrices?: string;
  goalsPrices?: string;
  observations?: string;
  facts?: string;
  dimFacts?: string;
  dimReliance?: string;
  reliance?: string;
  dimUnknowns?: string;
  unknowns?: string;
  dimMissingInfo?: string;
  missingInfo?: string;
  contractCriterion?: string;
  conclusion?: string;
  proposedSteps?: string[];
  customCriterion?: string;
  pastEcho?: {
    title: string;
    reason: string;
    date?: string;
    score?: number;
    allRelatedEchoes?: any[];
    insightsSummary?: string;
  } | null;
  analogy?: {
    title: string;
    reason: string;
    score?: number;
  } | null;
  allRelatedEchoes?: any[];
  insightsSummary?: string;
  status?: string;
  sealed?: boolean;
  followUps?: Array<{
    timestamp: number;
    quickStatus?: string;
    realityText?: string;
    assumptionText?: string;
    processText?: string;
    text?: string;
  }>;
}

function cleanHtml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
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
  currentUserId,
  onDecisionUpdated
}) => {
  const [decisions, setDecisions] = useState<StoredDecision[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeOutcomeDecision, setActiveOutcomeDecision] = useState<StoredDecision | null>(null);

  const fetchAndSync = async (showLoading = true) => {
    if (showLoading) setIsSyncing(true);
    try {
      const list = await syncUserDecisionsFromCloud(currentUserId);
      if (list && list.length > 0) {
        setDecisions(list);
      }
    } catch (err) {
      console.warn('Sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOutcomeSubmit = async (outcome: {
    whatHappened: string;
    assumptionClarification: string;
    processReflection: string;
    quickStatus: QuickLoopStatus;
  }) => {
    if (!activeOutcomeDecision) return;
    const targetId = activeOutcomeDecision.id;
    const newFollowUp = {
      timestamp: Date.now(),
      quickStatus: outcome.quickStatus,
      realityText: outcome.whatHappened,
      assumptionText: outcome.assumptionClarification || '',
      processText: outcome.processReflection || ''
    };

    const updatedDecisions = decisions.map(d => {
      if (d.id === targetId) {
        const prevFollowUps = d.followUps || [];
        return {
          ...d,
          sealed: true,
          status: 'ביררתי (הושלם)',
          followUps: [...prevFollowUps, newFollowUp]
        };
      }
      return d;
    });

    setDecisions(updatedDecisions);
    setActiveOutcomeDecision(null);

    // Persist to localStorage
    try {
      const key = `echo_decisions_${currentUserId}`;
      localStorage.setItem(key, JSON.stringify(updatedDecisions));
      const isFounder = (
        currentUserId.toLowerCase().includes('guy') ||
        currentUserId.toLowerCase().includes('kuleski') ||
        currentUserId === 'Guy_Kuleski' ||
        currentUserId === 'guy_founder'
      );
      if (isFounder) {
        localStorage.setItem('echo_decisions_Guy_Kuleski', JSON.stringify(updatedDecisions));
        localStorage.setItem('echo_decisions_guy_kuleski', JSON.stringify(updatedDecisions));
        localStorage.setItem('echo_decisions_guy_founder', JSON.stringify(updatedDecisions));
      }
    } catch (e) {
      console.warn('Error saving outcome to localStorage:', e);
    }

    // Persist to Firestore
    const updatedDoc = updatedDecisions.find(d => d.id === targetId);
    if (updatedDoc) {
      saveDecisionToCloud(updatedDoc, currentUserId).catch(err => console.warn('Cloud sync error:', err));
    }

    if (onDecisionUpdated) {
      onDecisionUpdated();
    }
  };

  useEffect(() => {
    try {
      const key = `echo_decisions_${currentUserId}`;
      let saved = localStorage.getItem(key);
      if (!saved && (currentUserId.toLowerCase().includes('guy') || currentUserId.toLowerCase().includes('kuleski'))) {
        saved = localStorage.getItem('echo_decisions_Guy_Kuleski') || localStorage.getItem('echo_decisions_guy_founder');
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDecisions(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not load user decisions from localStorage', e);
    }

    fetchAndSync(decisions.length === 0);
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
          <div className="flex items-center justify-center gap-1.5 text-[10px] opacity-70">
            <span>{decisions.length} החלטות מתועדות</span>
            {isSyncing && <span className="text-amber-400 animate-pulse">(מסנכרן...)</span>}
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchAndSync(true)}
          disabled={isSyncing}
          className="text-[10px] px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer text-amber-200"
          title="סנכרן החלטות מענן Firestore"
        >
          {isSyncing ? '...' : 'סנכרן 🔄'}
        </button>
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
            const considerationText = cleanHtml(d.dimConsideration || d.consideration || d.rawVerbatim || d.rawCaptureText || d.goal) || '—';
            const nextStepText = cleanHtml(d.chosenNextStep || d.nextStep || d.insightChosenStep || d.refinedAction || d.actionAnswer || d.userAnswer || d.selectedCriterion) || '—';
            const beforeText = cleanHtml(d.insightBefore || d.assumptions) || '—';
            const nowText = cleanHtml(d.insightNow || d.question || d.keyHinge) || 'בדיקת הנחת הציר';
            const hasFollowUps = d.followUps && d.followUps.length > 0;
            const isSealed = d.sealed || hasFollowUps;

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
                    {isSealed ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] border text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                        {hasFollowUps ? 'ביררתי (הושלם)' : 'נחתם למעקב'}
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
                    {d.title || 'החלטה ללא כותרת'}
                  </h3>
                  <p className="text-[11px] font-light text-[#E6E8EE]/70 mt-1 line-clamp-2">
                    <span style={{ color: LuxuryTheme.accent.gold }}>אתה שוקל: </span>
                    {considerationText}
                  </p>
                </div>

                {/* Next Step / Conclusion Snippet */}
                <div className="p-2.5 rounded-xl bg-amber-400/[0.04] border border-amber-400/20 text-xs text-[#E6E8EE] space-y-1">
                  {beforeText !== '—' && (
                    <div className="text-[10px] opacity-70">
                      <span>קודם: </span>
                      <span>{beforeText}</span>
                    </div>
                  )}
                  <div className="text-[11px] text-emerald-300 font-medium pt-0.5">
                    <span>המסקנה: </span>
                    <span>{nowText}</span>
                  </div>
                  {nextStepText !== '—' && (
                    <div className="text-[10px] text-amber-200/90 pt-0.5">
                      <span>הצעד שנבחר: </span>
                      <span>{nextStepText}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Details: Full Decision Flow Pipeline & Results */}
                {isExpanded && (
                  <div className="pt-3 border-t space-y-3.5 text-xs font-light text-[#E6E8EE]/80" style={{ borderColor: LuxuryTheme.background.border }}>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-bold" style={{ color: LuxuryTheme.accent.gold }}>
                        שרשרת שיקול הדעת המלאה
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-medium border border-amber-500/20">
                        8 שלבי הכרעה
                      </span>
                    </div>

                    {(() => {
                      const effectiveEcho = (() => {
                        if (d.pastEcho && d.pastEcho.title && d.pastEcho.allRelatedEchoes && d.pastEcho.allRelatedEchoes.length > 0) {
                          return d.pastEcho;
                        }
                        if (d.pastEcho && d.pastEcho.title) {
                          return {
                            ...d.pastEcho
                          };
                        }
                        if (d.analogy && d.analogy.title) {
                          return {
                            title: d.analogy.title,
                            reason: d.analogy.reason,
                            score: d.analogy.score
                          };
                        }
                        return null;
                      })();

                      return (
                        <DecisionFlowPipeline
                          dilemma={cleanHtml(d.dimConsideration || d.consideration || d.rawVerbatim || d.rawCaptureText || d.title)}
                          goalsPrices={cleanHtml(d.dimGoalsPrices || d.goalsPrices || d.goal || d.centralTension)}
                          facts={cleanHtml(d.dimFacts || d.facts || d.observations)}
                          assumptions={cleanHtml(d.dimAssumptions || d.assumptions || d.dimReliance || d.reliance)}
                          question={cleanHtml(d.question || d.keyHinge)}
                          pastEcho={effectiveEcho}
                          answer={cleanHtml(d.userAnswer || d.actionAnswer || d.answer)}
                          proposedSteps={Array.isArray(d.proposedSteps) ? d.proposedSteps : undefined}
                          conclusion={cleanHtml(d.insightNow || d.contractCriterion || d.conclusion || d.selectedCriterion || 'בירור ממוקד של הנחת הציר')}
                          nextStep={cleanHtml(d.chosenNextStep || d.nextStep || d.insightChosenStep || d.refinedAction || 'יישום הצעד הנבחר')}
                          scrollable={false}
                        />
                      );
                    })()}

                    {/* Results Section (סגירת מעגל ותוצאות) */}
                    <div className="pt-3 border-t space-y-2.5" style={{ borderColor: LuxuryTheme.background.border }}>
                      {hasFollowUps && (
                        <div className="space-y-2">
                          <span className="text-[11px] block font-semibold text-emerald-300">תוצאות וסגירת מעגל ({d.followUps!.length}):</span>
                          {d.followUps!.map((fu, idx) => {
                            const statusText = fu.quickStatus === 'clarified' 
                              ? 'הסתדר מעולה ✓' 
                              : fu.quickStatus === 'succeeded_as_expected' 
                              ? 'התברר אחרת ⚡' 
                              : fu.quickStatus === 'not_yet' 
                              ? 'עדיין פתוח ⏳' 
                              : fu.quickStatus === 'irrelevant'
                              ? 'ירד מהפרק ✕'
                              : (fu.quickStatus || 'עודכן');
                            return (
                              <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] opacity-60">
                                  <span>{fu.timestamp ? new Date(fu.timestamp).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' }) : ''}</span>
                                  <span className="text-emerald-400 font-medium">{statusText}</span>
                                </div>
                                {fu.realityText && <p><strong className="opacity-60">מה קרה בפועל: </strong>{fu.realityText}</p>}
                                {fu.assumptionText && <p><strong className="opacity-60">לגבי ההנחה: </strong>{fu.assumptionText}</p>}
                                {fu.processText && <p><strong className="opacity-60">שינוי בתהליך: </strong>{fu.processText}</p>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* כפתור התוצאות בסוף */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveOutcomeDecision(d);
                        }}
                        className="w-full py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] shadow-md hover:brightness-110"
                        style={{
                          borderColor: hasFollowUps ? 'rgba(52, 211, 153, 0.4)' : LuxuryTheme.accent.gold,
                          backgroundColor: hasFollowUps ? 'rgba(16, 185, 129, 0.12)' : 'rgba(212, 175, 55, 0.15)',
                          color: hasFollowUps ? '#6ee7b7' : LuxuryTheme.accent.gold
                        }}
                      >
                        <span>{hasFollowUps ? '✏️ עדכן תוצאות ולמידה רציפה' : '🎯 הזן תוצאות ובדיקת מציאות'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-[11px] opacity-60 hover:opacity-100 transition-opacity pt-1">
                  <span className="text-amber-300 font-medium flex items-center gap-1">
                    <span>{isExpanded ? '▲ סגור תרשים החלטה' : '▼ פתח החלטה מלאה ותרשים זרימה'}</span>
                  </span>
                  <span className="text-[10px] opacity-40">
                    {isExpanded ? 'הסתר' : 'הצג הכל'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Outcome / Results Modal */}
      {activeOutcomeDecision && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-center items-center p-3">
          <div className="w-full max-w-[420px] max-h-[92vh] overflow-y-auto bg-[#07080B] rounded-3xl border border-[#202330] shadow-2xl p-2 flex flex-col">
            <OutcomeModal
              caseTitle={activeOutcomeDecision.dimConsideration || activeOutcomeDecision.consideration || activeOutcomeDecision.rawVerbatim || activeOutcomeDecision.title}
              nextStepChosen={activeOutcomeDecision.chosenNextStep || activeOutcomeDecision.nextStep || activeOutcomeDecision.insightChosenStep || activeOutcomeDecision.refinedAction}
              onSubmitOutcome={handleOutcomeSubmit}
              onCancel={() => setActiveOutcomeDecision(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
