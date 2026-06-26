/**
 * Shared domain event payload types.
 * The base DomainEvent<TPayload> type lives in packages/domain/src/core/domain-event.ts.
 * These types define only the payload shapes for cross-domain communication.
 */

export type DiscoveryCreatedPayload = {
  readonly title: string
  readonly source: string
}

export type DiscoveryProcessedPayload = {
  readonly patternIds: readonly string[]
}

export type PatternExtractedPayload = {
  readonly discoveryId: string
  readonly confidence: string
}

export type PatternElevatedPayload = {
  readonly principleId: string
}

export type PrincipleCreatedPayload = {
  readonly patternIds: readonly string[]
}

export type FutureGeneratedPayload = {
  readonly principleIds: readonly string[]
  readonly timeHorizon: string
}

export type ConceptCreatedPayload = {
  readonly futureIds: readonly string[]
}

export type KnowledgeFlowEventType =
  | 'discovery.created'
  | 'discovery.processed'
  | 'pattern.extracted'
  | 'pattern.elevated'
  | 'principle.created'
  | 'future.generated'
  | 'concept.created'
