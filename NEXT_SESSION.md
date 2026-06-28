# NEXT_SESSION.md
# 次回セッション開始ガイド

---

## 開始コマンド

次回セッション冒頭に以下を貼り付けるだけで再開できます:

```
PROJECT_MEMORY.md / PROJECT_STATE.json / NEXT_SESSION.md を読み込んで、
Sprint 8 "Judgment Engine" を開始してください。
```

---

## Sprint 8 — Judgment Engine

### Goal

蓄積した Invariant・Theory・Principle を使って、新しい Discovery を解釈・判定する能力を獲得する。

> 「この新しい発見は、すでに知られた原則に合致するか、矛盾するか、拡張するか、あるいは未知の領域か？」

### Judgment Verdict（判定種別）

```typescript
type JudgmentVerdict =
  | 'reinforces'   // この Discovery は既存 Principle / Invariant を強化する
  | 'contradicts'  // この Discovery は既存 Principle に反する
  | 'extends'      // この Discovery は Principle の適用範囲を広げる
  | 'novel'        // どの Principle にも当てはまらない — 新領域の可能性
```

### 判定の優先順位

```
1. active な Principle と照合
2. validated な Invariant と照合（Principle 未生成の場合）
3. Theory と照合（なぜそうなるかの説明との整合性確認）
4. いずれにも一致しない → 'novel'（新しい Invariant 候補の種になる）
```

### Expected Outputs

**Judgment Entity**
```typescript
type Judgment = {
  discoveryId: string
  principleId: string | null    // 'novel' の場合は null
  invariantId: string | null    // Principle がない場合に使用
  verdict: JudgmentVerdict
  reasoning: string             // 判定の根拠（説明可能性）
  confidenceScore: ConfidenceScore
  implication: string           // この判定が示唆すること
}
```

**PrincipleJudge** (domain service)
```
Discovery × active Principles × validated Invariants → Judgment[]
```

**JudgeDiscoveryUseCase** (application)
```
Input:  { discoveryId, theme }
Output: {
  judgments: Judgment[]
  novelCount: number
  reinforcedPrinciples: string[]
  contradictedPrinciples: string[]
  challengedInvariants: string[]   // 'contradicts' 判定が出た Invariant
}
```

### Architecture Notes

- `novel` 判定は新しい Invariant 候補の種になる（Sprint 9 への引き継ぎ）
- `contradicts` 判定は Invariant の `challenge()` を自動トリガーできる（将来）
- Principle は `status === 'active'` のもののみ判定に使用
- Invariant は `status === 'validated'` のもののみ判定に使用
- **Theory Layer**: Sprint 8 で `Theory` Entity を実装する（Invariant → Theory の変換）
  - `packages/knowledge/src/principle/theory.ts`
  - `packages/knowledge/src/principle/invariant-to-theory.ts`
  - `packages/knowledge/src/principle/theory-to-principle.ts`
- AIを使わない — キーワードマッチング + confidence scoring で MVP

### Sprint 完了条件（D005）

「新しい Discovery を投入したとき、システムが自律的に Judgment を返せること」

証拠:
```typescript
const result = await judgeDiscovery.execute({ discoveryId, theme })
// result.value.judgments.length > 0
// result.value.judgments[0].verdict ∈ ['reinforces', 'contradicts', 'extends', 'novel']
// result.value.judgments[0].reasoning.length > 0  // 説明可能
```

---

## 現在の知識パイプライン（Sprint 7 完了時点）

```
Discovery
  → SaveDiscoveryToKnowledge → KnowledgeGraph
    → PatternExtractor → ExtractedPattern[]
      → PatternToInvariantExtractor → Invariant[] (candidate)
        → (validate) → Invariant (validated)
          → [Sprint 8 新設] InvariantToTheoryBuilder → Theory (active)
            → TheoryToPrincipleTranslator × domain → Principle[] (draft)
              → (activate) → Principle (active)
                → [Sprint 8] PrincipleJudge → Judgment[]
```

---

## Blueprint v1.1 更新サマリー

| 変更 | 内容 |
|------|------|
| Capability Evolution | Observe→Remember→Reason→Learn→Generalize→Judge→Predict→**Create→Reflect** |
| Sprint 10 | Innovation Loop → **Create** |
| Sprint 11 | **Reflect** 新設（知識体系の自己修正能力） |
| Theory Layer | Pattern→Invariant→**Theory**→Principle（Explainability の中心） |
| Human Learning Loop | Human⇄Innovation OS⇄World 循環図を Section 3 に追加 |
| Human Intelligence Amplifier | 人間の判断を代替しない、増幅するシステムとして明記 |
| Capability Map | ██/□□ 視覚的進捗表（Section 12）を追加 |

---

## ファイルの場所

| 何を見るか | パス |
|-----------|------|
| Invariant Entity | `packages/knowledge/src/principle/invariant.ts` |
| Principle Entity | `packages/knowledge/src/principle/principle.ts` |
| PatternToInvariant | `packages/knowledge/src/principle/pattern-to-invariant.ts` |
| InvariantToPrinciple | `packages/knowledge/src/principle/invariant-to-principle.ts` |
| ExtractInvariantsUseCase | `packages/application/src/principle/extract-invariants.use-case.ts` |
| DerivePrinciplesUseCase | `packages/application/src/principle/derive-principles.use-case.ts` |
| Blueprint | `docs/BLUEPRINT.md` |
| vitest config (application) | `packages/application/vitest.config.ts` |

---

## 注意事項

- Node.js / pnpm は sandbox から実行不可 → テストは静的検証で品質担保
- `noExplicitAny: error` — `unknown` か型推論で解決
- AIはまだ呼ばない。Supabaseもまだ使わない
- Sprint 完了 = Capability の証明 (D005)

---

## Git

```bash
# 現在のブランチ
main

# リモート
origin → https://github.com/katsumicpro-cmyk/Repository.git

# 最終コミット
0ca8687 docs: Blueprint v1.1 — Theory layer, Human Learning Loop, Reflect capability
```
