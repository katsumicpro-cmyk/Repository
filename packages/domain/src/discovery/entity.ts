import { AggregateRoot } from '../core/entity.js'
import { generateId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { DiscoveryId, DiscoveryProps, DiscoverySource } from './types.js'

export type CreateDiscoveryInput = {
  readonly title: string
  readonly rawContent: string
  readonly source: DiscoverySource
  readonly sourceUrl?: string | null
  readonly tags?: readonly string[]
}

export class Discovery extends AggregateRoot<DiscoveryProps> {
  private constructor(props: DiscoveryProps) {
    super(props)
  }

  static create(input: CreateDiscoveryInput): Result<Discovery, AppError> {
    if (input.title.trim().length === 0) {
      return err(validationError('Discovery title must not be empty'))
    }
    if (input.rawContent.trim().length === 0) {
      return err(validationError('Discovery content must not be empty'))
    }

    const now = systemClock.now()
    return ok(
      new Discovery({
        id: generateId('disc'),
        title: input.title.trim(),
        rawContent: input.rawContent,
        source: input.source,
        sourceUrl: input.sourceUrl ?? null,
        status: 'pending',
        tags: input.tags ?? [],
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  static reconstitute(props: DiscoveryProps): Discovery {
    return new Discovery(props)
  }

  get title(): string { return this.props.title }
  get rawContent(): string { return this.props.rawContent }
  get source(): DiscoverySource { return this.props.source }
  get sourceUrl(): string | null { return this.props.sourceUrl }
  get status() { return this.props.status }
  get tags(): readonly string[] { return this.props.tags }

  markProcessing(): Result<Discovery, AppError> {
    if (this.props.status !== 'pending') {
      return err(validationError('Only pending discoveries can be moved to processing'))
    }
    return ok(new Discovery({ ...this.props, status: 'processing', updatedAt: systemClock.now() }))
  }

  markCompleted(): Result<Discovery, AppError> {
    if (this.props.status !== 'processing') {
      return err(validationError('Only processing discoveries can be completed'))
    }
    return ok(new Discovery({ ...this.props, status: 'completed', updatedAt: systemClock.now() }))
  }

  toProps(): DiscoveryProps { return this.props }
}
