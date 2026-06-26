import { ConfidenceScore } from '../../fact/confidence-score.js'
import type { KnowledgeGraph } from '../../graph/knowledge-graph.js'
import type { KnowledgeNodeId } from '../../graph/knowledge-node.js'
import type { Contradiction } from '../contradiction/contradiction.js'
import type { ExtractedPattern } from '../pattern/extracted-pattern.js'
import { Hypothesis } from './hypothesis.js'

/**
 * HypothesisGenerator — domain service that generates hypotheses from
 * detected contradictions, extracted patterns, and graph structure.
 *
 * Three generation sources:
 *
 * 1. From contradictions
 *    Every contradiction is a hypothesis that one of the two facts needs correction.
 *    High-severity contradictions generate higher-confidence hypotheses.
 *
 * 2. From patterns
 *    hub_convergence  → emergent principle hypothesis
 *    causal_chain     → end-to-end causal hypothesis
 *    bridge_fact      → structural importance hypothesis (needs verification)
 *    high_confidence  → synthesis readiness hypothesis
 *
 * 3. From graph structure (transitivity)
 *    A CAUSES B, B CAUSES C → hypothesize A CAUSES C
 *    Only generated when the transitive link does not already exist.
 *    These are the most speculative — confidence is always low.
 *
 * Design: pure domain service. No I/O. No state. Deterministic.
 */
export class HypothesisGenerator {
  fromContradictions(contradictions: readonly Contradiction[]): readonly Hypothesis[] {
    return contradictions.map((c) => {
      const contentA = c.factA.content.slice(0, 50)
      const contentB = c.factB.content.slice(0, 50)

      return Hypothesis.create({
        claim: `「${contentA}」と「${contentB}」の間に矛盾がある。どちらがより正確か検証が必要。`,
        hypothesisType: 'resolve_contradiction',
        supportingFacts: [c.factA, c.factB],
        confidenceScore: c.severity >= 0.7 ? ConfidenceScore.medium() : ConfidenceScore.low(),
        sourceDescription: c.toSummary(),
      })
    })
  }

  fromPatterns(patterns: readonly ExtractedPattern[]): readonly Hypothesis[] {
    const hypotheses: Hypothesis[] = []

    for (const pattern of patterns) {
      switch (pattern.patternType) {
        case 'hub_convergence': {
          hypotheses.push(
            Hypothesis.create({
              claim: `「${pattern.centralFact.content.slice(0, 60)}」は${pattern.factCount - 1}件の事実が支持する原則候補である。`,
              hypothesisType: 'emergent_principle',
              supportingFacts: pattern.facts,
              confidenceScore: pattern.strength >= 0.8 ? ConfidenceScore.high() : ConfidenceScore.medium(),
              sourceDescription: pattern.description,
            }),
          )
          break
        }
        case 'causal_chain': {
          const last = pattern.facts[pattern.facts.length - 1]!
          hypotheses.push(
            Hypothesis.create({
              claim: `因果連鎖「${pattern.centralFact.content.slice(0, 40)}」→「${last.content.slice(0, 40)}」は全体として成立するか。`,
              hypothesisType: 'causal_hypothesis',
              supportingFacts: pattern.facts,
              confidenceScore: ConfidenceScore.low(),
              sourceDescription: pattern.description,
            }),
          )
          break
        }
        case 'high_confidence_cluster': {
          hypotheses.push(
            Hypothesis.create({
              claim: `${pattern.factCount}件の高確信度事実は統合可能な原則を示しているか。`,
              hypothesisType: 'emergent_principle',
              supportingFacts: pattern.facts,
              confidenceScore: ConfidenceScore.medium(),
              sourceDescription: pattern.description,
            }),
          )
          break
        }
        case 'bridge_fact': {
          hypotheses.push(
            Hypothesis.create({
              claim: `「${pattern.centralFact.content.slice(0, 60)}」はクラスタ間を繋ぐ重要な事実だが、検証が不足している可能性がある。`,
              hypothesisType: 'emergent_principle',
              supportingFacts: pattern.facts,
              confidenceScore: ConfidenceScore.low(),
              sourceDescription: pattern.description,
            }),
          )
          break
        }
      }
    }

    return hypotheses
  }

  fromGraph(graph: KnowledgeGraph): readonly Hypothesis[] {
    const hypotheses: Hypothesis[] = []

    // Transitivity: A CAUSES B + B CAUSES C → hypothesize A CAUSES C (if not already present)
    const causalEdges = graph.edgesOfType('CAUSES')
    const existingCausal = new Set(
      causalEdges.map((e) => `${e.sourceNodeId}:${e.targetNodeId}`),
    )

    for (const edgeAB of causalEdges) {
      for (const edgeBC of causalEdges) {
        if (edgeAB.targetNodeId !== edgeBC.sourceNodeId) continue
        const transKey = `${edgeAB.sourceNodeId}:${edgeBC.targetNodeId}`
        if (existingCausal.has(transKey)) continue // already known

        const nodeA = graph.findNode(edgeAB.sourceNodeId as KnowledgeNodeId)
        const nodeB = graph.findNode(edgeAB.targetNodeId as KnowledgeNodeId)
        const nodeC = graph.findNode(edgeBC.targetNodeId as KnowledgeNodeId)
        if (!nodeA || !nodeB || !nodeC) continue

        hypotheses.push(
          Hypothesis.create({
            claim: `「${nodeA.fact.content.slice(0, 40)}」は「${nodeB.fact.content.slice(0, 30)}」を介して間接的に「${nodeC.fact.content.slice(0, 40)}」を引き起こす可能性がある。`,
            hypothesisType: 'transitive_causation',
            supportingFacts: [nodeA.fact, nodeB.fact, nodeC.fact],
            confidenceScore: ConfidenceScore.low(),
            sourceDescription: `推移的因果: ${edgeAB.sourceNodeId} → ${edgeAB.targetNodeId} → ${edgeBC.targetNodeId}`,
          }),
        )
      }
    }

    return hypotheses
  }
}
