import { FiveHumanDimensions, RefinedInsight } from '@echo/shared';
import { IAiProvider } from '../ai/provider.interface.js';
import { AiProviderFactory } from '../ai/factory.js';
import { DeltaAnalysisResult } from '../prompts/delta-engine.prompt.js';

export interface DeltaComputeParams {
  rawCapture: string;
  humanDimensions: FiveHumanDimensions;
  illuminationQuestion: string;
  userAnswer: string;
  isSkip?: boolean;
}

export class DeltaService {
  private aiProvider: IAiProvider;

  constructor(aiProvider?: IAiProvider) {
    this.aiProvider = aiProvider || AiProviderFactory.getProvider();
  }

  async computeDelta(params: DeltaComputeParams): Promise<DeltaAnalysisResult> {
    const isSkip = Boolean(params.isSkip || !params.userAnswer || params.userAnswer.trim().length === 0);

    if (this.aiProvider.extractDelta) {
      return await this.aiProvider.extractDelta(
        params.rawCapture,
        params.humanDimensions,
        params.illuminationQuestion,
        params.userAnswer,
        isSkip
      );
    }

    // Fallback deterministic Delta if provider does not implement extractDelta
    if (isSkip) {
      return {
        refinedInsight: {
          before: params.humanDimensions.consideration || params.rawCapture.slice(0, 80),
          now: 'נשמר המצב המקורי ללא הרחבה נוספת',
          chosenStep: 'שמירה והמשך מעקב'
        },
        userOwnershipVerified: true,
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
