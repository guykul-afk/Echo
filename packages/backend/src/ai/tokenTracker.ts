export interface TokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  callCount: number;
}

export interface CostSummary {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  totalCalls: number;
  costUSD: number;
  costILS: number;
  model: string;
}

export class TokenTracker {
  private static promptTokens = 0;
  private static candidatesTokens = 0;
  private static totalTokens = 0;
  private static callCount = 0;

  // Flash pricing (Gemini 1.5 / 2.0 / 2.5 / 3.x Flash standard tier):
  // Prompt input: $0.10 per 1M tokens
  // Candidate output: $0.40 per 1M tokens
  // USD to ILS conversion rate: 3.65
  static readonly PROMPT_COST_PER_MILLION_USD = 0.10;
  static readonly CANDIDATE_COST_PER_MILLION_USD = 0.40;
  static readonly USD_TO_ILS_RATE = 3.65;

  static recordUsage(usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }) {
    if (!usageMetadata) return;
    const p = usageMetadata.promptTokenCount || 0;
    const c = usageMetadata.candidatesTokenCount || 0;
    const t = usageMetadata.totalTokenCount || (p + c);

    this.promptTokens += p;
    this.candidatesTokens += c;
    this.totalTokens += t;
    this.callCount += 1;
  }

  static reset() {
    this.promptTokens = 0;
    this.candidatesTokens = 0;
    this.totalTokens = 0;
    this.callCount = 0;
  }

  static getSummary(modelName: string = 'gemini-3.6-flash'): CostSummary {
    const costUSD = (this.promptTokens / 1_000_000) * this.PROMPT_COST_PER_MILLION_USD +
                    (this.candidatesTokens / 1_000_000) * this.CANDIDATE_COST_PER_MILLION_USD;
    const costILS = costUSD * this.USD_TO_ILS_RATE;

    return {
      promptTokens: this.promptTokens,
      candidatesTokens: this.candidatesTokens,
      totalTokens: this.totalTokens,
      totalCalls: this.callCount,
      costUSD: Number(costUSD.toFixed(5)),
      costILS: Number(costILS.toFixed(4)),
      model: modelName
    };
  }

  static formatConsoleOutput(modelName: string = 'gemini-3.6-flash'): string {
    const s = this.getSummary(modelName);
    return [
      '================================================================================',
      '=== עלות הרצה וצריכת משאבים בפועל (Actual Run Cost & Token Usage) ===',
      '================================================================================',
      `• מודל בשימוש: ${s.model}`,
      `• סך קריאות API: ${s.totalCalls.toLocaleString()}`,
      `• סך טוקנים לקלט (Prompt Tokens): ${s.promptTokens.toLocaleString()}`,
      `• סך טוקנים לפלט (Candidates Tokens): ${s.candidatesTokens.toLocaleString()}`,
      `• סך כל הטוקנים (Total Tokens): ${s.totalTokens.toLocaleString()}`,
      `• עלות בפועל בדולר ($ USD): $${s.costUSD.toFixed(4)}`,
      `• עלות בפועל בש"ח (₪ ILS): ₪${s.costILS.toFixed(3)} (לפי שער 3.65)`,
      '================================================================================'
    ].join('\n');
  }

  static formatMarkdownTable(modelName: string = 'gemini-3.6-flash'): string {
    const s = this.getSummary(modelName);
    const thinkingTokens = s.totalTokens - (s.promptTokens + s.candidatesTokens);
    return `
## 5. עלות הרצה בפועל וצריכת משאבים (Token Usage & Financial Cost)

| מדד שימוש | ערך שנמדד | פירוט / הערות |
| :--- | :---: | :--- |
| **מודל בשימוש** | \`${s.model}\` | Tier: Google Gemini Flash |
| **סך קריאות API שבוצעו** | **${s.totalCalls.toLocaleString()}** | Capture + Illumination + Delta + Milestones + Persona |
| **טוקנים של קלט (Prompt Tokens)** | **${s.promptTokens.toLocaleString()}** | תעריף: $0.10 ל-1,000,000 טוקנים |
| **טוקנים של פלט (Completion Tokens)** | **${s.candidatesTokens.toLocaleString()}** | תעריף: $0.40 ל-1,000,000 טוקנים |
${thinkingTokens > 0 ? `| **טוקנים של חשיבה (Thinking/Cached)** | **${thinkingTokens.toLocaleString()}** | טוקנים מוסווים / מטמון שאינם מחויבים בעלות הפלט הרגילה |\n` : ''}| **סך כל הטוקנים (Total Tokens)** | **${s.totalTokens.toLocaleString()}** | נמדד ישירות מ-\`usageMetadata\` של גוגל |
| **עלות הרצה בדולר ($ USD)** | **$${s.costUSD.toFixed(4)}** | חישוב מדויק לפי מחירון רשמי |
| **עלות הרצה בשקלים (₪ ILS)** | **₪${s.costILS.toFixed(3)}** | שער המרה משוער 3.65 ש"ח לדולר |
`;
  }
}
