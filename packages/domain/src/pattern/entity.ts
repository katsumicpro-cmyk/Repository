import { AggregateRoot } from '../core/entity.js'
import { generateId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { PatternId, PatternProps } from './types.js'

export type CreatePatternInput = {
  readonly title: string
  readonly description: string
  readonly discoveryIds: readonly string[]
}

export class Pattern extends AggregateRoot<PatternProps> {
  private constructor(props: PatternProps) {
    super(props)
  }

  static create(input: CreatePatternInput): Result<Pattern, AppError> {
    if (input.title.trim().length === 0) {
      return err(validationError('Pattern title must not be empty'))
    }
    if (input.discoveryIds.length === 0) {
      return err(validationError('Pattern must reference at least one Discovery'))
    }

    const now = systemClock.now()
    return ok(
      new Pattern({
        id: generateId('patt'),
        title: input.title.trim(),
        description: input.description,
        discoveryIds: input.discoveryIds,
        confidence: 'low',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  static reconstitute(props: PatternProps): Pattern {
    return new Pattern(props)
  }

  get title(): string { return this.props.title }
  get description(): string { return this.props.description }
  get discoveryIds(): readonly string[] { return this.props.discoveryIds }
  get confidence() { return this.props.confidence }
  get status() { return this.props.status }

  toProps(): PatternProps { return this.props }
}
