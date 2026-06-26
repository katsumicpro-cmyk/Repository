import type { PrefixedId } from '@innovation-os/foundation/ids'
import type { ProcessingStatus } from '@innovation-os/shared/constants'

export type ConceptId = PrefixedId<'conc'>

export type ConceptStatus = ProcessingStatus | 'validated' | 'archived'

export type ConceptProps = {
  readonly id: ConceptId
  readonly name: string
  readonly description: string
  readonly valueProposition: string
  readonly futureIds: readonly string[]
  readonly status: ConceptStatus
  readonly createdAt: string
  readonly updatedAt: string
}
