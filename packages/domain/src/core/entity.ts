import type { AnyDomainEvent } from './domain-event.js'

export type EntityProps = {
  readonly id: string
  readonly createdAt: string
  readonly updatedAt: string
}

/**
 * Entity — identified by ID, not by value.
 * Equality is solely based on identity.
 */
export abstract class Entity<TProps extends EntityProps> {
  protected constructor(protected readonly props: TProps) {}

  get id(): string {
    return this.props.id
  }
  get createdAt(): string {
    return this.props.createdAt
  }
  get updatedAt(): string {
    return this.props.updatedAt
  }

  equals(other: Entity<TProps>): boolean {
    return this.id === other.id
  }
}

/**
 * AggregateRoot — consistency boundary that owns domain events.
 * Events are collected in-memory and dispatched by the application layer
 * after successful persistence (outbox pattern ready).
 */
export abstract class AggregateRoot<TProps extends EntityProps> extends Entity<TProps> {
  private readonly _events: AnyDomainEvent[] = []

  protected emit(event: AnyDomainEvent): void {
    this._events.push(event)
  }

  get domainEvents(): readonly AnyDomainEvent[] {
    return [...this._events]
  }

  clearEvents(): void {
    this._events.length = 0
  }
}
