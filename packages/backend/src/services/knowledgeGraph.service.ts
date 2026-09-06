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
    userMap.set(assertion.id, { ...assertion });
    return assertion;
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
