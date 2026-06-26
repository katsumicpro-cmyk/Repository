# Sprint 1–2 — Foundation: 基盤を持つ

## Before

何も構築できなかった。
ファイルを作れば動くかもしれないが、
どのファイルが何に依存するかを誰も知らなかった。
型が矛盾しても気づけず、
テストを書いても実行できる場所がなかった。

## Capability

**monorepo が build できる。型が通る。テストが走る。**

packages/shared, foundation, domain, application, knowledge, infrastructure が
一貫したルールのもとで共存し、
依存の方向が強制される。

## Evidence

```bash
pnpm build   # 全パッケージ成功
pnpm test    # 全テスト通過
pnpm lint    # エラーゼロ
```

TypeScript strict mode + exactOptionalPropertyTypes + noUncheckedIndexedAccess が
全パッケージで有効になっている。

`packages/domain` が `@supabase/supabase-js` を import した瞬間に
TypeScript Project References がエラーを出す。

## Limitations

まだ何も「できない」。
「作れる」だけだ。

ビジネスロジックがゼロ。
エンティティがゼロ。
ユーザーが触れるものがゼロ。

## Next Capability

この基盤の上に Domain を置けば、
「テーマを与えると事実が返ってくる」ことができる。
