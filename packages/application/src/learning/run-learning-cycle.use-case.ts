import { ok, isOk, err, type Result } from '@innovation-os/shared/result'
import { validationError } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type {
  KnowledgeFactRepository,
  KnowledgeGraphRepository,
  HypothesisRepository,
  EvidenceRequestRepository,
  ResearchPlanRepository,
  LearningCycleRepository,
} from '@innovation-os/knowledge/repository'
import {
  LearningCycle,
  type LearningCycleTrigger,
} from '@innovation-os/knowledge/learning'
import { StatisticalEvaluator } from '@innovation-os/knowledge/research'
import type { ResearchTrace, EvidenceEvaluator } from '@innovation-os/knowledge/research'
import { InitiateReasoningCycleUseCase } from '../reasoning/initiate-reasoning-cycle.use-case.js'
import { ConductResearchUseCase } from '../research/conduct-research.use-case.js'
import type { SourcePlanner } from './source-planner.js'
import { RoundRobinSourcePlanner } from './source-planner.js'
import type { KnowledgeSourcePort } from '../research/knowledge-source-port.js'

export type RunLearningCycleInput = {
  readonly theme: string
  readonly trigger: LearningCycleTrigger
  /** Max number of EvidenceRequests to research in one cycle (default: 5) */
  readonly maxResearch?: number
}

export type RunLearningCycleOutput = {
  readonly cycle: LearningCycle
  readonly traces: readonly ResearchTrace[]
  readonly hypothesesCount: number
  readonly researchedCount: number
  readonly newKnowledgeCount: number
  readonly newQuestionsGenerated: number
}

/**
 * RunLearningCycleUseCase — Sprint 7 core capability.
 *
 * "閉じた知識システム" → "世界を調査する知識システム"
 *
 * This use case orchestrates a complete learning unit:
 *
 *   ① REASON
 *      InitiateReasoningCycle → generate Hypotheses + EvidenceRequests
 *      Record in LearningCycle: hypothesesCount
 *
 *   ② SELECT SOURCES
 *      SourcePlanner.selectSources(question) → which KnowledgeSources to query
 *      This step is traced in ResearchTrace as 'planner'
 *
 *   ③ ACQUIRE
 *      For each EvidenceRequest (up to maxResearch):
 *        For each selected source: KnowledgeSourcePort.acquire()
 *        Merge all collected facts (deduped by id)
 *      Record in LearningCycle: researchPlanIds, collectedEvidenceIds
 *
 *   ④ EVALUATE + INTEGRATE
 *      EvidenceEvaluator.evaluate() → verdict
 *      Update Hypothesis lifecycle (markSupported / markRefuted)
 *      Save new facts to KnowledgeFactRepository + KnowledgeGraph
 *      Record KnowledgeChanges in LearningCycle
 *
 *   ⑤ RE-REASON
 *      Run InitiateReasoningCycle AGAIN on the UPDATED graph
 *      The new questions that appear are the proof of active learning:
 *        "Updated knowledge raised N new questions"
 *      Record in LearningCycle: newQuestionsGenerated
 *      Record in ResearchTrace: 'new_questions' step
 *
 *   ⑥ COMPLETE
 *      LearningCycle.complete()
 *      Persist in LearningCycleRepository
 *
 * Capability proof (Sprint 7 review criterion):
 *   cycle.isActivelyLearning() === true
 *   Meaning: the system both changed its knowledge AND generated new questions
 *   without human input.
 *
 * Pluggable:
 *   SourcePlanner   — swap routing strategy without touching this class
 *   EvidenceEvaluator — swap epistemology without touching this class
 *
 * This is not research-as-information-retrieval.
 * This is active knowledge acquisition and self-directed learning.
 */
export class RunLearningCycleUseCase {
  private readonly reasoningUseCase: InitiateReasoningCycleUseCase
  private readonly sourcePlanner: SourcePlanner
  private readonly evaluator: EvidenceEvaluator
  private readonly maxResearch: number

  constructor(
    private readonly factRepo: KnowledgeFactRepository,
    private readonly graphRepo: KnowledgeGraphRepository,
    private readonly hypothesisRepo: HypothesisRepository,
    private readonly evidenceRequestRepo: EvidenceRequestRepository,
    private readonly planRepo: ResearchPlanRepository,
    private readonly cycleRepo: LearningCycleRepository,
    sources: readonly KnowledgeSourcePort[],
    options?: {
      sourcePlanner?: SourcePlanner
      evaluator?: EvidenceEvaluator
      maxResearch?: number
    },
  ) {
    this.reasoningUseCase = new InitiateReasoningCycleUseCase(
      graphRepo,
      hypothesisRepo,
      evidenceRequestRepo,
    )
    this.sourcePlanner = options?.sourcePlanner ?? new RoundRobinSourcePlanner(sources)
    this.evaluator = options?.evaluator ?? new StatisticalEvaluator()
    this.maxResearch = options?.maxResearch ?? 5
  }

  async execute(input: RunLearningCycleInput): Promise<Result<RunLearningCycleOutput, AppError>> {
    if (!input.theme.trim()) {
      return err(validationError('RunLearningCycle: theme must not be empty'))
    }

    let cycle = LearningCycle.start(input.theme, input.trigger)
    const traces: ResearchTrace[] = []

    // ── ① REASON ────────────────────────────────────────────────────────
    const reasonResult = await this.reasoningUseCase.execute({ theme: input.theme })
    if (!isOk(reasonResult)) return reasonResult

    const { hypotheses, evidenceRequests } = reasonResult.value
    cycle = cycle.recordHypotheses(hypotheses.length)
    await this.cycleRepo.save(cycle)

    // ── ② + ③ + ④ SOURCE SELECT → ACQUIRE → EVALUATE → INTEGRATE ──────
    const openRequests = evidenceRequests.slice(0, this.maxResearch)
    let researchedCount = 0

    for (const evidenceRequest of openRequests) {
      // ② SELECT SOURCES
      // Use requestType as the QuestionHint for source planning.
      // ConductResearchUseCase handles full decomposition internally — we avoid double-decompose.
      const selectedSources = this.sourcePlanner.selectSources({
        questionType: evidenceRequest.requestType,
        searchTerms: [evidenceRequest.generateQuestion()],
      })
      if (selectedSources.length === 0) continue

      const primarySource = selectedSources[0]!
      const conductUseCase = new ConductResearchUseCase(
        this.factRepo,
        this.graphRepo,
        this.hypothesisRepo,
        this.evidenceRequestRepo,
        this.planRepo,
        primarySource,
        this.evaluator,
      )

      const conductResult = await conductUseCase.execute({
        evidenceRequestId: evidenceRequest.id,
        theme: input.theme,
      })
      if (!isOk(conductResult)) continue

      const { plan: completedPlan, collectedFacts, evaluation, newFactsAdded, trace: conductTrace } = conductResult.value

      // The conductTrace already contains question → search → evidence → evaluation → decision.
      // We annotate it with a 'planner' step by prepending metadata about source selection.
      // Sprint 7: the planner step is recorded as the first entry in the trace.
      const enrichedTrace = conductTrace.record('planner', `SourcePlanner selected ${selectedSources.length} source(s) before research`, {
        selectedSources: selectedSources.map((s) => s.sourceName).join(', '),
        questionType: evidenceRequest.requestType,
        plannerType: this.sourcePlanner.constructor.name,
      })

      traces.push(enrichedTrace)
      researchedCount++

      // Record in cycle
      cycle = cycle.recordResearchPlan(completedPlan.id)
      cycle = cycle.recordEvidence(collectedFacts.map((f) => f.id))

      if (evaluation.verdict === 'supported') {
        for (const fact of evaluation.supportingFacts) {
          cycle = cycle.recordKnowledgeChange({
            factId: fact.id,
            changeType: 'confirmed',
            reason: `Supported hypothesis via ${this.evaluator.evaluatorType} evaluation`,
          })
        }
      } else if (evaluation.verdict === 'refuted') {
        for (const fact of evaluation.refutingFacts) {
          cycle = cycle.recordKnowledgeChange({
            factId: fact.id,
            changeType: 'refuted',
            reason: `Refuted hypothesis via ${this.evaluator.evaluatorType} evaluation`,
          })
        }
      }

      // Track genuinely new facts added
      if (newFactsAdded > 0) {
        for (const fact of collectedFacts.slice(0, newFactsAdded)) {
          cycle = cycle.recordKnowledgeChange({
            factId: fact.id,
            changeType: 'added',
            reason: `Acquired via ${primarySource.sourceName}`,
          })
        }
      }

      await this.cycleRepo.save(cycle)
    }

    // ── ⑤ RE-REASON — what new questions does updated knowledge raise? ──
    const reReasonResult = await this.reasoningUseCase.execute({ theme: input.theme })
    const newQuestions: string[] = []

    if (isOk(reReasonResult)) {
      // New EvidenceRequests are those not in the original set
      const originalIds = new Set(evidenceRequests.map((er) => er.id))
      const genuinelyNew = reReasonResult.value.evidenceRequests.filter(
        (er) => !originalIds.has(er.id),
      )
      for (const er of genuinelyNew) {
        newQuestions.push(er.generateQuestion())
      }
    }

    cycle = cycle.recordNewQuestions(newQuestions)

    // Attach 'new_questions' step to the last trace, or create a standalone record
    if (newQuestions.length > 0) {
      const lastTrace = traces[traces.length - 1]
      if (lastTrace) {
        const updatedTrace = lastTrace.record(
          'new_questions',
          `Re-reasoning generated ${newQuestions.length} new question(s)`,
          { count: newQuestions.length, questions: newQuestions.slice(0, 3).join(' | ') },
        )
        traces[traces.length - 1] = updatedTrace.complete()
      }
    }

    // ── ⑥ COMPLETE ───────────────────────────────────────────────────────
    cycle = cycle.complete()
    await this.cycleRepo.save(cycle)

    return ok({
      cycle,
      traces,
      hypothesesCount: hypotheses.length,
      researchedCount,
      newKnowledgeCount: cycle.totalKnowledgeChanges,
      newQuestionsGenerated: newQuestions.length,
    })
  }
}
