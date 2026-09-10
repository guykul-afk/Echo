import React, { useState, useRef } from 'react';
import { LuxuryTheme } from '../theme/colors.js';
import { EchoOrb } from '../graphics/EchoOrb.js';
import { transcribeAudioWithGemini } from '../services/voiceService.js';

interface QuickCaptureScreenProps {
  onCaptureSubmit: (text: string, frictionLevel?: 'quick' | 'focused' | 'deep') => void;
  onOpenProfile?: () => void;
  isLoading?: boolean;
}

export const QuickCaptureScreen: React.FC<QuickCaptureScreenProps> = ({
  onCaptureSubmit,
  onOpenProfile,
  isLoading = false
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [frictionLevel] = useState<'quick' | 'focused' | 'deep'>('deep');
  const [recordHint, setRecordHint] = useState('גע בכדור להאזנה ולכידת מחשבה');

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechTextRef = useRef<string>('');

  const stopAllAudioSessions = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const handleToggleRecord = async () => {
    if (isRecording) {
      // User tapped to stop
      setIsRecording(false);
      setRecordHint('מעבד את ההקלטה...');
      stopAllAudioSessions();
      return;
    }

    // Start recording
    speechTextRef.current = '';
    audioChunksRef.current = [];
    setIsRecording(true);
    setRecordHint('מתחבר למיקרופון...');

    // 1. Start SpeechRecognition in parallel if available
    try {
      const SpeechRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.lang = 'he-IL';
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onresult = (event: any) => {
          let finalStr = '';
          let interimStr = '';
          for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalStr += event.results[i][0].transcript + ' ';
            else interimStr += event.results[i][0].transcript;
          }
          const spoken = (finalStr + ' ' + interimStr).trim();
          if (spoken) {
            speechTextRef.current = spoken;
            setInputText(spoken);
            setRecordHint(`מקשיב: « ${spoken.length > 30 ? '...' + spoken.slice(-30) : spoken} »`);
          }
        };

        rec.onerror = (err: any) => {
          console.warn('[WebSpeech] notice:', err.error);
        };

        rec.onend = () => {
          // Native ended
        };

        rec.start();
        recognitionRef.current = rec;
      }
    } catch (e) {
      console.warn('[WebSpeech] init exception:', e);
    }

    // 2. Start MediaRecorder for full cross-platform recording & Gemini fallback
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('דפדפן זה אינו תומך בהקלטת קול ישירה');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
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

        // Wait brief moment for speech recognition to finalize
        await new Promise(r => setTimeout(r, 200));

        const capturedVoice = speechTextRef.current.trim();
        if (capturedVoice && capturedVoice.length >= 2) {
          setInputText(capturedVoice);
          setRecordHint('ההקלטה נקלטה בהצלחה!');
          return;
        }

        // Speech recognition did not return text; fallback to Gemini STT
        if (audioBlob.size > 300) {
          setIsTranscribing(true);
          setRecordHint('מתמלל באמצעות מנוע קולי (Gemini)...');
          try {
            const transcript = await transcribeAudioWithGemini(audioBlob);
            if (transcript && transcript.length >= 2) {
              setInputText(transcript);
              setRecordHint('ההקלטה נקלטה בהצלחה!');
            } else {
              setRecordHint('לא זוהה דיבור ברור. ניתן להקליד ידנית');
            }
          } catch (err: any) {
            console.warn('[Gemini STT Fallback error]:', err);
            setRecordHint('לא נקלט מלל. אנא הקלד את ההחלטה בתיבה');
          } finally {
            setIsTranscribing(false);
          }
        } else {
          setRecordHint('לא נקלט דיבור בהקלטה (גע שוב לדבר בקול)');
        }
      };

      recorder.start(500);
      setRecordHint('מקליט ומקשיב... (גע שוב לסיום)');
    } catch (micErr: any) {
      console.warn('[Mic Error]:', micErr);
      setIsRecording(false);
      if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
        setRecordHint('נדרשת הרשאת מיקרופון בדפדפן (לחץ ואפשר גישה)');
      } else {
        setRecordHint('שגיאה בגישה למיקרופון. ניתן להקליד ידנית למטה');
      }
    }
  };

  const handleProceed = () => {
    if (inputText.trim()) {
      onCaptureSubmit(inputText, frictionLevel);
    }
  };

  return (
    <div className="flex-1 w-full px-4 sm:px-6 py-2 overflow-y-auto custom-scroll flex flex-col justify-between items-center text-center select-none" dir="rtl">
      
      {/* Top Section: Prominent Centered Brand Header directly above Orb */}
      <div className="w-full flex flex-col items-center justify-center pt-2 pb-1">
        <h1
          className="font-editorial text-4xl sm:text-5xl font-bold tracking-[0.28em] select-none pl-1 transition-all"
          style={{ color: LuxuryTheme.accent.gold }}
        >
          E C H O
        </h1>
        <p className="text-[12px] sm:text-xs opacity-70 tracking-widest mt-1 text-[#E6E8EE]">
          הזיכרון הלומד של שיקול הדעת
        </p>
      </div>

      {/* Center Echo Orb & Voice Status */}
      <div className="my-auto flex flex-col items-center justify-center py-2">
        <EchoOrb 
          isRecording={isRecording} 
          isProcessing={isLoading || isTranscribing} 
          size={250}
          onClick={handleToggleRecord}
        />
        <p
          className={`text-xs mt-3 tracking-wide transition-all font-light min-h-[20px] ${
            isRecording ? 'text-amber-300 animate-pulse font-medium' : 'opacity-80'
          }`}
          style={{ color: isRecording ? LuxuryTheme.accent.gold : LuxuryTheme.text.secondary }}
        >
          {recordHint}
        </p>
      </div>

      {/* Input Text Box & Action */}
      <div className="w-full space-y-3 pb-2 text-right">
        <div className="relative">
          <textarea
            rows={3}
            placeholder="או הקלד כאן: מה הדילמה והשיקולים שעומדים בפניך כרגע?"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="w-full p-3.5 rounded-2xl border bg-white/[0.03] text-xs text-right focus:outline-none resize-none placeholder:opacity-35 leading-relaxed transition-all"
            style={{ borderColor: LuxuryTheme.background.border, color: LuxuryTheme.text.primary }}
          />
        </div>

        <button
          type="button"
          disabled={!inputText.trim() || isLoading || isTranscribing}
          onClick={handleProceed}
          className={`w-full py-3.5 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
            !inputText.trim() || isLoading || isTranscribing
              ? 'opacity-30 border-white/10 bg-white/[0.02] cursor-not-allowed'
              : 'border-amber-400 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 active:scale-[0.98] shadow-lg'
          }`}
        >
          {isLoading || isTranscribing ? 'מקפיא ומחלץ סכמה אפיסטמית...' : 'הקפא והאר את ההחלטה ←'}
        </button>

        {onOpenProfile && (
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={onOpenProfile}
              className="text-[11px] opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer"
              style={{ color: LuxuryTheme.accent.gold }}
            >
              <span>מעבר ליומן החלטות ופרופיל כיול</span>
              <span>←</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
