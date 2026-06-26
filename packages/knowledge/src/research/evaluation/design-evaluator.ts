import { ConfidenceScore } from '../../fact/confidence-score.js'
import type { KnowledgeFact } from '../../fact/knowledge-fact.js'
import { EvidenceEvaluation } from '../evidence-evaluation.js'
import type { EvidenceEvaluator } from './evidence-evaluator.js'

/**
 * DesignEvaluator — coherence, diversity, and user-centricity standard.
 *
 * Philosophy:
 *   Design decisions are validated differently from scientific or business ones.
 *   A hypothesis about design quality is supported when:
 *   1. Evidence comes from diverse perspectives (not all from the same source)
 *   2. Evidence points to internal coherence (facts support each other)
 *   3. At least some evidence is user/human-centered (tagged with 'user', 'human', etc.)
 *
 * Approximation (without semantic understanding):
 *   - Diversity: count unique sources; more sources → stronger support
 *   - Coherence: facts with similar confidence bands signal alignment
 *   - User-centricity: tags contain 'user', 'human', 'experience', 'behavior'
 *
 * Requirements for 'supported':
 *   1. Evidence from 2+ different sources (diversity)
 *   2. Majority is medium+ confidence
 *
 * Requirements for 'refuted':
 *   1. Single-source evidence dominates (low diversity = design echo chamber)
 *   2. OR all evidence is low confidence
 *
 * Use when:
 *   - The hypothesis is about product design, UX, or creative work
 *   - Multiple stakeholder perspectives matter
 *   - Single-source authority is a warning sign, not a strength
 */
export class DesignEvaluator implements EvidenceEvaluator {
  readonly evaluatorType = 'design'
  readonly description = '多様性・一貫性・ユーザー中心性を重視するデザイン評価。単一視点の証拠は警告サインとなる。'

  evaluate(
    hypothesisId: string,
    collectedFacts: readonly KnowledgeFact[],
    seedFacts: readonly KnowledgeFact[],
  ): EvidenceEvaluation {
    const seedIds = new Set(seedFacts.map((f) => f.id))
    const newEvidence = collectedFacts.filter((f) => !seedIds.has(f.id))

    const supporting = newEvidence.filter(
      (f) => f.confidenceScore.band !== 'low',
    )
    const refuting = newEvidence.filter((f) => f.confidenceScore.band === 'low')

    // Diversity: count distinct source labels
    const sourceLabels = new Set(newEvidence.map((f) => f.source.label))
    const diversityScore = sourceLabels.size

    // User-centricity: check tags
    const userCentricKeywords = ['user', 'human', 'experience', 'behavior', 'ユーザー', '人間', '体験', '行動']
    const hasUserEvidence = newEvidence.some((f) =>
      f.tags.some((tag) => userCentricKeywords.some((kw) => tag.toLowerCase().includes(kw))),
    )

    let verdict: EvidenceEvaluation['verdict']
    let reasoning: string

    if (newEvidence.length === 0) {
      verdict = 'inconclusive'
      reasoning = '証拠なし'
    } else if (diversityScore < 2 && newEvidence.length > 2) {
      verdict = 'refuted'
      reasoning = `情報源の多様性が不足 (${diversityScore}ソース) — デザイン評価はエコーチェンバーを警戒する`
    } else if (supporting.length >= 2 && diversityScore >= 2) {
      verdict = 'supported'
      reasoning = `多様な視点から支持: ${diversityScore}ソース, 支持証拠${supporting.length}件${hasUserEvidence ? ' (ユーザー中心の証拠含む)' : ''}`
    } else if (refuting.length > supporting.length) {
      verdict = 'refuted'
      reasoning = `低確信度証拠が優勢: refuting=${refuting.length}件 > supporting=${supporting.length}件`
    } else {
      verdict = 'inconclusive'
      reasoning = `デザイン評価基準を満たす証拠不足 (多様性:${diversityScore}ソース, 支持:${supporting.length}件)`
    }

    return EvidenceEvaluation.create({
      hypothesisId,
      verdict,
      supportingFacts: supporting,
      refutingFacts: refuting,
      confidence: verdict === 'supported' ? ConfidenceScore.medium() : ConfidenceScore.low(),
      reasoning: `[DesignEvaluator] ${reasoning}`,
    })
  }
}
