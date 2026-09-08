export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

const FORBIDDEN_PATTERNS = [
  /word\s*count/i,
  /draft\s*\d*/i,
  /attempt\s*\d*/i,
  /iterative\s*writing/i,
  /let'?s\s*focus/i,
  /here\s*is/i,
  /certainly/i,
  /as\s*ran/i,
  /echo'?s\s*question/i,
  /monologue/i,
  /\*\s*\*\s*\*/,
  /^\s*[\*\-]\s+/m // bullet lists at beginning of lines
];

const ENGLISH_RUN_REGEX = /[A-Za-z]{2,}\s+[A-Za-z]{2,}\s+[A-Za-z]{2,}/;

export function validateDilemmaText(
  text: string,
  category: 'recurring_family' | 'strategic_oneoff' | 'trivial_silence_test' | 'hostile_incomplete'
): ValidationResult {
  const clean = (text || '').trim();

  // Minimum length check based on category
  if (category === 'hostile_incomplete') {
    if (clean.length < 25) {
      return { isValid: false, reason: `Hostile text too short (${clean.length} < 25)` };
    }
  } else if (category === 'trivial_silence_test') {
    if (clean.length < 40) {
      return { isValid: false, reason: `Trivial text too short (${clean.length} < 40)` };
    }
  } else {
    // standard or strategic
    if (clean.length < 100) {
      return { isValid: false, reason: `Standard dilemma text too short (${clean.length} < 100)` };
    }
  }

  // Forbidden prompt debris
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(clean)) {
      return { isValid: false, reason: `Forbidden pattern detected: ${pattern}` };
    }
  }

  // English runs
  if (ENGLISH_RUN_REGEX.test(clean)) {
    return { isValid: false, reason: `English phrase run of 3+ words detected` };
  }

  // Truncation check: must end with proper punctuation or Hebrew letter
  if (!/[\.\?!״"A-Za-z0-9\u0590-\u05FF]$/.test(clean)) {
    return { isValid: false, reason: `Text ends with unexpected trailing character` };
  }

  return { isValid: true };
}

export function validateResponseText(
  text: string,
  behavior: string
): ValidationResult {
  const clean = (text || '').trim();

  if (behavior === 'skip_enough' || behavior === 'abandonment' || behavior === 'option_click' || behavior === 'mirror_correction') {
    return { isValid: true };
  }

  if (behavior === 'pushback_irrelevant') {
    if (clean.length < 20) {
      return { isValid: false, reason: `Pushback too short (${clean.length} < 20)` };
    }
  } else if (behavior === 'single_sentence') {
    if (clean.length < 20 || clean.length > 300) {
      return { isValid: false, reason: `Single sentence invalid length (${clean.length})` };
    }
  } else if (behavior === 'full_paragraph') {
    if (clean.length < 50) {
      return { isValid: false, reason: `Full paragraph response too short (${clean.length} < 50)` };
    }
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(clean)) {
      return { isValid: false, reason: `Forbidden pattern in response: ${pattern}` };
    }
  }

  if (ENGLISH_RUN_REGEX.test(clean)) {
    return { isValid: false, reason: `English phrase run in response detected` };
  }

  return { isValid: true };
}
