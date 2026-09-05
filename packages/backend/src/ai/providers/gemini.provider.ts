import { IAiProvider, EpistemicExtractionResult, ExtractedSignatureDTO } from '../provider.interface.js';
import { EPISTEMIC_EXTRACTION_SYSTEM_PROMPT } from '../../prompts/epistemic-extraction.prompt.js';

export class GeminiAiProvider implements IAiProvider {
  private apiKey: string;
  private transcribeModel: string;
  private cognitiveModel: string;

  constructor(
    apiKey?: string,
    cognitiveModel: string = 'gemini-3.6',
    transcribeModel: string = 'gemini-3.5-transcribe'
  ) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.cognitiveModel = cognitiveModel;
    this.transcribeModel = transcribeModel;
  }

  /**
   * Tier 1: Model 3.5 Transcribe
   * High-fidelity verbatim audio transcription before cognitive parsing.
   */
  async transcribeAudio(audioBuffer: Buffer, mimeType: string = 'audio/mp3'): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.transcribeModel}:generateContent?key=${this.apiKey}`;
    const base64Audio = audioBuffer.toString('base64');

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
                text: 'תמלל את הדיבור הבא מילה-במילה (Verbatim). אל תוסיף הקדמות, אל תסכם, אל תערוך ואל תשמיט דבר. שמור על כל מונח מקצועי או לועזי במדויק.'
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.0
        }
      })
    });

    if (!response.ok) {
      // Graceful fallback to multi-modal flash if 3.5 preview tag is resolving
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
      const fbResponse = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType, data: base64Audio } },
                { text: 'תמלל את הדיבור הבא מילה-במילה (Verbatim) בדיוק מוחלט.' }
              ]
            }
          ],
          generationConfig: { temperature: 0.0 }
        })
      });

      if (!fbResponse.ok) {
        throw new Error(`Gemini Transcribe API error (${response.status}): ${await response.text()}`);
      }
      const fbData = await fbResponse.json();
      return fbData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }

  /**
   * Tier 2: Model 3.6 Cognitive Engine
   * Strictly parses frozen verbatim text into epistemic schema and one illumination question.
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
Extract the epistemic breakdown, decision signature, and the single illumination question.
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

  async generateStructuralEmbedding(signature: ExtractedSignatureDTO, context: Record<string, any>): Promise<number[]> {
    if (!this.apiKey) {
      // Fallback local vector
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
