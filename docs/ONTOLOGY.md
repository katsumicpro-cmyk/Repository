# Innovation OS — Ontology v1.0

> このドキュメントはInnovation OSが扱うすべての概念を定義する。  
> 実装者は新しい型・クラス・テーブルを作成する前にここを参照すること。

---

## 概念マップ

```
Actor ──── Need
  │
  ▼
Observation
  │
  ▼ (検証・構造化)
Fact ────── Evidence
  │              │
  ▼              ▼
Behavior       Pattern
  │              │
  └──────┬───────┘
         ▼
      Principle
         │
         ▼
       Future
         │
         ▼
       Concept
```

---

## 定義

### Fact

**定義**: 単一の、検証可能な情報の最小単位。  
**特性**:
- 一文で表現できる
- 出典 (Source) を持つ
- 信頼度 (Confidence) を持つ: `low | medium | high | verified`
- 変更不可 (Immutable) — 誤った Fact は削除し、新しい Fact を作る
- ベクトル埋め込み (Embedding) を持てる — Vector DBへの保存を前提とする

**例**: `"GPT-4は2023年3月にOpenAIによってリリースされた。"`

**関連型**: `KnowledgeFact` (packages/knowledge), `Fact` (ValueObject in packages/domain/discovery)

---

### Observation

**定義**: 検証前の生の入力データ。Factになる前の状態。  
**特性**:
- Actorが知覚・収集した未加工の情報
- 信頼度は未確定
- Discoveryフェーズで生成される
- 複数のObservationから1つのFactが導出されることがある

**例**: ウェブ記事のスクレイプ結果、ユーザーメモ、センサーデータ

---

### Evidence

**定義**: PatternまたはPrincipleを支持・否定する Fact。  
**特性**:
- Fact のサブタイプとして扱う（同じデータ構造）
- 文脈 (context) を持つ: どのPatternを支持・否定するか
- 関係型: `SUPPORTS | CONTRADICTS | WEAKLY_SUPPORTS`

**例**: `"企業AがAIに投資を倍増した"` は `"AI投資が加速している"` というPatternを支持する Evidence

---

### Actor

**定義**: 知識を生成・消費・影響を受ける主体。  
**特性**:
- 人間 / 組織 / システム / AIエージェント
- 役割 (Role): `researcher | decision_maker | system | ai_agent`
- Actorが持つ `Need` がDiscoveryを駆動する

**例**: 研究者、企業、Innovation OS 内の Pattern Agent

---

### Need

**定義**: Actorが持つ未充足の要求・問い。  
**特性**:
- Discoveryの出発点
- 「〜を知りたい」「〜を解決したい」の形式で表現
- 充足状態 (fulfilled) を持つ
- Conceptの評価軸になる

**例**: `"AIエージェントが製造業に与える影響を理解したい"`

---

### Behavior

**定義**: Actorまたはシステムに観察される繰り返しの行動パターン。  
**特性**:
- 複数のObservationから帰納的に導出
- 条件 (trigger) と結果 (outcome) を持つ
- Patternの構成要素になる

**例**: `"需要が高まるとき、企業はR&D予算を先行増加させる傾向がある"`

---

### Pattern

**定義**: 複数のFact・Behaviorから抽出された繰り返し構造。  
**特性**:
- 最低3つのFactから帰納される
- 時間的・空間的に繰り返される
- 信頼度 (Confidence) を持つ
- PatternはPrincipleの候補になる

**例**: `"技術の民主化が起きるとき、既存業界のコスト構造が崩壊する"`

---

### Principle

**定義**: Patternから導出された、より抽象度の高い普遍的な真理。  
**特性**:
- 複数Patternから帰納される
- 業界・時代を超えて適用可能
- 「〜は常に〜である」「〜が起きるとき〜が成立する」の形式
- 反証可能 (Falsifiable) — 反証されたPrincipleは `deprecated` になる

**例**: `"情報の非対称性が解消されるとき、仲介者の価値は消滅する"`

---

### Future

**定義**: Principleを適用して生成された未来シナリオ。  
**特性**:
- 時間軸 (TimeHorizon): `near(〜2年) | mid(2〜5年) | far(5年〜)`
- 確信度 (Confidence) を持つ
- 複数のFutureが並列して存在できる（シナリオプランニング）
- Conceptの文脈になる

**例**: `"2026年までに、AIエージェントが中小企業の経理業務の80%を自動化する"`

---

### Concept

**定義**: Futureシナリオを背景に生まれた、具体的な価値提案。  
**特性**:
- 1つ以上のFutureに紐づく
- 価値提案 (ValueProposition) を持つ
- 検証状態 (ValidationStatus): `pending | validated | invalidated | archived`
- Needを充足するかどうかで評価される

**例**: `"AIが経理を代替する時代のCFO向け意思決定支援サービス"`

---

## 知識フロー

```
Observation
    ↓ (Discovery Agent が検証・構造化)
Fact
    ↓ (Knowledge Engine が関係付け)
Pattern  ←── Evidence (Factが証拠として機能)
    ↓ (Principle Agent が抽象化)
Principle
    ↓ (Future Agent がシナリオ投影)
Future
    ↓ (Concept Agent が具体化)
Concept
    ↓ (Validation が Need と照合)
Validated Concept
```

---

## 実装対応表

| 概念 | 実装場所 | 型 |
|---|---|---|
| Fact (生) | `packages/domain/discovery` | `Fact` (ValueObject) |
| Fact (知識化) | `packages/knowledge/fact` | `KnowledgeFact` (Entity) |
| Relation | `packages/knowledge/relation` | `Relation` (Entity) |
| Pattern | `packages/domain/pattern` | `Pattern` (AggregateRoot) |
| Principle | `packages/domain/principle` | `Principle` (AggregateRoot) |
| Future | `packages/domain/future` | `Future` (AggregateRoot) |
| Concept | `packages/domain/concept` | `Concept` (AggregateRoot) |
| KnowledgeGraph | `packages/knowledge/graph` | `KnowledgeGraph` (AggregateRoot) |
