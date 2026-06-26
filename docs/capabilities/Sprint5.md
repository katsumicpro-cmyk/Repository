# Sprint 5 — Reasoning: 知識の欠落・矛盾・仮説を見つける

## Before

知識はあった。想起もできた。
しかし、知識の中に矛盾があっても気づかなかった。
パターンが浮かび上がっていても、誰かが指摘するまで見えなかった。
「このAとBは矛盾しているのではないか」を、人間が言うまで待っていた。

## Capability

**人間が尋ねる前に、システムが問いを生成する。**

ContradictionEngine → 矛盾の発見
PatternExtractor    → 共通性の抽出
HypothesisGenerator → 仮説の生成
EvidenceRequest     → 問いの形式化

```
InitiateReasoningCycleUseCase(theme) → generatedQuestionsCount > 0
```

人間の入力は theme のみ。残りはシステムが自律的に行う。

## Evidence

```typescript
const result = await reasoningCycle.execute({ theme: 'AIエージェント' })
// result.contradictions.length >= 0
// result.patterns.length >= 0
// result.generatedQuestionsCount > 0  ← 人間が尋ねていない問いが存在する
// result.evidenceRequests[0].question.length > 0
```

生成される問いの例:
```
「AIエージェントは自律的に動作できる」と
「AIシステムは人間の監視が必要だ」は
どちらがより正確ですか？この矛盾を解消する証拠はありますか？
```

この問いは、ユーザーが「矛盾を探して」と言わなくても生成される。

## Limitations

問いを立てるだけで、答えられない。
EvidenceRequest は `open` のまま残り続ける。
自ら調べる手段がない。
計画を立てる方法がない。

立てた問いが良い問いかどうかを評価する基準がない。
MockEmbedding のため semantic_opposition 検出が機能しない。

## Next Capability

立てた問いを自ら分解し、調査計画を設計し、
証拠を収集・評価し、知識を更新する。
「自ら調査できる」ことができるようになる。
