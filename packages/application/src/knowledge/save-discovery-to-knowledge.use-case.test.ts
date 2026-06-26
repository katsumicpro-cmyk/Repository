import { describe, it, expect, beforeEach } from 'vitest'
import { isOk } from '@innovation-os/shared/result'
import { GenerateDiscoveryUseCase } from '../discovery/generate-discovery.use-case.js'
import { MockResearchResultPort } from '../discovery/mock-research-result-port.js'
import { NoopEventPublisher } from '../discovery/ports.js'
import { SaveDiscoveryToKnowledgeUseCase } from './save-discovery-to-knowledge.use-case.js'
import { MockKnowledgeGraphRepository } from './mock-knowledge-graph-repository.js'

describe('SaveDiscoveryToKnowledgeUseCase', () => {
  let generateUseCase: GenerateDiscoveryUseCase
  let saveToKnowledge: SaveDiscoveryToKnowledgeUseCase
  let graphRepo: MockKnowledgeGraphRepository

  beforeEach(() => {
    generateUseCase = new GenerateDiscoveryUseCase(
      new MockResearchResultPort(),
      new NoopEventPublisher(),
    )
    graphRepo = new MockKnowledgeGraphRepository()
    saveToKnowledge = new SaveDiscoveryToKnowledgeUseCase(graphRepo)
  })

  it('converts all discovery facts to knowledge nodes', async () => {
    const discResult = await generateUseCase.execute({ themeText: 'AIエージェント' })
    expect(isOk(discResult)).toBe(true)
    if (!isOk(discResult)) return

    const kResult = await saveToKnowledge.execute({ result: discResult.value.result })
    expect(isOk(kResult)).toBe(true)
    if (!isOk(kResult)) return

    const { graph, factsAdded, edgesAdded } = kResult.value
    expect(factsAdded).toBeGreaterThan(0)
    expect(graph.nodeCount).toBe(factsAdded)
    expect(edgesAdded).toBe(factsAdded - 1) // linear chain
  })

  it('persists graph to repository', async () => {
    const discResult = await generateUseCase.execute({ themeText: 'AIエージェント' })
    if (!isOk(discResult)) return

    await saveToKnowledge.execute({ result: discResult.value.result })
    const graphs = graphRepo.snapshot()
    expect(graphs).toHaveLength(1)
    expect(graphs[0]?.theme).toBe('AIエージェント')
  })

  it('graph has RELATED_TO edges between consecutive nodes', async () => {
    const discResult = await generateUseCase.execute({ themeText: 'AI' })
    if (!isOk(discResult)) return

    const kResult = await saveToKnowledge.execute({ result: discResult.value.result })
    if (!isOk(kResult)) return

    const relatedEdges = kResult.value.graph.edgesOfType('RELATED_TO')
    expect(relatedEdges.length).toBeGreaterThan(0)
  })

  it('all knowledge nodes reference the correct theme', async () => {
    const theme = 'ブロックチェーン'
    const discResult = await generateUseCase.execute({ themeText: theme })
    if (!isOk(discResult)) return

    const kResult = await saveToKnowledge.execute({ result: discResult.value.result })
    if (!isOk(kResult)) return

    const allThemes = kResult.value.graph.nodes.map((n) => n.fact.theme)
    expect(allThemes.every((t) => t === theme)).toBe(true)
  })
})
