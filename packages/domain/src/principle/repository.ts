import type { Repository } from '../core/repository.js'
import type { AppError } from '@innovation-os/shared/errors'
import type { Result } from '@innovation-os/shared/result'
import type { ConfidenceLevel } from '@innovation-os/shared/constants'
import type { Principle } from './entity.js'
import type { PrincipleId } from './types.js'

export interface PrincipleRepository extends Repository<Principle, PrincipleId> {
  findByConfidence(level: ConfidenceLevel): Promise<Result<readonly Principle[], AppError>>
}
