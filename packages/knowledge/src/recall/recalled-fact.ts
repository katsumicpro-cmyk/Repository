import { ValueObject } from '@innovation-os/domain/core'
import type { KnowledgeFact } from '../fact/knowledge-fact.js'
import type { Embedding } from '../fact/embedding.js'

type RecalledFactProps = {
  readonly fact: KnowledgeFact
  readonly relevanceScore: number   // cosine similarity to query embedding (0–1)
  readonly activationScore: number  // final score after confidence + graph weighting
  readonly isSeed: boolean          // true = direct similarity match; false = graph-traversed
}

const CONFIDENCE_WEIGHTS: Record<string, number> = {
  low: 0.4,
  medium: 0.6,
  high: 0.8,
  verified: 1.0,
}

/**
 * RecalledFact — a KnowledgeFact with its recall scores attached.
 *
 * The activationScore formula is the core of "recall not search":
 *
 *   relevanceScore  = cosine_similarity(fact.embedding, query.embedding)
 *                     0.0 if the fact has no embedding
 *
 *   confidenceWeight = band → { low: 0.4, medium: 0.6, high: 0.8, verified: 1.0 }
 *
 *   graphBonus       = 0.2 if the fact was surfaced via graph traversal (isSeed=false)
 *                     This rewards facts CONNECTED to relevant facts,
 *                     even if not directly similar to the query.
 *                     A fact the user would never have searched for,
 *                     but is semantically adjacent to what they care about.
 *
 *   activationScore = (relevanceScore * confidenceWeight) + graphBonus
 *
 * Why this is recall and not search:
 *   Search returns what matches the query.
 *   Recall surfaces what is relevant AND what is connected to what is relevant.
 *   The graphBonus is the mechanism that makes unexpected connections visible.
 */
export class RecalledFact extends ValueObject<RecalledFactProps> {
  private constructor(props: RecalledFactProps) {
    super(props)
  }

  /**
   * score — compute recall scores for a KnowledgeFact against a query embedding.
   *
   * @param fact           The KnowledgeFact to score
   * @param queryEmbedding The embedding of the recall query
   * @param isGraphTraversed true if this fact was found via graph traversal (not direct similarity)
   */
  static score(
    fact: KnowledgeFact,
    queryEmbedding: Embedding,
    isGraphTraversed: boolean,
  ): RecalledFact {
    const relevanceScore = fact.hasEmbedding()
      ? fact.embedding!.cosineSimilarity(queryEmbedding)
      : 0.0

    const confidenceWeight = CONFIDENCE_WEIGHTS[fact.confidenceScore.band] ?? 0.4
    const graphBonus = isGraphTraversed ? 0.2 : 0.0
    const activationScore = Math.min(1.0, relevanceScore * confidenceWeight + graphBonus)

    return new RecalledFact({
      fact,
      relevanceScore,
      activationScore,
      isSeed: !isGraphTraversed,
    })
  }

  get fact(): KnowledgeFact { return this.props.fact }
  get relevanceScore(): number { return this.props.relevanceScore }
  get activationScore(): number { return this.props.activationScore }
  get isSeed(): boolean { return this.props.isSeed }
  get isGraphTraversed(): boolean { return !this.props.isSeed }
}
