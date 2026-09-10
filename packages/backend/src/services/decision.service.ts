import {
  DecisionCase,
  Statement,
  Option,
  DecisionSignature,
  EpistemicState,
  IlluminationQuestion,
  FiveHumanDimensions,
  FourHumanDimensions,
  RefinedInsight,
  RetrievalBeforeAskResult,
  DeepDecisionMechanisms
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
  userGender?: 'male' | 'female';
  userName?: string;
}

export interface CaseSessionState {
  decisionCase: DecisionCase;
  statements: Statement[];
  options: Option[];
  signature: DecisionSignature;
  illuminationQuestion: string;
  epistemicState?: EpistemicState;
  bespokeQuestion?: IlluminationQuestion;
  historicalQuestion?: IlluminationQuestion;
  humanDimensions?: FiveHumanDimensions;
  refinedInsight?: RefinedInsight;
  retrievalTelemetry?: RetrievalBeforeAskResult;
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

  private ensureString(val: any): string {
    if (!val) return '';
    if (Array.isArray(val)) return val.map(String).join('; ');
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
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
    let historicalQuestion: IlluminationQuestion | undefined;
    let memoryCheck: RetrievalBeforeAskResult | undefined;
    let deepMechanisms: DeepDecisionMechanisms | undefined;
    let humanDimensions: FiveHumanDimensions | undefined = extracted.fiveDimensions || (extracted.fourDimensions as FiveHumanDimensions);

    // Phase 2 (Adaptive Friction): Infer from commitmentGradient / rawCapture length if not explicitly passed
    const inputWords = rawCapture.trim().split(/\s+/).length;
    const gradient = extracted.signature?.commitmentGradient ?? 0.5;
    
    let effectiveFriction: 'quick' | 'focused' | 'deep' = dto.frictionLevel || 'focused';
    if (!dto.frictionLevel) {
      if (gradient >= 0.85 || inputWords <= 7) {
        effectiveFriction = 'quick';
      } else if (inputWords >= 45 || (extracted.contextStakes === 'high' && extracted.contextReversibility === 'irreversible')) {
        effectiveFriction = 'deep';
      } else {
        effectiveFriction = 'focused';
      }
    }

    if (this.aiProvider.extractCognitiveEngine) {
      // Anti-repetitiveness: Retrieve up to 3 recent questions for this user to avoid trope repetition
      const recentQuestions: string[] = [];
      const pastSessions = Array.from(DecisionService.casesCache.values());
      for (let i = pastSessions.length - 1; i >= 0 && recentQuestions.length < 3; i--) {
        const s = pastSessions[i];
        if (s.decisionCase.userId === dto.userId && s.bespokeQuestion?.questionText && s.bespokeQuestion.shouldIntervene !== false) {
          recentQuestions.push(s.bespokeQuestion.questionText);
        }
      }

      const userGender = dto.userGender || (dto.userId.toLowerCase().includes('michal') ? 'female' : undefined);
      const cognitiveResult = await this.aiProvider.extractCognitiveEngine(
        rawCapture,
        recentQuestions,
        userGender ? { name: dto.userName || 'מיכל', gender: userGender } : undefined
      );
      humanDimensions = cognitiveResult.humanDimensions || humanDimensions;
      deepMechanisms = cognitiveResult.deepMechanisms;

      epistemicState = {
        caseId,
        userId: dto.userId,
        ...cognitiveResult.epistemicState,
        humanDimensions,
        extractedAt: now
      };

      // Phase 2 (Silence as a decision): Evaluate whether silence is warranted
      const missingInfoText = this.ensureString(humanDimensions?.missingInfo).trim();
      const isMissingInfoEmpty = !missingInfoText || 
        ['אין', 'אין מידע חסר', 'אין פערי מידע', 'הכל ברור', 'לא צוין', '-'].some(c => missingInfoText.includes(c));

      const isExplicitSilenceStrategy = cognitiveResult.illuminationQuestion.strategy === 'no_intervention' ||
        cognitiveResult.illuminationQuestion.shouldIntervene === false;

      let shouldIntervene = effectiveFriction === 'quick' ? false : !isExplicitSilenceStrategy;

      // Smart silence when unknowns are empty and situation is balanced (סעיף 14)
      if (shouldIntervene && isMissingInfoEmpty && (cognitiveResult.illuminationQuestion.expectedReflectionValue ?? 0.8) < 0.6) {
        shouldIntervene = false;
      }

      const silenceMessage = shouldIntervene 
        ? undefined
        : (effectiveFriction === 'quick'
            ? 'נבחר מסלול מהיר. השיקולים והמתח המרכזי נוסחו במראה ללא התערבות נוספת.'
            : 'תיארת את זה מאוזן. אין לי שאלה ששווה לעכב אותך בגללה.');

      // Question 1: שאלת הארה ראשית - ממוקדת בצורה ישירה ומדויקת בדילמה הנוכחית ובמלל שנלכד
      bespokeQuestion = {
        id: `illum-${caseId}`,
        caseId,
        strategy: cognitiveResult.illuminationQuestion.strategy,
        questionText: cognitiveResult.illuminationQuestion.questionText,
        triggerReason: cognitiveResult.illuminationQuestion.triggerReason,
        shouldIntervene,
        origin: 'current_dilemma',
        expectedReflectionValue: cognitiveResult.illuminationQuestion.expectedReflectionValue ?? 0.8,
        smartSilenceMessage: cognitiveResult.illuminationQuestion.smartSilenceMessage || silenceMessage,
        responseWidget: cognitiveResult.illuminationQuestion.responseWidget || 'text',
        responseOptions: cognitiveResult.illuminationQuestion.responseOptions,
        isSecondary: false,
        canSkip: true,
        createdAt: now
      };

      // Question 2: שאלת עבר מותנית - מופעלת אך ורק אם מזוהה צורך אמיתי (תקדים, סתירה, או הנחה שברירית מהעבר)
      if (shouldIntervene) {
        memoryCheck = await this.retrievalBeforeAskService.checkBeforeAsk(
          dto.userId,
          bespokeQuestion.questionText,
          rawCapture,
          deepMechanisms
        );

        const hasContradiction = Boolean(memoryCheck.contradictingAssertions && memoryCheck.contradictingAssertions.length > 0);
        const hasDirectPrecedent = Boolean(memoryCheck.shouldConvertToConfirmation && memoryCheck.knownAnswerFact);
        const hasRelevantHistoricalPreamble = Boolean(memoryCheck.memoryPreamble && memoryCheck.assertions.length > 0);

        if (hasContradiction) {
          historicalQuestion = {
            id: `illum-hist-${caseId}`,
            caseId,
            strategy: 'contradiction_dissonance',
            origin: 'historical_precedent',
            questionText: `${memoryCheck.memoryPreamble} כיצד אתה רואה את ההבדל בהחלטה זו?`,
            triggerReason: 'זוהה דיסוננס או סתירה מהחלטות קודמות',
            shouldIntervene: true,
            isSecondary: true,
            canSkip: true,
            responseWidget: 'text',
            createdAt: now
          };
        } else if (hasDirectPrecedent) {
          historicalQuestion = {
            id: `illum-hist-${caseId}`,
            caseId,
            strategy: 'outcome_contract_anchor',
            origin: 'historical_precedent',
            questionText: memoryCheck.confirmationQuestion || `בעבר ציינת לגבי נושא דומה: "${memoryCheck.knownAnswerFact}". האם לקח זה רלוונטי גם לדילמה הנוכחית?`,
            triggerReason: 'זוהה תקדים עבר ישיר בנושא דומה',
            shouldIntervene: true,
            isSecondary: true,
            canSkip: true,
            responseWidget: 'confirmation',
            responseOptions: ['כן, לקח רלוונטי', 'לא, הנסיבות שונות'],
            createdAt: now
          };
        } else if (hasRelevantHistoricalPreamble) {
          historicalQuestion = {
            id: `illum-hist-${caseId}`,
            caseId,
            strategy: 'outcome_contract_anchor',
            origin: 'historical_precedent',
            questionText: `${memoryCheck.memoryPreamble} האם יש כאן דפוס חוזר שכדאי לקחת בחשבון?`,
            triggerReason: 'הדהוד תקדים משיק מהעבר',
            shouldIntervene: true,
            isSecondary: true,
            canSkip: true,
            responseWidget: 'text',
            createdAt: now
          };
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
      frictionLevel: effectiveFriction || 'focused',
      dimConsideration: this.ensureString(humanDimensions.consideration),
      dimGoalsPrices: this.ensureString(humanDimensions.goalsPrices),
      dimFacts: this.ensureString(humanDimensions.facts),
      dimAssumptions: this.ensureString(humanDimensions.assumptions),
      dimMissingInfo: this.ensureString(humanDimensions.missingInfo),
      dimReliance: `${this.ensureString(humanDimensions.facts)} | ${this.ensureString(humanDimensions.assumptions)}`.trim(),
      dimUnknowns: this.ensureString(humanDimensions.missingInfo),
      centralTension: this.ensureString(humanDimensions.centralTension),
      keyHinge: this.ensureString(humanDimensions.keyHinge),
      aiInterventionUsed: bespokeQuestion?.shouldIntervene !== false ? (bespokeQuestion?.questionText || extracted.illuminationQuestion) : undefined,
      historicalInterventionUsed: historicalQuestion?.shouldIntervene !== false ? historicalQuestion?.questionText : undefined,
      refinedInsight: undefined,
      deepMechanisms,
      createdAt: now,
      updatedAt: now
    };

    // 4. Construct Atomic Statements
    const extractedStatements = Array.isArray(extracted.statements) ? extracted.statements : [];
    
    // Embed only assumptions to save time/cost
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
      }
    ];

    for (let idx = 0; idx < extractedStatements.length; idx++) {
      const s = extractedStatements[idx];
      let semanticEmbedding: number[] | undefined = undefined;
      
      if (s.role === 'assumption' && this.aiProvider.generateSemanticEmbedding) {
        semanticEmbedding = await this.aiProvider.generateSemanticEmbedding(s.text);
      }

      statements.push({
        id: `stmt-${now}-${idx}`,
        caseId,
        userId: dto.userId,
        text: s.text,
        role: s.role,
        provenanceSource: 'inferred_by_ai' as const,
        confidenceScore: s.confidenceScore || 0.9,
        createdAt: now,
        semanticEmbedding
      });
    }

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
    const signatureEmbedding = await this.aiProvider.generateStructuralEmbedding?.(extracted.signature, {}) || [];
    const signature: DecisionSignature = {
      id: `sig-${caseId}`,
      caseId,
      userId: dto.userId,
      commitmentGradient: extracted.signature?.commitmentGradient ?? 0.5,
      informationCostRatio: extracted.signature?.informationCostRatio ?? 0.5,
      reversibilityDecayDays: extracted.signature?.reversibilityDecayDays ?? 30,
      principalAgentTension: extracted.signature?.principalAgentTension ?? 'sole_actor',
      decisionTempo: extracted.signature?.decisionTempo ?? 'tactical_weeks',
      signatureEmbedding
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
      historicalQuestion,
      humanDimensions,
      refinedInsight: undefined,
      retrievalTelemetry: memoryCheck
    };

    DecisionService.casesCache.set(caseId, sessionState);

    // Index extracted assumptions and key hinge to Knowledge Graph for future cross-case retrieval
    if (humanDimensions?.assumptions) {
      const rawAssumptions = humanDimensions.assumptions;
      const assumptionsList: string[] = Array.isArray(rawAssumptions)
        ? (rawAssumptions as any[]).map(String)
        : typeof rawAssumptions === 'string'
        ? (rawAssumptions as string).split(/[;\n]/)
        : [];
      const cleanedAssumptions = assumptionsList
        .map(a => a.trim())
        .filter(a => a.length >= 6);
      for (let aIdx = 0; aIdx < cleanedAssumptions.length; aIdx++) {
        const stmtText = cleanedAssumptions[aIdx];
        const statement = stmtText.length > 120 ? stmtText.slice(0, 117) + '...' : stmtText;
        await this.knowledgeGraphService.saveAssertion({
          id: `asrt-${caseId}-assump-${aIdx}`,
          userId: dto.userId,
          caseId,
          statement,
          category: 'assumption',
          sourceType: 'ai_inferred',
          timestamp: now,
          confidenceLevel: 80,
          createdAt: now
        });
      }
    }
    if (decisionCase.keyHinge && decisionCase.keyHinge.length >= 8) {
      const statement = decisionCase.keyHinge.length > 120 ? decisionCase.keyHinge.slice(0, 117) + '...' : decisionCase.keyHinge;
      await this.knowledgeGraphService.saveAssertion({
        id: `asrt-${caseId}-hinge`,
        userId: dto.userId,
        caseId,
        statement,
        category: 'assumption',
        sourceType: 'ai_inferred',
        timestamp: now,
        confidenceLevel: 85,
        createdAt: now
      });
    }

    // Horizon 2: Index Deep Decision Mechanisms (Principles, Tradeoffs, Qualified Boundaries, Frameworks)
    if (deepMechanisms?.operatingPrinciples) {
      for (let pIdx = 0; pIdx < deepMechanisms.operatingPrinciples.length; pIdx++) {
        const pText = (deepMechanisms.operatingPrinciples[pIdx] || '').trim();
        if (pText.length >= 4) {
          const statement = pText.length > 120 ? pText.slice(0, 117) + '...' : pText;
          await this.knowledgeGraphService.saveAssertion({
            id: `asrt-${caseId}-principle-${pIdx}`,
            userId: dto.userId,
            caseId,
            statement,
            category: 'principle',
            sourceType: 'ai_inferred',
            timestamp: now,
            confidenceLevel: 85,
            createdAt: now
          });
        }
      }
    }

    if (deepMechanisms?.tradeoffs) {
      for (let tIdx = 0; tIdx < deepMechanisms.tradeoffs.length; tIdx++) {
        const tr = deepMechanisms.tradeoffs[tIdx];
        if (tr && tr.protectedValue && tr.sacrificedValue) {
          const statement = `שימור: ${tr.protectedValue} | ויתור: ${tr.sacrificedValue}`.slice(0, 120);
          await this.knowledgeGraphService.saveAssertion({
            id: `asrt-${caseId}-tradeoff-${tIdx}`,
            userId: dto.userId,
            caseId,
            statement,
            category: 'tradeoff',
            sourceType: 'ai_inferred',
            timestamp: now,
            confidenceLevel: 90,
            createdAt: now
          });
        }
      }
    }

    if (deepMechanisms?.boundaryConditions) {
      for (let bIdx = 0; bIdx < deepMechanisms.boundaryConditions.length; bIdx++) {
        const bc = deepMechanisms.boundaryConditions[bIdx];
        if (bc && bc.targetAssertion) {
          const statement = bc.targetAssertion.slice(0, 120);
          await this.knowledgeGraphService.saveAssertion({
            id: `asrt-${caseId}-cond-${bIdx}`,
            userId: dto.userId,
            caseId,
            statement,
            condition: bc.condition,
            category: 'assumption',
            sourceType: 'ai_inferred',
            timestamp: now,
            confidenceLevel: 85,
            createdAt: now
          });
        }
      }
    }

    if (deepMechanisms && (deepMechanisms.dominantEvidenceType || deepMechanisms.dilemmaTopology)) {
      const parts: string[] = [];
      if (deepMechanisms.dilemmaTopology) parts.push(`מבנה: ${deepMechanisms.dilemmaTopology}`);
      if (deepMechanisms.dominantEvidenceType) parts.push(`ראיה: ${deepMechanisms.dominantEvidenceType}`);
      if (deepMechanisms.decisionDriver) parts.push(`מניע: ${deepMechanisms.decisionDriver}`);
      if (parts.length > 0) {
        await this.knowledgeGraphService.saveAssertion({
          id: `asrt-${caseId}-mechanism`,
          userId: dto.userId,
          caseId,
          statement: parts.join(' | ').slice(0, 120),
          category: 'decision_mechanism',
          sourceType: 'ai_inferred',
          timestamp: now,
          confidenceLevel: 85,
          createdAt: now
        });
      }
    }

    return sessionState;
  }

  async updateMirror(caseId: string, updates: Partial<FiveHumanDimensions>, requestingUserId?: string): Promise<DecisionCase> {
    const session = DecisionService.casesCache.get(caseId);
    if (!session) {
      throw new Error(`Case ${caseId} not found.`);
    }
    if (requestingUserId && session.decisionCase.userId && session.decisionCase.userId !== requestingUserId) {
      throw new Error(`PERMISSION_DENIED: User ${requestingUserId} cannot access data belonging to ${session.decisionCase.userId}.`);
    }

    if (updates.consideration) session.decisionCase.dimConsideration = this.ensureString(updates.consideration);
    if (updates.goalsPrices) session.decisionCase.dimGoalsPrices = this.ensureString(updates.goalsPrices);
    if (updates.facts) {
      session.decisionCase.dimFacts = this.ensureString(updates.facts);
      const factStr = session.decisionCase.dimFacts;
      const statement = factStr.length > 120 ? factStr.slice(0, 117) + '...' : factStr;
      await this.knowledgeGraphService.saveAssertion({
        id: `asrt-${caseId}-fact-${Date.now()}`,
        userId: session.decisionCase.userId,
        caseId,
        statement,
        category: 'fact',
        sourceType: 'user_confirmed',
        timestamp: Date.now(),
        confidenceLevel: 95,
        confirmedCount: 1,
        lastConfirmedAt: Date.now(),
        createdAt: Date.now()
      });
    }
    if (updates.assumptions) {
      session.decisionCase.dimAssumptions = this.ensureString(updates.assumptions);
      const assumpStr = session.decisionCase.dimAssumptions;
      const statement = assumpStr.length > 120 ? assumpStr.slice(0, 117) + '...' : assumpStr;
      await this.knowledgeGraphService.saveAssertion({
        id: `asrt-${caseId}-user-assump-${Date.now()}`,
        userId: session.decisionCase.userId,
        caseId,
        statement,
        category: 'assumption',
        sourceType: 'user_confirmed',
        timestamp: Date.now(),
        confidenceLevel: 95,
        confirmedCount: 1,
        lastConfirmedAt: Date.now(),
        createdAt: Date.now()
      });
    }
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
    feedback: 'accurate' | 'inaccurate',
    requestingUserId?: string
  ): Promise<DecisionCase> {
    const session = DecisionService.casesCache.get(caseId);
    if (!session) {
      throw new Error(`Case ${caseId} not found.`);
    }
    if (requestingUserId && session.decisionCase.userId && session.decisionCase.userId !== requestingUserId) {
      throw new Error(`PERMISSION_DENIED: User ${requestingUserId} cannot access data belonging to ${session.decisionCase.userId}.`);
    }

    session.decisionCase.mirrorFeedback = feedback;
    session.decisionCase.updatedAt = Date.now();
    return session.decisionCase;
  }

  async submitDeliberationAnswer(
    caseId: string,
    userAnswer: string,
    skip: boolean = false,
    requestingUserId?: string
  ): Promise<{ success: boolean; refinedInsight: RefinedInsight | null; nextStep: string | null }> {
    const session = DecisionService.casesCache.get(caseId);
    if (session && requestingUserId && session.decisionCase.userId && session.decisionCase.userId !== requestingUserId) {
      throw new Error(`PERMISSION_DENIED: User ${requestingUserId} cannot access data belonging to ${session.decisionCase.userId}.`);
    }
    const now = Date.now();

    const isNonCollaboration = Boolean(
      skip ||
      !userAnswer ||
      userAnswer.trim().length === 0 ||
      userAnswer.includes('[דילוג') ||
      userAnswer.includes('[נטישה')
    );

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
      isSkip: isNonCollaboration
    });

    const refinedInsight: RefinedInsight | null = deltaResult.refinedInsight;
    const chosenStep: string | null = (refinedInsight && refinedInsight.chosenStep) ? refinedInsight.chosenStep : null;

    if (session) {
      session.decisionCase.nextStep = chosenStep || undefined;
      session.decisionCase.refinedInsight = refinedInsight;
      session.refinedInsight = refinedInsight || undefined;
      session.decisionCase.status = isNonCollaboration ? 'skipped' : (refinedInsight ? 'decided' : 'deliberating');
      session.decisionCase.updatedAt = now;
      if (session.bespokeQuestion) {
        session.bespokeQuestion.userResponseText = skip ? '[דלג / מספיק לי לעכשיו]' : userAnswer;
        session.bespokeQuestion.respondedAt = now;
      }

      // Phase 3 & 4: Create Frozen Decision Snapshot to prevent hindsight bias ONLY if there is an actual chosen step
      if (chosenStep) {
        await this.knowledgeGraphService.createFrozenSnapshot(caseId, session.decisionCase.userId, {
          knownFactsAtTime: [session.decisionCase.dimFacts || ''],
          assumptionsAtTime: [session.decisionCase.dimAssumptions || ''],
          unknownsAtTime: [session.decisionCase.dimMissingInfo || ''],
          chosenStep
        });
      }

      // Phase 1 (Epistemic Safety): Handle confirmation feedback if this was a confirmation question
      if (session.bespokeQuestion?.responseWidget === 'confirmation') {
        const isConfirmed = userAnswer.includes('כן') || userAnswer.includes('תקף') || userAnswer.includes('נכון');
        const activeAssertions = await this.knowledgeGraphService.getActiveAssertionsByUser(session.decisionCase.userId);
        for (const ast of activeAssertions) {
          if (session.bespokeQuestion.questionText.includes(ast.statement.slice(0, 30))) {
            await this.knowledgeGraphService.recordAssertionConfirmation(session.decisionCase.userId, ast.id, isConfirmed);
          }
        }
      }

      // Phase 1 (Epistemic Safety): Atomic extraction into Knowledge Graph
      // NEVER save raw prose/answer. Save only newFacts, changedAssumptions, resolvedUnknowns (<= 120 chars each)
      // Strictly disabled if user skipped, abandoned, or if refinedInsight is null!
      if (!isNonCollaboration && refinedInsight !== null) {
        let savedCount = 0;
        const itemsToSave: { text: string; category: 'fact' | 'assumption' }[] = [
          ...(deltaResult.newFacts || []).map(f => ({ text: f, category: 'fact' as const })),
          ...(deltaResult.changedAssumptions || []).map(a => ({ text: a, category: 'assumption' as const })),
          ...(deltaResult.resolvedUnknowns || []).map(u => ({ text: u, category: 'fact' as const }))
        ];

        for (const item of itemsToSave) {
          const cleanText = (item.text || '').trim();
          if (cleanText.length >= 4) {
            const statement = cleanText.length > 120 ? cleanText.slice(0, 117) + '...' : cleanText;
            await this.knowledgeGraphService.saveAssertion({
              id: `asrt-${caseId}-${now}-${savedCount++}`,
              userId: session.decisionCase.userId,
              caseId,
              statement,
              category: item.category,
              sourceType: 'user_stated',
              timestamp: now,
              confidenceLevel: 90,
              createdAt: now
            });
          }
        }

        // Fallback: If Delta Engine returned no structured items, but user answer is a single crisp substantive sentence (<= 120 chars)
        const isPushbackOrMeta = userAnswer.includes('[') || userAnswer.includes('לא רלוונטי') || userAnswer.includes('כבר סגרתי');
        if (!isPushbackOrMeta && savedCount === 0 && userAnswer.trim().length >= 4 && userAnswer.trim().length <= 120) {
          await this.knowledgeGraphService.saveAssertion({
            id: `asrt-${caseId}-${now}-fallback`,
            userId: session.decisionCase.userId,
            caseId,
            statement: userAnswer.trim(),
            category: 'fact',
            sourceType: 'user_stated',
            timestamp: now,
            confidenceLevel: 85,
            createdAt: now
          });
        }
      }
    }

    return {
      success: true,
      refinedInsight,
      nextStep: chosenStep
    };
  }

  getCase(caseId: string, requestingUserId?: string): CaseSessionState | undefined {
    const session = DecisionService.casesCache.get(caseId);
    if (session && requestingUserId && session.decisionCase.userId && session.decisionCase.userId !== requestingUserId) {
      throw new Error(`PERMISSION_DENIED: User ${requestingUserId} cannot access data belonging to ${session.decisionCase.userId}.`);
    }
    return session;
  }
}
