import { ok, err, type Result } from '@innovation-os/shared/result'
import { notFound } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type { PaginationParams, Page } from '@innovation-os/domain/core'
import {
  Discovery,
  type DiscoveryId,
  type DiscoveryRepository,
} from '@innovation-os/domain/discovery'
import type { ProcessingStatus } from '@innovation-os/shared/constants'

/**
 * MockDiscoveryRepository — in-memory implementation for development and tests.
 * No persistence: state is lost on process restart. Swap with SupabaseDiscoveryRepository
 * in production by satisfying the same DiscoveryRepository interface.
 */
export class MockDiscoveryRepository implements DiscoveryRepository {
  private readonly store = new Map<string, Discovery>()

  async findById(id: DiscoveryId): Promise<Result<Discovery, AppError>> {
    const entity = this.store.get(id)
    if (!entity) return err(notFound('Discovery', id))
    return ok(entity)
  }

  async findAll(params: PaginationParams): Promise<Result<Page<Discovery>, AppError>> {
    const all = [...this.store.values()]
    const start = (params.page - 1) * params.perPage
    const items = all.slice(start, start + params.perPage)
    return ok({ items, total: all.length, page: params.page, perPage: params.perPage })
  }

  async save(entity: Discovery): Promise<Result<Discovery, AppError>> {
    this.store.set(entity.id, entity)
    return ok(entity)
  }

  async delete(id: DiscoveryId): Promise<Result<void, AppError>> {
    if (!this.store.has(id)) return err(notFound('Discovery', id))
    this.store.delete(id)
    return ok(undefined)
  }

  async findByStatus(status: ProcessingStatus): Promise<Result<readonly Discovery[], AppError>> {
    const matched = [...this.store.values()].filter((d) => d.status === status)
    return ok(matched)
  }

  /** Test helper — expose internal state */
  snapshot(): readonly Discovery[] {
    return [...this.store.values()]
  }
}
