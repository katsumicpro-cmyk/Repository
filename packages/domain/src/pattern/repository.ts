import type { Repository } from '../core/repository.js'
import type { AppError } from '@innovation-os/shared/errors'
import type { Result } from '@innovation-os/shared/result'
import type { Pattern } from './entity.js'
import type { PatternId } from './types.js'

export interface PatternRepository extends Repository<Pattern, PatternId> {
  findByDiscoveryId(discoveryId: string): Promise<Result<readonly Pattern[], AppError>>
}
