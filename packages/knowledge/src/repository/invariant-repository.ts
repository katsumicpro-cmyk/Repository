import type { Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { Invariant, InvariantId, InvariantStatus, InvariantType } from '../principle/invariant.js'

export interface InvariantRepository {
  save(invariant: Invariant): Promise<Result<void, AppError>>
  findById(id: InvariantId): Promise<Result<Invariant, AppError>>
  findByStatus(status: InvariantStatus): Promise<Result<readonly Invariant[], AppError>>
  findByType(type: InvariantType): Promise<Result<readonly Invariant[], AppError>>
  findAll(): Promise<Result<readonly Invariant[], AppError>>
}
