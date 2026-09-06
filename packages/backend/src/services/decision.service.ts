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
import { DeltaService } from './delta.service.js';
import { KnowledgeGraphService } from './knowledgeGraph.service.js';
import { RetrievalBeforeAskService } from './retrievalBeforeAsk.service.js';

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
  private knowledgeGraphService: KnowledgeGraphService;
  private retrievalBeforeAskService: RetrievalBeforeAskService;
  private static casesCache: Map<string, CaseSessionState> = new Map();

  constructor(
    aiProvider?: IAiProvider,
    knowledgeGraphService?: KnowledgeGraphService,
    retrievalBeforeAskService?: RetrievalBeforeAskService
  ) {
    this.aiProvider = aiProvider || AiProviderFactory.getProvider();
    this.knowledgeGraphService = knowledgeGraphService || new KnowledgeGraphService();
    this.retrievalBeforeAskService = retrievalBeforeAskService || new RetrievalBeforeAskService(this.knowledgeGraphService);
  }

  getKnowledgeGraphService(): KnowledgeGraphService {
    return this.knowledgeGraphService;
  }

  getRetrievalBeforeAskService(): RetrievalBeforeAskService {
    return this.retrievalBeforeAskService;
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

    if (this.aiProvider.extractCognitiveEngine) {
      const cognitiveResult = await this.aiProvider.extractCognitiveEngine(rawCapture);
      humanDimensions = cognitiveResult.humanDimensions || humanDimensions;

      epistemicState = {
        caseId,
        userId: dto.userId,
        ...cognitiveResult.epistemicState,
        humanDimensions,
        extractedAt: now
      };

      const isQuickFriction = dto.frictionLevel === 'quick';
      const shouldIntervene = isQuickFriction 
        ? false 
        : (cognitiveResult.illuminationQuestion.shouldIntervene ?? (cognitiveResult.illuminationQuestion.strategy !== 'no_intervention'));

      bespokeQuestion = {
        id: `illum-${caseId}`,
        caseId,
        strategy: cognitiveResult.illuminationQuestion.strategy,
        questionText: cognitiveResult.illuminationQuestion.questionText,
        triggerReason: cognitiveResult.illuminationQuestion.triggerReason,
        shouldIntervene,
        expectedReflectionValue: cognitiveResult.illuminationQuestion.expectedReflectionValue ?? 0.8,
        smartSilenceMessage: cognitiveResult.illuminationQuestion.smartSilenceMessage || (isQuickFriction ? 'נבחר מסלול מהיר. השיקולים והמתח המרכזי נוסחו במראה ללא התערבות נוספת.' : undefined),
        responseWidget: cognitiveResult.illuminationQuestion.responseWidget || 'text',
        responseOptions: cognitiveResult.illuminationQuestion.responseOptions,
        isSecondary: false,
        canSkip: true,
        createdAt: now
      };

      if (shouldIntervene && bespokeQuestion) {
        // Phase 3 & 4: Retrieval Before Ask check against Personal Memory
        const memoryCheck = await this.retrievalBeforeAskService.checkBeforeAsk(
          dto.userId,
          bespokeQuestion.questionText,
          rawCapture
        );

        if (memoryCheck.shouldConvertToConfirmation && memoryCheck.confirmationQuestion) {
          bespokeQuestion.questionText = memoryCheck.confirmationQuestion;
          bespokeQuestion.responseWidget = 'confirmation';
          bespokeQuestion.responseOptions = ['כן, עדיין תקף', 'לא, השתנה'];
          bespokeQuestion.triggerReason = 'המרת שאלת איסוף לשאלת אישור על בסיס זיכרון קיים (Retrieval Before Ask)';
        } else if (memoryCheck.canSuppressIntervention) {
          bespokeQuestion.shouldIntervene = false;
          bespokeQuestion.smartSilenceMessage = `המידע לגבי נתון זה כבר קיים בזיכרון האישי שלך ("${memoryCheck.knownAnswerFact}"). אין צורך בהתערבות נוספת.`;
        }
      }
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
      centralTension: humanDimensions.centralTension,
      keyHinge: humanDimensions.keyHinge,
      aiInterventionUsed: bespokeQuestion?.shouldIntervene !== false ? (bespokeQuestion?.questionText || extracted.illuminationQuestion) : undefined,
      refinedInsight: undefined,
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
      illuminationQuestion: bespokeQuestion 
        ? (bespokeQuestion.shouldIntervene === false ? (bespokeQuestion.smartSilenceMessage || bespokeQuestion.questionText) : bespokeQuestion.questionText)
        : extracted.illuminationQuestion,
      epistemicState,
      bespokeQuestion,
      humanDimensions,
      refinedInsight: undefined
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
    if (updates.centralTension) session.decisionCase.centralTension = updates.centralTension;
    if (updates.keyHinge) session.decisionCase.keyHinge = updates.keyHinge;

    session.decisionCase.updatedAt = Date.now();
    return session.decisionCase;
  }

  async recordMirrorFeedback(
    caseId: string,
    feedback: 'accurate' | 'inaccurate'
  ): Promise<DecisionCase> {
    const session = DecisionService.casesCache.get(caseId);
    if (!session) {
      throw new Error(`Case ${caseId} not found.`);
    }

    session.decisionCase.mirrorFeedback = feedback;
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

    const deltaService = new DeltaService(this.aiProvider);
    const deltaResult = await deltaService.computeDelta({
      rawCapture: session?.decisionCase.rawCaptureText || '',
      humanDimensions: session?.humanDimensions || {
        consideration: session?.decisionCase.dimConsideration || '',
        goalsPrices: session?.decisionCase.dimGoalsPrices || '',
        facts: session?.decisionCase.dimFacts || '',
        assumptions: session?.decisionCase.dimAssumptions || '',
        missingInfo: session?.decisionCase.dimMissingInfo || ''
      },
      illuminationQuestion: session?.illuminationQuestion || '',
      userAnswer,
      isSkip: skip
    });

    const refinedInsight: RefinedInsight = deltaResult.refinedInsight;

    if (session) {
      session.decisionCase.nextStep = refinedInsight.chosenStep;
      session.decisionCase.refinedInsight = refinedInsight;
      session.refinedInsight = refinedInsight;
      session.decisionCase.status = 'decided';
      session.decisionCase.updatedAt = now;
      if (session.bespokeQuestion) {
        session.bespokeQuestion.userResponseText = skip ? '[דלג / מספיק לי לעכשיו]' : userAnswer;
        session.bespokeQuestion.respondedAt = now;
      }

      // Phase 3 & 4: Create Frozen Decision Snapshot to prevent hindsight bias
      await this.knowledgeGraphService.createFrozenSnapshot(caseId, session.decisionCase.userId, {
        knownFactsAtTime: [session.decisionCase.dimFacts || ''],
        assumptionsAtTime: [session.decisionCase.dimAssumptions || ''],
        unknownsAtTime: [session.decisionCase.dimMissingInfo || ''],
        chosenStep: refinedInsight.chosenStep
      });

      // Save user stated facts into Knowledge Graph
      if (!skip && userAnswer.trim().length > 3) {
        await this.knowledgeGraphService.saveAssertion({
          id: `asrt-${caseId}-${now}`,
          userId: session.decisionCase.userId,
          caseId,
          statement: userAnswer.trim(),
          sourceType: 'user_stated',
          timestamp: now,
          confidenceLevel: 95,
          createdAt: now
        });
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
