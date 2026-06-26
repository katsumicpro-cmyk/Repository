import { AggregateRoot } from '../core/entity.js'
import { generateId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { PrincipleId, PrincipleProps } from './types.js'

export type CreatePrincipleInput = {
  readonly statement: string
  readonly rationale: string
  readonly patternIds: readonly string[]
}

export class Principle extends AggregateRoot<PrincipleProps> {
  private constructor(props: PrincipleProps) {
    super(props)
  }

  static create(input: CreatePrincipleInput): Result<Principle, AppError> {
    if (input.statement.trim().length === 0) {
      return err(validationError('Principle statement must not be empty'))
    }
    if (input.patternIds.length === 0) {
      return err(validationError('Principle must reference at least one Pattern'))
    }

    const now = systemClock.now()
    return ok(
      new Principle({
        id: generateId('prin'),
        statement: input.statement.trim(),
        rationale: input.rationale,
        patternIds: input.patternIds,
        confidence: 'low',
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  static reconstitute(props: PrincipleProps): Principle {
    return new Principle(props)
  }

  get statement(): string { return this.props.statement }
  get rationale(): string { return this.props.rationale }
  get patternIds(): readonly string[] { return this.props.patternIds }
  get confidence() { return this.props.confidence }

  toProps(): PrincipleProps { return this.props }
}
