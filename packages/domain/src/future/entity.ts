import { AggregateRoot } from '../core/entity.js'
import { generateId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { FutureId, FutureProps, TimeHorizon } from './types.js'

export type CreateFutureInput = {
  readonly scenario: string
  readonly rationale: string
  readonly timeHorizon: TimeHorizon
  readonly principleIds: readonly string[]
}

export class Future extends AggregateRoot<FutureProps> {
  private constructor(props: FutureProps) {
    super(props)
  }

  static create(input: CreateFutureInput): Result<Future, AppError> {
    if (input.scenario.trim().length === 0) {
      return err(validationError('Future scenario must not be empty'))
    }
    if (input.principleIds.length === 0) {
      return err(validationError('Future must reference at least one Principle'))
    }

    const now = systemClock.now()
    return ok(
      new Future({
        id: generateId('futr'),
        scenario: input.scenario.trim(),
        rationale: input.rationale,
        timeHorizon: input.timeHorizon,
        principleIds: input.principleIds,
        confidence: 'low',
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  static reconstitute(props: FutureProps): Future {
    return new Future(props)
  }

  get scenario(): string { return this.props.scenario }
  get rationale(): string { return this.props.rationale }
  get timeHorizon(): TimeHorizon { return this.props.timeHorizon }
  get principleIds(): readonly string[] { return this.props.principleIds }
  get confidence() { return this.props.confidence }

  toProps(): FutureProps { return this.props }
}
