import { EntityType } from '@echo/shared';

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  confidence: number;
}

const HEBREW_STOPWORDS = new Set([
  'את', 'על', 'עם', 'של', 'לא', 'כן', 'זה', 'זו', 'אלה', 'אלו', 'היה', 'היו', 'תהיה', 'יהיה',
  'אני', 'אתה', 'הוא', 'היא', 'אנחנו', 'אתם', 'הם', 'כל', 'רק', 'עוד', 'יותר', 'לפני', 'אחרי',
  'כדי', 'אם', 'כי', 'או', 'גם', 'אבל', 'אך', 'כבר', 'שוב', 'שם', 'פה', 'כאן', 'מאוד', 'מה', 'מי',
  'לגבי', 'בגלל', 'מתוך', 'אצל', 'כמו', 'בין', 'שאתה', 'שאני', 'אולי', 'שוקל', 'שוקלת', 'מתלבט', 'מתלבטת',
  'דילמה', 'הדילמה', 'ההחלטה', 'החלטה', 'האם', 'להמשיך', 'לבחור', 'בפועל', 'עכשיו', 'רוצה', 'צריך',
  'אפשרות', 'בנושא', 'טובה', 'פחות', 'מול', 'היום', 'כרגע', 'איך', 'כיצד', 'דרך', 'נושא',
  'שלה', 'שלו', 'שלי', 'שלנו', 'שלהם', 'אותו', 'אותה', 'אותי', 'אותנו', 'אותם', 'אחת', 'אחד', 'שני', 'שניה',
  'הזה', 'הזאת', 'האלה', 'האלו', 'יותר', 'פחות', 'טוב', 'רע', 'נכון', 'משהו', 'דבר', 'דברים'
]);

export class DynamicEntityExtractorService {
  /**
   * Dynamically extracts entities (people, companies, projects, concepts)
   * from free-form Hebrew text without requiring hardcoded static lists.
   */
  extractEntities(text: string, title?: string): ExtractedEntity[] {
    if (!text && !title) return [];
    const combined = `${title || ''} ${text || ''}`.trim();
    const entitiesMap = new Map<string, ExtractedEntity>();

    const addEntity = (name: string, type: EntityType, confidence: number) => {
      let cleanName = name.replace(/^[״"'\(\)\[\],.\-:\s]+|[״"'\(\)\[\],.\-:\s]+$/g, '').trim();
      
      // Strip trailing or leading stopwords from multi-word entities (e.g. "הפועלים לגבי" -> "הפועלים")
      const words = cleanName.split(/\s+/);
      while (words.length > 1 && HEBREW_STOPWORDS.has(words[words.length - 1].toLowerCase())) {
        words.pop();
      }
      while (words.length > 1 && HEBREW_STOPWORDS.has(words[0].toLowerCase())) {
        words.shift();
      }
      cleanName = words.join(' ').trim();

      if (cleanName.length < 2 || HEBREW_STOPWORDS.has(cleanName.toLowerCase())) return;
      
      const genericCategoryWords = new Set(['חברת', 'חברה', 'בנק', 'פרויקט', 'סוכנות', 'קבלן', 'משרד', 'אתר', 'מתחם']);
      if (genericCategoryWords.has(cleanName.toLowerCase())) return;
      
      const key = cleanName.toLowerCase();
      const existing = entitiesMap.get(key);
      if (!existing || existing.confidence < confidence) {
        entitiesMap.set(key, { name: cleanName, type, confidence });
      }
    };

    // 1. Quoted terms: "..." or ״...״ (High precision for projects, firms, terms)
    const quoteRegex = /["״]([^"״\n]{2,30})["״]/g;
    let match: RegExpExecArray | null;
    while ((match = quoteRegex.exec(combined)) !== null) {
      const val = match[1].trim();
      if (val.length >= 2 && !HEBREW_STOPWORDS.has(val.toLowerCase())) {
        addEntity(val, 'project', 0.95);
      }
    }

    // 2. Structural Hebrew Entity Patterns (Regex-based Named Entity Recognition)
    const patterns: Array<{ regex: RegExp; type: EntityType; group: number; confidence: number }> = [
      // Banks and Financial institutions
      { regex: /(?:בנק|בבנק|לבנק)\s+([א-ת\w]{2,20}(?:\s+[א-ת\w]{2,20})?)/g, type: 'company', group: 1, confidence: 0.95 },
      // Companies & Corporations
      { regex: /(?:חברת|בחברת|לחברת|סוכנות|משרד)\s+([א-ת\w]{2,20})/g, type: 'company', group: 1, confidence: 0.92 },
      // Projects, Sites & Locations
      { regex: /(?:פרויקט|בפרויקט|לפרויקט|מתחם|אתר)\s+([א-ת\w]{2,20}(?:\s+[א-ת\w]{2,20})?)/g, type: 'project', group: 1, confidence: 0.95 },
      // People: Contractors & Service Providers
      { regex: /(?:קבלן|לקבלן|מול\s+קבלן)\s+([א-ת\w]{2,20})/g, type: 'person', group: 1, confidence: 0.90 },
      // People: Meetings, Conversations, and Beneficiaries (including attached 'ל' prefix: "לאיתן", "לדוד")
      { regex: /(?:שיחה\s+עם|פגישה\s+עם|בירור\s+מול|תיאום\s+עם|עבור|מול)\s+([א-ת\w]{2,20})/g, type: 'person', group: 1, confidence: 0.92 },
      { regex: /(?:לקנות|לתת|להמליץ|לעזור|להעביר|לפנות)\s+ל([א-ת\w]{2,20})/g, type: 'person', group: 1, confidence: 0.92 },
      // Family members with Hebrew prefixes ("לאבא", "מאבא", "אביך")
      { regex: /[בלמכ]?(אבא|אביך|אמא|אימך)/g, type: 'person', group: 1, confidence: 0.90 },
      // Latin proper nouns (e.g. Apple, Google, Nike, Gemini)
      { regex: /\b([A-Z][a-zA-Z0-9_\-]{2,25})\b/g, type: 'company', group: 1, confidence: 0.85 }
    ];

    for (const p of patterns) {
      p.regex.lastIndex = 0;
      while ((match = p.regex.exec(combined)) !== null) {
        const rawName = match[p.group]?.trim();
        if (rawName && rawName.length >= 2 && !HEBREW_STOPWORDS.has(rawName.toLowerCase())) {
          addEntity(rawName, p.type, p.confidence);
        }
      }
    }

    // 3. Domain Concept Extraction from Title (extract prominent title tokens)
    if (title && title.length >= 4) {
      const cleanTitle = title.replace(/^החלטה:\s*|^דילמה:\s*/, '').trim();
      const titleWords = cleanTitle
        .split(/[\s,.:;״"()!?\-\/]+/)
        .map(w => w.trim())
        .filter(w => w.length >= 3 && !HEBREW_STOPWORDS.has(w.toLowerCase()));

      for (const word of titleWords) {
        // If word looks like a domain anchor (e.g. בטון, שלד, גמרים, שחייה, צליחה, רכב)
        if (!entitiesMap.has(word.toLowerCase())) {
          addEntity(word, 'concept', 0.70);
        }
      }
    }

    return Array.from(entitiesMap.values());
  }
}
