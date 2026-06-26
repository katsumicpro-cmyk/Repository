import type { Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { KnowledgeFact } from '@innovation-os/knowledge/fact'
import type { ResearchQuestion } from '@innovation-os/knowledge/research'

/**
 * KnowledgeSourceType — the full universe of knowledge sources.
 *
 * Today: knowledge_base (existing KnowledgeFacts in memory).
 * Tomorrow: every source where knowledge lives.
 */
export type KnowledgeSourceType =
  | 'knowledge_base'  // existing KnowledgeFacts — current implementation
  | 'web'             // web search results
  | 'pdf'             // PDF documents
  | 'academic'        // academic papers (arXiv, PubMed, etc.)
  | 'github'          // code repositories
  | 'slack'           // team communication
  | 'notion'          // workspace knowledge
  | 'internal_db'     // internal databases
  | 'video'           // video transcripts
  | 'image'           // image analysis
  | 'cad'             // CAD/design files
  | 'iot'             // IoT sensor data

/**
 * KnowledgeSourcePort — abstraction for acquiring knowledge from any source.
 *
 * Renamed from ResearchPort. The scope is broader:
 *   Research implies "looking things up."
 *   Knowledge Acquisition implies "extracting knowledge from any medium."
 *
 * The method is `acquire()` not `search()`:
 *   search: find documents that match a query (information retrieval)
 *   acquire: extract KnowledgeFacts from any source (knowledge creation)
 *
 * Implementations:
 *   MockKnowledgeSourcePort (packages/application)
 *     — term-matching against existing KnowledgeFactRepository
 *   WebKnowledgeSourcePort (packages/infrastructure — future)
 *     — calls search API, converts results to KnowledgeFacts
 *   ClaudeKnowledgeSourcePort (packages/infrastructure — future)
 *     — asks Claude to find/generate relevant facts
 *   PDFKnowledgeSourcePort (packages/infrastructure — future)
 *     — extracts facts from uploaded PDFs
 *
 * The same ResearchPlan can be executed against multiple KnowledgeSourcePorts
 * in parallel. Each source contributes its knowledge. The EvidenceEvaluator
 * then weighs the combined evidence.
 */
export interface KnowledgeSourcePort {
  readonly sourceType: KnowledgeSourceType
  readonly sourceName: string

  acquire(question: ResearchQuestion): Promise<Result<readonly KnowledgeFact[], AppError>>
}
