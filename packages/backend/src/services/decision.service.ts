import {
  DecisionCase,
  Statement,
  Option,
  DecisionSignature,
  EpistemicState,
  IlluminationQuestion,
  FiveHumanDimensions,
  FourHumanDimensions,
  RefinedInsight
} from '@echo/shared';
import { AiProviderFactory } from '../ai/factory.js';
import { IAiProvider } from '../ai/provider.interface.js';

export interface CreateCaseDTO {
  userId: string;
  rawText?: string;
  rawAudioBuffer?: Buffer;
  rawAudioPath?: string;
  mimeType?: string;
  eraId?: string;
  frictionLevel?: 'quick' | 'focused' | 'deep';
}

export interface CaseSessionState {
  decisionCase: DecisionCase;
  statements: Statement[];
  options: Option[];
  signature: DecisionSignature;
  illuminationQuestion: string;
  epistemicState?: EpistemicState;
  bespokeQuestion?: IlluminationQuestion;
  humanDimensions?: FiveHumanDimensions;
  refinedInsight?: RefinedInsight;
}

export class DecisionService {
  private aiProvider: IAiProvider;
  private static casesCache: Map<string, CaseSessionState> = new Map();

  constructor(aiProvider?: IAiProvider) {
    this.aiProvider = aiProvider || AiProviderFactory.getProvider();
  }

  async createCase(dto: CreateCaseDTO): Promise<CaseSessionState> {
    const caseId = `dc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();

    // 1. Audio Transcribe (if audio provided)
    let rawCapture = dto.rawText || '';
    if (!rawCapture && dto.rawAudioBuffer) {
      rawCapture = await this.aiProvider.transcribeAudio(dto.rawAudioBuffer, dto.mimeType || 'audio/mp3');
      if (!rawCapture || rawCapture.trim().length === 0) {
        throw new Error('UNCLEAR_AUDIO: Audio was unclear or contained no recognizable speech. No raw text was generated.');
      }
    }

    if (!rawCapture || rawCapture.trim().length === 0) {
      throw new Error('INVALID_ARGUMENT: Either rawText or valid rawAudioBuffer must be provided.');
    }

    const frozenAt = now;

    // 2. Cognitive Reasoning
    const extracted = await this.aiProvider.extractEpistemicSchema(rawCapture);

    let epistemicState: EpistemicState | undefined;
    let bespokeQuestion: IlluminationQuestion | undefined;
    let humanDimensions: FiveHumanDimensions | undefined = extracted.fiveDimensions || (extracted.fourDimensions as FiveHumanDimensions);
    let refinedInsight: RefinedInsight | undefined = extracted.refinedInsight;

    if (this.aiProvider.extractCognitiveEngine) {
      const cognitiveResult = await this.aiProvider.extractCognitiveEngine(rawCapture);
      humanDimensions = cognitiveResult.humanDimensions || humanDimensions;
      refinedInsight = cognitiveResult.refinedInsight || refinedInsight;

      epistemicState = {
        caseId,
        userId: dto.userId,
        ...cognitiveResult.epistemicState,
        humanDimensions,
        extractedAt: now
      };

      bespokeQuestion = {
        id: `illum-${caseId}`,
        caseId,
        strategy: cognitiveResult.illuminationQuestion.strategy,
        questionText: cognitiveResult.illuminationQuestion.questionText,
        triggerReason: cognitiveResult.illuminationQuestion.triggerReason,
        isSecondary: false,
        canSkip: true,
        createdAt: now
      };
    }

    // Default 5 Human Dimensions fallback if not extracted
    if (!humanDimensions) {
      const obs = extracted.statements.filter(s => s.role === 'observation').map(s => s.text).join(', ');
      const ass = extracted.statements.filter(s => s.role === 'assumption').map(s => s.text).join(', ');
      const unk = extracted.statements.filter(s => s.role === 'unknown').map(s => s.text).join(', ');

      humanDimensions = {
        consideration: extracted.title,
        goalsPrices: `הבנתי שחשוב לך: ${extracted.goal}`,
        facts: obs || 'נתונים שהוזנו בפועל',
        assumptions: ass || 'הנחות עבודה לגבי העתיד',
        missingInfo: unk || 'פערי מידע שטרם הובהרו'
      };
    }

    // 3. Construct Decision Case with 5 Human Dimensions & Adaptive Friction
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
      frictionLevel: dto.frictionLevel || 'focused',
      dimConsideration: humanDimensions.consideration,
      dimGoalsPrices: humanDimensions.goalsPrices,
      dimFacts: humanDimensions.facts,
      dimAssumptions: humanDimensions.assumptions,
      dimMissingInfo: humanDimensions.missingInfo,
      dimReliance: `${humanDimensions.facts || ''} | ${humanDimensions.assumptions || ''}`.trim(),
      dimUnknowns: humanDimensions.missingInfo,
      aiInterventionUsed: bespokeQuestion?.questionText || extracted.illuminationQuestion,
      refinedInsight,
      createdAt: now,
      updatedAt: now
    };

    // 4. Construct Atomic Statements
    const extractedStatements = Array.isArray(extracted.statements) ? extracted.statements : [];
    const statements: Statement[] = [
      {
        id: `stmt-${now}-goal`,
        caseId,
        userId: dto.userId,
        text: extracted.goal || 'קבלת החלטה מדויקת',
        role: 'goal',
        provenanceSource: 'inferred_by_ai',
        confidenceScore: 0.95,
        createdAt: now
      },
      ...extractedStatements.map((s, idx) => ({
        id: `stmt-${now}-${idx}`,
        caseId,
        userId: dto.userId,
        text: s.text,
        role: s.role,
        provenanceSource: 'inferred_by_ai' as const,
        confidenceScore: s.confidenceScore || 0.9,
        createdAt: now
      }))
    ];

    // 5. Construct Options
    const extractedOptions = Array.isArray(extracted.options) ? extracted.options : [];
    const options: Option[] = extractedOptions.map((optTitle, idx) => ({
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
      commitmentGradient: extracted.signature?.commitmentGradient ?? 0.5,
      informationCostRatio: extracted.signature?.informationCostRatio ?? 0.5,
      reversibilityDecayDays: extracted.signature?.reversibilityDecayDays ?? 30,
      principalAgentTension: extracted.signature?.principalAgentTension ?? 'sole_actor',
      decisionTempo: extracted.signature?.decisionTempo ?? 'tactical_weeks'
    };

    const sessionState: CaseSessionState = {
      decisionCase,
      statements,
      options,
      signature,
      illuminationQuestion: bespokeQuestion ? bespokeQuestion.questionText : extracted.illuminationQuestion,
      epistemicState,
      bespokeQuestion,
      humanDimensions,
      refinedInsight
    };

    DecisionService.casesCache.set(caseId, sessionState);
    return sessionState;
  }

  async updateMirror(caseId: string, updates: Partial<FiveHumanDimensions>): Promise<DecisionCase> {
    const session = DecisionService.casesCache.get(caseId);
    if (!session) {
      throw new Error(`Case ${caseId} not found.`);
    }

    if (updates.consideration) session.decisionCase.dimConsideration = updates.consideration;
    if (updates.goalsPrices) session.decisionCase.dimGoalsPrices = updates.goalsPrices;
    if (updates.facts) session.decisionCase.dimFacts = updates.facts;
    if (updates.assumptions) session.decisionCase.dimAssumptions = updates.assumptions;
    if (updates.missingInfo) session.decisionCase.dimMissingInfo = updates.missingInfo;
    if (updates.reliance) session.decisionCase.dimReliance = updates.reliance;
    if (updates.unknowns) session.decisionCase.dimUnknowns = updates.unknowns;

    session.decisionCase.updatedAt = Date.now();
    return session.decisionCase;
  }

  async submitDeliberationAnswer(
    caseId: string,
    userAnswer: string,
    skip: boolean = false
  ): Promise<{ success: boolean; refinedInsight: RefinedInsight; nextStep: string }> {
    const session = DecisionService.casesCache.get(caseId);
    const now = Date.now();

    const refinedInsight: RefinedInsight = session?.refinedInsight || {
      before: session?.decisionCase.dimConsideration || 'דילמה תחת אי-ודאות',
      now: skip ? 'נשמר המצב הקיים ללא הרחבה נוספת' : (userAnswer || 'התחדדו השיקולים המרכזיים'),
      chosenStep: skip ? 'שמירה והמשך מעקב' : (userAnswer.slice(0, 80) || 'בירור מקדים')
    };

    if (session) {
      session.decisionCase.nextStep = refinedInsight.chosenStep;
      session.decisionCase.refinedInsight = refinedInsight;
      session.decisionCase.status = 'decided';
      session.decisionCase.updatedAt = now;
      if (session.bespokeQuestion) {
        session.bespokeQuestion.userResponseText = skip ? '[דלג / מספיק לי לעכשיו]' : userAnswer;
        session.bespokeQuestion.respondedAt = now;
      }
    }

    return {
      success: true,
      refinedInsight,
      nextStep: refinedInsight.chosenStep
    };
  }

  getCase(caseId: string): CaseSessionState | undefined {
    return DecisionService.casesCache.get(caseId);
  }
}
