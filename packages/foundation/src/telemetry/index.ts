/**
 * Telemetry — OpenTelemetry-shaped tracing and metrics interfaces.
 *
 * No @opentelemetry packages are imported here.
 * The interfaces mirror the OTel API surface so that:
 *   1. Domain/application code is instrumented without runtime overhead in test
 *   2. A real OTel SDK adapter can be plugged in at the infrastructure layer
 *
 * Implementations:
 *   - NoopTracer / NoopMeter: zero-overhead defaults (used in test and dev)
 */

/* ── Tracing ─────────────────────────────────────────── */

export type SpanStatus = 'unset' | 'ok' | 'error'

export type SpanAttributes = Record<string, string | number | boolean>

export interface Span {
  setAttribute(key: string, value: string | number | boolean): this
  setStatus(status: SpanStatus, message?: string): this
  recordException(error: unknown): this
  end(): void
}

export interface Tracer {
  startSpan(name: string, attrs?: SpanAttributes): Span
  /** Run fn inside a span, auto-ending it on completion */
  trace<T>(name: string, fn: (span: Span) => Promise<T>, attrs?: SpanAttributes): Promise<T>
}

/* ── Metrics ─────────────────────────────────────────── */

export interface Counter {
  add(value: number, attrs?: SpanAttributes): void
}

export interface Histogram {
  record(value: number, attrs?: SpanAttributes): void
}

export interface Meter {
  createCounter(name: string, description?: string): Counter
  createHistogram(name: string, description?: string): Histogram
}

/* ── NoOp implementations ────────────────────────────── */

class NoopSpan implements Span {
  setAttribute(): this {
    return this
  }
  setStatus(): this {
    return this
  }
  recordException(): this {
    return this
  }
  end(): void {}
}

const noopSpan = new NoopSpan()

export class NoopTracer implements Tracer {
  startSpan(): Span {
    return noopSpan
  }
  async trace<T>(_name: string, fn: (span: Span) => Promise<T>): Promise<T> {
    return fn(noopSpan)
  }
}

const noopCounter: Counter = { add: () => {} }
const noopHistogram: Histogram = { record: () => {} }

export class NoopMeter implements Meter {
  createCounter(): Counter {
    return noopCounter
  }
  createHistogram(): Histogram {
    return noopHistogram
  }
}

export const noopTracer: Tracer = new NoopTracer()
export const noopMeter: Meter = new NoopMeter()
