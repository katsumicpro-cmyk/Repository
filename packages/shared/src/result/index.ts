/**
 * Result<T, E> — Railway-oriented programming primitive.
 * Avoids thrown exceptions at domain boundaries.
 */

export type Ok<T> = { readonly _tag: 'Ok'; readonly value: T }
export type Err<E> = { readonly _tag: 'Err'; readonly error: E }
export type Result<T, E = Error> = Ok<T> | Err<E>

export const ok = <T>(value: T): Ok<T> => ({ _tag: 'Ok', value })
export const err = <E>(error: E): Err<E> => ({ _tag: 'Err', error })

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result._tag === 'Ok'
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => result._tag === 'Err'

export const map = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> =>
  isOk(result) ? ok(fn(result.value)) : result

export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> => (isOk(result) ? fn(result.value) : result)

export const unwrapOr = <T, E>(result: Result<T, E>, fallback: T): T =>
  isOk(result) ? result.value : fallback
