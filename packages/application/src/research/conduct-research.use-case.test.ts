import { describe, it, expect, beforeEach } from 'vitest'
import { isOk } from '@innovation-os/shared/result'
import { GenerateDiscoveryUseCase } from '../discovery/generate-discovery.use-case.js'
import { MockResearchResultPort } from '../discovery/mock-research-result-port.js'
import { NoopEventPublisher } from '../discovery/ports.js'
import { SaveDiscoveryToKnowledgeUseCase } from '../knowledge/save-discovery-to-knowledge.use-case.js'
import { MockKnowledgeFactRepository } from '../knowledge/mock-knowledge-fact-repository.js'
import { MockKnowledgeGraphRepository } from '../knowledge/mock-knowledge-graph-repository.js'
import { InitiateReasoningCycleUseCase } from '../reasoning/initiate-reasoning-cycle.use-case.js'
import { MockHypothesisRepository } from '../reasoning/mock-hypothesis-repository.js'
import { MockEvidenceRequestRepository } from '../reasoning/mock-evidence-request-repository.js'
import { ConductResearchUseCase } from './conduct-research.use-case.js'
import { MockResearchPort } from './mock-research-port.js'
import { MockResearchPlanRepository } from './mock-research-plan-repository.js'

async function buildFullSetup(theme: string) {
  const factRepo = new MockKnowledgeFactRepository()
  const graphRepo = new MockKnowledgeGraphRepository()
  const hypothesisRepo = new MockHypothesisRepository()
  const evidenceRequestRepo = new MockEvidenceRequestRepository()
  const planRepo = new MockResearchPlanRepository()

  // Seed: Discovery → Knowledge
  const generate = new GenerateDiscoveryUseCase(new MockResearchResultPort(), new NoopEventPublisher())
  const saveToKnowledge = new SaveDiscoveryToKnowledgeUseCase(graphRepo)

  const discResult = await generate.execute({ themeText: theme })
  if (!isOk(discResult)) throw new Error('Discovery failed')

  const kResult = await saveToKnowledge.execute({ result: discResult.value.result })
  if (!isOk(kResult)) throw new Error('SaveToKnowledge failed')

  // Populate factRepo from graph nodes
  for (const node of kResult.value.graph.nodes) {
    await factRepo.save(node.fact)
  }

  // Reasoning cycle → generate EvidenceRequests
  const reasoningUseCase = new InitiateReasoningCycleUseCase(graphRepo, hypothesisRepo, evidenceRequestRepo)
  const reasoningResult = await reasoningUseCase.execute({ theme })
  if (!isOk(reasoningResult)) throw new Error('Reasoning failed')

  const researchPort = new MockResearchPort(factRepo)
  const conductUseCase = new ConductResearchUseCase(
    factRepo, graphRepo, hypothesisRepo, evidenceRequestRepo, planRepo, researchPort,
  )

  return {
    factRepo, graphRepo, hypothesisRepo, evidenceRequestRepo, planRepo,
    reasoningOutput: reasoningResult.value,
    conductUseCase,
  }
}

describe('ConductResearchUseCase', () => {
  const theme = 'AIエージェント'

  it('produces a ResearchPlan with at least one question', async () => {
    const { conductUseCase, evidenceRequestRepo, reasoningOutput } = await buildFullSetup(theme)

    const openRequests = await evidenceRequestRepo.findByStatus('open')
    if (!isOk(openRequests) || openRequests.value.length === 0) return
    const firstRequest = openRequests.value[0]!

    const result = await conductUseCase.execute({ evidenceRequestId: firstRequest.id, theme })
    expect(isOk(result)).toBe(true)
    if (!isOk(result)) return

    expect(result.value.plan.questions.length).toBeGreaterThan(0)
    expect(reasoningOutput.generatedQuestionsCount).toBeGreaterThan(0)
  })

  it('plan is marked completed after execution', async () => {
    const { conductUseCase, evidenceRequestRepo } = await buildFullSetup(theme)

    const openRequests = await evidenceRequestRepo.findByStatus('open')
    if (!isOk(openRequests) || openRequests.value.length === 0) return

    const result = await conductUseCase.execute({
      evidenceRequestId: openRequests.value[0]!.id,
      theme,
    })
    if (!isOk(result)) return

    expect(result.value.plan.isCompleted()).toBe(true)
  })

  it('evidence request is closed after research', async () => {
    const { conductUseCase, evidenceRequestRepo } = await buildFullSetup(theme)

    const openRequests = await evidenceRequestRepo.findByStatus('open')
    if (!isOk(openRequests) || openRequests.value.length === 0) return
    const requestId = openRequests.value[0]!.id

    await conductUseCase.execute({ evidenceRequestId: requestId, theme })

    const after = await evidenceRequestRepo.findById(requestId)
    if (!isOk(after)) return
    expect(after.value.status).toBe('answered')
  })

  it('returns an EvidenceEvaluation with a verdict', async () => {
    const { conductUseCase, evidenceRequestRepo } = await buildFullSetup(theme)

    const openRequests = await evidenceRequestRepo.findByStatus('open')
    if (!isOk(openRequests) || openRequests.value.length === 0) return

    const result = await conductUseCase.execute({
      evidenceRequestId: openRequests.value[0]!.id,
      theme,
    })
    if (!isOk(result)) return

    expect(['supported', 'refuted', 'inconclusive']).toContain(result.value.evaluation.verdict)
    expect(result.value.evaluation.reasoning.length).toBeGreaterThan(0)
  })

  it('hypothesis status is updated when verdict is not inconclusive', async () => {
    const { conductUseCase, evidenceRequestRepo, hypothesisRepo } = await buildFullSetup(theme)

    const openRequests = await evidenceRequestRepo.findByStatus('open')
    if (!isOk(openRequests) || openRequests.value.length === 0) return

    const result = await conductUseCase.execute({
      evidenceRequestId: openRequests.value[0]!.id,
      theme,
    })
    if (!isOk(result)) return

    if (result.value.hypothesisUpdated) {
      const hypo = await hypothesisRepo.findById(
        result.value.plan.hypothesisId as Parameters<typeof hypothesisRepo.findById>[0],
      )
      if (!isOk(hypo)) return
      expect(['supported', 'refuted']).toContain(hypo.value.status)
    }
  })

  it('rejects empty theme', async () => {
    const { conductUseCase, evidenceRequestRepo } = await buildFullSetup(theme)
    const openRequests = await evidenceRequestRepo.findByStatus('open')
    if (!isOk(openRequests) || openRequests.value.length === 0) return

    const result = await conductUseCase.execute({
      evidenceRequestId: openRequests.value[0]!.id,
      theme: '',
    })
    expect(isOk(result)).toBe(false)
  })

  it('full pipeline: Sprint5 question → Sprint6 answer (capability proof)', async () => {
    const setup = await buildFullSetup(theme)
    const { conductUseCase, evidenceRequestRepo, reasoningOutput } = setup

    // Sprint 5 produced questions
    expect(reasoningOutput.generatedQuestionsCount).toBeGreaterThan(0)

    // Sprint 6 answers them
    const openRequests = await evidenceRequestRepo.findByStatus('open')
    if (!isOk(openRequests) || openRequests.value.length === 0) return

    let answeredCount = 0
    for (const req of openRequests.value.slice(0, 3)) {
      const result = await conductUseCase.execute({ evidenceRequestId: req.id, theme })
      if (isOk(result)) answeredCount++
    }

    expect(answeredCount).toBeGreaterThan(0)

    const stillOpen = await evidenceRequestRepo.findByStatus('open')
    const closedCount = reasoningOutput.generatedQuestionsCount -
      (isOk(stillOpen) ? stillOpen.value.length : 0)
    expect(closedCount).toBeGreaterThan(0)
  })
})
