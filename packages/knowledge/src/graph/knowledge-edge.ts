import { ValueObject } from '@innovation-os/domain/core'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { KnowledgeNodeId } from './knowledge-node.js'
import type { RelationType } from '../relation/relation-type.js'

type KnowledgeEdgeProps = {
  readonly sourceNodeId: KnowledgeNodeId
  readonly targetNodeId: KnowledgeNodeId
  readonly relationType: RelationType
  readonly weight: number
}

/**
 * KnowledgeEdge — an immutable, directed, weighted edge in the Knowledge Graph.
 *
 * Why ValueObject (not Entity):
 *   Edges are structurally defined by (source, target, relationType).
 *   There's no need to update a specific edge by ID — we remove and re-add.
 *   This keeps the graph append-friendly and audit-friendly.
 *
 * LangGraph compatibility:
 *   Maps to a LangGraph conditional edge.
 *   `relationType` acts as the routing condition key.
 */
export class KnowledgeEdge extends ValueObject<KnowledgeEdgeProps> {
  private constructor(props: KnowledgeEdgeProps) {
    super(props)
  }

  static create(
    sourceNodeId: KnowledgeNodeId,
    targetNodeId: KnowledgeNodeId,
    relationType: RelationType,
    weight = 0.5,
  ): Result<KnowledgeEdge, AppError> {
    if (sourceNodeId === targetNodeId) {
      return err(validationError('KnowledgeEdge cannot be a self-loop'))
    }
    if (weight < 0 || weight > 1) {
      return err(validationError('Edge weight must be between 0.0 and 1.0'))
    }
    return ok(new KnowledgeEdge({ sourceNodeId, targetNodeId, relationType, weight }))
  }

  get sourceNodeId(): KnowledgeNodeId { return this.props.sourceNodeId }
  get targetNodeId(): KnowledgeNodeId { return this.props.targetNodeId }
  get relationType(): RelationType { return this.props.relationType }
  get weight(): number { return this.props.weight }

  connects(a: KnowledgeNodeId, b: KnowledgeNodeId): boolean {
    return this.props.sourceNodeId === a && this.props.targetNodeId === b
  }
}
