# Review Protocol v1.0

## 目的

コードレビューの基準を統一し、  
どのAIセッション・どの開発者でも同じ品質を担保する。

---

## レビューレベル

| レベル | 対象 | 担当 |
|---|---|---|
| L1 自動チェック | biome lint, TypeScript typecheck | CI |
| L2 構造レビュー | 依存関係, ファイル構成, 命名 | AI / Peer |
| L3 ドメインレビュー | DDD原則, 責務分離, イベント設計 | CTO Playbook準拠確認 |
| L4 セキュリティ | 認証, RLS, シークレット漏洩 | セキュリティチェックリスト |

---

## L1 — 自動チェック (必須)

```bash
pnpm typecheck   # 全パッケージ
pnpm lint        # biome check
pnpm test        # vitest
```

全てがパスしない限りマージしない。

---

## L2 — 構造レビューチェックリスト

- [ ] ファイルが300行以内か
- [ ] `index.ts` がbarrel exportのみか（ロジックがないか）
- [ ] 依存の方向が正しいか (`CLAUDE.md` の依存テーブル参照)
- [ ] `any` 型が使われていないか
- [ ] `throw` がinfrastructure層のみか

---

## L3 — ドメインレビューチェックリスト

**Entity / AggregateRoot**
- [ ] `create()` がResult型を返すか
- [ ] `reconstitute()` がバリデーションをスキップするか
- [ ] Domain EventがAggregateRootから `emit()` されているか
- [ ] IDがPrefixedId型か

**UseCase**
- [ ] 1クラス = 1ユースケースか
- [ ] Port interfaceを経由して外部依存を呼んでいるか
- [ ] `execute()` の返値がResultか

**Repository**
- [ ] interfaceがDomain packageにあるか
- [ ] 実装がinfrastructure packageにあるか

---

## L4 — セキュリティチェックリスト

- [ ] 環境変数がソースコードにハードコードされていないか
- [ ] `.env.local` が `.gitignore` に含まれているか
- [ ] Supabase RLSが有効か (Phase 4以降)
- [ ] Server Actionの入力がバリデーションされているか
- [ ] APIエンドポイントが認証ガードされているか (Phase 4以降)

---

## レビューコメント規約

```
[L1] ビルドエラー: 修正必須
[L2] 構造問題: 修正必須
[L3] ドメイン設計: 修正推奨
[L4] セキュリティ: 修正必須
[NIT] 微細な改善: 任意
[Q] 質問: 回答のみでOK
```
