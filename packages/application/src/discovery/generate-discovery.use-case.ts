import { ok, err, isOk, type Result } from '@innovation-os/shared/result'
import { domainError } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import {
  ResearchRequest,
  type CreateResearchRequestInput,
  type ResearchResult,
} from '@innovation-os/domain/discovery'
import { generateId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import type { ResearchResultPort, EventPublisher } from './ports.js'
import type { DiscoveryStartedEvent } from '@innovation-os/domain/discovery'

export type GenerateDiscoveryInput = {
  readonly themeText: string
  readonly additionalContext?: string
  readonly requestedBy?: string
  readonly language?: 'ja' | 'en'
}

export type GenerateDiscoveryOutput = {
  readonly request: ResearchRequest
  readonly result: ResearchResult
}

/**
 * GenerateDiscoveryUseCase — orchestrates the discovery flow:
 *   1. Build ResearchRequest from user input
 *   2. Emit DiscoveryStarted
 *   3. Delegate to ResearchResultPort (Mock or AI)
 *   4. Return request + result pair
 */
export class GenerateDiscoveryUseCase {
  constructor(
    private readonly port: ResearchResultPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(input: GenerateDiscoveryInput): Promise<Result<GenerateDiscoveryOutput, AppError>> {
    // 1. Create ResearchRequest (validates theme)
    const requestResult = ResearchRequest.create({
      themeText: input.themeText,
      additionalContext: input.additionalContext,
      requestedBy: input.requestedBy ?? 'anonymous',
      language: input.language,
    })
    if (!isOk(requestResult)) return requestResult

    const request = requestResult.value

    // 2. Emit DiscoveryStarted
    const startedEvent: DiscoveryStartedEvent = {
      _type: 'discovery.started',
      eventId: generateId('evt'),
      occurredAt: systemClock.now(),
      aggregateId: request.id,
      aggregateType: 'ResearchRequest',
      version: 1,
      payload: {
        requestId: request.id,
        theme: request.theme.value,
        requestedBy: request.requestedBy,
      },
    }
    await this.publisher.publish(startedEvent)

    // 3. Generate result via port
    const resultResult = await this.port.generate(request)
    if (!isOk(resultResult)) {
      return err(domainError('WORKFLOW_ERROR', 'Research generation failed', {
        theme: request.theme.value,
      }))
    }

    const result = resultResult.value

    // 4. Publish domain events collected on the aggregate
    for (const event of result.domainEvents) {
      await this.publisher.publish(event)
    }
    result.clearEvents()

    return ok({ request, result })
  }
}
