# Prompt Protocol v1.0

## 目的

AIプロンプトをコードと同等に管理し、  
再現性・改善追跡・A/Bテストを可能にする。

---

## ディレクトリ構成

```
packages/ai-core/src/prompts/
├── v1/
│   ├── discovery.prompt.ts
│   ├── pattern.prompt.ts
│   ├── principle.prompt.ts
│   ├── future.prompt.ts
│   └── concept.prompt.ts
├── v2/          ← 改善版 (v1は削除しない)
│   └── discovery.prompt.ts
└── registry.ts  ← { domain, version, prompt } のマッピング
```

---

## プロンプトファイルの構造

```typescript
// packages/ai-core/src/prompts/v1/discovery.prompt.ts

export const DISCOVERY_PROMPT_V1 = {
  version: 'v1',
  domain: 'discovery',
  system: `
## Role
あなたは...

## Context
入力データ:
- theme: リサーチテーマ
- facts: 既存のFact一覧

## Task
...

## Output Format
{
  "facts": [
    { "content": "string", "source": "string", "confidence": "low|medium|high|verified" }
  ]
}

## Constraints
- 事実のみを記述する
- 推測は confidence: "low" で明示する
- 1fact = 1文

## Examples
...
  `,
} as const
```

---

## バージョン管理ルール

1. **既存バージョンを上書きしない**  
   `v1/discovery.prompt.ts` を変更する場合は `v2/` を作成する

2. **registry.ts で有効バージョンを管理する**  
   ```typescript
   // registry.ts
   export const PROMPT_REGISTRY = {
     discovery: DISCOVERY_PROMPT_V2,  // ← ここだけ変更
     pattern: PATTERN_PROMPT_V1,
   } as const
   ```

3. **バージョンアップの条件**  
   - 出力品質が `evaluator/` のスコアで改善を確認できた場合
   - System/Task/Output フォーマットを変更する場合

4. **バージョンダウングレード**  
   `registry.ts` の参照を旧バージョンに戻すだけで即時ロールバック可能

---

## 評価 (Evaluator)

```
packages/ai-core/src/evaluator/
├── discovery-evaluator.ts   ← 出力をスキーマバリデーション + スコアリング
└── scores/
    └── discovery-v1.json    ← バージョンごとのスコア記録
```

- プロンプト変更時は必ず評価を実行する
- スコアが前バージョンを下回った場合はリグレッションとして扱う

---

## Prompt変更のコミット規約

```bash
git commit -m "feat(ai-core): add discovery prompt v2 — improved fact extraction"
```
