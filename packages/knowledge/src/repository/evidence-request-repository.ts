import type { Repository } from '@innovation-os/domain/core'
import type { AppError } from '@innovation-os/shared/errors'
import type { Result } from '@innovation-os/shared/result'
import type { EvidenceRequest, EvidenceRequestId, EvidenceRequestStatus } from '../reasoning/evidence/evidence-request.js'

/**
 * EvidenceRequestRepository — persistence interface for EvidenceRequest entities.
 */
export interface EvidenceRequestRepository extends Repository<EvidenceRequest, EvidenceRequestId> {
  findByStatus(status: EvidenceRequestStatus): Promise<Result<readonly EvidenceRequest[], AppError>>
  findByTheme(theme: string): Promise<Result<readonly EvidenceRequest[], AppError>>
  findByHypothesisId(hypothesisId: string): Promise<Result<readonly EvidenceRequest[], AppError>>
  /** Returns open, high-priority requests sorted by priority desc */
  findOpenHighPriority(): Promise<Result<readonly EvidenceRequest[], AppError>>
}
