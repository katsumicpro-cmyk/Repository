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

---

## Knowledge First

**KnowledgeはProject Assetである。**

- AIが生成した知識は `packages/knowledge` に永続化される
- Knowledgeなき状態でPatternを生成してはならない
- 各Sprintで生成されたKnowledgeは次Sprintに引き継がれる
- `docs/PROJECT_MEMORY.md` はKnowledgeの要約であり、Gitで管理する

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

---

## Repository Rules

- `packages/` 直下の各パッケージに `package.json`, `tsconfig.json`, `vitest.config.ts` を置く
- `src/` 以下のファイルは300行以内を維持する
- `index.ts` はbarrel exportのみ — ロジックを書かない
- `*.test.ts` はテスト対象と同じディレクトリに置く
- Mock実装は `mock-*.ts` のプレフィックスを付ける
- `any` 型の使用禁止 (`biome: noExplicitAny: error`)
- `throw` はinfrastructure層のみ許可。domain / application層では `Result` を返す

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

---

## ADR Rules

- 変更が3パッケージ以上に影響する場合はADRを作成する
- ADRファイル名: `docs/adr/NNN-kebab-case-title.md`
- ステータス: `Proposed` → `Accepted` → `Deprecated`
- ADRは削除しない。Deprecatedに変更する
- 軽量な決定は `docs/DECISIONS.md` に記録する

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
