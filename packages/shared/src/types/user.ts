export interface CognitiveTracker {
  captures_since_last_update: number;
  closures_since_last_update: number;
  last_updated_at: number; // epoch ms
}

export interface CognitiveProfile {
  binary_trap_percentage: number;
  third_way_success_rate: number;
  risk_asymmetry_summary: string;
  unclosed_loops_count: number;
  updated_at: number;
}

export interface User {
  id: string; // Firebase Auth UID
  email: string;
  createdAt: number; // epoch ms
  lastLoginAt?: number;
  cognitive_tracker?: CognitiveTracker;
}
