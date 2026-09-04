import {
  DecisionCase,
  Statement,
  Option,
  DecisionSignature,
  EvaluationContract,
  Outcome,
  EpistemicState,
  IlluminationQuestion
} from '@echo/shared';
import { AiProviderFactory } from '../ai/factory.js';
import { IAiProvider } from '../ai/provider.interface.js';

export interface CreateCaseDTO {
  userId: string;
  rawText: string;
  rawAudioPath?: string;
  eraId?: string;
}

export interface CaseSessionState {
  decisionCase: DecisionCase;
  statements: Statement[];
  options: Option[];
  signature: DecisionSignature;
  illuminationQuestion: string;
  epistemicState?: EpistemicState;
  bespokeQuestion?: IlluminationQuestion;
}

export class DecisionService {
  private aiProvider: IAiProvider;

  constructor(aiProvider?: IAiProvider) {
    this.aiProvider = aiProvider || AiProviderFactory.getProvider();
  }

  async createCase(dto: CreateCaseDTO): Promise<CaseSessionState> {
    const caseId = `dc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();

    // 1. Freeze raw state immediately (Rule #1 of Truth: Raw source is never rewritten)
    const rawCapture = dto.rawText;
    const frozenAt = now;

    // 2. Call Model-Agnostic Epistemic Extraction
    const extracted = await this.aiProvider.extractEpistemicSchema(rawCapture);

    // 3. Construct Canonical Decision Case
    const decisionCase: DecisionCase = {
      id: caseId,
      userId: dto.userId,
      eraId: dto.eraId,
      title: extracted.title,
      status: 'deliberating',
      family: extracted.family,
      contextStakes: extracted.contextStakes,
      contextReversibility: extracted.contextReversibility,
      contextTimePressure: extracted.contextTimePressure,
      rawCaptureText: rawCapture,
      rawAudioPath: dto.rawAudioPath,
      frozenAt,
      createdAt: now,
      updatedAt: now
    };

    // 4. Construct Atomic Statements
    const statements: Statement[] = [
      {
        id: `stmt-${now}-goal`,
        caseId,
        userId: dto.userId,
        text: extracted.goal,
        role: 'goal',
        provenanceSource: 'inferred_by_ai',
        confidenceScore: 0.95,
        createdAt: now
      },
      ...extracted.statements.map((s, idx) => ({
        id: `stmt-${now}-${idx}`,
        caseId,
        userId: dto.userId,
        text: s.text,
        role: s.role,
        provenanceSource: 'inferred_by_ai' as const,
        confidenceScore: s.confidenceScore,
        createdAt: now
      }))
    ];

    // 5. Construct Options
    const options: Option[] = extracted.options.map((optTitle, idx) => ({
      id: `opt-${now}-${idx}`,
      caseId,
      userId: dto.userId,
      title: optTitle,
      origin: 'proposed_by_user',
      wasSelected: false,
      createdAt: now
    }));

    // 6. Construct Decision Signature
    const signature: DecisionSignature = {
      id: `sig-${caseId}`,
      caseId,
      userId: dto.userId,
      commitmentGradient: extracted.signature.commitmentGradient,
      informationCostRatio: extracted.signature.informationCostRatio,
      reversibilityDecayDays: extracted.signature.reversibilityDecayDays,
      principalAgentTension: extracted.signature.principalAgentTension,
      decisionTempo: extracted.signature.decisionTempo
    };

    // 7. Extract Cognitive Engine (9 Dimensions & Bespoke Illumination) if supported
    let epistemicState: EpistemicState | undefined;
    let bespokeQuestion: IlluminationQuestion | undefined;

    if (this.aiProvider.extractCognitiveEngine) {
      const cognitiveResult = await this.aiProvider.extractCognitiveEngine(rawCapture);
      epistemicState = {
        caseId,
        userId: dto.userId,
        ...cognitiveResult.epistemicState,
        extractedAt: now
      };
      bespokeQuestion = {
        id: `illum-${caseId}`,
        caseId,
        strategy: cognitiveResult.illuminationQuestion.strategy,
        questionText: cognitiveResult.illuminationQuestion.questionText,
        triggerReason: cognitiveResult.illuminationQuestion.triggerReason,
        isSecondary: false,
        createdAt: now
      };
    }

    return {
      decisionCase,
      statements,
      options,
      signature,
      illuminationQuestion: bespokeQuestion ? bespokeQuestion.questionText : extracted.illuminationQuestion,
      epistemicState,
      bespokeQuestion
    };
  }
}
