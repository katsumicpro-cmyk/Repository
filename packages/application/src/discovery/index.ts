// Use Cases
export {
  GenerateDiscoveryUseCase,
  type GenerateDiscoveryInput,
  type GenerateDiscoveryOutput,
} from './generate-discovery.use-case.js'
export {
  SaveDiscoveryUseCase,
  type SaveDiscoveryInput,
  type SaveDiscoveryOutput,
} from './save-discovery.use-case.js'
export {
  GetDiscoveryUseCase,
  type GetDiscoveryInput,
  type GetDiscoveryOutput,
} from './get-discovery.use-case.js'

// Ports
export { type ResearchResultPort, type EventPublisher, NoopEventPublisher } from './ports.js'

// Mock implementations (for dev / testing)
export { MockResearchResultPort } from './mock-research-result-port.js'
export { MockDiscoveryRepository } from './mock-discovery-repository.js'
