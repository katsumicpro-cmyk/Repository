# Sprint 6 — Research: 自ら調査を設計・実行する

## Before

問いはあった。しかし答えられなかった。
EvidenceRequest が `open` のまま積み上がっていくだけだった。
どう調べるかを誰かに聞かなければ、調査は始まらなかった。

## Capability

**問いを解決するための調査計画を立て、実行し、知識を更新する。**

```
EvidenceRequest
    ↓ DecomposeQuestionUseCase（調査計画）
ResearchPlan + ResearchQuestion[]
    ↓ KnowledgeSourcePort.acquire()（知識獲得）
CollectedFacts
    ↓ EvidenceEvaluator（評価）
EvidenceEvaluation { verdict }
    ↓ KnowledgeGraph + Hypothesis + EvidenceRequest 更新
知識の更新
```

ResearchTrace が全過程を記録する（将来のExplainabilityの基盤）。

## Evidence

```typescript
const result = await conductResearch.execute({
  evidenceRequestId: openRequest.id,
  theme: 'AIエージェント'
})
// result.plan.questions.length > 0       ← 計画が立った
// result.plan.isCompleted() === true      ← 実行が完了した
// result.evaluation.verdict !== undefined ← 判定が出た
// evidenceRequest.status === 'answered'  ← 問いが閉じた
// result.trace.steps.length === 5        ← 全過程が記録された
```

Sprint 5 が立てた問いを、Sprint 6 が答える。
この連続が「知性の成長」の証拠。

## Limitations

調査の範囲が閉じた世界に限られる。
MockKnowledgeSourcePort は既存の KnowledgeFacts から探すだけ。
Web・論文・PDF・社内DBなど外部ソースへのアクセスがない。

EvidenceEvaluator の評価基準が一種類（StatisticalEvaluator）。
ビジネス判断・科学的検証・デザイン評価など
文脈に応じた評価ができない。

真の「調査」は、知らないことを外から持ってくる。
これはまだ「閉じた世界での推論」だ。

## Next Capability

検証済みの仮説から、複数の事実・パターンに共通する
普遍的な「原則」を抽出できるようになる。
Discovery → Knowledge → Research → Principle のフローが完成する。
