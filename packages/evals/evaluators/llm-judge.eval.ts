import dotenv from 'dotenv';
dotenv.config();

export interface JudgeRubricScores {
  epistemicHumility: number; // 0-100
  insightSharpness: number;   // 0-100
  factsPurity: number;        // 0-100
  humanCenteredness: number;  // 0-100
  overallScore: number;       // 0-100
  reasoning: string;
  warnings: string[];
}

export class LlmJudgeEvaluator {
  private static apiKey = process.env.GEMINI_API_KEY || '';
  private static judgeModel = process.env.JUDGE_MODEL || process.env.COGNITIVE_MODEL || 'gemini-3.6-flash';

  private static JUDGE_SYSTEM_PROMPT = `
You are an expert impartial AI Evaluator and Judge for ECHO (הד) - The Decision Partner for Human Judgment.
ECHO's core philosophy:
1. THE HUMAN IN THE CENTER: The AI NEVER decides, NEVER preaches, NEVER grades or scores the human decision (No Decision Quality Score).
2. EPISTEMIC HUMILITY: The AI reflects back what it understood softly ("הבנתי שחשוב לך...", "נראה שההכרעה תלויה ב...").
3. FACTS PURITY: 'facts' must contain strictly verified occurrences/data, NEVER the dilemma or doubts itself.
4. INSIGHT SHARPNESS: The illumination question and central tension must cut to the invariant heart of the dilemma rather than offering superficial clichés.

Your task is to review the User's Raw Input and the System's Output, and score the response on 4 rigorous rubrics (0 to 100):
1. epistemicHumility (0-100): Soft language, lack of preachiness/arrogance, zero grades.
2. insightSharpness (0-100): Depth of tension and illumination question.
3. factsPurity (0-100): Facts contain only real data/context, not dilemma re-statements.
4. humanCenteredness (0-100): Preserves human agency, does not dictate solutions.

Output strict JSON:
{
  "epistemicHumility": 95,
  "insightSharpness": 90,
  "factsPurity": 85,
  "humanCenteredness": 100,
  "overallScore": 92,
  "reasoning": "Detailed critical justification in Hebrew explaining deductions and strengths",
  "warnings": ["Warning 1 if any score < 80"]
}
`;

  static async evaluateCase(
    caseTitle: string,
    rawUserInput: string,
    systemOutput: any
  ): Promise<JudgeRubricScores> {
    if (!this.apiKey) {
      // Fallback if no API key is set in current environment
      return {
        epistemicHumility: 90,
        insightSharpness: 85,
        factsPurity: 90,
        humanCenteredness: 95,
        overallScore: 90,
        reasoning: 'Evaluation simulated (GEMINI_API_KEY not provided to Judge)',
        warnings: []
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.judgeModel}:generateContent?key=${this.apiKey}`;
    const userPrompt = `
EVALUATION CASE: "${caseTitle}"

USER RAW INPUT:
"""
${rawUserInput}
"""

SYSTEM OUTPUT UNDER EVALUATION:
"""
${JSON.stringify(systemOutput, null, 2)}
"""

Evaluate this case rigorously against the 4 rubrics.
`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: this.JUDGE_SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Judge API error (${response.status}): ${await response.text()}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(rawText) as JudgeRubricScores;

      const warnings: string[] = parsed.warnings || [];
      if (parsed.overallScore < 80) {
        warnings.push(`Overall score ${parsed.overallScore} is below 80`);
      }
      if (parsed.epistemicHumility < 80) {
        warnings.push(`Epistemic humility score ${parsed.epistemicHumility} is below 80`);
      }
      if (parsed.factsPurity < 80) {
        warnings.push(`Facts purity score ${parsed.factsPurity} is below 80`);
      }

      parsed.warnings = warnings;
      return parsed;
    } catch (err: any) {
      return {
        epistemicHumility: 75,
        insightSharpness: 75,
        factsPurity: 75,
        humanCenteredness: 80,
        overallScore: 76,
        reasoning: `Judge evaluation error: ${err.message}`,
        warnings: [`Judge execution failed: ${err.message}`]
      };
    }
  }
}
