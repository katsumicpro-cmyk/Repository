import { ValueObject } from '@innovation-os/domain/core'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { Embedding } from '../fact/embedding.js'

type RecallQueryProps = {
  readonly queryText: string
  readonly queryEmbedding: Embedding
  readonly topK: number
  readonly minActivationScore: number
}

/**
 * RecallQuery — the intent behind a Knowledge Recall operation.
 *
 * Distinct from a search query:
 *   - Carries an Embedding (semantic intent, not keyword)
 *   - Has a minActivationScore threshold to suppress low-signal recalls
 *   - topK limits the semantic seed set, NOT the final activation result
 *     (graph traversal may surface additional facts beyond topK)
 */
export class RecallQuery extends ValueObject<RecallQueryProps> {
  private constructor(props: RecallQueryProps) {
    super(props)
  }

  static create(
    queryText: string,
    queryEmbedding: Embedding,
    options?: { topK?: number; minActivationScore?: number },
  ): Result<RecallQuery, AppError> {
    if (queryText.trim().length === 0) {
      return err(validationError('RecallQuery: queryText must not be empty'))
    }
    const topK = options?.topK ?? 10
    if (topK < 1 || topK > 100) {
      return err(validationError('RecallQuery: topK must be between 1 and 100'))
    }
    const minActivationScore = options?.minActivationScore ?? 0.0
    if (minActivationScore < 0 || minActivationScore > 1) {
      return err(validationError('RecallQuery: minActivationScore must be 0–1'))
    }
    return ok(new RecallQuery({ queryText: queryText.trim(), queryEmbedding, topK, minActivationScore }))
  }

  get queryText(): string { return this.props.queryText }
  get queryEmbedding(): Embedding { return this.props.queryEmbedding }
  get topK(): number { return this.props.topK }
  get minActivationScore(): number { return this.props.minActivationScore }
}
