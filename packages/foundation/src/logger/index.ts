/**
 * Logger — structured, levelled logging interface.
 *
 * Implementations:
 *   - ConsoleLogger: human-readable dev output
 *   - NoopLogger:    silent (useful in tests)
 *
 * In production, swap ConsoleLogger for a Pino/Winston adapter
 * that satisfies the Logger interface.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogContext = Record<string, unknown>

export interface Logger {
  debug(message: string, ctx?: LogContext): void
  info(message: string, ctx?: LogContext): void
  warn(message: string, ctx?: LogContext): void
  error(message: string, ctx?: LogContext): void
  child(bindings: LogContext): Logger
}

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

export class ConsoleLogger implements Logger {
  constructor(
    private readonly minLevel: LogLevel = 'info',
    private readonly bindings: LogContext = {},
  ) {}

  private shouldLog(level: LogLevel): boolean {
    return LEVELS[level] >= LEVELS[this.minLevel]
  }

  private write(level: LogLevel, message: string, ctx?: LogContext): void {
    if (!this.shouldLog(level)) return
    const entry = {
      level,
      time: new Date().toISOString(),
      ...this.bindings,
      ...ctx,
      msg: message,
    }
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    fn(JSON.stringify(entry))
  }

  debug(message: string, ctx?: LogContext): void {
    this.write('debug', message, ctx)
  }
  info(message: string, ctx?: LogContext): void {
    this.write('info', message, ctx)
  }
  warn(message: string, ctx?: LogContext): void {
    this.write('warn', message, ctx)
  }
  error(message: string, ctx?: LogContext): void {
    this.write('error', message, ctx)
  }
  child(bindings: LogContext): Logger {
    return new ConsoleLogger(this.minLevel, { ...this.bindings, ...bindings })
  }
}

export class NoopLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
  child(): Logger {
    return this
  }
}

export const createLogger = (level: LogLevel = 'info'): Logger => new ConsoleLogger(level)
