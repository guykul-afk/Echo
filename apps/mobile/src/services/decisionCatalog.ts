// Decision Catalog & OKF Retrieval Service
// Merges documented historical precedents with live user decisions from localStorage / Firestore

export interface CatalogPrecedent {
  id: string;
  title: string;
  date?: string;
  family?: string;
  dilemma: string;
  keywords: string[];
  principles?: string[];
  tradeoffs?: { protectedValue: string; sacrificedValue: string };
  lesson?: string;
  conclusion?: string;
  outcome?: string;
  historicalQuestion?: string;
}

export interface PrecedentMatchResult {
  matchedPrecedent: CatalogPrecedent;
  score: number;
  matchReason: string;
  suggestedQuestion: string;
}



export const CANONICAL_PRECEDENTS: CatalogPrecedent[] = [];

export const HEBREW_STOPWORDS = new Set([
  'את', 'על', 'עם', 'של', 'לא', 'כן', 'זה', 'זו', 'אלה', 'אלו', 'היה', 'היו', 'תהיה', 'יהיה',
  'אני', 'אתה', 'הוא', 'היא', 'אנחנו', 'אתם', 'הם', 'כל', 'רק', 'עוד', 'יותר', 'לפני', 'אחרי',
  'כדי', 'אם', 'כי', 'או', 'גם', 'אבל', 'אך', 'כבר', 'שוב', 'שם', 'פה', 'כאן', 'מאוד', 'מה', 'מי',
  'לגבי', 'בגלל', 'מתוך', 'אצל', 'כמו', 'בין', 'שאתה', 'שאני', 'אולי', 'שוקל', 'שוקלת', 'מתלבט', 'מתלבטת',
  'דילמה', 'הדילמה', 'ההחלטה', 'החלטה', 'האם', 'להמשיך', 'לבחור', 'בפועל', 'עכשיו', 'רוצה', 'צריך',
  'פרויקט', 'אפשרות', 'בנושא', 'טובה', 'פחות', 'מול', 'היום', 'כרגע', 'איך', 'כיצד', 'דרך', 'נושא',
  'שלה', 'שלו', 'שלי', 'שלנו', 'שלהם', 'אותו', 'אותה', 'אותי', 'אותנו', 'אותם', 'אחת', 'אחד', 'שני', 'שניה',
  'אישור', 'אישורי', 'אישורים', 'מיידי', 'מיידית', 'מיידיים', 'תקציב', 'תקציבים', 'דחוף', 'דחופה',
  'עושה', 'עושים', 'שעות', 'ימים', 'שבוע', 'חודש', 'שנה', 'סכום', 'כסף', 'דולר', 'שקל', 'צוות', 'צוותים', 'איכות'
]);

function normalizeHebrewWord(word: string): string {
  let w = word.toLowerCase().trim();
  if (w.length >= 5 && (w.startsWith('ו') || w.startsWith('ה') || w.startsWith('ב') || w.startsWith('ל') || w.startsWith('מ') || w.startsWith('ש') || w.startsWith('כ'))) {
    w = w.slice(1);
  }
  const badFragments = ['ירה', 'ירות', 'וצר', 'שקיע'];
  if (badFragments.includes(w)) return '';
  return w;
}

function extractKeyTokens(text: string): string[] {
  return text
    .split(/[\s,.:;״"()!?\-\/|]+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length >= 3 && !HEBREW_STOPWORDS.has(w))
    .map(normalizeHebrewWord)
    .filter(w => w.length >= 3 && !HEBREW_STOPWORDS.has(w));
}

export function computeConceptOverlap(phraseA: string, phraseB: string): { sharedTokens: string[]; overlapRatio: number } {
  if (!phraseA || !phraseB) return { sharedTokens: [], overlapRatio: 0 };
  const lowerA = phraseA.toLowerCase();
  const lowerB = phraseB.toLowerCase();

  if (lowerA.includes(lowerB) || lowerB.includes(lowerA)) {
    return { sharedTokens: [phraseA.trim()], overlapRatio: 1.0 };
  }

  const tokensA = extractKeyTokens(lowerA);
  const tokensB = extractKeyTokens(lowerB);

  if (tokensA.length === 0 || tokensB.length === 0) return { sharedTokens: [], overlapRatio: 0 };

  const sharedTokens: string[] = [];
  for (const tA of tokensA) {
    for (const tB of tokensB) {
      const isSuffixVariation = (tA.length >= 4 && tB.length >= 4) &&
        ((tA.startsWith(tB) && tA.length - tB.length <= 3) || (tB.startsWith(tA) && tB.length - tA.length <= 3));
      if (tA === tB || isSuffixVariation) {
        sharedTokens.push(tA);
        break;
      }
    }
  }

  const overlapRatio = sharedTokens.length / Math.min(tokensA.length, tokensB.length);
  return { sharedTokens, overlapRatio };
}

// 2. Fetch all user decisions from localStorage + canonical archive
export function getAllUserDecisions(userId: string = ''): CatalogPrecedent[] {
  const mergedMap = new Map<string, CatalogPrecedent>();

  // Add canonical catalog
  CANONICAL_PRECEDENTS.forEach(p => mergedMap.set(p.id, p));

  // Load from localStorage
  if (typeof window !== 'undefined') {
    const keysToCheck: string[] = [];
    if (userId) {
      keysToCheck.push(`echo_decisions_${userId}`);
    }
    const isFounder = (
      userId === 'Guy_Kuleski' ||
      userId === 'guy_founder' ||
      userId === 'guy_kuleski' ||
      (userId && userId.toLowerCase() === 'guykul')
    );
    if (isFounder) {
      keysToCheck.push('echo_decisions_Guy_Kuleski', 'echo_decisions_guy_kuleski', 'echo_decisions_guy_founder');
    }

    for (const key of keysToCheck) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            list.forEach((item: any) => {
              if (item && item.id) {
                const title = item.title || item.dilemma?.slice(0, 50) || item.dimConsideration?.slice(0, 50) || 'החלטה מהעבר';
                const consideration = item.dimConsideration || item.consideration || item.rawCaptureText || item.rawVerbatim || '';
                const facts = item.dimFacts || item.facts || '';
                const assumptions = item.dimAssumptions || item.assumptions || '';
                const textToWords = (title + ' ' + consideration + ' ' + facts + ' ' + assumptions).toLowerCase();
                const extractedKeywords = extractKeyTokens(textToWords);

                const existing = mergedMap.get(item.id);
                const lesson = item.followUps?.[0]?.whatHappened || 
                  (typeof item.outcome === 'string' ? item.outcome : item.outcome?.whatHappened) || 
                  item.insightNow || 
                  item.conclusion || 
                  existing?.lesson;

                mergedMap.set(item.id, {
                  id: item.id,
                  title: existing?.title || title,
                  date: item.date || existing?.date || 'ספטמבר 2026',
                  family: item.family || existing?.family || 'general_deliberation',
                  dilemma: consideration || existing?.dilemma || title,
                  keywords: Array.from(new Set([...(existing?.keywords || []), ...extractedKeywords])),
                  principles: item.operatingPrinciples || existing?.principles,
                  tradeoffs: item.tradeoffs?.[0] || existing?.tradeoffs,
                  lesson,
                  conclusion: item.conclusion || item.insightNow || existing?.conclusion,
                  outcome: lesson,
                  historicalQuestion: existing?.historicalQuestion || (lesson ? `בהחלטה קודמת לגבי "${title}" למדת ש: "${lesson.slice(0, 80)}". האם לקח זה רלוונטי גם כאן?` : `בהחלטה קודמת לגבי "${title}" הגדרת צעד ומסקנה. האם תובנה זו רלוונטית גם כאן?`)
                });
              }
            });
          }
        }
      } catch {}
    }
  }

  return Array.from(mergedMap.values());
}

// 3. OKF Tri-Factor Semantic Precedent Matching Engine (Smart & Suffix-Aware)
export function findRelatedOKFPrecedents(
  rawCaptureText: string,
  consideration: string,
  deepMechanisms?: {
    operatingPrinciples?: string[];
    tradeoffs?: Array<{ protectedValue: string; sacrificedValue: string }>;
  },
  userId: string = '',
  excludeId?: string
): RelatedPastEchoesResult {
  const allDecisions = getAllUserDecisions(userId);
  if (!allDecisions || allDecisions.length === 0) {
    return { primaryEcho: null, allRelatedEchoes: [], insightsSummary: '' };
  }

  const combinedCurrent = (rawCaptureText + ' ' + consideration).toLowerCase();
  const scoredMatches: RelatedPrecedentItem[] = [];

  for (const dec of allDecisions) {
    if (excludeId) {
      const cleanEx = excludeId.replace(/^dc-/, '');
      const cleanDec = dec.id.replace(/^dc-/, '');
      if (cleanEx === cleanDec || dec.id === excludeId) continue;
    }

    let score = 0;
    const matchReasons: string[] = [];

    // Layer 1: Smart Entity & Title Matching (Supports partial inclusion e.g. "נשיאים" in "מתחם הנשיאים")
    const titleOverlap = computeConceptOverlap(dec.title, combinedCurrent);
    if (titleOverlap.sharedTokens.length > 0) {
      if (titleOverlap.overlapRatio >= 0.4) {
        score += 0.50;
        matchReasons.push(`זהות נושא/ישות: "${titleOverlap.sharedTokens.join(', ')}"`);
      } else {
        score += 0.30;
        matchReasons.push(`חפיפת כותרת: "${titleOverlap.sharedTokens.join(', ')}"`);
      }
    }

    // Layer 2: Deep Mechanism Match (Trade-offs & Operating Principles)
    let hasTradeoffMatch = false;
    if (deepMechanisms?.tradeoffs && dec.tradeoffs) {
      for (const t of deepMechanisms.tradeoffs) {
        const protOverlap = computeConceptOverlap(t.protectedValue, dec.tradeoffs.protectedValue);
        const sacrOverlap = computeConceptOverlap(t.sacrificedValue, dec.tradeoffs.sacrificedValue);

        if (protOverlap.sharedTokens.length > 0) {
          score += 0.35;
          hasTradeoffMatch = true;
          matchReasons.push(`שימור ערך משותף: ${t.protectedValue}`);
        }
        if (sacrOverlap.sharedTokens.length > 0) {
          score += 0.35;
          hasTradeoffMatch = true;
          matchReasons.push(`ויתור משותף: ${t.sacrificedValue}`);
        }
      }
    }

    let hasPrincipleMatch = false;
    if (deepMechanisms?.operatingPrinciples && dec.principles) {
      for (const p of deepMechanisms.operatingPrinciples) {
        for (const dp of dec.principles) {
          const pOverlap = computeConceptOverlap(p, dp);
          if (pOverlap.sharedTokens.length > 0) {
            score += 0.40;
            hasPrincipleMatch = true;
            matchReasons.push(`עקרון פעולה חוזר: ${pOverlap.sharedTokens.join(', ')}`);
            break;
          }
        }
      }
    }

    // Layer 3: Keyword & Concept Overlap (Suffix-aware)
    const dilemmaOverlap = computeConceptOverlap(dec.dilemma, combinedCurrent);
    if (dilemmaOverlap.sharedTokens.length >= 2) {
      const overlapWeight = Math.min(0.40, dilemmaOverlap.sharedTokens.length * 0.12);
      score += overlapWeight;
      matchReasons.push(`חפיפת תוכן: ${dilemmaOverlap.sharedTokens.slice(0, 3).join(', ')}`);
    } else if (dilemmaOverlap.sharedTokens.length === 1 && !matchReasons.some(r => r.includes('נושא/ישות'))) {
      score += 0.15;
    }

    // Lesson/Conclusion relevance
    if (dec.lesson) {
      const lessonOverlap = computeConceptOverlap(dec.lesson, combinedCurrent);
      if (lessonOverlap.sharedTokens.length >= 2) {
        score += 0.25;
        matchReasons.push(`רלוונטיות ללקח עבר`);
      }
    }

    // Authentic Anchor Rule: Must have at least 1 strong anchor (entity/title match, tradeoff, principle, or multiple keywords)
    const hasAuthenticAnchor = (titleOverlap.sharedTokens.length > 0 && titleOverlap.overlapRatio >= 0.4) ||
      hasTradeoffMatch ||
      hasPrincipleMatch ||
      dilemmaOverlap.sharedTokens.length >= 2;

    if (!hasAuthenticAnchor) {
      continue;
    }

    const normalizedScore = Math.min(0.96, score);

    // Quality Gate: Only surface candidates with genuine relevance (score >= 0.50)
    if (normalizedScore >= 0.50) {
      const lessonText = dec.lesson || dec.conclusion || dec.outcome || dec.dilemma;
      scoredMatches.push({
        id: dec.id,
        title: dec.title,
        date: dec.date,
        score: normalizedScore,
        matchReason: matchReasons.join(' · ') || 'התאמה קונספטואלית לתקדים העבר',
        lesson: lessonText,
        historicalQuestion: dec.historicalQuestion || (`בהחלטה לגבי "${dec.title}" למדת ש: "${lessonText.slice(0, 80)}". האם לקח זה מנחה אותך גם כעת?`)
      });
    }
  }

  scoredMatches.sort((a, b) => b.score - a.score);

  const topMatches = scoredMatches.slice(0, 4);
  const primaryEcho = topMatches.length > 0 ? topMatches[0] : null;

  let insightsSummary = '';
  if (topMatches.length > 0) {
    if (topMatches.length === 1) {
      insightsSummary = `תובנת מפתח מתוך "${topMatches[0].title}": ${topMatches[0].lesson}`;
    } else {
      const parts = topMatches.slice(0, 2).map((m, idx) => `(${idx + 1}) ${m.title}: ${m.lesson}`);
      insightsSummary = `סינתזת לקחים מ-${topMatches.length} תקדימי עבר קשורים: ${parts.join(' | ')}`;
    }
  }

  return {
    primaryEcho,
    allRelatedEchoes: topMatches,
    insightsSummary
  };
}

export function findBestOKFPrecedent(
  rawCaptureText: string,
  consideration: string,
  deepMechanisms?: {
    operatingPrinciples?: string[];
    tradeoffs?: Array<{ protectedValue: string; sacrificedValue: string }>;
  },
  userId: string = ''
): PrecedentMatchResult | null {
  const related = findRelatedOKFPrecedents(rawCaptureText, consideration, deepMechanisms, userId);
  if (related.primaryEcho && related.primaryEcho.score >= 0.50) {
    const allDecs = getAllUserDecisions(userId);
    const matched = allDecs.find(d => d.id === related.primaryEcho!.id);
    if (matched) {
      return {
        matchedPrecedent: matched,
        score: related.primaryEcho.score,
        matchReason: related.primaryEcho.matchReason,
        suggestedQuestion: related.primaryEcho.historicalQuestion || ''
      };
    }
  }
  return null;
}



