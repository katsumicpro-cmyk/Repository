# Sprint 7 — Invariant Discovery: 不変条件の発見

## Before

Sprint 6 まで、Innovation OS は「事実の収集・推論・仮説検証」ができた。
しかし、抽出できた知識はすべて「このグラフで観測された現象」に留まっていた。

- Pattern: 「このデータセットで A → B が繰り返し現れる」(現象)
- Hypothesis: 「このドメインで A が B を引き起こす」(領域限定の主張)

**世界が変わっても成立する本質的な条件** を発見する能力がなかった。

## Capability

**Pattern / Invariant / Principle の責務分離**

### Pattern — 現象 (observation)
- 「このグラフで何が繰り返し観測されているか」
- ライフサイクルなし。ただの観測記録。
- 属性: `patternType`, `strength`, `facts`, `description`
- `status` は存在しない。Pattern は正しいか誤っているかではなく、観測されたかどうかだけを表す。

### Invariant — 本質 (essence)
- 「世界が変わっても成立する不変条件」
- ライフサイクルあり: `candidate → validated / refuted / superseded`
- `stabilityScore` = 失敗したチャレンジ数 / 全チャレンジ数
  - 0.0 = 未検証 (誰もまだ否定しようとしていない)
  - 1.0 = 全チャレンジを生き残った
- ドメインを持たない。普遍的。
- `canBeTranslatedToPrinciple()` は `status === 'validated'` のみ `true`

### Principle — 処方 (prescription)
- 「この不変条件を、このドメインでどう使うか」
- ライフサイクルあり: `draft → active → deprecated`
- 必ず `sourceInvariantId` を持つ (Invariantなしに生まれない)
- 同じ Invariant + 異なるドメイン → 異なる Principle

### PatternToInvariantExtractor
決定論的変換:
```
causal_chain pattern    → causal Invariant (推移的因果は変化しない)
hub_convergence pattern → structural Invariant (収束点は構造的重要性を維持する)
bridge_fact pattern     → structural Invariant (ブリッジ除去で接続が失われる)
high_confidence_cluster → threshold Invariant (証拠密度の閾値を超えると結論が安定する)
```

### InvariantToPrincipleTranslator
ドメインパラメータ化翻訳:
```
structural Invariant × ソフトウェアアーキテクチャ
  → 「多くのモジュールが依存するAPIは変更凍結すること」
structural Invariant × 組織設計
  → 「情報が集中する人物を排除し、権限を分散すること」
```
同じ Invariant から、ドメイン数だけ Principle が生まれる。

## Evidence

```typescript
// Pattern: no status, no claim, no domain
// @ts-expect-error
expect(pattern.status).toBeUndefined()

// Invariant: lifecycle
expect(inv.status).toBe('candidate')
inv = inv.challenge('...').surviveChallenge().validate()
expect(inv.status).toBe('validated')
expect(inv.canBeTranslatedToPrinciple()).toBe(true)

// Principle: domain-specific, traceable to Invariant
expect(principle.sourceInvariantId).toBe(inv.id)
expect(principle.domain).toBe('ソフトウェアアーキテクチャ')
expect(principle.isActionable()).toBe(false) // starts as draft
principle = principle.activate()
expect(principle.isActionable()).toBe(true)
```

テスト: 21テスト (extract-invariants × 6 + derive-principles × 10 + domain objects × 5)
- `[RESPONSIBILITY] Invariant lifecycle: candidate → challenged → survived → validated`
- `[RESPONSIBILITY] Invariant can be refuted — unlike Pattern`
- `[RESPONSIBILITY] Principle must always come from an Invariant`
- `[RESPONSIBILITY] same Invariant → different domains → different Principles`
- `[CAPABILITY] full proof: KnowledgeFacts → Pattern → Invariant → Principle (traceable chain)`

## Limitations

- `autoValidateCandidates: true` は MVP のショートカット
  - 本来は `challenge → surviveChallenge` を繰り返してから `validate`
  - 将来: `ChallengeInvariantUseCase` が必要
- `InvariantToPrincipleTranslator` の翻訳テーブルは静的マッピング
  - 未知ドメインは汎用翻訳にフォールバック
  - 将来: Claude による動的翻訳 (AIはまだ呼ばない)
- Principle は生成直後 `draft` のまま
  - 活性化 (activate) は今のところ手動
  - 将来: `ValidateAndActivatePrincipleUseCase` が必要

## Next Capability — Sprint 8: Principle Application

活性化した Principle を使って、新しい Discovery や Hypothesis を評価する能力。

「この Discovery は、すでに知られた Principle に合致するか、それとも矛盾するか？」

Principle が知識評価の基準になったとき、Innovation OS は蓄積した知識で
新しい観察を能動的に解釈できるようになる。
