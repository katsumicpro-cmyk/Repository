import type { KnowledgeSourcePort } from '../research/knowledge-source-port.js'

/**
 * QuestionHint — minimal information about a question, sufficient for source planning.
 *
 * Intentionally NOT a full ResearchQuestion ValueObject.
 * The SourcePlanner needs only the question type and optional terms —
 * not the full domain object. This keeps SourcePlanner independent of
 * the ResearchQuestion implementation details.
 *
 * questionType maps to EvidenceRequestType or ResearchQuestion.questionType:
 *   'causal'          → academic, web
 *   'contradiction'   → knowledge_base, academic
 *   'pattern'         → knowledge_base, internal_db
 *   'missing_link'    → knowledge_base, web
 *   'empirical'       → academic, web
 *   'structural'      → knowledge_base
 *   'implementation'  → github, internal_db
 *   'behavioral'      → slack, notion, interviews
 */
export type QuestionHint = {
  readonly questionType: string
  readonly searchTerms?: readonly string[]
}

/**
 * SourcePlanner — decides which KnowledgeSources to use for a given question.
 *
 * This is the intelligence layer between a question and the
 * KnowledgeSourcePorts registered in the system.
 *
 * A naive planner uses all sources for every question.
 * A smarter planner matches question type to source capability.
 *
 * The SourcePlanner is designed for swappability:
 *   RoundRobinSourcePlanner    — use all registered sources (MVP)
 *   TypeMatchSourcePlanner     — match question type to source type
 *   AISourcePlanner (future)   — ask Claude to pick the best source per question
 *
 * Injected into RunLearningCycleUseCase. Domain never sees this.
 */
export interface SourcePlanner {
  /**
   * Select which KnowledgeSources to query for this question.
   * Returns a non-empty ordered list. Earlier = higher priority.
   */
  selectSources(hint: QuestionHint): readonly KnowledgeSourcePort[]
}

/**
 * RoundRobinSourcePlanner — uses all registered sources for every question.
 *
 * The simplest valid planner. When multiple sources are registered,
 * all of them are queried and their results merged.
 *
 * Sufficient for Sprint 7: the abstraction is correct,
 * smarter routing can be added without changing the interface.
 */
export class RoundRobinSourcePlanner implements SourcePlanner {
  constructor(private readonly sources: readonly KnowledgeSourcePort[]) {
    if (sources.length === 0) throw new Error('RoundRobinSourcePlanner: at least one source required')
  }

  selectSources(_hint: QuestionHint): readonly KnowledgeSourcePort[] {
    return this.sources
  }
}

/**
 * TypeMatchSourcePlanner — routes questions to sources by question type.
 *
 * Questions whose type matches a source's specialty are routed there first.
 * Falls back to all sources when no specialty match exists.
 *
 * This is where the routing intelligence lives.
 * Extend this as more KnowledgeSourcePort implementations appear.
 */
export class TypeMatchSourcePlanner implements SourcePlanner {
  private readonly byType: Map<string, KnowledgeSourcePort[]>
  private readonly allSources: readonly KnowledgeSourcePort[]

  constructor(sources: readonly KnowledgeSourcePort[]) {
    this.allSources = sources
    this.byType = new Map()
    for (const source of sources) {
      const types = sourceTypeToQuestionTypes(source.sourceType)
      for (const t of types) {
        const list = this.byType.get(t) ?? []
        list.push(source)
        this.byType.set(t, list)
      }
    }
  }

  selectSources(hint: QuestionHint): readonly KnowledgeSourcePort[] {
    const matched = this.byType.get(hint.questionType) ?? []
    // matched first, then remaining (deduped)
    const matchedIds = new Set(matched.map((s) => s.sourceName))
    const rest = this.allSources.filter((s) => !matchedIds.has(s.sourceName))
    return matched.length > 0 ? [...matched, ...rest] : [...this.allSources]
  }
}

// ── Internal mapping ───────────────────────────────────────────────────────

type QuestionType = string  // from ResearchQuestion.questionType

function sourceTypeToQuestionTypes(sourceType: string): readonly QuestionType[] {
  const map: Record<string, readonly QuestionType[]> = {
    knowledge_base: ['structural', 'causal', 'relational', 'definitional'],
    academic:       ['empirical', 'theoretical', 'quantitative'],
    web:            ['empirical', 'current', 'comparative'],
    github:         ['implementation', 'technical', 'behavioral'],
    slack:          ['behavioral', 'organizational', 'experiential'],
    notion:         ['organizational', 'process', 'definitional'],
    pdf:            ['regulatory', 'historical', 'technical'],
    internal_db:    ['quantitative', 'operational', 'historical'],
  }
  return map[sourceType] ?? []
}
