import { ValueObject } from '@innovation-os/domain/core'
import { systemClock } from '@innovation-os/foundation/time'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { RecallQuery } from './recall-query.js'
import type { RecalledFact } from './recalled-fact.js'

type KnowledgeActivationProps = {
  readonly query: RecallQuery
  readonly facts: readonly RecalledFact[]  // sorted by activationScore desc
  readonly theme: string
  readonly activatedAt: string
  readonly seedCount: number       // directly similar to query
  readonly traversedCount: number  // surfaced via graph traversal
}

type CreateKnowledgeActivationInput = {
  readonly query: RecallQuery
  readonly seedFacts: readonly RecalledFact[]
  readonly traversedFacts: readonly RecalledFact[]
  readonly theme: string
}

/**
 * KnowledgeActivation — the result of a recall operation.
 *
 * This is NOT a search result list.
 * It is an activated cluster of knowledge — facts that are relevant,
 * connected to what is relevant, and scored by their activation weight.
 *
 * Key metrics:
 *   seedCount      — facts found by direct semantic similarity
 *   traversedCount — facts surfaced because they are connected to seeds
 *                    (the user did not ask for these; the graph surfaced them)
 *
 * hasUnexpectedConnections() returns true when traversedCount > 0.
 * This is the signal that knowledge recall surfaced something beyond search.
 *
 * The facts array is sorted by activationScore descending.
 * topFact() returns the most activated piece of knowledge.
 */
export class KnowledgeActivation extends ValueObject<KnowledgeActivationProps> {
  private constructor(props: KnowledgeActivationProps) {
    super(props)
  }

  static create(input: CreateKnowledgeActivationInput): Result<KnowledgeActivation, AppError> {
    const allFacts = [...input.seedFacts, ...input.traversedFacts]

    // Deduplicate by factId (a fact could appear as both seed and traversed)
    const seen = new Set<string>()
    const deduplicated = allFacts.filter((rf) => {
      const id = rf.fact.id
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    // Filter by minActivationScore
    const filtered = deduplicated.filter(
      (rf) => rf.activationScore >= input.query.minActivationScore,
    )

    if (filtered.length === 0 && allFacts.length > 0) {
      return err(
        validationError(
          `KnowledgeActivation: all ${allFacts.length} facts scored below minActivationScore (${input.query.minActivationScore})`,
        ),
      )
    }

    // Sort by activationScore descending
    const sorted = [...filtered].sort((a, b) => b.activationScore - a.activationScore)

    const seedIds = new Set(input.seedFacts.map((f) => f.fact.id))
    const traversedInResult = sorted.filter((f) => !seedIds.has(f.fact.id)).length

    return ok(
      new KnowledgeActivation({
        query: input.query,
        facts: sorted,
        theme: input.theme,
        activatedAt: systemClock.now(),
        seedCount: Math.min(input.seedFacts.length, sorted.length),
        traversedCount: traversedInResult,
      }),
    )
  }

  get query(): RecallQuery { return this.props.query }
  get facts(): readonly RecalledFact[] { return this.props.facts }
  get theme(): string { return this.props.theme }
  get activatedAt(): string { return this.props.activatedAt }
  get seedCount(): number { return this.props.seedCount }
  get traversedCount(): number { return this.props.traversedCount }
  get totalCount(): number { return this.props.facts.length }

  /** The highest-activation fact in this recall */
  topFact(): RecalledFact | undefined { return this.props.facts[0] }

  /**
   * hasUnexpectedConnections — true when graph traversal surfaced facts
   * beyond what the semantic search alone would have returned.
   *
   * This is the signal that Knowledge Recall worked as intended:
   * the system showed the user something they did not know to ask for.
   */
  hasUnexpectedConnections(): boolean { return this.props.traversedCount > 0 }

  /** High-activation facts (score >= 0.5) */
  highActivationFacts(): readonly RecalledFact[] {
    return this.props.facts.filter((f) => f.activationScore >= 0.5)
  }

  /** Summary for logging / UI rendering */
  toSummary(): {
    queryText: string
    theme: string
    totalCount: number
    seedCount: number
    traversedCount: number
    hasUnexpectedConnections: boolean
    topActivationScore: number
  } {
    return {
      queryText: this.props.query.queryText,
      theme: this.props.theme,
      totalCount: this.totalCount,
      seedCount: this.seedCount,
      traversedCount: this.traversedCount,
      hasUnexpectedConnections: this.hasUnexpectedConnections(),
      topActivationScore: this.topFact()?.activationScore ?? 0,
    }
  }
}
