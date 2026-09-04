import { IAiProvider, EpistemicExtractionResult, ExtractedSignatureDTO } from '../provider.interface.js';
import { EPISTEMIC_EXTRACTION_SYSTEM_PROMPT } from '../../prompts/epistemic-extraction.prompt.js';

export class GeminiAiProvider implements IAiProvider {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.modelName = modelName;
  }

  async extractEpistemicSchema(rawText: string, activeEraContext?: string): Promise<EpistemicExtractionResult> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
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
