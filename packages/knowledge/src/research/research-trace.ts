import { ValueObject } from '@innovation-os/domain/core'
import { systemClock } from '@innovation-os/foundation/time'

export type TraceStepType =
  | 'question'      // EvidenceRequest received and loaded
  | 'planner'       // SourcePlanner selected which KnowledgeSources to use
  | 'search'        // KnowledgeSourcePort.acquire() called for a ResearchQuestion
  | 'evidence'      // All collected facts aggregated
  | 'evaluation'    // EvidenceEvaluator produced a verdict
  | 'decision'      // Knowledge updated; Hypothesis/EvidenceRequest lifecycle advanced
  | 'new_questions' // New EvidenceRequests generated from updated knowledge (re-reasoning)

export type ResearchTraceStep = {
  readonly stepType: TraceStepType
  readonly timestamp: string
  readonly description: string
  readonly metadata: Readonly<Record<string, string | number | boolean>>
}

type ResearchTraceProps = {
  readonly planId: string
  readonly hypothesisId: string
  readonly steps: readonly ResearchTraceStep[]
  readonly startedAt: string
  readonly completedAt: string | null
}

/**
 * ResearchTrace — a complete record of one research cycle execution.
 *
 * Captures every step in the pipeline:
 *   Question → Search → Evidence → Evaluation → Decision
 *
 * Design intent: Explainability foundation.
 * When a user asks "why did the system conclude X?",
 * ResearchTrace provides the full audit trail:
 *   - What question was being answered
 *   - What was searched and with what terms
 *   - How many facts were found
 *   - What evaluator was used and what verdict it produced
 *   - What changed in the knowledge base as a result
 *
 * Current use: returned in ConductResearchOutput (in-memory, not persisted).
 * Future use:  stored in ResearchTraceRepository for long-term explainability,
 *              UI display of "how did we know this?",
 *              training data for improving research strategies.
 *
 * This is intentionally append-only. Steps cannot be modified after recording.
 * The trace represents what actually happened, not what was intended.
 */
export class ResearchTrace extends ValueObject<ResearchTraceProps> {
  private constructor(props: ResearchTraceProps) {
    super(props)
  }

  static start(planId: string, hypothesisId: string): ResearchTrace {
    return new ResearchTrace({
      planId,
      hypothesisId,
      steps: [],
      startedAt: systemClock.now(),
      completedAt: null,
    })
  }

  /** Append a new step — returns a new ResearchTrace (immutable) */
  record(
    stepType: TraceStepType,
    description: string,
    metadata: Readonly<Record<string, string | number | boolean>> = {},
  ): ResearchTrace {
    const step: ResearchTraceStep = {
      stepType,
      description,
      metadata,
      timestamp: systemClock.now(),
    }
    return new ResearchTrace({
      ...this.props,
      steps: [...this.props.steps, step],
    })
  }

  complete(): ResearchTrace {
    return new ResearchTrace({ ...this.props, completedAt: systemClock.now() })
  }

  get planId(): string { return this.props.planId }
  get hypothesisId(): string { return this.props.hypothesisId }
  get steps(): readonly ResearchTraceStep[] { return this.props.steps }
  get startedAt(): string { return this.props.startedAt }
  get completedAt(): string | null { return this.props.completedAt }

  stepsOfType(type: TraceStepType): readonly ResearchTraceStep[] {
    return this.props.steps.filter((s) => s.stepType === type)
  }

  /** Human-readable summary of the trace */
  toNarrative(): string {
    return this.props.steps
      .map((s, i) => `[${i + 1}] ${s.stepType.toUpperCase()}: ${s.description}`)
      .join('\n')
  }
}
