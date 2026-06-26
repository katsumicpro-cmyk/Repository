import { ok, isOk, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import {
  Discovery,
  type DiscoveryId,
  type DiscoveryRepository,
  type ResearchResult,
} from '@innovation-os/domain/discovery'

export type SaveDiscoveryInput = {
  readonly result: ResearchResult
}

export type SaveDiscoveryOutput = {
  readonly discoveryId: DiscoveryId
}

/**
 * SaveDiscoveryUseCase — persists a ResearchResult as a Discovery entity.
 * Converts the ResearchResult aggregate to a Discovery for long-term storage.
 */
export class SaveDiscoveryUseCase {
  constructor(private readonly repository: DiscoveryRepository) {}

  async execute(input: SaveDiscoveryInput): Promise<Result<SaveDiscoveryOutput, AppError>> {
    const { result } = input

    const discoveryResult = Discovery.create({
      title: result.theme,
      rawContent: result.factCollection.facts.map((f) => f.content).join('\n\n'),
      source: 'manual',
      tags: [result.isMock ? 'mock' : 'generated'],
    })
    if (!isOk(discoveryResult)) return discoveryResult

    const saved = await this.repository.save(discoveryResult.value)
    if (!isOk(saved)) return saved

    return ok({ discoveryId: saved.value.id })
  }
}
