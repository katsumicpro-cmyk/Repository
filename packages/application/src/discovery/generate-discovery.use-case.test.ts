import { describe, it, expect, beforeEach } from 'vitest'
import { isOk, isErr } from '@innovation-os/shared/result'
import { GenerateDiscoveryUseCase } from './generate-discovery.use-case.js'
import { MockResearchResultPort } from './mock-research-result-port.js'
import { NoopEventPublisher } from './ports.js'

describe('GenerateDiscoveryUseCase', () => {
  let useCase: GenerateDiscoveryUseCase

  beforeEach(() => {
    useCase = new GenerateDiscoveryUseCase(
      new MockResearchResultPort(),
      new NoopEventPublisher(),
    )
  })

  it('returns a ResearchResult with facts for a valid theme', async () => {
    const result = await useCase.execute({ themeText: 'AIエージェント' })
    expect(isOk(result)).toBe(true)
    if (!isOk(result)) return

    const { request, result: resResult } = result.value
    expect(request.theme.value).toBe('AIエージェント')
    expect(resResult.factCollection.size).toBeGreaterThan(0)
    expect(resResult.isMock).toBe(true)
  })

  it('rejects empty theme text', async () => {
    const result = await useCase.execute({ themeText: '   ' })
    expect(isErr(result)).toBe(true)
    if (isErr(result)) expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  it('generates unique request IDs on each call', async () => {
    const a = await useCase.execute({ themeText: 'テーマA' })
    const b = await useCase.execute({ themeText: 'テーマB' })
    if (!isOk(a) || !isOk(b)) return
    expect(a.value.request.id).not.toBe(b.value.request.id)
  })

  it('result contains high-confidence facts', async () => {
    const result = await useCase.execute({ themeText: '量子コンピュータ' })
    if (!isOk(result)) return
    const highFacts = result.value.result.factCollection.highConfidenceFacts()
    expect(highFacts.length).toBeGreaterThan(0)
  })
})
