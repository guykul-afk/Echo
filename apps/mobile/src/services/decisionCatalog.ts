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

// Documented Precedents Catalog (Mock data removed per user request)
export const CANONICAL_PRECEDENTS: CatalogPrecedent[] = [];

export const HEBREW_STOPWORDS = new Set([
  'את', 'על', 'עם', 'של', 'לא', 'כן', 'זה', 'זו', 'אלה', 'אלו', 'היה', 'היו', 'תהיה', 'יהיה',
  'אני', 'אתה', 'הוא', 'היא', 'אנחנו', 'אתם', 'הם', 'כל', 'רק', 'עוד', 'יותר', 'לפני', 'אחרי',
  'כדי', 'אם', 'כי', 'או', 'גם', 'אבל', 'אך', 'כבר', 'שוב', 'שם', 'פה', 'כאן', 'מאוד', 'מה', 'מי',
  'לגבי', 'בגלל', 'מתוך', 'אצל', 'כמו', 'בין', 'שאתה', 'שאני', 'אולי', 'שוקל', 'שוקלת', 'מתלבט', 'מתלבטת',
  'דילמה', 'הדילמה', 'ההחלטה', 'החלטה', 'האם', 'להמשיך', 'לבחור', 'בפועל', 'עכשיו', 'רוצה', 'צריך',
  'פרויקט', 'אפשרות', 'בנושא', 'טובה', 'פחות', 'מול', 'היום', 'כרגע', 'איך', 'כיצד', 'דרך', 'נושא',
  'שלה', 'שלו', 'שלי', 'שלנו', 'שלהם', 'אותו', 'אותה', 'אותי', 'אותנו', 'אותם', 'אחת', 'אחד', 'שני', 'שניה'
]);

// 2. Fetch all user decisions from localStorage + canonical archive
export function getAllUserDecisions(userId: string = 'Guy_Kuleski'): CatalogPrecedent[] {
  const mergedMap = new Map<string, CatalogPrecedent>();

  // Add canonical catalog
  CANONICAL_PRECEDENTS.forEach(p => mergedMap.set(p.id, p));

  // Load from localStorage
  if (typeof window !== 'undefined') {
    const keysToCheck = ['echo_decisions_' + userId];
    if (userId.toLowerCase().includes('guy') || userId.toLowerCase().includes('kuleski')) {
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
                const title = item.title || item.dilemma?.slice(0, 50) || 'החלטה מהעבר';
                const textToWords = (title + ' ' + (item.dilemma || '') + ' ' + (item.consideration || '') + ' ' + (item.facts || '') + ' ' + (item.assumptions || '')).toLowerCase();
                const extractedKeywords = textToWords
                  .split(/[\s,.:;״"()!?\-\/]+/)
                  .map(w => w.trim())
                  .filter(w => w.length >= 3 && !HEBREW_STOPWORDS.has(w));

                const existing = mergedMap.get(item.id);
                mergedMap.set(item.id, {
                  id: item.id,
                  title: existing?.title || title,
                  date: item.date || existing?.date || 'ספטמבר 2026',
                  family: item.family || existing?.family || 'general_deliberation',
                  dilemma: item.dilemma || item.consideration || existing?.dilemma || title,
                  keywords: Array.from(new Set([...(existing?.keywords || []), ...extractedKeywords])),
                  principles: existing?.principles,
                  tradeoffs: existing?.tradeoffs,
                  lesson: item.followUps?.[0]?.whatHappened || item.conclusion || existing?.lesson,
                  conclusion: item.conclusion || existing?.conclusion,
                  outcome: item.followUps?.[0]?.whatHappened,
                  historicalQuestion: existing?.historicalQuestion || ('בהחלטה קודמת לגבי "' + title + '" הגדרת צעד ומסקנה. האם תובנה זו רלוונטית גם כאן?')
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

export interface RelatedPrecedentItem {
  id: string;
  title: string;
  date?: string;
  score: number;
  matchReason: string;
  lesson: string;
  historicalQuestion?: string;
}

export interface RelatedPastEchoesResult {
  primaryEcho: RelatedPrecedentItem | null;
  allRelatedEchoes: RelatedPrecedentItem[];
  insightsSummary: string;
}


