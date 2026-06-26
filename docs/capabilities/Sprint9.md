# Sprint 9 — Concept: 価値ある解決策を構想する

## Before

未来シナリオがある。しかしシナリオは方向性だ。
「〜が可能になる」は言える。
しかし「だから何をすべきか」「何を作るべきか」は言えていない。

## Capability

**Discovery から Concept に至る全サイクルが1回転する。**

Discovery → Pattern → Principle → Future → Concept

Concept は:
- このプロセスなしには存在しなかった洞察を持つ
- 実現可能性と根拠の連鎖を持つ
- 人間がレビュー・判断できる形で提示される

## Evidence

```typescript
// 未実装 — Sprint 9 で定義される
const concept = await generateConcept.execute({ futureId, context })
// concept.knowledgeChain: Discovery[] → Pattern[] → Principle[] → Future[] → Concept
// concept.novelty: 'このプロセスなしには存在しなかった'
// concept.feasibility: ConfidenceScore
```

全ドメインのエンティティが1つの concept に収束して参照される。

## Limitations

（Sprint 9 実装後に記録）

## Next Capability

サイクルが自律的に回り続け、
人間と協調して継続的に新しい価値を生み出す Innovation 能力が加わる。
