import { ok, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import {
  Fact,
  FactCollection,
  ResearchResult,
  type ResearchRequest,
} from '@innovation-os/domain/discovery'
import { isOk } from '@innovation-os/shared/result'
import type { ResearchResultPort } from './ports.js'

/**
 * MockResearchResultPort — returns deterministic, theme-aware fake results.
 *
 * Rules:
 * - No external network calls
 * - Always succeeds (error paths tested separately)
 * - Returns 4-6 facts per theme with varying confidence levels
 */
export class MockResearchResultPort implements ResearchResultPort {
  async generate(request: ResearchRequest): Promise<Result<ResearchResult, AppError>> {
    const started = Date.now()
    const theme = request.theme.value

    const rawFacts = this.buildFacts(theme)
    const facts: Fact[] = []
    for (const raw of rawFacts) {
      const f = Fact.create(raw.content, raw.source, raw.confidence)
      if (isOk(f)) facts.push(f.value)
    }

    const collectionResult = FactCollection.create(facts, theme)
    if (!isOk(collectionResult)) return collectionResult

    return ResearchResult.create({
      requestId: request.id,
      theme,
      factCollection: collectionResult.value,
      processingTimeMs: Date.now() - started,
      isMock: true,
    })
  }

  private buildFacts(theme: string) {
    const base = [
      {
        content: `「${theme}」は現在急速に発展しており、多くの企業・研究機関が注目しています。`,
        source: 'Mock Source A',
        confidence: 'medium' as const,
      },
      {
        content: `${theme}に関連する市場規模は過去3年間で年平均35%成長しています。`,
        source: 'Mock Source B',
        confidence: 'high' as const,
      },
      {
        content: `${theme}の主要プレイヤーは技術革新のペースを加速させており、新たな標準を形成しつつあります。`,
        source: 'Mock Source C',
        confidence: 'medium' as const,
      },
      {
        content: `ユーザー体験の観点から見ると、${theme}は既存の課題を根本から解決する可能性を持っています。`,
        source: 'Mock Source D',
        confidence: 'low' as const,
      },
      {
        content: `規制環境の変化が${theme}の普及を後押しする見通しで、2025年以降に本格化すると予測されます。`,
        source: 'Mock Source E',
        confidence: 'high' as const,
      },
      {
        content: `${theme}と隣接領域との融合により、これまで想定されていなかった新しいユースケースが生まれています。`,
        source: 'Mock Source F',
        confidence: 'verified' as const,
      },
    ]
    return base
  }
}
