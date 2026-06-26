import { ok, err, type Result } from '@innovation-os/shared/result'

/** In-memory cosine similarity — used for MockKnowledgeFactRepository.findSimilar() */
function cosineSim(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0)
    normA += (a[i] ?? 0) ** 2
    normB += (b[i] ?? 0) ** 2
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}
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

  async findSimilar(
    queryVector: readonly number[],
    topK: number,
    threshold = 0,
  ): Promise<Result<readonly KnowledgeFact[], AppError>> {
    const scored = [...this.store.values()]
      .filter((f) => f.hasEmbedding())
      .map((f) => ({ f, sim: cosineSim(queryVector, f.embedding!.vector) }))
      .filter(({ sim }) => sim >= threshold)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, topK)
      .map(({ f }) => f)
    return ok(scored)
  }

  snapshot(): readonly KnowledgeFact[] { return [...this.store.values()] }
}
