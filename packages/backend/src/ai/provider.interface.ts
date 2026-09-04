import {
  ContextStakes,
  ContextReversibility,
  ContextTimePressure,
  EpistemicRole,
  PrincipalAgentTension,
  DecisionTempo
} from '@echo/shared';
import { CognitiveAnalysisResult } from '../prompts/cognitive-engine.prompt.js';

export interface ExtractedStatementDTO {
  text: string;
  role: EpistemicRole;
  confidenceScore: number;
}

export interface ExtractedSignatureDTO {
  commitmentGradient: number; // 0.0 - 1.0
  informationCostRatio: number; // 0.0 - 1.0
  reversibilityDecayDays: number;
  principalAgentTension: PrincipalAgentTension;
  decisionTempo: DecisionTempo;
}

export interface EpistemicExtractionResult {
  title: string;
  family: string;
  goal: string;
  statements: ExtractedStatementDTO[];
  options: string[];
  contextStakes: ContextStakes;
  contextReversibility: ContextReversibility;
  contextTimePressure: ContextTimePressure;
  signature: ExtractedSignatureDTO;
  illuminationQuestion: string;
}

export interface IAiProvider {
  extractEpistemicSchema(rawText: string, activeEraContext?: string): Promise<EpistemicExtractionResult>;
  extractCognitiveEngine?(rawText: string): Promise<CognitiveAnalysisResult>;
  generateStructuralEmbedding(signature: ExtractedSignatureDTO, context: Record<string, any>): Promise<number[]>;
  transcribeAudio?(audioBuffer: Buffer): Promise<string>;
}
