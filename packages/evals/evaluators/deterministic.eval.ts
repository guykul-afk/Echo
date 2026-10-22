export interface DeterministicEvalResult {
  passed: boolean;
  score: number; // 0 to 100
  checks: {
    schemaValid: boolean;
    factsPurity: boolean;
    epistemicHumility: boolean;
    genderConsistency: boolean;
    noThirdPerson: boolean;
  };
  failures: string[];
}

export class DeterministicEvaluator {
  private static FORBIDDEN_JUDGING_WORDS = [
    'הציון שלך',
    'ציון:',
    'ציון החלטה',
    'ציון איכות',
    'החלטה טיפשית',
    'החלטה שגויה',
    'החלטה גרועה',
    'אני ממליץ לך',
    'אני מייעץ לך',
    'עליך לפעול',
    'אני מורה לך',
    'תעשי מה שאני אומר',
    'תעשה מה שאני אומר'
  ];

  private static FORBIDDEN_FACTS_DILEMMA_WORDS = [
    'שוקל אם',
    'שוקלת אם',
    'מתלבט בין',
    'מתלבטת בין',
    'מתלבט האם',
    'מתלבטת האם',
    'התלבטות האם'
  ];

  static evaluate(output: any, expectations?: { gender?: 'male' | 'female'; forbiddenJudgingPhrases?: string[] }): DeterministicEvalResult {
    const failures: string[] = [];
    const checks = {
      schemaValid: true,
      factsPurity: true,
      epistemicHumility: true,
      genderConsistency: true,
      noThirdPerson: true
    };

    // 1. Schema Validation
    const hd = output.humanDimensions;
    if (!hd) {
      checks.schemaValid = false;
      failures.push('Missing humanDimensions object in output');
    } else {
      const requiredFields = ['consideration', 'centralTension', 'keyHinge', 'goalsPrices', 'facts', 'assumptions', 'missingInfo'];
      for (const f of requiredFields) {
        const val = hd[f];
        const hasContent = Array.isArray(val)
          ? val.length > 0 && val.every(item => typeof item === 'string' && item.trim().length > 0)
          : (typeof val === 'string' && val.trim().length > 0);

        if (!hasContent) {
          checks.schemaValid = false;
          failures.push(`Field '${f}' is missing or empty in humanDimensions`);
        }
      }
    }

    const rawOutputString = JSON.stringify(output);

    // 2. Facts Purity Check
    if (hd?.facts) {
      for (const phrase of this.FORBIDDEN_FACTS_DILEMMA_WORDS) {
        if (hd.facts.includes(phrase)) {
          checks.factsPurity = false;
          failures.push(`Facts Purity violation: facts contains dilemma phrase "${phrase}"`);
        }
      }
    }

    // 3. Epistemic Humility & Non-Judging Check
    const forbiddenWords = [
      ...this.FORBIDDEN_JUDGING_WORDS,
      ...(expectations?.forbiddenJudgingPhrases || [])
    ];

    for (const phrase of forbiddenWords) {
      if (rawOutputString.includes(phrase)) {
        checks.epistemicHumility = false;
        failures.push(`Epistemic violation: found forbidden judging/grading phrase "${phrase}"`);
      }
    }

    const userFacingText = [
      JSON.stringify(hd || {}),
      output.illuminationQuestion || '',
      output.bespokeQuestion?.questionText || '',
      output.historicalQuestion?.questionText || ''
    ].join(' ');

    // 4. No Third Person in User-Facing Mirrors ("המשתמש שוקל", "המשתמשת")
    if (userFacingText.includes('המשתמש שוקל') || userFacingText.includes('המשתמש מתלבט') || userFacingText.includes('המשתמשת שוקלת')) {
      checks.noThirdPerson = false;
      failures.push('Violation: used 3rd person ("המשתמש שוקל") in user-facing mirror instead of locked 2nd person');
    }

    // 5. Gender Consistency in User-Facing Text
    if (expectations?.gender === 'female') {
      if (userFacingText.includes('אתה שוקל') || userFacingText.includes('אתה מתלבט') || userFacingText.includes('שקלת')) {
        checks.genderConsistency = false;
        failures.push('Gender violation: female user addressed in masculine Hebrew ("אתה שוקל/מתלבט")');
      }
    } else if (expectations?.gender === 'male') {
      if (userFacingText.includes('את שוקלת') || userFacingText.includes('את מתלבטת')) {
        checks.genderConsistency = false;
        failures.push('Gender violation: male user addressed in feminine Hebrew ("את שוקלת/מתלבטת")');
      }
    }

    const checkKeys = Object.keys(checks) as (keyof typeof checks)[];
    const passedCount = checkKeys.filter(k => checks[k]).length;
    const score = Math.round((passedCount / checkKeys.length) * 100);
    const passed = failures.length === 0;

    return {
      passed,
      score,
      checks,
      failures
    };
  }
}
