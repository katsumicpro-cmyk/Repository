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
蓄積した Principle を使って、新しい Discovery を解釈・判定する能力を獲得する。

### 問い
「この新しい発見は、すでに知られた原則に合致するか、それとも矛盾するか？」

### Expected Outputs

**Judgment Entity**
```typescript
type JudgmentVerdict =
  | 'reinforces'   // この Discovery は既存 Principle を強化する
  | 'contradicts'  // この Discovery は既存 Principle に反する
  | 'extends'      // この Discovery は Principle の適用範囲を広げる
  | 'novel'        // どの Principle にも当てはまらない — 新領域の可能性

type Judgment = {
  discoveryId: string
  principleId: string        // null if 'novel'
  verdict: JudgmentVerdict
  reasoning: string
  confidenceScore: ConfidenceScore
  implication: string        // この判定が意味すること
}
```

**PrincipleJudge** (domain service)
```
Discovery → compare with active Principles → Judgment[]
```

**JudgeDiscoveryUseCase** (application)
```
Input:  { discoveryId, theme }
Output: { judgments[], novelCount, reinforcedPrinciples[], contradictedPrinciples[] }
```

### Architecture Notes
- `novel` 判定は新しい Invariant 候補の種になる
- `contradicts` 判定は Invariant の `challenge` を自動トリガーできる (将来)
- Principle は `status === 'active'` のもののみ判定に使用する
- AIを使わない — コンテンツの意味的比較はキーワードマッチング + confidence scoring で MVP

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
          → InvariantToPrincipleTranslator × domain → Principle[] (draft)
            → (activate) → Principle (active)
              → [Sprint 8] PrincipleJudge → Judgment[]
```

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
| vitest config (application) | `packages/application/vitest.config.ts` |
| knowledge package.json | `packages/knowledge/package.json` |

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
b408796 feat: establish abstraction pipeline
```
