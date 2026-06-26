// Aggregate / Entity
export { Discovery, type CreateDiscoveryInput } from './entity.js'
export { ResearchRequest, type ResearchRequestId, type CreateResearchRequestInput } from './research-request.js'
export { ResearchResult, type ResearchResultId, type CreateResearchResultInput } from './research-result.js'

// Value Objects
export { ResearchTheme } from './research-theme.js'
export { Fact } from './fact.js'
export { FactCollection } from './fact-collection.js'

// Types
export type { DiscoveryId, DiscoveryProps, DiscoverySource } from './types.js'

// Repository interfaces
export type { DiscoveryRepository } from './repository.js'

// Domain Events
export type {
  DiscoveryStartedEvent,
  DiscoveryCompletedEvent,
  DiscoveryDomainEvent,
} from './events.js'
