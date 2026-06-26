# Next Session Plan — Sprint 4: AI Integration

## Sprint 3 Status: ✅ COMPLETE

All Sprint 3 deliverables are done:
- `docs/ONTOLOGY.md` — 10 concepts defined with full knowledge flow mapping
- `packages/knowledge/` — 5 sub-modules (fact, relation, graph, repository, embedding)
- `packages/application/src/knowledge/` — SaveDiscoveryToKnowledgeUseCase + Mock repos
- Discovery→Knowledge bridge wired via Application layer
- Root `tsconfig.json` updated with `packages/knowledge` reference

---

## Sprint 4 Mission: AI Integration

> AIを繋ぐ。Domainは変更しない。Infrastructure層を新設する。

### Implementation Order (Build Order Compliance)
```
Foundation → Infrastructure → Domain(no change) → Application → Presentation
```

### Deliverables

#### 1. `packages/infrastructure/` (new package)
```
src/
  embedding/
    anthropic-embedding-port.ts   # EmbeddingPort impl using voyage-3 or claude embeddings
  research/
    claude-research-port.ts       # ResearchResultPort impl using Claude (Anthropic SDK)
  supabase/
    supabase-knowledge-fact-repository.ts  # KnowledgeFactRepository with pgvector
    supabase-knowledge-graph-repository.ts
```

#### 2. Anthropic SDK integration
- `ResearchResultPort` → Claude structured output (tool_use for fact extraction)
- `EmbeddingPort` → voyage-3 or claude embeddings
- Keep `MockResearchResultPort` as fallback for tests

#### 3. `packages/application/src/knowledge/` additions
- `embed-knowledge-facts.use-case.ts` — batch embed KnowledgeFacts via EmbeddingPort
- `find-similar-facts.use-case.ts` — vector similarity search via KnowledgeFactRepository.findSimilar()

#### 4. Supabase schema (pgvector)
```sql
-- migrations/001_knowledge_facts.sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE knowledge_facts (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  theme TEXT NOT NULL,
  confidence_score FLOAT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON knowledge_facts USING ivfflat (embedding vector_cosine_ops);
```

### Constraints for Sprint 4
- Domain層は一切変更しない（packages/domain, packages/knowledge はreadonlyと見なす）
- Supabase接続はinfrastructure層のみ
- 全てのAI callはPort interfaceを通す（domain never imports Anthropic SDK）
- テストはMock実装で引き続き動作すること

### Completion Criteria
- [ ] `ResearchResultPort` Claude実装 — 実際のFactを生成できる
- [ ] `EmbeddingPort` 実装 — Embeddingを付与できる
- [ ] Supabase + pgvector — KnowledgeFactをベクトル検索できる
- [ ] E2Eフロー: Research → Knowledge → Embed → Similar Search
- [ ] 全既存テストがパスし続ける

---

## ISP Snapshot
- **Date**: 2026-06-27
- **Architect**: Senior Software Architect (AI)
- **Phase**: Sprint 4 Ready
- **Key Decision**: D004 Mock First → upgrade to real AI in infrastructure only
