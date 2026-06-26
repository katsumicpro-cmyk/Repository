/**
 * Cache<K, V> — generic key-value cache interface with TTL support.
 *
 * Implementations:
 *   - MemoryCache: process-local, good for single-instance MVP
 *
 * Future: swap MemoryCache for a Redis adapter that satisfies Cache<K,V>.
 */

export interface Cache<K, V> {
  get(key: K): V | undefined
  set(key: K, value: V, ttlMs?: number): void
  delete(key: K): void
  clear(): void
  has(key: K): boolean
  size(): number
}

type CacheEntry<V> = {
  value: V
  expiresAt: number | null
}

export class MemoryCache<K, V> implements Cache<K, V> {
  private readonly store = new Map<K, CacheEntry<V>>()

  get(key: K): V | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: K, value: V, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: ttlMs != null ? Date.now() + ttlMs : null,
    })
  }

  delete(key: K): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  has(key: K): boolean {
    return this.get(key) !== undefined
  }

  size(): number {
    return this.store.size
  }
}

export function createMemoryCache<K, V>(): Cache<K, V> {
  return new MemoryCache<K, V>()
}
