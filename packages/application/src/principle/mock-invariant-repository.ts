import { ok, err } from '@innovation-os/shared/result'
import type { Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import { notFound } from '@innovation-os/shared/errors'
import type { Invariant, InvariantId, InvariantStatus, InvariantType } from '@innovation-os/knowledge/principle'
import type { InvariantRepository } from '@innovation-os/knowledge/repository'

export class MockInvariantRepository implements InvariantRepository {
  private readonly store = new Map<string, Invariant>()

  async save(invariant: Invariant): Promise<Result<void, AppError>> {
    this.store.set(invariant.id, invariant)
    return ok(undefined)
  }

  async findById(id: InvariantId): Promise<Result<Invariant, AppError>> {
    const inv = this.store.get(id)
    if (!inv) return err(notFound('Invariant', id))
    return ok(inv)
  }

  async findByStatus(status: InvariantStatus): Promise<Result<readonly Invariant[], AppError>> {
    return ok([...this.store.values()].filter((i) => i.status === status))
  }

  async findByType(type: InvariantType): Promise<Result<readonly Invariant[], AppError>> {
    return ok([...this.store.values()].filter((i) => i.invariantType === type))
  }

  async findAll(): Promise<Result<readonly Invariant[], AppError>> {
    return ok([...this.store.values()])
  }
}
