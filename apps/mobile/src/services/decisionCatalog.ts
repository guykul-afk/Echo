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


