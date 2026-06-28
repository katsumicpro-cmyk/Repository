# Innovation OS v1.0 — Blueprint

> 人間が世界から学び、抽象化し、未来を構想し、新しい価値を創造するまでの
> 知的プロセスを、AIと協調して再現・拡張するオペレーティングシステム。

---

## 1. Vision

```
情報管理システムではない。

知識が自ら矛盾を発見し、
仮説を生成し、
調査を計画し、
世界から証拠を集め、
知識を更新し、
再び新しい問いを生み出す——

Active Knowledge Operating System である。
```

**対比**

| 従来のシステム | Innovation OS |
|--------------|--------------|
| 情報を保管する | 知識が自律的に進化する |
| 聞かれたら答える | 問われる前に問いを生成する |
| 検索エンジン | 知性エンジン |
| 受動的知識 (Passive Knowledge) | 能動的知識 (Active Knowledge) |

---

## 2. Capability Evolution

```
Sprint 1–2   ░░░░░░░░░░░░░░░░░░░░░   存在する・発見する
Sprint 3      ████░░░░░░░░░░░░░░░░░   記憶する
Sprint 4      ████████░░░░░░░░░░░░░   想起する（意味的距離 + グラフ探索）
Sprint 5      ████████████░░░░░░░░░   推論する（矛盾発見・仮説生成・問い生成）
Sprint 6      ████████████████░░░░░   調査する（計画・証拠収集・知識更新）
Sprint 7      ████████████████████░   原則を持つ（Invariant発見・Principle翻訳）
              ─────────────────────── ← 現在地
Sprint 8      判定する（Principleで新発見を解釈）
Sprint 9      予測する（未来シナリオを構想）
Sprint 10     概念を生む・価値を創出する
```

---

## 3. Workspace 構成

```
innovation-os/
├── packages/
│   ├── shared/          # Result<T,E>, AppError, PrefixedId, Clock
│   ├── foundation/      # Entity, ValueObject, AggregateRoot, DomainEvent
│   ├── domain/          # Discovery, Pattern, Principle, Future, Concept
│   ├── knowledge/       # Active Knowledge Domain（中核）
│   ├── application/     # Use Cases, Ports（インターフェース定義）
│   ├── infrastructure/  # AI・DB・外部API の実装
│   └── web/             # Next.js 15 App Router
├── docs/
│   ├── BLUEPRINT.md         ← このファイル
│   ├── manifesto/           Active Knowledge Manifesto
│   ├── architecture/        Clean Architecture 解説
│   ├── intelligence/        知性獲得ロードマップ（Why this order）
│   └── capabilities/        Sprint1.md〜Sprint10.md（能力の記録）
├── PROJECT_MEMORY.md    # セッション間永続記憶
├── PROJECT_STATE.json   # マシン可読な現在状態
└── NEXT_SESSION.md      # 次回開始ガイド
```

---

## 4. Domain 構成（packages/knowledge）

```
knowledge/
├── fact/         KnowledgeFact  confidenceScore(low|medium|high|verified)
│                 Embedding      vector + cosineSimilarity
│                 FactSource     origin traceability
│
├── graph/        KnowledgeGraph  nodes + typed directed edges
│                 KnowledgeEdge   SUPPORTS / CAUSES / CONTRADICTS / RELATED_TO ...
│                                 LangGraph-compatible
│
├── recall/       RecallQuery     queryText + queryEmbedding + topK
│                 RecalledFact    activationScore = (relevance × confidence) + graphBonus(+0.2)
│                 KnowledgeActivation  hasUnexpectedConnections()
│
├── reasoning/    ContradictionEngine   3戦略（explicit_edge / confidence_divergence / semantic）
│                 PatternExtractor      4戦略（hub / cluster / causal_chain / bridge）
│                 HypothesisGenerator   矛盾・パターン・グラフから仮説生成
│                 EvidenceRequest       deterministic question generation（AIなし）
│
├── research/     ResearchQuestion  questionType + searchTerms + priority
│                 ResearchPlan      lifecycle: planned→in_progress→completed
│                 EvidenceEvaluator [interface] Statistical / Scientific / Business / Design
│                 ResearchTrace     Question→Planner→Search→Evidence→Evaluation→Decision→NewQuestions
│
├── learning/     LearningCycle  trigger → hypotheses → evidence → changes → newQuestions
│                                isActivelyLearning() が自律学習の証明
│
└── principle/    ExtractedPattern  → PatternToInvariantExtractor
                  Invariant          candidate→validated/refuted/superseded  stabilityScore
                  → InvariantToPrincipleTranslator × domain
                  Principle          draft→active→deprecated  sourceInvariantId必須
```

---

## 5. Knowledge Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Knowledge Flow                             │
│                                                                 │
│  [World]                                                        │
│    │                                                            │
│    ▼ KnowledgeSourcePort.acquire()                              │
│  KnowledgeFact ──────────────────────► KnowledgeGraph           │
│    │                                        │                   │
│    │                            PatternExtractor                │
│    │                                        │                   │
│    │                            ExtractedPattern（現象）         │
│    │                                        │                   │
│    │                    PatternToInvariantExtractor             │
│    │                                        │                   │
│    │                            Invariant（本質）                │
│    │                            candidate → validated           │
│    │                                        │                   │
│    │                    InvariantToPrincipleTranslator×domain   │
│    │                                        │                   │
│    │                            Principle（処方）                │
│    │                            draft → active                  │
│    │                                        │                   │
│    │                    [Sprint 8] PrincipleJudge               │
│    └──────────────────────────────────────► Judgment            │
│                                   reinforces/contradicts/       │
│                                   extends/novel                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. AI Agent Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Agent Flow                               │
│                                                                 │
│  Human: "AIエージェントについて調査して"                           │
│    │                                                            │
│    ▼                                                            │
│  RunLearningCycleUseCase                                        │
│    │                                                            │
│    ├─①─ InitiateReasoningCycle                                  │
│    │      ContradictionEngine → Contradiction[]                 │
│    │      PatternExtractor    → ExtractedPattern[]              │
│    │      HypothesisGenerator → Hypothesis[]                    │
│    │      EvidenceRequest自動生成（AIなし・決定論的）             │
│    │                                                            │
│    ├─②─ SourcePlanner.selectSources(questionType)               │
│    │      knowledge_base / web / academic / github ...          │
│    │                                                            │
│    ├─③─ KnowledgeSourcePort.acquire() × N sources              │
│    │      → KnowledgeFact[] 収集                                │
│    │                                                            │
│    ├─④─ EvidenceEvaluator.evaluate()  [pluggable]               │
│    │      Statistical / Scientific / Business / Design          │
│    │      → verdict: supported / refuted / inconclusive         │
│    │                                                            │
│    ├─⑤─ Knowledge Integration                                   │
│    │      KnowledgeFact保存 / Hypothesis更新 / Graph拡張         │
│    │                                                            │
│    ├─⑥─ Re-Reason（更新後の知識で再推論）                        │
│    │      → newQuestionsGenerated（次サイクルの入力）            │
│    │                                                            │
│    └─⑦─ LearningCycle.complete()                               │
│           記録: trigger/hypotheses/evidence/changes/newQuestions│
│                                                                 │
│  cycle.isActivelyLearning() === true  ← 自律学習の証明          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Repository 構成

```
packages/knowledge/src/
├── principle/
│   ├── invariant.ts                  Invariant Entity
│   ├── principle.ts                  Principle Entity
│   ├── pattern-to-invariant.ts       PatternToInvariantExtractor
│   └── invariant-to-principle.ts     InvariantToPrincipleTranslator
│
packages/application/src/
├── discovery/                        Discovery生成・保存
├── knowledge/                        Embed・Recall・Save
├── reasoning/                        InitiateReasoningCycle
├── research/                         ConductResearch・Decompose
│   ├── knowledge-source-port.ts      KnowledgeSourcePort interface
│   └── mock-knowledge-source-port.ts Mock（knowledge_base内検索）
├── learning/                         RunLearningCycle・SourcePlanner
└── principle/                        ExtractInvariants・DerivePrinciples

packages/infrastructure/src/
└── embedding/http-embedding-port.ts  OpenAI-compatible embedding
```

**Entity ID prefix 一覧**

| Entity | Prefix | 例 |
|--------|--------|----|
| KnowledgeFact | `kfct_` | `kfct_a1b2c3...` |
| KnowledgeGraph | `kgrph_` | `kgrph_...` |
| Hypothesis | `hypo_` | `hypo_...` |
| EvidenceRequest | `evreq_` | `evreq_...` |
| ResearchPlan | `rplan_` | `rplan_...` |
| LearningCycle | `lcyc_` | `lcyc_...` |
| Invariant | `invt_` | `invt_...` |
| Principle | `prpl_` | `prpl_...` |

---

## 8. Architecture Layers

```
┌───────────────────────────────────────────────┐
│  Presentation  (packages/web)                 │
│  Next.js 15 App Router                        │
│  Server Components + Server Actions           │
└───────────────────┬───────────────────────────┘
                    │ calls
┌───────────────────▼───────────────────────────┐
│  Application  (packages/application)          │
│  Use Cases / Ports (interface) / Mocks        │
│  RunLearningCycle / ConductResearch ...       │
└───────────────────┬───────────────────────────┘
                    │ uses
┌───────────────────▼───────────────────────────┐
│  Domain  (packages/knowledge + domain)        │
│  Entity / ValueObject / DomainEvent           │
│  KnowledgeFact / Invariant / Principle ...    │
│  ← AIを知らない。DBを知らない。純粋なロジック    │
└───────────────────┬───────────────────────────┘
                    │ built on
┌───────────────────▼───────────────────────────┐
│  Foundation  (packages/foundation + shared)   │
│  Result<T,E> / PrefixedId / Clock             │
│  Entity / ValueObject / AggregateRoot         │
└───────────────────┬───────────────────────────┘
                    │ implemented by
┌───────────────────▼───────────────────────────┐
│  Infrastructure  (packages/infrastructure)    │
│  HttpEmbeddingPort (OpenAI-compatible)        │
│  [future] SupabaseRepository                  │
│  [future] WebKnowledgeSourcePort              │
└───────────────────────────────────────────────┘

依存の方向: 上→下のみ。下は上を知らない。
```

**不変ルール**

```
Domain は Infrastructure を import しない
Domain は AI を呼ばない
Domain は例外を投げない（Result<T,E>）
すべての mutation は新インスタンスを返す（Immutable）
```

---

## 9. 10 Sprint 知性獲得ロードマップ

```
Level 0   Sprint 1–2  [ Infrastructure + Discovery ]
          ・monorepo / TypeScript strict / Vitest / Biome
          ・Discovery Entity → KnowledgeFact 変換
          ・証明: ビルドが通る。型が通る。テストが走る。

Level 1   Sprint 3    [ Memory ]
          ・KnowledgeGraph（nodes + typed edges）
          ・KnowledgeFact（content / confidence / source / tags）
          ・証明: Discovery → KnowledgeGraph への変換が一貫している

Level 2   Sprint 4    [ Recall ]
          ・Embedding ValueObject（vector + cosineSimilarity）
          ・activationScore = (relevance × confidence) + graphBonus
          ・証明: 情報検索ではなく「知識想起」。グラフ探索で予期せぬ接続を発見

Level 3   Sprint 5    [ Reasoning ]
          ・ContradictionEngine / PatternExtractor / HypothesisGenerator
          ・EvidenceRequest 自動生成（AIなし・決定論的）
          ・証明: generatedQuestionsCount > 0。人間が問う前に問いが生まれる

Level 4   Sprint 6    [ Research ]
          ・ResearchPlan + ConductResearchUseCase
          ・EvidenceEvaluator（pluggable epistemology）
          ・ResearchTrace（完全監査証跡）
          ・証明: Sprint5 が生成した問いを Sprint6 が自律的に解決する

Level 5   Sprint 7    [ Principle ]                          ← 現在地
          ・PatternToInvariantExtractor（決定論的変換）
          ・Invariant（candidate→validated / stabilityScore）
          ・InvariantToPrincipleTranslator（domain-parameterized）
          ・証明: Pattern/Invariant/Principle の責務が型レベルで分離されている

Level 6   Sprint 8    [ Judgment ]                           ← 次回
          ・PrincipleJudge: Discovery × active Principle → Judgment
          ・verdict: reinforces / contradicts / extends / novel
          ・証明: 新しい Discovery を投入するとシステムが自律的に判定を返す

Level 7   Sprint 9    [ Prediction ]
          ・supported Hypothesis + Principle → FutureScenario
          ・確率・タイムライン・前提条件付きシナリオ生成
          ・証明: 「もし X が成立するなら、3年後に Y が起きる」を生成できる

Level 8   Sprint 10   [ Innovation ]
          ・FutureScenario × Constraint → Concept Entity
          ・LearningCycle 全パイプライン自律実行
          ・証明: 人間が「テーマ」を入力するだけで Concept まで到達する
```

---

## 10. 今後 5 年間の発展イメージ

```
2026  v1.0  Knowledge Engine（現在）
│           Sprint 1–7 完了。Invariant発見・Principle合成まで。
│           Mock実装。AIなし。In-memory。
│
2026  v1.5  Judgment Engine
│           Sprint 8–10 完了。Discovery → Concept の全パイプライン。
│           Active Learning Loop の自律実行。
│
2027  v2.0  Connected Intelligence
│           KnowledgeSourcePort: Web / PDF / Academic / GitHub / Slack / Notion
│           EmbeddingPort: Claude API 統合（Semantic Recall の精度向上）
│           Supabase永続化（KnowledgeFact / Graph / Principle）
│           ResearchTrace の永続化（Explainability Layer 完成）
│
2028  v3.0  Collaborative Intelligence
│           複数ユーザーによる KnowledgeGraph 共同構築
│           Principle の合意形成（誰がこの Principle を支持するか）
│           Team Learning Cycle（組織単位の学習ログ）
│           Contradiction Alert（新発見が既存 Principle と矛盾したとき通知）
│
2029  v4.0  Domain Intelligence
│           業界・組織固有の Invariant ライブラリ
│           Principle の継承（親 Principle → 子 Principle）
│           Inter-domain transfer（ソフトウェアの Invariant → 組織設計へ）
│           AI-assisted Challenge（Claude が Invariant を能動的に検証）
│
2030  v5.0  Creative Intelligence
│           Concept から Product / Service / Organization の設計まで
│           Innovation Loop: 世界観察 → 原則発見 → 未来構想 → 概念生成 → 価値創出
│           人間とAIが対等なパートナーとして知識を共進化させる基盤
```

---

## Governing Principles（変えてはならない 5 つ）

| # | 原則 | 理由 |
|---|------|------|
| D001 | Result<T,E> over exceptions | ドメイン境界を越える失敗は型で表現する |
| D002 | Immutable domain objects | 過去の状態が常に復元可能であること |
| D003 | Port abstraction for all I/O | AI・DBの実装が変わってもDomainは変わらない |
| D004 | PrefixedId for all entities | どのIDが何のEntityかを一目で分かる |
| D005 | Capability over code | Sprintは「能力の獲得」で終わる。コードの完成ではない |

---

*Innovation OS v1.0 — Sprint 7 Complete*
*Repository: https://github.com/katsumicpro-cmyk/Repository*
