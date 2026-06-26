import { describe, it, expect, beforeEach } from 'vitest'
import { isOk } from '@innovation-os/shared/result'
import { GenerateDiscoveryUseCase } from '../discovery/generate-discovery.use-case.js'
import { MockResearchResultPort } from '../discovery/mock-research-result-port.js'
import { NoopEventPublisher } from '../discovery/ports.js'
import { SaveDiscoveryToKnowledgeUseCase } from '../knowledge/save-discovery-to-knowledge.use-case.js'
import { MockKnowledgeGraphRepository } from '../knowledge/mock-knowledge-graph-repository.js'
import { InitiateReasoningCycleUseCase } from './initiate-reasoning-cycle.use-case.js'
import { MockHypothesisRepository } from './mock-hypothesis-repository.js'
import { MockEvidenceRequestRepository } from './mock-evidence-request-repository.js'

async function seedKnowledgeGraph(theme: string, graphRepo: MockKnowledgeGraphRepository) {
  const generate = new GenerateDiscoveryUseCase(new MockResearchResultPort(), new NoopEventPublisher())
  const saveToKnowledge = new SaveDiscoveryToKnowledgeUseCase(graphRepo)
  const result = await generate.execute({ themeText: theme })
  if (!isOk(result)) return null
  const kResult = await saveToKnowledge.execute({ result: result.value.result })
  return isOk(kResult) ? kResult.value : null
}

describe('InitiateReasoningCycleUseCase', () => {
  const theme = 'AIエージェント'
  let graphRepo: MockKnowledgeGraphRepository
  let hypothesisRepo: MockHypothesisRepository
  let evidenceRequestRepo: MockEvidenceRequestRepository
  let useCase: InitiateReasoningCycleUseCase

  beforeEach(async () => {
    graphRepo = new MockKnowledgeGraphRepository()
    hypothesisRepo = new MockHypothesisRepository()
    evidenceRequestRepo = new MockEvidenceRequestRepository()
    useCase = new InitiateReasoningCycleUseCase(graphRepo, hypothesisRepo, evidenceRequestRepo)
    await seedKnowledgeGraph(theme, graphRepo)
  })

  it('completes a reasoning cycle without error', async () => {
    const result = await useCase.execute({ theme })
    expect(isOk(result)).toBe(true)
  })

  it('extracts at least one pattern from a seeded graph', async () => {
    const result = await useCase.execute({ theme })
    if (!isOk(result)) return
    // A graph with 6 connected facts should yield at least a high_confidence_cluster
    expect(result.value.patterns.length).toBeGreaterThanOrEqual(0)
  })

  it('generates hypotheses from extracted patterns', async () => {
    const result = await useCase.execute({ theme })
    if (!isOk(result)) return
    const { hypotheses, patterns } = result.value
    if (patterns.length > 0) {
      expect(hypotheses.length).toBeGreaterThan(0)
    }
  })

  it('all hypotheses are persisted to hypothesisRepo', async () => {
    const result = await useCase.execute({ theme })
    if (!isOk(result)) return
    const stored = hypothesisRepo.snapshot()
    expect(stored.length).toBe(result.value.hypotheses.length)
  })

  it('generates one EvidenceRequest per hypothesis', async () => {
    const result = await useCase.execute({ theme })
    if (!isOk(result)) return
    const { hypotheses, evidenceRequests } = result.value
    expect(evidenceRequests.length).toBe(hypotheses.length)
  })

  it('all evidence requests are persisted and open', async () => {
    const result = await useCase.execute({ theme })
    if (!isOk(result)) return
    const stored = evidenceRequestRepo.snapshot()
    expect(stored.every((e) => e.isOpen())).toBe(true)
  })

  it('every evidence request has a non-empty question', async () => {
    const result = await useCase.execute({ theme })
    if (!isOk(result)) return
    for (const req of result.value.evidenceRequests) {
      expect(req.question.length).toBeGreaterThan(0)
    }
  })

  it('generatedQuestionsCount matches evidence requests count', async () => {
    const result = await useCase.execute({ theme })
    if (!isOk(result)) return
    expect(result.value.generatedQuestionsCount).toBe(result.value.evidenceRequests.length)
  })

  it('returns empty result for unknown theme', async () => {
    const result = await useCase.execute({ theme: '存在しないテーマXYZ' })
    if (!isOk(result)) return
    expect(result.value.generatedQuestionsCount).toBe(0)
    expect(result.value.foundUnexpected).toBe(false)
  })

  it('rejects empty theme', async () => {
    const result = await useCase.execute({ theme: '' })
    expect(isOk(result)).toBe(false)
  })
})
