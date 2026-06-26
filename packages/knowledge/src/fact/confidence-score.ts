import { ValueObject } from '@innovation-os/domain/core'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'

/**
 * Numeric confidence: 0.0 (pure guess) → 1.0 (verified ground truth)
 *
 * Bands:
 *   0.0 – 0.39  low
 *   0.4 – 0.69  medium
 *   0.7 – 0.89  high
 *   0.9 – 1.0   verified
 */
export type ConfidenceBand = 'low' | 'medium' | 'high' | 'verified'

type ConfidenceScoreProps = {
  readonly score: number
  readonly rationale: string
}

export class ConfidenceScore extends ValueObject<ConfidenceScoreProps> {
  private constructor(props: ConfidenceScoreProps) {
    super(props)
  }

  static create(score: number, rationale = ''): Result<ConfidenceScore, AppError> {
    if (score < 0 || score > 1) {
      return err(validationError('Confidence score must be between 0.0 and 1.0', { score }))
    }
    return ok(new ConfidenceScore({ score, rationale }))
  }

  /** Convenience constructors */
  static low(): ConfidenceScore     { return new ConfidenceScore({ score: 0.2, rationale: '' }) }
  static medium(): ConfidenceScore  { return new ConfidenceScore({ score: 0.55, rationale: '' }) }
  static high(): ConfidenceScore    { return new ConfidenceScore({ score: 0.8, rationale: '' }) }
  static verified(): ConfidenceScore { return new ConfidenceScore({ score: 0.95, rationale: '' }) }

  /** Map legacy string levels to ConfidenceScore */
  static fromBand(band: ConfidenceBand): ConfidenceScore {
    switch (band) {
      case 'low':      return ConfidenceScore.low()
      case 'medium':   return ConfidenceScore.medium()
      case 'high':     return ConfidenceScore.high()
      case 'verified': return ConfidenceScore.verified()
    }
  }

  get score(): number { return this.props.score }
  get rationale(): string { return this.props.rationale }

  get band(): ConfidenceBand {
    if (this.props.score >= 0.9) return 'verified'
    if (this.props.score >= 0.7) return 'high'
    if (this.props.score >= 0.4) return 'medium'
    return 'low'
  }

  isHighConfidence(): boolean {
    return this.props.score >= 0.7
  }
}
