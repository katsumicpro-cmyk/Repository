# Sprint 2 — Discovery: 発見できる

## Before

テーマを与えても、何も返ってこなかった。
情報はどこかにあるかもしれないが、
それを構造化された知識の種に変換する方法がなかった。

## Capability

**テーマを与えると、構造化された事実の集合が返ってくる。**

ResearchTheme → ResearchRequest → ResearchResult → FactCollection

AIなし。Mockで。でも本物のフローで。

## Evidence

```typescript
const result = await generateDiscoveryAction('AIエージェント')
// → { facts: [...6件のFact], theme: 'AIエージェント', isMock: true }
```

各 Fact は:
- content: string（事実の内容）
- confidence: ConfidenceLevel（low/medium/high/verified）
- source: string（出所）

ドメインイベント `DiscoveryStarted`, `DiscoveryCompleted` が発行される。

## Limitations

事実は消える。
次回実行すると、前の事実はどこにもない。
記憶がない。
つながりがない。
AIを呼んでいないので、事実は台本通りのMockだ。

## Next Capability

事実を永続化し、関係を持たせ、
「記憶する」ことができるようになる。
