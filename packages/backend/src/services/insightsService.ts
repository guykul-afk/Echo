import { CognitiveProfile } from '@echo/shared';

// In-memory or remote profile store
const latestProfiles = new Map<string, CognitiveProfile>();

export async function generateCognitiveProfile(userId: string): Promise<CognitiveProfile> {
  // In a full cloud setup, this queries the decision documents or LLM provider
  const profile: CognitiveProfile = {
    binary_trap_percentage: 80,
    third_way_success_rate: 75,
    risk_asymmetry_summary: 'Conservative in capital and contracts (Extremistan aversion), daring in health and somatic risk',
    unclosed_loops_count: 18,
    updated_at: Date.now()
  };

  latestProfiles.set(userId, profile);
  return profile;
}

export async function getLatestCognitiveProfile(userId: string): Promise<CognitiveProfile | undefined> {
  return latestProfiles.get(userId) || {
    binary_trap_percentage: 80,
    third_way_success_rate: 75,
    risk_asymmetry_summary: 'Conservative in capital and contracts (Extremistan aversion), daring in health and somatic risk',
    unclosed_loops_count: 18,
    updated_at: Date.now()
  };
}
