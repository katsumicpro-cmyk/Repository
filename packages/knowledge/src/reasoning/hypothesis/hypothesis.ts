import { Entity, type EntityProps } from '@innovation-os/domain/core'
import { generateId, type PrefixedId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import { ConfidenceScore } from '../../fact/confidence-score.js'
import type { KnowledgeFact } from '../../fact/knowledge-fact.js'

export type HypothesisId = PrefixedId<'hypo'>

export type HypothesisType =
  | 'resolve_contradiction'  // two contradicting facts → one must be resolved
  | 'emergent_principle'     // hub convergence → could be a principle
  | 'causal_hypothesis'      // causal chain → end-to-end causation
  | 'transitive_causation'   // A→B, B→C → infer A→C
  | 'missing_relation'       // high semantic similarity but no explicit edge

export type HypothesisStatus = 'pending' | 'supported' | 'refuted' | 'accepted'

type HypothesisProps = EntityProps & {
  readonly id: HypothesisId
  readonly claim: string
  readonly hypothesisType: HypothesisType
  readonly supportingFacts: readonly KnowledgeFact[]
  readonly confidenceScore: ConfidenceScore
  readonly status: HypothesisStatus
  readonly sourceDescription: string
}

/**
 * Hypothesis — a claim generated from detected contradictions or patterns.
 *
 * A hypothesis is the system saying: "Based on what I know,
 * I believe this might be true — but I need verification."
 *
 * Lifecycle:
 *   pending   → the hypothesis has been generated but not yet evaluated
 *   supported → evidence was found that strengthens the claim
 *   refuted   → evidence was found that contradicts the claim
 *   accepted  → the hypothesis has been validated and promoted to knowledge
 *
 * The lifecycle is intentionally simple for MVP.
 * Future: add transitions with domain events.
 */
export class Hypothesis extends Entity<HypothesisProps> {
  private constructor(props: HypothesisProps) {
    super(props)
  }

  static create(input: {
    claim: string
    hypothesisType: HypothesisType
    supportingFacts: readonly KnowledgeFact[]
    confidenceScore?: ConfidenceScore
    sourceDescription: string
  }): Hypothesis {
    const now = systemClock.now()
    return new Hypothesis({
      id: generateId('hypo'),
      claim: input.claim,
      hypothesisType: input.hypothesisType,
      supportingFacts: input.supportingFacts,
      confidenceScore: input.confidenceScore ?? ConfidenceScore.low(),
      status: 'pending',
      sourceDescription: input.sourceDescription,
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(props: HypothesisProps): Hypothesis {
    return new Hypothesis(props)
  }

  get claim(): string { return this.props.claim }
  get hypothesisType(): HypothesisType { return this.props.hypothesisType }
  get supportingFacts(): readonly KnowledgeFact[] { return this.props.supportingFacts }
  get confidenceScore(): ConfidenceScore { return this.props.confidenceScore }
  get status(): HypothesisStatus { return this.props.status }
  get sourceDescription(): string { return this.props.sourceDescription }

  isPending(): boolean { return this.props.status === 'pending' }

  markSupported(): Hypothesis {
    return new Hypothesis({ ...this.props, status: 'supported', updatedAt: systemClock.now() })
  }

  markRefuted(): Hypothesis {
    return new Hypothesis({ ...this.props, status: 'refuted', updatedAt: systemClock.now() })
  }

  accept(): Hypothesis {
    return new Hypothesis({ ...this.props, status: 'accepted', updatedAt: systemClock.now() })
  }

  toProps(): HypothesisProps { return this.props }
}
