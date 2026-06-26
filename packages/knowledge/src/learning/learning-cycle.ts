import { Entity, type EntityProps } from '@innovation-os/domain/core'
import { generateId, type PrefixedId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'

export type LearningCycleId = PrefixedId<'lcyc'>

/**
 * What initiated this learning cycle.
 *
 * manual              — human triggered via UI or API
 * scheduled           — periodic background run
 * knowledge_threshold — knowledge base grew past a threshold (future)
 * contradiction_detected — a new contradiction appeared (future event-driven)
 */
export type LearningCycleTrigger =
  | 'manual'
  | 'scheduled'
  | 'knowledge_threshold'
  | 'contradiction_detected'

export type LearningCycleStatus = 'running' | 'completed' | 'failed'

/**
 * A discrete change that this learning cycle made to the knowledge base.
 *
 * These are recorded as the authoritative record of what the system learned.
 * Future: surfaced in UI as "What did the system learn today?"
 */
export type KnowledgeChange = {
  readonly factId: string
  readonly changeType: 'added' | 'confirmed' | 'refuted'
  readonly reason: string
}

type LearningCycleProps = EntityProps & {
  readonly id: LearningCycleId
  readonly theme: string
  readonly trigger: LearningCycleTrigger
  readonly status: LearningCycleStatus
  /** How many hypotheses were generated from the initial reasoning pass */
  readonly hypothesesCount: number
  /** IDs of ResearchPlans executed during this cycle */
  readonly researchPlanIds: readonly string[]
  /** IDs of all KnowledgeFacts collected as evidence */
  readonly collectedEvidenceIds: readonly string[]
  /** All discrete changes made to the knowledge base */
  readonly knowledgeChanges: readonly KnowledgeChange[]
  /** Questions (EvidenceRequest.generateQuestion()) produced after re-reasoning */
  readonly newQuestionsGenerated: readonly string[]
  readonly startedAt: string
  readonly completedAt: string | null
  readonly failureReason: string | null
}

/**
 * LearningCycle — the record of one complete unit of machine learning.
 *
 * This is Sprint 7's core concept. A LearningCycle captures everything that
 * happened in a single autonomous learning pass:
 *
 *   Trigger
 *   → Reasoning (find contradictions, generate hypotheses)
 *   → Research (SourcePlanner → acquire → evaluate)
 *   → Knowledge Integration (update facts + graph)
 *   → Re-Reasoning (what new questions did the updated knowledge raise?)
 *
 * Why a separate Entity?
 *   - Observability: "what did the system learn in the last 24h?"
 *   - Debugging: "why did the system conclude X?"
 *   - Governance: "how many cycles before we trust a conclusion?"
 *   - Future: LearningCycle becomes training signal for improving strategies
 *
 * Design: immutable append-only. All mutations return new instances.
 * The cycle is complete when all research is done and new questions are recorded.
 */
export class LearningCycle extends Entity<LearningCycleProps> {
  private constructor(props: LearningCycleProps) {
    super(props)
  }

  static start(theme: string, trigger: LearningCycleTrigger): LearningCycle {
    return new LearningCycle({
      id: generateId('lcyc'),
      theme,
      trigger,
      status: 'running',
      hypothesesCount: 0,
      researchPlanIds: [],
      collectedEvidenceIds: [],
      knowledgeChanges: [],
      newQuestionsGenerated: [],
      startedAt: systemClock.now(),
      completedAt: null,
      failureReason: null,
    })
  }

  // ── Append operations (return new instance) ────────────────────────────

  recordHypotheses(count: number): LearningCycle {
    return new LearningCycle({ ...this.props, hypothesesCount: count })
  }

  recordResearchPlan(planId: string): LearningCycle {
    return new LearningCycle({
      ...this.props,
      researchPlanIds: [...this.props.researchPlanIds, planId],
    })
  }

  recordEvidence(factIds: readonly string[]): LearningCycle {
    const existing = new Set(this.props.collectedEvidenceIds)
    const merged = [...this.props.collectedEvidenceIds, ...factIds.filter((id) => !existing.has(id))]
    return new LearningCycle({ ...this.props, collectedEvidenceIds: merged })
  }

  recordKnowledgeChange(change: KnowledgeChange): LearningCycle {
    return new LearningCycle({
      ...this.props,
      knowledgeChanges: [...this.props.knowledgeChanges, change],
    })
  }

  recordNewQuestions(questions: readonly string[]): LearningCycle {
    return new LearningCycle({
      ...this.props,
      newQuestionsGenerated: [...this.props.newQuestionsGenerated, ...questions],
    })
  }

  complete(): LearningCycle {
    return new LearningCycle({
      ...this.props,
      status: 'completed',
      completedAt: systemClock.now(),
    })
  }

  fail(reason: string): LearningCycle {
    return new LearningCycle({
      ...this.props,
      status: 'failed',
      failureReason: reason,
      completedAt: systemClock.now(),
    })
  }

  // ── Accessors ──────────────────────────────────────────────────────────

  get id(): LearningCycleId { return this.props.id }
  get theme(): string { return this.props.theme }
  get trigger(): LearningCycleTrigger { return this.props.trigger }
  get status(): LearningCycleStatus { return this.props.status }
  get hypothesesCount(): number { return this.props.hypothesesCount }
  get researchPlanIds(): readonly string[] { return this.props.researchPlanIds }
  get collectedEvidenceIds(): readonly string[] { return this.props.collectedEvidenceIds }
  get knowledgeChanges(): readonly KnowledgeChange[] { return this.props.knowledgeChanges }
  get newQuestionsGenerated(): readonly string[] { return this.props.newQuestionsGenerated }
  get startedAt(): string { return this.props.startedAt }
  get completedAt(): string | null { return this.props.completedAt }
  get failureReason(): string | null { return this.props.failureReason }

  // ── Derived metrics ────────────────────────────────────────────────────

  get totalEvidenceCollected(): number { return this.props.collectedEvidenceIds.length }
  get totalKnowledgeChanges(): number { return this.props.knowledgeChanges.length }
  get newQuestionsCount(): number { return this.props.newQuestionsGenerated.length }

  /**
   * True when the cycle both updated knowledge AND generated new questions.
   * This is the proof that the system is in an active learning loop:
   *   Knowledge changed → new questions appeared → next cycle will be richer.
   */
  isActivelyLearning(): boolean {
    return this.props.knowledgeChanges.length > 0 || this.props.newQuestionsGenerated.length > 0
  }

  /**
   * How many research plans were executed per hypothesis.
   * Approaches 1.0 when every hypothesis was researched.
   */
  researchCoverage(): number {
    if (this.props.hypothesesCount === 0) return 0
    return this.props.researchPlanIds.length / this.props.hypothesesCount
  }

  /** Human-readable summary of what this cycle accomplished */
  toSummary(): string {
    const lines = [
      `LearningCycle [${this.props.id}]`,
      `  theme: ${this.props.theme}`,
      `  trigger: ${this.props.trigger}`,
      `  status: ${this.props.status}`,
      `  hypotheses generated: ${this.props.hypothesesCount}`,
      `  research plans executed: ${this.props.researchPlanIds.length}`,
      `  evidence collected: ${this.props.collectedEvidenceIds.length} facts`,
      `  knowledge changes: ${this.props.knowledgeChanges.length}`,
      `  new questions: ${this.props.newQuestionsGenerated.length}`,
      `  actively learning: ${this.isActivelyLearning()}`,
    ]
    if (this.props.failureReason) {
      lines.push(`  failure: ${this.props.failureReason}`)
    }
    return lines.join('\n')
  }
}
