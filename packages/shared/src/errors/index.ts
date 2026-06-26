/**
 * Typed error hierarchy for the Innovation OS domain.
 * All errors are value types — no thrown exceptions cross domain boundaries.
 */

export type ErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'AI_ERROR'
  | 'WORKFLOW_ERROR'

export type DomainError = {
  readonly _tag: 'DomainError'
  readonly code: ErrorCode
  readonly message: string
  readonly context?: Record<string, unknown>
}

export type InfrastructureError = {
  readonly _tag: 'InfrastructureError'
  readonly code: ErrorCode
  readonly message: string
  readonly cause?: unknown
}

export type AppError = DomainError | InfrastructureError

export const domainError = (
  code: ErrorCode,
  message: string,
  context?: Record<string, unknown>,
): DomainError => ({ _tag: 'DomainError', code, message, context })

export const infrastructureError = (
  code: ErrorCode,
  message: string,
  cause?: unknown,
): InfrastructureError => ({ _tag: 'InfrastructureError', code, message, cause })

export const notFound = (entity: string, id: string): DomainError =>
  domainError('NOT_FOUND', `${entity} not found: ${id}`, { entity, id })

export const validationError = (message: string, context?: Record<string, unknown>): DomainError =>
  domainError('VALIDATION_ERROR', message, context)
