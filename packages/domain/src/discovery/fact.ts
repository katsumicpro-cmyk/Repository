import { ValueObject } from '../core/value-object.js'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { ConfidenceLevel } from '@innovation-os/shared/constants'

type FactProps = {
  readonly content: string
  readonly source: string
  readonly confidence: ConfidenceLevel
}

/**
 * Fact — a single discovered piece of information.
 * Immutable value object; equality is by content+source+confidence.
 */
export class Fact extends ValueObject<FactProps> {
  private constructor(props: FactProps) {
    super(props)
  }

  static create(
    content: string,
    source: string,
    confidence: ConfidenceLevel = 'low',
  ): Result<Fact, AppError> {
    if (content.trim().length === 0) {
      return err(validationError('Fact content must not be empty'))
    }
    if (source.trim().length === 0) {
      return err(validationError('Fact source must not be empty'))
    }
    return ok(new Fact({ content: content.trim(), source: source.trim(), confidence }))
  }

  get content(): string { return this.props.content }
  get source(): string { return this.props.source }
  get confidence(): ConfidenceLevel { return this.props.confidence }
}
