import { ok, isOk, err, type Result } from '@innovation-os/shared/result'
import { validationError } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type {
  KnowledgeFactRepository,
  KnowledgeGraphRepository,
  HypothesisRepository,
  EvidenceRequestRepository,
  ResearchPlanRepository,
} from '@innovation-os/knowledge/repository'
import type { EvidenceRequestId } from '@innovation-os/knowledge/reasoning'
import {
  ResearchPlan,
  EvidenceEvaluation,
  ResearchTrace,
  StatisticalEvaluator,
} from '@innovation-os/knowledge/research'
import type { EvidenceEvaluator } from '@innovation-os/knowledge/research'
import type { KnowledgeFact } from '@innovation-os/knowledge/fact'
import { ConfidenceScore } from '@innovation-os/knowledge/fact'
import { DecomposeQuestionUseCase } from './decompose-question.use-case.js'
import type { KnowledgeSourcePort } from './knowledge-source-port.js'

export type ConductResearchInput = {
  readonly evidenceRequestId: EvidenceRequestId
  readonly theme: string
}

export type ConductResearchOutput = {
  readonly plan: ResearchPlan
  readonly collectedFacts: readonly KnowledgeFact[]
  readonly evaluation: EvidenceEvaluation
  readonly newFactsAdded: number
  readonly hypothesisUpdated: boolean
  readonly trace: ResearchTrace
}

/**
 * ConductResearchUseCase — the full research pipeline for one EvidenceRequest.
 *
 * This is the Sprint 6 core capability:
 * "問いを解決するための調査計画を立て、実行し、知識を更新する"
 *
 * Five phases — each is recorded in ResearchTrace:
 *
 * 1. QUESTION  (trace)
 *    Load EvidenceRequest + Hypothesis.
 *    DecomposeQuestionUseCase produces a ResearchPlan with sub-questions.
 *
 * 2. SEARCH  (trace)
 *    Execute ResearchPlan: for each ResearchQuestion, call KnowledgeSourcePort.acquire().
 *    Union of all results = collected evidence.
 *
 * 3. EVIDENCE  (trace)
 *    Aggregate all acquired facts. Remove duplicates by id.
 *
 * 4. EVALUATION  (trace)
 *    Pluggable EvidenceEvaluator (default: StatisticalEvaluator).
 *    Evaluator determines verdict: supported | refuted | inconclusive.
 *
 * 5. DECISION  (trace)
 *    - New facts → save to KnowledgeFactRepository + KnowledgeGraph
 *    - Hypothesis → markSupported() / markRefuted() based on verdict
 *    - EvidenceRequest → answer() (close)
 *    - ResearchPlan → complete()
 *
 * EvidenceEvaluator is pluggable:
 *   Default: StatisticalEvaluator (confidence-weighted scoring)
 *   Swap to: ScientificEvaluator, BusinessEvaluator, DesignEvaluator
 *   The choice of evaluator changes the epistemology of the system.
 *
 * KnowledgeSourcePort is pluggable:
 *   Default: MockKnowledgeSourcePort (in-memory term matching)
 *   Future: WebKnowledgeSourcePort, PDFKnowledgeSourcePort, etc.
 *
 * ResearchTrace:
 *   Every step is recorded immutably. The trace is returned in output.
 *   Future: persisted in ResearchTraceRepository for Explainability.
 */
export class ConductResearchUseCase {
  private readonly decomposeUseCase: DecomposeQuestionUseCase
  private readonly evaluator: EvidenceEvaluator

  constructor(
    private readonly factRepo: KnowledgeFactRepository,
    private readonly graphRepo: KnowledgeGraphRepository,
    private readonly hypothesisRepo: HypothesisRepository,
    private readonly evidenceRequestRepo: EvidenceRequestRepository,
    private readonly planRepo: ResearchPlanRepository,
    private readonly knowledgeSource: KnowledgeSourcePort,
    evaluator?: EvidenceEvaluator,
  ) {
    this.decomposeUseCase = new DecomposeQuestionUseCase(
      evidenceRequestRepo,
      hypothesisRepo,
      planRepo,
    )
    this.evaluator = evaluator ?? new StatisticalEvaluator()
  }

  async execute(input: ConductResearchInput): Promise<Result<ConductResearchOutput, AppError>> {
    if (!input.theme.trim()) {
      return err(validationError('ConductResearch: theme must not be empty'))
    }

    // ── Phase 1: QUESTION ─────────────────────────────────────────────────
    const decomposeResult = await this.decomposeUseCase.execute({
      evidenceRequestId: input.evidenceRequestId,
      theme: input.theme,
    })
    if (!isOk(decomposeResult)) return decomposeResult
    let plan = decomposeResult.value.plan

    const erResult = await this.evidenceRequestRepo.findById(input.evidenceRequestId)
    if (!isOk(erResult)) return erResult
    const evidenceRequest = erResult.value

    const hypoResult = await this.hypothesisRepo.findById(
      evidenceRequest.hypothesisId as Parameters<typeof this.hypothesisRepo.findById>[0],
    )
    if (!isOk(hypoResult)) return hypoResult
    let hypothesis = hypoResult.value

    let trace = ResearchTrace.start(plan.id, hypothesis.id)
    trace = trace.record('question', `EvidenceRequest loaded: "${evidenceRequest.generateQuestion()}"`, {
      evidenceRequestId: input.evidenceRequestId,
      hypothesisId: hypothesis.id,
      hypothesisType: hypothesis.type,
      subQuestionsCount: plan.questions.length,
    })

    // ── Phase 2: SEARCH ───────────────────────────────────────────────────
    plan = plan.start()
    await this.planRepo.save(plan)

    const collectedFacts = new Map<string, KnowledgeFact>()
    for (const question of plan.executionOrder()) {
      const acquireResult = await this.knowledgeSource.acquire(question)
      if (!isOk(acquireResult)) continue
      for (const fact of acquireResult.value) {
        collectedFacts.set(fact.id, fact)
      }
    }

    trace = trace.record('search', `KnowledgeSourcePort.acquire() executed for ${plan.questions.length} questions`, {
      source: this.knowledgeSource.sourceName,
      questionsExecuted: plan.questions.length,
      factsFound: collectedFacts.size,
    })

    // ── Phase 3: EVIDENCE ─────────────────────────────────────────────────
    const allCollected = [...collectedFacts.values()]

    trace = trace.record('evidence', `Evidence aggregated: ${allCollected.length} unique facts`, {
      totalFacts: allCollected.length,
      seedFactsCount: hypothesis.supportingFacts.length,
    })

    // ── Phase 4: EVALUATION ───────────────────────────────────────────────
    const evaluation = this.evaluator.evaluate(hypothesis.id, allCollected, hypothesis.supportingFacts)

    trace = trace.record('evaluation', `${this.evaluator.evaluatorType} evaluator → verdict: ${evaluation.verdict}`, {
      evaluatorType: this.evaluator.evaluatorType,
      verdict: evaluation.verdict,
      supportingCount: evaluation.supportingFacts.length,
      refutingCount: evaluation.refutingFacts.length,
      reasoning: evaluation.reasoning,
    })

    // ── Phase 5: DECISION ─────────────────────────────────────────────────
    let newFactsAdded = 0
    const existingFactIds = new Set(hypothesis.supportingFacts.map((f) => f.id))
    const graphResult = await this.graphRepo.findByTheme(input.theme)
    const graph = isOk(graphResult) ? graphResult.value : null

    for (const fact of allCollected) {
      if (existingFactIds.has(fact.id)) continue
      const existing = await this.factRepo.findById(fact.id)
      if (isOk(existing)) continue

      await this.factRepo.save(fact)
      newFactsAdded++

      if (graph) {
        const updated = graph.addFact(fact)
        if (isOk(updated)) {
          await this.graphRepo.save(updated.value)
        }
      }
    }

    let hypothesisUpdated = false
    if (evaluation.verdict === 'supported') {
      const updated = hypothesis.markSupported()
      await this.hypothesisRepo.save(updated)
      hypothesisUpdated = true
    } else if (evaluation.verdict === 'refuted') {
      const updated = hypothesis.markRefuted()
      await this.hypothesisRepo.save(updated)
      hypothesisUpdated = true
    }

    const answeredRequest = evidenceRequest.answer()
    await this.evidenceRequestRepo.save(answeredRequest)

    const completedPlan = plan.complete()
    await this.planRepo.save(completedPlan)

    trace = trace.record('decision', `Knowledge updated: +${newFactsAdded} facts, hypothesis ${hypothesisUpdated ? `→ ${evaluation.verdict}` : 'unchanged'}`, {
      newFactsAdded,
      hypothesisUpdated,
      hypothesisVerdict: evaluation.verdict,
      planStatus: 'completed',
    })

    trace = trace.complete()

    return ok({
      plan: completedPlan,
      collectedFacts: allCollected,
      evaluation,
      newFactsAdded,
      hypothesisUpdated,
      trace,
    })
  }
}
