import { Entity, type EntityProps } from '@innovation-os/domain/core'
import { generateId, type PrefixedId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import type { InvariantId, InvariantType } from './invariant.js'

export type PrincipleId = PrefixedId<'prpl'>

/**
 * PrincipleStatus — the operational status of this Principle.
 *
 * draft:      Generated from an Invariant. Not yet reviewed for domain fit.
 *             Should be treated as a proposal, not a directive.
 *
 * active:     Accepted for use within the domain. Can inform decisions.
 *             The Principle is currently applicable.
 *
 * deprecated: The underlying Invariant was superseded or refuted,
 *             or the domain conditions changed such that the translation no longer holds.
 *             Preserved for historical traceability.
 */
export type PrincipleStatus = 'draft' | 'active' | 'deprecated'

type PrincipleProps = EntityProps & {
  readonly id: PrincipleId
  /**
   * The Principle stated as an actionable directive for this domain.
   * Unlike the Invariant's universal claim, this is domain-specific and prescriptive.
   * Example: "共有データベースへの依存は排除し、各サービスが自身のデータを所有すること"
   */
  readonly claim: string
  /**
   * The domain this Principle applies to.
   * Example: "ソフトウェアアーキテクチャ", "組織設計", "製品開発"
   * Invariants are domain-agnostic. Principles are domain-specific.
   * Same Invariant → different Principles per domain.
   */
  readonly domain: string
  /** The Invariant this Principle was translated from */
  readonly sourceInvariantId: InvariantId
  /** Which type of Invariant this came from (preserved for traceability) */
  readonly sourceInvariantType: InvariantType
  /**
   * When does this Principle apply?
   * Conditions that must hold for the Principle to be valid.
   * A Principle without applicability conditions is either trivially true or dangerously over-general.
   */
  readonly applicabilityConditions: readonly string[]
  /**
   * What should a practitioner DO differently because of this Principle?
   * One concrete action or design decision.
   */
  readonly actionableStatement: string
  readonly status: PrincipleStatus
  readonly derivedAt: string
  readonly deprecatedAt: string | null
  readonly deprecationReason: string | null
}

/**
 * Principle — an Invariant translated into domain-specific, actionable knowledge.
 *
 * The distinction from Invariant:
 *   Invariant: "複雑なシステムほど単一障害点を持つ" (universal, domain-agnostic)
 *   Principle (ソフトウェア): "共有DBはマイクロサービスの単一障害点となる。各サービスは自身のDBを持つこと"
 *   Principle (組織設計): "全権限が一人に集中するチームは、その人の離脱で機能停止する。意思決定を分散すること"
 *
 * Same Invariant → multiple Principles across domains.
 * This is the translation layer: from universal truth to domain practice.
 *
 * The distinction from Pattern:
 *   Pattern: "このグラフで、Aを参照する事実が3つある" (observation)
 *   Principle: "Aに依存する設計はAの変更コストを高くする。依存方向を逆転させること" (prescription)
 *
 * Design:
 *   A Principle without a source Invariant is an opinion.
 *   An Invariant without a Principle is abstract wisdom that cannot be used.
 *   The chain Pattern → Invariant → Principle is the full epistemological pipeline.
 */
export class Principle extends Entity<PrincipleProps> {
  private constructor(props: PrincipleProps) {
    super(props)
  }

  /**
   * Factory: Principle must always come from a validated Invariant.
   * The sourceInvariantId preserves the epistemic chain:
   *   Principle ← Invariant ← Patterns ← KnowledgeFacts
   */
  static fromInvariant(input: {
    claim: string
    domain: string
    sourceInvariantId: InvariantId
    sourceInvariantType: InvariantType
    applicabilityConditions: readonly string[]
    actionableStatement: string
  }): Principle {
    return new Principle({
      id: generateId('prpl'),
      claim: input.claim,
      domain: input.domain,
      sourceInvariantId: input.sourceInvariantId,
      sourceInvariantType: input.sourceInvariantType,
      applicabilityConditions: input.applicabilityConditions,
      actionableStatement: input.actionableStatement,
      status: 'draft',
      derivedAt: systemClock.now(),
      deprecatedAt: null,
      deprecationReason: null,
    })
  }

  // ── Lifecycle transitions ──────────────────────────────────────────────

  activate(): Principle {
    return new Principle({ ...this.props, status: 'active' })
  }

  deprecate(reason: string): Principle {
    return new Principle({
      ...this.props,
      status: 'deprecated',
      deprecatedAt: systemClock.now(),
      deprecationReason: reason,
    })
  }

  // ── Accessors ──────────────────────────────────────────────────────────

  get id(): PrincipleId { return this.props.id }
  get claim(): string { return this.props.claim }
  get domain(): string { return this.props.domain }
  get sourceInvariantId(): InvariantId { return this.props.sourceInvariantId }
  get sourceInvariantType(): InvariantType { return this.props.sourceInvariantType }
  get applicabilityConditions(): readonly string[] { return this.props.applicabilityConditions }
  get actionableStatement(): string { return this.props.actionableStatement }
  get status(): PrincipleStatus { return this.props.status }
  get derivedAt(): string { return this.props.derivedAt }
  get deprecatedAt(): string | null { return this.props.deprecatedAt }
  get deprecationReason(): string | null { return this.props.deprecationReason }

  isActionable(): boolean { return this.props.status === 'active' }
}
