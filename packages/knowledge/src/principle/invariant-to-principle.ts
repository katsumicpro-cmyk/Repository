import type { Invariant } from './invariant.js'
import { Principle } from './principle.js'

/**
 * InvariantToPrincipleTranslator — domain service that translates Invariants
 * into domain-specific, actionable Principles.
 *
 * This is the final step of the epistemological pipeline:
 *   KnowledgeFacts → Patterns → Invariants → Principles
 *
 * The translation is domain-parameterized.
 * Same Invariant + different domain → different Principle.
 *
 * Why domain-parameterized?
 *   "ブリッジ要素の除去で系全体の接続性が失われる" (structural Invariant)
 *   → ソフトウェア: "マイクロサービス間の唯一の通信経路を排除し、代替ルートを設計せよ"
 *   → 組織設計:   "全情報が通過する唯一の中間管理職を排除し、横断チームを設置せよ"
 *   → インフラ:   "単一AZへの依存を排除し、マルチリージョン設計を採用せよ"
 *   One Invariant. Three Principles. Three domains.
 *
 * Translation strategy (deterministic — no AI needed for MVP):
 *   invariantType × domain → tailored claim + applicabilityConditions + actionableStatement
 *   For unknown domains: use a generic translation template.
 *
 * Design: pure domain service. No I/O. No state.
 * The translations are intentionally verbose — they must be immediately usable
 * without reading the source Invariant.
 */
export class InvariantToPrincipleTranslator {
  /**
   * Translate one Invariant into a Principle for the given domain.
   *
   * Precondition: invariant.canBeTranslatedToPrinciple() === true
   * (i.e., status === 'validated')
   * The caller is responsible for checking this.
   */
  translate(invariant: Invariant, domain: string): Principle {
    const translation = this.buildTranslation(invariant, domain)

    return Principle.fromInvariant({
      claim: translation.claim,
      domain,
      sourceInvariantId: invariant.id,
      sourceInvariantType: invariant.invariantType,
      applicabilityConditions: translation.applicabilityConditions,
      actionableStatement: translation.actionableStatement,
    })
  }

  /**
   * Translate one Invariant into Principles for multiple domains at once.
   * Useful for cross-domain insight generation.
   */
  translateAcrossDomains(invariant: Invariant, domains: readonly string[]): readonly Principle[] {
    return domains.map((domain) => this.translate(invariant, domain))
  }

  // ── Translation logic ─────────────────────────────────────────────────

  private buildTranslation(invariant: Invariant, domain: string): {
    claim: string
    applicabilityConditions: readonly string[]
    actionableStatement: string
  } {
    const key = `${invariant.invariantType}:${normalizeDomain(domain)}`

    // Domain-specific translations
    const known = TRANSLATION_TABLE[key]
    if (known) {
      return known(invariant)
    }

    // Generic fallback translation
    return this.genericTranslation(invariant, domain)
  }

  private genericTranslation(invariant: Invariant, domain: string): {
    claim: string
    applicabilityConditions: readonly string[]
    actionableStatement: string
  } {
    return {
      claim: [
        `【${domain}における原則】`,
        invariant.claim.slice(0, 120),
        `この不変条件は${domain}においても成立する。`,
      ].join(' '),
      applicabilityConditions: [
        `${domain}の文脈でこの原則を適用する場合`,
        '前提条件が変化していないこと',
        `${domain}固有の例外ケースを事前に確認すること`,
      ],
      actionableStatement: [
        `${domain}において、上記不変条件に反する設計・決定を発見した場合、`,
        'まず不変条件が成立する前提条件を確認し、',
        '成立するなら設計を不変条件に沿って修正すること。',
      ].join(''),
    }
  }
}

// ── Translation table ──────────────────────────────────────────────────────

type TranslationFn = (inv: Invariant) => {
  claim: string
  applicabilityConditions: readonly string[]
  actionableStatement: string
}

function normalizeDomain(domain: string): string {
  // Map domain names to keys for the translation table
  const map: Record<string, string> = {
    'ソフトウェアアーキテクチャ': 'software',
    'software architecture': 'software',
    'software': 'software',
    '組織設計': 'org',
    'organization': 'org',
    '製品開発': 'product',
    'product': 'product',
    'インフラ': 'infra',
    'infrastructure': 'infra',
    '意思決定': 'decision',
    'decision making': 'decision',
  }
  return map[domain] ?? 'generic'
}

const TRANSLATION_TABLE: Record<string, TranslationFn> = {
  // ── causal × software ────────────────────────────────────────────────
  'causal:software': (inv) => ({
    claim: [
      `【ソフトウェアアーキテクチャ】依存チェーンにおける推移的依存は、`,
      `中間モジュールのリファクタリング後も最上流と最下流の結合を維持する。`,
      `依存関係の逆転なしに中間層を変更しても、エンドツーエンドの依存は解消されない。`,
    ].join(''),
    applicabilityConditions: [
      'モジュール間に静的または動的依存関係が存在する',
      '依存チェーンが3層以上になっている',
      'チームが「中間層を変えれば結合が解消される」と誤信している場合',
    ],
    actionableStatement: [
      '依存グラフを可視化し、推移的依存を明示的に管理せよ。',
      '依存方向を逆転させるか（DIP）、依存を排除するか（イベント駆動）の',
      '意図的な選択なしに、中間層の変更で結合問題は解決しない。',
    ].join(''),
  }),

  // ── causal × org ────────────────────────────────────────────────────
  'causal:org': (inv) => ({
    claim: [
      `【組織設計】意思決定チェーンにおける推移的責任は、`,
      `中間管理職の役割変更後も最上位者と現場の間の責任関係を維持する。`,
      `組織再編だけでは根本的な責任の所在は変わらない。`,
    ].join(''),
    applicabilityConditions: [
      '組織に3層以上の階層が存在する',
      '意思決定権限が明示的に委譲されていない',
    ],
    actionableStatement: [
      '権限委譲を明示的に設計せよ。',
      '「誰が最終決定権を持つか」をチェーンの各段階で明文化し、',
      '組織変更時は権限委譲の再設計を必ず伴わせること。',
    ].join(''),
  }),

  // ── structural × software ──────────────────────────────────────────
  'structural:software': (inv) => ({
    claim: [
      `【ソフトウェアアーキテクチャ】多くのモジュールが依存する中心コンポーネントは、`,
      `リファクタリング・マイグレーション後もアーキテクチャ上の重要性を失わない。`,
      `コンポーネントを書き換えても、依存構造を変えなければ重要性は保存される。`,
    ].join(''),
    applicabilityConditions: [
      '3つ以上のモジュールが同一コンポーネントに依存している',
      '依存グラフが明示的に管理されている、またはすぐ作成できる',
    ],
    actionableStatement: [
      '依存グラフで最高次数のコンポーネントを特定し、そのインターフェースを安定させよ。',
      'コア安定原則（SAP/SDP）に従い、変更頻度が高いコードは',
      '重要コンポーネントに依存させてはならない。',
    ].join(''),
  }),

  // ── structural × org ──────────────────────────────────────────────
  'structural:org': (inv) => ({
    claim: [
      `【組織設計】多くのチームや意思決定が経由する中心人物・チームは、`,
      `組織改編後もボトルネックとしての構造的役割を維持する。`,
      `役職を変えても情報・権限フローを変えなければ機能は変わらない。`,
    ].join(''),
    applicabilityConditions: [
      '情報や承認が特定の人物またはチームに集中している',
      '組織に「あの人に聞かないと分からない」という状況がある',
    ],
    actionableStatement: [
      '情報と権限の集中点を組織図ではなく実際の承認フローで特定せよ。',
      '集中点を排除するにはフローの再設計が必要であり、',
      '役職名の変更や組織改編だけでは不十分である。',
    ].join(''),
  }),

  // ── threshold × decision ──────────────────────────────────────────
  'threshold:decision': (inv) => ({
    claim: [
      `【意思決定】独立した根拠が一定数（閾値）を超えて集積した判断は、`,
      `追加情報によって覆る可能性が急激に低下する（決定閾値の原則）。`,
      `閾値を超えた後の情報収集は判断の質よりも遅延コストを増加させる。`,
    ].join(''),
    applicabilityConditions: [
      '独立した根拠が3つ以上存在する',
      '追加情報の収集コスト（時間・金銭）が判断を遅らせている',
      '判断の誤りが可逆的である（取り消せる）',
    ],
    actionableStatement: [
      '意思決定の閾値を事前に定義せよ（例：独立した根拠3つ）。',
      '閾値到達後は「追加情報を待つ」ではなく「判断し、観察し、修正する」に切り替えること。',
      '不可逆的決定のみ閾値を引き上げることを検討せよ。',
    ].join(''),
  }),

  // ── threshold × product ──────────────────────────────────────────
  'threshold:product': (inv) => ({
    claim: [
      `【製品開発】ユーザーからのフィードバックが閾値を超えて集積した機能仮説は、`,
      `追加のユーザーインタビューによって覆る可能性が急激に低下する。`,
      `閾値後の検証コストは機能の価値を高めない。`,
    ].join(''),
    applicabilityConditions: [
      '同じ課題について3人以上のユーザーから独立したフィードバックがある',
      '機能仮説が明確に定義されている',
    ],
    actionableStatement: [
      'ユーザーインタビューの飽和点（通常5-7件）を事前に設定せよ。',
      '飽和点到達後はプロトタイプを作り実際の行動データで検証せよ。',
      '「もう一人聞いてから」という判断先延ばしを識別して排除すること。',
    ].join(''),
  }),

  // ── conservation × software ──────────────────────────────────────
  'conservation:software': (inv) => ({
    claim: [
      `【ソフトウェアアーキテクチャ】高確信度で検証済みの設計制約は、`,
      `実装技術の変化を経ても制約としての有効性を保存する。`,
      `「古い技術での制約だから現代では無効」は誤りである場合が多い。`,
    ].join(''),
    applicabilityConditions: [
      '設計制約が複数の実装技術にわたって検証されている',
      '技術移行を理由に既存の設計判断を破棄しようとしている',
    ],
    actionableStatement: [
      '技術移行時は既存の設計制約リストを持ち越し、',
      '各制約が新技術でも成立するか個別に検証せよ。',
      '証明されるまでは「制約は保存される」と仮定して設計すること。',
    ].join(''),
  }),
}
