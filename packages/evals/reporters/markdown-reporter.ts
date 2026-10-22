import fs from 'fs';
import path from 'path';

export interface CaseEvalReportEntry {
  caseId: string;
  title: string;
  domain: string;
  frictionLevel: string;
  userGender: string;
  rawInput: string;
  systemOutput: any;
  deterministicResult: {
    passed: boolean;
    score: number;
    failures: string[];
  };
  judgeResult?: {
    epistemicHumility: number;
    insightSharpness: number;
    factsPurity: number;
    humanCenteredness: number;
    overallScore: number;
    reasoning: string;
    warnings: string[];
  };
}

export interface RetrievalReportEntry {
  pairId: string;
  description: string;
  relevanceScore: number;
  strength: string;
  reason: string;
  spuriousCollisionAvoided: boolean;
}

export class MarkdownReporter {
  static generateReport(
    cases: CaseEvalReportEntry[],
    retrievalPairs: RetrievalReportEntry[],
    durationSeconds: number
  ): string {
    const totalCases = cases.length;
    const passedDeterministic = cases.filter(c => c.deterministicResult.passed).length;
    const totalWarnings = cases.reduce((acc, c) => acc + (c.judgeResult?.warnings.length || 0), 0);
    
    const avgJudgeScore = cases.filter(c => c.judgeResult).length > 0
      ? Math.round(cases.reduce((acc, c) => acc + (c.judgeResult?.overallScore || 0), 0) / cases.filter(c => c.judgeResult).length)
      : 0;

    let md = `# דוח הערכות איכות ומניעת רגרסיה — ECHO EVALS SUITE
**תאריך ריצה:** ${new Date().toISOString()} | **משך ריצה:** ${durationSeconds.toFixed(1)} שניות  
**פילוסופיית בדיקה:** Zero-Trust Deep Verification (חובת צלילה לתמלילי אמת)

---

## 1. סיכום ביצועים כולל (Executive Summary)

| מדד | תוצאה | סטטוס |
| :--- | :--- | :--- |
| **סך כל המקרים שנבדקו** | ${totalCases} | הושלם |
| **מעבר בדיקות דטרמיניסטיות וסכמה** | ${passedDeterministic} / ${totalCases} | ${passedDeterministic === totalCases ? '✅ 100%' : '⚠️ נדרשת בדיקה'} |
| **מניעת צימוד כוזב (Spurious Collisions)** | ${retrievalPairs.filter(p => p.spuriousCollisionAvoided).length} / ${retrievalPairs.length} | ${retrievalPairs.every(p => p.spuriousCollisionAvoided) ? '✅ 100% תקין' : '❌ כשל צימוד'} |
| **ציון ממוצע שופט מודל (Gemini Flash Judge)** | ${avgJudgeScore} / 100 | ${avgJudgeScore >= 85 ? '🌟 מצוין' : '⚠️ אזהרות פתוחות'} |
| **התראות פתוחות (Warning Mode)** | ${totalWarnings} | ${totalWarnings === 0 ? 'אין' : 'התראות ללא חסימה'} |

---

## 2. מניעת צימוד כוזב (Spurious Collision & Retrieval Hygiene)

> [!NOTE]
> בדיקה זו מוודאת ששליפת תקדימי עבר נשענת על המתח המבני-ערכי של הדילמה, ולא על מילות מפתח טכניות שטחיות.

| מזהה צמד | תיאור | ציון דמיון | חוזק אנלוגיה | תוצאה |
| :--- | :--- | :--- | :--- | :--- |
`;

    for (const p of retrievalPairs) {
      md += `| \`${p.pairId}\` | ${p.description} | ${(p.relevanceScore * 100).toFixed(1)}% | ${p.strength} | ${p.spuriousCollisionAvoided ? '✅ נמנע צימוד כוזב' : '❌ זוהה צימוד שגוי'} |\n`;
    }

    md += `\n---\n\n## 3. תמלילי אמת מפורטים (Zero-Trust Raw Transcripts)\n\n`;
    md += `> [!IMPORTANT]\n> בהתאם לעקרון ה-Zero-Trust, להלן תמלילי הקלט והפלט המלאים עבור כל מקרה שנבדק, כולל נימוק השופט והערות מגדריות.\n\n`;

    for (const [index, c] of cases.entries()) {
      const hd = c.systemOutput?.humanDimensions || {};
      const judge = c.judgeResult;

      md += `### מקרה #${index + 1}: ${c.title} (\`${c.caseId}\`)
* **תחום:** ${c.domain} | **רמת חיכוך:** ${c.frictionLevel} | **מגדר משתמש/ת:** ${c.userGender}
* **סטטוס דטרמיניסטי:** ${c.deterministicResult.passed ? '✅ עבר' : '❌ נכשל (' + c.deterministicResult.failures.join(', ') + ')'}
${judge ? `* **ציוני שופט (Flash Judge):** ענווה אפיסטמית: ${judge.epistemicHumility} | חדות תובנה: ${judge.insightSharpness} | טוהר עובדות: ${judge.factsPurity} | ציון משוקלל: **${judge.overallScore}**` : ''}

**קלט גולמי של המשתמש (Raw Input):**
> "${c.rawInput}"

**פלט המערכת (System Output Breakdown):**
* **מה עומד על הפרק (Consideration):** ${hd.consideration || 'לא חולץ'}
* **מתח מרכזי (Central Tension):** ${hd.centralTension || 'לא חולץ'}
* **ציר הכרעה (Key Hinge):** ${hd.keyHinge || 'לא חולץ'}
* **מטרות ומחירים (Goals & Prices):** ${hd.goalsPrices || 'לא חולץ'}
* **עובדות קשיחות (Facts Purity):** ${hd.facts || 'לא חולץ'}
* **הנחות מרכזיות (Assumptions):** ${hd.assumptions || 'לא חולץ'}
* **מידע חסר להכרעה (Missing Info):** ${hd.missingInfo || 'לא חולץ'}
* **שאלת הארה חדה (Illumination Question):** ${c.systemOutput?.bespokeQuestion?.questionText || c.systemOutput?.illuminationQuestion || 'ללא התערבות'}

${judge ? `**נימוק השופט (Judge Reasoning):**\n> ${judge.reasoning}\n` : ''}
${judge && judge.warnings.length > 0 ? `> [!WARNING]\n> ${judge.warnings.join('\n> ')}\n` : ''}

---
`;
    }

    return md;
  }

  static saveReportToFile(reportContent: string, outputDir: string): string {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const filename = `eval-report-${Date.now()}.md`;
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, reportContent, 'utf-8');

    // Also update a stable symlink/copy for easy access
    const latestPath = path.join(outputDir, 'latest-eval-report.md');
    fs.writeFileSync(latestPath, reportContent, 'utf-8');

    return filePath;
  }
}
