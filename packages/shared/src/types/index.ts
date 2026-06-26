/**
 * Branded primitive types for type-safe IDs across the domain.
 */

declare const brand: unique symbol
export type Brand<T, B> = T & { readonly [brand]: B }

export type ID<B extends string> = Brand<string, B>

export type Timestamp = Brand<string, 'Timestamp'>
export const timestamp = (value: string): Timestamp => value as Timestamp
export const nowTimestamp = (): Timestamp => new Date().toISOString() as Timestamp

/** Pagination */
export type PaginationParams = {
  readonly page: number
  readonly perPage: number
}

export type PaginatedResult<T> = {
  readonly items: readonly T[]
  readonly total: number
  readonly page: number
  readonly perPage: number
}

/** Nullable helper */
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
