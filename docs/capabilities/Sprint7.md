# Sprint 7 — Knowledge Acquisition: 世界を調査する

## Before

Sprint 6 までの Innovation OS は「閉じた知識システム」だった。

- 知っていることについて推論できる
- 自分の知識から矛盾を発見できる
- 仮説を生成し、証拠を評価できる
- **しかし、新しい知識の源泉は人間が手動で追加する Discovery のみ**

システムは自分の知識世界の中でしか成長できなかった。
知識は推論できたが、学習できなかった。

## Capability

**Knowledge Acquisition** — 閉じた知識から、世界を調査する知識システムへ。

### LearningCycle Entity
一回の知的活動全体を記録する単位。
```
trigger → hypotheses → researchPlans → collectedEvidence → knowledgeChanges → newQuestions
```
「システムが何をいつ学んだか」が追跡可能になった。

### SourcePlanner
どの知識源をどの問いに使うかを決定する知的層。
- `RoundRobinSourcePlanner` — 全ソースを使う (MVP)
- `TypeMatchSourcePlanner` — 問いの型でソースをマッチング
  - `causal` → knowledge_base
  - `structural` → knowledge_base
  - `empirical` → academic, web (future)
  - `behavioral` → slack, notion (future)

### ResearchTrace 拡張 (Sprint 6 → Sprint 7)
`'planner'` と `'new_questions'` ステップを追加。
Question → Planner → Search → Evidence → Evaluation → Decision → NewQuestions

### RunLearningCycleUseCase
6フェーズの閉ループ:
1. **REASON** — InitiateReasoningCycle → 仮説 + EvidenceRequest
2. **SELECT SOURCES** — SourcePlanner が知識源を決定
3. **ACQUIRE** — KnowledgeSourcePort.acquire() → 証拠収集
4. **EVALUATE + INTEGRATE** — EvidenceEvaluator → 知識更新
5. **RE-REASON** — 更新された知識グラフで再推論 → 新しい問いを生成
6. **COMPLETE** — LearningCycle を記録

## Evidence

```typescript
const result = await runLearningCycle.execute({ theme, trigger: 'manual' })
// result.value.cycle.isActivelyLearning() === true
// → knowledgeChanges.length > 0 OR newQuestionsGenerated.length > 0
// → 人間の介入なしに Reason → Research → Update → ReReason の閉ループが成立
```

テスト: `run-learning-cycle.use-case.test.ts` — 11テスト
- `[CAPABILITY] cycle.isActivelyLearning() proves the system is in a learning loop`
- `[CAPABILITY] full proof: Reason → Source → Acquire → Evaluate → Integrate → ReReason`
- `[CAPABILITY] pluggable evaluator: BusinessEvaluator changes epistemology`
- `[CAPABILITY] LearningCycle is persisted and retrievable`

## Limitations

- `KnowledgeSourcePort` の実装は `MockKnowledgeSourcePort` のみ (knowledge_base 内検索)
  - 本当の「外部世界からの獲得」はまだない — Sprint 8 で Web / Academic 接続が必要
- `TypeMatchSourcePlanner` は静的マッピング — Claude による動的ルーティングは将来
- ResearchTrace の planner ステップは時系列的に末尾に追記される (append-only 制約)
- newQuestionsGenerated が少ない可能性 — Mock の知識グラフが小さいため

## Next Capability — Sprint 8: Principle Extraction

複数の `supported Hypothesis` から **共通原理 (Principle)** を抽出する能力。

LearningCycle が積み重なると、繰り返し supported される仮説のパターンが現れる。
そのパターンを `Principle` エンティティとして結晶化する。

Sprint 8 後、Innovation OS は:
- 事実から仮説を生成し (Sprint 5)
- 仮説を検証し (Sprint 6)
- 学習ループを自律実行し (Sprint 7)
- 検証済み仮説から原理を抽出する (Sprint 8)

という知的進化のサイクルを持つ。
