import React, { useState, useRef } from 'react';
import { LuxuryTheme } from '../theme/colors';
import { DecisionCase, Option, DecisionSignature, RefinedInsight, FiveHumanDimensions, IlluminationQuestion } from '@echo/shared';
import { DecisionFlowPipeline } from '../graphics/DecisionFlowPipeline';
import { EchoPastCard } from '../components/EchoPastCard';
import { transcribeAudioWithGemini } from '../services/voiceService.js';
import { refineAnswerWithGemini } from '../services/aiService.js';

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
  proposedSteps: string[];
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
  initialProposedSteps?: string[];
  onAnswerSubmit: (answer: string, skip?: boolean) => void;
  onSaveDecision?: (data: DecisionSaveData) => void;
  onMirrorUpdate?: (updatedFields: FiveHumanDimensions) => void;
  onMirrorFeedback?: (feedback: 'accurate' | 'inaccurate') => void;
}

const formatToBulletLines = (val: string): string => {
  if (!val || !val.trim()) return '';
  const items = val
    .split(/\n| • | \u2022 /)
    .map(s => s.replace(/^[•\-\*\s]+/, '').trim())
    .filter(Boolean);
  if (items.length === 0) return val;
  return items.map(s => `• ${s}`).join('\n');
};

export const DecisionRoomScreen: React.FC<DecisionRoomScreenProps> = ({
  decisionCase,
  illuminationQuestion,
  bespokeQuestion,
  historicalQuestion,
  similarCaseAnalogy,
  initialRefinedInsight,
  initialProposedSteps,
  onAnswerSubmit,
  onSaveDecision,
  onMirrorUpdate,
  onMirrorFeedback
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 5 Dimensions state
  const [consideration, setConsideration] = useState(decisionCase.dimConsideration || decisionCase.title);
  const [goalsPrices, setGoalsPrices] = useState(decisionCase.dimGoalsPrices || '');
  const [facts, setFacts] = useState(() => formatToBulletLines(decisionCase.dimFacts || decisionCase.dimReliance || ''));
  const [assumptions, setAssumptions] = useState(() => formatToBulletLines(decisionCase.dimAssumptions || ''));
  const [missingInfo, setMissingInfo] = useState(decisionCase.dimMissingInfo || decisionCase.dimUnknowns || '');

  const centralTension = decisionCase.centralTension || goalsPrices || 'השגת המטרה מול מחירים ואילוצים';
  const effectiveQuestion = bespokeQuestion?.questionText || illuminationQuestion || 'מהו הנתון היחיד שיכריע עבורך?';

  const [userAnswer, setUserAnswer] = useState('');
  const [activeRecordingField, setActiveRecordingField] = useState<string | null>(null);
  const [insight, setInsight] = useState<RefinedInsight | null>(initialRefinedInsight || null);
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const [isTranscribingField, setIsTranscribingField] = useState<string | null>(null);
  const [proposedSteps, setProposedSteps] = useState<string[]>(initialProposedSteps || []);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(0);
  const [customStepText, setCustomStepText] = useState<string>('');
  const [isAnalyzingAnswer, setIsAnalyzingAnswer] = useState<boolean>(false);
  const [analysisErrorNotice, setAnalysisErrorNotice] = useState<string | null>(null);
  const [isDecisionSummarized, setIsDecisionSummarized] = useState<boolean>(false);

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

  const effectiveNextStep = customStepText.trim()
    ? customStepText.trim()
    : (selectedStepIndex !== null && proposedSteps[selectedStepIndex])
    ? proposedSteps[selectedStepIndex]
    : (insight?.chosenStep || 'בירור מוקדם לפני הכרעה');

  const handleAnalyzeAnswer = async (answerText?: string) => {
    const finalAnswer = answerText !== undefined ? answerText : userAnswer;
    if (!finalAnswer || !finalAnswer.trim()) {
      return;
    }
    const cleanAnswer = finalAnswer.trim();
    setUserAnswer(cleanAnswer);
    setIsAnalyzingAnswer(true);
    setAnalysisErrorNotice(null);

    try {
      const result = await refineAnswerWithGemini({
        dilemma: consideration,
        centralTension,
        goalsPrices,
        facts,
        assumptions,
        missingInfo,
        question: effectiveQuestion,
        answerText: cleanAnswer
      });

      const refined: RefinedInsight = {
        before: consideration,
        now: result.conclusion,
        chosenStep: result.chosenStep
      };
      setInsight(refined);
      setProposedSteps(result.proposedSteps);
      setSelectedStepIndex(0);
      setCustomStepText('');
      setIsDecisionSummarized(true);

      onAnswerSubmit(cleanAnswer, false);

      setTimeout(() => {
        containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      console.warn('[DecisionRoom Refine Answer Error]:', err);
      setAnalysisErrorNotice(err?.message || 'שגיאת תקשורת בניתוח המענה מול מנוע ה-AI. אנא נסה שוב.');
    } finally {
      setIsAnalyzingAnswer(false);
    }
  };

  const handleSkip = () => {
    const refined: RefinedInsight = {
      before: consideration,
      now: consideration,
      chosenStep: 'בירור מוקדם לפני הכרעה'
    };
    setInsight(refined);
    setIsDecisionSummarized(true);
    setTimeout(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }, 150);
  };

  const handleSaveToJournal = () => {
    const currentAnswer = userAnswer.trim();
    const currentConclusion = insight?.now || currentAnswer || consideration;
    const currentNextStep = effectiveNextStep;

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
        nextStep: currentNextStep,
        proposedSteps
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

      {/* ================= SECTION 2: Facts & Assumptions (Open with Bulleted Text) ================= */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden space-y-0">
        <div 
          className="w-full p-3.5 flex justify-between items-center text-xs font-semibold"
          style={{ backgroundColor: 'rgba(212, 175, 55, 0.04)', color: LuxuryTheme.accent.gold }}
        >
          <span className="font-bold flex items-center gap-1.5">
            <span>⚖️</span>
            <span>עובדות מוצקות והנחות מובילות</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
            תמונת מצב
          </span>
        </div>

        <div className="p-3.5 space-y-3 border-t border-white/5">
          {/* Solid Facts */}
          <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(212, 175, 55, 0.35)', backgroundColor: 'rgba(212, 175, 55, 0.03)' }}>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-semibold" style={{ color: LuxuryTheme.accent.gold }}>עובדות מוצקות (מבוססות ודאות):</span>
              <button 
                type="button" 
                onClick={() => startVoiceInput('facts', val => handleFieldChange('facts', formatToBulletLines(val)))} 
                className="text-[10px] cursor-pointer"
                style={{ color: activeRecordingField === 'facts' ? '#f43f5e' : LuxuryTheme.accent.gold }}
              >
                {activeRecordingField === 'facts' ? '● מקשיב...' : '🎙️ עדכן'}
              </button>
            </div>
            <textarea
              rows={Math.max(2, facts ? facts.split('\n').length : 2)}
              value={facts}
              onChange={e => handleFieldChange('facts', e.target.value)}
              onBlur={() => setFacts(prev => formatToBulletLines(prev))}
              placeholder="• נתונים ועובדות..."
              className="w-full bg-transparent text-xs text-stone-100 leading-relaxed focus:outline-none resize-none placeholder:opacity-40 font-light"
            />
          </div>

          {/* Guiding Assumptions */}
          <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(212, 175, 55, 0.35)', backgroundColor: 'rgba(212, 175, 55, 0.03)' }}>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-semibold" style={{ color: LuxuryTheme.accent.gold }}>ההנחות שמובילות אותך:</span>
              <button 
                type="button" 
                onClick={() => startVoiceInput('assumptions', val => handleFieldChange('assumptions', formatToBulletLines(val)))} 
                className="text-[10px] cursor-pointer"
                style={{ color: activeRecordingField === 'assumptions' ? '#f43f5e' : LuxuryTheme.accent.gold }}
              >
                {activeRecordingField === 'assumptions' ? '● מקשיב...' : '🎙️ עדכן'}
              </button>
            </div>
            <textarea
              rows={Math.max(2, assumptions ? assumptions.split('\n').length : 2)}
              value={assumptions}
              onChange={e => handleFieldChange('assumptions', e.target.value)}
              onBlur={() => setAssumptions(prev => formatToBulletLines(prev))}
              placeholder="• השערות, ציפיות..."
              className="w-full bg-transparent text-xs text-stone-100 leading-relaxed focus:outline-none resize-none placeholder:opacity-40 font-light"
            />
          </div>

          {/* Missing Info / Core Hinge */}
          <div className="p-3 rounded-xl border" style={{ borderColor: 'rgba(212, 175, 55, 0.35)', backgroundColor: 'rgba(212, 175, 55, 0.03)' }}>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-semibold" style={{ color: LuxuryTheme.accent.gold }}>פער המידע / ציר ההכרעה:</span>
              <button 
                type="button" 
                onClick={() => startVoiceInput('missingInfo', val => handleFieldChange('missingInfo', val))} 
                className="text-[10px] cursor-pointer"
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
              className="w-full bg-transparent text-xs text-stone-100 leading-relaxed focus:outline-none resize-none placeholder:opacity-40 font-light"
            />
          </div>
        </div>
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
            onClick={() => handleAnalyzeAnswer()}
            disabled={isAnalyzingAnswer}
            className="w-full py-3.5 rounded-xl border text-xs font-bold cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
            style={{ 
              borderColor: LuxuryTheme.accent.gold, 
              backgroundColor: isAnalyzingAnswer ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.25)', 
              color: LuxuryTheme.text.primary 
            }}
          >
            {isAnalyzingAnswer ? (
              <>
                <span className="animate-spin">⚙️</span>
                <span>מנתח ומזקק צעדי פעולה (Gemini)...</span>
              </>
            ) : (
              <span>שמור ונתח מענה ←</span>
            )}
          </button>

          {analysisErrorNotice && (
            <div className="text-[11px] text-rose-300 p-2 rounded-lg bg-rose-950/40 border border-rose-500/20 text-center">
              {analysisErrorNotice}
            </div>
          )}

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
      {isDecisionSummarized && insight && (
        <div className="pt-4 border-t border-white/10 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-editorial font-semibold tracking-widest text-amber-300">סיכום ההחלטה</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
                מסקנה וצעד מעשי
              </span>
            </div>
            <h2 className="font-editorial text-2xl font-bold" style={{ color: LuxuryTheme.text.primary }}>
              סיכום ההחלטה
            </h2>
            <p className="text-xs opacity-60">
              המסקנה המזוקקת והצעד המעשי שנקבע:
            </p>
          </div>

          {/* CARD 1: INSIGHT SUMMARY (נקודת מוצא מול מסקנה מזוקקת) */}
          <div 
            className="p-4 rounded-2xl border space-y-3.5 backdrop-blur-sm" 
            style={{ backgroundColor: 'rgba(212, 175, 55, 0.03)', borderColor: 'rgba(212, 175, 55, 0.25)' }}
          >
            {/* Before */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider opacity-60 text-stone-400">נקודת המוצא:</span>
              <p className="text-xs font-light text-stone-300 leading-relaxed italic">
                {insight.before || consideration}
              </p>
            </div>

            <div className="h-[1px] bg-white/5 w-full" />

            {/* Now */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-amber-300">המסקנה כעת:</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">מסקנה מזוקקת</span>
              </div>
              <p className="text-xs font-medium text-amber-100 leading-relaxed">
                {insight.now || 'בירור ממוקד של הנחת הציר'}
              </p>
            </div>
          </div>

          {/* Restored CARD: Proposed Steps Selection (פעולות מומלצות והגדרת הצעד הבא) */}
          <div 
            className="p-4 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'rgba(212, 175, 55, 0.03)', borderColor: 'rgba(212, 175, 55, 0.25)' }}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-amber-300">הצעד הבא שנבחר:</span>
              <span className="text-[9px] opacity-70 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-200">
                הצעת המערכת · ניתן לבחירה או עריכה
              </span>
            </div>
            
            <p className="text-[11px] opacity-75 leading-relaxed">
              בחר את הפעולה המומלצת המתאימה ביותר, או הגדר צעד משלך:
            </p>

            {/* Selectable Proposed Steps List */}
            {proposedSteps.length > 0 && (
              <div className="space-y-2 pt-1">
                {proposedSteps.map((stepText, idx) => {
                  const isSelected = selectedStepIndex === idx && !customStepText.trim();
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedStepIndex(idx);
                        setCustomStepText('');
                      }}
                      className={`w-full p-2.5 rounded-xl border text-right text-xs leading-relaxed flex items-start gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/20 text-white font-medium shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                          : 'border-white/10 bg-white/[0.02] text-stone-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-[9px] ${
                        isSelected ? 'border-amber-400 bg-amber-400 text-black font-bold' : 'border-white/30 text-transparent'
                      }`}>
                        ✓
                      </span>
                      <span className="flex-1">{stepText}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Custom User Step Input */}
            <div className="pt-2.5 border-t border-white/5 space-y-1.5">
              <label className="block text-[10px] text-amber-300/80">או הזן החלטה / צעד מותאם אישית משלך:</label>
              <input
                type="text"
                value={customStepText}
                onChange={e => setCustomStepText(e.target.value)}
                placeholder="הקלד כאן החלטה או צעד משלך (אופציונלי)..."
                className="w-full bg-white/[0.03] border border-amber-500/25 rounded-xl px-3 py-2 text-xs text-right text-stone-100 placeholder:opacity-40 focus:outline-none focus:border-amber-400 font-light"
              />
            </div>
          </div>

          <button 
            type="button"
            onClick={handleSaveToJournal}
            className="w-full py-3.5 rounded-xl border text-xs font-bold cursor-pointer active:scale-[0.98] mt-2 shadow-[0_0_25px_rgba(212,175,55,0.2)]"
            style={{ 
              borderColor: LuxuryTheme.accent.gold, 
              backgroundColor: 'rgba(212, 175, 55, 0.25)', 
              color: LuxuryTheme.text.primary 
            }}
          >
            שמור בזיכרון ההחלטות וחתום למעקב ←
          </button>

          {/* ================= שרשרת שיקול הדעת המלאה (רק לאחר סיכום ההחלטה) ================= */}
          <div className="pt-5 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold" style={{ color: LuxuryTheme.accent.gold }}>
                שרשרת שיקול הדעת המלאה
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-medium border border-amber-500/20">
                8 שלבי הכרעה
              </span>
            </div>
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
              proposedSteps={proposedSteps}
              conclusion={insight.now || 'הבנת את גורם המפתח להכרעה'}
              nextStep={effectiveNextStep}
              scrollable={false}
            />
          </div>
        </div>
      )}

      <div className="h-10" />
    </div>
  );
};

