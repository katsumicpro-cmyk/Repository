import { ok, err, type Result } from '@innovation-os/shared/result'
import { notFound } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type { PaginationParams, Page } from '@innovation-os/domain/core'
import type { HypothesisRepository } from '@innovation-os/knowledge/repository'
import {
  type Hypothesis,
  type HypothesisId,
  type HypothesisStatus,
  type HypothesisType,
} from '@innovation-os/knowledge/reasoning'

export class MockHypothesisRepository implements HypothesisRepository {
  private readonly store = new Map<string, Hypothesis>()

  async findById(id: HypothesisId): Promise<Result<Hypothesis, AppError>> {
    const h = this.store.get(id)
    return h ? ok(h) : err(notFound('Hypothesis', id))
  }

  async findAll(params: PaginationParams): Promise<Result<Page<Hypothesis>, AppError>> {
    const all = [...this.store.values()]
    const start = (params.page - 1) * params.perPage
    return ok({ items: all.slice(start, start + params.perPage), total: all.length, page: params.page, perPage: params.perPage })
  }

  async save(entity: Hypothesis): Promise<Result<Hypothesis, AppError>> {
    this.store.set(entity.id, entity)
    return ok(entity)
  }

  async delete(id: HypothesisId): Promise<Result<void, AppError>> {
    if (!this.store.has(id)) return err(notFound('Hypothesis', id))
    this.store.delete(id)
    return ok(undefined)
  }

  async findByStatus(status: HypothesisStatus): Promise<Result<readonly Hypothesis[], AppError>> {
    return ok([...this.store.values()].filter((h) => h.status === status))
  }

  async findByType(type: HypothesisType): Promise<Result<readonly Hypothesis[], AppError>> {
    return ok([...this.store.values()].filter((h) => h.hypothesisType === type))
  }

  async findByTheme(_theme: string): Promise<Result<readonly Hypothesis[], AppError>> {
    // Mock: no theme tracking — return all
    return ok([...this.store.values()])
  }

  snapshot(): readonly Hypothesis[] { return [...this.store.values()] }
}
