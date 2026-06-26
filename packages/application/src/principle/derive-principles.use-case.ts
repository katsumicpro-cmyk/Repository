import { ok, isOk, err, type Result } from '@innovation-os/shared/result'
import { validationError } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type { InvariantRepository, PrincipleRepository } from '@innovation-os/knowledge/repository'
import {
  InvariantToPrincipleTranslator,
  type Principle,
  type Invariant,
} from '@innovation-os/knowledge/principle'

export type DerivePrinciplesInput = {
  /**
   * Domain to translate Invariants into.
   * Example: "ソフトウェアアーキテクチャ", "組織設計", "製品開発"
   * Same Invariants + different domain = different Principles.
   */
  readonly domain: string
  /**
   * If provided, only translate these specific Invariant IDs.
   * If omitted, translate all validated Invariants.
   */
  readonly invariantIds?: readonly string[]
  /**
   * If true, also validate candidate Invariants before translating.
   * Use with care: this bypasses the challenge process.
   * Intended for: fast MVP cycles where formal challenge is not yet implemented.
   * Default: false (only translate already-validated Invariants)
   */
  readonly autoValidateCandidates?: boolean
}

export type DerivePrinciplesOutput = {
  readonly domain: string
  readonly sourceInvariantsCount: number
  readonly principles: readonly Principle[]
  readonly skippedCount: number
  readonly skippedReasons: readonly string[]
}

/**
 * DerivePrinciplesUseCase — Sprint 7 capability: Invariant → Principle.
 *
 * "InvariantをドメインのPrincipleへ翻訳する"
 *
 * Pipeline:
 *   1. Load validated Invariants (or specified Invariant IDs)
 *   2. Optional: auto-validate candidate Invariants (MVP shortcut)
 *   3. InvariantToPrincipleTranslator → translate each to domain Principle
 *   4. Save all Principles as 'draft' status
 *   5. Return Principles for review / activation
 *
 * Why domain-parameterized?
 *   Invariants are universal. Principles are domain-specific.
 *   Running this use case for "ソフトウェアアーキテクチャ" and then for "組織設計"
 *   on the same Invariants produces different, equally valid Principles.
 *   The domain is the lens through which universals become actionable.
 *
 * Responsibility boundary:
 *   This use case ONLY translates. It does not:
 *   - Extract patterns (ExtractInvariantsUseCase)
 *   - Validate invariants (to be implemented as ValidateInvariantUseCase)
 *   - Activate principles (caller's responsibility after review)
 *
 * The separation of extraction → validation → translation → activation
 * enforces that no unvalidated Invariant becomes an active Principle by accident.
 */
export class DerivePrinciplesUseCase {
  private readonly translator = new InvariantToPrincipleTranslator()

  constructor(
    private readonly invariantRepo: InvariantRepository,
    private readonly principleRepo: PrincipleRepository,
  ) {}

  async execute(input: DerivePrinciplesInput): Promise<Result<DerivePrinciplesOutput, AppError>> {
    if (!input.domain.trim()) {
      return err(validationError('DerivePrinciples: domain must not be empty'))
    }

    // 1. Load Invariants
    let invariants: readonly Invariant[]

    if (input.invariantIds && input.invariantIds.length > 0) {
      const results = await Promise.all(
        input.invariantIds.map((id) =>
          this.invariantRepo.findById(id as Parameters<typeof this.invariantRepo.findById>[0]),
        ),
      )
      invariants = results
        .filter(isOk)
        .map((r) => r.value)
    } else {
      const allResult = await this.invariantRepo.findAll()
      if (!isOk(allResult)) return allResult
      invariants = allResult.value
    }

    // 2. Optional: auto-validate candidates (MVP bypass)
    const processable: Invariant[] = []
    const skippedReasons: string[] = []

    for (const inv of invariants) {
      if (inv.canBeTranslatedToPrinciple()) {
        processable.push(inv)
      } else if (input.autoValidateCandidates && inv.status === 'candidate') {
        // MVP shortcut: validate without formal challenge process
        const validated = inv.validate()
        await this.invariantRepo.save(validated)
        processable.push(validated)
      } else {
        skippedReasons.push(
          `Invariant ${inv.id} skipped: status=${inv.status} (requires 'validated')`,
        )
      }
    }

    // 3. Translate each validated Invariant to a Principle for this domain
    const principles: Principle[] = []
    for (const inv of processable) {
      const principle = this.translator.translate(inv, input.domain)
      await this.principleRepo.save(principle)
      principles.push(principle)
    }

    return ok({
      domain: input.domain,
      sourceInvariantsCount: invariants.length,
      principles,
      skippedCount: skippedReasons.length,
      skippedReasons,
    })
  }
}
