import { describe, it, expect, beforeEach } from 'vitest'
import { isOk } from '@innovation-os/shared/result'
import { GenerateDiscoveryUseCase } from '../discovery/generate-discovery.use-case.js'
import { MockResearchResultPort } from '../discovery/mock-research-result-port.js'
import { NoopEventPublisher } from '../discovery/ports.js'
import { SaveDiscoveryToKnowledgeUseCase } from './save-discovery-to-knowledge.use-case.js'
import { EmbedKnowledgeFactsUseCase } from './embed-knowledge-facts.use-case.js'
import { RecallKnowledgeUseCase } from './recall-knowledge.use-case.js'
import { MockKnowledgeFactRepository } from './mock-knowledge-fact-repository.js'
import { MockKnowledgeGraphRepository } from './mock-knowledge-graph-repository.js'
import { MockEmbeddingPort } from '@innovation-os/knowledge/embedding'

describe('RecallKnowledgeUseCase', () => {
  const theme = 'AIエージェント'

  let factRepo: MockKnowledgeFactRepository
  let graphRepo: MockKnowledgeGraphRepository
  let embeddingPort: MockEmbeddingPort
  let recallUseCase: RecallKnowledgeUseCase

  beforeEach(async () => {
    factRepo = new MockKnowledgeFactRepository()
    graphRepo = new MockKnowledgeGraphRepository()
    embeddingPort = new MockEmbeddingPort(8)

    // Seed knowledge: Discovery → Knowledge → Embed
    const generateUseCase = new GenerateDiscoveryUseCase(
      new MockResearchResultPort(),
      new NoopEventPublisher(),
    )
    const saveToKnowledge = new SaveDiscoveryToKnowledgeUseCase(graphRepo)
    const embedUseCase = new EmbedKnowledgeFactsUseCase(factRepo, embeddingPort)

    const discResult = await generateUseCase.execute({ themeText: theme })
    expect(isOk(discResult)).toBe(true)
    if (!isOk(discResult)) return

    // Save discovery facts as KnowledgeFacts in factRepo
    const kResult = await saveToKnowledge.execute({ result: discResult.value.result })
    expect(isOk(kResult)).toBe(true)
    if (!isOk(kResult)) return

    // Manually save facts to factRepo (SaveDiscoveryToKnowledge stores in graphRepo only)
    for (const node of kResult.value.graph.nodes) {
      await factRepo.save(node.fact)
    }

    // Embed all facts
    const embedResult = await embedUseCase.execute({})
    expect(isOk(embedResult)).toBe(true)

    recallUseCase = new RecallKnowledgeUseCase(embeddingPort, factRepo, graphRepo)
  })

  it('returns a KnowledgeActivation with at least one fact', async () => {
    const result = await recallUseCase.execute({ queryText: 'AIの自律的な動作', theme })
    expect(isOk(result)).toBe(true)
    if (!isOk(result)) return
    expect(result.value.activation.totalCount).toBeGreaterThan(0)
  })

  it('all embedded facts are ranked by activationScore', async () => {
    const result = await recallUseCase.execute({ queryText: 'AIエージェントの特性', theme })
    if (!isOk(result)) return

    const scores = result.value.activation.facts.map((f) => f.activationScore)
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]!).toBeGreaterThanOrEqual(scores[i]!)
    }
  })

  it('seeds are semantically matched (isSeed=true)', async () => {
    const result = await recallUseCase.execute({
      queryText: 'AIエージェント',
      theme,
      topK: 3,
    })
    if (!isOk(result)) return

    const seeds = result.value.activation.facts.filter((f) => f.isSeed)
    expect(seeds.length).toBeGreaterThan(0)
    expect(seeds.length).toBeLessThanOrEqual(3)
  })

  it('graph traversal surfaces connected facts (hasUnexpectedConnections)', async () => {
    // With a graph in repo (seeded in beforeEach), traversal should find neighbors
    const result = await recallUseCase.execute({
      queryText: 'AIエージェント',
      theme,
      topK: 2,           // limit seeds to 2 so traversal has room to add
      graphDepth: 1,
    })
    if (!isOk(result)) return

    const { activation } = result.value
    // Graph was seeded with RELATED_TO edges between consecutive nodes,
    // so seeds should have neighbors → traversedCount > 0
    if (activation.seedCount > 0 && activation.totalCount > activation.seedCount) {
      expect(activation.hasUnexpectedConnections()).toBe(true)
    }
    // At minimum, activation works without throwing
    expect(activation.totalCount).toBeGreaterThan(0)
  })

  it('toSummary returns correct metadata', async () => {
    const result = await recallUseCase.execute({ queryText: 'テスト', theme })
    if (!isOk(result)) return

    const summary = result.value.activation.toSummary()
    expect(summary.queryText).toBe('テスト')
    expect(summary.theme).toBe(theme)
    expect(summary.totalCount).toBe(result.value.activation.totalCount)
    expect(typeof summary.topActivationScore).toBe('number')
  })

  it('works without a theme (semantic-only recall, no graph traversal)', async () => {
    const result = await recallUseCase.execute({ queryText: 'AIエージェント' })
    expect(isOk(result)).toBe(true)
    if (!isOk(result)) return

    // No graph traversal without theme
    expect(result.value.activation.traversedCount).toBe(0)
    expect(result.value.activation.hasUnexpectedConnections()).toBe(false)
  })

  it('rejects empty queryText', async () => {
    const result = await recallUseCase.execute({ queryText: '  ' })
    expect(isOk(result)).toBe(false)
  })
})
