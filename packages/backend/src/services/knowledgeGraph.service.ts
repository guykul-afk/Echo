import {
  KnowledgeEntity,
  GraphAssertion,
  FrozenDecisionSnapshot
} from '@echo/shared';

export class KnowledgeGraphService {
  // Multi-tenant store partitioned strictly by userId: userId -> (id -> Entity/Assertion)
  private static entitiesByUser: Map<string, Map<string, KnowledgeEntity>> = new Map();
  private static assertionsByUser: Map<string, Map<string, GraphAssertion>> = new Map();
  private static snapshotsByCase: Map<string, FrozenDecisionSnapshot> = new Map();

  private getUserEntitiesMap(userId: string): Map<string, KnowledgeEntity> {
    if (!KnowledgeGraphService.entitiesByUser.has(userId)) {
      KnowledgeGraphService.entitiesByUser.set(userId, new Map());
    }
    return KnowledgeGraphService.entitiesByUser.get(userId)!;
  }

  private getUserAssertionsMap(userId: string): Map<string, GraphAssertion> {
    if (!KnowledgeGraphService.assertionsByUser.has(userId)) {
      KnowledgeGraphService.assertionsByUser.set(userId, new Map());
    }
    return KnowledgeGraphService.assertionsByUser.get(userId)!;
  }

  async saveEntity(entity: KnowledgeEntity): Promise<KnowledgeEntity> {
    const userMap = this.getUserEntitiesMap(entity.userId);
    userMap.set(entity.id, { ...entity, updatedAt: Date.now() });
    return entity;
  }

  async saveAssertion(assertion: GraphAssertion): Promise<GraphAssertion> {
    const userMap = this.getUserAssertionsMap(assertion.userId);
    // Strict atomic constraint: Maximum 120 characters per assertion
    const cleanedStatement = (assertion.statement || '').trim();
    const statement = cleanedStatement.length > 120 
      ? cleanedStatement.slice(0, 117) + '...' 
      : cleanedStatement;

    const sanitized: GraphAssertion = {
      ...assertion,
      statement,
      confirmedCount: assertion.confirmedCount ?? 0,
      createdAt: assertion.createdAt || Date.now()
    };
    userMap.set(sanitized.id, sanitized);
    return sanitized;
  }

  async recordAssertionConfirmation(userId: string, assertionId: string, confirmed: boolean): Promise<void> {
    const userMap = this.getUserAssertionsMap(userId);
    const assertion = userMap.get(assertionId);
    if (!assertion) return;

    if (confirmed) {
      assertion.confirmedCount = (assertion.confirmedCount || 0) + 1;
      assertion.lastConfirmedAt = Date.now();
      assertion.sourceType = 'user_confirmed';
    } else {
      // User says not valid anymore / changed -> expire/supersede
      assertion.validUntil = Date.now();
    }
    userMap.set(assertionId, assertion);
  }

  async recordAssertionAsked(userId: string, assertionId: string): Promise<void> {
    const userMap = this.getUserAssertionsMap(userId);
    const assertion = userMap.get(assertionId);
    if (assertion) {
      assertion.lastAskedAt = Date.now();
      userMap.set(assertionId, assertion);
    }
  }

  async findContradictingAssertions(userId: string, target: GraphAssertion): Promise<GraphAssertion[]> {
    const active = await this.getActiveAssertionsByUser(userId);
    const targetText = target.statement.toLowerCase();

    // Key opposites / tension cues in decision contexts
    const oppositePairs: [RegExp, RegExp][] = [
      [/יציבות|בטוח|סיכון נמוך|שמירה/, /סיכון|הרפתקה|צמיחה|שינוי|חדש/],
      [/עצמאות|לבד|סולו/, /שותפות|ביחד|צוות|הסכמה/],
      [/מהירות|עכשיו|מיידי/, /סבלנות|בדיקה מעמיקה|לחכות|המתנה/],
      [/פשטות|מינימליסטי/, /עומק|מקיף|מורכב/],
      [/השקעה|התרחבות/, /צמצום|חיסכון|זהירות/]
    ];

    return active.filter(other => {
      if (other.id === target.id) return false;

      // 1. Same entity with differing polarity or sentiment
      if (target.entityId && other.entityId === target.entityId) {
        if (target.sentimentOrPolarity && other.sentimentOrPolarity && target.sentimentOrPolarity !== other.sentimentOrPolarity) {
          return true;
        }
      }

      // 2. Polarity clash
      if (target.sentimentOrPolarity === 'risk_seeking' && other.sentimentOrPolarity === 'risk_averse') return true;
      if (target.sentimentOrPolarity === 'risk_averse' && other.sentimentOrPolarity === 'risk_seeking') return true;

      // 3. Semantic tension cues
      const otherText = other.statement.toLowerCase();
      for (const [cueA, cueB] of oppositePairs) {
        if (cueA.test(targetText) && cueB.test(otherText)) return true;
        if (cueB.test(targetText) && cueA.test(otherText)) return true;
      }

      return false;
    });
  }

  async getEntitiesByUser(userId: string): Promise<KnowledgeEntity[]> {
    const userMap = this.getUserEntitiesMap(userId);
    return Array.from(userMap.values());
  }

  async getActiveAssertionsByUser(userId: string, asOfTimestamp: number = Date.now()): Promise<GraphAssertion[]> {
    const userMap = this.getUserAssertionsMap(userId);
    const all = Array.from(userMap.values());
    // Active if NOT superseded and NOT expired by memory decay
    return all.filter(a => {
      if (a.supersededBy) return false;
      if (a.validUntil && a.validUntil < asOfTimestamp) return false;
      return true;
    });
  }

  async findEntityByName(userId: string, name: string): Promise<KnowledgeEntity | undefined> {
    const entities = await this.getEntitiesByUser(userId);
    const normalized = name.trim().toLowerCase();
    return entities.find(e => e.name.trim().toLowerCase() === normalized);
  }

  async createFrozenSnapshot(
    caseId: string,
    userId: string,
    data: {
      knownFactsAtTime: string[];
      assumptionsAtTime: string[];
      unknownsAtTime: string[];
      chosenStep: string;
    }
  ): Promise<FrozenDecisionSnapshot> {
    const snapshot: FrozenDecisionSnapshot = {
      id: `snap-${caseId}-${Date.now()}`,
      caseId,
      userId,
      knownFactsAtTime: [...data.knownFactsAtTime],
      assumptionsAtTime: [...data.assumptionsAtTime],
      unknownsAtTime: [...data.unknownsAtTime],
      chosenStep: data.chosenStep,
      frozenAt: Date.now()
    };
    KnowledgeGraphService.snapshotsByCase.set(caseId, snapshot);
    return snapshot;
  }

  async getFrozenSnapshot(caseId: string): Promise<FrozenDecisionSnapshot | undefined> {
    return KnowledgeGraphService.snapshotsByCase.get(caseId);
  }

  static clearUserStore(userId: string): void {
    KnowledgeGraphService.entitiesByUser.delete(userId);
    KnowledgeGraphService.assertionsByUser.delete(userId);
  }
}
