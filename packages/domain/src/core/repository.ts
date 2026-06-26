import type { Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'

export type PaginationParams = {
  readonly page: number
  readonly perPage: number
}

export type Page<T> = {
  readonly items: readonly T[]
  readonly total: number
  readonly page: number
  readonly perPage: number
}

/**
 * Repository<TEntity, TId> — collection abstraction over a persistence store.
 * Implementations live in packages/infrastructure. Domain code depends on this
 * interface only (Dependency Inversion Principle).
 */
export interface Repository<TEntity, TId extends string> {
  findById(id: TId): Promise<Result<TEntity, AppError>>
  findAll(params: PaginationParams): Promise<Result<Page<TEntity>, AppError>>
  save(entity: TEntity): Promise<Result<TEntity, AppError>>
  delete(id: TId): Promise<Result<void, AppError>>
}
