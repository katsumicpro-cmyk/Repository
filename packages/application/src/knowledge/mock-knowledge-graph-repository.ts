import { ok, err, type Result } from '@innovation-os/shared/result'
import { notFound } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type { PaginationParams, Page } from '@innovation-os/domain/core'
import type { KnowledgeGraphRepository } from '@innovation-os/knowledge/repository'
import { KnowledgeGraph, type KnowledgeGraphId } from '@innovation-os/knowledge/graph'

/**
 * MockKnowledgeGraphRepository — in-memory implementation.
 */
export class MockKnowledgeGraphRepository implements KnowledgeGraphRepository {
  private readonly store = new Map<string, KnowledgeGraph>()

  async findById(id: KnowledgeGraphId): Promise<Result<KnowledgeGraph, AppError>> {
    const g = this.store.get(id)
    return g ? ok(g) : err(notFound('KnowledgeGraph', id))
  }

  async findAll(params: PaginationParams): Promise<Result<Page<KnowledgeGraph>, AppError>> {
    const all = [...this.store.values()]
    const start = (params.page - 1) * params.perPage
    return ok({ items: all.slice(start, start + params.perPage), total: all.length, page: params.page, perPage: params.perPage })
  }

  async save(entity: KnowledgeGraph): Promise<Result<KnowledgeGraph, AppError>> {
    this.store.set(entity.id, entity)
    return ok(entity)
  }

  async delete(id: KnowledgeGraphId): Promise<Result<void, AppError>> {
    if (!this.store.has(id)) return err(notFound('KnowledgeGraph', id))
    this.store.delete(id)
    return ok(undefined)
  }

  async findByTheme(theme: string): Promise<Result<KnowledgeGraph | null, AppError>> {
    const found = [...this.store.values()].find((g) => g.theme === theme)
    return ok(found ?? null)
  }

  async merge(graph: KnowledgeGraph): Promise<Result<KnowledgeGraph, AppError>> {
    // MVP: overwrite
    this.store.set(graph.id, graph)
    return ok(graph)
  }

  snapshot(): readonly KnowledgeGraph[] { return [...this.store.values()] }
}
