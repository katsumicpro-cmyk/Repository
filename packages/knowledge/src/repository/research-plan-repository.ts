import type { Repository } from '@innovation-os/domain/core'
import type { AppError } from '@innovation-os/shared/errors'
import type { Result } from '@innovation-os/shared/result'
import type { ResearchPlan, ResearchPlanId, ResearchPlanStatus } from '../research/research-plan.js'

/**
 * ResearchPlanRepository — persistence interface for ResearchPlan entities.
 */
export interface ResearchPlanRepository extends Repository<ResearchPlan, ResearchPlanId> {
  findByStatus(status: ResearchPlanStatus): Promise<Result<readonly ResearchPlan[], AppError>>
  findByHypothesisId(hypothesisId: string): Promise<Result<readonly ResearchPlan[], AppError>>
  findByTheme(theme: string): Promise<Result<readonly ResearchPlan[], AppError>>
}
