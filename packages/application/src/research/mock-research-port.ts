import { ok, isOk, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { KnowledgeFact } from '@innovation-os/knowledge/fact'
import type { ResearchQuestion } from '@innovation-os/knowledge/research'
import type { KnowledgeFactRepository } from '@innovation-os/knowledge/repository'
import type { ResearchPort } from './research-port.js'

/**
 * MockResearchPort — searches existing KnowledgeFacts by term matching.
 *
 * Production ResearchPort would call an AI (Claude) to generate new facts.
 * This mock searches what is already known, which is sufficient to:
 *   - Test the Research pipeline end-to-end
 *   - Demonstrate the "collect evidence" capability
 *   - Prove that evidence evaluation can produce a verdict
 *
 * Search algorithm:
 *   For each KnowledgeFact in the repository:
 *     score = number of searchTerms found in fact.content / total searchTerms
 *   Return facts with score > 0, sorted by score desc, limited to topK.
 */
export class MockResearchPort implements ResearchPort {
  private readonly topK: number

  constructor(
    private readonly factRepo: KnowledgeFactRepository,
    options?: { topK?: number },
  ) {
    this.topK = options?.topK ?? 10
  }

  async search(question: ResearchQuestion): Promise<Result<readonly KnowledgeFact[], AppError>> {
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
