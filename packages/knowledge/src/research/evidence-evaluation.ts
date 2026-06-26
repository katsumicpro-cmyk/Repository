import { ValueObject } from '@innovation-os/domain/core'
import { systemClock } from '@innovation-os/foundation/time'
import type { KnowledgeFact } from '../fact/knowledge-fact.js'
import type { ConfidenceScore } from '../fact/confidence-score.js'

export type EvidenceVerdict = 'supported' | 'refuted' | 'inconclusive'

type EvidenceEvaluationProps = {
  readonly hypothesisId: string
  readonly verdict: EvidenceVerdict
  readonly supportingFacts: readonly KnowledgeFact[]
  readonly refutingFacts: readonly KnowledgeFact[]
  readonly confidence: ConfidenceScore
  readonly reasoning: string
  readonly evaluatedAt: string
}

/**
 * EvidenceEvaluation — the verdict reached after collecting and weighing evidence.
 *
 * After a ResearchPlan is executed and CollectedEvidence is gathered,
 * EvidenceEvaluation computes a verdict for the original Hypothesis.
 *
 * Scoring logic (see EvaluateEvidenceUseCase):
 *   supportScore = sum of (confidenceWeight × 1.0) for supporting facts
 *   refuteScore  = sum of (confidenceWeight × 1.0) for refuting facts
 *
 *   supported:    supportScore > refuteScore × 2.0  (clear preponderance)
 *   refuted:      refuteScore  > supportScore × 1.5 (clear contradiction)
 *   inconclusive: otherwise
 *
 * This is the output that drives Hypothesis lifecycle transitions:
 *   'supported' → Hypothesis.markSupported()
 *   'refuted'   → Hypothesis.markRefuted()
 *   'inconclusive' → Hypothesis remains 'pending'
 */
export class EvidenceEvaluation extends ValueObject<EvidenceEvaluationProps> {
  private constructor(props: EvidenceEvaluationProps) {
    super(props)
  }

  static create(input: {
    hypothesisId: string
    verdict: EvidenceVerdict
    supportingFacts: readonly KnowledgeFact[]
    refutingFacts: readonly KnowledgeFact[]
    confidence: ConfidenceScore
    reasoning: string
  }): EvidenceEvaluation {
    return new EvidenceEvaluation({ ...input, evaluatedAt: systemClock.now() })
  }

  get hypothesisId(): string { return this.props.hypothesisId }
  get verdict(): EvidenceVerdict { return this.props.verdict }
  get supportingFacts(): readonly KnowledgeFact[] { return this.props.supportingFacts }
  get refutingFacts(): readonly KnowledgeFact[] { return this.props.refutingFacts }
  get confidence(): ConfidenceScore { return this.props.confidence }
  get reasoning(): string { return this.props.reasoning }
  get evaluatedAt(): string { return this.props.evaluatedAt }

  get totalEvidenceCount(): number {
    return this.props.supportingFacts.length + this.props.refutingFacts.length
  }

  isResolved(): boolean {
    return this.props.verdict !== 'inconclusive'
  }

  toSummary(): string {
    return `[${this.props.verdict}] support=${this.props.supportingFacts.length} refute=${this.props.refutingFacts.length} — ${this.props.reasoning}`
  }
}
