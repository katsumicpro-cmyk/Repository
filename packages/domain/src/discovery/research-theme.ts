import { ValueObject } from '../core/value-object.js'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'

type ResearchThemeProps = {
  readonly value: string
  readonly language: 'ja' | 'en'
}

/**
 * ResearchTheme — what the user wants to research.
 * Normalizes whitespace and enforces non-empty invariant.
 */
export class ResearchTheme extends ValueObject<ResearchThemeProps> {
  private constructor(props: ResearchThemeProps) {
    super(props)
  }

  static create(raw: string, language: 'ja' | 'en' = 'ja'): Result<ResearchTheme, AppError> {
    const normalized = raw.trim().replace(/\s+/g, ' ')
    if (normalized.length === 0) {
      return err(validationError('Research theme must not be empty'))
    }
    if (normalized.length > 200) {
      return err(validationError('Research theme must be 200 characters or fewer'))
    }
    return ok(new ResearchTheme({ value: normalized, language }))
  }

  get value(): string { return this.props.value }
  get language(): 'ja' | 'en' { return this.props.language }

  toString(): string { return this.props.value }
}
