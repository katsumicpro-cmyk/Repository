import { describe, it, expect } from 'vitest'
import { isOk, isErr } from '@innovation-os/shared/result'
import { KnowledgeFact } from './knowledge-fact.js'
import { ConfidenceScore } from './confidence-score.js'
import { Embedding } from './embedding.js'

describe('KnowledgeFact', () => {
  it('creates with prefixed ID and null embedding', () => {
    const result = KnowledgeFact.create({
      content: 'AIエージェントは2024年に急速に普及した',
      sourceKind: 'discovery',
      sourceLabel: 'Mock Source A',
      confidenceBand: 'high',
      theme: 'AI',
    })
    expect(isOk(result)).toBe(true)
    if (!isOk(result)) return
    expect(result.value.id).toMatch(/^kfct_[0-9a-f]{32}$/)
    expect(result.value.embedding).toBeNull()
    expect(result.value.confidenceScore.band).toBe('high')
  })

  it('rejects empty content', () => {
    const result = KnowledgeFact.create({
      content: '   ',
      sourceKind: 'manual',
      sourceLabel: 'human',
    })
    expect(isErr(result)).toBe(true)
  })

  it('attaches embedding via withEmbedding()', () => {
    const fact = KnowledgeFact.create({
      content: 'test',
      sourceKind: 'manual',
      sourceLabel: 'human',
    })
    expect(isOk(fact)).toBe(true)
    if (!isOk(fact)) return

    const embResult = Embedding.create([0.1, 0.2, 0.3], 'mock-v0')
    expect(isOk(embResult)).toBe(true)
    if (!isOk(embResult)) return

    const withEmb = fact.value.withEmbedding(embResult.value)
    expect(withEmb.hasEmbedding()).toBe(true)
    expect(withEmb.embedding?.dimensions).toBe(3)
  })
})

describe('ConfidenceScore', () => {
  it('maps bands to numeric ranges', () => {
    expect(ConfidenceScore.low().band).toBe('low')
    expect(ConfidenceScore.medium().band).toBe('medium')
    expect(ConfidenceScore.high().band).toBe('high')
    expect(ConfidenceScore.verified().band).toBe('verified')
  })

  it('rejects out-of-range scores', () => {
    expect(isErr(ConfidenceScore.create(-0.1))).toBe(true)
    expect(isErr(ConfidenceScore.create(1.1))).toBe(true)
  })

  it('isHighConfidence returns true for score >= 0.7', () => {
    expect(ConfidenceScore.high().isHighConfidence()).toBe(true)
    expect(ConfidenceScore.low().isHighConfidence()).toBe(false)
  })
})
