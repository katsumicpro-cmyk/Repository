import type { Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { Principle, PrincipleId, PrincipleStatus } from '../principle/principle.js'
import type { InvariantId } from '../principle/invariant.js'

export interface PrincipleRepository {
  save(principle: Principle): Promise<Result<void, AppError>>
  findById(id: PrincipleId): Promise<Result<Principle, AppError>>
  findByStatus(status: PrincipleStatus): Promise<Result<readonly Principle[], AppError>>
  findByDomain(domain: string): Promise<Result<readonly Principle[], AppError>>
  findByInvariantId(invariantId: InvariantId): Promise<Result<readonly Principle[], AppError>>
  findAll(): Promise<Result<readonly Principle[], AppError>>
}
