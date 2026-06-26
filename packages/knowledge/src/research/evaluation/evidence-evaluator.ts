import type { KnowledgeFact } from '../../fact/knowledge-fact.js'
import type { EvidenceEvaluation } from '../evidence-evaluation.js'

/**
 * EvidenceEvaluator — pluggable evaluation strategy interface.
 *
 * The evaluation of evidence is not universal.
 * What counts as "sufficient proof" depends on context:
 *
 *   StatisticalEvaluator: count and weight, confidence-based scoring
 *   ScientificEvaluator:  replication, source diversity, falsifiability
 *   BusinessEvaluator:    feasibility, impact, speed of decision
 *   DesignEvaluator:      coherence, user-centricity, aesthetic fit
 *
 * By making the evaluator pluggable, the same collected evidence
 * can yield different verdicts depending on who is asking and why.
 *
 * A contradiction in a scientific context might be 'inconclusive'.
 * The same contradiction in a business context might be 'supported'
 * because 60% confidence is enough to act.
 *
 * Usage:
 *   ConductResearchUseCase receives an EvidenceEvaluator in its constructor.
 *   Swap the evaluator; change the epistemology.
 */
export interface EvidenceEvaluator {
  readonly evaluatorType: string
  readonly description: string

  evaluate(
    hypothesisId: string,
    collectedFacts: readonly KnowledgeFact[],
    seedFacts: readonly KnowledgeFact[],
  ): EvidenceEvaluation
}
