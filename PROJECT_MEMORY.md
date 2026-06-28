# PROJECT_MEMORY.md
# Innovation OS — セッション間永続記憶

最終更新: 2026-06-28
リポジトリ: https://github.com/katsumicpro-cmyk/Repository
Blueprint: v1.1

---

## プロジェクト思想

Innovation OSは、人間が世界から学び、抽象化し、未来を構想し、新しい価値を創造するまでの
知的プロセスを、AIと協調して再現・拡張するためのオペレーティングシステムである。

情報管理システムではない。
知識が自ら矛盾を発見し、仮説を生成し、調査を計画し、世界から証拠を集め、
知識を更新し、再び新しい問いを生み出す、**Active Knowledge Operating System** である。

**Innovation OS は Human を置き換えない。Human Intelligence Amplifier である。**

人間が観察し、Innovation OS が構造化する。
Innovation OS が仮説を生成し、人間が判断する。
人間が世界に働きかけ、その結果が知識として戻ってくる。
このループが「知の共進化」である。

---

## 技術スタック

- **Monorepo**: pnpm workspaces + Turbo
- **言語**: TypeScript 5.x strict mode (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`)
- **Frontend**: Next.js 15 App Router (Server Components + Server Actions)
- **Linter**: Biome (`noExplicitAny: error`)
- **Test**: Vitest (`globals: true`)
- **Pattern**: DDD + Clean Architecture + Result<T,E>

## パッケージ構成

```
packages/
  shared/        Result<T,E>, AppError, PrefixedId, Clock
  foundation/    Entity, ValueObject, AggregateRoot, Repository, DomainEvent
  domain/        Discovery, Pattern, Principle, Future, Concept (旧世代)
  knowledge/     KnowledgeFact, KnowledgeGraph, Recall, Reasoning, Research, Learning, Principle
  application/   Use cases, Ports, Mocks
  infrastructure/ HttpEmbeddingPort (OpenAI-compatible)
  web/           Next.js 15 App Router
```

## 設計原則（変えてはならないもの）

| 原則 | 内容 |
|------|------|
| Result<T,E> | ドメイン境界を越える例外は禁止。すべて `ok()` / `err()` |
| Immutable | すべての mutation は新インスタンスを返す |
| Port Pattern | AI・DB・外部APIは必ずインターフェース越し。Domainは実装を知らない |
| PrefixedId | `kfct_`, `hypo_`, `invt_`, `thry_`, `prpl_` など prefix 付き UUID |
| Build Order | Foundation → Domain → Application → Infrastructure → Presentation |
| AI禁止 | DomainはAIを知らない。Supabaseもまだ使わない |
| Sprint完了条件 | 「コードが完成した」ではなく「新しい能力が獲得された」(D005) |

---

## 知性獲得ロードマップ（Blueprint v1.1）

Observe → Remember → Reason → Learn → Generalize → Judge → Predict → Create → Reflect

| Sprint | 能力名 | 証明 | 状態 |
|--------|--------|------|------|
| 1–2 | **Observe** | monorepo + TypeScript設定 + Discovery Entity | ✅ 完了 |
| 3 | **Remember** | KnowledgeFact + KnowledgeGraph | ✅ 完了 |
| 4–5 | **Reason** | Embedding + ContradictionEngine + HypothesisGenerator | ✅ 完了 |
| 6 | **Learn** | ResearchPlan + ConductResearch + ResearchTrace + EvidenceEvaluator | ✅ 完了 |
| 7 | **Generalize** | Pattern → Invariant → Principle 責務分離 | ✅ 完了 |
| **8** | **Judge** | **Discovery を Theory / Principle で解釈・判定** | 🔜 **次回** |
| 9 | **Predict** | Principle + Hypothesis → FutureScenario | 未着手 |
| 10 | **Create** | FutureScenario × Constraint → Concept Entity | 未着手 |
| 11 | **Reflect** | Principle・Invariant の自己修正。知識体系の改善 | 未着手 |

---

## 知識抽象化パイプライン（Blueprint v1.1）

```
Pattern  (現象)   — 観測。ライフサイクルなし。status フィールドが存在しない。
   ↓ PatternToInvariantExtractor
Invariant (本質)  — 不変条件。candidate → validated / refuted / superseded
   ↓ InvariantToTheoryBuilder               [設計済・未実装]
Theory   (説明)   — なぜそうなるのか。Explainability の中心。
   ↓ TheoryToPrincipleTranslator            [設計済・未実装]
Principle (処方)  — draft → active → deprecated。必ず sourceInvariantId を持つ。
```

**4層の責務**

| 層 | 問い | 例 |
|---|------|---|
| Pattern | 何が見えるか | 「A→B という因果が3回観測された」 |
| Invariant | 何が変わらないか | 「複雑なシステムは単一障害点を持つ」 |
| Theory | なぜそうなるか | 「依存が集中すると除去コストが指数増大するため」 |
| Principle | どう使うか | 「共有DBを排除し、各サービスに独自DBを持たせる」 |

変換規則（決定論的、AIなし）:
- `causal_chain` → `causal` Invariant
- `hub_convergence` → `structural` Invariant
- `bridge_fact` → `structural` Invariant
- `high_confidence_cluster` → `threshold` Invariant

---

## Human Learning Loop

```
Human → Observe → Innovation OS → Reason/Learn/Generalize → Concept → Human → Experiment → World → Knowledge → Innovation OS → Reflect → （繰り返し）
```

Innovation OS は Human の思考を拡張するが、Human の判断を代替しない。

---

## 現在の Knowledge ドメイン構造

### packages/knowledge/src/

```
fact/          KnowledgeFact, ConfidenceScore, Embedding, FactSource
graph/         KnowledgeGraph, KnowledgeNode, KnowledgeEdge
recall/        RecallQuery, RecalledFact, KnowledgeActivation
reasoning/     ContradictionEngine, PatternExtractor, HypothesisGenerator, EvidenceRequest
research/      ResearchQuestion, ResearchPlan, EvidenceEvaluation, ResearchTrace
               evaluation/ EvidenceEvaluator (interface)
               StatisticalEvaluator, ScientificEvaluator, BusinessEvaluator, DesignEvaluator
learning/      LearningCycle, LearningCycleTrigger, KnowledgeChange
principle/     Invariant, Theory [設計済・未実装], Principle
               PatternToInvariantExtractor, InvariantToTheoryBuilder [未実装]
               TheoryToPrincipleTranslator [未実装], InvariantToPrincipleTranslator
repository/    全 Repository インターフェース
```

### Entity ID prefix 一覧

| Entity | Prefix | Status |
|--------|--------|--------|
| KnowledgeFact | `kfct_` | ✅ 実装済 |
| KnowledgeGraph | `kgrph_` | ✅ 実装済 |
| Hypothesis | `hypo_` | ✅ 実装済 |
| EvidenceRequest | `evreq_` | ✅ 実装済 |
| ResearchPlan | `rplan_` | ✅ 実装済 |
| LearningCycle | `lcyc_` | ✅ 実装済 |
| Invariant | `invt_` | ✅ 実装済 |
| Theory | `thry_` | 🔜 Sprint 8 |
| Principle | `prpl_` | ✅ 実装済 |

### 重要な型・概念

```typescript
// Invariant
type InvariantStatus = 'candidate' | 'validated' | 'refuted' | 'superseded'
type InvariantType = 'causal' | 'structural' | 'threshold' | 'conservation'
// stabilityScore = survived challenges / total challenges

// Theory  [Sprint 8 で実装]
// type TheoryStatus = 'draft' | 'active' | 'archived'
// Theory = なぜ Invariant が成立するかの因果モデル

// Principle
type PrincipleStatus = 'draft' | 'active' | 'deprecated'
// 必ず sourceInvariantId を持つ — Invariantなしに生まれない

// LearningCycle
type LearningCycleTrigger = 'manual' | 'scheduled' | 'knowledge_threshold' | 'contradiction_detected'
// cycle.isActivelyLearning() = knowledgeChanges > 0 OR newQuestionsGenerated > 0
```

---

## Ports（現在のインターフェース）

| Port | 定義場所 | Mock | Production |
|------|----------|------|------------|
| EmbeddingPort | knowledge/embedding | MockEmbeddingPort | HttpEmbeddingPort |
| KnowledgeSourcePort | application/research | MockKnowledgeSourcePort | (未実装) |
| SourcePlanner | application/learning | RoundRobinSourcePlanner, TypeMatchSourcePlanner | (未実装) |
| EvidenceEvaluator | knowledge/research | — | Statistical/Scientific/Business/Design |

---

## ドキュメント構造

```
docs/
  BLUEPRINT.md         Innovation OS v1.1 Blueprint（全体俯瞰）
  DECISIONS.md         設計判断記録 (D001-D005)
  CONSTITUTION.md      設計憲法
  ROADMAP.md           知性獲得ロードマップ
  CTO_PLAYBOOK.md      Sprint完了の定義
  manifesto/           ACTIVE_KNOWLEDGE_MANIFESTO.md
  architecture/        CLEAN_ARCHITECTURE.md
  intelligence/        INTELLIGENCE_ROADMAP.md
  capabilities/        Sprint1.md ... Sprint11.md
```
