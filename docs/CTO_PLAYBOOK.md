# Innovation OS — CTO Playbook

> このPlaybookはInnovation OSの設計・開発・レビューにおける  
> 意思決定の拠り所である。  
> コードより先に読む。

---

## Vision

Innovation OS は「問いを育てるOS」である。

検索するAIではない。  
情報を返すツールでもない。

世界中の知識を探索し、パターンを抽出し、  
原理を導き、未来を構想し、価値あるConceptを生み出す。

その全プロセスを  
AIと人間が共同で完走できるシステムを構築する。

> **TODO**
> - [ ] プロダクトとしての成功指標を定義する
> - [ ] ユーザーペルソナを明記する
> - [ ] Innovation OS が解く「問い」の具体例を追加する

---

## Architecture Principles

### 1. 依存の方向は内側へのみ

```
Presentation → Application → Domain → Shared
                    ↓
              Infrastructure (外部依存の実装)
```

外側が内側を知ってよい。内側が外側を知ってはならない。  
`packages/domain` に `@supabase/supabase-js` をimportした時点で設計の失敗である。

### 2. Infrastructure Ignoring Principle

Domain層は永続化・AI・ネットワークを知らない。  
Repository interface はDomainに置き、実装はInfrastructureに置く。  
AI呼び出しは Port interface経由のみ。

### 3. Build Order を守る

```
shared → foundation → domain → application → infrastructure → presentation
```

UIから実装を始めない。Domainから始める。

### 4. パッケージ依存ルール

| パッケージ | 依存してよい | 依存禁止 |
|---|---|---|
| `shared` | なし | すべて |
| `foundation` | `shared` | `domain`以降 |
| `domain` | `shared`, `foundation` | `application`以降 |
| `knowledge` | `shared`, `domain` | `application`, `infrastructure`, `apps/*` |
| `ai-core` | `shared`, `foundation`, `domain`, `knowledge` | `infrastructure`, `apps/*` |
| `application` | `shared`, `foundation`, `domain`, `knowledge` | `infrastructure`, `apps/*` |
| `infrastructure` | `shared`, `foundation`, `domain`, `@supabase/supabase-js` | `apps/*` |
| `apps/web` | すべてのpackages | — |

> **TODO**
> - [ ] `packages/workflow` の依存ルールを追加する
> - [ ] Circular dependency 検出の CI ステップを定義する
> - [ ] モノレポ内のバージョン整合性ポリシーを記載する

---

## Sprint 完了の定義

> この章はすべての Sprint 計画・実行・レビューの基準である。

### 完了条件の定義

Sprint の完了条件は「コードが完成した」ではない。
**「新しい能力が獲得された」** である。

能力として定義されていない Sprint は、完了していない。

### 能力の4条件

Sprint が完了したと言えるのは、以下の4条件をすべて満たすときのみ:

1. **名前がある** — 動詞で表現できる。「記憶できる」「問いを立てる」など。
2. **示せる** — コードを読まずに、動作として見せられる。
3. **境界がある** — そのSprintの前には不可能で、後には可能になっている。
4. **土台になる** — 次の能力が、この能力の上に積み重なる。

### Sprint レビューの問い

Sprint レビューでは、コードではなく能力を問う。

```
❌ 「○○ファイルが作成されました」
✅ 「システムが○○できるようになりました。これが証拠です。」

❌ 「テストが通っています」
✅ 「この入力を与えると、以前は不可能だったこれができます」

❌ 「設計に従って実装しました」
✅ 「この能力は次のSprintの××を可能にします」
```

### 獲得済み能力の記録

能力は `docs/ROADMAP.md` に記録する。
各フェーズは「獲得した能力」と「完了の証明」で定義される。

### 能力の退行

リファクタリングや変更が、獲得済みの能力を壊してはならない。
回帰テストの存在理由はここにある。

```
能力の系譜:
  構築できる → 発見できる → 記憶できる → 想起できる → 問いを立てる → ...
```

前の能力が壊れたとき、後のすべての能力も壊れる。

> **TODO**
> - [ ] 各Sprintの「完了の証明」を自動化するE2Eテストを定義する
> - [ ] 能力の退行を検出するCI checkを追加する

---

## Knowledge First

**KnowledgeはProject Assetである。**

- AIが生成した知識は `packages/knowledge` に永続化される
- Knowledgeなき状態でPatternを生成してはならない
- 各Sprintで生成されたKnowledgeは次Sprintに引き継がれる
- `docs/PROJECT_MEMORY.md` はKnowledgeの要約であり、Gitで管理する

> **TODO**
> - [ ] Knowledge の「鮮度」管理ポリシーを定義する（TTL、再生成条件）
> - [ ] Knowledge Asset の品質スコア基準を決める
> - [ ] Knowledge の可視化方針（Graph UI）を記載する

---

## DDD Rules

### Entity

- IDで同一性を判断する
- 生成は `static create()` のみ。コンストラクタをpublicにしない
- DB復元は `static reconstitute()` で行い、バリデーションをスキップする
- 状態変更メソッドは Result\<T, AppError\> を返す。throwしない

### ValueObject

- プロパティの等値で同一性を判断する
- immutable。setterを持たない
- `static create()` でバリデーションを行い、Result\<VO, AppError\> を返す

### AggregateRoot

- 一貫性境界の責任者である
- 状態変化が起きたらDomain Eventを `emit()` する
- Application層が永続化後に `domainEvents` を回収してPublishする
- 複数のAggregateをまたぐトランザクションは書かない

### Repository

- interfaceはDomain packageに置く
- 実装は `packages/infrastructure` に置く
- 返値は常に `Result<T, AppError>`
- findByXxx の結果がゼロ件の場合は `err(notFound(...))` ではなく `ok([])` を返す

### ID設計

- 全IDは `PrefixedId<P>` 型: `disc_<uuid32>`, `patt_<uuid32>` など
- IDにビジネスロジックを持たせない
- ランダム生成は `generateId()` のみ使用する

> **TODO**
> - [ ] Bounded Context マップを図として追加する
> - [ ] 5ドメイン間のドメインイベントフロー図を追加する
> - [ ] ドメインサービス (DomainService) の使用基準を明記する
> - [ ] Aggregateサイズのガイドライン（何をAggregateに含めるか）を追加する

---

## Prompt Design Rules

### バージョン管理

- Promptは `packages/ai-core/src/prompts/v{N}/` に配置する
- 変更は必ずバージョンを上げる。既存のプロンプトを上書きしない
- `registry.ts` で `{ domain, version, prompt }` を管理する

### 構造

各プロンプトは以下のセクションを持つ:

```
## Role       — AIの役割と制約
## Context    — 渡されるデータの説明
## Task       — 具体的な指示
## Output     — 出力フォーマット (JSON Schema)
## Constraints — 禁止事項
## Examples   — Few-shot examples
```

### 品質基準

- 出力は常にJSONスキーマで定義する
- Few-shot exampleは最低2件
- 禁止事項 (Constraints) を必ず明記する
- プロンプト変更後は `packages/ai-core/src/evaluator/` でスコアを計測する

> **TODO**
> - [ ] 各ドメインのプロンプト初版 (v1) を作成する
> - [ ] Evaluatorのスコアリング基準（precision / recall / format compliance）を定義する
> - [ ] プロンプトのA/Bテスト手順を追加する
> - [ ] Few-shot examples の管理場所とフォーマットを決める

---

## Agent Rules

### Agentの責務分離

| Agent | 責務 |
|---|---|
| `discovery-agent` | Factの収集・構造化 |
| `pattern-agent` | Discovery群からPatternを抽出 |
| `principle-agent` | PatternからPrincipleを導出 |
| `future-agent` | PrincipleからFutureシナリオ生成 |
| `concept-agent` | FutureからConceptを具体化 |

### 原則

- 1 Agent = 1責務
- AgentはDomain Entityを直接生成しない — UseCaseが生成する
- Agent出力は必ずJSON Schemaでバリデーションする (`packages/ai-core/evaluator/`)
- 失敗時は `packages/ai-core/retry/` のRetry戦略に従う
- AgentはStatelessである — StateはWorkflow層が管理する

> **TODO**
> - [ ] 各AgentのInput / Output JSON Schema を定義する
> - [ ] Agent間のメモリ共有ポリシーを定義する（`packages/ai-core/memory/`）
> - [ ] Retry戦略の詳細（最大回数・バックオフ・フォールバック）を記載する
> - [ ] LangGraph移行時のAgent互換性ガイドラインを追加する

---

## Repository Rules

- `packages/` 直下の各パッケージに `package.json`, `tsconfig.json`, `vitest.config.ts` を置く
- `src/` 以下のファイルは300行以内を維持する
- `index.ts` はbarrel exportのみ — ロジックを書かない
- `*.test.ts` はテスト対象と同じディレクトリに置く
- Mock実装は `mock-*.ts` のプレフィックスを付ける
- `any` 型の使用禁止 (`biome: noExplicitAny: error`)
- `throw` はinfrastructure層のみ許可。domain / application層では `Result` を返す

> **TODO**
> - [ ] `packages/foundation/src/{entity,aggregate,...}` の旧DDD deprecated ファイルを削除する
> - [ ] テストカバレッジ目標値（ドメイン層 >80%）を記載する
> - [ ] `pnpm typecheck --build` の Project References 完全対応を確認する
> - [ ] Biome ルールセットのカスタマイズ方針を追加する

---

## Review Rules

### コードレビューチェックリスト

**Domain**
- [ ] Domain EntityがAI / Supabase / Next.jsをimportしていないか
- [ ] `create()` がResult型を返しているか
- [ ] ID型がPrefixedId\<P\>を使用しているか
- [ ] Domain EventがAggregateRootから emit されているか

**Application**
- [ ] UseCaseが単一責務か（1クラス = 1ユースケース）
- [ ] Port interfaceを経由してAI / DBを呼んでいるか
- [ ] `execute()` の返値が `Result<Output, AppError>` か

**Infrastructure**
- [ ] Repository実装がDomain interfaceを完全に実装しているか
- [ ] 外部エラーを `infrastructureError()` に変換しているか

**Presentation**
- [ ] Server ComponentとClient Componentが適切に分離されているか
- [ ] ドメインオブジェクトをClientに渡す前にDTOへ変換しているか
- [ ] Server ActionがResultをunwrapしてDTOを返しているか

> **TODO**
> - [ ] PR テンプレート (`.github/pull_request_template.md`) を作成する
> - [ ] セキュリティレビューチェックリスト (L4) を `protocols/REVIEW_PROTOCOL.md` から統合する
> - [ ] パフォーマンスレビュー基準（N+1クエリ、Vector検索コスト）を追加する

---

## ADR Rules

- 変更が3パッケージ以上に影響する場合はADRを作成する
- ADRファイル名: `docs/adr/NNN-kebab-case-title.md`
- ステータス: `Proposed` → `Accepted` → `Deprecated`
- ADRは削除しない。Deprecatedに変更する
- 軽量な決定は `docs/DECISIONS.md` に記録する

> **TODO**
> - [ ] ADR テンプレートファイル (`docs/adr/TEMPLATE.md`) を作成する
> - [ ] ADR 004: Knowledge Graph 設計方針を作成する
> - [ ] ADR 005: Workflow Engine (LangGraph互換) 設計を作成する

---

## Release Rules

### ブランチ戦略

```
main        — 常にデプロイ可能な状態
feat/*      — 機能開発
fix/*       — バグ修正
docs/*      — ドキュメント
```

### リリース前チェック

- [ ] `pnpm typecheck` が全パッケージで通過する
- [ ] `pnpm test` が全パッケージで通過する
- [ ] `pnpm lint` がエラーゼロである
- [ ] `docs/PROJECT_STATE.json` の `version` が更新されている
- [ ] `docs/CHANGELOG.md` にエントリが追加されている
- [ ] `docs/PROJECT_MEMORY.md` が最新状態を反映している

### Commit規約

```
feat:   新機能
fix:    バグ修正
docs:   ドキュメント
refactor: リファクタリング
test:   テスト追加
chore:  設定・ツール変更
```

> **TODO**
> - [ ] Semantic Release の自動化設定を追加する
> - [ ] Staging / Production 環境へのデプロイ手順を記載する
> - [ ] Feature Flag ポリシーを定義する
> - [ ] `docs/PROJECT_STATE.json` の自動更新 (CI hook) を検討する
