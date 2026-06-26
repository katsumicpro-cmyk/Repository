# PROJECT_MEMORY.md
# Innovation OS — セッション間永続記憶

最終更新: 2026-06-27
リポジトリ: https://github.com/katsumicpro-cmyk/Repository

---

## プロジェクト思想

Innovation OSは、人間が世界から学び、抽象化し、未来を構想し、新しい価値を創造するまでの
知的プロセスを、AIと協調して再現・拡張するためのオペレーティングシステムである。

情報管理システムではない。
知識が自ら矛盾を発見し、仮説を生成し、調査を計画し、世界から証拠を集め、
知識を更新し、再び新しい問いを生み出す、**Active Knowledge Operating System** である。

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
| PrefixedId | `kfct_`, `hypo_`, `invt_`, `prpl_` など prefix 付き UUID |
| Build Order | Foundation → Domain → Application → Infrastructure → Presentation |
| AI禁止 | DomainはAIを知らない。Supabaseもまだ使わない |
| Sprint完了条件 | 「コードが完成した」ではなく「新しい能力が獲得された」(D005) |

---

## 知性獲得ロードマップ（Sprint 別能力）

| Sprint | 能力名 | 証明 | 状態 |
|--------|--------|------|------|
| 1 | Infrastructure Foundation | monorepo + TypeScript設定 | ✅ 完了 |
| 2 | Discovery Creation | Discovery Entity + Repository | ✅ 完了 |
| 3 | Knowledge Foundation | KnowledgeFact + KnowledgeGraph | ✅ 完了 |
| 4 | Semantic Memory | Embedding + VectorSearch + KnowledgeActivation | ✅ 完了 |
| 5 | Reasoning | ContradictionEngine + HypothesisGenerator + EvidenceRequest | ✅ 完了 |
| 6 | Research | ResearchPlan + ConductResearch + ResearchTrace + EvidenceEvaluator | ✅ 完了 |
| 7a | Learning Cycle | RunLearningCycleUseCase + SourcePlanner + LearningCycle | ✅ 完了 |
| 7b | Invariant Discovery | Pattern → Invariant → Principle 責務分離 | ✅ 完了 |
| **8** | **Judgment Engine** | **Discovery を Principle で解釈・判定** | 🔜 **次回** |
| 9 | Concept Synthesis | Principle + Future → Concept Entity | 未着手 |
| 10 | Innovation Loop | 全パイプライン自律実行 | 未着手 |

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
principle/     Invariant, Principle, PatternToInvariantExtractor, InvariantToPrincipleTranslator
repository/    全 Repository インターフェース
```

### 重要な型・概念

```typescript
// KnowledgeFact
type KnowledgeFactId = PrefixedId<'kfct'>
// confidenceScore.band: 'low' | 'medium' | 'high' | 'verified'

// Invariant
type InvariantStatus = 'candidate' | 'validated' | 'refuted' | 'superseded'
type InvariantType = 'causal' | 'structural' | 'threshold' | 'conservation'
// stabilityScore = survived challenges / total challenges

// Principle
type PrincipleStatus = 'draft' | 'active' | 'deprecated'
// 必ず sourceInvariantId を持つ — Invariantなしに生まれない

// LearningCycle
type LearningCycleTrigger = 'manual' | 'scheduled' | 'knowledge_threshold' | 'contradiction_detected'
// cycle.isActivelyLearning() = knowledgeChanges > 0 OR newQuestionsGenerated > 0
```

---

## Sprint 7 で確立した抽象化パイプライン

```
Pattern  (現象)  — 観測。ライフサイクルなし。status フィールドが存在しない。
   ↓ PatternToInvariantExtractor
Invariant (本質) — 不変条件。candidate → validated / refuted / superseded
   ↓ InvariantToPrincipleTranslator × domain
Principle (処方) — 処方。draft → active → deprecated。必ず sourceInvariantId を持つ。
```

変換規則（決定論的、AIなし）:
- `causal_chain` → `causal` Invariant
- `hub_convergence` → `structural` Invariant
- `bridge_fact` → `structural` Invariant
- `high_confidence_cluster` → `threshold` Invariant

翻訳テーブル: `structural × ソフトウェアアーキテクチャ` など6種 + generic fallback

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
  DECISIONS.md         設計判断記録 (D001-D005)
  CONSTITUTION.md      設計憲法
  ROADMAP.md           知性獲得ロードマップ
  CTO_PLAYBOOK.md      Sprint完了の定義
  manifesto/           ACTIVE_KNOWLEDGE_MANIFESTO.md
  architecture/        CLEAN_ARCHITECTURE.md
  intelligence/        INTELLIGENCE_ROADMAP.md
  capabilities/        Sprint1.md ... Sprint10.md
```
