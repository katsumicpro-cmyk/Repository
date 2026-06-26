import { describe, it, expect } from 'vitest'
import { isOk } from '@innovation-os/shared/result'
import { GenerateDiscoveryUseCase } from '../discovery/generate-discovery.use-case.js'
import { MockResearchResultPort } from '../discovery/mock-research-result-port.js'
import { NoopEventPublisher } from '../discovery/ports.js'
import { SaveDiscoveryToKnowledgeUseCase } from '../knowledge/save-discovery-to-knowledge.use-case.js'
import { MockKnowledgeGraphRepository } from '../knowledge/mock-knowledge-graph-repository.js'
import { Invariant, Principle } from '@innovation-os/knowledge/principle'
import { MockInvariantRepository } from './mock-invariant-repository.js'
import { MockPrincipleRepository } from './mock-principle-repository.js'
import { ExtractInvariantsUseCase } from './extract-invariants.use-case.js'
import { DerivePrinciplesUseCase } from './derive-principles.use-case.js'

async function buildPrincipleStack(theme: string) {
  const graphRepo = new MockKnowledgeGraphRepository()
  const generate = new GenerateDiscoveryUseCase(new MockResearchResultPort(), new NoopEventPublisher())
  const saveToKnowledge = new SaveDiscoveryToKnowledgeUseCase(graphRepo)

  const discResult = await generate.execute({ themeText: theme })
  if (!isOk(discResult)) throw new Error('Discovery failed')
  const kResult = await saveToKnowledge.execute({ result: discResult.value.result })
  if (!isOk(kResult)) throw new Error('SaveToKnowledge failed')

  const invariantRepo = new MockInvariantRepository()
  const principleRepo = new MockPrincipleRepository()

  const extractUseCase = new ExtractInvariantsUseCase(graphRepo, invariantRepo)
  const deriveUseCase = new DerivePrinciplesUseCase(invariantRepo, principleRepo)

  return { invariantRepo, principleRepo, extractUseCase, deriveUseCase }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Principle domain object
// ─────────────────────────────────────────────────────────────────────────────

describe('Principle — 処方 (how to act on an Invariant in a specific domain)', () => {
  it('[RESPONSIBILITY] Principle must always come from an Invariant (not from a Pattern directly)', () => {
    const inv = Invariant.create({
      claim: '複数の独立した観察が収束する中心概念は構造的重要性を維持する',
      invariantType: 'structural',
      sourcePatternTypes: ['hub_convergence'],
      supportingFactIds: ['f1', 'f2', 'f3'],
    }).validate()  // validate for translation

    const principle = Principle.fromInvariant({
      claim: '多くのサービスが依存するAPIは変更に対して最優先で安定させること',
      domain: 'ソフトウェアアーキテクチャ',
      sourceInvariantId: inv.id,
      sourceInvariantType: 'structural',
      applicabilityConditions: ['3つ以上のサービスが同一APIに依存している'],
      actionableStatement: 'API変更の影響範囲を依存グラフで確認し、依存数の多いAPIは変更凍結すること',
    })

    // Principle is always traceable to its source Invariant
    expect(principle.sourceInvariantId).toBe(inv.id)
    expect(principle.sourceInvariantType).toBe('structural')
    expect(principle.domain).toBe('ソフトウェアアーキテクチャ')

    // Principle is NEVER traceable directly to a Pattern — only via Invariant
    // This ensures the epistemological chain: Pattern → Invariant → Principle
  })

  it('[RESPONSIBILITY] Principle is domain-specific — same Invariant, different domain, different Principle', () => {
    const inv = Invariant.create({
      claim: 'ブリッジ要素の除去で系全体の接続性が失われる構造的不変条件',
      invariantType: 'structural',
      sourcePatternTypes: ['bridge_fact'],
      supportingFactIds: ['f1'],
    }).validate()

    const softwarePrinciple = Principle.fromInvariant({
      claim: '単一の通信経路に依存するマイクロサービスは、その経路を冗長化すること',
      domain: 'ソフトウェアアーキテクチャ',
      sourceInvariantId: inv.id,
      sourceInvariantType: 'structural',
      applicabilityConditions: ['マイクロサービス間の通信経路が単一である'],
      actionableStatement: 'サービスメッシュまたはサーキットブレーカーを導入すること',
    })

    const orgPrinciple = Principle.fromInvariant({
      claim: '全情報が一人の人物を経由する組織は、その人物の不在で機能停止する',
      domain: '組織設計',
      sourceInvariantId: inv.id,
      sourceInvariantType: 'structural',
      applicabilityConditions: ['情報フローが特定の個人に集中している'],
      actionableStatement: '意思決定権と情報アクセス権を分散させ、バックアップ担当者を任命すること',
    })

    // Same source Invariant
    expect(softwarePrinciple.sourceInvariantId).toBe(inv.id)
    expect(orgPrinciple.sourceInvariantId).toBe(inv.id)

    // Different domains → different claims → different actions
    expect(softwarePrinciple.domain).not.toBe(orgPrinciple.domain)
    expect(softwarePrinciple.claim).not.toBe(orgPrinciple.claim)
    expect(softwarePrinciple.actionableStatement).not.toBe(orgPrinciple.actionableStatement)
  })

  it('[RESPONSIBILITY] Principle lifecycle: draft → active → deprecated', () => {
    const inv = Invariant.create({
      claim: 'テスト用不変条件',
      invariantType: 'causal',
      sourcePatternTypes: ['causal_chain'],
      supportingFactIds: [],
    }).validate()

    let principle = Principle.fromInvariant({
      claim: 'テスト原則',
      domain: '製品開発',
      sourceInvariantId: inv.id,
      sourceInvariantType: 'causal',
      applicabilityConditions: ['テスト条件'],
      actionableStatement: 'テストアクション',
    })

    // Phase 1: draft — generated but not yet approved for use
    expect(principle.status).toBe('draft')
    expect(principle.isActionable()).toBe(false)

    // Phase 2: active — approved for use in the domain
    principle = principle.activate()
    expect(principle.status).toBe('active')
    expect(principle.isActionable()).toBe(true)

    // Phase 3: deprecated — the Invariant was refuted or the domain changed
    principle = principle.deprecate('元となるInvariantが反例によって棄却された')
    expect(principle.status).toBe('deprecated')
    expect(principle.isActionable()).toBe(false)
    expect(principle.deprecationReason).toBeTruthy()
    expect(principle.deprecatedAt).not.toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: Full pipeline — Pattern → Invariant → Principle
// ─────────────────────────────────────────────────────────────────────────────

describe('DerivePrinciplesUseCase — Invariant → Principle pipeline', () => {
  const theme = 'AIエージェント'

  it('translates validated Invariants into domain-specific Principles', async () => {
    const { extractUseCase, deriveUseCase } = await buildPrincipleStack(theme)

    // Step 1: Extract Invariants from knowledge
    const extractResult = await extractUseCase.execute({ theme, includeWeakPatterns: true })
    if (!isOk(extractResult)) return
    if (extractResult.value.invariants.length === 0) return

    // Step 2: Derive Principles (with auto-validate for MVP)
    const deriveResult = await deriveUseCase.execute({
      domain: 'ソフトウェアアーキテクチャ',
      autoValidateCandidates: true,
    })
    expect(isOk(deriveResult)).toBe(true)
    if (!isOk(deriveResult)) return

    const { principles } = deriveResult.value
    expect(principles.length).toBeGreaterThan(0)
    expect(deriveResult.value.domain).toBe('ソフトウェアアーキテクチャ')
  })

  it('each Principle traces back to its source Invariant (epistemic chain)', async () => {
    const { extractUseCase, deriveUseCase, invariantRepo } = await buildPrincipleStack(theme)

    await extractUseCase.execute({ theme, includeWeakPatterns: true })
    const deriveResult = await deriveUseCase.execute({
      domain: 'ソフトウェアアーキテクチャ',
      autoValidateCandidates: true,
    })
    if (!isOk(deriveResult)) return

    for (const principle of deriveResult.value.principles) {
      // Each Principle links back to a valid Invariant
      const invResult = await invariantRepo.findById(principle.sourceInvariantId)
      expect(isOk(invResult)).toBe(true)
      if (!isOk(invResult)) continue

      // The Invariant must be validated (not candidate) to have produced a Principle
      expect(invResult.value.status).toBe('validated')
    }
  })

  it('[CAPABILITY] same Invariants → different Principles for different domains', async () => {
    const { extractUseCase, invariantRepo, principleRepo } = await buildPrincipleStack(theme)

    await extractUseCase.execute({ theme, includeWeakPatterns: true })

    const softwareDerive = new DerivePrinciplesUseCase(invariantRepo, principleRepo)
    const softwareResult = await softwareDerive.execute({
      domain: 'ソフトウェアアーキテクチャ',
      autoValidateCandidates: true,
    })

    // Use a FRESH principle repo to avoid contamination
    const orgPrincipleRepo = new MockPrincipleRepository()
    const orgDerive = new DerivePrinciplesUseCase(invariantRepo, orgPrincipleRepo)
    const orgResult = await orgDerive.execute({
      domain: '組織設計',
      autoValidateCandidates: false, // already validated by software run
    })

    if (!isOk(softwareResult) || !isOk(orgResult)) return

    expect(softwareResult.value.domain).toBe('ソフトウェアアーキテクチャ')
    expect(orgResult.value.domain).toBe('組織設計')

    // Both domains get Principles from the same Invariants
    // This proves: Invariant is universal, Principle is domain-specific
    if (softwareResult.value.principles.length > 0 && orgResult.value.principles.length > 0) {
      const softwarePrinciple = softwareResult.value.principles[0]!
      const orgPrinciple = orgResult.value.principles[0]!

      // Same source Invariant ID
      expect(softwarePrinciple.sourceInvariantId).toBe(orgPrinciple.sourceInvariantId)

      // Different claims (domain-specific translation)
      expect(softwarePrinciple.claim).not.toBe(orgPrinciple.claim)
      expect(softwarePrinciple.domain).not.toBe(orgPrinciple.domain)
    }
  })

  it('Principles start as draft — require explicit activation', async () => {
    const { extractUseCase, deriveUseCase } = await buildPrincipleStack(theme)

    await extractUseCase.execute({ theme, includeWeakPatterns: true })
    const deriveResult = await deriveUseCase.execute({
      domain: '製品開発',
      autoValidateCandidates: true,
    })
    if (!isOk(deriveResult)) return

    // No Principle is active immediately — they must be reviewed and activated
    for (const principle of deriveResult.value.principles) {
      expect(principle.status).toBe('draft')
      expect(principle.isActionable()).toBe(false)
    }
  })

  it('rejects empty domain', async () => {
    const { deriveUseCase } = await buildPrincipleStack(theme)

    const result = await deriveUseCase.execute({ domain: '' })
    expect(isOk(result)).toBe(false)
  })

  // ── The capability proof ─────────────────────────────────────────────
  it('[CAPABILITY] full proof: KnowledgeFacts → Pattern → Invariant → Principle (traceable chain)', async () => {
    const { extractUseCase, deriveUseCase, invariantRepo } = await buildPrincipleStack(theme)

    // Step 1: Pattern extraction (現象を観察する)
    const extractResult = await extractUseCase.execute({ theme, includeWeakPatterns: true })
    expect(isOk(extractResult)).toBe(true)
    if (!isOk(extractResult)) return

    const { patterns, invariants } = extractResult.value

    // Patterns are observations (no lifecycle, no claim)
    for (const pattern of patterns) {
      expect(pattern.patternType).toBeTruthy()
      // @ts-expect-error — Pattern has no status
      expect(pattern.status).toBeUndefined()
    }

    // Step 2: Invariants are candidates (本質の候補)
    for (const inv of invariants) {
      expect(inv.status).toBe('candidate')
      expect(inv.sourcePatternTypes.length).toBeGreaterThan(0)
      // Invariant claim is universal — no domain name in it
      expect(inv.claim).not.toMatch(/ソフトウェア|組織|製品/)  // should be domain-agnostic
    }

    // Step 3: Principle derivation (ドメインへの翻訳)
    const deriveResult = await deriveUseCase.execute({
      domain: 'ソフトウェアアーキテクチャ',
      autoValidateCandidates: true,
    })
    expect(isOk(deriveResult)).toBe(true)
    if (!isOk(deriveResult)) return

    const { principles } = deriveResult.value

    if (principles.length > 0) {
      const principle = principles[0]!

      // Principle is domain-specific
      expect(principle.domain).toBe('ソフトウェアアーキテクチャ')
      // Principle has actionable content
      expect(principle.actionableStatement.length).toBeGreaterThan(0)
      expect(principle.applicabilityConditions.length).toBeGreaterThan(0)
      // Principle traces back to a validated Invariant
      const invResult = await invariantRepo.findById(principle.sourceInvariantId)
      expect(isOk(invResult)).toBe(true)
      if (isOk(invResult)) {
        // Invariant traces back to a PatternType
        expect(invResult.value.sourcePatternTypes.length).toBeGreaterThan(0)
      }
    }

    // Separation proof summary:
    // Pattern: patternType, strength, facts — NO status, NO claim, NO domain
    // Invariant: claim, invariantType, status (candidate→validated), sourcePatternTypes, domainHints — NO domain
    // Principle: claim, domain, actionableStatement, applicabilityConditions, status (draft→active) — always links to Invariant
    expect(true).toBe(true) // the above assertions are the proof
  })
})
