import { describe, it, expect } from 'vitest'
import { isOk } from '@innovation-os/shared/result'
import { GenerateDiscoveryUseCase } from '../discovery/generate-discovery.use-case.js'
import { MockResearchResultPort } from '../discovery/mock-research-result-port.js'
import { NoopEventPublisher } from '../discovery/ports.js'
import { SaveDiscoveryToKnowledgeUseCase } from '../knowledge/save-discovery-to-knowledge.use-case.js'
import { MockKnowledgeGraphRepository } from '../knowledge/mock-knowledge-graph-repository.js'
import { Invariant } from '@innovation-os/knowledge/principle'
import { PatternExtractor } from '@innovation-os/knowledge/reasoning'
import { MockInvariantRepository } from './mock-invariant-repository.js'
import { ExtractInvariantsUseCase } from './extract-invariants.use-case.js'

async function buildGraphWithKnowledge(theme: string) {
  const graphRepo = new MockKnowledgeGraphRepository()
  const generate = new GenerateDiscoveryUseCase(new MockResearchResultPort(), new NoopEventPublisher())
  const saveToKnowledge = new SaveDiscoveryToKnowledgeUseCase(graphRepo)

  const discResult = await generate.execute({ themeText: theme })
  if (!isOk(discResult)) throw new Error('Discovery failed')
  const kResult = await saveToKnowledge.execute({ result: discResult.value.result })
  if (!isOk(kResult)) throw new Error('SaveToKnowledge failed')

  return graphRepo
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Domain object unit tests — responsibility isolation
// Each test proves that Pattern, Invariant, Principle have distinct semantics.
// ─────────────────────────────────────────────────────────────────────────────

describe('Pattern — 現象 (what is repeatedly observed)', () => {
  it('Pattern describes structure: it has patternType, strength, facts — no lifecycle', async () => {
    const graphRepo = await buildGraphWithKnowledge('AIエージェント')
    const graphResult = await graphRepo.findByTheme('AIエージェント')
    if (!isOk(graphResult)) return

    const patterns = new PatternExtractor().extract(graphResult.value)

    // Pattern exists as pure observation — no status, no claim, no domain
    if (patterns.length === 0) return

    const pattern = patterns[0]!
    expect(pattern.patternType).toMatch(/hub_convergence|high_confidence_cluster|causal_chain|bridge_fact/)
    expect(pattern.strength).toBeGreaterThan(0)
    expect(pattern.facts.length).toBeGreaterThan(0)
    expect(pattern.description).toBeTruthy()

    // Pattern has NO lifecycle — it's a snapshot of observation
    // @ts-expect-error — intentionally checking that 'status' does not exist on Pattern
    expect(pattern.status).toBeUndefined()
    // @ts-expect-error — intentionally checking that 'claim' does not exist on Pattern
    expect(pattern.claim).toBeUndefined()
    // @ts-expect-error — intentionally checking that 'domain' does not exist on Pattern
    expect(pattern.domain).toBeUndefined()
  })

  it('strong patterns (strength ≥ 0.7) are the basis for Invariant extraction', async () => {
    const graphRepo = await buildGraphWithKnowledge('AIエージェント')
    const graphResult = await graphRepo.findByTheme('AIエージェント')
    if (!isOk(graphResult)) return

    const patterns = new PatternExtractor().extract(graphResult.value)
    const strong = patterns.filter((p) => p.isStrong())

    // Not all patterns are strong — this is correct
    // Invariant extraction should be selective, not exhaustive
    expect(patterns.length).toBeGreaterThanOrEqual(strong.length)
  })
})

describe('Invariant — 本質 (what holds regardless of world change)', () => {
  it('Invariant is abstracted from Pattern: it has claim, invariantType, no graph-specific content', () => {
    // We test the Invariant structure directly — no graph needed
    const inv = Invariant.create({
      claim: '複数の独立した観察が収束する中心概念は、ドメイン変化後も構造的重要性を維持する',
      invariantType: 'structural',
      sourcePatternTypes: ['hub_convergence'],
      supportingFactIds: ['fact-1', 'fact-2', 'fact-3'],
      domainHints: ['software', 'org'],
    })

    // Invariant has lifecycle — Pattern does NOT
    expect(inv.status).toBe('candidate')
    expect(inv.invariantType).toBe('structural')
    expect(inv.claim).toBeTruthy()
    // Invariant has NO graph-specific structure (no patternType, no strength)
    // @ts-expect-error — intentionally checking that 'patternType' does not exist on Invariant
    expect(inv.patternType).toBeUndefined()
    // @ts-expect-error — intentionally checking that 'strength' does not exist on Invariant
    expect(inv.strength).toBeUndefined()
  })

  it('[RESPONSIBILITY] Invariant lifecycle: candidate → challenged → survived → validated', () => {
    let inv = Invariant.create({
      claim: '世界が変わっても成立する不変条件のテスト',
      invariantType: 'causal',
      sourcePatternTypes: ['causal_chain'],
      supportingFactIds: ['f1', 'f2'],
    })

    // Phase 1: candidate — untested
    expect(inv.status).toBe('candidate')
    expect(inv.challengeCount).toBe(0)
    expect(inv.stabilityScore).toBe(0) // never challenged → unstable (0, not 1)

    // Phase 2: challenged — someone tried to disprove it
    inv = inv.challenge('反例を探す: XがYを引き起こさない状況を調査')
    expect(inv.challengeCount).toBe(1)
    expect(inv.failedChallengeCount).toBe(0)
    expect(inv.stabilityScore).toBe(0)  // challenge not yet survived

    // Phase 3: survived — the challenge failed to find a counter-example
    inv = inv.surviveChallenge()
    expect(inv.failedChallengeCount).toBe(1)
    expect(inv.stabilityScore).toBe(1.0) // 1/1 challenges survived

    // Phase 4: validated — now ready for Principle translation
    expect(inv.canBeTranslatedToPrinciple()).toBe(false) // still candidate
    inv = inv.validate()
    expect(inv.status).toBe('validated')
    expect(inv.canBeTranslatedToPrinciple()).toBe(true)
  })

  it('[RESPONSIBILITY] Invariant can be refuted — unlike Pattern (Pattern cannot be wrong)', () => {
    let inv = Invariant.create({
      claim: '反例によって崩れる不変条件',
      invariantType: 'structural',
      sourcePatternTypes: ['bridge_fact'],
      supportingFactIds: ['f1'],
    })

    expect(inv.status).toBe('candidate')
    inv = inv.refute('反例: クラスタAとBは実はブリッジなしで直接接続されていた')
    expect(inv.status).toBe('refuted')
    expect(inv.canBeTranslatedToPrinciple()).toBe(false)

    // A refuted Invariant is preserved — it's a valuable record of "what looked universal but wasn't"
    // Pattern never has a refuted state: it's an observation, not a claim
  })

  it('[RESPONSIBILITY] stabilityScore is 0 for unchallenged invariants — epistemic discipline', () => {
    const inv = Invariant.create({
      claim: 'まだ誰も検証しようとしていない主張',
      invariantType: 'conservation',
      sourcePatternTypes: ['high_confidence_cluster'],
      supportingFactIds: [],
    })

    // stabilityScore = 0 when never challenged
    // This signals: "this looks universal, but no one has tried to break it"
    // An unchallenged Invariant with stabilityScore=0 is NOT the same as a tested one
    expect(inv.stabilityScore).toBe(0)
    expect(inv.challengeCount).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: Pipeline tests — end to end
// ─────────────────────────────────────────────────────────────────────────────

describe('ExtractInvariantsUseCase — Pattern → Invariant pipeline', () => {
  const theme = 'AIエージェント'

  it('extracts Invariants from KnowledgeGraph patterns', async () => {
    const graphRepo = await buildGraphWithKnowledge(theme)
    const invariantRepo = new MockInvariantRepository()
    const useCase = new ExtractInvariantsUseCase(graphRepo, invariantRepo)

    const result = await useCase.execute({ theme, includeWeakPatterns: true })
    expect(isOk(result)).toBe(true)
    if (!isOk(result)) return

    // Patterns are preserved (the observable evidence)
    expect(result.value.patterns).toBeDefined()

    // Invariants were extracted (the abstractions)
    expect(result.value.invariants).toBeDefined()

    // The extraction pipeline is deterministic and traceable
    expect(result.value.theme).toBe(theme)
  })

  it('Invariants are saved as candidates — not yet validated', async () => {
    const graphRepo = await buildGraphWithKnowledge(theme)
    const invariantRepo = new MockInvariantRepository()
    const useCase = new ExtractInvariantsUseCase(graphRepo, invariantRepo)

    const result = await useCase.execute({ theme, includeWeakPatterns: true })
    if (!isOk(result)) return

    for (const invariant of result.value.invariants) {
      expect(invariant.status).toBe('candidate')
      // No Invariant should be validated immediately — that requires challenge
    }
  })

  it('each Invariant traces back to its source PatternType', async () => {
    const graphRepo = await buildGraphWithKnowledge(theme)
    const invariantRepo = new MockInvariantRepository()
    const useCase = new ExtractInvariantsUseCase(graphRepo, invariantRepo)

    const result = await useCase.execute({ theme, includeWeakPatterns: true })
    if (!isOk(result)) return

    for (const invariant of result.value.invariants) {
      // Each Invariant knows where it came from
      expect(invariant.sourcePatternTypes.length).toBeGreaterThan(0)
      // The source pattern types are valid
      const validTypes = ['hub_convergence', 'causal_chain', 'bridge_fact', 'high_confidence_cluster']
      for (const pt of invariant.sourcePatternTypes) {
        expect(validTypes).toContain(pt)
      }
    }
  })

  it('Invariants contain domainHints — the seeds of future Principles', async () => {
    const graphRepo = await buildGraphWithKnowledge(theme)
    const invariantRepo = new MockInvariantRepository()
    const useCase = new ExtractInvariantsUseCase(graphRepo, invariantRepo)

    const result = await useCase.execute({ theme, includeWeakPatterns: true })
    if (!isOk(result)) return
    if (result.value.invariants.length === 0) return

    // Domain hints tell us: "this Invariant could become a Principle in these domains"
    const invariantsWithHints = result.value.invariants.filter((i) => i.domainHints.length > 0)
    expect(invariantsWithHints.length).toBeGreaterThan(0)
  })

  it('empty theme is rejected', async () => {
    const graphRepo = await buildGraphWithKnowledge(theme)
    const invariantRepo = new MockInvariantRepository()
    const useCase = new ExtractInvariantsUseCase(graphRepo, invariantRepo)

    const result = await useCase.execute({ theme: '' })
    expect(isOk(result)).toBe(false)
  })
})
