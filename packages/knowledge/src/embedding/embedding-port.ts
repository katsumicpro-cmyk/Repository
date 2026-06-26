import type { Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { Embedding } from '../fact/embedding.js'

/**
 * EmbeddingPort — interface for generating dense vector representations.
 *
 * AI Provider independence:
 *   The Knowledge domain knows nothing about which model generates embeddings.
 *   Implementations live in packages/infrastructure (or packages/ai-core):
 *     - MockEmbeddingPort:   returns zero-vectors (no network calls)
 *     - OpenAIEmbeddingPort: uses text-embedding-3-small
 *     - AnthropicEmbeddingPort: (when available)
 *
 * Vector DB readiness:
 *   The generated Embedding is attached to a KnowledgeFact via withEmbedding().
 *   Supabase pgvector stores the vector in a vector(N) column.
 */
export interface EmbeddingPort {
  /**
   * Generate an embedding for a given text.
   * Returns Result so the use case can handle failure gracefully
   * without throwing (e.g. rate limit → retry, quota exceeded → degrade).
   */
  embed(text: string): Promise<Result<Embedding, AppError>>

  /** The number of dimensions this port produces (e.g. 1536 for OpenAI) */
  readonly dimensions: number

  /** Identifier for the underlying model (used for cache invalidation) */
  readonly modelName: string
}
