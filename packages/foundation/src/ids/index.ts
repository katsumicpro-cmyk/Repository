/**
 * IDs — deterministic, URL-safe, sortable identifier generation.
 *
 * Strategy:
 *   - UUID v4 via crypto.randomUUID() (Node 14.17+, no external dep)
 *   - Prefix-typed IDs keep log lines human-readable: disc_<uuid>
 *   - Brand<T> pattern enforces type-safety at compile time
 */

declare const _brand: unique symbol
export type Brand<T, B extends string> = T & { readonly [_brand]: B }

export type PrefixedId<P extends string> = Brand<string, P>

const strip = (v: string) => v.replace(/-/g, '')

export function generateId<P extends string>(prefix: P): PrefixedId<P> {
  return `${prefix}_${strip(crypto.randomUUID())}` as PrefixedId<P>
}

export function generateRawId(): string {
  return crypto.randomUUID()
}

/** Parse and validate a prefixed ID at runtime (e.g. from HTTP params) */
export function parsePrefixedId<P extends string>(
  prefix: P,
  raw: unknown,
): PrefixedId<P> | null {
  if (typeof raw !== 'string') return null
  const pattern = new RegExp(`^${prefix}_[0-9a-f]{32}$`)
  return pattern.test(raw) ? (raw as PrefixedId<P>) : null
}
