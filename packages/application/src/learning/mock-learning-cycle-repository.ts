import { ok, err } from '@innovation-os/shared/result'
import type { Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import { notFound } from '@innovation-os/shared/errors'
import type { LearningCycle, LearningCycleId } from '@innovation-os/knowledge/learning'
import type { LearningCycleRepository } from '@innovation-os/knowledge/repository'

export class MockLearningCycleRepository implements LearningCycleRepository {
  private readonly store = new Map<string, LearningCycle>()

  async save(cycle: LearningCycle): Promise<Result<void, AppError>> {
    this.store.set(cycle.id, cycle)
    return ok(undefined)
  }

  async findById(id: LearningCycleId): Promise<Result<LearningCycle, AppError>> {
    const cycle = this.store.get(id)
    if (!cycle) return err(notFound('LearningCycle', id))
    return ok(cycle)
  }

  async findByTheme(theme: string): Promise<Result<readonly LearningCycle[], AppError>> {
    const cycles = [...this.store.values()].filter((c) => c.theme === theme)
    return ok(cycles)
  }

  async findRecent(limit: number): Promise<Result<readonly LearningCycle[], AppError>> {
    const sorted = [...this.store.values()]
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit)
    return ok(sorted)
  }
}
