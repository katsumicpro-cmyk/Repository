import { ok, isOk, err, type Result } from '@innovation-os/shared/result'
import { validationError } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type { KnowledgeGraphRepository, HypothesisRepository, EvidenceRequestRepository } from '@innovation-os/knowledge/repository'
import {
  ContradictionEngine,
  PatternExtractor,
  HypothesisGenerator,
  EvidenceRequest,
  type Contradiction,
  type ExtractedPattern,
  type Hypothesis,
} from '@innovation-os/knowledge/reasoning'

export type InitiateReasoningCycleInput = {
  readonly theme: string
}

export type InitiateReasoningCycleOutput = {
  readonly theme: string
  readonly contradictions: readonly Contradiction[]
  readonly patterns: readonly ExtractedPattern[]
  readonly hypotheses: readonly Hypothesis[]
  readonly evidenceRequests: readonly EvidenceRequest[]
  /** The number of questions the system generated without being asked */
  readonly generatedQuestionsCount: number
  /** True when the system found something the human didn't explicitly look for */
  readonly foundUnexpected: boolean
}

/**
 * InitiateReasoningCycleUseCase — the full reasoning pipeline.
 *
 * This use case answers the question:
 *   「KnowledgeがAIより先に問いを生成できるか」
 *
 * The cycle:
 *   1. Load the KnowledgeGraph for the given theme
 *   2. ContradictionEngine.detect(graph) → find tensions
 *   3. PatternExtractor.extract(graph)   → find patterns
 *   4. HypothesisGenerator.fromContradictions() + fromPatterns() + fromGraph()
 *      → generate claims from structural analysis
 *   5. For each hypothesis, EvidenceRequest.fromHypothesis()
 *      → the system poses a question
 *   6. Persist hypotheses and evidence requests
 *   7. Return the full report
 *
 * The output metric `generatedQuestionsCount` is the answer to the review criterion.
 * If this number > 0, the system generated questions without human input.
 *
 * `foundUnexpected` is true when:
 *   - contradictions exist (the system noticed a tension before being asked)
 *   - patterns exist that weren't explicitly recorded
 *   - transitive hypotheses exist (the system inferred something not directly stated)
 */
export class InitiateReasoningCycleUseCase {
  private readonly contradictionEngine = new ContradictionEngine()
  private readonly patternExtractor = new PatternExtractor()
  private readonly hypothesisGenerator = new HypothesisGenerator()

  constructor(
    private readonly graphRepo: KnowledgeGraphRepository,
    private readonly hypothesisRepo: HypothesisRepository,
    private readonly evidenceRequestRepo: EvidenceRequestRepository,
  ) {}

  async execute(
    input: InitiateReasoningCycleInput,
  ): Promise<Result<InitiateReasoningCycleOutput, AppError>> {
    if (!input.theme.trim()) {
      return err(validationError('InitiateReasoningCycle: theme must not be empty'))
    }

    // ── 1. Load graph ──────────────────────────────────────────────────────
    const graphResult = await this.graphRepo.findByTheme(input.theme)
    if (!isOk(graphResult)) return graphResult

    const graph = graphResult.value
    if (!graph || graph.nodeCount === 0) {
      return ok({
        theme: input.theme,
        contradictions: [],
        patterns: [],
        hypotheses: [],
        evidenceRequests: [],
        generatedQuestionsCount: 0,
        foundUnexpected: false,
      })
    }

    // ── 2. Detect contradictions ───────────────────────────────────────────
    const contradictions = this.contradictionEngine.detect(graph)

    // ── 3. Extract patterns ────────────────────────────────────────────────
    const patterns = this.patternExtractor.extract(graph)

    // ── 4. Generate hypotheses ─────────────────────────────────────────────
    const hypotheses = [
      ...this.hypothesisGenerator.fromContradictions(contradictions),
      ...this.hypothesisGenerator.fromPatterns(patterns),
      ...this.hypothesisGenerator.fromGraph(graph),
    ]

    // ── 5. Create EvidenceRequests ─────────────────────────────────────────
    const evidenceRequests = hypotheses.map((h) =>
      EvidenceRequest.fromHypothesis(h, input.theme),
    )

    // ── 6. Persist ─────────────────────────────────────────────────────────
    for (const hypothesis of hypotheses) {
      await this.hypothesisRepo.save(hypothesis)
    }
    for (const request of evidenceRequests) {
      await this.evidenceRequestRepo.save(request)
    }

    // ── 7. Return report ───────────────────────────────────────────────────
    const foundUnexpected =
      contradictions.length > 0 ||
      patterns.some((p) => p.patternType === 'hub_convergence' || p.patternType === 'causal_chain') ||
      hypotheses.some((h) => h.hypothesisType === 'transitive_causation')

    return ok({
      theme: input.theme,
      contradictions,
      patterns,
      hypotheses,
      evidenceRequests,
      generatedQuestionsCount: evidenceRequests.length,
      foundUnexpected,
    })
  }
}
