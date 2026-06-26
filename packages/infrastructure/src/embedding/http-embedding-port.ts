import { ok, err, type Result } from '@innovation-os/shared/result'
import { infrastructureError } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import { Embedding } from '@innovation-os/knowledge/fact'
import type { EmbeddingPort } from '@innovation-os/knowledge/embedding'

export type HttpEmbeddingConfig = {
  /** e.g. "https://api.openai.com/v1/embeddings" or "https://api.voyageai.com/v1/embeddings" */
  readonly endpoint: string
  readonly apiKey: string
  /** e.g. "text-embedding-3-small" (OpenAI) or "voyage-3" (Voyage AI) */
  readonly model: string
  /** Expected vector dimensions. Used for validation. */
  readonly dimensions: number
}

/**
 * HttpEmbeddingPort — provider-agnostic EmbeddingPort via HTTP.
 *
 * Works with any OpenAI-compatible embedding endpoint:
 *   - OpenAI:    endpoint="https://api.openai.com/v1/embeddings", model="text-embedding-3-small"
 *   - Voyage AI: endpoint="https://api.voyageai.com/v1/embeddings", model="voyage-3"
 *
 * Why not use a specific SDK (openai, voyageai)?
 *   Provider independence is a first-class design constraint.
 *   A raw HTTP call with a typed response interface is more portable
 *   and avoids transitive dependencies on provider-specific packages.
 *   Swap the endpoint and model in config; this class never changes.
 *
 * Usage:
 *   const port = new HttpEmbeddingPort({
 *     endpoint: process.env.EMBEDDING_ENDPOINT,
 *     apiKey: process.env.EMBEDDING_API_KEY,
 *     model: process.env.EMBEDDING_MODEL,
 *     dimensions: 1536,
 *   })
 */
export class HttpEmbeddingPort implements EmbeddingPort {
  readonly dimensions: number
  readonly modelName: string

  constructor(private readonly config: HttpEmbeddingConfig) {
    this.dimensions = config.dimensions
    this.modelName = config.model
  }

  async embed(text: string): Promise<Result<Embedding, AppError>> {
    const trimmed = text.trim()
    if (trimmed.length === 0) {
      return err(infrastructureError('HttpEmbeddingPort: cannot embed empty text'))
    }

    let response: Response
    try {
      response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          input: trimmed,
          model: this.config.model,
        }),
      })
    } catch (cause) {
      return err(
        infrastructureError(
          `HttpEmbeddingPort: network error calling ${this.config.endpoint}: ${String(cause)}`,
        ),
      )
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '(unreadable)')
      return err(
        infrastructureError(
          `HttpEmbeddingPort: HTTP ${response.status} from ${this.config.endpoint}: ${body}`,
        ),
      )
    }

    let data: unknown
    try {
      data = await response.json()
    } catch {
      return err(infrastructureError('HttpEmbeddingPort: failed to parse JSON response'))
    }

    const vector = extractVector(data)
    if (!vector) {
      return err(
        infrastructureError(
          'HttpEmbeddingPort: unexpected response shape — expected data[0].embedding array',
        ),
      )
    }

    if (vector.length !== this.config.dimensions) {
      return err(
        infrastructureError(
          `HttpEmbeddingPort: dimension mismatch — expected ${this.config.dimensions}, got ${vector.length}`,
        ),
      )
    }

    return Embedding.create(vector, this.modelName)
  }
}

/**
 * extractVector — parse OpenAI-compatible embedding response.
 *
 * Expected shape:
 *   { data: [{ embedding: number[] }] }
 */
function extractVector(data: unknown): number[] | null {
  if (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    const first = (data as { data: unknown[] }).data[0]
    if (
      typeof first === 'object' &&
      first !== null &&
      'embedding' in first &&
      Array.isArray((first as { embedding: unknown }).embedding)
    ) {
      const emb = (first as { embedding: unknown[] }).embedding
      if (emb.every((v) => typeof v === 'number')) {
        return emb as number[]
      }
    }
  }
  return null
}
