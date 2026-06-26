# Innovation OS — CLAUDE.md

## Project Overview

Innovation OS is a Knowledge Creation Platform that guides users through:

```
Discovery → Pattern → Principle → Future → Concept
```

Each stage is an independent bounded context (DDD). AI agents drive the transitions; humans review and approve.

---

## Architecture Principles

1. **Clean Architecture** — dependencies flow inward only: `shared → foundation → domain → application → infrastructure → presentation`
2. **Domain Driven Design** — each of the 5 domains is a self-contained bounded context
3. **No exceptions across boundaries** — all domain/application functions return `Result<T, AppError>` (see `packages/shared/src/result/`)
4. **Infrastructure Ignorance** — domain code never imports from `packages/infrastructure`, `@supabase/supabase-js`, or any external SDK
5. **Prompt Versioning** — all AI prompts live in `packages/ai-core/prompts/v{n}/` and must be versioned explicitly

## Package Responsibilities

| Package | May import from | Must NOT import from |
|---|---|---|
| `shared` | nothing | everything |
| `foundation` | `shared` | everything else |
| `domain` | `shared`, `foundation` | `infrastructure`, `ai-core`, `apps/*` |
| `ai-core` | `shared`, `foundation`, `domain`, `knowledge` | `infrastructure`, `apps/*` |
| `knowledge` | `shared`, `domain`, `infrastructure/supabase` | `ai-core`, `apps/*` |
| `workflow` | `shared`, `domain`, `ai-core`, `knowledge` | `infrastructure`, `apps/*` |
| `infrastructure` | `shared`, `foundation`, `domain`, `@supabase/supabase-js` | `apps/*` |
| `apps/web` | all packages | — |

## Coding Conventions

- All IDs are Branded types: `type DiscoveryId = ID<'Discovery'>`
- Entity creation uses static factory methods (`Entity.create()`) returning `Result`
- `Entity.reconstitute()` is used to rehydrate from DB (bypasses validation)
- Value objects extend `ValueObject<T>` from `packages/foundation`
- Aggregate roots extend `AggregateRoot<TId, TProps>` from `packages/foundation`
- Repository interfaces live in the domain package; implementations in `packages/infrastructure`
- No `any` types — `biome check` enforces `noExplicitAny: error`

## Testing Strategy

- Domain entities: pure unit tests (no mocks, no DB)
- Application use cases: unit tests with in-memory repository implementations
- Infrastructure: integration tests against Supabase local dev
- E2E: Playwright against Next.js dev server

## Forbidden Patterns

- No `throw` in domain or application code
- No Supabase SDK imports in `packages/domain`, `packages/foundation`, `packages/shared`
- No `any` types
- No files > 300 lines — split by responsibility
- No business logic in React components or Route Handlers — delegate to use cases

## Build Order

Always implement in this order:
1. `packages/shared` — types, errors, events
2. `packages/foundation` — base classes
3. `packages/domain` — entities, value objects, repository interfaces
4. `packages/ai-core` — agents, prompts
5. `packages/knowledge` — knowledge store
6. `packages/workflow` — pipeline engine
7. `packages/infrastructure` — DB + repository implementations
8. `apps/web` — UI last

## Environment

- Node.js >= 22, pnpm >= 9
- Supabase project required (see `apps/web/.env.local.example`)
- Anthropic API: use `claude-sonnet-4-6` as default model

## Key Files

- `packages/shared/src/result/index.ts` — Result<T,E> type
- `packages/shared/src/errors/index.ts` — Error hierarchy
- `packages/foundation/src/aggregate/index.ts` — AggregateRoot base
- `packages/foundation/src/repository/index.ts` — Repository<T, TId> interface
- `docs/adr/` — Architecture Decision Records
