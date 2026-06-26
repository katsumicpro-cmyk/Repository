import { ConfidenceScore } from '../../fact/confidence-score.js'
import type { KnowledgeFact } from '../../fact/knowledge-fact.js'
import { EvidenceEvaluation } from '../evidence-evaluation.js'
import type { EvidenceEvaluator } from './evidence-evaluator.js'

/**
 * BusinessEvaluator — actionability and speed standard.
 *
 * Philosophy:
 *   Business decisions cannot wait for scientific certainty.
 *   "Better roughly right than precisely wrong" — Keynes.
 *   A single high-confidence fact may be sufficient to act.
 *   The cost of inaction (missing an opportunity) matters as much as
 *   the cost of a wrong decision.
 *
 * Requirements for 'supported':
 *   1. At least one high/verified supporting fact, OR
 *   2. Majority of evidence (> 60%) is medium+ confidence supporting
 *
 * Requirements for 'refuted':
 *   1. Multiple (2+) refuting facts that are medium+ confidence
 *
 * 'inconclusive' is rare — business context prefers to act or abstain
 * rather than to postpone indefinitely.
 *
 * Use when:
 *   - Time pressure exists
 *   - The decision is reversible
 *   - Missing an opportunity is costly
 *   - Domain: market strategy, product decisions, resource allocation
 */
export class BusinessEvaluator implements EvidenceEvaluator {
  readonly evaluatorType = 'business'
  readonly description = '意思決定速度と実行可能性を重視する事業評価。不完全な証拠での行動可否を判定する。'

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
    const hasHighSupport = supporting.some((f) => f.confidenceScore.band === 'high' || f.confidenceScore.band === 'verified')
    const supportRatio = newEvidence.length > 0 ? supporting.length / newEvidence.length : 0
    const mediumRefuting = refuting.filter((f) => f.confidenceScore.band !== 'low').length // none in this case by definition

    let verdict: EvidenceEvaluation['verdict']
    let reasoning: string

    if (newEvidence.length === 0) {
      verdict = 'inconclusive'
      reasoning = '証拠なし — 事業判断のベースが不足'
    } else if (hasHighSupport || supportRatio > 0.6) {
      verdict = 'supported'
      reasoning = `事業判断基準を満たす: 高確信度支持あり=${hasHighSupport}, 支持比率=${(supportRatio * 100).toFixed(0)}% (閾値:60%)`
    } else if (refuting.length >= 2 && supporting.length === 0) {
      verdict = 'refuted'
      reasoning = `反証優勢: ${refuting.length}件の反証に対して支持証拠なし — 事業リスクが高い`
    } else {
      verdict = 'inconclusive'
      reasoning = `判断材料不足 (支持:${supporting.length}件 [比率:${(supportRatio * 100).toFixed(0)}%], 反証:${refuting.length}件)`
    }

    return EvidenceEvaluation.create({
      hypothesisId,
      verdict,
      supportingFacts: supporting,
      refutingFacts: refuting,
      confidence: verdict === 'supported' ? ConfidenceScore.medium() : ConfidenceScore.low(),
      reasoning: `[BusinessEvaluator] ${reasoning}`,
    })
  }
}
