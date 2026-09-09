import { CognitiveTracker } from '@echo/shared';
import { generateCognitiveProfile } from '../services/insightsService.js';

export interface FirestoreEvent<T = any> {
  data?: {
    before?: { data: () => T };
    after?: { data: () => T };
  } | { data: () => T };
  params: {
    userId: string;
    decisionId: string;
  };
}

export interface InMemoryUserStore {
  getUserTracker: (userId: string) => Promise<CognitiveTracker>;
  updateUserTracker: (userId: string, tracker: CognitiveTracker) => Promise<void>;
}

// Default in-memory tracker store for test and service continuity
const memoryTrackers = new Map<string, CognitiveTracker>();

export const defaultTrackerStore: InMemoryUserStore = {
  getUserTracker: async (userId: string) => {
    return memoryTrackers.get(userId) || {
      captures_since_last_update: 0,
      closures_since_last_update: 0,
      last_updated_at: Date.now()
    };
  },
  updateUserTracker: async (userId: string, tracker: CognitiveTracker) => {
    memoryTrackers.set(userId, tracker);
  }
};

/**
 * Handle decision capture event (increments capture counter, triggers profile generation at 3)
 */
export async function handleDecisionCaptured(
  userId: string,
  _decisionId: string,
  store: InMemoryUserStore = defaultTrackerStore
): Promise<{ updatedTracker: CognitiveTracker; triggeredNewProfile: boolean }> {
  const current = await store.getUserTracker(userId);
  let captures = current.captures_since_last_update + 1;
  let closures = current.closures_since_last_update;
  let triggered = false;

  if (captures >= 3) {
    captures = 0;
    closures = 0;
    triggered = true;
    generateCognitiveProfile(userId).catch(console.error);
  }

  const updatedTracker: CognitiveTracker = {
    captures_since_last_update: captures,
    closures_since_last_update: closures,
    last_updated_at: Date.now()
  };

  await store.updateUserTracker(userId, updatedTracker);
  return { updatedTracker, triggeredNewProfile: triggered };
}

/**
 * Handle outcome loop closed event (increments closure counter, triggers profile generation at 3)
 */
export async function handleOutcomeLoopClosed(
  userId: string,
  _decisionId: string,
  store: InMemoryUserStore = defaultTrackerStore
): Promise<{ updatedTracker: CognitiveTracker; triggeredNewProfile: boolean }> {
  const current = await store.getUserTracker(userId);
  let captures = current.captures_since_last_update;
  let closures = current.closures_since_last_update + 1;
  let triggered = false;

  if (closures >= 3) {
    captures = 0;
    closures = 0;
    triggered = true;
    generateCognitiveProfile(userId).catch(console.error);
  }

  const updatedTracker: CognitiveTracker = {
    captures_since_last_update: captures,
    closures_since_last_update: closures,
    last_updated_at: Date.now()
  };

  await store.updateUserTracker(userId, updatedTracker);
  return { updatedTracker, triggeredNewProfile: triggered };
}
