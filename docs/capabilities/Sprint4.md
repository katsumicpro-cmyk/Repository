# Sprint 4 — Recall: 想起する

## Before

記憶はあった。しかし思い出せなかった。
「AIエージェント」と検索すれば、AIエージェントについての事実が返った。
それだけだ。
「自律性」と聞いて「意思決定」の事実が浮かぶことはなかった。

## Capability

**クエリに対して、意味的に関連する知識が活性化する。**

クエリテキスト → Embedding → Vector Search → 意味的シード
意味的シード → Graph Traversal → 隣接事実
全体 → activationScore でランク → KnowledgeActivation

## Evidence

```typescript
const result = await recallUseCase.execute({
  queryText: 'AIの自律的な動作',
  theme: 'AIエージェント'
})
// activation.hasUnexpectedConnections() === true
// activation.traversedCount > 0  ← ユーザーが尋ねなかった事実が浮上
```

activationScore の式:
```
activationScore = (relevanceScore × confidenceWeight) + graphBonus(+0.2)
```

`graphBonus` がある事実は、検索では返らなかったが、
関連事実に隣接していたために浮上した。
これが「想起」と「検索」の違いを作る。

## Limitations

意味を持つベクトルがまだない。
MockEmbeddingPort はハッシュベースの疑似ベクトルを返す。
「AIエージェント」と「自律システム」が意味的に近いことを、
ベクトルは知らない。

Real EmbeddingPort が繋がるまで、
「意味的な想起」はテスト上の約束に過ぎない。

## Next Capability

記憶の中の矛盾・欠落・パターンに気づき、
「問いを立てる」ことができるようになる。
