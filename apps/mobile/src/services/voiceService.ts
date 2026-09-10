// Voice Capture & Transcription Service for Echo Mobile
// Supports Web Speech API (low latency Hebrew recognition) and MediaRecorder + Gemini fallback (for iOS Safari & cross-platform resilience)

declare global {
  interface Window {
    ENV_CONFIG?: {
      GEMINI_API_KEY?: string;
    };
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
    webkitAudioContext?: any;
  }
}

export function getActiveGeminiKey(): string {
  if (typeof window === 'undefined') return '';
  const envKey = window.ENV_CONFIG?.GEMINI_API_KEY?.trim();
  if (envKey && envKey.length > 10) return envKey;
  const localKey = localStorage.getItem('GEMINI_API_KEY')?.trim();
  if (localKey && localKey.length > 10) return localKey;
  try {
    return atob('QVEuQWI4Uk42SWRoT3YyQmt3d2VPM0hOaW96SGdPRm8yNU9XS2Vlb1JOQjRkQ1pvaEdIeWc=');
  } catch {
    return '';
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1];
      resolve(base64 || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function cleanExtractedTranscript(rawText: string): string {
  if (!rawText) return '';
  let text = rawText.trim();
  text = text.replace(/^```(?:json|text)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'string') return parsed.trim();
    if (parsed && typeof parsed === 'object') {
      const candidate = parsed.transcript || parsed.transcription || parsed.text || parsed.result || parsed.content;
      if (typeof candidate === 'string') return candidate.trim();
    }
  } catch {}

  const match = text.match(/"(?:transcript|transcription|text)":\s*"([^"]+)"/i);
  if (match && match[1]) return match[1].trim();

  if (text.startsWith('"') && text.endsWith('"') && text.length > 2) {
    text = text.slice(1, -1).trim();
  }
  return text;
}

export async function transcribeAudioWithGemini(audioBlob: Blob): Promise<string> {
  const apiKey = getActiveGeminiKey();
  if (!apiKey) {
    throw new Error('לא נמצא מפתח פעיל ל-Gemini');
  }

  const base64Audio = await blobToBase64(audioBlob);
  let mimeType = (audioBlob.type || '').split(';')[0];
  if (!mimeType || mimeType === 'application/octet-stream') {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    mimeType = isIOS ? 'audio/mp4' : 'audio/webm';
  }

  const prompt = `תמלל במדויק מילה-במילה (Verbatim) את כל מה שנאמר בעברית בקובץ השמע.
כללים:
1. שמר על סדר המילים המדויק, כולל מונחים טכניים/לועזיים, מספרים ושמות כפי שנאמרו.
2. אל תוסיף שום הקדמה, הסבר, מרכאות או תוספת שלא נאמרה בהקלטה.
3. רק אם הקובץ שקט לחלוטין ללא כל דיבור אנושי, החזר: ריק.`;

  const models = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType, data: base64Audio } },
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.0
          }
        })
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = cleanExtractedTranscript(text);
        if (cleaned && cleaned !== 'ריק' && cleaned.toLowerCase() !== 'empty' && !cleaned.includes('NO_SPEECH_DETECTED')) {
          return cleaned;
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[Gemini STT] Model ${model} returned ${res.status}:`, errText.slice(0, 120));
      }
    } catch (e: any) {
      lastError = e;
      console.warn(`[Gemini STT] Failed with ${model}:`, e.message);
    }
  }

  if (lastError) throw lastError;
  return '';
}
