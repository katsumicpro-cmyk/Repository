import { ConfidenceScore } from '../../fact/confidence-score.js'
import type { KnowledgeFact } from '../../fact/knowledge-fact.js'
import { EvidenceEvaluation } from '../evidence-evaluation.js'
import type { EvidenceEvaluator } from './evidence-evaluator.js'

const CONFIDENCE_WEIGHTS: Record<string, number> = {
  low: 0.3,
  medium: 0.6,
  high: 0.9,
  verified: 1.0,
}

/**
 * StatisticalEvaluator — confidence-weighted counting.
 *
 * Scoring:
 *   Each fact contributes a weight based on its confidence band.
 *   high/verified facts → support score
 *   low facts → refute score (weak evidence weighs against the hypothesis)
 *   medium facts → mild support (×0.5)
 *
 * Thresholds:
 *   supported:    supportScore > refuteScore × 2.0
 *   refuted:      refuteScore  > supportScore × 1.5
 *   inconclusive: otherwise
 *
 * Use when:
 *   - Volume of evidence matters
 *   - Confidence bands are meaningful
 *   - You want a conservative, auditable verdict
 */
export class StatisticalEvaluator implements EvidenceEvaluator {
  readonly evaluatorType = 'statistical'
  readonly description = '確信度加重スコアによる統計的評価。証拠の量と質を重みづけして判定する。'

  evaluate(
    hypothesisId: string,
    collectedFacts: readonly KnowledgeFact[],
    seedFacts: readonly KnowledgeFact[],
  ): EvidenceEvaluation {
    const seedIds = new Set(seedFacts.map((f) => f.id))
    const newEvidence = collectedFacts.filter((f) => !seedIds.has(f.id))

    let supportScore = 0
    let refuteScore = 0
    const supporting: KnowledgeFact[] = []
    const refuting: KnowledgeFact[] = []

    for (const fact of newEvidence) {
      const w = CONFIDENCE_WEIGHTS[fact.confidenceScore.band] ?? 0.3
      if (fact.confidenceScore.band === 'high' || fact.confidenceScore.band === 'verified') {
        supportScore += w; supporting.push(fact)
      } else if (fact.confidenceScore.band === 'low') {
        refuteScore += w; refuting.push(fact)
      } else {
        supportScore += w * 0.5; supporting.push(fact)
      }
    }

    const { verdict, reasoning } = resolveVerdict(
      newEvidence.length, supportScore, refuteScore, supporting.length, refuting.length,
      'support×2 > refute', 'refute×1.5 > support',
    )

    return EvidenceEvaluation.create({
      hypothesisId,
      verdict,
      supportingFacts: supporting,
      refutingFacts: refuting,
      confidence: verdict === 'inconclusive' ? ConfidenceScore.low() : ConfidenceScore.medium(),
      reasoning: `[StatisticalEvaluator] ${reasoning}`,
    })
  }
}

// ── shared helper ──────────────────────────────────────────────────────────

export function resolveVerdict(
  evidenceCount: number,
  supportScore: number,
  refuteScore: number,
  supportCount: number,
  refuteCount: number,
  supportLabel: string,
  refuteLabel: string,
): { verdict: EvidenceEvaluation['verdict']; reasoning: string } {
  if (evidenceCount === 0) {
    return { verdict: 'inconclusive', reasoning: `新しい証拠なし (収集: ${evidenceCount}件)` }
  }
  if (supportScore > refuteScore * 2.0) {
    return {
      verdict: 'supported',
      reasoning: `支持優勢 (${supportLabel}): support=${supportScore.toFixed(2)} refute=${refuteScore.toFixed(2)} [${supportCount}件 vs ${refuteCount}件]`,
    }
  }
  if (refuteScore > supportScore * 1.5) {
    return {
      verdict: 'refuted',
      reasoning: `反証優勢 (${refuteLabel}): support=${supportScore.toFixed(2)} refute=${refuteScore.toFixed(2)} [${supportCount}件 vs ${refuteCount}件]`,
    }
  }
  return {
    verdict: 'inconclusive',
    reasoning: `証拠拮抗: support=${supportScore.toFixed(2)} refute=${refuteScore.toFixed(2)} [${supportCount}件 vs ${refuteCount}件]`,
  }
}
