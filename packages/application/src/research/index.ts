export {
  ConductResearchUseCase,
  type ConductResearchInput,
  type ConductResearchOutput,
} from './conduct-research.use-case.js'

export {
  DecomposeQuestionUseCase,
  type DecomposeQuestionInput,
  type DecomposeQuestionOutput,
} from './decompose-question.use-case.js'

export type { KnowledgeSourcePort, KnowledgeSourceType } from './knowledge-source-port.js'
export { MockKnowledgeSourcePort } from './mock-knowledge-source-port.js'
export { MockResearchPlanRepository } from './mock-research-plan-repository.js'

// Deprecated: use KnowledgeSourcePort / MockKnowledgeSourcePort
// These exports are kept temporarily to avoid breaking any existing test imports
export type { ResearchPort } from './research-port.js'
export { MockResearchPort } from './mock-research-port.js'
