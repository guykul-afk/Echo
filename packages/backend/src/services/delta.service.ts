import { FiveHumanDimensions, RefinedInsight } from '@echo/shared';
import { IAiProvider } from '../ai/provider.interface.js';
import { AiProviderFactory } from '../ai/factory.js';
import { DeltaAnalysisResult } from '../prompts/delta-engine.prompt.js';

export interface DeltaComputeParams {
  rawCapture: string;
  humanDimensions: FiveHumanDimensions;
  illuminationQuestion: string;
  historicalQuestion?: string;
  userAnswer: string;
  isSkip?: boolean;
}

export class DeltaService {
  private aiProvider: IAiProvider;

  constructor(aiProvider?: IAiProvider) {
    this.aiProvider = aiProvider || AiProviderFactory.getProvider();
  }

  async computeDelta(params: DeltaComputeParams): Promise<DeltaAnalysisResult> {
    const isExplicitNonAnswer = Boolean(
      params.isSkip ||
      !params.userAnswer ||
      params.userAnswer.trim().length === 0 ||
      params.userAnswer.includes('[דילוג') ||
      params.userAnswer.includes('[נטישה')
    );

    if (this.aiProvider.extractDelta) {
      return await this.aiProvider.extractDelta(
        params.rawCapture,
        params.humanDimensions,
        params.illuminationQuestion,
        params.userAnswer,
        isExplicitNonAnswer,
        params.historicalQuestion
      );
    }

    // Fallback deterministic Delta if provider does not implement extractDelta
    if (isExplicitNonAnswer) {
      return {
        refinedInsight: null,
        userOwnershipVerified: false,
        changedAssumptions: [],
        newFacts: [],
        resolvedUnknowns: []
      };
    }

    return {
      refinedInsight: {
        before: params.humanDimensions.consideration || params.rawCapture.slice(0, 80),
        now: `התחדד מתוך התשובה: ${params.userAnswer.slice(0, 80)}`,
        chosenStep: params.userAnswer.slice(0, 100)
      },
      userOwnershipVerified: true,
      changedAssumptions: [],
      newFacts: [params.userAnswer],
      resolvedUnknowns: []
    };
  }
}
