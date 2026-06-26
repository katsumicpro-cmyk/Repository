# Changelog

All notable changes to Innovation OS are documented here.  
Format: `Added / Changed / Removed / Fixed / Architecture`

---

## [0.2.0] — 2026-06-26

### Added

- `packages/domain/discovery`: ResearchTheme, ResearchRequest, ResearchResult, Fact, FactCollection
- `packages/domain/discovery`: DiscoveryStarted / DiscoveryCompleted domain events
- `packages/application/discovery`: GenerateDiscoveryUseCase, SaveDiscoveryUseCase, GetDiscoveryUseCase
- `packages/application/discovery`: MockResearchResultPort, MockDiscoveryRepository
- `apps/web` Research Workspace: ResearchForm → Server Action → Mock Result表示
- `docs/PROJECT_MEMORY.md`: Project Knowledge継承ドキュメント
- `docs/CTO_PLAYBOOK.md`: アーキテクチャ・エンジニアリング規約
- `docs/protocols/ISP_SPEC.md`: Innovation Synchronization Protocol仕様
- `docs/protocols/REVIEW_PROTOCOL.md`, `MEMORY_PROTOCOL.md`, `PROMPT_PROTOCOL.md`

### Architecture

- **Knowledge First**: KnowledgeEngineをPatternより先に実装する方針を確定
- **Mock First**: AI呼び出しなしでドメインフローを完成させてからAIを接続
- **Port Pattern**: `ResearchResultPort` interfaceにより AI実装と Mock実装を交換可能に設計

---

## [0.1.0] — 2026-06-26

### Added

- Monorepo 初期化 (pnpm workspaces + Turbo)
- `packages/shared`: Result\<T,E\>, AppError, DomainEvent payload types, 定数
- `packages/foundation`: ids, time, logger, cache, env, config, validation, telemetry (8 kernel modules)
- `packages/domain/core`: Entity, AggregateRoot, ValueObject, DomainEvent, Repository, Specification
- `packages/domain`: 5 bounded contexts (discovery, pattern, principle, future, concept) の雛形
- `apps/web`: Next.js 15 App Router, 3 Workspaces (research / knowledge / innovation)
- `docs/adr/001-003`: Architecture Decision Records
- `biome.json`: Linter/Formatter統合設定
- `turbo.json`: Build pipeline定義
