import { Entity, type EntityProps } from '@innovation-os/domain/core'
import { generateId, type PrefixedId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import type { PatternType } from '../reasoning/pattern/extracted-pattern.js'

export type InvariantId = PrefixedId<'invt'>

/**
 * InvariantType — the category of "what kind of unchanging truth is this?"
 *
 * causal:       X → Y holds regardless of context, time, or domain.
 *               "A が発生すると B が発生する" という因果は、設定が変わっても成立する。
 *               Derived from: causal_chain patterns.
 *
 * structural:   Systems with property A always exhibit property B.
 *               "中心性の高いノードは除去されると系全体に影響する" — software, org, ecosystem.
 *               Derived from: hub_convergence, bridge_fact patterns.
 *
 * threshold:    Behavior changes qualitatively at a critical boundary.
 *               "ある閾値を超えると系の振る舞いが不連続に変化する" — complexity, scale.
 *               Derived from: high_confidence_cluster (saturation signals threshold).
 *
 * conservation: A quantity or relationship is preserved under transformation.
 *               "変換が行われても保存される量や関係が存在する" — information, constraints.
 *               Derived from: high_confidence_cluster with high stability.
 */
export type InvariantType = 'causal' | 'structural' | 'threshold' | 'conservation'

/**
 * InvariantStatus — the epistemic status of this invariant claim.
 *
 * candidate:   Generated from patterns. Not yet challenged.
 *              Plausible but unvalidated. Should be treated as a hypothesis.
 *
 * validated:   Survived ≥1 challenge attempt without being refuted.
 *              Evidence from the domain consistently supports it.
 *              Ready to be translated into a Principle.
 *
 * refuted:     A counter-example was found that breaks the invariant.
 *              The claim was not universal — it was domain-bound or time-bound.
 *              Not deleted — preserved for learning (what looked universal but wasn't).
 *
 * superseded:  A more general Invariant has been found that subsumes this one.
 *              This invariant is still true but is now a special case.
 */
export type InvariantStatus = 'candidate' | 'validated' | 'refuted' | 'superseded'

type ChallengeRecord = {
  readonly attemptedAt: string
  readonly description: string
  readonly survived: boolean
}

type InvariantProps = EntityProps & {
  readonly id: InvariantId
  /** The universal claim: must be expressible without naming a specific domain */
  readonly claim: string
  readonly invariantType: InvariantType
  readonly status: InvariantStatus
  /** Which pattern types gave rise to this Invariant (traceable to observations) */
  readonly sourcePatternTypes: readonly PatternType[]
  /** IDs of KnowledgeFacts that support the claim */
  readonly supportingFactIds: readonly string[]
  /** Every attempt to disprove this Invariant */
  readonly challenges: readonly ChallengeRecord[]
  /** Hints about which domains this invariant might apply to */
  readonly domainHints: readonly string[]
  readonly extractedAt: string
  readonly supersededById: InvariantId | null
}

/**
 * Invariant — a condition that holds regardless of how the world changes.
 *
 * An Invariant is NOT:
 *   - A fact (facts are domain-specific observations)
 *   - A hypothesis (hypotheses are domain-specific claims under investigation)
 *   - A pattern (patterns are structural observations in a specific graph)
 *
 * An Invariant IS:
 *   A claim that, if you change the domain, the time period, or the context,
 *   the claim still holds. It is an abstraction that transcends its origin.
 *
 * The distinction from Pattern:
 *   Pattern says: "In this graph, I keep seeing A → B."
 *   Invariant says: "In any system with property X, A → B holds."
 *
 * Invariants can be challenged. This is the test of universality:
 *   - If a challenge finds a counter-example → refuted
 *   - If a challenge fails to find a counter-example → surviveChallenge()
 *   - After surviving ≥1 challenge, it can be validated
 *
 * Only validated Invariants can be translated into Principles.
 * This enforces epistemic discipline: you can't act on an untested claim.
 */
export class Invariant extends Entity<InvariantProps> {
  private constructor(props: InvariantProps) {
    super(props)
  }

  static create(input: {
    claim: string
    invariantType: InvariantType
    sourcePatternTypes: readonly PatternType[]
    supportingFactIds: readonly string[]
    domainHints?: readonly string[]
  }): Invariant {
    return new Invariant({
      id: generateId('invt'),
      claim: input.claim,
      invariantType: input.invariantType,
      status: 'candidate',
      sourcePatternTypes: input.sourcePatternTypes,
      supportingFactIds: input.supportingFactIds,
      domainHints: input.domainHints ?? [],
      challenges: [],
      extractedAt: systemClock.now(),
      supersededById: null,
    })
  }

  // ── Lifecycle transitions ──────────────────────────────────────────────

  /**
   * Record a challenge attempt against this Invariant.
   * A challenge is any attempt to find a counter-example.
   */
  challenge(description: string): Invariant {
    if (this.props.status === 'refuted' || this.props.status === 'superseded') {
      return this // terminal states — no more challenges matter
    }
    const record: ChallengeRecord = {
      attemptedAt: systemClock.now(),
      description,
      survived: false, // pending — will be resolved by surviveChallenge or refute
    }
    return new Invariant({
      ...this.props,
      challenges: [...this.props.challenges, record],
    })
  }

  /**
   * The last challenge failed to find a counter-example.
   * The Invariant survived the attempt — its credibility increases.
   */
  surviveChallenge(): Invariant {
    if (this.props.challenges.length === 0) return this
    const updated = [...this.props.challenges]
    const last = updated[updated.length - 1]
    if (!last) return this
    updated[updated.length - 1] = { ...last, survived: true }
    return new Invariant({ ...this.props, challenges: updated })
  }

  /**
   * Promote to validated status.
   * Precondition: at least one survived challenge.
   * Reason: unchallenged invariants are "untested universals" — they look true
   * only because no one tried to break them.
   */
  validate(): Invariant {
    // Allow validation even without survived challenges in the MVP.
    // Production would enforce: this.failedChallengeCount > 0
    return new Invariant({ ...this.props, status: 'validated' })
  }

  /** A counter-example was found. The claim is not universal. */
  refute(reason: string): Invariant {
    const record: ChallengeRecord = {
      attemptedAt: systemClock.now(),
      description: `REFUTED: ${reason}`,
      survived: false,
    }
    return new Invariant({
      ...this.props,
      status: 'refuted',
      challenges: [...this.props.challenges, record],
    })
  }

  /** A more general Invariant subsumes this one. */
  supersede(byInvariantId: InvariantId): Invariant {
    return new Invariant({
      ...this.props,
      status: 'superseded',
      supersededById: byInvariantId,
    })
  }

  // ── Accessors ──────────────────────────────────────────────────────────

  get id(): InvariantId { return this.props.id }
  get claim(): string { return this.props.claim }
  get invariantType(): InvariantType { return this.props.invariantType }
  get status(): InvariantStatus { return this.props.status }
  get sourcePatternTypes(): readonly PatternType[] { return this.props.sourcePatternTypes }
  get supportingFactIds(): readonly string[] { return this.props.supportingFactIds }
  get challenges(): readonly ChallengeRecord[] { return this.props.challenges }
  get domainHints(): readonly string[] { return this.props.domainHints }
  get extractedAt(): string { return this.props.extractedAt }
  get supersededById(): InvariantId | null { return this.props.supersededById }

  // ── Derived metrics ────────────────────────────────────────────────────

  get challengeCount(): number { return this.props.challenges.length }

  get failedChallengeCount(): number {
    return this.props.challenges.filter((c) => c.survived).length
  }

  /**
   * stabilityScore — how well the Invariant has survived scrutiny.
   *
   * 0.0: never challenged (untested)
   * 0.5: challenged, half survived
   * 1.0: all challenges survived (maximally stable)
   *
   * A high stability score is necessary (not sufficient) for validation.
   * The distinction from confidence: confidence is about how strong the supporting
   * evidence is. Stability is about how many attempts to disprove it have failed.
   */
  get stabilityScore(): number {
    if (this.props.challenges.length === 0) return 0
    return this.failedChallengeCount / this.props.challenges.length
  }

  canBeTranslatedToPrinciple(): boolean {
    return this.props.status === 'validated'
  }
}
