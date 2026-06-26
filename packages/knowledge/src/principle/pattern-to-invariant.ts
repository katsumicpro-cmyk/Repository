import type { ExtractedPattern } from '../reasoning/pattern/extracted-pattern.js'
import { Invariant, type InvariantType } from './invariant.js'

/**
 * PatternToInvariantExtractor — domain service that abstracts Patterns into Invariants.
 *
 * This is the epistemological leap from "what I observe" to "what holds regardless of change."
 *
 * Separation of concerns:
 *   PatternExtractor    → observes structural phenomena in a graph
 *   PatternToInvariant  → abstracts those phenomena into universal claims
 *   The two must not be merged: observation ≠ abstraction
 *
 * Translation rules (deterministic — no AI needed):
 *
 *   causal_chain → causal Invariant
 *     The pattern says: "In this graph, A causes B causes C."
 *     The Invariant says: "Transitive causation holds end-to-end.
 *                          Removing an intermediate step doesn't break the causal relationship
 *                          between the first and last element."
 *
 *   hub_convergence → structural Invariant
 *     The pattern says: "Many facts support this central fact."
 *     The Invariant says: "Nodes with high convergence maintain structural importance
 *                          across domain transformations. They are attractors."
 *
 *   bridge_fact → structural Invariant
 *     The pattern says: "This fact is the only connection between two clusters."
 *     The Invariant says: "Bridge elements, when removed, disconnect the system.
 *                          Their structural role is invariant to the content they carry."
 *
 *   high_confidence_cluster → threshold Invariant
 *     The pattern says: "Many high-confidence facts cluster here."
 *     The Invariant says: "When evidence density exceeds a threshold in a region,
 *                          that region's truth value stabilizes — further evidence
 *                          rarely reverses the conclusion."
 *
 * One pattern → one Invariant (1:1 mapping, not 1:many).
 * Multiple patterns of the same type → multiple Invariants (not merged).
 * Future: merge similar Invariants into a more general superseding Invariant.
 *
 * Design: pure domain service. No I/O. No state. Deterministic.
 */
export class PatternToInvariantExtractor {
  extract(patterns: readonly ExtractedPattern[]): readonly Invariant[] {
    return patterns
      .filter((p) => p.isStrong())  // only extract from strong patterns (strength ≥ 0.7)
      .map((p) => this.toInvariant(p))
      .filter((inv): inv is Invariant => inv !== null)
  }

  /**
   * extractAll includes weak patterns too.
   * Use this when you want candidates even from low-strength observations.
   * The Invariant status will be 'candidate' in all cases — the strength difference
   * matters for how quickly it should be validated.
   */
  extractAll(patterns: readonly ExtractedPattern[]): readonly Invariant[] {
    return patterns
      .map((p) => this.toInvariant(p))
      .filter((inv): inv is Invariant => inv !== null)
  }

  private toInvariant(pattern: ExtractedPattern): Invariant | null {
    switch (pattern.patternType) {
      case 'causal_chain':
        return this.causalChainToInvariant(pattern)
      case 'hub_convergence':
        return this.hubConvergenceToInvariant(pattern)
      case 'bridge_fact':
        return this.bridgeFactToInvariant(pattern)
      case 'high_confidence_cluster':
        return this.highConfidenceClusterToInvariant(pattern)
      default:
        return null
    }
  }

  private causalChainToInvariant(pattern: ExtractedPattern): Invariant {
    const chainLength = pattern.factCount
    const firstContent = pattern.centralFact.content.slice(0, 50)
    const lastFact = pattern.facts[pattern.facts.length - 1]
    const lastContent = lastFact?.content.slice(0, 50) ?? '...'

    return Invariant.create({
      invariantType: 'causal' as InvariantType,
      claim: [
        `因果連鎖（${chainLength}段階）における推移的因果関係は、`,
        `中間要因が変化しても第一原因と最終結果の間の因果方向を変えない。`,
        `起点:「${firstContent}」→ 終点:「${lastContent}」`,
      ].join(''),
      sourcePatternTypes: ['causal_chain'],
      supportingFactIds: pattern.facts.map((f) => f.id),
      domainHints: [
        '複雑系', 'サプライチェーン', 'ソフトウェア依存関係',
        '生態系', '組織変革', '技術的負債',
      ],
    })
  }

  private hubConvergenceToInvariant(pattern: ExtractedPattern): Invariant {
    const hubContent = pattern.centralFact.content.slice(0, 60)
    const convergenceCount = pattern.factCount

    return Invariant.create({
      invariantType: 'structural' as InvariantType,
      claim: [
        `複数（${convergenceCount}）の独立した観察が収束する中心概念は、`,
        `ドメインが変化しても構造的アクセス性と重要性を維持する。`,
        `収束点:「${hubContent}」`,
        `この収束性はコンテンツではなく構造に由来するため、コンテンツ変換後も保存される。`,
      ].join(''),
      sourcePatternTypes: ['hub_convergence'],
      supportingFactIds: pattern.facts.map((f) => f.id),
      domainHints: [
        'ネットワーク理論', 'アーキテクチャ設計', '知識グラフ',
        '組織の権力構造', 'インターネットトポロジー',
      ],
    })
  }

  private bridgeFactToInvariant(pattern: ExtractedPattern): Invariant {
    const bridgeContent = pattern.centralFact.content.slice(0, 60)

    return Invariant.create({
      invariantType: 'structural' as InvariantType,
      claim: [
        `異なるクラスタ間の唯一の接続要素（ブリッジ）は、`,
        `そのコンテンツの真偽に関わらず、除去によって系全体の接続性が失われる。`,
        `ブリッジ:「${bridgeContent}」`,
        `この脆弱性は構造的性質であり、クラスタの内容が変化しても消滅しない。`,
      ].join(''),
      sourcePatternTypes: ['bridge_fact'],
      supportingFactIds: pattern.facts.map((f) => f.id),
      domainHints: [
        'ネットワーク耐障害性', 'サプライチェーンリスク',
        '組織のボトルネック', 'API設計', 'インフラ単一障害点',
      ],
    })
  }

  private highConfidenceClusterToInvariant(pattern: ExtractedPattern): Invariant {
    const clusterSize = pattern.factCount

    return Invariant.create({
      invariantType: 'threshold' as InvariantType,
      claim: [
        `独立した証拠が閾値（${clusterSize}件以上）を超えて集積した領域では、`,
        `その結論の確信度は追加観察によって有意に変化しなくなる（収束閾値）。`,
        `この認識論的飽和は、証拠の内容ではなく密度に由来するため、`,
        `ドメインが変化しても同じ密度条件下で再現する。`,
      ].join(''),
      sourcePatternTypes: ['high_confidence_cluster'],
      supportingFactIds: pattern.facts.map((f) => f.id),
      domainHints: [
        '科学的合意形成', '意思決定理論', 'ベイズ推論',
        '品質管理', 'マーケットリサーチ',
      ],
    })
  }
}
