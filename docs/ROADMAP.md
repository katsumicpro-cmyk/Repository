# Innovation OS — 知性獲得ロードマップ

> 各フェーズの完了条件は「能力の獲得」である。(D005)
> コードの完成ではなく、示せる能力が基準となる。

---

## 知性の系譜

```
Sprint 1–2  Foundation   （基盤を持つ）
                ↓
Sprint 3    Memory       （記憶する）
                ↓
Sprint 4    Recall       （想起する）
                ↓
Sprint 5    Reasoning    （知識の欠落・矛盾・仮説を見つける）
                ↓
Sprint 6    Research     （自ら調査を設計・実行する）
                ↓
Sprint 7    Principle    （原則を抽出する）
                ↓
Sprint 8    Prediction   （未来シナリオを生成する）
                ↓
Sprint 9    Concept      （価値ある解決策を構想する）
                ↓
Sprint 10   Innovation   （人間と協調して新しい価値を生み出す）
```

各能力は前の能力を基盤とする。
前の能力が壊れたとき、後のすべての能力も壊れる。

---

## Phase 1–2 — Foundation: 基盤を持つ ✅

**獲得した能力**: 構築できる / 発見できる

monorepo が build できる。型が通る。テストが走る。
テーマを与えると、構造化された事実の集合が返ってくる。

完了の証明:
- `pnpm build` が全パッケージで成功する
- `generateDiscoveryAction('AIエージェント')` が Fact の集合を返す

---

## Phase 3 — Memory: 記憶する ✅

**獲得した能力**: 事実が、関係を持つ知識として永続する

Discovery の出力が KnowledgeGraph に接続される。
Fact → KnowledgeFact → KnowledgeNode → KnowledgeGraph。

完了の証明:
- `SaveDiscoveryToKnowledgeUseCase` 実行後、`graph.nodeCount > 0`
- `edgesOfType('RELATED_TO').length > 0`

---

## Phase 4 — Recall: 想起する ✅

**獲得した能力**: クエリに対して、意味的に関連する知識が活性化する

Vector Search と Graph Traversal が組み合わさり、
直接検索しなかった知識が浮上する。

完了の証明:
- `RecallKnowledgeUseCase` が `hasUnexpectedConnections() === true` を返す
- `traversedCount > 0` (ユーザーが尋ねなかった事実が浮上する)

---

## Phase 5 — Reasoning: 知識の欠落・矛盾・仮説を見つける ✅

**獲得した能力**: 人間が尋ねる前に、システムが問いを生成する

矛盾・パターン・推移的因果から Hypothesis が生成され、
EvidenceRequest として問いが立つ。

完了の証明:
- `InitiateReasoningCycleUseCase` が `generatedQuestionsCount > 0` を返す
- 人間の入力は theme のみ

---

## Phase 6 — Research: 自ら調査を設計・実行する 🔄

**目標能力**: 問いを解決するための調査計画を立て、実行し、知識を更新する

立てた問い (EvidenceRequest) を自ら分解し、
調査計画 (ResearchPlan) を設計し、
証拠を収集・評価し、
KnowledgeGraph を更新する。

完了の証明:
- `ConductResearchUseCase` が EvidenceRequest を受け取り、
  ResearchPlan を生成し、既存知識から証拠を収集し、
  Hypothesis の status が `supported` または `refuted` に更新される
- `newFactsAdded >= 0` かつ `evaluation.verdict !== 'inconclusive'`

---

## Phase 7 — Principle: 原則を抽出する

**目標能力**: 複数の検証済み Hypothesis から、普遍的な原則を導く

Research によって支持された仮説が
Pattern Domain を経て Principle Entity に昇格する。

完了の証明:
- `accepted` 状態の Hypothesis が Principle として保存される
- Principle は複数の KnowledgeFact を根拠として持つ

---

## Phase 8 — Prediction: 未来シナリオを生成する

**目標能力**: 原則の集合から、まだ存在しない可能性を推論する

Principle から Future Entity が生成される。
「〜が成立するなら、〜が可能になるかもしれない」という推論。

完了の証明:
- Principle の組み合わせから Future が生成される
- Future は根拠となる Principle を参照し、確信度が付与される

---

## Phase 9 — Concept: 価値ある解決策を構想する

**目標能力**: Discovery から Concept に至る全サイクルが1回転する

知識フロー全体 (Discovery → Pattern → Principle → Future → Concept) が
端から端まで流れ、新しい Concept が生まれる。

完了の証明:
- あるテーマについて全ドメインのエンティティが生成・接続される
- Concept は「このプロセスなしには存在しなかった洞察」を持つ

---

## Phase 10 — Innovation: 人間と協調して新しい価値を生み出す

**目標能力**: システムが外部入力なしに推論・調査・更新サイクルを継続する

人間は問いを立てなくてよい。
システムが問い、発見し、記憶し、想起し、推論し、調査し、また問う。

完了の証明:
- Scheduled Reasoning Cycle が走り、
  前回より鋭い問いを EvidenceRequest として生成する
- 人間のインプットは最初のテーマ設定のみ

---

## 知性の定義

このロードマップが定義する「知性」とは:

```
知識を持つ              → Memory
関連を見つける          → Recall
欠落・矛盾に気づく      → Reasoning
自ら調べる              → Research
普遍性を見出す          → Principle
可能性を描く            → Prediction
解決策を構想する        → Concept
価値を生み出す          → Innovation
```

各段階は独立した能力ではなく、
前の能力の上に積み重なる知性の成長である。
