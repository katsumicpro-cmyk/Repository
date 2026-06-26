import { AggregateRoot, type EntityProps } from '@innovation-os/domain/core'
import type { DomainEvent } from '@innovation-os/domain/core'
import { generateId, type PrefixedId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import { validationError, notFound } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import { KnowledgeFact } from '../fact/knowledge-fact.js'
import { KnowledgeNode, type KnowledgeNodeId } from './knowledge-node.js'
import { KnowledgeEdge } from './knowledge-edge.js'
import type { RelationType } from '../relation/relation-type.js'

export type KnowledgeGraphId = PrefixedId<'kgph'>

type KnowledgeGraphProps = EntityProps & {
  readonly id: KnowledgeGraphId
  readonly theme: string
  readonly nodes: readonly KnowledgeNode[]
  readonly edges: readonly KnowledgeEdge[]
  readonly version: number
}

type NodeAddedPayload = { readonly nodeId: string; readonly factContent: string; readonly theme: string }
type EdgeAddedPayload = { readonly sourceNodeId: string; readonly targetNodeId: string; readonly relationType: RelationType }

type NodeAddedEvent = DomainEvent<NodeAddedPayload> & { readonly _type: 'knowledge.node_added' }
type EdgeAddedEvent = DomainEvent<EdgeAddedPayload> & { readonly _type: 'knowledge.edge_added' }

export type CreateKnowledgeGraphInput = {
  readonly theme: string
}

/**
 * KnowledgeGraph — AggregateRoot that owns the consistency boundary
 * for a themed set of KnowledgeNodes and KnowledgeEdges.
 *
 * Design decisions:
 *
 * 1. Immutable state transitions — every mutation returns a new KnowledgeGraph.
 *    This makes history reconstruction trivial and avoids stale-object bugs.
 *
 * 2. Nodes indexed by KnowledgeNodeId for O(1) lookup without Map serialization issues.
 *
 * 3. Version counter enables optimistic concurrency when persisted.
 *
 * 4. LangGraph compatibility: the graph structure (nodes + directed edges with typed
 *    labels) maps 1:1 to LangGraph's StateGraph. Migrating means replacing the
 *    traversal engine, not the data model.
 */
export class KnowledgeGraph extends AggregateRoot<KnowledgeGraphProps> {
  private constructor(props: KnowledgeGraphProps) {
    super(props)
  }

  static create(input: CreateKnowledgeGraphInput): Result<KnowledgeGraph, AppError> {
    if (input.theme.trim().length === 0) {
      return err(validationError('KnowledgeGraph theme must not be empty'))
    }
    const now = systemClock.now()
    return ok(
      new KnowledgeGraph({
        id: generateId('kgph'),
        theme: input.theme.trim(),
        nodes: [],
        edges: [],
        version: 1,
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  static reconstitute(props: KnowledgeGraphProps): KnowledgeGraph {
    return new KnowledgeGraph(props)
  }

  /* ── Accessors ──────────────────────────────────────────── */

  get theme(): string { return this.props.theme }
  get nodes(): readonly KnowledgeNode[] { return this.props.nodes }
  get edges(): readonly KnowledgeEdge[] { return this.props.edges }
  get version(): number { return this.props.version }
  get nodeCount(): number { return this.props.nodes.length }
  get edgeCount(): number { return this.props.edges.length }

  findNode(id: KnowledgeNodeId): KnowledgeNode | undefined {
    return this.props.nodes.find((n) => n.id === id)
  }

  /* ── Mutations (return new KnowledgeGraph) ──────────────── */

  /**
   * addFact — creates a KnowledgeNode from a KnowledgeFact and adds it.
   * Idempotent: adding the same fact twice (by content hash) is a no-op.
   */
  addFact(fact: KnowledgeFact): Result<KnowledgeGraph, AppError> {
    const duplicate = this.props.nodes.find((n) => n.fact.content === fact.content)
    if (duplicate) return ok(this)

    const nodeResult = KnowledgeNode.create(fact, { depth: 0 })
    if (nodeResult._tag === 'Err') return nodeResult

    const node = nodeResult.value
    const event: NodeAddedEvent = {
      _type: 'knowledge.node_added',
      eventId: generateId('evt'),
      occurredAt: systemClock.now(),
      aggregateId: this.id,
      aggregateType: 'KnowledgeGraph',
      version: this.props.version + 1,
      payload: { nodeId: node.id, factContent: fact.content, theme: this.props.theme },
    }

    const next = new KnowledgeGraph({
      ...this.props,
      nodes: [...this.props.nodes, node],
      version: this.props.version + 1,
      updatedAt: systemClock.now(),
    })
    next.emit(event)
    return ok(next)
  }

  /**
   * addEdge — connects two existing nodes with a directed, typed edge.
   */
  addEdge(
    sourceNodeId: KnowledgeNodeId,
    targetNodeId: KnowledgeNodeId,
    relationType: RelationType,
    weight = 0.5,
  ): Result<KnowledgeGraph, AppError> {
    if (!this.findNode(sourceNodeId)) {
      return err(notFound('KnowledgeNode', sourceNodeId))
    }
    if (!this.findNode(targetNodeId)) {
      return err(notFound('KnowledgeNode', targetNodeId))
    }

    // idempotent — skip duplicate edges
    const exists = this.props.edges.some(
      (e) => e.connects(sourceNodeId, targetNodeId) && e.relationType === relationType,
    )
    if (exists) return ok(this)

    const edgeResult = KnowledgeEdge.create(sourceNodeId, targetNodeId, relationType, weight)
    if (edgeResult._tag === 'Err') return edgeResult

    const event: EdgeAddedEvent = {
      _type: 'knowledge.edge_added',
      eventId: generateId('evt'),
      occurredAt: systemClock.now(),
      aggregateId: this.id,
      aggregateType: 'KnowledgeGraph',
      version: this.props.version + 1,
      payload: { sourceNodeId, targetNodeId, relationType },
    }

    const next = new KnowledgeGraph({
      ...this.props,
      edges: [...this.props.edges, edgeResult.value],
      version: this.props.version + 1,
      updatedAt: systemClock.now(),
    })
    next.emit(event)
    return ok(next)
  }

  /* ── Graph Traversal ────────────────────────────────────── */

  /** Direct neighbours reachable from nodeId via outgoing edges */
  neighbors(nodeId: KnowledgeNodeId): readonly KnowledgeNode[] {
    const targetIds = this.props.edges
      .filter((e) => e.sourceNodeId === nodeId)
      .map((e) => e.targetNodeId)
    return this.props.nodes.filter((n) => targetIds.includes(n.id))
  }

  /** Edges filtered by relation type */
  edgesOfType(relationType: RelationType): readonly KnowledgeEdge[] {
    return this.props.edges.filter((e) => e.relationType === relationType)
  }

  /** Nodes above a confidence threshold */
  highConfidenceNodes(): readonly KnowledgeNode[] {
    return this.props.nodes.filter((n) => n.fact.confidenceScore.isHighConfidence())
  }

  toProps(): KnowledgeGraphProps { return this.props }
}
