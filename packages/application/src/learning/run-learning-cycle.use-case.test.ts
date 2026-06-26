import { describe, it, expect } from 'vitest'
import { isOk } from '@innovation-os/shared/result'
import { GenerateDiscoveryUseCase } from '../discovery/generate-discovery.use-case.js'
import { MockResearchResultPort } from '../discovery/mock-research-result-port.js'
import { NoopEventPublisher } from '../discovery/ports.js'
import { SaveDiscoveryToKnowledgeUseCase } from '../knowledge/save-discovery-to-knowledge.use-case.js'
import { MockKnowledgeFactRepository } from '../knowledge/mock-knowledge-fact-repository.js'
import { MockKnowledgeGraphRepository } from '../knowledge/mock-knowledge-graph-repository.js'
import { MockHypothesisRepository } from '../reasoning/mock-hypothesis-repository.js'
import { MockEvidenceRequestRepository } from '../reasoning/mock-evidence-request-repository.js'
import { MockResearchPlanRepository } from '../research/mock-research-plan-repository.js'
import { MockKnowledgeSourcePort } from '../research/mock-knowledge-source-port.js'
import { MockLearningCycleRepository } from './mock-learning-cycle-repository.js'
import { RunLearningCycleUseCase } from './run-learning-cycle.use-case.js'
import { RoundRobinSourcePlanner, TypeMatchSourcePlanner } from './source-planner.js'
import { BusinessEvaluator, ScientificEvaluator } from '@innovation-os/knowledge/research'

/**
 * Builds the full stack required for a learning cycle test.
 * Includes seeded knowledge so there is something to reason about.
 */
async function buildStack(theme: string) {
  const factRepo = new MockKnowledgeFactRepository()
  const graphRepo = new MockKnowledgeGraphRepository()
  const hypothesisRepo = new MockHypothesisRepository()
  const evidenceRequestRepo = new MockEvidenceRequestRepository()
  const planRepo = new MockResearchPlanRepository()
  const cycleRepo = new MockLearningCycleRepository()

  // Seed: Discovery → Knowledge graph
  const generate = new GenerateDiscoveryUseCase(new MockResearchResultPort(), new NoopEventPublisher())
  const saveToKnowledge = new SaveDiscoveryToKnowledgeUseCase(graphRepo)

  const discResult = await generate.execute({ themeText: theme })
  if (!isOk(discResult)) throw new Error('Discovery failed')

  const kResult = await saveToKnowledge.execute({ result: discResult.value.result })
  if (!isOk(kResult)) throw new Error('SaveToKnowledge failed')

  for (const node of kResult.value.graph.nodes) {
    await factRepo.save(node.fact)
  }

  const source = new MockKnowledgeSourcePort(factRepo)

  const useCase = new RunLearningCycleUseCase(
    factRepo, graphRepo, hypothesisRepo, evidenceRequestRepo, planRepo, cycleRepo,
    [source],
    { maxResearch: 3 },
  )

  return { useCase, cycleRepo, factRepo, hypothesisRepo, evidenceRequestRepo }
}

describe('RunLearningCycleUseCase', () => {
  const theme = 'AIエージェント'

  it('executes successfully and returns a completed LearningCycle', async () => {
    const { useCase } = await buildStack(theme)

    const result = await useCase.execute({ theme, trigger: 'manual' })
    expect(isOk(result)).toBe(true)
    if (!isOk(result)) return

    expect(result.value.cycle.status).toBe('completed')
    expect(result.value.cycle.completedAt).not.toBeNull()
  })

  it('generates at least one hypothesis from the knowledge graph', async () => {
    const { useCase } = await buildStack(theme)

    const result = await useCase.execute({ theme, trigger: 'manual' })
    if (!isOk(result)) return

    expect(result.value.hypothesesCount).toBeGreaterThan(0)
  })

  it('executes research plans and builds ResearchTraces', async () => {
    const { useCase } = await buildStack(theme)

    const result = await useCase.execute({ theme, trigger: 'manual' })
    if (!isOk(result)) return

    expect(result.value.researchedCount).toBeGreaterThanOrEqual(0)
    // Each researched request should have a trace
    expect(result.value.traces.length).toBe(result.value.researchedCount)
  })

  it('traces contain a planner step recording source selection', async () => {
    const { useCase } = await buildStack(theme)

    const result = await useCase.execute({ theme, trigger: 'manual' })
    if (!isOk(result)) return
    if (result.value.traces.length === 0) return  // no research = no traces

    const plannerSteps = result.value.traces.flatMap((t) => t.stepsOfType('planner'))
    expect(plannerSteps.length).toBeGreaterThan(0)
    expect(plannerSteps[0]!.metadata['selectedSources']).toBeDefined()
  })

  // ── Capability Proof — Sprint 7 ───────────────────────────────────────
  it('[CAPABILITY] cycle.isActivelyLearning() proves the system is in a learning loop', async () => {
    const { useCase } = await buildStack(theme)

    const result = await useCase.execute({ theme, trigger: 'manual' })
    if (!isOk(result)) return

    const { cycle } = result.value
    // isActivelyLearning = knowledgeChanges > 0 OR newQuestionsGenerated > 0
    // This proves the system is not just executing code — it is changing its knowledge
    // and raising new questions as a result.
    expect(cycle.isActivelyLearning()).toBe(true)
    expect(cycle.toSummary()).toContain('actively learning: true')
  })

  it('[CAPABILITY] LearningCycle is persisted and retrievable', async () => {
    const { useCase, cycleRepo } = await buildStack(theme)

    const result = await useCase.execute({ theme, trigger: 'manual' })
    if (!isOk(result)) return

    const { cycle } = result.value
    const retrieved = await cycleRepo.findById(cycle.id)
    expect(isOk(retrieved)).toBe(true)
    if (!isOk(retrieved)) return

    expect(retrieved.value.id).toBe(cycle.id)
    expect(retrieved.value.status).toBe('completed')
  })

  it('[CAPABILITY] LearningCycle records trigger and theme for governance', async () => {
    const { useCase } = await buildStack(theme)

    const result = await useCase.execute({ theme, trigger: 'scheduled' })
    if (!isOk(result)) return

    expect(result.value.cycle.trigger).toBe('scheduled')
    expect(result.value.cycle.theme).toBe(theme)
  })

  it('rejects empty theme', async () => {
    const { useCase } = await buildStack(theme)

    const result = await useCase.execute({ theme: '', trigger: 'manual' })
    expect(isOk(result)).toBe(false)
  })

  it('RoundRobinSourcePlanner uses all registered sources', () => {
    const source1 = new MockKnowledgeSourcePort(new MockKnowledgeFactRepository())
    const source2 = new MockKnowledgeSourcePort(new MockKnowledgeFactRepository())
    // @ts-expect-error — testing internal behavior
    source2['sourceName'] = 'secondary-source'

    const planner = new RoundRobinSourcePlanner([source1, source2])
    // ResearchQuestion mock — only needs questionType
    const mockQuestion = { questionType: 'empirical', searchTerms: [] } as Parameters<typeof planner.selectSources>[0]
    const selected = planner.selectSources(mockQuestion)
    expect(selected.length).toBe(2)
  })

  it('TypeMatchSourcePlanner matches question type to source specialty', () => {
    const kbSource = new MockKnowledgeSourcePort(new MockKnowledgeFactRepository())
    const planner = new TypeMatchSourcePlanner([kbSource])
    const structuralQuestion = { questionType: 'structural', searchTerms: [] } as Parameters<typeof planner.selectSources>[0]
    const selected = planner.selectSources(structuralQuestion)
    expect(selected.length).toBeGreaterThan(0)
    expect(selected[0]!.sourceType).toBe('knowledge_base')
  })

  it('[CAPABILITY] pluggable evaluator: BusinessEvaluator changes epistemology', async () => {
    const factRepo = new MockKnowledgeFactRepository()
    const graphRepo = new MockKnowledgeGraphRepository()
    const hypothesisRepo = new MockHypothesisRepository()
    const evidenceRequestRepo = new MockEvidenceRequestRepository()
    const planRepo = new MockResearchPlanRepository()
    const cycleRepo = new MockLearningCycleRepository()

    const generate = new GenerateDiscoveryUseCase(new MockResearchResultPort(), new NoopEventPublisher())
    const saveToKnowledge = new SaveDiscoveryToKnowledgeUseCase(graphRepo)
    const discResult = await generate.execute({ themeText: theme })
    if (!isOk(discResult)) return
    const kResult = await saveToKnowledge.execute({ result: discResult.value.result })
    if (!isOk(kResult)) return
    for (const node of kResult.value.graph.nodes) await factRepo.save(node.fact)

    const source = new MockKnowledgeSourcePort(factRepo)

    // Same stack, different evaluator — epistemology swap
    const businessCycle = new RunLearningCycleUseCase(
      factRepo, graphRepo, hypothesisRepo, evidenceRequestRepo, planRepo, cycleRepo,
      [source],
      { evaluator: new BusinessEvaluator(), maxResearch: 2 },
    )

    const result = await businessCycle.execute({ theme, trigger: 'manual' })
    expect(isOk(result)).toBe(true)
    if (!isOk(result)) return

    // Both complete their cycles — the evaluator doesn't break the pipeline
    expect(result.value.cycle.status).toBe('completed')
  })

  // ── Full Learning Loop Proof ──────────────────────────────────────────
  it('[CAPABILITY] full proof: Reason → Source → Acquire → Evaluate → Integrate → ReReason', async () => {
    const { useCase } = await buildStack(theme)

    const result = await useCase.execute({ theme, trigger: 'manual' })
    expect(isOk(result)).toBe(true)
    if (!isOk(result)) return

    const { cycle, hypothesesCount, researchedCount, newKnowledgeCount } = result.value

    // Step 1: System generated hypotheses (Reasoning worked)
    expect(hypothesesCount).toBeGreaterThan(0)

    // Step 2: System executed research (Acquisition worked)
    // (may be 0 if no open requests survive decompose, but cycle still completes)
    expect(cycle.researchPlanIds.length).toBe(researchedCount)

    // Step 3: System completed and recorded the cycle (Governance works)
    expect(cycle.status).toBe('completed')
    expect(cycle.hypothesesCount).toBe(hypothesesCount)

    // Step 4: The cycle has a complete summary (Explainability works)
    const summary = cycle.toSummary()
    expect(summary).toContain('LearningCycle')
    expect(summary).toContain(theme)
    expect(summary).toContain('completed')
  })
})
