import type { DomainEvent } from '../core/domain-event.js'

/**
 * DiscoveryStarted — emitted when a ResearchRequest is received and processing begins.
 */
export type DiscoveryStartedEvent = DomainEvent<{
  readonly requestId: string
  readonly theme: string
  readonly requestedBy: string
}>  & { readonly _type: 'discovery.started' }

/**
 * DiscoveryCompleted — emitted when a ResearchResult is successfully created.
 */
export type DiscoveryCompletedEvent = DomainEvent<{
  readonly requestId: string
  readonly theme: string
  readonly factCount: number
  readonly isMock: boolean
}> & { readonly _type: 'discovery.completed' }

export type DiscoveryDomainEvent = DiscoveryStartedEvent | DiscoveryCompletedEvent
