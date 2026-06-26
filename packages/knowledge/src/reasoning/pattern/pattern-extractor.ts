import type { KnowledgeGraph } from '../../graph/knowledge-graph.js'
import type { KnowledgeNodeId } from '../../graph/knowledge-node.js'
import { ExtractedPattern } from './extracted-pattern.js'

const HUB_MIN_INCOMING = 3
const CLUSTER_MIN_SIZE = 3
const CHAIN_MIN_LENGTH = 2

/**
 * PatternExtractor — domain service that detects structural patterns in a KnowledgeGraph.
 *
 * Four extraction strategies:
 *
 * 1. Hub convergence
 *    Find nodes with ≥3 incoming SUPPORTS/RELATED_TO/DERIVED_FROM edges.
 *    A hub node is being confirmed from multiple directions — principle candidate.
 *
 * 2. High-confidence cluster
 *    Find themes where ≥3 nodes have high/verified confidence.
 *    Accumulated confidence suggests readiness for synthesis.
 *
 * 3. Causal chain
 *    Traverse CAUSES/PRECEDES edges to find sequences of length ≥2.
 *    Causal sequences that hold end-to-end are stronger hypotheses than individual links.
 *
 * 4. Bridge fact
 *    Find nodes that are the only path between two clusters.
 *    Identified by: removing the node disconnects the graph.
 *    Simplified approximation: nodes with exactly 1 incoming + 1 outgoing edge
 *    across different clusters (by clusterId).
 *
 * Design: pure domain service. No I/O. No state. Deterministic.
 */
export class PatternExtractor {
  extract(graph: KnowledgeGraph): readonly ExtractedPattern[] {
    const results: ExtractedPattern[] = []

    results.push(...this.findHubConvergence(graph))
    results.push(...this.findHighConfidenceCluster(graph))
    results.push(...this.findCausalChains(graph))
    results.push(...this.findBridgeFacts(graph))

    return results.sort((a, b) => b.strength - a.strength)
  }

  // ── Strategy 1: Hub convergence ────────────────────────────────────────
  private findHubConvergence(graph: KnowledgeGraph): ExtractedPattern[] {
    const incomingCount = new Map<string, string[]>()
    const supportTypes = new Set(['SUPPORTS', 'RELATED_TO', 'DERIVED_FROM'])

    for (const edge of graph.edges) {
      if (!supportTypes.has(edge.relationType)) continue
      const existing = incomingCount.get(edge.targetNodeId) ?? []
      existing.push(edge.sourceNodeId)
      incomingCount.set(edge.targetNodeId, existing)
    }

    const patterns: ExtractedPattern[] = []
    for (const [nodeId, sourceIds] of incomingCount) {
      if (sourceIds.length < HUB_MIN_INCOMING) continue
      const hubNode = graph.findNode(nodeId as KnowledgeNodeId)
      if (!hubNode) continue

      const supportingFacts = sourceIds
        .map((id) => graph.findNode(id as KnowledgeNodeId)?.fact)
        .filter((f): f is NonNullable<typeof f> => f !== undefined)

      patterns.push(
        ExtractedPattern.create({
          patternType: 'hub_convergence',
          centralFact: hubNode.fact,
          facts: [hubNode.fact, ...supportingFacts],
          strength: Math.min(1.0, sourceIds.length / 5),
          description: `「${hubNode.fact.content.slice(0, 40)}...」を${sourceIds.length}件の事実が支持`,
        }),
      )
    }
    return patterns
  }

  // ── Strategy 2: High-confidence cluster ───────────────────────────────
  private findHighConfidenceCluster(graph: KnowledgeGraph): ExtractedPattern[] {
    const highNodes = graph.nodes.filter(
      (n) => n.fact.confidenceScore.band === 'high' || n.fact.confidenceScore.band === 'verified',
    )
    if (highNodes.length < CLUSTER_MIN_SIZE) return []

    const centralNode = highNodes[0]!
    return [
      ExtractedPattern.create({
        patternType: 'high_confidence_cluster',
        centralFact: centralNode.fact,
        facts: highNodes.map((n) => n.fact),
        strength: Math.min(1.0, highNodes.length / 10),
        description: `${highNodes.length}件の高確信度事実が集積 (high/verified)`,
      }),
    ]
  }

  // ── Strategy 3: Causal chains ─────────────────────────────────────────
  private findCausalChains(graph: KnowledgeGraph): ExtractedPattern[] {
    const causalTypes = new Set(['CAUSES', 'PRECEDES'])
    // Build adjacency for causal edges
    const causalNext = new Map<string, string>()
    for (const edge of graph.edges) {
      if (causalTypes.has(edge.relationType)) {
        causalNext.set(edge.sourceNodeId, edge.targetNodeId)
      }
    }

    // Find chain starts: nodes with no causal incoming edge
    const hasCausalIncoming = new Set(causalNext.values())
    const chainStarts = [...causalNext.keys()].filter((id) => !hasCausalIncoming.has(id))

    const patterns: ExtractedPattern[] = []
    for (const start of chainStarts) {
      const chain: string[] = [start]
      let current = start
      const visited = new Set<string>([start])

      while (causalNext.has(current)) {
        const next = causalNext.get(current)!
        if (visited.has(next)) break // cycle guard
        chain.push(next)
        visited.add(next)
        current = next
      }

      if (chain.length < CHAIN_MIN_LENGTH) continue

      const facts = chain
        .map((id) => graph.findNode(id as KnowledgeNodeId)?.fact)
        .filter((f): f is NonNullable<typeof f> => f !== undefined)

      if (facts.length < CHAIN_MIN_LENGTH) continue
      const firstFact = facts[0]!
      const lastFact = facts[facts.length - 1]!

      patterns.push(
        ExtractedPattern.create({
          patternType: 'causal_chain',
          centralFact: firstFact,
          facts,
          strength: Math.min(1.0, chain.length / 4),
          description: `因果連鎖 (${chain.length}段階): 「${firstFact.content.slice(0, 30)}」→...→「${lastFact.content.slice(0, 30)}」`,
        }),
      )
    }
    return patterns
  }

  // ── Strategy 4: Bridge facts ──────────────────────────────────────────
  private findBridgeFacts(graph: KnowledgeGraph): ExtractedPattern[] {
    // Simplified: a bridge fact is one that connects nodes in different clusterIds,
    // OR one with both incoming and outgoing edges where all neighbors are in different clusters.
    const patterns: ExtractedPattern[] = []

    for (const node of graph.nodes) {
      if (node.clusterIds.length === 0) continue

      const outgoingNeighbors = graph.neighbors(node.id as KnowledgeNodeId)
      if (outgoingNeighbors.length === 0) continue

      const incomingNeighborIds = graph.edges
        .filter((e) => e.targetNodeId === node.id)
        .map((e) => e.sourceNodeId)
      if (incomingNeighborIds.length === 0) continue

      // Check if this node connects different clusters
      const incomingClusters = new Set(
        incomingNeighborIds
          .map((id) => graph.findNode(id as KnowledgeNodeId)?.clusterIds ?? [])
          .flat(),
      )
      const outgoingClusters = new Set(outgoingNeighbors.flatMap((n) => n.clusterIds))

      const bridgesClusters = [...incomingClusters].some((c) => !outgoingClusters.has(c))
      if (!bridgesClusters) continue

      patterns.push(
        ExtractedPattern.create({
          patternType: 'bridge_fact',
          centralFact: node.fact,
          facts: [node.fact, ...outgoingNeighbors.map((n) => n.fact)],
          strength: 0.65,
          description: `「${node.fact.content.slice(0, 40)}」は異なるクラスタを橋渡しする事実`,
        }),
      )
    }
    return patterns
  }
}
