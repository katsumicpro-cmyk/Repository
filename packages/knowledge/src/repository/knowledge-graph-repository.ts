import type { Repository } from '@innovation-os/domain/core'
import type { AppError } from '@innovation-os/shared/errors'
import type { Result } from '@innovation-os/shared/result'
import type { KnowledgeGraph, KnowledgeGraphId } from '../graph/knowledge-graph.js'

/**
 * KnowledgeGraphRepository — persistence interface for KnowledgeGraph aggregates.
 *
 * The graph is stored as a whole (nodes + edges) in a single save call.
 * This preserves the Aggregate boundary and avoids partial persistence.
 *
 * Implementations:
 *   - MockKnowledgeGraphRepository (packages/application — for dev/test)
 *   - SupabaseKnowledgeGraphRepository (packages/infrastructure — future)
 *     → stores nodes and edges in separate tables with FK to graph
 */
export interface KnowledgeGraphRepository extends Repository<KnowledgeGraph, KnowledgeGraphId> {
  /** Find the graph for a specific theme (one graph per theme in MVP) */
  findByTheme(theme: string): Promise<Result<KnowledgeGraph | null, AppError>>

  /**
   * Merge a new version of the graph into an existing one.
   * Used when multiple Discoveries contribute to the same theme.
   * MVP: overwrites. Future: smart merge with conflict resolution.
   */
  merge(graph: KnowledgeGraph): Promise<Result<KnowledgeGraph, AppError>>
}
