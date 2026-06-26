# Clean Architecture — Innovation OS

## Dependency Rule

```
Presentation → Application → Domain → Shared
                              ↑
                         Foundation
                              ↑
                         Infrastructure (implements Domain ports)
```

Dependencies point inward. The Domain layer knows nothing about Next.js, Supabase, OpenAI, or the file system.

---

## Package Topology

```
packages/
  shared/         Result<T,E>, AppError, PrefixedId, Clock
                  No domain concepts. No framework dependencies.

  foundation/     DDD building blocks: Entity, ValueObject, AggregateRoot
                  Repository, Specification, DomainEvent
                  Only depends on shared/.

  domain/         Domain primitives: KnowledgeFact, KnowledgeGraph, Hypothesis, ...
                  Business logic. No I/O. No AI. No database.
                  Depends on: foundation/, shared/.

  knowledge/      Domain aggregates for the Knowledge subdomain.
                  Submodules: fact/, graph/, recall/, reasoning/, research/
                  Ports defined here (EmbeddingPort).
                  Depends on: foundation/, shared/.

  application/    Use cases. Orchestrates domain objects + ports.
                  Ports defined here (KnowledgeSourcePort).
                  Depends on: knowledge/, domain/, foundation/, shared/.

  infrastructure/ Implements ports: HttpEmbeddingPort.
                  Depends on: application/, knowledge/, shared/.

  web/            Next.js 15 App Router. Server Components + Server Actions.
                  Depends on: application/.
```

---

## Port Pattern

The Domain layer defines what it needs as an interface (Port).
Infrastructure implements it. Application wires them at runtime.

```typescript
// Defined in packages/knowledge/src/embedding/embedding-port.ts
export interface EmbeddingPort {
  embed(text: string): Promise<Result<Embedding, AppError>>
}

// Implemented in packages/infrastructure/src/embedding/http-embedding-port.ts
export class HttpEmbeddingPort implements EmbeddingPort { ... }
```

Current ports:

| Port | Defined In | Mock | Production |
|------|------------|------|------------|
| `EmbeddingPort` | packages/knowledge | — | `HttpEmbeddingPort` |
| `KnowledgeSourcePort` | packages/application | `MockKnowledgeSourcePort` | WebKnowledgeSourcePort (future) |

---

## Key Design Decisions

### D001 — Result<T,E> over exceptions
All cross-boundary operations return `Result<T,E>`. Never throw across domain boundaries.

### D002 — Immutable domain objects
All mutations return new instances. Entity state changes via named methods (`markSupported()`, `answer()`, `complete()`).

### D003 — Port abstraction for all external I/O
AI providers, databases, search APIs — all behind interfaces. Domain never imports from infrastructure.

### D004 — PrefixedId for all entities
`kfct_<uuid32>`, `kgrph_<uuid32>`, `hypo_<uuid32>` — human-readable, type-safe, collision-resistant.

### D005 — Sprint completion = capability acquisition
A sprint is complete when a new capability exists and can be demonstrated. Code completion is a necessary but insufficient condition.

---

## Build Order Constraint

```
Foundation → Infrastructure → Domain → Application → Presentation
```

Never start from UI. Never start from infrastructure. Always start from what needs to be understood (domain).

---

## What the Domain Does Not Know

- That Next.js exists
- That Supabase exists
- That OpenAI exists
- That HTTP exists
- That the file system exists
- That there is a UI

The domain knows:
- What a KnowledgeFact is
- How to detect contradictions
- How to generate hypotheses
- How to build a ResearchPlan
- How to evaluate evidence
- How to update its own knowledge
