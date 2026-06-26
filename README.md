# Innovation OS

**Knowledge Creation Operating System**

Reproduces the knowledge creation process:

```
Discovery → Pattern → Principle → Future → Concept
```

Each stage is driven by AI agents, with a human-in-the-loop review at each transition.

---

## Architecture

| Layer | Package | Role |
|---|---|---|
| Foundation | `packages/foundation` | Entity, AggregateRoot, Repository interface, Specification |
| Shared | `packages/shared` | Result type, errors, events, constants, branded IDs |
| Domain | `packages/domain` | 5 bounded contexts: discovery, pattern, principle, future, concept |
| AI Core | `packages/ai-core` | Agent definitions, prompt versioning, memory, evaluator |
| Knowledge | `packages/knowledge` | Facts, patterns store, embeddings, knowledge graph |
| Workflow | `packages/workflow` | LangGraph-compatible pipeline engine |
| Infrastructure | `packages/infrastructure` | Supabase repository implementations |
| Web | `apps/web` | Next.js 15 App Router — 3 Workspaces |

## Dependency Order

```
shared → foundation → domain → ai-core + knowledge → workflow → infrastructure → apps/web
```

---

## Prerequisites

- Node.js >= 22
- pnpm >= 9
- Supabase project (see `apps/web/.env.local.example`)
- Anthropic API key

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment
cp apps/web/.env.local.example apps/web/.env.local
# Edit .env.local with your keys

# Run development server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Workspaces

| Workspace | URL | Purpose |
|---|---|---|
| Research | `/research` | Capture Discoveries, extract Patterns |
| Knowledge | `/knowledge` | Elevate Patterns to Principles |
| Innovation | `/innovation` | Generate Futures and Concepts |

## Architecture Decision Records

- [ADR 001 — Supabase First](./docs/adr/001-supabase-first.md)
- [ADR 002 — Result type over exceptions](./docs/adr/002-result-type.md)
- [ADR 003 — Workflow LangGraph-compatible interface](./docs/adr/003-workflow-langgraph-compatible.md)
