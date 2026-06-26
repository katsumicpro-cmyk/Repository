import { Entity, type EntityProps } from '@innovation-os/domain/core'
import { generateId, type PrefixedId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { RelationType } from './relation-type.js'
import type { KnowledgeFactId } from '../fact/knowledge-fact.js'

export type RelationId = PrefixedId<'rel'>

type RelationProps = EntityProps & {
  readonly id: RelationId
  readonly sourceFactId: KnowledgeFactId
  readonly targetFactId: KnowledgeFactId
  readonly relationType: RelationType
  readonly weight: number
  readonly rationale: string
}

export type CreateRelationInput = {
  readonly sourceFactId: KnowledgeFactId
  readonly targetFactId: KnowledgeFactId
  readonly relationType: RelationType
  readonly weight?: number
  readonly rationale?: string
}

/**
 * Relation — a directed, typed edge between two KnowledgeFacts.
 *
 * Why Entity (not ValueObject):
 *   Relations need independent identity so they can be:
 *   - Queried by ID
 *   - Updated (weight adjustment by learning loops)
 *   - Traced for audit / explanation purposes
 *
 * Weight (0.0–1.0):
 *   Represents edge strength. Higher = stronger evidence for the relation.
 *   Updated over time as more supporting/contradicting Facts are added.
 */
export class Relation extends Entity<RelationProps> {
  private constructor(props: RelationProps) {
    super(props)
  }

  static create(input: CreateRelationInput): Result<Relation, AppError> {
    if (input.sourceFactId === input.targetFactId) {
      return err(validationError('A Relation cannot point from a Fact to itself'))
    }
    const weight = input.weight ?? 0.5
    if (weight < 0 || weight > 1) {
      return err(validationError('Relation weight must be between 0.0 and 1.0', { weight }))
    }

    const now = systemClock.now()
    return ok(
      new Relation({
        id: generateId('rel'),
        sourceFactId: input.sourceFactId,
        targetFactId: input.targetFactId,
        relationType: input.relationType,
        weight,
        rationale: input.rationale?.trim() ?? '',
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  static reconstitute(props: RelationProps): Relation {
    return new Relation(props)
  }

  get sourceFactId(): KnowledgeFactId { return this.props.sourceFactId }
  get targetFactId(): KnowledgeFactId { return this.props.targetFactId }
  get relationType(): RelationType { return this.props.relationType }
  get weight(): number { return this.props.weight }
  get rationale(): string { return this.props.rationale }

  /** Strengthen the relation (e.g. additional supporting Facts found) */
  strengthen(delta: number): Result<Relation, AppError> {
    const next = Math.min(1.0, this.props.weight + delta)
    return ok(new Relation({ ...this.props, weight: next, updatedAt: systemClock.now() }))
  }

  /** Weaken the relation (e.g. contradicting Facts found) */
  weaken(delta: number): Result<Relation, AppError> {
    const next = Math.max(0.0, this.props.weight - delta)
    return ok(new Relation({ ...this.props, weight: next, updatedAt: systemClock.now() }))
  }

  toProps(): RelationProps { return this.props }
}
