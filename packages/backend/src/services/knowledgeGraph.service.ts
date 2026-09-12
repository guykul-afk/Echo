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

    return active.filter(other => {
      if (other.id === target.id) return false;

      // 1. Same entity with differing polarity or sentiment
      if (target.entityId && other.entityId === target.entityId) {
        if (target.sentimentOrPolarity && other.sentimentOrPolarity && target.sentimentOrPolarity !== other.sentimentOrPolarity) {
          return true;
        }
      }

      // 2. Structured polarity clash (e.g. explicitly tagged risk_seeking vs risk_averse)
      if (target.sentimentOrPolarity === 'risk_seeking' && other.sentimentOrPolarity === 'risk_averse') return true;
      if (target.sentimentOrPolarity === 'risk_averse' && other.sentimentOrPolarity === 'risk_seeking') return true;

      // Notice: Untargeted regex keyword matching (e.g. matching 'שמירה' against any decision)
      // was deliberately removed here to eliminate widespread False Positives.
      return false;
    });
  }

  async invalidateAssertionsByCase(userId: string, caseId: string, reason: string = 'user_mirror_correction'): Promise<void> {
    const userMap = this.getUserAssertionsMap(userId);
    for (const assertion of userMap.values()) {
      if (assertion.caseId === caseId && assertion.sourceType === 'ai_inferred') {
        assertion.supersededBy = reason;
      }
    }
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
