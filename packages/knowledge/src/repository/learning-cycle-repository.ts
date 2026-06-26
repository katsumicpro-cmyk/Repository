import type { Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { LearningCycle, LearningCycleId } from '../learning/learning-cycle.js'

/**
 * LearningCycleRepository — persistence port for LearningCycle records.
 *
 * LearningCycles are the audit trail of the system's autonomous learning.
 * This repository enables:
 *   - "What did the system learn in the last N cycles?"
 *   - "How many cycles did it take to accept hypothesis X?"
 *   - "Show all learning activity for theme Y"
 *
 * Current: in-memory (MockLearningCycleRepository in application/)
 * Future: Supabase persistence with full query support
 */
export interface LearningCycleRepository {
  save(cycle: LearningCycle): Promise<Result<void, AppError>>
  findById(id: LearningCycleId): Promise<Result<LearningCycle, AppError>>
  findByTheme(theme: string): Promise<Result<readonly LearningCycle[], AppError>>
  findRecent(limit: number): Promise<Result<readonly LearningCycle[], AppError>>
}
