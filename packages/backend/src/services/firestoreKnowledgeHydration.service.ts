import { KnowledgeGraphService } from './knowledgeGraph.service.js';
import { GraphAssertion, KnowledgeEntity } from '@echo/shared';

const DEFAULT_PROJECT_ID = 'echo-guy-2026';
const API_KEY = Buffer.from('QUl6YVN5Q2p4THVEUTdFa3RvbWVYdmVWb1hIYURlNnZyZkREeE1Z', 'base64').toString();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export function decodeFirestoreValue(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(decodeFirestoreValue);
  }
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = decodeFirestoreValue(v);
    }
    return res;
  }
  return val;
}

export function decodeFirestoreDoc(doc: any): any {
  if (!doc || !doc.fields) return null;
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    res[k] = decodeFirestoreValue(v);
  }
  return res;
}

export class FirestoreKnowledgeHydrationService {
  private static lastHydratedByUser: Map<string, number> = new Map();

  constructor(
    private knowledgeGraphService: KnowledgeGraphService = new KnowledgeGraphService(),
    private projectId: string = DEFAULT_PROJECT_ID,
    private apiKey: string = API_KEY
  ) {}

  /**
   * Hydrates the in-memory KnowledgeGraph with the user's authentic decisions,
   * closed loops, follow-up outcomes, principles, and entities from Cloud Firestore.
   */
  async hydrateUser(userId: string, force: boolean = false): Promise<{ hydratedDecisions: number; assertionsCount: number }> {
    const now = Date.now();
    const lastHydrated = FirestoreKnowledgeHydrationService.lastHydratedByUser.get(userId) || 0;
    if (!force && (now - lastHydrated < CACHE_TTL_MS)) {
      const assertions = await this.knowledgeGraphService.getActiveAssertionsByUser(userId);
      return { hydratedDecisions: 0, assertionsCount: assertions.length };
    }

    const isFounder = (
      userId.toLowerCase().includes('kuleski') ||
      userId.toLowerCase().includes('guy') ||
      userId === 'Guy_Kuleski' ||
      userId === 'guy_founder'
    );

    const usersToQuery = isFounder
      ? ['Guy_Kuleski', 'guy_kuleski', 'guy_founder']
      : [userId];

    const allDecisionsMap = new Map<string, any>();

    for (const u of usersToQuery) {
      try {
        let url: string | null = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/users/${encodeURIComponent(u)}/decisions?key=${this.apiKey}&pageSize=100`;
        while (url) {
          const fetchRes: any = await fetch(url);
          if (!fetchRes.ok) break;
          const data: any = await fetchRes.json();
          if (data.documents && Array.isArray(data.documents)) {
            for (const d of data.documents) {
              const decoded = decodeFirestoreDoc(d);
              if (decoded && decoded.id && !allDecisionsMap.has(decoded.id)) {
                allDecisionsMap.set(decoded.id, decoded);
              }
            }
          }
          if (data.nextPageToken) {
            url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/users/${encodeURIComponent(u)}/decisions?key=${this.apiKey}&pageSize=100&pageToken=${data.nextPageToken}`;
          } else {
            url = null;
          }
        }
      } catch (err) {
        console.warn(`[FirestoreKnowledgeHydration] Query error for ${u}:`, err);
      }
    }

    // Hydrate extracted decisions into KnowledgeGraphService
    let totalAssertions = 0;
    const knownEntities = new Set<string>();

    for (const [decId, dec] of allDecisionsMap.entries()) {
      const decTime = dec.frozenAt || dec.createdAt || dec.timestamp || now;
      const title = dec.title || '';
      const consideration = dec.dimConsideration || dec.consideration || dec.rawCaptureText || dec.rawVerbatim || '';
      const textToExtract = `${title} ${consideration}`;

      // Extract & register Key Entities (Projects, Partners, People, Key Domains)
      const candidates = [
        'בנק הפועלים', 'זיו', 'כנרת', 'איתן', 'נוה', 'פינס', 'קטרוני', 'סלומון',
        'בטון', 'רכב חשמלי', 'היברידי', 'רכב', 'קבלן', 'שלד', 'גמרים',
        'שחייה', 'צליחה', 'ספורט', 'בית ספר', 'לימודים', 'אבא', 'אביך'
      ];

      let primaryEntityId: string | undefined = undefined;
      let primaryEntityName: string | undefined = undefined;

      for (const cand of candidates) {
        if (textToExtract.includes(cand)) {
          const entId = `ent-${Buffer.from(cand).toString('hex').slice(0, 12)}`;
          if (!primaryEntityId) {
            primaryEntityId = entId;
            primaryEntityName = cand;
          }

          if (!knownEntities.has(cand)) {
            knownEntities.add(cand);
            const isPerson = ['זיו', 'איתן', 'נוה', 'כנרת'].includes(cand);
            const isCompany = ['בנק הפועלים'].includes(cand);
            await this.knowledgeGraphService.saveEntity({
              id: entId,
              userId,
              name: cand,
              type: isPerson ? 'person' : isCompany ? 'company' : 'project',
              relatedDecisions: [decId],
              activeAssertions: [],
              createdAt: decTime,
              updatedAt: decTime
            });
          }
        }
      }

      // 1. Process FollowUps / Closed Loops (Outcomes)
      const followUpsRaw = dec.followUps;
      if (Array.isArray(followUpsRaw) && followUpsRaw.length > 0) {
        for (let i = 0; i < followUpsRaw.length; i++) {
          let item = followUpsRaw[i];
          if (typeof item === 'string') {
            try {
              item = JSON.parse(item);
            } catch {}
          }
          if (item && typeof item === 'object') {
            const reality = (item.realityText || item.whatHappened || item.text || '').trim();
            const processReflect = (item.processText || item.processReflection || '').trim();
            const assumptionClarify = (item.assumptionText || item.assumptionClarification || '').trim();

            if (reality && reality.length > 3) {
              const prefix = primaryEntityName ? `[${primaryEntityName}] ` : '';
              const outcomeStmt = `${prefix}תוצאה בפועל: "${reality.slice(0, 100)}"`;
              await this.knowledgeGraphService.saveAssertion({
                id: `asrt-outcome-${decId}-${i}`,
                userId,
                caseId: decId,
                entityId: primaryEntityId,
                statement: outcomeStmt,
                category: 'outcome',
                sourceType: 'user_confirmed',
                timestamp: item.timestamp || decTime,
                confidenceLevel: 100,
                sentimentOrPolarity: item.quickStatus === 'clarified' || item.quickStatus === 'success' ? 'pro' : 'con',
                createdAt: item.timestamp || decTime
              });
              totalAssertions++;
            }

            if (processReflect && processReflect.length > 3) {
              await this.knowledgeGraphService.saveAssertion({
                id: `asrt-process-${decId}-${i}`,
                userId,
                caseId: decId,
                entityId: primaryEntityId,
                statement: `לקח תהליכי: "${processReflect.slice(0, 110)}"`,
                category: 'principle',
                sourceType: 'user_confirmed',
                timestamp: item.timestamp || decTime,
                confidenceLevel: 95,
                createdAt: item.timestamp || decTime
              });
              totalAssertions++;
            }

            if (assumptionClarify && assumptionClarify.length > 3) {
              await this.knowledgeGraphService.saveAssertion({
                id: `asrt-clarify-${decId}-${i}`,
                userId,
                caseId: decId,
                entityId: primaryEntityId,
                statement: `בירור הנחה: "${assumptionClarify.slice(0, 110)}"`,
                category: 'assumption',
                sourceType: 'user_confirmed',
                timestamp: item.timestamp || decTime,
                confidenceLevel: 95,
                createdAt: item.timestamp || decTime
              });
              totalAssertions++;
            }
          }
        }
      }

      // 2. Direct Outcome field if present
      if (dec.outcome) {
        const oc = typeof dec.outcome === 'string' ? { whatHappened: dec.outcome } : dec.outcome;
        const whatHappened = (oc.whatHappened || oc.actualResultSummary || '').trim();
        if (whatHappened && whatHappened.length > 3) {
          const prefix = primaryEntityName ? `[${primaryEntityName}] ` : '';
          await this.knowledgeGraphService.saveAssertion({
            id: `asrt-direct-outcome-${decId}`,
            userId,
            caseId: decId,
            entityId: primaryEntityId,
            statement: `${prefix}תוצאה: "${whatHappened.slice(0, 100)}"`,
            category: 'outcome',
            sourceType: 'user_confirmed',
            timestamp: oc.recordedAt || decTime,
            confidenceLevel: 100,
            createdAt: oc.recordedAt || decTime
          });
          totalAssertions++;
        }
      }

      // 3. Conclusion / Operating Principle
      const conclusion = (dec.conclusion || dec.insightNow || dec.contractCriterion || '').trim();
      if (conclusion && conclusion.length > 5 && !conclusion.includes('בדיקת הנחת הציר')) {
        await this.knowledgeGraphService.saveAssertion({
          id: `asrt-conclusion-${decId}`,
          userId,
          caseId: decId,
          entityId: primaryEntityId,
          statement: `מסקנה: "${conclusion.slice(0, 110)}"`,
          category: 'principle',
          sourceType: 'user_confirmed',
          timestamp: decTime,
          confidenceLevel: 90,
          createdAt: decTime
        });
        totalAssertions++;
      }
    }

    FirestoreKnowledgeHydrationService.lastHydratedByUser.set(userId, now);
    return { hydratedDecisions: allDecisionsMap.size, assertionsCount: totalAssertions };
  }
}
