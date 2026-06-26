/**
 * Clock — abstraction over wall-clock time.
 *
 * Why: `new Date()` is a hidden global dependency that makes tests
 * non-deterministic. Injecting a Clock makes time controllable.
 *
 * Usage in tests:
 *   const clock = new FakeClock('2024-01-01T00:00:00Z')
 *   clock.advance(3600_000) // +1 hour
 */

export interface Clock {
  /** Current time as ISO 8601 string */
  now(): string
  /** Current time as Unix epoch milliseconds */
  nowMs(): number
}

export class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString()
  }
  nowMs(): number {
    return Date.now()
  }
}

export class FakeClock implements Clock {
  private currentMs: number

  constructor(initial: string | number = '2024-01-01T00:00:00.000Z') {
    this.currentMs = typeof initial === 'number' ? initial : new Date(initial).getTime()
  }

  now(): string {
    return new Date(this.currentMs).toISOString()
  }

  nowMs(): number {
    return this.currentMs
  }

  /** Advance clock by milliseconds */
  advance(ms: number): void {
    this.currentMs += ms
  }

  /** Set clock to a specific point in time */
  setTo(value: string | number): void {
    this.currentMs = typeof value === 'number' ? value : new Date(value).getTime()
  }
}

/** Singleton system clock for use outside of DI contexts */
export const systemClock: Clock = new SystemClock()
