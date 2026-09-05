import {
  DecisionCase,
  Statement,
  Option,
  DecisionSignature,
  EvaluationContract,
  Outcome,
  AssumptionRegistryEntry,
  CalibrationTracker,
  PatternHypothesis
} from '@echo/shared';

export interface UserStore {
  cases: Map<string, DecisionCase>;
  statements: Map<string, Statement[]>;
  options: Map<string, Option[]>;
  signatures: Map<string, DecisionSignature>;
  contracts: Map<string, EvaluationContract>;
  outcomes: Map<string, Outcome>;
  registry: AssumptionRegistryEntry[];
  calibration: CalibrationTracker;
  patterns: PatternHypothesis[];
}

export class MockIsolatedDatabase {
  private stores = new Map<string, UserStore>();

  getUserStore(userId: string): UserStore {
    if (!this.stores.has(userId)) {
      this.stores.set(userId, {
        cases: new Map(),
        statements: new Map(),
        options: new Map(),
        signatures: new Map(),
        contracts: new Map(),
        outcomes: new Map(),
        registry: [],
        calibration: {
          id: `cal-${userId}`,
          userId,
          totalVerifiablePredictions: 0,
          brierScore: 0.25,
          confidenceBucketScores: { '80%': 0.7 },
          overconfidenceBiasIndex: 0.1,
          updatedAt: Date.now()
        },
        patterns: []
      });
    }
    return this.stores.get(userId)!;
  }

  /**
   * Verify Zero-Trust: If user A tries to access user B's collection, throw security exception.
   */
  accessCase(requestingUserId: string, targetUserId: string, caseId: string): DecisionCase {
    if (requestingUserId !== targetUserId) {
      throw new Error(`PERMISSION_DENIED: User ${requestingUserId} cannot access data belonging to ${targetUserId}.`);
    }
    const store = this.getUserStore(targetUserId);
    const item = store.cases.get(caseId);
    if (!item) {
      throw new Error(`NOT_FOUND: Case ${caseId} not found.`);
    }
    return item;
  }
}
