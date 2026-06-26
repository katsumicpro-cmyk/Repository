/**
 * DomainEvent — immutable record of something that happened in the domain.
 *
 * Rules:
 * - Expressed in past tense (DiscoveryCreated, PatternExtracted)
 * - Contains only data relevant at the time of occurrence
 * - Never reference mutable state
 */

export type DomainEventMetadata = {
  readonly eventId: string
  readonly occurredAt: string
  readonly aggregateId: string
  readonly aggregateType: string
  readonly version: number
}

export type DomainEvent<TPayload = Record<string, unknown>> = DomainEventMetadata & {
  readonly _type: string
  readonly payload: TPayload
}

export type AnyDomainEvent = DomainEvent<Record<string, unknown>>
