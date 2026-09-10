import React, { useState, useRef } from 'react';
import { LuxuryTheme } from '../theme/colors';
import { DecisionCase, Option, DecisionSignature, RefinedInsight, FiveHumanDimensions, IlluminationQuestion } from '@echo/shared';
import { DecisionFlowPipeline } from '../graphics/DecisionFlowPipeline';
import { EchoPastCard } from '../components/EchoPastCard';
import { transcribeAudioWithGemini } from '../services/voiceService.js';

export interface DecisionSaveData {
  consideration: string;
  centralTension: string;
  goalsPrices: string;
  facts: string;
  assumptions: string;
  missingInfo: string;
  question: string;
  answer: string;
  conclusion: string;
  nextStep: string;
}

interface DecisionRoomScreenProps {
  decisionCase: DecisionCase;
  options?: Option[];
  signature?: DecisionSignature;
  illuminationQuestion?: string;
  bespokeQuestion?: IlluminationQuestion;
  historicalQuestion?: IlluminationQuestion;
  similarCaseAnalogy?: { title: string; reason: string; strength?: string; score?: number };
  initialRefinedInsight?: RefinedInsight;
  onAnswerSubmit: (answer: string, skip?: boolean) => void;
  onSaveDecision?: (data: DecisionSaveData) => void;
  onMirrorUpdate?: (updatedFields: FiveHumanDimensions) => void;
  onMirrorFeedback?: (feedback: 'accurate' | 'inaccurate') => void;
}

export const DecisionRoomScreen: React.FC<DecisionRoomScreenProps> = ({
  decisionCase,
  illuminationQuestion,
  bespokeQuestion,
  historicalQuestion,
  similarCaseAnalogy,
  initialRefinedInsight,
  onAnswerSubmit,
  onSaveDecision,
  onMirrorUpdate
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 5 Dimensions state
  const [consideration, setConsideration] = useState(decisionCase.dimConsideration || decisionCase.title);
  const [goalsPrices, setGoalsPrices] = useState(decisionCase.dimGoalsPrices || '');
  const [facts, setFacts] = useState(decisionCase.dimFacts || decisionCase.dimReliance || '');
  const [assumptions, setAssumptions] = useState(decisionCase.dimAssumptions || '');
  const [missingInfo, setMissingInfo] = useState(decisionCase.dimMissingInfo || decisionCase.dimUnknowns || '');

  const centralTension = decisionCase.centralTension || goalsPrices || 'השגת המטרה מול מחירים ואילוצים';
  const effectiveQuestion = bespokeQuestion?.questionText || illuminationQuestion || 'מהו הנתון היחיד שיכריע עבורך?';

  const [userAnswer, setUserAnswer] = useState('');
  const [activeRecordingField, setActiveRecordingField] = useState<string | null>(null);
  const [insight, setInsight] = useState<RefinedInsight | null>(initialRefinedInsight || null);
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const [isTranscribingField, setIsTranscribingField] = useState<string | null>(null);

  // Dual-engine Audio References
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechTextRef = useRef<string>('');

  const stopCurrentRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setActiveRecordingField(null);
  };

  const startVoiceInput = async (fieldKey: string, setter: (val: string) => void) => {
    if (activeRecordingField === fieldKey) {
      stopCurrentRecording();
      return;
    }

    if (activeRecordingField) {
      stopCurrentRecording();
    }

    setActiveRecordingField(fieldKey);
    speechTextRef.current = '';
    audioChunksRef.current = [];

    // 1. WebSpeech Engine
    try {
      const SpeechRec = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.lang = 'he-IL';
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (e: any) => {
          let full = '';
          for (let i = 0; i < e.results.length; ++i) {
            full += e.results[i][0].transcript + ' ';
          }
          const spoken = full.trim();
          if (spoken) {
            speechTextRef.current = spoken;
            setter(spoken);
          }
        };

        rec.onerror = (err: any) => {
          console.warn('[DecisionRoom WebSpeech Notice]:', err);
        };

        rec.onend = () => {};

        rec.start();
        recognitionRef.current = rec;
      }
    } catch (e) {
      console.warn('[DecisionRoom WebSpeech Init Error]:', e);
    }

    // 2. MediaRecorder + Gemini STT Engine
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        mediaStreamRef.current = stream;

        let mimeType = '';
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
          else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          else if (MediaRecorder.isTypeSupported('audio/aac')) mimeType = 'audio/aac';
        }

        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          const actualMime = recorder.mimeType || mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });

          await new Promise(r => setTimeout(r, 200));

          const capturedVoice = speechTextRef.current.trim();
          if (capturedVoice && capturedVoice.length >= 2) {
            setter(capturedVoice);
            return;
          }

          if (audioBlob.size > 300) {
            setIsTranscribingField(fieldKey);
            try {
              const transcript = await transcribeAudioWithGemini(audioBlob);
              if (transcript && transcript.length >= 2) {
                setter(transcript);
              }
            } catch (err) {
              console.warn('[DecisionRoom Gemini STT Fallback]:', err);
            } finally {
              setIsTranscribingField(null);
            }
          }
        };

        recorder.start(500);
      }
    } catch (micErr) {
      console.warn('[DecisionRoom Mic Access Error]:', micErr);
    }
  };

  const handleFieldChange = (field: 'consideration' | 'goalsPrices' | 'facts' | 'assumptions' | 'missingInfo', val: string) => {
    let nextConsideration = consideration;
    let nextGoalsPrices = goalsPrices;
    let nextFacts = facts;
    let nextAssumptions = assumptions;
    let nextMissingInfo = missingInfo;

    if (field === 'consideration') { nextConsideration = val; setConsideration(val); }
    if (field === 'goalsPrices') { nextGoalsPrices = val; setGoalsPrices(val); }
    if (field === 'facts') { nextFacts = val; setFacts(val); }
    if (field === 'assumptions') { nextAssumptions = val; setAssumptions(val); }
    if (field === 'missingInfo') { nextMissingInfo = val; setMissingInfo(val); }

    if (onMirrorUpdate) {
      onMirrorUpdate({
        consideration: nextConsideration,
        goalsPrices: nextGoalsPrices,
        facts: nextFacts,
        assumptions: nextAssumptions,
        missingInfo: nextMissingInfo,
        centralTension,
        keyHinge: nextMissingInfo,
        reliance: `${nextFacts} | ${nextAssumptions}`,
        unknowns: nextMissingInfo
      });
    }
  };

  const handleProceedWithAnswer = (answerText?: string) => {
    const finalAnswer = answerText !== undefined ? answerText : userAnswer;
    const effectiveAnswer = finalAnswer.trim() || 'המסקנה המרכזית הוגדרה';
    const refined: RefinedInsight = {
      before: consideration,
      now: effectiveAnswer,
      chosenStep: effectiveAnswer.slice(0, 80) || 'בירור מוקדם לפני הכרעה'
    };
    setInsight(refined);
    onAnswerSubmit(effectiveAnswer, false);
    setTimeout(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }, 150);
  };

  const handleSkip = () => {
    const refined: RefinedInsight = {
      before: consideration,
      now: consideration,
      chosenStep: 'בירור מוקדם לפני הכרעה'
    };
    setInsight(refined);
    setTimeout(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }, 150);
  };

  const handleSaveToJournal = () => {
    const currentAnswer = userAnswer.trim();
    const currentConclusion = insight?.now || currentAnswer || consideration;
    const currentNextStep = insight?.chosenStep || 'בירור מוקדם לפני הכרעה';

    if (onSaveDecision) {
      onSaveDecision({
        consideration,
        centralTension,
        goalsPrices,
        facts,
        assumptions,
        missingInfo,
        question: effectiveQuestion,
        answer: currentAnswer,
        conclusion: currentConclusion,
        nextStep: currentNextStep
      });
    } else {
      onAnswerSubmit(currentAnswer, false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 w-full max-w-[395px] mx-auto p-4 sm:p-5 overflow-y-auto custom-scroll text-right space-y-6"
      dir="rtl"
    >
      {/* ================= SECTION 1: Core Essence ================= */}
      <div className="space-y-4 pt-2">
        <h1 className="font-editorial text-2xl font-bold leading-tight" style={{ color: LuxuryTheme.text.primary }}>
          {consideration}
        </h1>

        <div className="p-3.5 rounded-2xl border bg-white/[0.03]" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
          <div className="flex justify-between items-center mb-1.5 text-xs">
            <span className="opacity-70">הניסוח שלך:</span>
            <button 
              type="button" 
              onClick={() => startVoiceInput('consideration', val => handleFieldChange('consideration', val))}
              className="text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              style={{ color: activeRecordingField === 'consideration' ? '#f43f5e' : LuxuryTheme.accent.gold }}
            >
              {activeRecordingField === 'consideration' ? '● מקשיב...' : (isTranscribingField === 'consideration' ? '⏳ מתמלל...' : '🎙️ עדכן')}
            </button>
          </div>
          <textarea
            rows={2}
            value={consideration}
            onChange={e => handleFieldChange('consideration', e.target.value)}
            className="w-full bg-transparent text-sm leading-relaxed focus:outline-none resize-none font-medium"
            style={{ color: LuxuryTheme.text.primary }}
          />
        </div>

        <div className="text-xs opacity-60">מה עומד מול מה? ערכים, מטרות ומחירים:</div>
        <div className="font-editorial text-lg italic pr-2 border-r-2" style={{ borderColor: LuxuryTheme.accent.gold, color: LuxuryTheme.accent.gold }}>
          "{centralTension}"
        </div>

        <div className="p-3.5 rounded-2xl border bg-white/[0.03]" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
          <div className="flex justify-between items-center mb-1.5 text-xs">
            <span className="opacity-70">מטרות ומחירים שחשובים לך:</span>
            <button 
              type="button" 
              onClick={() => startVoiceInput('goalsPrices', val => handleFieldChange('goalsPrices', val))}
              className="text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              style={{ color: activeRecordingField === 'goalsPrices' ? '#f43f5e' : LuxuryTheme.accent.gold }}
            >
              {activeRecordingField === 'goalsPrices' ? '● מקשיב...' : (isTranscribingField === 'goalsPrices' ? '⏳ מתמלל...' : '🎙️ עדכן')}
            </button>
          </div>
          <textarea
            rows={2}
            value={goalsPrices}
            onChange={e => handleFieldChange('goalsPrices', e.target.value)}
            placeholder="מה חשוב לך להשיג..."
            className="w-full bg-transparent text-xs leading-relaxed focus:outline-none resize-none placeholder:opacity-40"
            style={{ color: LuxuryTheme.text.primary }}
          />
        </div>
      </div>

      {/* ================= SECTION 2: Progressive Disclosure (Facts & Assumptions) ================= */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <button 
          type="button" 
          onClick={() => setIsContextExpanded(!isContextExpanded)}
          className="w-full p-3.5 flex justify-between items-center text-xs font-semibold cursor-pointer hover:bg-white/[0.02]"
          style={{ backgroundColor: 'rgba(212, 175, 55, 0.03)', color: LuxuryTheme.text.secondary }}
        >
          <span>נתוני רקע, הנחות ופערי מידע</span>
          <span style={{ color: LuxuryTheme.accent.gold }}>{isContextExpanded ? '▲' : '▼'}</span>
        </button>

        {isContextExpanded && (
          <div className="p-3.5 space-y-3 border-t border-white/5">
            <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(212, 175, 55, 0.35)', backgroundColor: 'rgba(212, 175, 55, 0.03)' }}>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-semibold" style={{ color: LuxuryTheme.accent.gold }}>עובדות מוצקות:</span>
                <button 
                  type="button" 
                  onClick={() => startVoiceInput('facts', val => handleFieldChange('facts', val))} 
                  className="text-[10px]"
                  style={{ color: activeRecordingField === 'facts' ? '#f43f5e' : LuxuryTheme.accent.gold }}
                >
                  {activeRecordingField === 'facts' ? '● מקשיב...' : '🎙️ עדכן'}
                </button>
              </div>
              <textarea
                rows={2}
                value={facts}
                onChange={e => handleFieldChange('facts', e.target.value)}
                placeholder="נתונים ועובדות..."
                className="w-full bg-transparent text-xs focus:outline-none resize-none placeholder:opacity-40"
              />
            </div>

            <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(212, 175, 55, 0.35)', backgroundColor: 'rgba(212, 175, 55, 0.03)' }}>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-semibold" style={{ color: LuxuryTheme.accent.gold }}>ההנחה שמובילה אותך:</span>
                <button 
                  type="button" 
                  onClick={() => startVoiceInput('assumptions', val => handleFieldChange('assumptions', val))} 
                  className="text-[10px]"
                  style={{ color: activeRecordingField === 'assumptions' ? '#f43f5e' : LuxuryTheme.accent.gold }}
                >
                  {activeRecordingField === 'assumptions' ? '● מקשיב...' : '🎙️ עדכן'}
                </button>
              </div>
              <textarea
                rows={2}
                value={assumptions}
                onChange={e => handleFieldChange('assumptions', e.target.value)}
                placeholder="השערות, ציפיות..."
                className="w-full bg-transparent text-xs focus:outline-none resize-none placeholder:opacity-40"
              />
            </div>

            <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(212, 175, 55, 0.35)', backgroundColor: 'rgba(212, 175, 55, 0.03)' }}>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-semibold" style={{ color: LuxuryTheme.accent.gold }}>פער המידע / ציר ההכרעה:</span>
                <button 
                  type="button" 
                  onClick={() => startVoiceInput('missingInfo', val => handleFieldChange('missingInfo', val))} 
                  className="text-[10px]"
                  style={{ color: activeRecordingField === 'missingInfo' ? '#f43f5e' : LuxuryTheme.accent.gold }}
                >
                  {activeRecordingField === 'missingInfo' ? '● מקשיב...' : '🎙️ עדכן'}
                </button>
              </div>
              <textarea
                rows={2}
                value={missingInfo}
                onChange={e => handleFieldChange('missingInfo', e.target.value)}
                placeholder="מה חסר לך כדי לדעת בוודאות..."
                className="w-full bg-transparent text-xs focus:outline-none resize-none placeholder:opacity-40"
              />
            </div>
          </div>
        )}
      </div>

      {/* ================= SECTION 3: Echo from the Past (EchoPastCard) ================= */}
      {(historicalQuestion || similarCaseAnalogy) && (
        <EchoPastCard
          title={similarCaseAnalogy?.title || 'תקדים עבר רלוונטי'}
          reason={similarCaseAnalogy?.reason || historicalQuestion?.questionText || ''}
          score={similarCaseAnalogy?.score ?? 0.85}
        />
      )}

      {/* ================= SECTION 4: Bespoke Question ================= */}
      <div className="p-4 rounded-2xl border space-y-3 text-center"
           style={{ backgroundColor: 'rgba(212, 175, 55, 0.04)', borderColor: 'rgba(212, 175, 55, 0.2)' }}>
        <div className="font-editorial text-lg font-semibold italic leading-snug px-2" style={{ color: LuxuryTheme.accent.gold }}>
          "{effectiveQuestion}"
        </div>

        <button
          type="button"
          onClick={() => startVoiceInput('answer', setUserAnswer)}
          className={`w-full py-3.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all ${
            activeRecordingField === 'answer' 
              ? 'border-rose-500 bg-rose-500/20 text-rose-200 animate-pulse' 
              : 'border-amber-400 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
          }`}
        >
          <span>
            {activeRecordingField === 'answer' 
              ? '● מקשיב... לחץ לסיום ההקלטה' 
              : (isTranscribingField === 'answer' ? '⏳ מתמלל תשובה בקול...' : '🎙️ הקלט תשובה בקול (דיבור חופשי)')}
          </span>
        </button>

        <textarea
          rows={2}
          placeholder="או הקלד תשובה ידנית..."
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          className="w-full p-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-xs text-right focus:outline-none resize-none placeholder:opacity-40"
          style={{ color: LuxuryTheme.text.primary }}
        />

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => handleProceedWithAnswer()}
            className="w-full py-3 rounded-xl border text-xs font-bold cursor-pointer transition-all active:scale-[0.98]"
            style={{ 
              borderColor: LuxuryTheme.accent.gold, 
              backgroundColor: 'rgba(212, 175, 55, 0.2)', 
              color: LuxuryTheme.text.primary 
            }}
          >
            המשך עם המענה ←
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs opacity-60 hover:opacity-100 underline cursor-pointer py-1 block mx-auto"
          >
            מספיק לי לעכשיו — המשך ללא מענה
          </button>
        </div>
      </div>

      {/* ================= SECTION 5: Summary ================= */}
      {insight && (
        <div className="pt-4 border-t border-white/10 space-y-3">
          <h2 className="font-editorial text-xl font-bold" style={{ color: LuxuryTheme.text.primary }}>
            שרשרת שיקול הדעת המזוקקת
          </h2>
          <p className="text-xs opacity-60">
            כל התהליך כפי שהתחדד מהדילמה ועד לצעד המעשי:
          </p>

          <DecisionFlowPipeline
            dilemma={consideration}
            goalsPrices={goalsPrices}
            facts={facts}
            assumptions={assumptions}
            question={effectiveQuestion}
            pastEcho={
              similarCaseAnalogy
                ? {
                    title: similarCaseAnalogy.title,
                    reason: similarCaseAnalogy.reason,
                    score: similarCaseAnalogy.score ?? 0.85
                  }
                : historicalQuestion
                ? {
                    title: 'תקדים עבר רלוונטי',
                    reason: historicalQuestion.questionText,
                    score: 0.85
                  }
                : null
            }
            answer={userAnswer.trim() || undefined}
            conclusion={insight.now || userAnswer.trim() || 'הבנת את גורם המפתח להכרעה'}
            nextStep={insight.chosenStep || 'בירור מוקדם לפני הכרעה'}
            scrollable={false}
          />

          <button 
            type="button"
            onClick={handleSaveToJournal}
            className="w-full py-3.5 rounded-xl border text-xs font-bold cursor-pointer active:scale-[0.98] mt-3"
            style={{ 
              borderColor: LuxuryTheme.accent.gold, 
              backgroundColor: 'rgba(212, 175, 55, 0.25)', 
              color: LuxuryTheme.text.primary 
            }}
          >
            שמור בזיכרון ההחלטות ←
          </button>
        </div>
      )}

      <div className="h-10" />
    </div>
  );
};

