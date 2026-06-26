# Innovation OS — Project Memory

## Vision

Innovation OS は  
AIによる価値創造デベロップメントシステムである。

世界中の知識を探索し、  
構造化し、  
原理を抽出し、  
未来を構想し、  
価値あるConceptを生み出す。

目的は  
AIと人間が共同で  
Knowledgeを育て続けることである。

---

## Product Principles

- **Knowledge First** — Knowledgeが存在しなければ、Pattern品質は向上しない
- **Evidence before Opinion** — 意見より証拠
- **Pattern before Idea** — アイデアより繰り返されるパターン
- **Principle before Solution** — 解決策より原理
- **Human + AI Co-Creation** — 人間とAIの協調
- **Domain Driven Design** — ドメイン知識を中心に設計する
- **Clean Architecture** — 依存の方向を制御する
- **AI Native** — AIは後付けではなく、最初から設計に組み込む

---

## Current Phase

### Completed

| Package | 内容 |
|---|---|
| `packages/shared` | Result型, Error型, イベントペイロード型, 定数 |
| `packages/foundation` | ids, time, logger, cache, env, config, validation, telemetry |
| `packages/domain/core` | Entity, AggregateRoot, ValueObject, DomainEvent, Repository, Specification |
| `packages/domain/discovery` | ResearchTheme, ResearchRequest, ResearchResult, Fact, FactCollection, Events |
| `packages/application/discovery` | GenerateDiscovery / Save / GetDiscovery UseCases, MockRepository, MockPort |
| `apps/web` Research Workspace | ResearchForm → Server Action → MockResult表示 |

### Pending

| Engine | 説明 |
|---|---|
| Knowledge Engine | Fact → Relation → Cluster → Knowledge Graph |
| Pattern Engine | Discovery群からPatternを抽出 |
| Principle Engine | PatternからPrincipleへ昇華 |
| Future Engine | PrincipleからFutureシナリオ生成 |
| Concept Engine | FutureからConcept具体化 |

---

## Architecture

```
Presentation  (apps/web)
     ↓
Application   (packages/application)
     ↓
Domain        (packages/domain)
     ↓
Knowledge     (packages/knowledge — pending)
     ↓
Infrastructure (packages/infrastructure — pending)
```

### AI Provider

Claude / GPT / Gemini / Local LLM は交換可能である。  
DomainはAIを知らない。  
KnowledgeはProject Assetである。

---

## North Star

Innovation OSは  
検索するAIではない。  
**問いを育てるOSである。**
