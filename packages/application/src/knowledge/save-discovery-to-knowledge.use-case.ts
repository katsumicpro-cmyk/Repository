import { ok, err, isOk, type Result } from '@innovation-os/shared/result'
import { domainError } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type { ResearchResult } from '@innovation-os/domain/discovery'
import { KnowledgeFact } from '@innovation-os/knowledge/fact'
import { KnowledgeGraph } from '@innovation-os/knowledge/graph'
import type { KnowledgeGraphRepository } from '@innovation-os/knowledge/repository'

export type SaveDiscoveryToKnowledgeInput = {
  readonly result: ResearchResult
}

export type SaveDiscoveryToKnowledgeOutput = {
  readonly graph: KnowledgeGraph
  readonly factsAdded: number
  readonly edgesAdded: number
}

/**
 * SaveDiscoveryToKnowledgeUseCase — bridges Discovery and Knowledge domains.
 *
 * This is the ONLY place where Discovery and Knowledge are coupled.
 * Neither domain imports the other — the translation happens here.
 *
 * Flow:
 *   ResearchResult (Discovery domain)
 *     ↓ transform each Fact → KnowledgeFact (Knowledge domain)
 *     ↓ add to KnowledgeGraph
 *     ↓ wire consecutive facts with RELATED_TO edges
 *     ↓ persist KnowledgeGraph
 *
 * Future enhancement:
 *   Replace linear RELATED_TO edges with AI-inferred semantic edges
 *   from the Pattern Agent (packages/ai-core).
 */
export class SaveDiscoveryToKnowledgeUseCase {
  constructor(private readonly graphRepo: KnowledgeGraphRepository) {}

  async execute(
    input: SaveDiscoveryToKnowledgeInput,
  ): Promise<Result<SaveDiscoveryToKnowledgeOutput, AppError>> {
    const { result } = input
    const theme = result.theme

    // 1. Find or create a KnowledgeGraph for this theme
    const existingResult = await this.graphRepo.findByTheme(theme)
    if (!isOk(existingResult)) return existingResult

    let graphResult = existingResult.value
      ? ok(existingResult.value)
      : KnowledgeGraph.create({ theme })

    if (!isOk(graphResult)) return graphResult
    let graph = graphResult.value

    // 2. Convert each discovery Fact → KnowledgeFact → KnowledgeNode
    let factsAdded = 0
    const nodesBefore = graph.nodeCount

    for (const fact of result.factCollection.facts) {
      const kfResult = KnowledgeFact.create({
        content: fact.content,
        sourceKind: 'discovery',
        sourceLabel: fact.source,
        confidenceBand: fact.confidence,
        theme,
        discoveryId: result.requestId,
      })
      if (!isOk(kfResult)) continue

      const addResult = graph.addFact(kfResult.value)
      if (!isOk(addResult)) continue

      graph = addResult.value
      factsAdded++
    }

    if (factsAdded === 0) {
      return err(domainError('WORKFLOW_ERROR', 'No facts could be converted to KnowledgeFacts', { theme }))
    }

    // 3. Wire consecutive nodes with RELATED_TO edges (linear chain)
    let edgesAdded = 0
    const newNodes = graph.nodes.slice(nodesBefore)

    for (let i = 0; i < newNodes.length - 1; i++) {
      const src = newNodes[i]
      const tgt = newNodes[i + 1]
      if (!src || !tgt) continue

      const edgeResult = graph.addEdge(src.id, tgt.id, 'RELATED_TO', 0.5)
      if (isOk(edgeResult)) {
        graph = edgeResult.value
        edgesAdded++
      }
    }

    // 4. Persist
    const saved = await this.graphRepo.save(graph)
    if (!isOk(saved)) return saved

    // 5. Publish domain events
    for (const event of graph.domainEvents) {
      // NoopPublisher in MVP — events are collected but not dispatched
      void event
    }
    graph.clearEvents()

    return ok({ graph: saved.value, factsAdded, edgesAdded })
  }
}
