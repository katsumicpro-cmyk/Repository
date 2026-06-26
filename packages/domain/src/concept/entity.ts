import { AggregateRoot } from '../core/entity.js'
import { generateId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { ConceptId, ConceptProps, ConceptStatus } from './types.js'

export type CreateConceptInput = {
  readonly name: string
  readonly description: string
  readonly valueProposition: string
  readonly futureIds: readonly string[]
}

export class Concept extends AggregateRoot<ConceptProps> {
  private constructor(props: ConceptProps) {
    super(props)
  }

  static create(input: CreateConceptInput): Result<Concept, AppError> {
    if (input.name.trim().length === 0) {
      return err(validationError('Concept name must not be empty'))
    }
    if (input.futureIds.length === 0) {
      return err(validationError('Concept must reference at least one Future'))
    }

    const now = systemClock.now()
    return ok(
      new Concept({
        id: generateId('conc'),
        name: input.name.trim(),
        description: input.description,
        valueProposition: input.valueProposition,
        futureIds: input.futureIds,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  static reconstitute(props: ConceptProps): Concept {
    return new Concept(props)
  }

  get name(): string { return this.props.name }
  get description(): string { return this.props.description }
  get valueProposition(): string { return this.props.valueProposition }
  get futureIds(): readonly string[] { return this.props.futureIds }
  get status(): ConceptStatus { return this.props.status }

  validate(): Result<Concept, AppError> {
    if (this.props.status !== 'completed') {
      return err(validationError('Only completed concepts can be validated'))
    }
    return ok(new Concept({ ...this.props, status: 'validated', updatedAt: systemClock.now() }))
  }

  toProps(): ConceptProps { return this.props }
}
