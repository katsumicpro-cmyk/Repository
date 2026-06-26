# Next Session — Sprint 3

## Goal: Knowledge Engine

### Flow

```
Fact
 ↓
Relation
 ↓
Cluster
 ↓
Knowledge Graph
```

**AIはまだ呼ばない。**  
`packages/knowledge` の Domain層だけを完成させる。

---

## 実装対象

### packages/knowledge/src/

```
facts/
  fact-store.ts          Factの永続化インターフェース
  fact-query.ts          検索クエリ型

relations/
  relation.ts            Fact間の有向関係 (Entity)
  relation-type.ts       IS_A / CAUSES / SUPPORTS / CONTRADICTS / RELATED_TO
  relation-store.ts      Relationストアインターフェース

clusters/
  cluster.ts             Factのグループ (ValueObject)
  cluster-builder.ts     閾値ベースのクラスタリングロジック

graph/
  knowledge-graph.ts     AggregateRoot — ノード+エッジの整合境界
  graph-query.ts         グラフ探索クエリ

embeddings/
  embedding.ts           Vectorの型定義
  embedding-port.ts      埋め込み生成インターフェース (AI接続口)
  mock-embedding-port.ts テスト用ゼロベクトル実装
```

### packages/application/knowledge/src/

```
build-knowledge-graph.use-case.ts
query-knowledge-graph.use-case.ts
add-fact-to-graph.use-case.ts
```

---

## 完了条件

- [ ] `packages/knowledge` が `pnpm typecheck` を通過する
- [ ] KnowledgeGraph の単体テストが通過する
- [ ] `packages/application/knowledge` の UseCaseテストが通過する
- [ ] `packages/knowledge` が `packages/domain/discovery` に依存しない（依存は `packages/shared` のみ）

---

## 注意事項

- Supabase Vector (pgvector) への接続は Sprint 4 以降
- Embedding は `MockEmbeddingPort` (ゼロベクトル) で代替
- `packages/knowledge` は `packages/domain` に依存してよい
- `packages/knowledge` は `packages/ai-core` に依存しない
