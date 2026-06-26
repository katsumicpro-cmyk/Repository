# Innovation Synchronization Protocol (ISP) — Specification v1.0

## 概要

ISP (Innovation Synchronization Protocol) は、  
AIセッション間でプロジェクトの知識・状態・意思決定を継承するためのプロトコルである。

**問題**: LLMはセッションをまたいで記憶を保持しない。  
**解決**: Repositoryに構造化されたKnowledge Assetを配置し、  
セッション開始時に読み込むことでコンテキストを復元する。

---

## プロトコル構成

```
docs/
├── PROJECT_MEMORY.md    — Vision, Principles, 現在フェーズ
├── PROJECT_STATE.json   — 機械読み取り可能な状態スナップショット
├── CHANGELOG.md         — 変更履歴
├── DECISIONS.md         — 設計判断ログ
├── NEXT_SESSION.md      — 次セッションへの引き継ぎ
├── CTO_PLAYBOOK.md      — 設計・開発規約
└── protocols/
    ├── ISP_SPEC.md         (本ファイル)
    ├── REVIEW_PROTOCOL.md
    ├── MEMORY_PROTOCOL.md
    └── PROMPT_PROTOCOL.md
```

---

## セッション開始手順 (AI向け)

1. `docs/PROJECT_MEMORY.md` を読む — Vision・Principlesを把握する
2. `docs/PROJECT_STATE.json` を読む — 現在フェーズを確認する
3. `docs/NEXT_SESSION.md` を読む — 今回のタスクを把握する
4. `CLAUDE.md` を読む — コーディング規約を確認する
5. 作業開始

---

## セッション終了手順 (AI向け)

1. `docs/PROJECT_STATE.json` を更新する
2. `docs/CHANGELOG.md` に変更を追記する
3. `docs/DECISIONS.md` に重要な判断を記録する
4. `docs/NEXT_SESSION.md` を次セッション向けに書き換える
5. `docs/PROJECT_MEMORY.md` を必要に応じて更新する

---

## ISP ファイルの更新タイミング

| ファイル | 更新タイミング |
|---|---|
| `PROJECT_MEMORY.md` | Vision・Principles・フェーズが変わった時 |
| `PROJECT_STATE.json` | Sprint完了・バージョン更新時 |
| `CHANGELOG.md` | 毎セッション終了時 |
| `DECISIONS.md` | 重要な設計判断が生まれた時 |
| `NEXT_SESSION.md` | 毎セッション終了時（必ず更新） |

---

## バージョニング

ISP自体のバージョンは `ISP_SPEC.md` の冒頭に記載する。  
現在: `v1.0`
