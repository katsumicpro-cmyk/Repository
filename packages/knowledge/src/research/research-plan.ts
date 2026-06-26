import { Entity, type EntityProps } from '@innovation-os/domain/core'
import { generateId, type PrefixedId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { ResearchQuestion } from './research-question.js'

export type ResearchPlanId = PrefixedId<'rplan'>
export type ResearchPlanStatus = 'planned' | 'in_progress' | 'completed' | 'abandoned'
export type ResearchStrategy = 'breadth_first' | 'depth_first' | 'targeted'

type ResearchPlanProps = EntityProps & {
  readonly id: ResearchPlanId
  readonly hypothesisId: string
  readonly evidenceRequestId: string
  readonly theme: string
  readonly questions: readonly ResearchQuestion[]
  readonly strategy: ResearchStrategy
  readonly status: ResearchPlanStatus
  readonly maxQuestionsPerCycle: number
}

/**
 * ResearchPlan — the structured plan to answer an EvidenceRequest.
 *
 * Created by DecomposeQuestionUseCase from an EvidenceRequest + Hypothesis.
 * Contains an ordered set of ResearchQuestions and a strategy.
 *
 * Strategy:
 *   breadth_first: search all questions, take the union of results.
 *                  Best for exploratory hypotheses.
 *
 *   depth_first:   prioritize the highest-priority question,
 *                  follow its results before moving to the next.
 *                  Best for targeted contradiction resolution.
 *
 *   targeted:      use existing high-confidence facts directly.
 *                  Best when the knowledge base already has relevant evidence.
 *
 * The plan tracks its own execution status:
 *   planned → in_progress → completed | abandoned
 *
 * This is the artifact that proves Sprint 6's capability:
 * "調査計画を立てられるか" = can a ResearchPlan be created from a question?
 */
export class ResearchPlan extends Entity<ResearchPlanProps> {
  private constructor(props: ResearchPlanProps) {
    super(props)
  }

  static create(input: {
    hypothesisId: string
    evidenceRequestId: string
    theme: string
    questions: readonly ResearchQuestion[]
    strategy?: ResearchStrategy
    maxQuestionsPerCycle?: number
  }): Result<ResearchPlan, AppError> {
    if (input.questions.length === 0) {
      return err(validationError('ResearchPlan: must have at least one question'))
    }
    const now = systemClock.now()
    return ok(
      new ResearchPlan({
        id: generateId('rplan'),
        hypothesisId: input.hypothesisId,
        evidenceRequestId: input.evidenceRequestId,
        theme: input.theme,
        questions: [...input.questions].sort((a, b) => b.priority - a.priority),
        strategy: input.strategy ?? 'breadth_first',
        status: 'planned',
        maxQuestionsPerCycle: input.maxQuestionsPerCycle ?? 5,
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  static reconstitute(props: ResearchPlanProps): ResearchPlan {
    return new ResearchPlan(props)
  }

  get hypothesisId(): string { return this.props.hypothesisId }
  get evidenceRequestId(): string { return this.props.evidenceRequestId }
  get theme(): string { return this.props.theme }
  get questions(): readonly ResearchQuestion[] { return this.props.questions }
  get strategy(): ResearchStrategy { return this.props.strategy }
  get status(): ResearchPlanStatus { return this.props.status }
  get maxQuestionsPerCycle(): number { return this.props.maxQuestionsPerCycle }

  isPlanned(): boolean { return this.props.status === 'planned' }
  isCompleted(): boolean { return this.props.status === 'completed' }

  /** Returns questions in execution order based on strategy */
  executionOrder(): readonly ResearchQuestion[] {
    if (this.props.strategy === 'depth_first') {
      return this.props.questions.slice(0, 1) // only top priority first
    }
    return this.props.questions.slice(0, this.props.maxQuestionsPerCycle)
  }

  start(): ResearchPlan {
    return new ResearchPlan({ ...this.props, status: 'in_progress', updatedAt: systemClock.now() })
  }

  complete(): ResearchPlan {
    return new ResearchPlan({ ...this.props, status: 'completed', updatedAt: systemClock.now() })
  }

  abandon(): ResearchPlan {
    return new ResearchPlan({ ...this.props, status: 'abandoned', updatedAt: systemClock.now() })
  }

  toProps(): ResearchPlanProps { return this.props }
}
