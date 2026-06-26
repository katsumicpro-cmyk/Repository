/**
 * @innovation-os/infrastructure
 *
 * Concrete implementations of domain ports using external services.
 *
 * Design rules:
 *   - This package may import from: shared, foundation, knowledge
 *   - This package must NOT be imported by: domain, knowledge, application
 *   - All implementations satisfy interfaces defined in domain/knowledge packages
 *   - No business logic lives here — only I/O adapters
 *
 * Current implementations:
 *   - HttpEmbeddingPort: EmbeddingPort via any OpenAI-compatible HTTP endpoint
 *
 * Planned (Sprint 5+):
 *   - SupabaseKnowledgeFactRepository: pgvector-backed KnowledgeFactRepository
 *   - SupabaseKnowledgeGraphRepository: KnowledgeGraphRepository with Supabase
 *   - ClaudeResearchPort: ResearchResultPort using Claude structured output
 */
export { HttpEmbeddingPort, type HttpEmbeddingConfig } from './embedding/index.js'
