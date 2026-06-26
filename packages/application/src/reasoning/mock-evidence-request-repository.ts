import { ok, err, type Result } from '@innovation-os/shared/result'
import { notFound } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type { PaginationParams, Page } from '@innovation-os/domain/core'
import type { EvidenceRequestRepository } from '@innovation-os/knowledge/repository'
import {
  type EvidenceRequest,
  type EvidenceRequestId,
  type EvidenceRequestStatus,
} from '@innovation-os/knowledge/reasoning'

export class MockEvidenceRequestRepository implements EvidenceRequestRepository {
  private readonly store = new Map<string, EvidenceRequest>()

  async findById(id: EvidenceRequestId): Promise<Result<EvidenceRequest, AppError>> {
    const e = this.store.get(id)
    return e ? ok(e) : err(notFound('EvidenceRequest', id))
  }

  async findAll(params: PaginationParams): Promise<Result<Page<EvidenceRequest>, AppError>> {
    const all = [...this.store.values()]
    const start = (params.page - 1) * params.perPage
    return ok({ items: all.slice(start, start + params.perPage), total: all.length, page: params.page, perPage: params.perPage })
  }

  async save(entity: EvidenceRequest): Promise<Result<EvidenceRequest, AppError>> {
    this.store.set(entity.id, entity)
    return ok(entity)
  }

  async delete(id: EvidenceRequestId): Promise<Result<void, AppError>> {
    if (!this.store.has(id)) return err(notFound('EvidenceRequest', id))
    this.store.delete(id)
    return ok(undefined)
  }

  async findByStatus(status: EvidenceRequestStatus): Promise<Result<readonly EvidenceRequest[], AppError>> {
    return ok([...this.store.values()].filter((e) => e.status === status))
  }

  async findByTheme(theme: string): Promise<Result<readonly EvidenceRequest[], AppError>> {
    return ok([...this.store.values()].filter((e) => e.theme === theme))
  }

  async findByHypothesisId(hypothesisId: string): Promise<Result<readonly EvidenceRequest[], AppError>> {
    return ok([...this.store.values()].filter((e) => e.hypothesisId === hypothesisId))
  }

  async findOpenHighPriority(): Promise<Result<readonly EvidenceRequest[], AppError>> {
    const open = [...this.store.values()]
      .filter((e) => e.isOpen() && e.isHighPriority())
      .sort((a, b) => b.priority - a.priority)
    return ok(open)
  }

  snapshot(): readonly EvidenceRequest[] { return [...this.store.values()] }
}
