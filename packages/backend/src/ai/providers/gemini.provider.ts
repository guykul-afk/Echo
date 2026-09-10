import { FiveHumanDimensions } from '@echo/shared';
import { IAiProvider, EpistemicExtractionResult, ExtractedSignatureDTO } from '../provider.interface.js';
import { EPISTEMIC_EXTRACTION_SYSTEM_PROMPT } from '../../prompts/epistemic-extraction.prompt.js';
import { COGNITIVE_ENGINE_PROMPT, CognitiveAnalysisResult } from '../../prompts/cognitive-engine.prompt.js';
import { DELTA_ENGINE_PROMPT, DeltaAnalysisResult } from '../../prompts/delta-engine.prompt.js';

function cleanAndParseJson<T>(raw: string): T {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch (err: any) {
    let sanitized = cleaned
      .replace(/([א-ת])"([א-ת])/g, '$1״$2')
      .replace(/([א-ת])"(\s)/g, '$1״$2')
      .replace(/,\s*([\]}])/g, '$1')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
    try {
      return JSON.parse(sanitized) as T;
    } catch (e2: any) {
      const firstBrace = sanitized.indexOf('{');
      const lastBrace = sanitized.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const sub = sanitized.slice(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(sub) as T;
        } catch (e3: any) {}
      }
      // If trailing unclosed brackets/braces
      try {
        return JSON.parse(sanitized + '"}') as T;
      } catch (e4: any) {}
      try {
        return JSON.parse(sanitized + '}') as T;
      } catch (e5: any) {}
      throw err;
    }
  }
}

export class GeminiAiProvider implements IAiProvider {
  private apiKey: string;
  private transcribeModel: string;
  private cognitiveModel: string;

  constructor(
    apiKey?: string,
    cognitiveModel: string = process.env.COGNITIVE_MODEL || 'gemini-3.6-flash',
    transcribeModel: string = process.env.TRANSCRIBE_MODEL || 'gemini-3.6-flash'
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

    const antiHallucinationPrompt = `תמלל אך ורק ובמדויק מילה-במילה (Verbatim) את כל מה שנאמר בעברית בקובץ הקול.
1. שמור על סדר המילים המדויק, כולל מונחים טכניים/לועזיים, שמות ומספרים כפי שנאמרו.
2. רק אם ההקלטה שקטה לחלוטין ללא כל דיבור אנושי, השב: ריק.
3. אל תוסיף שום הקדמה, מרכאות או סיכום.`;

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
          temperature: 0.0
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Transcribe API error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    
    // Unwrap any quotes or markdown
    rawText = rawText.replace(/^```(?:json|text)?\s*/i, '').replace(/\s*```$/, '').trim();
    if (rawText.startsWith('"') && rawText.endsWith('"') && rawText.length > 2) {
      rawText = rawText.slice(1, -1).trim();
    }

    const clean = rawText.replace(/[\s.,!?:;'"־\-`~()\[\]{}]+/g, '').trim();

    if (
      !rawText ||
      clean === '' ||
      clean === 'ריק' ||
      clean.toLowerCase() === 'empty' ||
      clean === 'לאברור' ||
      clean === 'לא_ברור' ||
      clean.toLowerCase() === 'unclear' ||
      clean.length < 2
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

    return cleanAndParseJson<EpistemicExtractionResult>(candidateText);
  }

  async extractCognitiveEngine(rawText: string, recentQuestions?: string[]): Promise<CognitiveAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.cognitiveModel}:generateContent?key=${this.apiKey}`;
    let userPrompt = `Raw capture: """${rawText}"""`;
    if (recentQuestions && recentQuestions.length > 0) {
      userPrompt += `\n\nRECENT INTERVENTIONS TO AVOID REPEATING (Anti-Repetition Negative Constraints):
The user was recently asked the following illumination questions in previous decisions:
${recentQuestions.map((q, i) => `${i + 1}. "${q}"`).join('\n')}
CRITICAL: DO NOT repeat these angles, tropes (e.g. freemium, binary dichotomy), or identical strategic questions. Pick a fresh angle or use 'no_intervention'.`;
    }

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

    return cleanAndParseJson<CognitiveAnalysisResult>(candidateText);
  }

  async extractDelta(
    rawCapture: string,
    humanDimensions: FiveHumanDimensions,
    illuminationQuestion: string,
    userAnswer: string,
    isSkip: boolean,
    historicalQuestion?: string
  ): Promise<DeltaAnalysisResult> {
    if (isSkip || !userAnswer || userAnswer.trim().length === 0 || userAnswer.includes('[דילוג') || userAnswer.includes('[נטישה')) {
      return {
        refinedInsight: null,
        userOwnershipVerified: false,
        changedAssumptions: [],
        newFacts: [],
        resolvedUnknowns: []
      };
    }

    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.cognitiveModel}:generateContent?key=${this.apiKey}`;
    const userPrompt = `
Original Raw Capture:
"""${rawCapture}"""

Initial Mirror Dimensions:
- Consideration: ${humanDimensions.consideration}
- Goals & Prices: ${humanDimensions.goalsPrices}
- Facts: ${humanDimensions.facts}
- Assumptions: ${humanDimensions.assumptions}
- Missing Info: ${humanDimensions.missingInfo}

Illumination Question:
"${illuminationQuestion}"
${historicalQuestion ? `\nHistorical Precedent Question Asked:\n"${historicalQuestion}"\n` : ''}
User's Response:
"""${userAnswer}"""
`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: DELTA_ENGINE_PROMPT }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Delta API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('No content returned from Gemini Delta Engine.');
    }

    const parsed = JSON.parse(candidateText);
    const hasDelta = parsed.hasDelta !== false && (parsed.now || parsed.chosenStep);

    return {
      refinedInsight: hasDelta ? {
        before: parsed.before || humanDimensions.consideration || rawCapture.slice(0, 80),
        now: parsed.now || userAnswer.slice(0, 80),
        chosenStep: parsed.chosenStep || ''
      } : null,
      userOwnershipVerified: Boolean(parsed.userOwnershipVerified && hasDelta),
      changedAssumptions: hasDelta && Array.isArray(parsed.changedAssumptions) ? parsed.changedAssumptions : [],
      newFacts: hasDelta && Array.isArray(parsed.newFacts) ? parsed.newFacts : [],
      resolvedUnknowns: hasDelta && Array.isArray(parsed.resolvedUnknowns) ? parsed.resolvedUnknowns : []
    };
  }

  async generateStructuralEmbedding(signature: ExtractedSignatureDTO, _context: Record<string, any>): Promise<number[]> {
    const commitment = signature?.commitmentGradient ?? 0.5;
    const infoCost = signature?.informationCostRatio ?? 0.5;
    const tension = signature?.principalAgentTension ?? 'sole_actor';
    const tempo = signature?.decisionTempo ?? 'tactical_weeks';

    if (!this.apiKey) {
      return [commitment, infoCost, 0.5];
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`;
      const content = `Commitment: ${commitment}, InfoCost: ${infoCost}, Tension: ${tension}, Tempo: ${tempo}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text: content }] }
        })
      });

      if (!response.ok) {
        return [signature.commitmentGradient, signature.informationCostRatio, 0.5];
      }

      const data = await response.json();
      return data.embedding?.values || [signature.commitmentGradient, signature.informationCostRatio, 0.5];
    } catch {
      return [signature.commitmentGradient, signature.informationCostRatio, 0.5];
    }
  }

  async generateSemanticEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      return [0.0, 0.0, 0.0];
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] }
        })
      });

      if (!response.ok) {
        console.warn(`[Gemini Embedding] Warning (${response.status}): using semantic vector fallback`);
        return [0.1, 0.2, 0.3];
      }

      const data = await response.json();
      return data.embedding?.values || [0.1, 0.2, 0.3];
    } catch (e: any) {
      console.warn(`[Gemini Embedding] Network/Parse fallback: ${e.message}`);
      return [0.1, 0.2, 0.3];
    }
  }
}
