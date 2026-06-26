import type { Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import { type Discovery, type DiscoveryId, type DiscoveryRepository } from '@innovation-os/domain/discovery'

export type GetDiscoveryInput = {
  readonly id: DiscoveryId
}

export type GetDiscoveryOutput = {
  readonly discovery: Discovery
}

/**
 * GetDiscoveryUseCase — retrieves a persisted Discovery by ID.
 */
export class GetDiscoveryUseCase {
  constructor(private readonly repository: DiscoveryRepository) {}

  async execute(input: GetDiscoveryInput): Promise<Result<GetDiscoveryOutput, AppError>> {
    const result = await this.repository.findById(input.id)
    if (result._tag === 'Err') return result
    return { _tag: 'Ok', value: { discovery: result.value } }
  }
}
