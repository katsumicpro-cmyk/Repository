import { ValueObject } from '../core/value-object.js'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { ConfidenceLevel } from '@innovation-os/shared/constants'
import { Fact } from './fact.js'

type FactCollectionProps = {
  readonly facts: readonly Fact[]
  readonly theme: string
}

/**
 * FactCollection — an ordered, immutable set of Facts for a given theme.
 * Enforces minimum cardinality and provides filtering helpers.
 */
export class FactCollection extends ValueObject<FactCollectionProps> {
  private constructor(props: FactCollectionProps) {
    super(props)
  }

  static create(facts: readonly Fact[], theme: string): Result<FactCollection, AppError> {
    if (facts.length === 0) {
      return err(validationError('FactCollection must contain at least one Fact'))
    }
    return ok(new FactCollection({ facts: [...facts], theme }))
  }

  get facts(): readonly Fact[] { return this.props.facts }
  get theme(): string { return this.props.theme }
  get size(): number { return this.props.facts.length }

  filterByConfidence(level: ConfidenceLevel): readonly Fact[] {
    return this.props.facts.filter((f) => f.confidence === level)
  }

  highConfidenceFacts(): readonly Fact[] {
    return this.props.facts.filter((f) =>
      f.confidence === 'high' || f.confidence === 'verified',
    )
  }
}
