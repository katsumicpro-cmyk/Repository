import { ok, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import { Embedding } from '../fact/embedding.js'
import type { EmbeddingPort } from './embedding-port.js'

/**
 * MockEmbeddingPort — deterministic, zero-cost embedding implementation.
 *
 * Returns a unit-normalized pseudo-random vector seeded by the input text.
 * This is NOT semantically meaningful, but it:
 *   - Always succeeds (no network)
 *   - Returns consistent vectors for the same input (deterministic)
 *   - Has the right dimensions for schema validation
 *   - Allows Embedding-dependent logic (cosine similarity) to be tested
 */
export class MockEmbeddingPort implements EmbeddingPort {
  readonly dimensions: number
  readonly modelName: string

  constructor(dimensions = 8) {
    this.dimensions = dimensions
    this.modelName = 'mock-embedding-v0'
  }

  async embed(text: string): Promise<Result<Embedding, AppError>> {
    const vector = this.pseudoVector(text)
    return Embedding.create(vector, this.modelName)
  }

  /** Simple deterministic hash → normalized vector */
  private pseudoVector(text: string): number[] {
    const raw: number[] = []
    let seed = 0
    for (let i = 0; i < text.length; i++) {
      seed = (seed * 31 + text.charCodeAt(i)) >>> 0
    }
    for (let i = 0; i < this.dimensions; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      raw.push((seed / 0xffffffff) * 2 - 1)
    }
    // normalize to unit vector
    const norm = Math.sqrt(raw.reduce((s, v) => s + v * v, 0)) || 1
    return raw.map((v) => v / norm)
  }
}
