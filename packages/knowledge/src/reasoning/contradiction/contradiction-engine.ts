import type { KnowledgeGraph } from '../../graph/knowledge-graph.js'
import { Contradiction } from './contradiction.js'

const CONFIDENCE_RANK: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
  verified: 3,
}

/**
 * ContradictionEngine — domain service that detects tensions in a KnowledgeGraph.
 *
 * Three detection strategies, applied in order of explicitness:
 *
 * 1. Explicit CONTRADICTS edges
 *    The strongest signal: someone already marked these as contradictory.
 *    severity = 0.9
 *
 * 2. Confidence divergence
 *    Two facts connected by SUPPORTS/RELATED_TO/DERIVED_FROM,
 *    but with a confidence gap of ≥2 bands (e.g. verified vs low).
 *    This is suspicious: if A supports B, they should have similar confidence.
 *    severity = 0.4 + 0.15 × gap
 *
 * 3. Semantic opposition
 *    Two facts with high embedding similarity (cosine > threshold)
 *    but a large confidence gap.
 *    Nearly identical claims, opposite trust levels — one must be wrong.
 *    severity = similarity × 0.75
 *    Only runs when both facts have embeddings.
 *
 * Design: pure domain service. No I/O. No state. Deterministic.
 * The same graph always produces the same contradictions.
 */
export class ContradictionEngine {
  private readonly semanticSimilarityThreshold: number

  constructor(options?: { semanticSimilarityThreshold?: number }) {
    this.semanticSimilarityThreshold = options?.semanticSimilarityThreshold ?? 0.85
  }

  detect(graph: KnowledgeGraph): readonly Contradiction[] {
    const results: Contradiction[] = []
    const seen = new Set<string>()

    const key = (idA: string, idB: string): string =>
      [idA, idB].sort().join('::')

    const addIfNew = (c: Contradiction): void => {
      const k = key(c.factA.id, c.factB.id)
      if (!seen.has(k)) {
        seen.add(k)
        results.push(c)
      }
    }

    // ── Strategy 1: Explicit CONTRADICTS edges ───────────────────────────
    for (const edge of graph.edgesOfType('CONTRADICTS')) {
      const nodeA = graph.findNode(edge.sourceNodeId)
      const nodeB = graph.findNode(edge.targetNodeId)
      if (!nodeA || !nodeB) continue

      addIfNew(
        Contradiction.create({
          factA: nodeA.fact,
          factB: nodeB.fact,
          contradictionType: 'explicit_edge',
          severity: 0.9,
          rationale: `明示的なCONTRADICTS関係が記録されています`,
        }),
      )
    }

    // ── Strategy 2: Confidence divergence on connected facts ─────────────
    const connectedTypes = new Set(['SUPPORTS', 'RELATED_TO', 'DERIVED_FROM'])
    for (const edge of graph.edges) {
      if (!connectedTypes.has(edge.relationType)) continue

      const nodeA = graph.findNode(edge.sourceNodeId)
      const nodeB = graph.findNode(edge.targetNodeId)
      if (!nodeA || !nodeB) continue

      const rankA = CONFIDENCE_RANK[nodeA.fact.confidenceScore.band] ?? 0
      const rankB = CONFIDENCE_RANK[nodeB.fact.confidenceScore.band] ?? 0
      const gap = Math.abs(rankA - rankB)

      if (gap >= 2) {
        const severity = Math.min(1.0, 0.4 + gap * 0.15)
        const lower = rankA < rankB ? nodeA.fact : nodeB.fact
        const higher = rankA > rankB ? nodeA.fact : nodeB.fact

        addIfNew(
          Contradiction.create({
            factA: higher,
            factB: lower,
            contradictionType: 'confidence_divergence',
            severity,
            rationale: `接続された事実の確信度が乖離: ${higher.confidenceScore.band} vs ${lower.confidenceScore.band}`,
          }),
        )
      }
    }

    // ── Strategy 3: Semantic opposition (embedding-based) ────────────────
    const nodesWithEmbedding = graph.nodes.filter((n) => n.fact.hasEmbedding())
    for (let i = 0; i < nodesWithEmbedding.length; i++) {
      for (let j = i + 1; j < nodesWithEmbedding.length; j++) {
        const nodeA = nodesWithEmbedding[i]!
        const nodeB = nodesWithEmbedding[j]!

        const similarity = nodeA.fact.embedding!.cosineSimilarity(nodeB.fact.embedding!)
        if (similarity < this.semanticSimilarityThreshold) continue

        const rankA = CONFIDENCE_RANK[nodeA.fact.confidenceScore.band] ?? 0
        const rankB = CONFIDENCE_RANK[nodeB.fact.confidenceScore.band] ?? 0
        const gap = Math.abs(rankA - rankB)
        if (gap < 2) continue

        addIfNew(
          Contradiction.create({
            factA: nodeA.fact,
            factB: nodeB.fact,
            contradictionType: 'semantic_opposition',
            severity: Math.min(1.0, similarity * 0.75),
            rationale: `意味的に類似（sim=${similarity.toFixed(2)}）だが確信度が大きく異なる`,
          }),
        )
      }
    }

    return results.sort((a, b) => b.severity - a.severity)
  }
}
