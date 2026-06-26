import { AggregateRoot, type EntityProps } from '../core/entity.js'
import { generateId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import { ok, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { PrefixedId } from '@innovation-os/foundation/ids'
import { FactCollection } from './fact-collection.js'
import type { ResearchRequestId } from './research-request.js'
import type { DiscoveryCompletedEvent } from './events.js'

export type ResearchResultId = PrefixedId<'rres'>

type ResearchResultProps = EntityProps & {
  readonly id: ResearchResultId
  readonly requestId: ResearchRequestId
  readonly theme: string
  readonly factCollection: FactCollection
  readonly processingTimeMs: number
  readonly isMock: boolean
}

export type CreateResearchResultInput = {
  readonly requestId: ResearchRequestId
  readonly theme: string
  readonly factCollection: FactCollection
  readonly processingTimeMs: number
  readonly isMock?: boolean
}

/**
 * ResearchResult — aggregate root for a completed discovery run.
 * Emits DiscoveryCompleted after construction.
 */
export class ResearchResult extends AggregateRoot<ResearchResultProps> {
  private constructor(props: ResearchResultProps) {
    super(props)
  }

  static create(input: CreateResearchResultInput): Result<ResearchResult, AppError> {
    const now = systemClock.now()
    const result = new ResearchResult({
      id: generateId('rres'),
      requestId: input.requestId,
      theme: input.theme,
      factCollection: input.factCollection,
      processingTimeMs: input.processingTimeMs,
      isMock: input.isMock ?? false,
      createdAt: now,
      updatedAt: now,
    })

    const event: DiscoveryCompletedEvent = {
      _type: 'discovery.completed',
      eventId: generateId('evt'),
      occurredAt: now,
      aggregateId: result.id,
      aggregateType: 'ResearchResult',
      version: 1,
      payload: {
        requestId: input.requestId,
        theme: input.theme,
        factCount: input.factCollection.size,
        isMock: result.props.isMock,
      },
    }
    result.emit(event)

    return ok(result)
  }

  get requestId(): ResearchRequestId { return this.props.requestId }
  get theme(): string { return this.props.theme }
  get factCollection(): FactCollection { return this.props.factCollection }
  get processingTimeMs(): number { return this.props.processingTimeMs }
  get isMock(): boolean { return this.props.isMock }

  toSummary() {
    return {
      id: this.id,
      requestId: this.requestId,
      theme: this.theme,
      factCount: this.factCollection.size,
      facts: this.factCollection.facts.map((f) => ({
        content: f.content,
        source: f.source,
        confidence: f.confidence,
      })),
      processingTimeMs: this.processingTimeMs,
      isMock: this.isMock,
      createdAt: this.createdAt,
    }
  }
}
