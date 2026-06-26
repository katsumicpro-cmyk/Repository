import { ValueObject } from '@innovation-os/domain/core'
import { systemClock } from '@innovation-os/foundation/time'
import type { KnowledgeFact } from '../../fact/knowledge-fact.js'

export type PatternType =
  | 'hub_convergence'      // multiple facts point to / support a single central fact
  | 'high_confidence_cluster' // group of high-confidence facts on same theme
  | 'causal_chain'         // linear sequence of CAUSES/PRECEDES edges
  | 'bridge_fact'          // a fact that connects otherwise separate subgraphs

type ExtractedPatternProps = {
  readonly patternType: PatternType
  /** The central or representative fact of this pattern */
  readonly centralFact: KnowledgeFact
  /** All facts participating in the pattern */
  readonly facts: readonly KnowledgeFact[]
  /** 0–1: how strong / how many facts support this pattern */
  readonly strength: number
  readonly description: string
  readonly detectedAt: string
}

/**
 * ExtractedPattern — a recurring structure detected in the KnowledgeGraph.
 *
 * Patterns are proto-principles: something is being confirmed repeatedly
 * by the structure of the graph, even if no one explicitly named it.
 *
 * Types:
 *   hub_convergence:         3+ facts all point to the same central fact.
 *                            This central fact is being confirmed from multiple directions.
 *                            Strong candidate for a Principle.
 *
 *   high_confidence_cluster: 3+ high-confidence facts coexist on the same theme.
 *                            The knowledge base has accumulated confident evidence
 *                            that may be ready for synthesis.
 *
 *   causal_chain:            A→B→C (CAUSES/PRECEDES edges forming a sequence).
 *                            A chain of causation worth validating as a whole.
 *
 *   bridge_fact:             A fact that is the only connection between two
 *                            otherwise separate clusters.
 *                            If this fact is wrong, the connection breaks.
 *                            High structural importance; needs verification.
 */
export class ExtractedPattern extends ValueObject<ExtractedPatternProps> {
  private constructor(props: ExtractedPatternProps) {
    super(props)
  }

  static create(input: {
    patternType: PatternType
    centralFact: KnowledgeFact
    facts: readonly KnowledgeFact[]
    strength: number
    description: string
  }): ExtractedPattern {
    return new ExtractedPattern({
      ...input,
      strength: Math.max(0, Math.min(1, input.strength)),
      detectedAt: systemClock.now(),
    })
  }

  get patternType(): PatternType { return this.props.patternType }
  get centralFact(): KnowledgeFact { return this.props.centralFact }
  get facts(): readonly KnowledgeFact[] { return this.props.facts }
  get strength(): number { return this.props.strength }
  get description(): string { return this.props.description }
  get detectedAt(): string { return this.props.detectedAt }
  get factCount(): number { return this.props.facts.length }

  isStrong(): boolean { return this.props.strength >= 0.7 }
}
