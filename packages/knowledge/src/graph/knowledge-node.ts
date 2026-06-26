import { Entity, type EntityProps } from '@innovation-os/domain/core'
import { generateId, type PrefixedId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import { ok, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import { KnowledgeFact, type KnowledgeFactId } from '../fact/knowledge-fact.js'

export type KnowledgeNodeId = PrefixedId<'knd'>

type KnowledgeNodeProps = EntityProps & {
  readonly id: KnowledgeNodeId
  readonly fact: KnowledgeFact
  readonly weight: number
  readonly depth: number
  readonly clusterIds: readonly string[]
}

/**
 * KnowledgeNode — positions a KnowledgeFact within a specific graph context.
 *
 * Separation of concerns:
 *   - KnowledgeFact: what the knowledge IS (content, source, confidence, embedding)
 *   - KnowledgeNode: where the knowledge SITS in the graph (weight, depth, cluster)
 *
 * This allows the same KnowledgeFact to appear in multiple graphs
 * with different structural importance.
 *
 * LangGraph compatibility:
 *   KnowledgeNode maps directly to a LangGraph StateGraph node.
 *   `weight` drives conditional edge routing.
 */
export class KnowledgeNode extends Entity<KnowledgeNodeProps> {
  private constructor(props: KnowledgeNodeProps) {
    super(props)
  }

  static create(
    fact: KnowledgeFact,
    options?: { weight?: number; depth?: number },
  ): Result<KnowledgeNode, AppError> {
    const now = systemClock.now()
    return ok(
      new KnowledgeNode({
        id: generateId('knd'),
        fact,
        weight: options?.weight ?? 0.5,
        depth: options?.depth ?? 0,
        clusterIds: [],
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  static reconstitute(props: KnowledgeNodeProps): KnowledgeNode {
    return new KnowledgeNode(props)
  }

  get fact(): KnowledgeFact { return this.props.fact }
  get factId(): KnowledgeFactId { return this.props.fact.id }
  get weight(): number { return this.props.weight }
  get depth(): number { return this.props.depth }
  get clusterIds(): readonly string[] { return this.props.clusterIds }

  withWeight(weight: number): KnowledgeNode {
    return new KnowledgeNode({ ...this.props, weight, updatedAt: systemClock.now() })
  }

  inCluster(clusterId: string): KnowledgeNode {
    if (this.props.clusterIds.includes(clusterId)) return this
    return new KnowledgeNode({
      ...this.props,
      clusterIds: [...this.props.clusterIds, clusterId],
      updatedAt: systemClock.now(),
    })
  }

  toProps(): KnowledgeNodeProps { return this.props }
}
