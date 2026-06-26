import type { Repository } from '../core/repository.js'
import type { AppError } from '@innovation-os/shared/errors'
import type { Result } from '@innovation-os/shared/result'
import type { ProcessingStatus } from '@innovation-os/shared/constants'
import type { Discovery } from './entity.js'
import type { DiscoveryId } from './types.js'

export interface DiscoveryRepository extends Repository<Discovery, DiscoveryId> {
  findByStatus(status: ProcessingStatus): Promise<Result<readonly Discovery[], AppError>>
}
