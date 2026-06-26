export const KNOWLEDGE_FLOW_STAGES = [
  'discovery',
  'pattern',
  'principle',
  'future',
  'concept',
] as const

export type KnowledgeFlowStage = (typeof KNOWLEDGE_FLOW_STAGES)[number]

export const PROCESSING_STATUS = ['pending', 'processing', 'completed', 'failed'] as const
export type ProcessingStatus = (typeof PROCESSING_STATUS)[number]

export const CONFIDENCE_LEVELS = ['low', 'medium', 'high', 'verified'] as const
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number]
