import { ValueObject } from '@innovation-os/domain/core'
import { systemClock } from '@innovation-os/foundation/time'
import type { KnowledgeFact } from '../../fact/knowledge-fact.js'

export type ContradictionType =
  | 'explicit_edge'        // CONTRADICTS relation exists in graph
  | 'confidence_divergence' // connected facts have contradictory confidence levels
  | 'semantic_opposition'  // high embedding similarity but opposing confidence

type ContradictionProps = {
  readonly factA: KnowledgeFact
  readonly factB: KnowledgeFact
  readonly contradictionType: ContradictionType
  /** 0–1: how strongly contradictory */
  readonly severity: number
  readonly detectedAt: string
  readonly rationale: string
}

/**
 * Contradiction — a detected tension between two KnowledgeFacts.
 *
 * Contradictions are not errors — they are signals.
 * A contradiction means the knowledge base holds two things
 * that cannot both be fully true, and the system noticed.
 *
 * Types:
 *   explicit_edge:         A CONTRADICTS B edge exists in the graph.
 *                          The source explicitly marked this tension.
 *
 *   confidence_divergence: Facts A and B are connected (SUPPORTS/RELATED_TO),
 *                          but their confidence bands diverge dramatically.
 *                          e.g. A is 'verified' while B is 'low'.
 *                          This suggests one of them was recorded incorrectly.
 *
 *   semantic_opposition:   A and B have high embedding similarity (similar content)
 *                          but opposite confidence levels.
 *                          Same claim, different trust — this is contradiction by implication.
 */
export class Contradiction extends ValueObject<ContradictionProps> {
  private constructor(props: ContradictionProps) {
    super(props)
  }

  static create(input: {
    factA: KnowledgeFact
    factB: KnowledgeFact
    contradictionType: ContradictionType
    severity: number
    rationale: string
  }): Contradiction {
    return new Contradiction({
      ...input,
      severity: Math.max(0, Math.min(1, input.severity)),
      detectedAt: systemClock.now(),
    })
  }

  get factA(): KnowledgeFact { return this.props.factA }
  get factB(): KnowledgeFact { return this.props.factB }
  get contradictionType(): ContradictionType { return this.props.contradictionType }
  get severity(): number { return this.props.severity }
  get detectedAt(): string { return this.props.detectedAt }
  get rationale(): string { return this.props.rationale }

  isHighSeverity(): boolean { return this.props.severity >= 0.7 }

  toSummary(): string {
    return `[${this.props.contradictionType}] severity=${this.props.severity.toFixed(2)} — ${this.props.rationale}`
  }
}
