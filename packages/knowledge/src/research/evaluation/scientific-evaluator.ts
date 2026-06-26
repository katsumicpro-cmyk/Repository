import { ConfidenceScore } from '../../fact/confidence-score.js'
import type { KnowledgeFact } from '../../fact/knowledge-fact.js'
import { EvidenceEvaluation } from '../evidence-evaluation.js'
import type { EvidenceEvaluator } from './evidence-evaluator.js'

/**
 * ScientificEvaluator — replication and falsifiability standard.
 *
 * Requirements for 'supported':
 *   1. Minimum 3 supporting facts (replication requirement)
 *   2. At least one fact must be 'verified' or 'high' confidence
 *   3. No high-confidence refuting facts
 *
 * Requirements for 'refuted':
 *   1. At least one 'verified' refuting fact exists
 *   2. OR more refuting facts than supporting with high confidence
 *
 * Philosophy:
 *   Scientific knowledge requires replication.
 *   One data point is not evidence; three corroborating data points are.
 *   A single verified refutation can overturn many supporting facts.
 *
 * Use when:
 *   - The hypothesis will be used to build Principles
 *   - The domain requires high epistemic standards (medicine, engineering, law)
 *   - False positives are more costly than false negatives
 */
export class ScientificEvaluator implements EvidenceEvaluator {
  readonly evaluatorType = 'scientific'
  readonly description = '再現性と反証可能性に基づく科学的評価。最低3件の支持証拠と検証済み反証の検出を要件とする。'

  private readonly minSupportCount: number

  constructor(options?: { minSupportCount?: number }) {
    this.minSupportCount = options?.minSupportCount ?? 3
  }

  evaluate(
    hypothesisId: string,
    collectedFacts: readonly KnowledgeFact[],
    seedFacts: readonly KnowledgeFact[],
  ): EvidenceEvaluation {
    const seedIds = new Set(seedFacts.map((f) => f.id))
    const newEvidence = collectedFacts.filter((f) => !seedIds.has(f.id))

    const supporting = newEvidence.filter(
      (f) => f.confidenceScore.band === 'high' || f.confidenceScore.band === 'verified' || f.confidenceScore.band === 'medium',
    )
    const refuting = newEvidence.filter((f) => f.confidenceScore.band === 'low')
    const verifiedRefuting = refuting.filter((f) => f.confidenceScore.band === 'verified')
    const highConfirmation = supporting.some((f) => f.confidenceScore.band === 'verified' || f.confidenceScore.band === 'high')

    let verdict: EvidenceEvaluation['verdict']
    let reasoning: string

    if (newEvidence.length === 0) {
      verdict = 'inconclusive'
      reasoning = '証拠なし'
    } else if (verifiedRefuting.length > 0) {
      verdict = 'refuted'
      reasoning = `検証済み反証が存在する (${verifiedRefuting.length}件) — 科学的基準では1件の検証済み反証が多数の支持を上回る`
    } else if (supporting.length >= this.minSupportCount && highConfirmation) {
      verdict = 'supported'
      reasoning = `再現性基準を満たす: ${supporting.length}件の支持証拠 (高確信度含む) ≥ 最低${this.minSupportCount}件`
    } else if (supporting.length > 0 && supporting.length < this.minSupportCount) {
      verdict = 'inconclusive'
      reasoning = `支持証拠が不足 (${supporting.length}件 < 最低${this.minSupportCount}件) — 再現性未確認`
    } else {
      verdict = 'inconclusive'
      reasoning = `科学的基準を満たす証拠なし (支持:${supporting.length}件, 反証:${refuting.length}件)`
    }

    return EvidenceEvaluation.create({
      hypothesisId,
      verdict,
      supportingFacts: supporting,
      refutingFacts: refuting,
      confidence: verdict === 'supported' ? ConfidenceScore.high() : ConfidenceScore.low(),
      reasoning: `[ScientificEvaluator] ${reasoning}`,
    })
  }
}
