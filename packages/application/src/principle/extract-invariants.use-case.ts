import { ok, isOk, err, type Result } from '@innovation-os/shared/result'
import { validationError } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type { KnowledgeGraphRepository, InvariantRepository } from '@innovation-os/knowledge/repository'
import {
  PatternToInvariantExtractor,
  type Invariant,
} from '@innovation-os/knowledge/principle'
import { PatternExtractor } from '@innovation-os/knowledge/reasoning'
import type { ExtractedPattern } from '@innovation-os/knowledge/reasoning'

export type ExtractInvariantsInput = {
  readonly theme: string
  /** If true, extract from all patterns regardless of strength (default: false = only strong patterns) */
  readonly includeWeakPatterns?: boolean
}

export type ExtractInvariantsOutput = {
  readonly theme: string
  readonly patterns: readonly ExtractedPattern[]
  readonly invariants: readonly Invariant[]
  /** How many strong patterns were found */
  readonly strongPatternCount: number
  /** How many pattern types are represented in the invariants */
  readonly invariantTypesFound: readonly string[]
}

/**
 * ExtractInvariantsUseCase — Sprint 7 capability: Pattern → Invariant.
 *
 * "世界が変わっても成立するInvariantを発見する"
 *
 * Pipeline:
 *   1. Load KnowledgeGraph for theme
 *   2. PatternExtractor → structural patterns (what keeps appearing)
 *   3. PatternToInvariantExtractor → abstract to Invariants (what holds universally)
 *   4. Save all Invariants as 'candidate' status
 *   5. Return patterns + invariants for review
 *
 * The output preserves BOTH patterns AND invariants.
 * This is intentional: patterns are the observable evidence;
 * invariants are the abstraction. A reviewer can verify:
 *   "Does this Invariant faithfully represent the Pattern it came from?"
 *
 * Responsibility boundary:
 *   This use case extracts and saves Invariant CANDIDATES.
 *   Validation (challenge + surviveChallenge + validate) happens separately.
 *   Translation to Principles happens in DerivePrinciplesUseCase.
 *
 *   Pattern (this class) → Invariant candidate (this class)
 *   → Invariant validated (challenge process, separate)
 *   → Principle (DerivePrinciplesUseCase)
 */
export class ExtractInvariantsUseCase {
  private readonly patternExtractor = new PatternExtractor()
  private readonly invariantExtractor = new PatternToInvariantExtractor()

  constructor(
    private readonly graphRepo: KnowledgeGraphRepository,
    private readonly invariantRepo: InvariantRepository,
  ) {}

  async execute(input: ExtractInvariantsInput): Promise<Result<ExtractInvariantsOutput, AppError>> {
    if (!input.theme.trim()) {
      return err(validationError('ExtractInvariants: theme must not be empty'))
    }

    // 1. Load KnowledgeGraph
    const graphResult = await this.graphRepo.findByTheme(input.theme)
    if (!isOk(graphResult)) return graphResult

    const graph = graphResult.value
    if (graph.nodes.length === 0) {
      return ok({
        theme: input.theme,
        patterns: [],
        invariants: [],
        strongPatternCount: 0,
        invariantTypesFound: [],
      })
    }

    // 2. PatternExtractor → patterns (현象)
    const patterns = this.patternExtractor.extract(graph)

    // 3. PatternToInvariantExtractor → Invariant candidates (本質)
    const invariants = input.includeWeakPatterns
      ? this.invariantExtractor.extractAll(patterns)
      : this.invariantExtractor.extract(patterns)

    // 4. Save all candidates
    for (const invariant of invariants) {
      await this.invariantRepo.save(invariant)
    }

    const strongPatternCount = patterns.filter((p) => p.isStrong()).length
    const invariantTypesFound = [...new Set(invariants.map((i) => i.invariantType))]

    return ok({
      theme: input.theme,
      patterns,
      invariants,
      strongPatternCount,
      invariantTypesFound,
    })
  }
}
