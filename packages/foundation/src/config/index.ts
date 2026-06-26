/**
 * Config — typed application configuration container.
 *
 * Separates "where config comes from" (env, files, secrets) from
 * "how config is used" in application code.
 *
 * Usage:
 *   const cfg = createConfig()
 *   cfg.supabase.url   // typed string, never undefined
 */

import { env } from '../env/index.js'

export type AppEnvironment = 'development' | 'test' | 'production'

export type SupabaseConfig = {
  readonly url: string
  readonly anonKey: string
  readonly serviceRoleKey: string
}

export type AIConfig = {
  readonly anthropicApiKey: string
  readonly defaultModel: string
  readonly maxTokens: number
}

export type LogConfig = {
  readonly level: 'debug' | 'info' | 'warn' | 'error'
}

export type AppConfig = {
  readonly environment: AppEnvironment
  readonly supabase: SupabaseConfig
  readonly ai: AIConfig
  readonly log: LogConfig
}

export function createConfig(): AppConfig {
  const environments = ['development', 'test', 'production'] as const

  return {
    environment: env('NODE_ENV').asEnum(environments, { default: 'development' }),

    supabase: {
      url: env('NEXT_PUBLIC_SUPABASE_URL').asString({ required: true }),
      anonKey: env('NEXT_PUBLIC_SUPABASE_ANON_KEY').asString({ required: true }),
      serviceRoleKey: env('SUPABASE_SERVICE_ROLE_KEY').asString({ required: true }),
    },

    ai: {
      anthropicApiKey: env('ANTHROPIC_API_KEY').asString({ required: true }),
      defaultModel: env('ANTHROPIC_MODEL').asString({ default: 'claude-sonnet-4-6' }),
      maxTokens: env('ANTHROPIC_MAX_TOKENS').asInt({ default: 8192 }),
    },

    log: {
      level: env('LOG_LEVEL').asEnum(['debug', 'info', 'warn', 'error'] as const, {
        default: 'info',
      }),
    },
  }
}

/** Lazy singleton — only resolves env vars when first accessed */
let _config: AppConfig | undefined

export function getConfig(): AppConfig {
  if (!_config) _config = createConfig()
  return _config
}

/** Reset config singleton (for tests) */
export function resetConfig(): void {
  _config = undefined
}
