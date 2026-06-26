import type { Repository } from '@innovation-os/domain/core'
import type { AppError } from '@innovation-os/shared/errors'
import type { Result } from '@innovation-os/shared/result'
import type { KnowledgeFact, KnowledgeFactId } from '../fact/knowledge-fact.js'
import type { ConfidenceBand } from '../fact/confidence-score.js'

/**
 * KnowledgeFactRepository — persistence interface for KnowledgeFact entities.
 *
 * Implementations:
 *   - MockKnowledgeFactRepository (packages/application — for dev/test)
 *   - SupabaseKnowledgeFactRepository (packages/infrastructure — future)
 *     → stores embedding as pgvector column for similarity search
 */
export interface KnowledgeFactRepository extends Repository<KnowledgeFact, KnowledgeFactId> {
  /** Find all facts for a specific theme */
  findByTheme(theme: string): Promise<Result<readonly KnowledgeFact[], AppError>>

  /** Find facts by confidence band */
  findByConfidence(band: ConfidenceBand): Promise<Result<readonly KnowledgeFact[], AppError>>

  /** Find facts that have no embedding yet (pending vector generation) */
  findWithoutEmbedding(): Promise<Result<readonly KnowledgeFact[], AppError>>

  /**
   * Vector similarity search — returns facts closest to the query embedding.
   * Parameters:
   *   queryVector: the embedding to search against
   *   topK:        number of results to return
   *   threshold:   minimum cosine similarity score (0–1, default 0)
   *
   * Mock implementation: computes cosine similarity in-memory.
   * Supabase implementation: uses pgvector <=> operator.
   */
  findSimilar(
    queryVector: readonly number[],
    topK: number,
    threshold?: number,
  ): Promise<Result<readonly KnowledgeFact[], AppError>>
}
