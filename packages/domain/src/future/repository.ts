import type { Repository } from '../core/repository.js'
import type { AppError } from '@innovation-os/shared/errors'
import type { Result } from '@innovation-os/shared/result'
import type { Future } from './entity.js'
import type { FutureId, TimeHorizon } from './types.js'

export interface FutureRepository extends Repository<Future, FutureId> {
  findByTimeHorizon(horizon: TimeHorizon): Promise<Result<readonly Future[], AppError>>
}
