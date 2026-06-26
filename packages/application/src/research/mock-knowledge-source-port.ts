import { ok, isOk, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { KnowledgeFact } from '@innovation-os/knowledge/fact'
import type { ResearchQuestion } from '@innovation-os/knowledge/research'
import type { KnowledgeFactRepository } from '@innovation-os/knowledge/repository'
import type { KnowledgeSourcePort } from './knowledge-source-port.js'

/**
 * MockKnowledgeSourcePort — acquires KnowledgeFacts by term-matching against
 * the existing KnowledgeFactRepository.
 *
 * Renamed from MockResearchPort. The method is now `acquire()` not `search()`.
 * Semantics:
 *   acquire: extract KnowledgeFacts relevant to a ResearchQuestion
 *   (not: "find documents" — that is information retrieval)
 *
 * Production implementations would call:
 *   - Claude API to generate new facts from scratch
 *   - Web search APIs, returning scraped content converted to KnowledgeFacts
 *   - PDF parsers, academic paper APIs, etc.
 *
 * This mock simulates acquisition by matching against what is already known.
 * Sufficient for testing the full Research pipeline end-to-end.
 */
export class MockKnowledgeSourcePort implements KnowledgeSourcePort {
  readonly sourceType = 'knowledge_base' as const
  readonly sourceName = 'MockKnowledgeSourcePort (in-memory KnowledgeFactRepository)'

  private readonly topK: number

  constructor(
    private readonly factRepo: KnowledgeFactRepository,
    options?: { topK?: number },
  ) {
    this.topK = options?.topK ?? 10
  }

  async acquire(question: ResearchQuestion): Promise<Result<readonly KnowledgeFact[], AppError>> {
    const allResult = await this.factRepo.findAll({ page: 1, perPage: 200 })
    if (!isOk(allResult)) return allResult

    const terms = question.searchTerms.map((t) => t.toLowerCase())

    const scored = allResult.value.items
      .map((fact) => {
        const content = fact.content.toLowerCase()
        const matched = terms.filter((t) => content.includes(t)).length
        return { fact, score: matched / terms.length }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.topK)
      .map(({ fact }) => fact)

    return ok(scored)
  }
}
