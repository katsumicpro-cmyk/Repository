import { ValueObject } from '@innovation-os/domain/core'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'

export type FactSourceKind = 'discovery' | 'manual' | 'inferred' | 'verified_external'

type FactSourceProps = {
  readonly kind: FactSourceKind
  readonly label: string
  readonly url: string | null
  readonly discoveryId: string | null
}

/**
 * FactSource — records the provenance of a KnowledgeFact.
 *
 * Provenance is critical for Knowledge quality:
 * - `discovery` : generated from a Discovery run (links back via discoveryId)
 * - `manual`    : human-entered
 * - `inferred`  : derived by an AI agent from other Facts
 * - `verified_external` : confirmed against an external authoritative source
 */
export class FactSource extends ValueObject<FactSourceProps> {
  private constructor(props: FactSourceProps) {
    super(props)
  }

  static create(
    kind: FactSourceKind,
    label: string,
    options?: { url?: string; discoveryId?: string },
  ): Result<FactSource, AppError> {
    if (label.trim().length === 0) {
      return err(validationError('FactSource label must not be empty'))
    }
    return ok(
      new FactSource({
        kind,
        label: label.trim(),
        url: options?.url?.trim() ?? null,
        discoveryId: options?.discoveryId ?? null,
      }),
    )
  }

  get kind(): FactSourceKind { return this.props.kind }
  get label(): string { return this.props.label }
  get url(): string | null { return this.props.url }
  get discoveryId(): string | null { return this.props.discoveryId }

  isFromDiscovery(): boolean {
    return this.props.kind === 'discovery' && this.props.discoveryId !== null
  }
}
