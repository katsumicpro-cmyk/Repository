# Memory Protocol v1.0

## 目的

`docs/PROJECT_MEMORY.md` を正確に保ち、  
AIセッション間のコンテキスト継承を確実にする。

---

## Project Memory の構成

```markdown
# Innovation OS — Project Memory

## Vision          ← 変わらない核心
## Product Principles ← 変わらないかわりやすいが慎重に
## Current Phase   ← 毎Sprint更新
## Architecture    ← 構造変化時に更新
## North Star      ← 変えない
```

---

## 更新ルール

### Vision・North Star

- 原則として変更しない
- 変更する場合はチームの明示的な合意が必要
- 変更理由を `docs/DECISIONS.md` に記録する

### Current Phase

- Sprint完了ごとに `Completed` / `Pending` を更新する
- 完了したパッケージを `Completed` テーブルに移動する
- 次のターゲットを `Pending` 先頭に移動する

### Architecture

- パッケージ構成が変わった時のみ更新する
- 依存関係図が実態と乖離していないか毎Sprint確認する

---

## 更新手順

1. `docs/PROJECT_STATE.json` の `current`, `status` を更新する
2. `docs/PROJECT_MEMORY.md` の `Current Phase` テーブルを更新する
3. `docs/CHANGELOG.md` に変更を追記する
4. `docs/NEXT_SESSION.md` を次タスクで書き換える
5. Gitにコミットする

```bash
git add docs/
git commit -m "docs: update project memory for Sprint N"
```

---

## Memory の鮮度チェック

各セッション開始時に以下を確認する:

- `PROJECT_STATE.json` の `lastUpdated` が最新か
- `PROJECT_MEMORY.md` の `Current Phase` が実態と一致しているか
- `NEXT_SESSION.md` が今回のタスクを正しく示しているか

乖離がある場合は、コード実装の前にMemoryを更新する。
