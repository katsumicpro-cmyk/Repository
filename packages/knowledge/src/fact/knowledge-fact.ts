import { Entity, type EntityProps } from '@innovation-os/domain/core'
import { generateId, type PrefixedId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import { ConfidenceScore } from './confidence-score.js'
import { FactSource } from './fact-source.js'
import type { Embedding } from './embedding.js'
import type { FactSourceKind } from './fact-source.js'
import type { ConfidenceBand } from './confidence-score.js'

export type KnowledgeFactId = PrefixedId<'kfct'>

type KnowledgeFactProps = EntityProps & {
  readonly id: KnowledgeFactId
  readonly content: string
  readonly source: FactSource
  readonly confidenceScore: ConfidenceScore
  readonly embedding: Embedding | null
  readonly tags: readonly string[]
  readonly theme: string
}

export type CreateKnowledgeFactInput = {
  readonly content: string
  readonly sourceKind: FactSourceKind
  readonly sourceLabel: string
  readonly confidenceBand?: ConfidenceBand
  readonly tags?: readonly string[]
  readonly theme?: string
  readonly discoveryId?: string
}

/**
 * KnowledgeFact — persisted, identified piece of knowledge.
 *
 * Distinct from `Fact` (ValueObject in discovery domain):
 *   - Has an ID → can be referenced by Relations
 *   - Has an Embedding → ready for Vector DB storage
 *   - Tracked over time (createdAt / updatedAt)
 *
 * This is the atomic unit of the Knowledge Graph.
 */
export class KnowledgeFact extends Entity<KnowledgeFactProps> {
  private constructor(props: KnowledgeFactProps) {
    super(props)
  }

  static create(input: CreateKnowledgeFactInput): Result<KnowledgeFact, AppError> {
    if (input.content.trim().length === 0) {
      return err(validationError('KnowledgeFact content must not be empty'))
    }

    const sourceResult = FactSource.create(input.sourceKind, input.sourceLabel, {
      discoveryId: input.discoveryId,
    })
    if (sourceResult._tag === 'Err') return sourceResult

    const now = systemClock.now()
    return ok(
      new KnowledgeFact({
        id: generateId('kfct'),
        content: input.content.trim(),
        source: sourceResult.value,
        confidenceScore: ConfidenceScore.fromBand(input.confidenceBand ?? 'low'),
        embedding: null,
        tags: input.tags ?? [],
        theme: input.theme ?? '',
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  static reconstitute(props: KnowledgeFactProps): KnowledgeFact {
    return new KnowledgeFact(props)
  }

  get content(): string { return this.props.content }
  get source(): FactSource { return this.props.source }
  get confidenceScore(): ConfidenceScore { return this.props.confidenceScore }
  get embedding(): Embedding | null { return this.props.embedding }
  get tags(): readonly string[] { return this.props.tags }
  get theme(): string { return this.props.theme }

  hasEmbedding(): boolean { return this.props.embedding !== null }

  /**
   * withEmbedding — returns a new KnowledgeFact with embedding attached.
   * Called by EmbeddingPort after vector generation.
   */
  withEmbedding(embedding: Embedding): KnowledgeFact {
    return new KnowledgeFact({
      ...this.props,
      embedding,
      updatedAt: systemClock.now(),
    })
  }

  toProps(): KnowledgeFactProps { return this.props }
}
