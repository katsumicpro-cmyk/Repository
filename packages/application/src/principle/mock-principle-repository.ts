import { ok, err } from '@innovation-os/shared/result'
import type { Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import { notFound } from '@innovation-os/shared/errors'
import type { Principle, PrincipleId, PrincipleStatus } from '@innovation-os/knowledge/principle'
import type { InvariantId } from '@innovation-os/knowledge/principle'
import type { PrincipleRepository } from '@innovation-os/knowledge/repository'

export class MockPrincipleRepository implements PrincipleRepository {
  private readonly store = new Map<string, Principle>()

  async save(principle: Principle): Promise<Result<void, AppError>> {
    this.store.set(principle.id, principle)
    return ok(undefined)
  }

  async findById(id: PrincipleId): Promise<Result<Principle, AppError>> {
    const p = this.store.get(id)
    if (!p) return err(notFound('Principle', id))
    return ok(p)
  }

  async findByStatus(status: PrincipleStatus): Promise<Result<readonly Principle[], AppError>> {
    return ok([...this.store.values()].filter((p) => p.status === status))
  }

  async findByDomain(domain: string): Promise<Result<readonly Principle[], AppError>> {
    return ok([...this.store.values()].filter((p) => p.domain === domain))
  }

  async findByInvariantId(invariantId: InvariantId): Promise<Result<readonly Principle[], AppError>> {
    return ok([...this.store.values()].filter((p) => p.sourceInvariantId === invariantId))
  }

  async findAll(): Promise<Result<readonly Principle[], AppError>> {
    return ok([...this.store.values()])
  }
}
