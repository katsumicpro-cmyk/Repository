# Sprint 8 — Prediction: 未来シナリオを生成する

## Before

原則がある。しかし原則は過去の総括だ。
「今まで何が成り立ってきたか」は分かる。
しかし「これから何が可能になるか」は誰も問えていない。

## Capability

**原則の集合から、まだ存在しない可能性を推論する。**

Principle × N → Future Entity
「〜が成立するなら、〜が可能になるかもしれない」

Future は:
- 現時点では実現していない
- 成立条件（Principles）を明示する
- 確信度と時間軸を持つ

## Evidence

```typescript
// 未実装 — Sprint 8 で定義される
const futures = await predictFutures.execute({ principleIds })
// futures[0].isCurrentlyImpossible() === true  ← まだ存在しない
// futures[0].conditions.length >= 2             ← 条件が明示される
// futures[0].timeHorizon: '1年' | '5年' | '10年'
```

## Limitations

（Sprint 8 実装後に記録）

## Next Capability

Future の集合から価値ある解決策を構想し、
Concept として結晶化する能力が加わる。
