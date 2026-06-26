# Sprint 3 — Memory: 記憶する

## Before

発見された事実は、使われた後に消えた。
次のセッションで同じテーマを調べても、
前回何を知ったかをシステムは覚えていなかった。

## Capability

**事実が、関係を持つ知識として永続する。**

Fact → KnowledgeFact（識別子・確信度・ソース付き）
KnowledgeFact → KnowledgeNode（グラフ内の位置を持つ）
KnowledgeNode → KnowledgeGraph（接続・版管理付き）

## Evidence

```typescript
const kResult = await saveToKnowledge.execute({ result: researchResult })
// graph.nodeCount > 0
// graph.edgesOfType('RELATED_TO').length > 0
// graph.version === 2  (楽観的並行制御)
```

同じ事実を2回追加しても1件だけ（冪等性）。
`RELATED_TO` エッジが連続する事実を繋ぐ。
KnowledgeGraph.domainEvents に `knowledge.node_added` が記録される。

## Limitations

記憶はしているが、思い出せない。
「AIエージェントについて知っているか？」と聞かれても、
キーワード一致でしか探せない。
意味的な近さで探す手段がない。

Embeddingがゼロ。
ベクトルがゼロ。
意味の距離がゼロ。

## Next Capability

Embeddingを付与し、Vector Searchを実装し、
「意味的に近い知識を想起できる」ことができるようになる。
