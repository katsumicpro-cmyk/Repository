import type { Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { KnowledgeFact } from '@innovation-os/knowledge/fact'
import type { ResearchQuestion } from '@innovation-os/knowledge/research'

/**
 * ResearchPort — abstraction for searching KnowledgeFacts by ResearchQuestion.
 *
 * Implementations:
 *   MockResearchPort (packages/application) — searches existing KnowledgeFactRepository
 *                                              using term matching. No network.
 *
 *   ClaudeResearchPort (packages/infrastructure — Sprint 6+) — calls Claude to
 *                                              find and structure new facts.
 *
 * Design: the Domain never calls research directly.
 * The Port decouples "what to search for" (ResearchQuestion) from
 * "how to search" (term match, vector search, AI generation).
 */
export interface ResearchPort {
  search(question: ResearchQuestion): Promise<Result<readonly KnowledgeFact[], AppError>>
}
