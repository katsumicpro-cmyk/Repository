/**
 * Validation — lightweight, dependency-free result types and primitive validators.
 *
 * This module defines the contracts. Zod/Valibot adapters that satisfy
 * `SchemaValidator<T>` live in packages/infrastructure to avoid pulling
 * parsing libraries into the kernel.
 */

export type ValidationIssue = {
  readonly path: readonly string[]
  readonly message: string
}

export type ValidationOk<T> = { readonly ok: true; readonly data: T }
export type ValidationFail = { readonly ok: false; readonly issues: readonly ValidationIssue[] }
export type ValidationResult<T> = ValidationOk<T> | ValidationFail

export const validOk = <T>(data: T): ValidationOk<T> => ({ ok: true, data })

export const validFail = (issues: readonly ValidationIssue[]): ValidationFail => ({
  ok: false,
  issues,
})

export const singleIssue = (path: string[], message: string): ValidationFail =>
  validFail([{ path, message }])

/** Generic validator contract — implemented by Zod/Valibot adapters */
export interface SchemaValidator<T> {
  validate(input: unknown): ValidationResult<T>
}

/** Primitive guards */
export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0

export const isPositiveInt = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v > 0

export const isISODateString = (v: unknown): v is string =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v))

export const isOneOf =
  <T extends string>(values: readonly T[]) =>
  (v: unknown): v is T =>
    typeof v === 'string' && values.includes(v as T)
