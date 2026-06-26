# Sprint 7 — Principle: 原則を抽出する

## Before

研究し、評価し、仮説を検証できるようになった。
しかし、検証済みの知識は個別のHypothesisとして散在したまま。
「この5つの検証済み仮説が、共通して何かを指している」を
誰も気づいていない。

## Capability

**検証済みの仮説から、普遍的な原則を抽出する。**

accepted Hypothesis × N → Pattern分析 → Principle Entity

Principle は:
- 複数の事実・仮説が収束する共通の主張
- 反例が検証済みで存在しない
- 他のドメインでも成立すると確認された

## Evidence

```typescript
// 未実装 — Sprint 7 で定義される
const principles = await extractPrinciples.execute({ theme })
// principles[0].supportingHypotheses.length >= 3
// principles[0].confidenceScore.band === 'high'
// principles[0].status === 'extracted'
```

## Limitations

（Sprint 7 実装後に記録）

## Next Capability

原則の集合から「まだ存在しない可能性」を推論し、
未来シナリオを描く Prediction 能力が加わる。
