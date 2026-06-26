import { ok, err, type Result } from '@innovation-os/shared/result'
import { notFound } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type { PaginationParams, Page } from '@innovation-os/domain/core'
import type { ResearchPlanRepository } from '@innovation-os/knowledge/repository'
import type { ResearchPlan, ResearchPlanId, ResearchPlanStatus } from '@innovation-os/knowledge/research'

export class MockResearchPlanRepository implements ResearchPlanRepository {
  private readonly store = new Map<string, ResearchPlan>()

  async findById(id: ResearchPlanId): Promise<Result<ResearchPlan, AppError>> {
    const p = this.store.get(id)
    return p ? ok(p) : err(notFound('ResearchPlan', id))
  }

  async findAll(params: PaginationParams): Promise<Result<Page<ResearchPlan>, AppError>> {
    const all = [...this.store.values()]
    const start = (params.page - 1) * params.perPage
    return ok({ items: all.slice(start, start + params.perPage), total: all.length, page: params.page, perPage: params.perPage })
  }

  async save(entity: ResearchPlan): Promise<Result<ResearchPlan, AppError>> {
    this.store.set(entity.id, entity)
    return ok(entity)
  }

  async delete(id: ResearchPlanId): Promise<Result<void, AppError>> {
    if (!this.store.has(id)) return err(notFound('ResearchPlan', id))
    this.store.delete(id)
    return ok(undefined)
  }

  async findByStatus(status: ResearchPlanStatus): Promise<Result<readonly ResearchPlan[], AppError>> {
    return ok([...this.store.values()].filter((p) => p.status === status))
  }

  async findByHypothesisId(hypothesisId: string): Promise<Result<readonly ResearchPlan[], AppError>> {
    return ok([...this.store.values()].filter((p) => p.hypothesisId === hypothesisId))
  }

  async findByTheme(theme: string): Promise<Result<readonly ResearchPlan[], AppError>> {
    return ok([...this.store.values()].filter((p) => p.theme === theme))
  }

  snapshot(): readonly ResearchPlan[] { return [...this.store.values()] }
}
