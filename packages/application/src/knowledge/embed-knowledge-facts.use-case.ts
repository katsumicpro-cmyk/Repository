import { ok, isOk, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { KnowledgeFactRepository } from '@innovation-os/knowledge/repository'
import type { EmbeddingPort } from '@innovation-os/knowledge/embedding'
import type { KnowledgeFactId } from '@innovation-os/knowledge/fact'

export type EmbedKnowledgeFactsInput = {
  /** Optional: embed only specific facts. If omitted, embeds all facts without embedding. */
  readonly factIds?: readonly KnowledgeFactId[]
}

export type EmbedKnowledgeFactsOutput = {
  readonly embedded: number
  readonly failed: number
  readonly skipped: number
}

/**
 * EmbedKnowledgeFactsUseCase — attaches vector embeddings to KnowledgeFacts.
 *
 * Purpose:
 *   KnowledgeFacts are created without embeddings (embedding is expensive and
 *   should be deferred). This use case runs as a background batch process:
 *   1. Find facts without embedding (or a specified subset)
 *   2. Call EmbeddingPort.embed(content) for each
 *   3. Persist the updated fact with embedding attached
 *
 * Once embedded, facts become eligible for vector similarity search
 * and Knowledge Recall operations.
 *
 * Design note:
 *   Embedding is NOT done during KnowledgeFact.create() because:
 *   - It's async and I/O bound (EmbeddingPort is a network call in production)
 *   - Domain creation should be synchronous and pure
 *   - Batch processing is more efficient (API rate limits, cost)
 */
export class EmbedKnowledgeFactsUseCase {
  constructor(
    private readonly factRepo: KnowledgeFactRepository,
    private readonly embeddingPort: EmbeddingPort,
  ) {}

  async execute(input: EmbedKnowledgeFactsInput = {}): Promise<Result<EmbedKnowledgeFactsOutput, AppError>> {
    // 1. Collect facts to embed
    let factsToEmbed

    if (input.factIds && input.factIds.length > 0) {
      const results = await Promise.all(input.factIds.map((id) => this.factRepo.findById(id)))
      factsToEmbed = results.flatMap((r) => (isOk(r) ? [r.value] : []))
    } else {
      const allResult = await this.factRepo.findWithoutEmbedding()
      if (!isOk(allResult)) return allResult
      factsToEmbed = [...allResult.value]
    }

    // 2. Embed each fact and persist
    let embedded = 0
    let failed = 0
    let skipped = 0

    for (const fact of factsToEmbed) {
      // Skip already-embedded facts (idempotent)
      if (fact.hasEmbedding()) {
        skipped++
        continue
      }

      const embResult = await this.embeddingPort.embed(fact.content)
      if (!isOk(embResult)) {
        failed++
        continue
      }

      const embeddedFact = fact.withEmbedding(embResult.value)
      const saveResult = await this.factRepo.save(embeddedFact)
      if (!isOk(saveResult)) {
        failed++
        continue
      }

      embedded++
    }

    return ok({ embedded, failed, skipped })
  }
}
