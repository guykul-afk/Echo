import { IAiProvider, EpistemicExtractionResult, ExtractedSignatureDTO } from '../provider.interface.js';
import { EPISTEMIC_EXTRACTION_SYSTEM_PROMPT } from '../../prompts/epistemic-extraction.prompt.js';
import { COGNITIVE_ENGINE_PROMPT, CognitiveAnalysisResult } from '../../prompts/cognitive-engine.prompt.js';

export class GeminiAiProvider implements IAiProvider {
  private apiKey: string;
  private transcribeModel: string;
  private cognitiveModel: string;

  constructor(
    apiKey?: string,
    cognitiveModel: string = process.env.COGNITIVE_MODEL || 'gemini-3.6',
    transcribeModel: string = process.env.TRANSCRIBE_MODEL || 'gemini-3.5-transcribe'
  ) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.cognitiveModel = cognitiveModel;
    this.transcribeModel = transcribeModel;
  }

  /**
   * Tier 1: Dedicated Transcribe (Verbatim Audio Speech-to-Text)
   */
  async transcribeAudio(audioBuffer: Buffer, mimeType: string = 'audio/mp3'): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.transcribeModel}:generateContent?key=${this.apiKey}`;
    const base64Audio = audioBuffer.toString('base64');

    const antiHallucinationPrompt = `תמלל אך ורק ובמדויק מילה-במילה (Verbatim) את המילים שנאמרו במפורש בעברית בקובץ הקול.
כללי ברזל מוחלטים למניעת הזיות (Strict Anti-Hallucination):
1. אסור בהחלט להמציא, לנחש, לשער, להשלים או להוסיף מילים או משפטים שלא נשמעו בבירור מוחלט.
2. אם ההקלטה שקטה, מכילה רעשי רקע, נשימות, מלמול בלתי מובן, או שלא ניתן להבין בוודאות מלאה דיבור ברור — השב אך ורק במילה אחת בדיוק: ריק
3. אל תוסיף שום הקדמה, ברכה, הערה או סיכום.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Audio
                }
              },
              {
                text: antiHallucinationPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.0,
          topP: 0.1
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Transcribe API error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const clean = rawText.replace(/[\s.,!?:;'"־\-`~()\[\]{}]+/g, '').trim();

    if (
      !rawText ||
      clean === '' ||
      clean === 'ריק' ||
      clean.toLowerCase() === 'empty' ||
      clean === 'לאברור' ||
      clean === 'לא_ברור' ||
      clean.toLowerCase() === 'unclear' ||
      clean.length < 3
    ) {
      return '';
    }

    return rawText;
  }

  /**
   * Tier 2: Cognitive Engine (4 Dimensions + Adaptive Intervention)
   */
  async extractEpistemicSchema(rawText: string, activeEraContext?: string): Promise<EpistemicExtractionResult> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.cognitiveModel}:generateContent?key=${this.apiKey}`;
    const userPrompt = `
Context / Operating Era: ${activeEraContext || 'Standard Operating Context'}
Raw Capture Input:
"""
${rawText}
"""
Extract the epistemic breakdown, decision signature, four human dimensions, and adaptive intervention question.
`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: EPISTEMIC_EXTRACTION_SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('No content returned from Gemini.');
    }

    return JSON.parse(candidateText) as EpistemicExtractionResult;
  }

  async extractCognitiveEngine(rawText: string): Promise<CognitiveAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.cognitiveModel}:generateContent?key=${this.apiKey}`;
    const userPrompt = `Raw capture: """${rawText}"""`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: COGNITIVE_ENGINE_PROMPT }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Cognitive API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('No content returned from Gemini Cognitive Engine.');
    }

    return JSON.parse(candidateText) as CognitiveAnalysisResult;
  }

  async generateStructuralEmbedding(signature: ExtractedSignatureDTO, _context: Record<string, any>): Promise<number[]> {
    if (!this.apiKey) {
      return [signature.commitmentGradient, signature.informationCostRatio, 0.5];
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`;
    const content = `Commitment: ${signature.commitmentGradient}, InfoCost: ${signature.informationCostRatio}, Tension: ${signature.principalAgentTension}, Tempo: ${signature.decisionTempo}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text: content }] }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Embedding error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding?.values || [];
  }
}
