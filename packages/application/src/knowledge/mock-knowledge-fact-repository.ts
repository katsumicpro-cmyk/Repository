import { ok, err, type Result } from '@innovation-os/shared/result'
import { notFound } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type { PaginationParams, Page } from '@innovation-os/domain/core'
import type { KnowledgeFactRepository } from '@innovation-os/knowledge/repository'
import { KnowledgeFact, type KnowledgeFactId, type ConfidenceBand } from '@innovation-os/knowledge/fact'

/**
 * MockKnowledgeFactRepository — in-memory implementation.
 * No persistence. Swap with SupabaseKnowledgeFactRepository in production.
 */
export class MockKnowledgeFactRepository implements KnowledgeFactRepository {
  private readonly store = new Map<string, KnowledgeFact>()

  async findById(id: KnowledgeFactId): Promise<Result<KnowledgeFact, AppError>> {
    const f = this.store.get(id)
    return f ? ok(f) : err(notFound('KnowledgeFact', id))
  }

  async findAll(params: PaginationParams): Promise<Result<Page<KnowledgeFact>, AppError>> {
    const all = [...this.store.values()]
    const start = (params.page - 1) * params.perPage
    return ok({ items: all.slice(start, start + params.perPage), total: all.length, page: params.page, perPage: params.perPage })
  }

  async save(entity: KnowledgeFact): Promise<Result<KnowledgeFact, AppError>> {
    this.store.set(entity.id, entity)
    return ok(entity)
  }

  async delete(id: KnowledgeFactId): Promise<Result<void, AppError>> {
    if (!this.store.has(id)) return err(notFound('KnowledgeFact', id))
    this.store.delete(id)
    return ok(undefined)
  }

  async findByTheme(theme: string): Promise<Result<readonly KnowledgeFact[], AppError>> {
    return ok([...this.store.values()].filter((f) => f.theme === theme))
  }

  async findByConfidence(band: ConfidenceBand): Promise<Result<readonly KnowledgeFact[], AppError>> {
    return ok([...this.store.values()].filter((f) => f.confidenceScore.band === band))
  }

  async findWithoutEmbedding(): Promise<Result<readonly KnowledgeFact[], AppError>> {
    return ok([...this.store.values()].filter((f) => !f.hasEmbedding()))
  }

  async findSimilar(_queryVector: readonly number[], topK: number): Promise<Result<readonly KnowledgeFact[], AppError>> {
    // Mock: return first topK facts regardless of similarity
    return ok([...this.store.values()].slice(0, topK))
  }

  snapshot(): readonly KnowledgeFact[] { return [...this.store.values()] }
}
