/**
 * Env — type-safe environment variable parsing.
 *
 * Fails fast at startup if required variables are missing or malformed.
 * All access goes through `env()` so the shape is declared, not scattered.
 *
 * Usage:
 *   const PORT = env('PORT').asInt({ default: 3000 })
 *   const URL  = env('SUPABASE_URL').asString({ required: true })
 */

type StringOptions = { required: true } | { required?: false; default: string }
type NumberOptions = { required: true } | { required?: false; default: number }
type BoolOptions = { required: true } | { required?: false; default: boolean }

export class EnvVar {
  constructor(
    private readonly key: string,
    private readonly raw: string | undefined,
  ) {}

  asString(opts: StringOptions): string {
    if (this.raw !== undefined) return this.raw
    if ('default' in opts) return opts.default
    throw new Error(`[env] Required variable "${this.key}" is not set`)
  }

  asInt(opts: NumberOptions): number {
    if (this.raw !== undefined) {
      const n = Number.parseInt(this.raw, 10)
      if (Number.isNaN(n)) throw new Error(`[env] "${this.key}" must be an integer, got "${this.raw}"`)
      return n
    }
    if ('default' in opts) return opts.default
    throw new Error(`[env] Required variable "${this.key}" is not set`)
  }

  asFloat(opts: NumberOptions): number {
    if (this.raw !== undefined) {
      const n = Number.parseFloat(this.raw)
      if (Number.isNaN(n)) throw new Error(`[env] "${this.key}" must be a number, got "${this.raw}"`)
      return n
    }
    if ('default' in opts) return opts.default
    throw new Error(`[env] Required variable "${this.key}" is not set`)
  }

  asBool(opts: BoolOptions): boolean {
    if (this.raw !== undefined) {
      if (['true', '1', 'yes'].includes(this.raw.toLowerCase())) return true
      if (['false', '0', 'no'].includes(this.raw.toLowerCase())) return false
      throw new Error(`[env] "${this.key}" must be a boolean value, got "${this.raw}"`)
    }
    if ('default' in opts) return opts.default
    throw new Error(`[env] Required variable "${this.key}" is not set`)
  }

  asEnum<T extends string>(values: readonly T[], opts: { default: T } | { required: true }): T {
    if (this.raw !== undefined) {
      if (values.includes(this.raw as T)) return this.raw as T
      throw new Error(`[env] "${this.key}" must be one of [${values.join(', ')}], got "${this.raw}"`)
    }
    if ('default' in opts) return opts.default
    throw new Error(`[env] Required variable "${this.key}" is not set`)
  }
}

export function env(key: string): EnvVar {
  return new EnvVar(key, process.env[key])
}
