# Innovation OS v1.1 — Blueprint

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

Innovation OS は Human を置き換えない。

**Human Intelligence Amplifier** である。

人間が観察し、Innovation OS が構造化する。
Innovation OS が仮説を生成し、人間が判断する。
人間が世界に働きかけ、その結果が知識として戻ってくる。
このループが「知の共進化」である。

| 従来のシステム | Innovation OS |
|--------------|--------------|
| 情報を保管する | 知識が自律的に進化する |
| 聞かれたら答える | 問われる前に問いを生成する |
| 検索エンジン | 知性エンジン |
| 受動的知識 (Passive Knowledge) | 能動的知識 (Active Knowledge) |
| ツール（Human が使う） | パートナー（Human と共に学ぶ） |

---

## 2. Capability Evolution

```
                                                           現在地
                                                             ↓
  Observe    ██████████████████████████████████████████████  Sprint 1–2
  Remember   ████████████████████████████████████████        Sprint 3
  Reason     ████████████████████████████████                Sprint 4–5
  Learn      ████████████████████████                        Sprint 6
  Generalize ████████████████                                Sprint 7  ←
  Judge      □□□□□□□□□□□□                                    Sprint 8
  Predict    □□□□□□□□                                        Sprint 9
  Create     □□□□□□                                          Sprint 10
  Reflect    □□□□                                            Sprint 11

  ██ = 獲得済み    □ = 未獲得
```

**Reflect の定義**

Reflect は単なる「振り返り」ではない。

蓄積した Invariant・Theory・Principle を、
将来の Evidence によって見直し、
知識体系そのものを改善する能力である。

```
過去の Principle が現在の Evidence によって覆された場合、
  → Principle を deprecated に
  → 元の Invariant を再検証キューへ
  → Theory（なぜそう考えたか）を保存したまま次の知識構築に活かす

Reflect は「忘れる能力」ではなく
「正しく更新する能力」である。
```

---

## 3. Human Learning Loop

Innovation OS の真の価値は、Human との循環にある。
知識はシステムの内部で完結しない。

```
┌─────────────────────────────────────────────────────────────────┐
│                   Human ⇄ Innovation OS ⇄ World                │
│                                                                 │
│   ┌─────────┐                                                   │
│   │  Human  │                                                   │
│   └────┬────┘                                                   │
│        │ 1. Observe（世界を観察する）                             │
│        ▼                                                        │
│   ┌──────────────────┐                                          │
│   │  Innovation OS   │                                          │
│   │                  │                                          │
│   │  2. Remember     │ KnowledgeFact → KnowledgeGraph          │
│   │  3. Reason       │ 矛盾発見・仮説生成・問い生成              │
│   │  4. Learn        │ 証拠収集・知識更新                        │
│   │  5. Generalize   │ Pattern→Invariant→Theory→Principle      │
│   │  6. Judge        │ 新発見 × Principle → Judgment            │
│   │  7. Predict      │ FutureScenario 生成                      │
│   └────────┬─────────┘                                          │
│            │ 8. Concept（構想を提示する）                         │
│            ▼                                                    │
│   ┌─────────┐                                                   │
│   │  Human  │ 9. 判断・選択・意味付け                            │
│   └────┬────┘                                                   │
│        │ 10. Experiment（世界に働きかける）                       │
│        ▼                                                        │
│   ┌─────────┐                                                   │
│   │  World  │ 11. 結果が生まれる                                 │
│   └────┬────┘                                                   │
│        │ 12. Knowledge として観測される                          │
│        ▼                                                        │
│   ┌──────────────────┐                                          │
│   │  Innovation OS   │ 13. Reflect（知識体系を見直す）           │
│   └──────────────────┘                                          │
│        │                                                        │
│        └────────────────────────────────► Human へ戻る          │
│                                                                 │
│   このループが「知の共進化」である。                               │
│   Innovation OS は Human の思考を拡張するが、                    │
│   Human の判断を代替しない。                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Workspace 構成

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
│   └── capabilities/        Sprint1.md〜Sprint11.md（能力の記録）
├── PROJECT_MEMORY.md    # セッション間永続記憶
├── PROJECT_STATE.json   # マシン可読な現在状態
└── NEXT_SESSION.md      # 次回開始ガイド
```

---

## 5. Domain 構成（packages/knowledge）

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
└── principle/    ExtractedPattern（現象）
                    ↓ PatternToInvariantExtractor
                  Invariant（本質）    candidate→validated/refuted/superseded
                    ↓ InvariantToTheoryBuilder          ← [設計済・未実装]
                  Theory（説明）       なぜそうなるのかの因果モデル
                    ↓ TheoryToPrincipleTranslator        ← [設計済・未実装]
                  Principle（処方）    draft→active→deprecated  sourceInvariantId必須
```

---

## 6. Knowledge Flow

Theory Layer を含む完全な抽象化パイプライン。

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
│    │                      ExtractedPattern（現象）               │
│    │                      「このグラフで何が繰り返し現れるか」     │
│    │                                        │                   │
│    │                    PatternToInvariantExtractor             │
│    │                                        │                   │
│    │                         Invariant（本質）                   │
│    │                         「世界が変わっても成立するか」        │
│    │                         candidate → validated              │
│    │                         stabilityScore: 0.0〜1.0           │
│    │                                        │                   │
│    │                    InvariantToTheoryBuilder                │
│    │                                        │                   │
│    │                           Theory（説明）                    │
│    │                           「なぜそうなるのか」               │
│    │                           ← Explainability の中心          │
│    │                                        │                   │
│    │                    TheoryToPrincipleTranslator × domain    │
│    │                                        │                   │
│    │                         Principle（処方）                   │
│    │                         「このドメインでどう使うか」          │
│    │                         draft → active                     │
│    │                                        │                   │
│    │                    [Sprint 8] PrincipleJudge               │
│    └──────────────────────────────────────► Judgment            │
│                                   reinforces / contradicts /    │
│                                   extends / novel               │
│                                             │                   │
│                              [Sprint 11] ReflectionEngine       │
│                                   Principle見直し・Invariant再検証│
└─────────────────────────────────────────────────────────────────┘
```

**4層の責務**

| 層 | 問い | 例 |
|---|------|---|
| Pattern | 何が見えるか | 「A→B という因果が3回観測された」 |
| Invariant | 何が変わらないか | 「複雑なシステムは単一障害点を持つ」 |
| Theory | なぜそうなるか | 「依存が集中すると除去コストが指数増大するため」 |
| Principle | どう使うか | 「共有DBを排除し、各サービスに独自DBを持たせる」 |

---

## 7. AI Agent Flow

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

## 8. Repository 構成

```
packages/knowledge/src/
├── principle/
│   ├── invariant.ts                  Invariant Entity
│   ├── theory.ts                     Theory Entity         [設計済・未実装]
│   ├── principle.ts                  Principle Entity
│   ├── pattern-to-invariant.ts       PatternToInvariantExtractor
│   ├── invariant-to-theory.ts        InvariantToTheoryBuilder  [設計済・未実装]
│   └── theory-to-principle.ts        TheoryToPrincipleTranslator [設計済・未実装]
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

| Entity | Prefix | Status |
|--------|--------|--------|
| KnowledgeFact | `kfct_` | ✅ 実装済 |
| KnowledgeGraph | `kgrph_` | ✅ 実装済 |
| Hypothesis | `hypo_` | ✅ 実装済 |
| EvidenceRequest | `evreq_` | ✅ 実装済 |
| ResearchPlan | `rplan_` | ✅ 実装済 |
| LearningCycle | `lcyc_` | ✅ 実装済 |
| Invariant | `invt_` | ✅ 実装済 |
| Theory | `thry_` | 🔜 Sprint 8+ |
| Principle | `prpl_` | ✅ 実装済 |

---

## 9. Architecture Layers

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
│  KnowledgeFact / Invariant / Theory /         │
│  Principle ...                                │
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

## 10. 知性獲得ロードマップ（11 Sprint）

```
Level 0   Sprint 1–2  [ Observe ]
          ・monorepo / TypeScript strict / Vitest / Biome
          ・Discovery Entity → KnowledgeFact 変換
          ・証明: ビルドが通る。型が通る。テストが走る。

Level 1   Sprint 3    [ Remember ]
          ・KnowledgeGraph（nodes + typed edges）
          ・KnowledgeFact（content / confidence / source / tags）
          ・証明: Discovery → KnowledgeGraph への変換が一貫している

Level 2   Sprint 4    [ Recall ]
          ・Embedding ValueObject（vector + cosineSimilarity）
          ・activationScore = (relevance × confidence) + graphBonus
          ・証明: 情報検索ではなく「知識想起」。グラフ探索で予期せぬ接続を発見

Level 3   Sprint 5    [ Reason ]
          ・ContradictionEngine / PatternExtractor / HypothesisGenerator
          ・EvidenceRequest 自動生成（AIなし・決定論的）
          ・証明: generatedQuestionsCount > 0。人間が問う前に問いが生まれる

Level 4   Sprint 6    [ Learn ]
          ・ResearchPlan + ConductResearchUseCase
          ・EvidenceEvaluator（pluggable epistemology）
          ・ResearchTrace（完全監査証跡）
          ・証明: Sprint5 が生成した問いを Sprint6 が自律的に解決する

Level 5   Sprint 7    [ Generalize ]                        ← 現在地
          ・PatternToInvariantExtractor（決定論的変換）
          ・Invariant（candidate→validated / stabilityScore）
          ・InvariantToPrincipleTranslator（domain-parameterized）
          ・証明: Pattern/Invariant/Principle の責務が型レベルで分離されている

Level 6   Sprint 8    [ Judge ]                             ← 次回
          ・Theory Layer 導入（Invariant→Theory→Principle）
          ・PrincipleJudge: Discovery × active Principle → Judgment
          ・verdict: reinforces / contradicts / extends / novel
          ・証明: 新しい Discovery を投入するとシステムが自律的に判定を返す

Level 7   Sprint 9    [ Predict ]
          ・supported Hypothesis + Principle → FutureScenario
          ・確率・タイムライン・前提条件付きシナリオ生成
          ・証明: 「もし X が成立するなら、3年後に Y が起きる」を生成できる

Level 8   Sprint 10   [ Create ]
          ・FutureScenario × Constraint → Concept Entity
          ・LearningCycle 全パイプライン自律実行
          ・Innovation は Outcome（結果）であり Capability（能力）ではない
          ・証明: 人間が「テーマ」を入力するだけで Concept まで到達する

Level 9   Sprint 11   [ Reflect ]
          ・ReflectionEngine: 過去の Principle を現在の Evidence で見直す
          ・Invariant の再検証キュー（Challenge の自動トリガー）
          ・Theory の保存（なぜそう考えたかを記録して次の学習に活かす）
          ・証明: 誤った Principle が自律的に deprecated になる
                  知識体系が自己修正できる
```

---

## 11. 今後 5 年間の発展イメージ

```
2026  v1.0  Knowledge Engine（現在）
│           Sprint 1–7 完了。Generalize まで。
│           Mock実装。AIなし。In-memory。
│
2026  v1.5  Judgment + Creation Engine
│           Sprint 8–10 完了。Judge・Predict・Create の全パイプライン。
│           Active Learning Loop の自律実行。
│           Theory Layer 導入（Explainability 基盤完成）。
│
2027  v2.0  Connected + Reflective Intelligence
│           Sprint 11 完了。Reflect（知識体系の自己修正）。
│           KnowledgeSourcePort: Web / PDF / Academic / GitHub / Slack / Notion
│           EmbeddingPort: Claude API 統合
│           Supabase永続化（KnowledgeFact / Graph / Theory / Principle）
│
2028  v3.0  Collaborative Intelligence
│           複数ユーザーによる KnowledgeGraph 共同構築
│           Theory の合意形成（なぜそうなるかを組織で共有）
│           Team Learning Cycle（組織単位の学習ログ）
│           Contradiction Alert（新発見が既存 Principle と矛盾したとき通知）
│
2029  v4.0  Domain Intelligence
│           業界・組織固有の Invariant・Theory ライブラリ
│           Principle の継承（親 Principle → 子 Principle）
│           Inter-domain transfer（ソフトウェアの Invariant → 組織設計へ）
│           AI-assisted Challenge（Claude が Invariant を能動的に検証）
│
2030  v5.0  Amplified Intelligence
│           Human ⇄ Innovation OS ⇄ World の完全な学習ループ
│           Concept から Product / Service / Organization の設計まで
│           Reflect が常時稼働し、知識体系が自己最適化し続ける
│           人間の判断とAIの知識構造が対等に共進化するプラットフォーム
```

---

## 12. Capability Map（Sprint 別進捗）

現時点（Sprint 7 完了）の能力分布。Sprint が進むたびに更新する。

```
  Capability     現在の実装深度                          Sprint
  ─────────────────────────────────────────────────────────────
  Observe        ██████████████████████████████████████  1–2
  Remember       ████████████████████████████████        3
  Reason         █████████████████████████               4–5
  Learn          ████████████████████                    6
  Generalize     ████████████████                        7   ←
  ─────────────────────────────────────────────────────────────
  Judge          □□□□□□□□□□□□□□□□                        8
  Predict        □□□□□□□□□□□□                            9
  Create         □□□□□□□□                                10
  Reflect        □□□□□□                                  11
  ─────────────────────────────────────────────────────────────
  ██ = 獲得済み    □ = 未獲得

  凡例:
  Observe    = 世界から事実を取得する
  Remember   = 事実をグラフとして構造化する
  Reason     = 矛盾・パターン・仮説を見つける
  Learn      = 調査を計画・実行し知識を更新する
  Generalize = Pattern→Invariant→Principle へ抽象化する
  Judge      = Principle で新発見を解釈・判定する
  Predict    = 原則と仮説から未来シナリオを生成する
  Create     = シナリオと制約から概念を構想する
  Reflect    = 知識体系そのものを見直し・改善する
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

*Innovation OS v1.1 — Sprint 7 Complete*
*Repository: https://github.com/katsumicpro-cmyk/Repository*
