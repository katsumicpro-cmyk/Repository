import type { Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { ResearchResult } from '@innovation-os/domain/discovery'
import type { ResearchRequest } from '@innovation-os/domain/discovery'

/**
 * ResearchResultPort — output port (driven side) for generating research results.
 * The Mock implementation returns static data; future AI implementation calls Claude.
 */
export interface ResearchResultPort {
  generate(request: ResearchRequest): Promise<Result<ResearchResult, AppError>>
}

/**
 * EventPublisher — dispatches domain events after persistence.
 * Noop in MVP; swapped for a real bus in production.
 */
export interface EventPublisher {
  publish(event: unknown): Promise<void>
}

export class NoopEventPublisher implements EventPublisher {
  async publish(): Promise<void> {}
}
