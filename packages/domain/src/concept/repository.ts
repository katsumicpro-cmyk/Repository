import type { Repository } from '../core/repository.js'
import type { AppError } from '@innovation-os/shared/errors'
import type { Result } from '@innovation-os/shared/result'
import type { Concept } from './entity.js'
import type { ConceptId, ConceptStatus } from './types.js'

export interface ConceptRepository extends Repository<Concept, ConceptId> {
  findByStatus(status: ConceptStatus): Promise<Result<readonly Concept[], AppError>>
}
