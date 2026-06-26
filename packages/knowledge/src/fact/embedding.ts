import { ValueObject } from '@innovation-os/domain/core'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'

type EmbeddingProps = {
  readonly vector: readonly number[]
  readonly dimensions: number
  readonly model: string
}

/**
 * Embedding — dense vector representation of a KnowledgeFact's content.
 *
 * Design intent:
 *  - Stored alongside the Fact so Vector DB queries can retrieve the full Fact
 *  - `model` tracks which embedding model produced the vector (for cache invalidation)
 *  - Dimensions are validated at creation time to catch model mismatch bugs early
 *
 * Future: pgvector stores this as a `vector(N)` column in Supabase.
 */
export class Embedding extends ValueObject<EmbeddingProps> {
  private constructor(props: EmbeddingProps) {
    super(props)
  }

  static create(vector: readonly number[], model: string): Result<Embedding, AppError> {
    if (vector.length === 0) {
      return err(validationError('Embedding vector must not be empty'))
    }
    if (model.trim().length === 0) {
      return err(validationError('Embedding model name must not be empty'))
    }
    return ok(new Embedding({ vector, dimensions: vector.length, model: model.trim() }))
  }

  get vector(): readonly number[] { return this.props.vector }
  get dimensions(): number { return this.props.dimensions }
  get model(): string { return this.props.model }

  /** Cosine similarity — used for nearest-neighbour search in tests */
  cosineSimilarity(other: Embedding): number {
    if (this.dimensions !== other.dimensions) return 0
    let dot = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < this.dimensions; i++) {
      const a = this.vector[i] ?? 0
      const b = other.vector[i] ?? 0
      dot += a * b
      normA += a * a
      normB += b * b
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB)
    return denom === 0 ? 0 : dot / denom
  }
}
