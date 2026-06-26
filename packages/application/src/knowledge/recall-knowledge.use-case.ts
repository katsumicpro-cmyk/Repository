import { ok, isOk, err, type Result } from '@innovation-os/shared/result'
import { validationError } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type { KnowledgeFactRepository, KnowledgeGraphRepository } from '@innovation-os/knowledge/repository'
import type { EmbeddingPort } from '@innovation-os/knowledge/embedding'
import type { KnowledgeNodeId } from '@innovation-os/knowledge/graph'
import type { KnowledgeFactId } from '@innovation-os/knowledge/fact'
import { RecallQuery, RecalledFact, KnowledgeActivation } from '@innovation-os/knowledge/recall'

export type RecallKnowledgeInput = {
  /** The text to recall knowledge about */
  readonly queryText: string
  /** Theme scope for graph traversal. Without this, only semantic search runs. */
  readonly theme?: string
  /** Max semantic seed facts (default: 10) */
  readonly topK?: number
  /** Min activation score to include in result (default: 0) */
  readonly minActivationScore?: number
  /** Graph traversal depth — how many hops to follow from seeds (default: 1) */
  readonly graphDepth?: number
}

export type RecallKnowledgeOutput = {
  readonly activation: KnowledgeActivation
}

/**
 * RecallKnowledgeUseCase — surfaces relevant knowledge via semantic + structural recall.
 *
 * This is the core "recall not search" operation.
 *
 * Two-phase process:
 *
 * Phase 1 — Semantic seeding (vector search):
 *   Embed the queryText and find the topK most similar KnowledgeFacts.
 *   These are the "seeds" — directly relevant to the query.
 *   → This alone would be information retrieval.
 *
 * Phase 2 — Graph activation (structural recall):
 *   For each seed fact, find its KnowledgeNode in the graph.
 *   Traverse graph.neighbors(nodeId) to collect adjacent facts.
 *   These are the "traversed" facts — not directly similar to the query,
 *   but connected to facts that are.
 *   → This is what makes it knowledge recall.
 *
 * The KnowledgeActivation result contains both seeds and traversed facts,
 * sorted by activationScore. The graphBonus (+0.2) in RecalledFact.score()
 * ensures that well-connected graph facts rank meaningfully even without
 * direct semantic similarity.
 *
 * The signal that recall succeeded as intended:
 *   activation.hasUnexpectedConnections() === true
 *   → the system surfaced knowledge the user did not know to ask for.
 */
export class RecallKnowledgeUseCase {
  constructor(
    private readonly embeddingPort: EmbeddingPort,
    private readonly factRepo: KnowledgeFactRepository,
    private readonly graphRepo: KnowledgeGraphRepository,
  ) {}

  async execute(input: RecallKnowledgeInput): Promise<Result<RecallKnowledgeOutput, AppError>> {
    if (!input.queryText.trim()) {
      return err(validationError('RecallKnowledge: queryText must not be empty'))
    }

    // ── Phase 1: Semantic seeding ──────────────────────────────────────────
    const embResult = await this.embeddingPort.embed(input.queryText)
    if (!isOk(embResult)) return embResult

    const queryEmbedding = embResult.value

    const queryResult = RecallQuery.create(input.queryText, queryEmbedding, {
      topK: input.topK,
      minActivationScore: input.minActivationScore,
    })
    if (!isOk(queryResult)) return queryResult
    const query = queryResult.value

    const seedsResult = await this.factRepo.findSimilar(
      queryEmbedding.vector,
      query.topK,
      0.0,
    )
    if (!isOk(seedsResult)) return seedsResult
    const seedFacts = [...seedsResult.value]

    const recalledSeeds = seedFacts.map((f) =>
      RecalledFact.score(f, queryEmbedding, false),
    )

    // ── Phase 2: Graph activation (structural recall) ──────────────────────
    const recalledTraversed: RecalledFact[] = []

    if (input.theme) {
      const graphResult = await this.graphRepo.findByTheme(input.theme)
      if (isOk(graphResult) && graphResult.value !== null) {
        const graph = graphResult.value
        const depth = Math.max(1, Math.min(input.graphDepth ?? 1, 3))

        // Find KnowledgeNodes corresponding to seed facts
        const seedFactIds = new Set(seedFacts.map((f) => f.id))
        const seedNodeIds = graph.nodes
          .filter((n) => seedFactIds.has(n.factId))
          .map((n) => n.id as KnowledgeNodeId)

        // BFS traversal up to `depth` hops
        const visitedNodeIds = new Set<string>(seedNodeIds)
        const frontier: KnowledgeNodeId[] = [...seedNodeIds]

        for (let hop = 0; hop < depth; hop++) {
          const nextFrontier: KnowledgeNodeId[] = []
          for (const nodeId of frontier) {
            for (const neighbor of graph.neighbors(nodeId)) {
              if (!visitedNodeIds.has(neighbor.id)) {
                visitedNodeIds.add(neighbor.id)
                nextFrontier.push(neighbor.id as KnowledgeNodeId)

                // Only load traversed facts (not seeds)
                if (!seedFactIds.has(neighbor.factId)) {
                  const factResult = await this.factRepo.findById(
                    neighbor.factId as KnowledgeFactId,
                  )
                  if (isOk(factResult)) {
                    recalledTraversed.push(
                      RecalledFact.score(factResult.value, queryEmbedding, true),
                    )
                  }
                }
              }
            }
          }
          frontier.length = 0
          frontier.push(...nextFrontier)
        }
      }
    }

    // ── Build KnowledgeActivation ─────────────────────────────────────────
    const activationResult = KnowledgeActivation.create({
      query,
      seedFacts: recalledSeeds,
      traversedFacts: recalledTraversed,
      theme: input.theme ?? '',
    })
    if (!isOk(activationResult)) return activationResult

    return ok({ activation: activationResult.value })
  }
}
