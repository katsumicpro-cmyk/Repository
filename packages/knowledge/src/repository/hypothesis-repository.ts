import type { Repository } from '@innovation-os/domain/core'
import type { AppError } from '@innovation-os/shared/errors'
import type { Result } from '@innovation-os/shared/result'
import type { Hypothesis, HypothesisId, HypothesisStatus, HypothesisType } from '../reasoning/hypothesis/hypothesis.js'

/**
 * HypothesisRepository — persistence interface for Hypothesis entities.
 */
export interface HypothesisRepository extends Repository<Hypothesis, HypothesisId> {
  findByStatus(status: HypothesisStatus): Promise<Result<readonly Hypothesis[], AppError>>
  findByType(type: HypothesisType): Promise<Result<readonly Hypothesis[], AppError>>
  findByTheme(theme: string): Promise<Result<readonly Hypothesis[], AppError>>
}
