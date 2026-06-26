'use server'

import {
  GenerateDiscoveryUseCase,
  MockResearchResultPort,
  NoopEventPublisher,
} from '@innovation-os/application/discovery'
import { isOk } from '@innovation-os/shared/result'

export type FactDto = {
  content: string
  source: string
  confidence: string
}

export type ResearchResultDto = {
  id: string
  theme: string
  facts: FactDto[]
  processingTimeMs: number
  isMock: boolean
  createdAt: string
}

export type GenerateDiscoveryActionResult =
  | { ok: true; data: ResearchResultDto }
  | { ok: false; error: string }

/**
 * generateDiscoveryAction — Server Action called from ResearchForm.
 * Instantiates use case with mock implementations (no DB, no AI).
 */
export async function generateDiscoveryAction(
  themeText: string,
  additionalContext?: string,
): Promise<GenerateDiscoveryActionResult> {
  const useCase = new GenerateDiscoveryUseCase(
    new MockResearchResultPort(),
    new NoopEventPublisher(),
  )

  const result = await useCase.execute({ themeText, additionalContext })

  if (!isOk(result)) {
    return { ok: false, error: result.error.message }
  }

  const { result: resResult } = result.value

  return {
    ok: true,
    data: {
      id: resResult.id,
      theme: resResult.theme,
      facts: resResult.factCollection.facts.map((f) => ({
        content: f.content,
        source: f.source,
        confidence: f.confidence,
      })),
      processingTimeMs: resResult.processingTimeMs,
      isMock: resResult.isMock,
      createdAt: resResult.createdAt,
    },
  }
}
